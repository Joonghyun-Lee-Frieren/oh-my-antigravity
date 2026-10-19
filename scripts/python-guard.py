"""Parse scoped Python without importing it; emit concrete, reviewable diagnostics."""
import ast
import json
import sys
import tokenize

RULES = {"tautological-assert", "swallowed-exception", "synthetic-fallback",
         "cleanup-scope-mutation", "runtime-monkeypatch", "syntax-error"}


def scan(filename):
    with tokenize.open(filename) as source:
        text = source.read()
    try:
        tree = ast.parse(text, filename=filename)
    except SyntaxError as error:
        return [{"file": filename, "line": error.lineno or 1, "rule": "syntax-error", "observed": error.msg}]
    findings = []

    def emit(node, rule, observed):
        findings.append({"file": filename, "line": node.lineno, "rule": rule, "observed": observed})

    imports = set()
    definitions = {node.name for node in ast.walk(tree) if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))}
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.update(alias.asname or alias.name.split('.')[0] for alias in node.names)
        if isinstance(node, ast.ImportFrom):
            imports.update(alias.asname or alias.name for alias in node.names)

    def synthetic(node):
        return isinstance(node, (ast.Constant, ast.Dict, ast.List, ast.Tuple, ast.Set))

    def scope_call(node):
        return isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in {"locals", "globals"}

    def replacement(node):
        return isinstance(node, ast.Lambda) or isinstance(node, ast.Name) and node.id in definitions

    for node in ast.walk(tree):
        if isinstance(node, ast.Assert) and isinstance(node.test, ast.Constant) and bool(node.test.value):
            emit(node, "tautological-assert", "Assertion is an unconditionally truthy constant.")
        if isinstance(node, ast.ExceptHandler):
            if all(isinstance(item, ast.Pass) for item in node.body):
                emit(node, "swallowed-exception", "Exception handler suppresses failure with pass.")
            for item in node.body:
                if isinstance(item, ast.Return) and (item.value is None or synthetic(item.value)):
                    emit(item, "synthetic-fallback", "Exception handler returns a literal fallback instead of propagating the failure.")
        if isinstance(node, (ast.Try, getattr(ast, 'TryStar', ast.Try))):
            for statement in node.finalbody:
                for item in ast.walk(statement):
                    if isinstance(item, ast.Call) and isinstance(item.func, ast.Attribute) and scope_call(item.func.value) and item.func.attr in {"clear", "pop", "popitem", "update", "__setitem__", "__delitem__"}:
                        emit(item, "cleanup-scope-mutation", "Cleanup mutates locals()/globals() through a method call.")
                    if isinstance(item, (ast.Assign, ast.AnnAssign, ast.AugAssign, ast.Delete)):
                        targets = item.targets if isinstance(item, (ast.Assign, ast.Delete)) else [item.target]
                        if any(isinstance(target, ast.Subscript) and scope_call(target.value) for target in targets):
                            emit(item, "cleanup-scope-mutation", "Cleanup rewrites or deletes a locals()/globals() entry.")
        if isinstance(node, (ast.Assign, ast.AnnAssign)) and node.value and replacement(node.value):
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            if any(isinstance(target, ast.Attribute) and isinstance(target.value, ast.Name) and target.value.id in imports for target in targets):
                emit(node, "runtime-monkeypatch", "An imported dependency member is replaced with a local implementation.")
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "setattr" and len(node.args) >= 3:
            if isinstance(node.args[0], ast.Name) and node.args[0].id in imports and replacement(node.args[2]):
                emit(node, "runtime-monkeypatch", "setattr replaces an imported dependency member with a local implementation.")
    return findings


def main():
    policy = json.load(sys.stdin)
    findings = []
    for filename in sys.argv[1:]:
        findings.extend(scan(filename))
    exemptions = policy.get("exemptions", [])
    active, waived = [], []
    for finding in findings:
        matching = next((item for item in exemptions if all(item[key] == finding[key] for key in ("file", "line", "rule"))), None)
        (waived if matching else active).append({**finding, **({"exemption": matching} if matching else {})})
    print(json.dumps({"status": "fail" if active else "pass", "findings": active, "exemptions": waived}, ensure_ascii=True))
    return 1 if active else 0


if __name__ == "__main__":
    sys.exit(main())
