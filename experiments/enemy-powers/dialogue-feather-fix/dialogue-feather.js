(()=>{
 let observer=null,previous=null,scheduled=false;
 function align(){
  scheduled=false;
  const scene=document.querySelector('.screen.dialogue'),speech=scene?.querySelector('.speech');
  if(previous!==speech){observer?.disconnect();previous=speech;if(speech){observer=new ResizeObserver(queue);observer.observe(speech)}}
  if(!scene||!speech)return;
  const frame=scene.getBoundingClientRect(),panel=speech.getBoundingClientRect();
  // Keep the cut edge below the panel's top, leaving a soft transition above it.
  const underlap=Math.min(96,Math.max(48,frame.height*.1));
  const bottom=Math.max(0,frame.bottom-panel.top-underlap);
  scene.style.setProperty('--gaia-dialogue-bottom',bottom+'px');
 }
 function queue(){if(!scheduled){scheduled=true;requestAnimationFrame(align)}}
 new MutationObserver(queue).observe(document.querySelector('#app'),{childList:true,subtree:true,characterData:true});
 addEventListener('resize',queue);document.fonts?.ready.then(queue);queue();
})();
