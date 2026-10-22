(()=>{'use strict';
const mini=window.LifeMini;if(mini?.kind!=='cylinder')return;
let files=[],queue=[],current='',failed=new Set(),media=null,timer=null,disposed=false;
function status(s){parent.postMessage({type:'cylinder-video-status',text:s},'*');}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function stop(){if(media){media.pause();media.removeAttribute('src');media.load();media.remove();media=null;}document.body.classList.remove('c-cylinder-video');}
function next(){if(disposed)return;const valid=files.filter(x=>!failed.has(x.url));if(!valid.length){stop();status(files.length?'영상을 재생하지 못했습니다. MP4 형식을 확인해 주세요.':'선택한 폴더에 MP4 영상이 없습니다.');return;}
 if(!queue.length){queue=shuffle([...valid]);if(queue.length>1&&queue[queue.length-1].url===current)[queue[0],queue[queue.length-1]]=[queue[queue.length-1],queue[0]];}
 const item=queue.pop();current=item.url;
 if(!media){media=document.createElement('video');media.id='cylinderFolderVideo';media.muted=true;media.playsInline=true;media.preload='auto';media.style.cssText='position:fixed;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;z-index:-1;background:#25212b';document.body.prepend(media);
  media.onended=next;media.onerror=()=>{failed.add(current);queue=queue.filter(x=>x.url!==current);next();};}
 document.body.classList.add('c-cylinder-video');window.MEDIA_BACKGROUND=true;media.src=item.url;media.onloadedmetadata=()=>{status(item.name+' · '+media.videoWidth+'×'+media.videoHeight);sync();};sync();
}
function sync(){if(!media)return;const pause=window.MEDIA_PAUSED||mini.paused||document.hidden;if(pause){if(!media.paused)media.pause();}else if(media.paused&&!media.ended)media.play().catch(()=>{});}
window.CylinderVideos={set(list){files=(list||[]).filter(x=>typeof x.url==='string');queue=[];failed.clear();if(files.length)next();else stop();},next,stop,get current(){return current},get count(){return files.length}};
const style=document.createElement('style');style.textContent='body.cylinder-game.c-cylinder-video::before,body.cylinder-game.c-cylinder-video::after{display:none!important}.c-cylinder-video #sceneFullBackground{visibility:hidden!important}.c-cylinder-video .play,.c-cylinder-video canvas{background:transparent!important}';document.head.append(style);
// Suppress only the imposed center portrait while the user-selected background is active.
let saved=mini.images.main;Object.defineProperty(mini.images,'main',{configurable:true,get(){return document.body.classList.contains('c-cylinder-video')?null:saved;},set(v){saved=v;}});
timer=setInterval(sync,120);addEventListener('pagehide',()=>{disposed=true;clearInterval(timer);stop();});
})();
