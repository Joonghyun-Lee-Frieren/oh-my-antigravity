import fs from "node:fs";
// Gemini's extensionPath placeholder is not part of the native hook contract.
// Resolve verified staged roots or an explicit operator path, without using input as shell code.
export function command(event) {
  const js = `const fs=require('node:fs'),p=require('node:path'),os=require('node:os'),u=require('node:url');let b='',n=0;process.stdin.setEncoding('utf8');process.stdin.on('data',c=>{n+=Buffer.byteLength(c);if(n<=2097152)b+=c});process.stdin.on('end',async()=>{let out={};try{const i=n<=2097152?JSON.parse(b.replace(/^\\uFEFF/,'')):{};if(!i||typeof i!=='object'||Array.isArray(i))throw 0;const h=os.homedir(),name='oh-my-antigravity',roots=[process.env.OMG_PLUGIN_ROOT,process.cwd(),p.join(h,'.gemini','antigravity-cli','plugins',name),p.join(h,'.gemini','config','plugins',name),...(Array.isArray(i.workspacePaths)?i.workspacePaths.filter(w=>typeof w==='string'):[]).flatMap(w=>[p.join(w,'.agents','plugins',name),p.join(w,'_agents','plugins',name)])];for(const r of roots){if(!r)continue;try{if(JSON.parse(fs.readFileSync(p.join(r,'plugin.json'),'utf8')).name!==name)continue}catch{continue}out=(await import(u.pathToFileURL(p.join(r,'hooks','lib','lifecycle.mjs')).href)).handleNative(i,'${event}');break}}catch{}process.stdout.write(JSON.stringify(out))});`;
  return `node -e "${js.replaceAll('"', '\\"')}"`;
}
const hook = (event) => ({ type: "command", command: command(event), timeout: 5 });
const output = JSON.stringify({ "oma-tool-cycle": {
  PreInvocation: [hook("PreInvocation")],
  PostToolUse: [{ matcher: "*", hooks: [hook("PostToolUse")] }],
  Stop: [hook("Stop")],
} }, null, 2) + "\n";
const file = new URL("../hooks.json", import.meta.url);
if (process.argv.includes("--check")) {
  if (fs.readFileSync(file, "utf8") !== output) throw new Error("Run npm run build:hooks to refresh hooks.json");
} else fs.writeFileSync(file, output);
