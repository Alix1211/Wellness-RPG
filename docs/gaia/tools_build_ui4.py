import json
A=json.load(open('ui4/assets4.json'))
G=json.load(open('zip2/geo.json'))
# --- bubble CSS ---
sizes={'s':'Pink_Small','m':'Pink_Medium','l':'Pink_Large'}
wl={'s':25,'m':34,'l':44}; wp={'s':54,'m':68,'l':88}
css=[]
css.append("""#roomScene #dialoguePanel{height:auto!important;container-type:inline-size;aspect-ratio:var(--bw)/var(--bh);min-height:0!important;max-height:none!important;background:none!important;padding:0!important;pointer-events:auto}
#roomScene #dialoguePanel .bubble-art{background-size:100% 100%!important}
#roomScene #dialoguePanel .bubble-copy{position:absolute!important;inset:0!important;display:block!important;padding:0!important}
#roomScene #speaker{position:absolute!important;display:flex!important;align-items:center;justify-content:center;margin:0!important;padding:0!important;background:none!important;border:0!important;box-shadow:none!important;white-space:nowrap;font-weight:800!important;line-height:1!important;color:#c4577f!important;overflow:hidden}
#roomScene.male-speaking #speaker{color:#2c8a76!important}
#roomScene #line{position:absolute!important;display:flex!important;flex-direction:column;justify-content:safe center;margin:0!important;overflow:auto;overscroll-behavior:contain;font-size:var(--lf)!important;line-height:1.42!important;color:#644652!important;word-break:keep-all;overflow-wrap:anywhere;scrollbar-width:thin;touch-action:pan-y}
#roomScene.male-speaking #line{color:#315f57!important}
#roomScene #dialoguePanel{--lf:clamp(16px,4.2cqw,22px)}
#roomScene #dialoguePanel.longname #line{justify-content:flex-start!important}
#roomScene #dialoguePanel.longname #speaker{justify-content:flex-start!important;font-size:calc(var(--lf)*.95)!important;overflow:visible}""")
for k,n in sizes.items():
    g=G[n];W,H=g['size'];b=g['body'];p=g['pill']
    pct=lambda v,t:round(v/t*100,3)
    tl=pct(b[0]+30,W);tr=pct(W-b[2]+30,W);tt=pct(p[3]+10,H);tb=pct(H-b[3]+16,H)
    fs=round((p[3]-p[1])/W*100*0.58,2)
    css.append(f"""#roomScene #dialoguePanel[data-bsize={k}]{{--bw:{W};--bh:{H};width:{wl[k]}vw!important}}
@media(orientation:portrait){{#roomScene #dialoguePanel[data-bsize={k}],#roomScene.male-speaking #dialoguePanel[data-bsize={k}]{{width:{wp[k]}%!important}}}}
#roomScene #dialoguePanel[data-bsize={k}] .bubble-art{{background-image:url({A['p'+k]})!important}}
#roomScene.male-speaking #dialoguePanel[data-bsize={k}] .bubble-art{{background-image:url({A['m'+k]})!important}}
#roomScene #dialoguePanel[data-bsize={k}] #speaker{{left:{pct(p[0],W)}%;top:{pct(p[1],H)}%;width:{pct(p[2]-p[0],W)}%;height:{pct(p[3]-p[1],H)}%;font-size:max(10px,{fs}cqw)!important}}
#roomScene #dialoguePanel[data-bsize={k}] #line{{left:{tl}%;right:{tr}%;top:{tt}%;bottom:{tb}%}}
#roomScene #dialoguePanel[data-bsize={k}].longname #speaker{{left:{tl}%;top:{tt}%;width:auto;height:auto;max-width:{round(100-tl-tr,2)}%}}
#roomScene #dialoguePanel[data-bsize={k}].longname #line{{top:calc({tt}% + var(--lf)*1.6)}}""")
# --- portrait fx ---
css.append("""#roomScene .fxg{position:absolute;left:50%;bottom:0;height:100%;width:max-content;translate:-50% 0;transform-origin:center bottom;animation:portraitIdle 4.2s ease-in-out infinite;will-change:transform;display:block}
#roomScene .fxg:has(>.speaking){animation:portraitTalking 2s ease-in-out infinite}
#roomScene .fxg>img:not(.fxi){position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;translate:none!important;scale:none!important;animation:none!important;display:block;height:100%!important;width:auto!important;max-width:none!important}
#roomScene .fxg:has(>#malePortrait){height:80%}
#roomScene .fxg:has(>#femalePortrait){scale:.86}
@media(orientation:portrait){#roomScene .fxg:has(>#malePortrait){width:150%;height:auto;top:10%;bottom:auto}#roomScene .fxg:has(>#malePortrait)>img:not(.fxi){width:100%!important;height:auto!important}}
#roomScene .fxg>.fxw{position:absolute;inset:0;pointer-events:none;filter:drop-shadow(0 3px 6px #50334622);--cx:50%;--cy:41%;--rx:27%;--ry:13%;-webkit-mask-image:radial-gradient(ellipse var(--rx) var(--ry) at var(--cx) var(--cy),#000 42%,transparent 100%);mask-image:radial-gradient(ellipse var(--rx) var(--ry) at var(--cx) var(--cy),#000 42%,transparent 100%)}
#roomScene .fxw[hidden]{display:none}
#roomScene .fxw img{display:block;width:100%;height:100%;max-width:none;transform-origin:var(--cx) var(--cy);animation:ui4Sway 2.7s ease-in-out infinite}
#roomScene .fxg:has(>.speaking) .fxw img{animation-duration:2.1s}
#roomScene .fxw[data-mode=breath]{--cx:50%;--cy:46%;--rx:36%;--ry:26%}
#roomScene .fxw[data-mode=breath] img{animation:ui4Breath 4s ease-in-out infinite}
@keyframes ui4Sway{0%,100%{transform:translate(0,0) scale(1,1) rotate(0)}30%{transform:translate(.8px,3.4px) scale(1.012,1.032) rotate(.55deg)}62%{transform:translate(-.8px,-1.4px) scale(.996,.984) rotate(-.45deg)}}
@keyframes ui4Breath{0%,100%{transform:scale(1,1) translateY(0)}50%{transform:scale(1.012,1.022) translateY(-1.8px)}}""")
# --- title ---
css.append("""#titleScreen{position:fixed;inset:0;z-index:100000;background:#f6c9d6;overflow:hidden;touch-action:manipulation;transition:opacity .5s}
#titleScreen.out{opacity:0;pointer-events:none}
#titleScreen .ts-img{position:absolute;max-width:none;user-select:none;-webkit-user-drag:none}
#titleScreen .ts-fxw{position:absolute;inset:0;pointer-events:none}
#titleScreen .ts-fx{animation:ui4TitleSway 2.9s ease-in-out infinite}
@keyframes ui4TitleSway{0%,100%{transform:translate(0,0) scale(1,1) rotate(0)}30%{transform:translate(1px,4px) scale(1.012,1.036) rotate(.6deg)}62%{transform:translate(-1px,-1.8px) scale(.996,.982) rotate(-.5deg)}}
#titleScreen .ts-logo{position:absolute;left:3vw;top:7vh;width:min(50vw,860px);height:auto;pointer-events:none;filter:drop-shadow(0 8px 10px #8a3a5a55);animation:ui4Float 3.8s ease-in-out infinite}
@keyframes ui4Float{0%,100%{transform:translateY(0) rotate(-1.2deg)}50%{transform:translateY(-14px) rotate(1.2deg)}}
#titleScreen .ts-start{position:absolute;left:calc(3vw + min(50vw,860px)/2);bottom:12vh;translate:-50% 0;width:min(260px,60vw);height:66px;border:0;border-width:0 31px;border-style:solid;border-color:transparent;border-image:url(__PILL__) 0 48 0 48 fill/0 31px 0 31px stretch;background:none;color:#fff;font:800 24px Gaia,system-ui;text-shadow:0 2px 3px #b0386a;letter-spacing:.08em;cursor:pointer;animation:ui4Pulse 1.8s ease-in-out infinite;filter:drop-shadow(0 5px 6px #8a3a5a55)}
@keyframes ui4Pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@media(orientation:portrait){#titleScreen .ts-logo{left:3vw;top:5vh;width:94vw}#titleScreen .ts-start{left:50%;bottom:9vh}}""")
CSS="\n".join(css).replace('__PILL__','"+UI3_ART.pill1+"') if False else "\n".join(css)
js=r"""
const UI4_ART=@@ART@@;
const UI4_CSS=@@CSS@@;
const UI4_GEO=@@GEO@@;
let ui4Cnv=null;
function ui4Bubble(){const p=document.querySelector('#dialoguePanel'),ln=document.querySelector('#line'),sp=document.querySelector('#speaker');if(!p||!ln||!sp||!p.offsetWidth&&!p.dataset.bsize)return;const rs=document.querySelector('#roomScene');if(rs&&rs.hidden)return;
 const name=sp.textContent||'';let chosen='l';
 for(const k of ['s','m','l']){p.dataset.bsize=k;p.classList.remove('longname');const pw=p.getBoundingClientRect().width;if(!pw){chosen=k;break;}const g=UI4_GEO[k];const slotW=pw*(g.pill[2]-g.pill[0])/g.w-10;const fs=parseFloat(getComputedStyle(sp).fontSize)||12;ui4Cnv=ui4Cnv||document.createElement('canvas').getContext('2d');ui4Cnv.font='800 '+fs+'px Gaia,system-ui';const nw=ui4Cnv.measureText(name).width;p.classList.toggle('longname',nw>slotW);
  const ov=ln.style.overflow;ln.style.overflow='hidden';const fit=ln.scrollHeight<=ln.clientHeight+1;ln.style.overflow=ov;chosen=k;if(fit)break;}
 p.dataset.bsize=chosen;}
function ui4FxInit(){for(const id of ['malePortrait','femalePortrait']){const base=document.getElementById(id);if(!base||base.dataset.fx)continue;base.dataset.fx='1';const g=document.createElement('div');g.className='fxg';base.before(g);g.append(base);const w=document.createElement('div');w.className='fxw';w.dataset.mode='sway';const im=document.createElement('img');im.className='fxi';im.alt='';w.append(im);g.append(w);
  const sync=()=>{const src=base.getAttribute('src')||'';if(im.getAttribute('src')!==src){if(src)im.src=src;else im.removeAttribute('src');}w.hidden=!src;const woman=id==='femalePortrait'||base.dataset.woman==='1';w.dataset.mode=woman?'sway':'breath';g.style.scale=base.style.scale||'';const tr=(base.style.translate||'').split(' ');g.style.translate=tr.length>1?'-50% '+tr[1]:'';const op=parseFloat(getComputedStyle(base).opacity);w.style.visibility=op>=.99?'visible':'hidden';};
  new MutationObserver(sync).observe(base,{attributes:true,attributeFilter:['src','class','data-woman','style']});base.addEventListener('load',sync);sync();}}
function ui4Title(){if(document.getElementById('titleScreen'))return;const T=document.createElement('div');T.id='titleScreen';const resume=!!(life&&life.living&&life.living.opening);
 T.innerHTML='<img class="ts-img ts-base" alt=""><div class="ts-fxw"><img class="ts-img ts-fx" alt=""></div><img class="ts-logo" alt="GAIA CITY-LIFE"><button class="ts-start" type="button">'+(resume?'이어하기':'시작하기')+'</button>';
 T.querySelector('.ts-base').src=UI4_ART.hero;T.querySelector('.ts-fx').src=UI4_ART.hero;T.querySelector('.ts-logo').src=UI4_ART.logo;
 const bt=T.querySelector('.ts-start');bt.style.borderImageSource='url('+UI3_ART.pill1+')';
 const fit=()=>{const W=innerWidth,H=innerHeight,s=Math.max(W/1619,H/971),fx=W>H?.5:.8,ox=(W-1619*s)*fx,oy=(H-971*s)*.5;for(const im of T.querySelectorAll('.ts-img')){im.style.width=1619*s+'px';im.style.height=971*s+'px';im.style.left=ox+'px';im.style.top=oy+'px';}
  const cx=ox+1238*s,cy=oy+250*s,fxw=T.querySelector('.ts-fxw'),fi=T.querySelector('.ts-fx');const m='radial-gradient(ellipse '+(115*s)+'px '+(78*s)+'px at '+cx+'px '+cy+'px,#000 40%,transparent 100%)';fxw.style.webkitMaskImage=m;fxw.style.maskImage=m;fi.style.transformOrigin=(1238*s)+'px '+(250*s)+'px';};
 fit();addEventListener('resize',fit);window.__ui4Title=true;document.body.append(T);
 const go=e=>{window.__ui4Title=false;const f0=window.__ui4Start;window.__ui4Start=null;if(f0)setTimeout(f0,0);if(e&&e.preventDefault)e.preventDefault();removeEventListener('resize',fit);removeEventListener('keydown',key,true);T.classList.add('out');setTimeout(()=>T.remove(),600);};
 const key=e=>{e.stopPropagation();e.preventDefault();if(e.key==='Enter'||e.key===' ')go();};
 addEventListener('keydown',key,true);bt.addEventListener('click',go);}
function ui4Defer(fn){if(window.__ui4Title&&document.getElementById('titleScreen'))window.__ui4Start=fn;else fn();}
function ui4Setup(){document.head.append(Object.assign(document.createElement('style'),{id:'ui4Style',textContent:UI4_CSS}));ui4FxInit();
 const run=()=>requestAnimationFrame(ui4Bubble);const ln=document.querySelector('#line'),sp=document.querySelector('#speaker'),rs=document.querySelector('#roomScene');
 for(const e of [ln,sp])if(e)new MutationObserver(run).observe(e,{childList:true,characterData:true,subtree:true});if(rs)new MutationObserver(run).observe(rs,{attributes:true,attributeFilter:['hidden','class','style']});addEventListener('resize',run);
 ui4Title();}
"""
js=js.replace("@@ART@@",json.dumps({k:A[k] for k in ("hero","logo")},ensure_ascii=False)).replace("@@CSS@@",json.dumps(CSS,ensure_ascii=False)).replace("@@GEO@@",json.dumps({k:{"w":G[n]["size"][0],"h":G[n]["size"][1],"pill":G[n]["pill"]} for k,n in sizes.items()}))
mjs=open('fix_ui3.mjs',encoding='utf8').read()
i0=mjs.index('const CHANGES=')+len('const CHANGES=')
arr,e=json.JSONDecoder().raw_decode(mjs[i0:])
arr=[a for a in arr if not a.get('_ui4')]
arr+=[
 {"script":16,"before":"const UI3_DOORS={};","after":"const UI3_DOORS={};\n"+js,"count":1,"_ui4":1},
 {"script":16,"before":"function update(dt){if(!window.__v4){","after":"function update(dt){if(window.__ui4Title)return;if(!window.__v4){","count":1,"_ui4":1},
 {"script":16,"before":"if(!life.living.opening)opening();else if(life.location","after":"if(!life.living.opening)ui4Defer(opening);else if(life.location","count":1,"_ui4":1},
 {"script":16,"before":"ui3Install();loaded=true;","after":"ui3Install();ui4Setup();loaded=true;","count":1,"_ui4":1},
 {"script":16,"before":"window.DialoguePresentation?.update(other);lineTime=0;}","after":"window.DialoguePresentation?.update(other);$('#malePortrait').dataset.woman=wimg?'1':'';lineTime=0;}","count":1,"_ui4":1},
]
open('fix_ui4.mjs','w',encoding='utf8').write(mjs[:i0]+json.dumps(arr,ensure_ascii=False)+mjs[i0+e:])
print(len(arr),len(js))
