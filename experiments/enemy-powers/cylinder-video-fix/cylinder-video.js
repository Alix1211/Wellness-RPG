function gaiaCylinderVideoFix(doc,game){
 if(game!=='cylinder')return doc;
 const anchor='new M.Cylinder(GAME_CONFIG.cylinder||{})';
 if(!doc.includes(anchor))throw Error('Cylinder model anchor missing');
 doc=doc.replace(anchor,'new M.Cylinder({...GAME_CONFIG.cylinder,duration:10,goal:Math.max(1,Math.round((GAME_CONFIG.cylinder?.goal||500)*.3))})');
 // Keep Blob playlist out of the legacy image-data decoder.
 doc=doc.replace("values.filter(([k])=>k.startsWith(kind+'/'))","values.filter(([k])=>k.startsWith(kind+'/')&&k!=='cylinder/mp4-folder')");
 doc=doc.replace('function finish(){stopInput();silence();started=false;',"function finish(){document.querySelectorAll('video').forEach(v=>v.pause());stopInput();silence();started=false;");
 const code=gaiaCylinderVideoUI.toString();
 return doc+'<script>('+code+')();<\/script>';
}
function gaiaCylinderVideoUI(){
 async function ready(){
  const q=s=>document.querySelector(s),upload=q('#upload'),slot=q('#slot'),notice=q('#notice');
  q('#art').textContent='영상 변경';q('#settings h3').textContent='MP4 영상 폴더';
  slot.hidden=true;upload.accept='video/mp4,.mp4';upload.multiple=true;upload.setAttribute('webkitdirectory','');upload.setAttribute('directory','');upload.setAttribute('aria-label','MP4 폴더 선택');
  const select=document.createElement('select');select.setAttribute('aria-label','재생할 MP4 영상');select.hidden=true;upload.after(select);
  q('#settings p').textContent='MP4가 있는 폴더를 선택한 뒤 영상을 고르세요. 이 기기에 저장됩니다.';
  q('#restore').textContent='기본 그림으로';
  let files=[],selected=0,video=null,url=null,generation=0;
  const defaults=LifeMini.images.main;
  function db(){return new Promise((ok,no)=>{const r=indexedDB.open('wellness-life-art-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('art');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
  async function storage(value,write=false){const d=await db();try{return await new Promise((ok,no)=>{const tx=d.transaction('art',write?'readwrite':'readonly'),s=tx.objectStore('art'),r=write?(value===null?s.delete('cylinder/mp4-folder'):s.put(value,'cylinder/mp4-folder')):s.get('cylinder/mp4-folder');if(write&&value===null)s.delete('cylinder/main');tx.oncomplete=()=>ok(r.result);tx.onerror=()=>no(tx.error);tx.onabort=()=>no(tx.error)})}finally{d.close()}}
  function clear(){generation++;if(video){video.pause();video.removeAttribute('src');video.load();video.remove();video=null}if(url){URL.revokeObjectURL(url);url=null}}
  function resume(){if(video&&LifeMini.started&&!LifeMini.paused&&!document.hidden)video.play().catch(()=>{notice.textContent='영상을 재생하려면 계속하기를 눌러 주세요.'})}
  async function show(index){
   clear();selected=index;const item=files[index];if(!item)return;
   const current=generation,v=document.createElement('video');video=v;v.muted=true;v.loop=true;v.playsInline=true;v.preload='auto';v.hidden=true;v.setAttribute('aria-hidden','true');url=URL.createObjectURL(item.blob);v.src=url;document.body.append(v);
   try{await new Promise((ok,no)=>{v.onloadeddata=ok;v.onerror=()=>no(Error('이 MP4를 재생할 수 없습니다.'))});if(current!==generation)return;CylinderCustomArt.add('main');LifeMini.images.main=v;resume();notice.textContent=item.name;}
   catch(e){if(current===generation){clear();notice.textContent=e.message;}}
  }
  function options(){select.replaceChildren(...files.map((f,i)=>new Option(f.name,String(i))));select.hidden=!files.length;select.value=String(selected)}
  upload.onchange=async()=>{const next=[...upload.files].filter(f=>/\.mp4$/i.test(f.name)).sort((a,b)=>a.name.localeCompare(b.name));if(!next.length){notice.textContent='선택한 폴더에 MP4가 없습니다.';upload.value='';return}files=next.map(f=>({name:f.webkitRelativePath||f.name,blob:f}));selected=0;options();await show(0);try{await storage({files,selected},true)}catch{notice.textContent+=' · 기기 저장 실패, 현재 실행에서는 사용 가능합니다.'}upload.value=''};
  select.onchange=async()=>{await show(+select.value);try{await storage({files,selected},true)}catch{notice.textContent+=' · 기기 저장 실패'}};
  q('#restore').onclick=async()=>{clear();files=[];selected=0;options();CylinderCustomArt.delete('main');delete LifeMini.images.main;SceneEditor.apply(window.SCENE_LAYOUT||GAME_SCENE.layout,false);try{await storage(null,true);notice.textContent='기본 그림으로 되돌렸습니다.'}catch{notice.textContent='현재 화면은 복원했지만 저장된 영상 삭제에 실패했습니다.'}};
  q('#settingsClose').addEventListener('click',resume);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video?.pause();else resume()});
  addEventListener('pagehide',clear);
  const begin=LifeMini.begin;LifeMini.begin=function(){begin();resume()};
  window.CylinderVideo={get files(){return files.map(f=>f.name)},get selected(){return selected},get video(){return video},get ready(){return !!video&&video.readyState>=2}};
  const imageReady=window.CylinderArtReady;
  window.CylinderArtReady=(async()=>{await imageReady;try{const saved=await storage();if(saved?.files?.length){files=saved.files;selected=Math.min(saved.selected||0,files.length-1);options();await show(selected)}}catch{notice.textContent='저장된 영상 폴더를 불러오지 못했습니다.'}})();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
}
