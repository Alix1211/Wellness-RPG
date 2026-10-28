// Presentation only: keep the existing arrival, card, ticket and save rules.
const GaiaMapHop=(()=>{
 let moving=false;
 const originalTour=tour;
 tour=function(){if(!moving)return originalTour();};
 const clamp=t=>Math.max(0,Math.min(1,t));
 function pose(a,b,t){
  t=clamp(t);
  const u=clamp((t-.1)/.8),ease=u*u*(3-2*u),v=1-ease;
  // Same quadratic curve as the map's connector, plus a small hop.
  const x=v*v*a.x+2*v*ease*a.x+ease*ease*b.x;
  const y=v*v*a.y+2*v*ease*b.y+ease*ease*b.y;
  const air=Math.sin(Math.PI*u);
  const squash=t<.1?Math.sin(t/.1*Math.PI/2):t>.9?Math.sin((1-t)/.1*Math.PI):0;
  return{x,y,lift:22*air,sx:1+.13*squash-.07*air,sy:1-.16*squash+.10*air,tilt:Math.sign(b.x-a.x)*5*air,shadow:1-.3*air};
 }
 function frames(duration,paint){
  return new Promise((resolve,reject)=>{
   let start;
   function frame(now){try{if(start===undefined)start=now;const t=clamp((now-start)/duration);paint(t);if(t<1)requestAnimationFrame(frame);else resolve();}catch(e){reject(e);}}
   requestAnimationFrame(frame);
  });
 }
 function block(e){if(moving&&e.target?.closest?.('button,[data-action],input,select')){e.preventDefault();e.stopImmediatePropagation();}}
 document.addEventListener('click',block,true);
 document.addEventListener('pointerdown',block,true);
 commitMove=async function(path){
  if(moving||!selection)return;
  let committed=false,avatar,shadow,sc;
  try{
   const route=[...path],coords=layout().coords;
   // Validate and commit once before presentation, so closing the app is safe.
   arrive(state,selection.index,route,selection.ticket);committed=true;
   selection=null;save();closeModal();moving=true;
   const app=$('#app');app.setAttribute('aria-busy','true');app.inert=true;
   avatar=$('.map-avatar');sc=$('.node-scroll');
   if(avatar&&sc&&route.every(id=>coords[id])){
    sc.style.scrollBehavior='auto';
    const content=$('.map-content');shadow=document.createElement('span');
    shadow.className='gaia-hop-shadow';shadow.setAttribute('aria-hidden','true');
    shadow.style.cssText='position:absolute;width:30px;height:8px;border-radius:50%;background:#60475938;pointer-events:none;z-index:2;';content.append(shadow);
    avatar.style.transformOrigin='50% 100%';avatar.style.willChange='left,top,transform';
    $('.hand-hint').textContent='이동 중…';
    function paint(p){
     avatar.style.left=p.x+'px';avatar.style.top=(p.y-p.lift)+'px';
     avatar.style.transform=`translate(-50%,-107%) scale(${p.sx},${p.sy}) rotate(${p.tilt}deg)`;
     shadow.style.left=p.x+'px';shadow.style.top=(p.y-5)+'px';
     shadow.style.transform=`translate(-50%,-50%) scale(${p.shadow})`;shadow.style.opacity=String(1-p.lift/44);
     sc.scrollLeft=Math.max(0,p.x-sc.clientWidth/2);
     sc.scrollTop=Math.max(0,p.y-avatar.offsetHeight*.62-sc.clientHeight/2);
    }
    for(let i=1;i<route.length;i++){
     const a=coords[route[i-1]],b=coords[route[i]];
     await frames(220,t=>paint(pose(a,b,t)));
    }
    const dest=coords[route.at(-1)];
    await frames(120,t=>{const bounce=Math.sin(t*Math.PI*2)*(1-t);paint({...dest,lift:0,sx:1+.10*bounce,sy:1-.12*bounce,tilt:0,shadow:1});});
   }
  }catch(e){console.error('[GAIA map move]',e);toast(e.message);}
  finally{
   shadow?.remove();moving=false;
   const app=$('#app');app.inert=false;app.removeAttribute('aria-busy');
   // Only after the last landing may training, dialogue or a match open.
   if(committed){tour.recenter=true;tour();showPending();}
  }
 };
 return{pose,get moving(){return moving;}};
})();
