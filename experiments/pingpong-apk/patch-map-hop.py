"""Add the map movement presentation without changing embedded game documents."""
from pathlib import Path
import argparse
p=argparse.ArgumentParser()
p.add_argument('input')
p.add_argument('output')
a=p.parse_args()
s=Path(a.input).read_text()
assert 'const GaiaMapHop=' not in s
at=s.rfind('save();render();')
assert at>=0
code=Path(__file__).with_name('map-hop.js').read_text()
s=s[:at]+code+'\n'+s[at:]
Path(a.output).write_text(s)
print('Added node-by-node map hops, 220ms per node + 120ms landing.')
