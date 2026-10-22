(()=>{'use strict';
const DB='gaia-casual-media-v1';let dbPromise;
function db(){return dbPromise||=(new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('games');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);}));}
async function get(id){const d=await db();return new Promise((ok,no)=>{const r=d.transaction('games').objectStore('games').get(id);r.onsuccess=()=>ok(r.result||{images:{},layout:{portrait:{},landscape:{},targets:{}},audio:{}});r.onerror=()=>no(r.error);});}
async function put(id,value){const d=await db();return new Promise((ok,no)=>{const t=d.transaction('games','readwrite');t.objectStore('games').put(value,id);t.oncomplete=ok;t.onabort=t.onerror=()=>no(t.error);});}
window.CasualMediaStore={get,put};
const style=document.createElement('style');style.textContent=`#c-media-settings{padding:12px;place-items:center end;backdrop-filter:blur(2px)}#c-media-settings .c-result{width:min(430px,100%);max-height:92dvh;overflow:auto;text-align:left;padding:18px;border-radius:20px}#c-media-settings h2{font-size:19px}#c-media-settings label{display:block;font-size:13px;margin:12px 0 6px}#c-media-settings select,#c-media-settings input[type=file]{width:100%;padding:9px;border:1px solid #d9cfd4;border-radius:10px;background:#fff;font:inherit;font-size:13px}#c-media-settings input[type=range]{width:100%;accent-color:#b56991}#c-media-settings .c-tabs{display:flex;gap:7px;position:sticky;top:-18px;padding:9px 0;background:#fffdf4;z-index:1}#c-media-settings .c-tabs button{margin:0;min-height:40px}#c-media-settings .c-tabs [aria-pressed=true]{background:#b76b95;color:#fff}#c-media-settings .c-preview{height:110px;width:100%;object-fit:contain;background:repeating-conic-gradient(#e7e4e5 0 25%,#faf7f8 0 50%) 50%/18px 18px;border-radius:10px;margin-top:10px}#c-media-settings .c-row{display:flex;gap:7px}#c-media-settings .c-row button{flex:1}#c-media-settings .c-small{font-size:12px;color:#806c79;line-height:1.5}#c-media-settings .c-slider-label{display:flex;justify-content:space-between}#c-media-settings .c-actions{border-top:1px solid #e6d9df;margin-top:15px;padding:8px 0;background:#fffdf4;position:sticky;bottom:-18px;display:grid;grid-template-columns:1fr 1fr;gap:7px;z-index:2}#c-media-settings .c-actions .c-btn{margin:0}#c-media-settings #c-media-save{grid-column:1/-1;grid-row:1}#c-media-settings.c-peek{background:transparent;backdrop-filter:none;pointer-events:none;place-items:end center}#c-media-settings.c-peek .c-result{display:none}#c-media-settings .c-peek-back{display:none}#c-media-settings.c-peek .c-peek-back{display:block;pointer-events:auto;box-shadow:0 2px 14px #0005;background:#b76b95;color:white}#c-media-settings audio{width:100%;margin-top:10px}`;document.head.append(style);
function el(tag,text,parent){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(parent)parent.append(e);return e;}
function button(text,fn,parent){const b=el('button',text,parent);b.className='c-btn';b.type='button';b.onclick=fn;return b;}
function fileData(file){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=()=>no(r.error);r.readAsDataURL(file);});}
let active=null,opening=false;
async function open(ctx){if(active||opening)return;opening=true;ctx.pause(true);let before;try{before=await get(ctx.id);opening=false;}catch{opening=false;ctx.notify('편집 저장소를 열지 못했습니다.');ctx.pause(false);return;}
 const draft=structuredClone(before),w=ctx.frame.contentWindow;let closed=false,dirty=false,preview=null,tab='image',pending=0,saveButton=null;draft.images||={};draft.audio||={};draft.layout||={};for(const k of ['portrait','landscape','targets'])draft.layout[k]||={};
 const veil=el('div',undefined,ctx.root);veil.id='c-media-settings';veil.className='c-veil';const box=el('section',undefined,veil);box.className='c-result';box.setAttribute('role','dialog');box.setAttribute('aria-label',ctx.name+' 이미지·음향 편집');el('h2',ctx.name+' 설정',box);const tabs=el('div',undefined,box);tabs.className='c-tabs';const content=el('div',undefined,box);const status=el('p','',box);status.id='c-media-status';status.className='c-small';
 const actions=el('div',undefined,box);actions.className='c-actions';const peek=button('편집으로 돌아가기',()=>veil.classList.remove('c-peek'),veil);peek.className='c-btn c-peek-back';
 function message(s){status.textContent=s;}
 function busy(on){pending+=on?1:-1;if(saveButton)saveButton.disabled=pending>0;}
 function apply(){w.CasualImageEditor?.apply(draft);dirty=true;}
 function stopPreview(){if(preview){preview.pause();preview.removeAttribute('src');preview.load();preview=null;}}
 function cleanup(){closed=true;stopPreview();veil.remove();active=null;ctx.pause(false);}
 function close(cancel){if(cancel)w.CasualImageEditor?.apply(before);cleanup();}
 active={close:()=>close(true)};
 button('미리보기',()=>{stopPreview();veil.classList.add('c-peek');},actions);
 saveButton=button('저장하고 계속',async()=>{stopPreview();try{await put(ctx.id,draft);w.CasualImageEditor?.apply(draft);cleanup();ctx.notify('편집 저장 완료 · 음원 교체는 다음 판부터 적용됩니다.');}catch{message('저장하지 못했습니다. 공간을 확인하거나 취소해 주세요.');}},actions);saveButton.id='c-media-save';
 button('취소',()=>close(true),actions).id='c-media-cancel';
 function show(){stopPreview();content.replaceChildren();for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.tab===tab));if(tab==='image')images();else if(tab==='audio')audio();else video();}
 for(const [id,title]of [['image','이미지'],['audio','음향'],...(ctx.id==='cylinder'?[['video','영상 폴더']]:[])]){const b=button(title,()=>{tab=id;show();},tabs);b.dataset.tab=id;}
 function images(){
  const targets=w.SceneEditor?.targets?.()||[],loaded=w.CasualImageEditor?.list()||[];const label=el('label','편집할 그림',content),select=el('select',undefined,label);select.id='c-media-image-target';
  const choices=[{key:'background',name:'전체 배경'},{key:'board',name:'게임판'}].concat(targets.map(t=>({key:'target:'+t.id,name:t.name})),loaded.map(x=>({...x,key:'loaded:'+x.key})));
  for(const x of choices){const opt=el('option',x.name,select);opt.value=x.key;}
  const pane=el('div',undefined,content);select.onchange=render;render();
  function render(){pane.replaceChildren();let key=select.value;const choice=choices.find(x=>x.key===key),isLoaded=key.startsWith('loaded:'),isTarget=key.startsWith('target:'),ori=w.innerHeight>w.innerWidth||ctx.id==='cylinder'?'portrait':'landscape';
   function value(create=false){if(isLoaded)return draft.images[key.slice(7)];const group=isTarget?draft.layout.targets:draft.layout[ori],id=isTarget?key.slice(7):key;if(create&&!group[id])group[id]=structuredClone(isTarget?(w.SceneEditor?.value(id)||{x:.5,y:.5,z:1,sx:1,sy:1,r:0,opacity:1}):{x:0,y:0,z:1,sx:1,sy:1,r:0,opacity:1});return group[id];}
   const image=el('img',undefined,pane);image.className='c-preview';image.alt=choice.name;const current=value()||(isTarget?w.SceneEditor?.value(key.slice(7)):null);const previewSrc=current?.src||choice.current||(key==='background'?w.GAME_SCENE?.background:'');if(previewSrc)image.src=previewSrc;else image.hidden=true;
   const upload=el('input',undefined,pane);upload.type='file';upload.accept='image/*';upload.id='c-media-image-file';upload.hidden=true;button('이미지 파일 선택',()=>upload.click(),pane);upload.onchange=async()=>{const f=upload.files[0];if(!f)return;busy(true);try{if(f.size>30*1024*1024)throw Error('30MB 이하의 이미지를 선택해 주세요.');const src=await fileData(f),im=new Image();im.src=src;await im.decode();if(closed)return;if(isLoaded)draft.images[key.slice(7)]={src,name:f.name};else Object.assign(value(true),{src,mime:f.type,name:f.name});apply();render();message('이미지 미리보기 · 저장하고 계속을 눌러 확정하세요.');}catch(e){message(e.message||'이미지를 읽지 못했습니다.');}finally{busy(false);}};
   button('이 그림 기본값',()=>{if(isLoaded)delete draft.images[key.slice(7)];else delete(isTarget?draft.layout.targets:draft.layout[ori])[isTarget?key.slice(7):key];apply();render();},pane);
   if(isLoaded){el('p','원래 위치의 그림을 교체합니다. 동작 시트는 원본과 같은 칸 구성을 사용하세요.',pane).className='c-small';return;}
   for(const[k,name,min,max,step]of [['x','가로 위치',-1,1,.005],['y','세로 위치',-1,1,.005],['z','크기',.1,4,.01],['r','회전',-180,180,1],['opacity','투명도',0,1,.01]]){const row=el('label',undefined,pane);row.className='c-slider-label';el('span',name,row);const out=el('span','',row),range=el('input',undefined,pane);range.type='range';range.min=min;range.max=max;range.step=step;range.value=(value()||(isTarget?w.SceneEditor?.value(key.slice(7)):null))?.[k]??(k==='z'||k==='opacity'?1:0);range.setAttribute('aria-label',name);out.textContent=range.value;range.oninput=()=>{value(true)[k]=+range.value;out.textContent=range.value;apply();};}
  }
 }
 function audio(){
  el('p','음악·효과음·반응 음성 파일을 교체합니다. 미리듣기는 즉시, 게임에는 다음 판부터 적용됩니다.',content).className='c-small';
  button(ctx.sound()?'전체 소리 켬':'전체 소리 끔',()=>{ctx.setSound(!ctx.sound());show();},content);
  const slots=ctx.catalog(),select=el('select',undefined,content);select.id='c-media-audio-target';for(const slot of slots){const o=el('option',slot.name,select);o.value=slot.key;}
  const pane=el('div',undefined,content);select.onchange=render;render();
  function render(){stopPreview();pane.replaceChildren();const slot=slots.find(x=>x.key===select.value);if(!slot){el('p','연결된 음원이 없습니다.',pane);return;}const custom=draft.audio[slot.key];el('p',custom?.name||'기본 음원',pane).className='c-small';
   const upload=el('input',undefined,pane);upload.type='file';upload.accept='audio/*,.mp3,.wav,.ogg,.m4a';upload.id='c-media-audio-file';upload.hidden=true;button('음원 파일 선택',()=>upload.click(),pane);upload.onchange=async()=>{const f=upload.files[0];if(!f)return;busy(true);try{if(f.size>50*1024*1024)throw Error('50MB 이하의 음원을 선택해 주세요.');const bytes=await f.arrayBuffer(),ac=new AudioContext();try{await ac.decodeAudioData(bytes.slice(0));}finally{await ac.close();}const src=await fileData(f);if(closed)return;draft.audio[slot.key]={src,name:f.name,mime:f.type};dirty=true;render();message('음원 선택 완료 · 저장 후 다음 판부터 적용됩니다.');}catch{message('재생할 수 있는 음원 파일을 선택해 주세요.');}finally{busy(false);}};
   const player=el('audio',undefined,pane);player.controls=true;player.preload='none';player.src=custom?.src||slot.src;preview=player;
   button('이 음원 기본값',()=>{delete draft.audio[slot.key];dirty=true;render();},pane);
  }
 }
 function video(){const p=el('p',ctx.videoStatus(),content);p.className='c-small';p.id='c-video-status';button('영상 폴더 지정',ctx.chooseVideos,content);button('다음 영상',ctx.nextVideo,content);button('기본 배경으로',ctx.clearVideos,content);el('p','폴더 설정은 즉시 저장됩니다. 원본 비율로 랜덤 재생합니다.',content).className='c-small';}
 show();
}
window.CasualMediaEditor={open,get active(){return!!active},close(){active?.close();}};
})();
