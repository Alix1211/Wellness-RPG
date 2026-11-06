#!/usr/bin/env python3
"""Transcribe the approved GAIA v4 handoff verbatim into runtime dialogue data.

Only Markdown headings/scene identifiers are removed; spoken text is never rewritten.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs' / 'gaia' / 'cohab-original'
TARGET = ROOT / 'src' / 'gaia-life' / 'cohab-ending-data.mjs'


def sections(name):
    text = (SOURCE / name).read_text(encoding='utf-8')
    result = {}
    current = None
    for line in text.splitlines():
        if line.startswith('## '):
            current = line[3:].strip()
            result[current] = []
        elif line.startswith('# '):
            current = None
        elif current is not None:
            result[current].append(line)
    return result


def find(sections_, prefix):
    matches = [v for k, v in sections_.items() if k == prefix or k.startswith(prefix+' ')]
    if len(matches) != 1:
        raise ValueError(f'Expected exactly one scene {prefix!r}, got {len(matches)}')
    return matches[0]


def dialogue(raw):
    out = []
    for line in raw:
        line = line.strip()
        if not line or line == '---' or line.startswith('#'):
            continue
        line = re.sub(r'^\*\*[^*]+\*\*\s+', '', line)
        if line.startswith('(') and line.endswith(')'):
            out.append(['', line])
            continue
        if line.startswith('(화면 문구 [임시])'):
            out.append(['', line])
            continue
        match = re.match(r'^([^:]+):\s*(.*)$', line)
        if not match:
            raise ValueError(f'Unrecognized dialogue line: {line!r}')
        out.append([match[1].strip(), match[2]])
    return out


def labelled(raw, label):
    start = None
    for i, line in enumerate(raw):
        if line.strip() == '**'+label+'**':
            start = i+1
            break
    if start is None:
        raise ValueError(f'Missing label {label}')
    end = next((i for i in range(start,len(raw)) if re.match(r'^\*\*[^*]+\*\*$',raw[i].strip())), len(raw))
    return dialogue(raw[start:end])


def labelled_inline(raw, tag):
    indexes = [i for i,line in enumerate(raw) if re.match(r'^\*\*'+re.escape(tag)+r'\*\*\s+',line)]
    if len(indexes)!=1:
        raise ValueError(f'Expected one {tag}, got {len(indexes)}')
    begin=indexes[0]
    end=next((i for i in range(begin+1,len(raw)) if re.match(r'^\*\*D-[^*]+\*\*',raw[i])),len(raw))
    return dialogue(raw[begin:end])


def stage_lines(raw, stage):
    names=['입문','적응','몰입','만개']
    start=next((i for i,l in enumerate(raw) if l.startswith('**'+stage+'** ')),None)
    if start is None:
        raise ValueError(f'No {stage} block')
    stop=next((i for i in range(start+1,len(raw)) if any(raw[i].startswith('**'+x+'** ') for x in names)),len(raw))
    return dialogue(raw[start:stop])


def main():
    scenario = sections('가이아_동거_결혼_엔딩_시나리오.md')
    third = sections('가이아_대사_v4_무삭제_3권.md')
    fourth = sections('가이아_대사_v4_무삭제_4권.md')
    fifth = sections('가이아_대사_v4_무삭제_5권.md')
    data={}
    for key in ['GP-1','GP-2','GP-3','GP-4','ED-1','ED-2']:
        data[key]=dialogue(find(scenario,key))
    for key in ['D1','D3','D4','D5','E12','F1','F2','F3','F4']:
        data[key]=dialogue(find(third,key))
    data['cohabStart']=labelled(find(third,'3인방 동거'),'동거 시작')
    for source,label,key in [
        (third,'동거 일상 · 아침','cohabMorning'),
        (third,'동거 일상 · 저녁','cohabEvening'),
        (third,'집 입구 잠김','homeLocked'),
        (third,'복귀','homeReturn'),
    ]:
        target=find(third,'3인방 동거') if key.startswith('cohab') else None
        if target is None and key in ['homeLocked','homeReturn']:
            # The G chapter has no ## heading, so take the exact range via source text.
            source_text=(SOURCE/'가이아_대사_v4_무삭제_3권.md').read_text()
            chapter=source_text.split('# G. 재교육',1)[1].split('# H. 야간',1)[0].splitlines()
            target=chapter
        data[key]=labelled(target,label)
    for key in ['D-이사1','D-이사2','D-이사3','D-표1','D-표2','D-표3','D-식탁1','D-식탁2','D-식탁3','D-남편1','D-남편2','D-남편3','D-방문1','D-방문2']:
        section=next(v for k,v in fifth.items() if any(key in line for line in v))
        data[key]=labelled_inline(section,key)
    for day in ['아침','저녁','야간 데이트']:
        lines=find(fourth,day)
        if day == '야간 데이트':
            blocks={}
            current='공원'
            for line in lines:
                match=re.match(r'^\*\*(공원|호텔|집 앞 골목)\*\*\s*(.*)',line)
                if match:
                    current=match[1]
                blocks.setdefault(current,[]).append(line)
            for place,raw in blocks.items():
                data['date:'+place]=dialogue(raw)
        else:
            for stage in ['입문','적응','몰입','만개']:
                data['spouse:'+day+':'+stage]=stage_lines(lines,stage)
    proposal_source=(SOURCE/'가이아_동거_결혼_엔딩_시나리오.md').read_text().split('# 3. 후보별 청혼',1)[1].split('# 4. 신혼 첫 아침',1)[0]
    morning_source=(SOURCE/'가이아_동거_결혼_엔딩_시나리오.md').read_text().split('# 4. 신혼 첫 아침',1)[1].split('# 5. 결혼식과 엔딩',1)[0]
    for kind,text in [('P',proposal_source),('H',morning_source)]:
        for match in re.finditer(r'^\*\*('+kind+r'-[^*]+)\*\*\s+',text,re.M):
            next_=re.search(r'^\*\*'+kind+r'-',text[match.end():],re.M)
            end=match.end()+next_.start() if next_ else len(text)
            # The first line contains both the marker and the first spoken line.
            data[match[1]]=dialogue([text[match.start():match.end()]+text[match.end():end].splitlines()[0]]+text[match.end():end].splitlines()[1:])
    # Speaker names are authored in the handoff. IDs intentionally have no spaces.
    expected=['서하준','이안','윤서','도윤','한시우','정민호','오선생','강태오','재현','백도현','차재원','송회장']
    for person in expected:
        for prefix,length in [('P',4),('H',2)]:
            key=prefix+'-'+person
            assert len(data[key])==length,(key,data[key])
    for key in ['GP-1','GP-2','GP-3','GP-4','D1','cohabStart','F3','F4','D5','ED-1','ED-2']:
        assert data[key],key
    # Ensure inline block labels weren't accidentally treated as spoken words.
    for key,lines in data.items():
        assert all(sp!='**' and not text.startswith('**') for sp,text in lines), key
    TARGET.write_text('/* Generated only from docs/gaia/cohab-original; NEVER hand-edit lines. */\nexport const COHAB_DATA='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
    print(f'Generated {len(data)} exact dialogue blocks / {sum(map(len,data.values()))} lines: {TARGET}')


if __name__=='__main__':
    main()
