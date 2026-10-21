import re,json
D='/home/claude/wellness-rpg/docs/gaia/'
DLG=re.compile(r'^(?:\*\*([^*]+)\*\*\s*)?([^:：\n*]{1,14}?):\s*(.+)$')
def parse_blocks(text,hdr):
    out={};cur=None;sec=None
    for ln in text.split('\n'):
        m=re.match(hdr,ln)
        if m:
            cur={'id':'Q%02d'%int(m.group(1)),'title':m.group(2).strip(),'meta':'','req':[],'mid':[],'nudge':[],'done':[]};out[cur['id']]=cur;sec=None;continue
        if cur is None:continue
        if ln.startswith('#') or ln.startswith('---'):
            if not re.match(hdr,ln):cur=None
            continue
        mm=re.match(r'^조건:(.*)$',ln)
        if mm:cur['meta']=ln;continue
        mk=re.match(r'^\*\*(의뢰|재촉|진행[^*]*|완료)\*\*',ln)
        if mk:
            k=mk.group(1);sec='req' if k=='의뢰' else 'nudge' if k=='재촉' else 'done' if k=='완료' else 'mid'
        if sec is None:continue
        m2=DLG.match(ln.strip())
        if m2:cur[sec].append([m2.group(2).strip(),m2.group(3).strip()])
    return out
def load():
    a=open(D+'ROOM_DIALOGUE_v3.md',encoding='utf8').read()
    a=a[a.index('# 퀘스트 15종'):a.index('# 방마다 정해진 조연')]
    q=parse_blocks(a,r'^## Q(\d+) ([^(\n]+)')
    b=open(D+'QUESTS_DRAFT_1.md',encoding='utf8').read()
    b=b[b.index('# 2. 새 퀘스트'):b.index('# 3. 연속 퀘스트')]
    q.update(parse_blocks(b,r'^### Q(\d+) ([^(\n]+)'))
    return q
if __name__=='__main__':
    q=load();print(len(q))
    for k,v in q.items():print(k,v['title'],len(v['req']),len(v['mid']),len(v['nudge']),len(v['done']),'|',v['meta'][:70])
    print(json.dumps(q['Q17'],ensure_ascii=False)[:600]);print(json.dumps(q['Q01'],ensure_ascii=False)[:600])
