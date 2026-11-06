#!/usr/bin/env python3
"""Build a small, exact delta from the user-supplied QUEST-RHYTHM HTML.

Run with the original verified R60 controls HTML and the provided rhythm HTML.
The output is a portable source delta; no dialogue or embedded art is rewritten.
"""
import difflib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/gaia-life/quest-rhythm-data.mjs'
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


def difference(before, after):
    left = next((i for i, (a, b) in enumerate(zip(before, after)) if a != b), min(len(before), len(after)))
    tail = 0
    while (tail < len(before)-left and tail < len(after)-left
           and before[-tail-1] == after[-tail-1]):
        tail += 1
    return before[left:len(before)-tail], after[left:len(after)-tail]


def anchored_delta(before, after):
    change=difference(before, after)
    left=0
    while left<min(len(before),len(after)) and before[left]==after[left]:
        left+=1
    end=left+len(change[0])
    for n in (24,60,120,250,500):
        prefix=before[max(0,left-n):left]
        suffix=before[end:end+n]
        old=prefix+change[0]+suffix
        new=prefix+change[1]+suffix
        if old and before.count(old)==1 and before.replace(old,new)==after:
            return old,new
    raise ValueError('Cannot make unique delta')


def main(base_file, source_file):
    base, old_wrappers = parts(Path(base_file).read_text(encoding='utf-8'))
    source, new_wrappers = parts(Path(source_file).read_text(encoding='utf-8'))
    assert len(base) == 23 and len(source) == 24, (len(base), len(source))
    # One extra script immediately before the original player-host script.
    assert base[0:2] == source[0:2]
    assert base[3:16] == source[3:16]
    assert base[18:] == source[19:]
    assert old_wrappers[1:17] == new_wrappers[1:17]
    assert old_wrappers[17:] == new_wrappers[18:]
    assert new_wrappers[17] == '</script>\n<script>'
    head = anchored_delta(old_wrappers[0], new_wrappers[0])
    suite = anchored_delta(base[2], source[2])
    dialogue = anchored_delta(base[17], source[18])
    changes = []
    a, b = base[16].splitlines(keepends=True), source[17].splitlines(keepends=True)
    for op, i, j, k, l in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes():
        if op == 'equal':
            continue
        before, after = ''.join(a[i:j]), ''.join(b[k:l])
        assert before and base[16].count(before) == 1, (op, i, j)
        changes.append([before, after])
    assert head[0] and old_wrappers[0].count(head[0]) == 1
    assert suite[0] and base[2].count(suite[0]) == 1
    assert dialogue[0] and base[17].count(dialogue[0]) == 1
    assert base[17].replace(*dialogue) == source[18]
    trial = base[16]
    for before, after in changes:
        assert trial.count(before) == 1
        trial = trial.replace(before, after)
    assert trial == source[17]
    data = {'head':head,'suite':suite,'host':changes,'extra':source[16],'dialogue':dialogue}
    OUT.write_text('/* Verbatim mechanical delta from the user-supplied QUEST-RHYTHM HTML. */\nexport const QUEST_RHYTHM_DELTA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print(f'{len(changes)} host changes; exact quest script {len(source[16])} chars; output {OUT.stat().st_size} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit('Usage: build_quest_rhythm_data.py BASE_R60_CONTROLS.html QUEST_RHYTHM.html')
    main(*sys.argv[1:])
