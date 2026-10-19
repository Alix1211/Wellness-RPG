/* Original simulation music, embedded unchanged for offline use. */
window.GaiaNightBridge=function(mult){
 if(mult!==2)return;
 function adjust(){const m=window.LifeMini?.model;if(!m||m.__night||window.LifeMini.penalty)return;m.__night=true;
  if(window.LifeMini.kind==='cylinder'){const mid=(m.bandLow+m.bandHigh)/2;m.bandWidth/=2;m.bandLow=mid-m.bandWidth/2;m.bandHigh=mid+m.bandWidth/2;}
  else if(window.LifeMini.kind==='water'){m.left/=2;if(m.duration)m.duration/=2;}
  else if(window.LifeMini.kind==='rope'){const update=m.update.bind(m);m.update=dt=>update(dt*2);}
 }
 adjust();setInterval(adjust,80);
};
(()=>{const music=new Audio(/*BGM_SOURCE*/);music.loop=true;music.preload='metadata';let begun=false;
 function sync(){const h=window.GameHost;if(!h)return;const s=h.life.living;if(document.hidden||s.bgmOff){music.pause();return;}music.volume=Math.max(0,Math.min(1,(s.bgmVolume??.22)*(h.mode()==='game'?.5:1)));if(begun&&music.paused)music.play().catch(()=>{});}
 for(const type of ['pointerdown','keydown'])document.addEventListener(type,()=>{begun=true;sync();},{capture:true});document.addEventListener('visibilitychange',sync);window.addEventListener('message',e=>{if(e.source===document.querySelector('#miniFrame')?.contentWindow){begun=true;sync();}});setInterval(sync,600);window.GaiaBGM={sync,get element(){return music;}};
})();
