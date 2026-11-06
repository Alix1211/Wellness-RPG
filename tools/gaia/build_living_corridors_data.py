#!/usr/bin/env python3
"""Extract only the exact user-supplied LIVING-CORRIDORS additions.

The supplied QUEST-RHYTHM game remains the comparison baseline; none of its
original dialogue, assets, or minigames is regenerated.
"""
import difflib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/gaia-life/living-corridors-data.mjs'
SCRIPT = re.compile(r'<script([^>]*)>([\s\S]*?)</script\s*>')


def parts(html):
    matches = list(SCRIPT.finditer(html))
    blocks = [m[2] for m in matches]
    wrappers = []
    last = 0
    for m in matches:
        wrappers.append(html[last:m.start(2)])
        last = m.end(2)
    wrappers.append(html[last:])
    return blocks, wrappers


def main(quest_file, living_file):
    old, old_wrappers = parts(Path(quest_file).read_text(encoding='utf-8'))
    new, new_wrappers = parts(Path(living_file).read_text(encoding='utf-8'))
    assert len(old) == 24 and len(new) == 25
    assert old[:17] == new[:17]
    assert old[18:] == new[19:]
    assert old_wrappers[:18] == new_wrappers[:18]
    assert old_wrappers[18:] == new_wrappers[19:]
    assert new_wrappers[18] == '</script>\n<script>'

    changes = []
    before, after = old[17].splitlines(keepends=True), new[18].splitlines(keepends=True)
    for op, i, j, k, l in difflib.SequenceMatcher(a=before, b=after, autojunk=False).get_opcodes():
        if op == 'equal':
            continue
        source, replacement = ''.join(before[i:j]), ''.join(after[k:l])
        assert source and old[17].count(source) == 1, (op, i, j)
        changes.append([source, replacement])

    check = old[17]
    for source, replacement in changes:
        assert check.count(source) == 1
        check = check.replace(source, replacement)
    assert check == new[18]

    data = {'extra': new[17], 'host': changes}
    OUT.write_text(
        '/* Mechanical, verbatim delta from the user-supplied LIVING-CORRIDORS HTML. */\n'
        'export const LIVING_CORRIDORS_DELTA='
        + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n',
        encoding='utf-8')
    print(f'{len(changes)} host edits, exact corridor script {len(new[17])} chars')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit('Usage: build_living_corridors_data.py QUEST-RHYTHM.html LIVING-CORRIDORS.html')
    main(*sys.argv[1:])
