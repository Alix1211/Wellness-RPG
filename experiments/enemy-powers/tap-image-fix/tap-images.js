function gaiaTapImagesFix(doc,game){
 if(game!=='tap')return doc;
 const paths={
  'assets/minigames/386f74e8b171b76048f9.webp':'assets/minigames/miju-tap-1.png',
  'assets/minigames/1a37ff4fef7629182c8d.webp':'assets/minigames/miju-tap-3.png'
 };
 // Resolve pose 2 from its key, since asset hashes belong to the base build.
 doc=doc.replace(/("미니게임\/poses\/tap2.webp":)"[^"]+"/,'$1"assets/minigames/miju-tap-2.png"');
 for(const [old,next] of Object.entries(paths))doc=doc.replaceAll(old,next);
 const start=doc.indexOf('function mgTap(board){'),end=doc.indexOf('function mgBadges()',start);
 if(start<0||end<0)throw Error('Tap function missing');
 let fn=doc.slice(start,end);
 const replace=(a,b)=>{if(!fn.includes(a))throw Error('Tap anchor missing: '+a.slice(0,70));fn=fn.replace(a,b)};
 replace("const img=mgNode('img','mg-actor-sprite',undefined,target);","const img=mgNode('img','mg-actor-sprite',undefined,actor);");
 replace("img.alt=`${i+1}번 엎드린 회원`;","img.alt=`미주 ${i+1}번 자세`;const point=[{x:.61,y:.55},{x:.68,y:.65},{x:.50,y:.60}][i];");
 replace("const r=actor.getBoundingClientRect(),sr=mgDialog.querySelector('.mg-scene').getBoundingClientRect(),x=(r.left+r.width*.65-sr.left)/sr.width*100,y=(r.top+r.height*.5-sr.top)/sr.height*100;","const r=target.getBoundingClientRect(),sr=mgDialog.querySelector('.mg-scene').getBoundingClientRect(),x=(r.left+r.width*.5-sr.left)/sr.width*100,y=(r.top+r.height*.5-sr.top)/sr.height*100;");
 const headStart=fn.indexOf('  const placeHead=()=>{'),headEnd=fn.indexOf('\n  return {actor,bar,value,gauge,placeHead};',headStart);
 if(headStart<0||headEnd<0)throw Error('Tap layout missing');
 fn=fn.slice(0,headStart)+`  const placeHead=()=>{
   const rw=actor.clientWidth,rh=Math.max(1,actor.clientHeight-20),ratio=img.naturalWidth/img.naturalHeight;
   if(!Number.isFinite(ratio)||ratio<=0)return;
   const dh=Math.min(rh,rw/ratio),dw=dh*ratio,left=(rw-dw)/2,top=actor.clientHeight-dh;
   const cx=left+dw*point.x,cy=top+dh*point.y,hw=Math.max(44,dw*.28),hh=Math.max(44,dh*.28);
   Object.assign(target.style,{left:(cx-hw/2)+'px',top:(cy-hh/2)+'px',right:'auto',bottom:'auto',width:hw+'px',height:hh+'px'});
   target.dataset.pointX=point.x;target.dataset.pointY=point.y;
   head.style.top=Math.max(0,top+dh*.12-head.offsetHeight-3)+'px';head.style.left=(left+dw*.04)+'px';
  };
  img.addEventListener('load',placeHead,{once:true});`+fn.slice(headEnd);
 doc=doc.slice(0,start)+fn+doc.slice(end);
 const css='<style id="gaia-tap-image-points">.mg-tap-person>.mg-actor-sprite{position:absolute;inset:0;width:100%;height:100%;padding-top:20px;box-sizing:border-box;object-fit:contain;object-position:center bottom;pointer-events:none;transform-origin:60% 60%}.mg-tap-person>.mg-tap-target{padding:0;z-index:6;min-width:0;min-height:0;overflow:visible;box-shadow:none;outline-offset:3px}.mg-tap-target .mg-tap-paddle{left:50%;top:50%;right:auto;transform:translate(-50%,-50%);width:90px;height:90px}.mg-tap-person>.mg-head-meter{z-index:8}</style>';
 return doc.replace('</head>',css+'</head>');
}
