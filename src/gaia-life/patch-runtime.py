"""R3 fixes; apply once to the SHA-pinned R2 self-contained HTML, no asset rewrite."""
from pathlib import Path
import re,json,hashlib,shutil
ROOT=Path(__file__).resolve().parent
baseline=ROOT/'runtime-baseline-r2.html'
if not baseline.exists(): shutil.copyfile(ROOT/'GAIA-LIFE-20261020.html',baseline)
assert hashlib.sha256(baseline.read_bytes()).hexdigest()=='a79f04b4707ccaecdb23cf34593d88a15d7534a72e4d3927a530c9e1087142b0'
html=baseline.read_text();matches=list(re.finditer(r'<script[^>]*>([\s\S]*?)</script\s*>',html));parts=[m[1] for m in matches]
def locate(needle):return next(i for i,s in enumerate(parts) if needle in s)
def change_value(source,name,fn):
 m=re.search(r'(?:const |window\.)'+name+r'\s*=\s*',source);assert m,name
 value,end=json.JSONDecoder().raw_decode(source[m.end():]);value=fn(value)
 return source[:m.end()]+json.dumps(value,ensure_ascii=False).replace('<','\\u003c')+source[m.end()+end:]
def replace(s,old,new):
 assert old in s,old[:120]
 return s.replace(old,new)
audio_i=locate('window.GAIA_SOUND_SOURCES=');sound=parts[audio_i]
engine=sound[sound.index("(()=>{'use strict';",sound.index('/* GAIA audio fix')):]
engine=replace(engine,"const sources=window.GAIA_SOUND_SOURCES;","const sources=window.GAIA_SOUND_SOURCES;")
# Native games own their mixer, so touch activation and playback happen in one document.
start=engine.index("  addEventListener('message',e=>{");end=engine.index("  window.GaiaAudioStatus=",start)
engine=engine[:start]+"  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset()});\n  addEventListener('pagehide',reset);\n"+engine[end:]
engine=replace(engine,'sources:Object.keys(sources),unlock,reset,','sources:Object.keys(sources),unlock,reset,event:onGame,')
engine=replace(engine,"if(event==='bridge-ready')return;unlock();", "if(event==='bridge-ready')return;if(window.LifeMini?.sound.enabled===false&&event!=='bed-stop'&&event!=='voices-stop')return;unlock();")
engine=replace(engine,"const task=fetch(sources[name]).then(r=>{if(!r.ok)throw Error('fetch '+r.status);return r.arrayBuffer()})\n        .then(a=>ctx.decodeAudioData(a))", "const task=Promise.resolve().then(()=>{const raw=atob(sources[name].split(',')[1]);return Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer;}).then(a=>ctx.decodeAudioData(a))")
# Only count playback after decode AND a running context; start is resumed by the native start/touch gesture.
engine=replace(engine,"if(!buffer||!ctx||requestEpoch!==epoch||document.hidden)return null;", "if(!buffer||!ctx||requestEpoch!==epoch||document.hidden)return null;")
(ROOT/'native-audio-runtime.js').write_text(engine)
sound=change_value(sound,'GAIA_GAME_BRIDGE',lambda b:replace(b,"const emit=(event,extra={})=>{try{parent.postMessage", "const emit=(event,extra={})=>{if(window.GaiaAudioStatus?.event){GaiaAudioStatus.event(event,kind,extra.actor,extra.name,extra.mood,extra.force);return;}try{parent.postMessage"))
sound=replace(sound,"const d=e.data;onGame(d.event,d.kind,d.actor,d.name,d.mood,d.force);", "const d=e.data;if(['water','rope','cylinder'].includes(d.kind))return;onGame(d.event,d.kind,d.actor,d.name,d.mood,d.force);")
sound=replace(sound,"if(miniFrame)miniFrame.addEventListener('load',()=>{const m=miniFrame.contentWindow?.LifeMini;if(m?.started&&!m.paused&&m.sound?.enabled)onGame('bed-start',m.kind??'cylinder');});", "// Native games own their mixer. Do not inspect srcdoc globals from the parent load handler.")
sound+='\nwindow.GAIA_NATIVE_AUDIO='+json.dumps(engine).replace('<','\\u003c')+';\n'
parts[audio_i]=sound
# Native start remains until a deliberate click; hiding an auto-start overlay is not a start screen.
style_i=locate('const GAME_STUDIO=')
def studio(v):
 v=replace(v,"if(cfg.autoStart&&window.LifeMini&&!LifeMini.started&&!LifeMini.penalty){LifeMini.begin();apply(layout);}", "")
 v=replace(v,"document.body.append(d);};document.body.append(menu);", "if(window.LifeMini){const b=document.createElement('button');const label=()=>b.textContent=LifeMini.sound.enabled?'소리 켬':'소리 끔';label();b.onclick=()=>{document.querySelector('#sound').click();if(LifeMini.sound.enabled)window.GaiaAudioStatus?.unlock();else window.GaiaAudioStatus?.reset();label();};d.append(b);}document.body.append(d);};document.body.append(menu);")
 v=v.replace('document.body.append(d);};document.body.append(menu);', "(document.querySelector('#mgDialog')||document.body).append(d);};(document.querySelector('#mgDialog')||document.body).append(menu);")
 return v
parts[style_i]=change_value(parts[style_i],'GAME_STUDIO',studio)
# All skin/config/audio is installed in the child head, before its first paint.
host_i=locate('function injectGame(doc,config)');host=parts[host_i]
host=replace(host,"function injectGame(doc,config){const code='<script>window.GAME_SCENE='", "function injectGame(doc,config){const code='<script>window.GAME_SCENE='")
a=host.index('function injectGame(doc,config)');b=host.index('\n',a);line=host[a:b]
old="const code='<script>window.GAME_SCENE='+JSON.stringify(config).replace(/</g,'\\\\u003c')+';<'+ '/script><style>'+GAME_SKIN+'</style><script>'+GAME_STUDIO.replace(/<\\/script/gi,'<\\\\/script')+'<'+ '/script>'+nightBridge(config);"
new="""const native=['water','rope','cylinder'].includes(config.kind);const audioKeys=config.kind==='water'?['reaction_effort','reaction_pant','reaction_sigh','reaction_whine','reaction_happy']:['rope_bed','cylinder120_bed','cylinder150_bed','hit_slap','hit_punch','reaction_sigh','reaction_happy','reaction_cry','reaction_whine','reaction_effort','reaction_surprise','reaction_displeased'];const sources=Object.fromEntries(audioKeys.filter(k=>window.GAIA_SOUND_SOURCES?.[k]).map(k=>[k,window.GAIA_SOUND_SOURCES[k]]));const boot='<script>window.GAME_SCENE='+JSON.stringify(config).replace(/</g,'\\\\u003c')+';'+(native?'window.GAIA_SOUND_SOURCES='+JSON.stringify(sources)+';'+window.GAIA_NATIVE_AUDIO:'')+'<'+ '/script><style>'+GAME_SKIN+'</style>';doc=doc.replace('<meta',boot+'<meta');const code='<script>'+GAME_STUDIO.replace(/<\\/script/gi,'<\\\\/script')+'<'+ '/script>'+nightBridge(config);"""
line=replace(line,old,new);host=host[:a]+line+host[b:]
# Return only after explicit acknowledgement. Result data is committed once at finish.
host=replace(host,"const ending=session?.id;setTimeout(()=>{if(mode==='game'&&session?.id===ending)endGame();},220);", "")
host=replace(host,"if(d?.type==='city-route-result')CityTravel.settle(d);", "if(d?.type==='city-route-result'){if(!CityTravel.encounter.result)CityTravel.encounter.result=d;}")
host=replace(host,"else if(d?.type==='wellness-close')CityTravel.cancelEncounter();", "else if(d?.type==='wellness-close'){if(CityTravel.encounter.result)CityTravel.settle(CityTravel.encounter.result);else CityTravel.cancelEncounter();}")
host=replace(host,"if(CityTravel.encounter){CityTravel.cancelEncounter();return;}", "if(CityTravel.encounter){if(CityTravel.encounter.result)CityTravel.settle(CityTravel.encounter.result);else CityTravel.cancelEncounter();return;}")
# Release actual captured pointers at every mode boundary, including entry while run is held.
host=replace(host,"function resetInput(){joystick.id=null;", "function resetInput(){for(const [id,el] of capturedPointers){try{if(el.hasPointerCapture(id))el.releasePointerCapture(id);}catch{}}capturedPointers.clear();joystick.id=null;")
needle='function resetInput()'
pos=host.index(needle)
host=host[:pos]+"const capturedPointers=new Map();document.addEventListener('gotpointercapture',e=>capturedPointers.set(e.pointerId,e.target),true);document.addEventListener('lostpointercapture',e=>capturedPointers.delete(e.pointerId),true);addEventListener('blur',resetInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetInput();});\n"+host[pos:]
host=replace(host,"async function cityEncounter(options){resetInput();", "async function cityEncounter(options){resetInput();if($('#panel').open)$('#panel').close();")
# Numeric legacy games keep their own authored intro; remove automatic click-through.
a=host.index('if(${kind}!==2){let begun=false;');b=host.index('}`;',a)+1
host=host[:a]+host[b:]
# Legacy result displays its existing confirmation; no automatic exit timer.
parts[host_i]=host
# Native game events never need access to parent properties.
for marker,name in [('const SUITE_DOCUMENT=','SUITE_DOCUMENT'),('const CITY_ENCOUNTER_DOCUMENT=','CITY_ENCOUNTER_DOCUMENT')]:
 i=locate(marker)
 def native_doc(doc):
  doc=doc.replace("try{parent.GaiaAudioStatus?.unlock();parent.postMessage({type:'gaia-audio-event',kind:'water',event:'water-voice'},'*');}catch{}", "window.GaiaAudioStatus?.event('water-voice','water');")
  doc=doc.replace("function emitEvent(event,extra={}){parent.postMessage({type:'gaia-audio-event',event,kind:'cylinder',...extra},'*');}", "function emitEvent(event,extra={}){window.GaiaAudioStatus?.event(event,'cylinder',extra.actor,extra.name,extra.mood,extra.force);}")
  # The pre-existing inner mixer has no sources; use the single local shared mixer.
  a=doc.index('async function unlock(){');b=doc.index('\n',a)
  doc=doc[:a]+"function unlock(){window.GaiaAudioStatus?.unlock();}"+doc[b:]
  # Result stays on screen until confirmation, for both city and center.
  doc=doc.replace("parent.postMessage({type:GAME_CONFIG.cityEncounter?'city-route-result':'wellness-result',...result},'*');Q('#overlay').hidden=true;return;", "parent.postMessage({type:GAME_CONFIG.cityEncounter?'city-route-result':'wellness-result',...result},'*');showResult(result);return;")
  doc=doc.replace("parent.postMessage({type:GAME_CONFIG.cityEncounter?'city-route-result':'wellness-result',...r,penalty:false},'*');Q('#overlay').hidden=true;", "parent.postMessage({type:GAME_CONFIG.cityEncounter?'city-route-result':'wellness-result',...r,penalty:false},'*');showResult(r);")
  doc=doc.replace("report(r);Q('#overlay').hidden=true;if(parent===window)overlay(r.success?'성공':'실패',r.detail,'다시 하기',begin);", "report(r);showResult(r);")
  pos=doc.index('function finish(){')
  doc=doc[:pos]+"function showResult(r){document.body.classList.remove('city-penalty-intro');overlay(r.success?'성공':'실패',r.detail||String(r.score??r.taps??0),'확인',()=>parent.postMessage({type:'wellness-close'},'*'));}\n"+doc[pos:]
  return doc
 parts[i]=change_value(parts[i],name,native_doc)
# Declared revision helps distinguish downloaded copies, without adding game-screen instructions.
parts[host_i]+="\nwindow.GAIA_BUILD='20261020-R3';\n"
for m,s in reversed(list(zip(matches,parts))): html=html[:m.start(1)]+s+html[m.end(1):]
(ROOT/'GAIA-LIFE-20261020.html').write_text(html)
(ROOT/'GAIA-LIFE-20261020-R3.html').write_text(html)
print('R3',len(html.encode()),hashlib.sha256(html.encode()).hexdigest())
