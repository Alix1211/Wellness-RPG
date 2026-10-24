// Cosmetic equipment uses the existing racket geometry and collision radius.
(()=>{
 const gear=gaiaGearLoad;
 if(gear.ball&&/^#[0-9a-f]{6}$/i.test(gear.ball.color)){
  const color=parseInt(gear.ball.color.slice(1),16);BALL_EFFECTS.normal.color=color;ballMat.color.setHex(color);
 }
 if(!gear.racket)return;
 const item=gear.racket,canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d'),color=/^#[0-9a-f]{6}$/i.test(item.color)?item.color:'#ef83b3';
 ctx.fillStyle=color;ctx.fillRect(0,0,512,512);ctx.strokeStyle='#fff4df';ctx.lineWidth=22;ctx.beginPath();ctx.arc(256,256,233,0,Math.PI*2);ctx.stroke();
 ctx.fillStyle='#fff4df';ctx.strokeStyle='#fff4df';ctx.lineWidth=9;
 const theme=item.theme||0;
 ctx.save();ctx.translate(256,256);
 if(theme===0){ctx.beginPath();ctx.moveTo(0,94);ctx.bezierCurveTo(-170,-5,-95,-146,0,-50);ctx.bezierCurveTo(95,-146,170,-5,0,94);ctx.fill()}
 else if(theme===1||theme===4){ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?48:112;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill()}
 else if(theme===2){for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.ellipse(0,-65,29,58,0,0,Math.PI*2);ctx.fill();ctx.restore()}ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fill()}
 else if(theme===3){ctx.beginPath();ctx.arc(0,0,103,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(53,-30,90,0,Math.PI*2);ctx.fill();ctx.globalCompositeOperation='source-over'}
 else{ctx.beginPath();ctx.moveTo(-110,-65);ctx.lineTo(-70,75);ctx.lineTo(70,75);ctx.lineTo(110,-65);ctx.lineTo(48,-15);ctx.lineTo(0,-100);ctx.lineTo(-48,-15);ctx.closePath();ctx.fill()}
 ctx.restore();
 const tex=new THREE.CanvasTexture(canvas);tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;
 const rim=new THREE.MeshStandardMaterial({color:0xffd6a4,roughness:.65}),face=new THREE.MeshStandardMaterial({map:tex,color:0xffffff,roughness:.65});
 playerRacket.children[1].material=[rim,face,face];playerRacket.children[2].material=[rim,face,face];playerRacket.children[0].material.color.set(color);
 window.GAIA_EQUIPMENT_STATUS={...gear,playerOnly:true};
})();
