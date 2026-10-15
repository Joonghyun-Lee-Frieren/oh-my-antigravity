from pathlib import Path
import base64, hashlib, json, lzma, sys

source = Path(__file__).resolve().parent
root = Path(sys.argv[1]).resolve()
encoded = ''.join(p.read_text(encoding='ascii') for p in sorted(source.glob('part-*.b64')))
raw = lzma.decompress(base64.b64decode(encoded, validate=True))
assert hashlib.sha256(raw).hexdigest() == '9793df1cf06c649e88294e8700a9ff36f75d7032832dc83c8848ce8ed0d7252d', 'Payload checksum mismatch'
updates = []
for name, item in json.loads(raw).items():
    rel = Path(name)
    assert not rel.is_absolute() and '..' not in rel.parts and '.git' not in rel.parts, name
    target = root / rel
    assert target.resolve().is_relative_to(root), name
    old = target.read_bytes() if target.exists() else b''
    assert hashlib.sha256(old).hexdigest() == item['base'], 'Baseline changed: ' + name
    text = old.decode('utf-8')
    new = ''.join(text[c[0]:c[0]+c[1]] if isinstance(c, list) else c for c in item['chunks']).encode('utf-8')
    assert hashlib.sha256(new).hexdigest() == item['final'], 'Reconstruction failed: ' + name
    updates.append((target, new))
for target, new in updates:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(new)
print(f'Applied {len(updates)} verified file updates')
