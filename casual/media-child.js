// Runs before any game script: track loaded image instances without changing gameplay.
(()=>{'use strict';
const base=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src'),groups=new Map(),tracked=new WeakMap();let applying=false;
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36)+'-'+s.length;}
function track(im,src){if(applying||!src)return;const key='image-'+hash(src),old=tracked.get(im);if(old&&old!==key)groups.get(old)?.images.delete(im);let g=groups.get(key);if(!g){g={key,src,images:new Set()};groups.set(key,g);}g.images.add(im);tracked.set(im,key);if(!old)im.addEventListener('load',()=>window.CASUAL_MEDIA_VERSION=(window.CASUAL_MEDIA_VERSION||0)+1);const custom=window.CASUAL_MEDIA_RECORD?.images?.[key];const bg=src===window.GAME_SCENE?.background?activeLayer('background')?.src:null;if(custom?.src||bg){applying=true;try{base.set.call(im,custom?.src||bg);}finally{applying=false;}}}
Object.defineProperty(HTMLImageElement.prototype,'src',{configurable:base.configurable,enumerable:base.enumerable,get:base.get,set(src){base.set.call(this,src);track(this,String(src));}});
function collect(){for(const im of document.images)if(!tracked.has(im))track(im,im.src);}
const imageWatch=new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length))collect();});addEventListener('DOMContentLoaded',()=>imageWatch.observe(document.body,{childList:true,subtree:true}));addEventListener('pagehide',()=>imageWatch.disconnect());
function label(src,index){const cfg=window.GAME_SCENE||{};for(const[k,v]of Object.entries(cfg.squat||{}))if(v===src)return({front:'주인공 정면 동작',back:'주인공 뒷면 동작',ball:'스쿼트 공',floor:'바닥'}[k]||k);if(src===cfg.background)return'기본 배경';for(const[k,v]of Object.entries(window.CasualAssetNames||{}))if(v===src)return k;try{if(typeof AS!=='undefined')for(const[k,v]of Object.entries(AS))if(v===src)return k.split('/').slice(-2).join(' / ');}catch{}return'그림 '+(index+1);}
function apply(record){window.CASUAL_MEDIA_VERSION=(window.CASUAL_MEDIA_VERSION||0)+1;window.CASUAL_MEDIA_RECORD=record||{};collect();applying=true;try{for(const g of groups.values()){const src=record?.images?.[g.key]?.src||(g.src===window.GAME_SCENE?.background?activeLayer('background',record)?.src:null)||g.src;for(const im of g.images)if(im.getAttribute('src')!==src)base.set.call(im,src);}}finally{applying=false;}
 const layout=merge(window.GAME_SCENE?.layout||{},record?.layout||{});if(window.SceneEditor)SceneEditor.apply(layout,false);else fallback(layout);
}
function merge(base,edit){return{...base,...edit,portrait:{...base.portrait,...edit.portrait},landscape:{...base.landscape,...edit.landscape},targets:{...base.targets,...edit.targets}};}
function fallback(layout){const ori=innerHeight>innerWidth?'portrait':'landscape',ls=layout[ori]||{};let el=document.querySelector('#casualMediaBackground');if(ls.background?.src){if(!el){el=document.createElement('div');el.id='casualMediaBackground';el.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:-1;background-position:center;background-size:cover';document.body.prepend(el);}el.style.backgroundImage='url("'+ls.background.src+'")';const v=ls.background;el.style.transform=`translate(${(v.x||0)*100}%,${(v.y||0)*100}%) scale(${v.z||1}) rotate(${v.r||0}deg)`;el.style.opacity=v.opacity??1;}else el?.remove();}
function list(){collect();return[...groups.values()].filter(g=>g.images.size).map((g,i)=>({key:g.key,name:label(g.src,i),src:g.src,current:window.CASUAL_MEDIA_RECORD?.images?.[g.key]?.src||g.src}));}
const layerImages=new Map();
function activeLayer(key,record=window.CASUAL_MEDIA_RECORD){const ori=innerHeight>innerWidth||window.GAME_SCENE?.kind==='cylinder'?'portrait':'landscape';return record?.layout?.[ori]?.[key];}
function paintLayer(ctx,key,W,H){const v=activeLayer(key);if(!v?.src)return false;let im=layerImages.get(v.src);if(!im){im=new Image();applying=true;try{base.set.call(im,v.src);}finally{applying=false;}layerImages.set(v.src,im);}if(!im.complete||!im.naturalWidth)return false;ctx.save();ctx.globalAlpha=v.opacity??1;ctx.translate(W/2+(v.x||0)*W,H/2+(v.y||0)*H);ctx.rotate((v.r||0)*Math.PI/180);ctx.scale(v.z||1,v.z||1);const s=key==='background'?Math.max(W/im.naturalWidth,H/im.naturalHeight):Math.min(W/im.naturalWidth,H/im.naturalHeight);ctx.drawImage(im,-im.naturalWidth*s/2,-im.naturalHeight*s/2,im.naturalWidth*s,im.naturalHeight*s);ctx.restore();return true;}
window.CasualCanvasBackground=(ctx,W,H)=>paintLayer(ctx,'background',W,H);
window.CasualCanvasLayer=paintLayer;
window.CasualImageEditor={list,apply,merge};
let music=null,musicTimer;
function syncMusic(){const src=window.CASUAL_MEDIA_RECORD?.audio?.casual_bgm?.src;if(!src)return;if(!music){music=new Audio(src);music.loop=true;music.volume=.5;music.id='casualCustomMusic';music.hidden=true;document.body.append(music);}const paused=window.MEDIA_PAUSED||document.hidden||window.__casualSound===false;if(paused)music.pause();else if(music.paused)music.play().catch(()=>{});}
addEventListener('load',()=>{syncMusic();musicTimer=setInterval(syncMusic,180);});
addEventListener('pagehide',()=>{clearInterval(musicTimer);if(music){music.pause();music.removeAttribute('src');music.load();}});
addEventListener('load',()=>{apply(window.CASUAL_MEDIA_RECORD||{});setTimeout(()=>apply(window.CASUAL_MEDIA_RECORD||{}),400);});
})();
