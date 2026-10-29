/* Rosie crouch, split, headbutt and dash: one anatomical scale, ground anchored. */
window.HeroActions=(()=>{
  const DATA={"00":{"rect":[6,9,157,241],"anchor":[101.934,240]},"01":{"rect":[396,6,171,244],"anchor":[94.815,243]},"02":{"rect":[786,27,192,223],"anchor":[142.02,222]},"03":{"rect":[1176,9,157,241],"anchor":[101.145,240]},"10":{"rect":[6,268,204,199],"anchor":[123.605,198]},"11":{"rect":[396,270,378,197],"anchor":[182.758,196]},"12":{"rect":[786,275,355,192],"anchor":[172.637,191]},"13":{"rect":[1176,262,148,205],"anchor":[80.865,204]},"20":{"rect":[6,479,297,203],"anchor":[187.59,202]},"21":{"rect":[396,498,311,184],"anchor":[226.568,183]},"22":{"rect":[786,482,289,200],"anchor":[178.702,199]},"23":{"rect":[1176,503,221,179],"anchor":[112.692,178]}};
  const HUG={"h0":{"rect":[6,6,258,340],"anchor":[139.367,339]},"h1":{"rect":[312,29,294,317],"anchor":[148.624,316]},"h2":{"rect":[618,36,202,310],"anchor":[122.003,309]},"h3":{"rect":[924,11,224,335],"anchor":[118.505,334]}};
  const assets={rosie_actions:'assets/hero/rosie-actions.webp',rosie_hug:'assets/hero/rosie-hug.webp',button_crouch_new:'assets/hero/button-crouch.webp',button_dash_new:'assets/hero/button-dash.webp'};
  function pose(u){
    if(u.grab)return u.grab.pose==='hip'?'grabHip':'02';
    if(u.down||u.jump||u.slam||u.splash||u.charge||u.skillPose||u.stun>0||u.hp<=0)return null;
    if(u.dash)return '2'+Math.min(3,Math.floor(u.dash.age/u.dash.duration*4));
    if(u.attack?.kind==='dashHip')return u.attack.age<.34?'02':'03';
    if(u.attack?.kind==='dashHug')return 'h1';
    if(u.attack?.kind==='headbutt'){const t=u.attack.age/.42;return t<.25?'01':t<.66?'02':'03';}
    if(u.attack?.kind==='split'){const t=u.attack.age/.65;return t<.24?'10':t<.58?'11':t<.78?'12':'13';}
    if(u.attack?.kind==='whirlSplit'){const t=u.attack.age/1.08;return t<.16?'10':t<.89?'11':'13';}
    return u.crouch?'00':null;
  }
  function frame(ctx,im,key,x=0,y=0){const f=DATA[key]||HUG[key];if(!f)return;const [sx,sy,w,h]=f.rect;ctx.drawImage(im,sx,sy,w,h,x-f.anchor[0]/2,y-f.anchor[1]/2,w/2,h/2);}
  function draw(ctx,images,u,game){
    const key=pose(u),im=key==='grabHip'?images.lowerPrep:key?.startsWith('h')?images.rosie_hug:images.rosie_actions;if(!key||!(im?.naturalWidth||im?.width))return false;
    const x=u.x-game.camera;if(x<-340||x>1600)return true;
    ctx.save();ctx.translate(x,u.y);ctx.fillStyle='#6047634d';ctx.beginPath();ctx.ellipse(0,-2,key[0]==='1'?76:31,9,0,0,Math.PI*2);ctx.fill();
    // A readable, foot-planted comic wobble instead of high-frequency jitter.
    if(u.grab)ctx.rotate(Math.sin(u.grab.age*Math.PI*2*1.8)*.065*(u.grab.dir||1));
    const hip=u.attack?.kind==='dashHip'||u.grab?.pose==='hip',dir=u.grab?.dir||u.dash?.dir||u.attack?.dir||u.face;ctx.scale(hip?dir:-dir,1);
    // Perspective flip around the upright axis: spread legs stay at fixed height,
    // and the original split image is reused instead of replacing the character.
    if(u.attack?.kind==='whirlSplit'){
      const t=Math.max(0,Math.min(1,(u.attack.age/1.08-.16)/.73));
      const spin=t*Math.PI*4,side=Math.cos(spin);
      ctx.scale(Math.sign(side||1)*(.38+.62*Math.abs(side)),1);
      ctx.save();ctx.strokeStyle='#ffe8fb';ctx.lineWidth=5;ctx.globalAlpha=.33+.25*Math.sin(spin)**2;
      ctx.beginPath();ctx.ellipse(0,-31,110,24,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    if(u.dash||hip&&u.dashFollow){
      for(let j=3;j>0;j--){ctx.save();ctx.globalAlpha=.1+(3-j)*.07;frame(ctx,im,key,(hip?-1:1)*j*18,0);ctx.restore();}
      ctx.save();ctx.strokeStyle='#e1fff5';ctx.lineWidth=2;ctx.globalAlpha=.75;ctx.lineCap='round';
      for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo((hip?-1:1)*(27+j*7),-45-j*19);ctx.lineTo((hip?-1:1)*(68+j*12),-45-j*19);ctx.stroke();}ctx.restore();
    }
    if(key==='grabHip'){const h=169,w=h*(im.naturalWidth||im.width)/(im.naturalHeight||im.height);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();return true;}
    const blend=key==='00'?Math.max(0,Math.min(1,u.crouchBlend??1)):1;
    const transition=key==='00'&&blend<.7?(blend<.28?images.move1:images.jump0):null;
    if(transition?.naturalWidth||transition?.width){
      // Standing -> original shallow crouch -> deep crouch, all at original size.
      const k=blend<.28?169/(transition.naturalHeight||transition.height):169/685;
      const w=(transition.naturalWidth||transition.width)*k,h=(transition.naturalHeight||transition.height)*k;
      ctx.drawImage(transition,-w/2,-h,w,h);
    }else frame(ctx,im,key);
    ctx.restore();return true;
  }
  return {assets,data:DATA,hugData:HUG,pose,frame,draw};
})();
