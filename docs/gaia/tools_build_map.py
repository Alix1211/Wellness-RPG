import json,sys
SC='/tmp/claude-0/-home-claude/5e1cc2b5-7932-510e-9fbb-5c03e5355332/scratchpad/'
src=open(SC+'citytravel.js').read()
i=src.index('function start(id){');j=src.index('return true;}',i)+len('return true;}')
OLD_START=src[i:j]
NEW_START="function start(id){if(!active||state!=='map'||id===origin)return false;const d=getDest(id);const allowed=d.id==='family'&&host.life.active==='V01'?{ok:true}:host.accessDestination(d.id);if(!allowed.ok)return false;route={id:crypto.randomUUID(),from:origin,to:d.id,duration:0,length:0,distance:0,speed:0,elapsed:0,pickups:0,collisions:0,cleared:0,tier:0,invincible:0,stumble:0,events:[]};hooks.streetOutfit();origin=d.id;active=false;state='idle';held=false;applyUI();remember();hooks.arrive(d,route);return true;}"
B64=open(SC+'citymap.b64').read()
SPOTS=json.load(open(SC+'map_spots.json'))
SPR=json.load(open(SC+'map_spr.json'))
MAPJS=r'''function mapButtons(){return mapView();}
const MAP_IMG='data:image/jpeg;base64,@@B64@@',MAP_W=1620,MAP_H=971,MAP_SPOTS=@@SPOTS@@,MAP_SPR=@@SPR@@,MAP_CHIPS=@@CHIPS@@;let mapEl=null;
function mapFit(){if(!mapEl)return;const hold=mapEl.querySelector('.cm-hold'),st=hold.firstChild,w0=hold.clientWidth,h0=hold.clientHeight;if(!w0||!h0)return;const port=innerHeight>innerWidth;let w=w0,h=w*MAP_H/MAP_W;if(port?h>h0:h<h0){h=h0;w=h*MAP_W/MAP_H;}st.style.width=w+'px';st.style.height=h+'px';st.style.fontSize=Math.max(10,w/MAP_W*21)+'px';}
function mapView(){
 if(!mapEl){const css=document.createElement('style');css.textContent=`
#cityMapView{position:absolute;inset:0;pointer-events:auto;overflow:hidden;background:#8fbf7a}
#cityMapView[hidden]{display:none}
#cityMapView .cm-bg{position:absolute;inset:-24px;background:var(--cm-img) center/cover;filter:blur(14px) brightness(.9)}
#cityMapView .cm-hold{position:absolute;left:0;right:0;top:0;bottom:0;display:flex;align-items:center;justify-content:center}
#cityMapView .cm-stage{position:relative;flex:none}
#cityMapView .cm-stage>img{position:absolute;inset:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none;border-radius:12px;box-shadow:0 6px 22px #3a284655}
#cityMapView .cm-spot{position:absolute;border:0;padding:0;background:transparent;border-radius:16px;cursor:pointer;font:inherit;color:#775064;pointer-events:auto;-webkit-tap-highlight-color:transparent}
#cityMapView .cm-chip{position:absolute;left:50%;top:100%;transform:translate(-50%,-62%);white-space:nowrap;display:flex;flex-direction:column;align-items:center;padding:.18em .8em .22em;border-radius:999px;background:#fff7fb;border:2px solid #f3b9d0;box-shadow:0 2px 6px #5a3a4a45;font-weight:700;font-size:1em;line-height:1.18;pointer-events:none}
#cityMapView .cm-chip small{font-size:.76em;font-weight:600;color:#a17b90}
#cityMapView .cm-spot.current .cm-chip{background:#ffe0ee;border-color:#ee7aa9}
#cityMapView .cm-spot:hover:not(:disabled) .cm-chip,#cityMapView .cm-spot:focus-visible .cm-chip{background:#ffe0ee;border-color:#ee7aa9;transform:translate(-50%,-62%) scale(1.07)}
#cityMapView .cm-spot:focus{outline:0}
#cityMapView .cm-bld{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;transform-origin:50% 96%;-webkit-user-drag:none}
#cityMapView .cm-spot.goal .cm-bld{animation:cmWob 1.7s ease-in-out infinite;filter:drop-shadow(0 0 5px #ffc2dc) drop-shadow(0 0 14px #ff8fbb99)}
#cityMapView .cm-spot:hover:not(:disabled) .cm-bld{animation:cmWob 1.1s ease-in-out infinite}
@keyframes cmWob{0%,100%{transform:none}20%{transform:rotate(-1deg) scale(1.012,.99)}45%{transform:rotate(.8deg) scale(.992,1.022) translateY(-1.5%)}70%{transform:rotate(-.5deg) scale(1.006,.996)}}
#cityMapView .cm-spot.nospr::after{content:'';position:absolute;inset:-6%;border-radius:50%;background:radial-gradient(closest-side,#ffffff55,#ffb6d366 62%,transparent);opacity:0;pointer-events:none;transition:opacity .2s}
#cityMapView .cm-spot.nospr:hover::after{opacity:.8}
#cityMapView .cm-spot.nospr.goal::after{animation:cmGlow 1.5s ease-in-out infinite}
@keyframes cmGlow{0%,100%{opacity:.25}50%{opacity:.95}}
#cityMapView .cm-spot.goal .cm-chip{border-color:#ff4f93;animation:cmPulse 1.2s ease-in-out infinite}
@keyframes cmPulse{50%{box-shadow:0 0 0 6px #ff8fbb66,0 2px 6px #5a3a4a45}}
#cityMapView .cm-spot:disabled{cursor:not-allowed;opacity:1;filter:none}
#cityMapView .cm-spot:disabled .cm-bld{filter:grayscale(.65) brightness(.8)}
#cityMapView .cm-spot:disabled .cm-chip{background:#d9d4dc;border-color:#b7b0bb;color:#857f8a}
#cityMapView .cm-spot:disabled .cm-chip small{color:#8d8791}
body.city-road #action,body.city-road #jump{display:none!important}
body.city-road #heroHUD,body.city-road #wallet,body.city-road #menu,body.city-road #location{z-index:5}
body.city-road #cityRouteHead{top:auto;bottom:14px;left:calc(50% - 112px);right:auto;transform:none;width:auto;flex-wrap:nowrap}
body.city-road #cityRouteStatus{display:none}
body.city-road #cityReturn{top:auto;bottom:14px;right:auto;left:calc(50% + 8px)}
body.city-road #storyPeek{top:auto;bottom:14px;left:14px;max-width:200px}
@media (orientation:portrait){body.city-road #cityRouteHead{top:92px;bottom:auto;left:50%;transform:translateX(-50%)}body.city-road #cityReturn{top:92px;bottom:auto;left:auto;right:12px}body.city-road #storyPeek{top:94px;bottom:auto;left:12px;max-width:150px}#cityMapView .cm-hold{top:136px}}`;document.head.append(css);
  mapEl=document.createElement('div');mapEl.id='cityMapView';mapEl.style.setProperty('--cm-img','url('+MAP_IMG+')');
  const bg=document.createElement('div'),hold=document.createElement('div'),st0=document.createElement('div'),img=new Image();bg.className='cm-bg';hold.className='cm-hold';st0.className='cm-stage';img.src=MAP_IMG;img.alt='';img.draggable=false;st0.append(img);hold.append(st0);mapEl.append(bg,hold);ui.prepend(mapEl);addEventListener('resize',mapFit);}
 const st=mapEl.querySelector('.cm-stage');st.querySelectorAll('.cm-spot').forEach(e=>e.remove());
 for(const d of destinations){const box=MAP_SPOTS[d.id];if(!box)continue;const chip=MAP_CHIPS[d.id];
  const b=document.createElement('button');b.type='button';b.className='cm-spot'+(chip&&chip.only?' chiponly':'')+(MAP_SPR[d.id]?'':' nospr');if(MAP_SPR[d.id]){const si=new Image();si.src='data:image/webp;base64,'+MAP_SPR[d.id];si.className='cm-bld';si.alt='';si.draggable=false;b.append(si);}b.dataset.destination=d.id;
  const pct=(v,n)=>(v/n*100)+'%';b.style.left=pct(box[0],MAP_W);b.style.top=pct(box[1],MAP_H);b.style.width=pct(box[2]-box[0],MAP_W);b.style.height=pct(box[3]-box[1],MAP_H);
  const c=document.createElement('span');c.className='cm-chip';if(chip&&chip.at){c.style.left=pct(chip.at[0]-box[0],box[2]-box[0]);c.style.top=pct(chip.at[1]-box[1],box[3]-box[1]);c.style.transform='translate(-50%,-50%)';}
  const nm=document.createElement('span');nm.textContent=d.name;const sub=document.createElement('small');sub.textContent=d.id===origin?'현재 위치':'';c.append(nm,sub);b.append(c);
  b.setAttribute('aria-label',d.name+(d.id===origin?' · 현재 위치':''));b.classList.toggle('current',d.id===origin);
  const permission=d.id==='family'&&host.life.active==='V01'?{ok:true}:GaiaLife.access(host.life,d.id);b.disabled=!permission.ok;b.title=permission.why||'';
  if(!permission.ok){sub.textContent=d.id==='family'?(host.life.living.married?'재훈련 후 귀가':'결혼 / 방문 의뢰'):'재훈련 후 출근';b.classList.add('locked');}
  if(!sub.textContent)sub.hidden=true;
  b.onclick=()=>d.id===origin?leaveMap():start(d.id);b.classList.toggle('goal',host.flowGoal().destination===d.id);st.append(b);}
 mapEl.hidden=false;mapFit();
}
function mapButtonsOld(){rail.replaceChildren();'''
chips={}
for k,v in json.load(open(SC+'map_chips.json')).items(): chips[k]=v
MAPJS=MAPJS.replace('@@B64@@',B64).replace('@@SPOTS@@',json.dumps(SPOTS)).replace('@@SPR@@',json.dumps(SPR)).replace('@@CHIPS@@',json.dumps(chips,ensure_ascii=False))
mjs=sys.argv[1];t=open(mjs,encoding='utf8').read()
i0=t.index('const CHANGES=')+len('const CHANGES=')
arr,e=json.JSONDecoder().raw_decode(t[i0:])
arr=[c for c in arr if not c.get('_map')]
for b,a in [(OLD_START,NEW_START),('function mapButtons(){rail.replaceChildren();',MAPJS),("rail.hidden=state!=='map';","rail.hidden=true;")]:
    arr.append({'script':13,'before':b,'after':a,'count':1,'_map':1})
open(sys.argv[2],'w',encoding='utf8').write(t[:i0]+json.dumps(arr,ensure_ascii=False)+t[i0+e:])
print('changes',len(arr))
