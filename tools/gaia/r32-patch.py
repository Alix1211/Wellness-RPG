#!/usr/bin/env python3
"""R32 pilot: room cast for 매점 + 기구방. usage r32-patch.py WORKDIR
 Each room has a fixed person in charge, small standing characters (tap = that person's own big portrait and own lines),
 rough original lines move to a small 'noise from outside the door' caption."""
import sys,json,base64
from pathlib import Path
W=Path(sys.argv[1])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:80],s.count(old));return s.replace(old,new)
A=json.load(open('/home/claude/wellness-rpg/src/center/npc-assets.json'))
spr={i:A[f'npc/trainer/{i}/0'] for i in (0,3,4)}
PEOPLE={ # name: (tracksuit big portrait index 0-7, chibi trainer index)
 '서하준':(4,0),'이안':(7,3),'윤서':(0,4)}
LINES={
 'shop':{'점원':[
  [["점원","어서 오세요. 오늘은 회원 할인 중이에요. 수건 한 장 사시면 비밀 하나를 덤으로 드려요."],["나","비밀이요? 저한테 무슨 비밀이 있다고요."],["점원","어제 3번 방에서 나온 소리, 매점까지 들렸어요. 쿠키는 서비스예요."]],
  [["점원","생수는 천 원, 지난주 일은 공짜예요. 소문은 원래 무료잖아요."],["나","…그 소문, 어디까지 갔어요?"],["점원","1층 로비까지요. 2층에서는 이미 박수 쳤대요."]],
  [["점원","오늘 재고 점검 중이라 구경만 하셔도 돼요. 아, 화장실 훈련방에서 쓰는 물병은 안 팔아요. 회원님들이 너무 열심히 쓰셔서요."],["나","열심히… 쓰는 건 맞죠."]],
  [["점원","계산은 나중에도 돼요. 대신 다음에 오실 때 표정이 지금보다 풀려 있으면 좋겠어요."],["나","표정까지 외상인가요."],["점원","여기선 표정이 제일 비싼 상품이거든요."]]],
  '서하준':[
  [["서하준","오셨네요. 저는 기초방 담당인데, 쉬는 시간엔 여기서 단백질바를 고릅니다."],["나","조교님도 간식 드세요?"],["서하준","저도 사람이라서요. 대신 기준은 제가 먹는 만큼 올라갑니다. 농담이에요, 반쯤."]],
  [["서하준","매점 앞에서 만난 건 우연이니 오늘 평가에는 안 넣겠습니다."],["나","정말요?"],["서하준","네. 대신 계산하실 때 허리 펴세요. 그건 보였습니다."]],
  [["서하준","추천은 초코바요. 우는 회원님이 많아서 이 매점이 먼저 망하진 않습니다."],["나","위로가 이상한데 고맙긴 하네요."]]]},
 'bat':{'이안':[
  [["이안","자세만 맞으면 멀리 갑니다. 오늘은 엉덩이부터 보죠."],["나","시작부터요?"],["이안","스윙은 하체에서 나옵니다. 결과가 이상하게 들려도 제 책임은 아닙니다."]],
  [["이안","어제 기록은 확인했습니다. 헛스윙이 많았는데 표정은 만점이었어요."],["나","표정으로 점수가 나오나요?"],["이안","관중이 있다면요. 지금은 저 혼자라 아쉽네요."]],
  [["이안","공은 보이는 만큼만 치면 됩니다. 눈 감고 치려는 건 신입 때만 허용돼요."],["나","저 신입 맞잖아요."],["이안","그래서 오늘은 봐드렸습니다."]],
  [["이안","그립을 느슨하게 잡으세요. 힘주면 공이 도망갑니다."],["나","도망가는 건 늘 공이네요."],["이안","회원님은 도망 안 가셔서 참 좋습니다."]]]},
 'rope':{'윤서':[
  [["윤서","기구 설명을 시작하겠습니다. 줄 길이는 세 단계이고 각 단계마다 주의사항이 열한 가지입니다."],["나","열한 가지요?"],["윤서","줄여서 말씀드리면, 놓치지 마세요."]],
  [["윤서","이 기구는 제가 직접 닦았습니다. 땀은 원래 위생이 아니라 성의의 문제라서요."],["나","설명이 이상하게 설득력 있네요."]],
  [["윤서","줄이 끊어지면 훈련도 끊기는 겁니다. 은유가 아니라 매뉴얼입니다."],["나","매뉴얼에 그렇게 나와 있어요?"],["윤서","제가 쓴 거라서요."]]]}}
CAST={'shop':{'room':'shop','man':4,'people':[
  {'n':'점원','w':'clerk','sp':None},{'n':'서하준','sp':0}],'lead':'점원'},
 'bat':{'room':'gear','man':7,'people':[{'n':'이안','sp':3}],'lead':'이안'},
 'rope':{'room':'gear','man':0,'people':[{'n':'윤서','sp':4}],'lead':'윤서'}}
code="window.CAST_SPR="+json.dumps({str(k):v for k,v in spr.items()},ensure_ascii=False)+";window.CAST_PEOPLE="+json.dumps(PEOPLE,ensure_ascii=False)+";window.CAST_LINES="+json.dumps(LINES,ensure_ascii=False)+";window.CAST_DEF="+json.dumps(CAST,ensure_ascii=False)+";"
code+=r"""
function castKey(r){if(place()!=='center')return null;if(r.kind==='shop')return 'shop';if(r.kind==='gear'){const g=(typeof games==='function'?games(r):[])||[];return g.includes('batting')?'bat':'rope';}return null;}
function roomCastFor(r){const k=castKey(r);return k?{...CAST_DEF[k],key:k}:null;}
function castManSrc(name){const p=CAST_PEOPLE[name];return p&&window.DIALOGUE_MEN?.tracksuit?.[p[0]]||null;}
function castLinesOf(c,name,seed){const sets=CAST_LINES[c.key][name]||[];const set=sets[Math.abs(seed)%Math.max(1,sets.length)]||[];return set.map(([speaker,text,portrait='shy'])=>({speaker,text,portrait,male:!!CAST_PEOPLE[speaker]}));}
function castSeed(r){return life.day+world.scene.floor+world.scene.room;}
function castNoise(r){const sets=ORIGINAL_DIALOGUE[dialogueKey(r)]||[];const all=[];for(const s of sets)for(const l of s.l)if(/조교/.test(l[0]))all.push(l[1]);return all.length?all[Math.abs(castSeed(r)*7+(life.day||0))%all.length]:'';}
function castRender(r){let row=document.querySelector('#castRow'),nz=document.querySelector('#doorNoise');const rs=$('#roomScene');if(!row){row=document.createElement('div');row.id='castRow';rs.append(row);nz=document.createElement('div');nz.id='doorNoise';rs.append(nz);}row.replaceChildren();const c=roomCastFor(r);if(!c||soloHome()){row.hidden=true;nz.hidden=true;return;}row.hidden=false;for(const p of c.people){if(p.sp==null)continue;const im=document.createElement('img');im.src=CAST_SPR[p.sp];im.alt=p.n;im.title=p.n;im.draggable=false;const b=document.createElement('button');b.type='button';b.className='cast-person';b.append(im);const t=document.createElement('span');t.textContent=p.n;b.append(t);b.onclick=e=>{e.stopPropagation();castTalkTo(r,p.n);};row.append(b);}const n=castNoise(r);nz.hidden=!n;nz.textContent=n?'문 밖에서 들려오는 소리 — “'+n.replace(/\s+/g,' ').slice(0,64)+'”':'';}
function castTalkTo(r,name){const o=roomContext;if(!o||!o.managed||o.phase!=='menu')return;const c=roomCastFor(r);if(!c)return;const L=castLinesOf(c,name,castSeed(r)+(o.castTalks=(o.castTalks||0)+1));if(!L.length)return;const ms=castManSrc(name);if(ms)o.manSrc=ms;currentLines=L;cmTalk(r);}
const CAST_CSS="#castRow{position:absolute;left:50%;bottom:calc(31% + env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;gap:10px;z-index:6;pointer-events:none}#castRow[hidden],#doorNoise[hidden]{display:none!important}.cast-person{pointer-events:auto;background:none;border:0;padding:0;display:flex;flex-direction:column;align-items:center;cursor:pointer;color:#fff;font:600 12px system-ui,sans-serif;text-shadow:0 1px 3px #000}.cast-person img{height:min(22vh,150px);filter:drop-shadow(0 4px 4px #0008)}.cast-person:hover img,.cast-person:focus-visible img{transform:translateY(-4px)}.cast-person span{background:#000a;border-radius:8px;padding:1px 8px;margin-top:2px}#doorNoise{position:absolute;left:50%;top:calc(12% + env(safe-area-inset-top,0px));transform:translateX(-50%);max-width:86%;z-index:6;color:#e9e3d8;background:#0009;border-radius:10px;padding:5px 12px;font:italic 12px/1.4 system-ui,sans-serif;text-align:center;pointer-events:none}#roomScene:not(.cm-menu) #castRow,#roomScene:not(.cm-menu) #doorNoise{display:none}";document.head.append(Object.assign(document.createElement('style'),{textContent:CAST_CSS}));
"""
s=rd('script-16.js')
s=sub(s,"function dialogueMan(r){const A=window.DIALOGUE_MEN;if(!A)return null;",code+"function dialogueMan(r){const A=window.DIALOGUE_MEN;if(!A)return null;{const c0=roomCastFor(r);if(c0&&c0.man!=null&&A.tracksuit?.[c0.man])return A.tracksuit[c0.man];}")
# lines: cast rooms use the person in charge's own lines
s=sub(s,"function originalLinesFor(r){const sets=","function originalLinesFor(r){{const c=roomCastFor(r);if(c){const L=castLinesOf(c,c.lead,castSeed(r));if(L.length)return L;}}const sets=")
# male portrait follows the speaker's own picture
s=sub(s,"else if(line.male&&roomContext?.manSrc)$('#malePortrait').src=roomContext.manSrc;","else if(line.male){const cm=castManSrc(line.speaker);if(cm)roomContext&&(roomContext.manSrc=cm);const src=cm||roomContext?.manSrc;if(src)$('#malePortrait').src=src;}")
# draw row when the room opens and when the menu returns
s=sub(s,"roomContext.manSrc=ms;$('#malePortrait').src=ms;}","roomContext.manSrc=ms;$('#malePortrait').src=ms;}castRender(r);")
wr('script-16.js',s)
print('r32 patched')
