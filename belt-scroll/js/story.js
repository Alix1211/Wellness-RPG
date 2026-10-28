// 기존 gaia-detective/js/story.js의 좌우 인물·하단 대화·타자·탭·건너뛰기 방식을 벨트액션에 이식.
(function(){
  const $=id=>document.getElementById(id),root=$('story'),hero=$('stHero'),npc=$('stNpc');
  let scene=null,index=0,timer=null,full='';const queue=[];
  const scenes=window.BeltDialogue.scenes;
  function key(event,c){
    if(event==='enter')return c.region+'.enter';
    if(event==='boss'||event==='defeated'){
      if(c.region==='park')return event==='boss'?'park.boss':'park.boss.defeated';
      const id=/^mafia[A-D]$/.test(c.kind)?'mafiaSquad':c.kind;
      return id+(event==='boss'?'.meet':'.defeated');
    }
    if(event==='win')return c.route===c.routes?c.region+'.clear':'stage.clear';
    if(event==='lose')return 'common.defeat';
    return event;
  }
  // 로지 초상화: 평상시(약간 소심) / 기쁠 때. 체포·클리어·복귀 장면은 기쁜 얼굴, 나머지는 평상시. 줄마다 mood:'happy'|'normal' 로 따로 지정도 가능.
  const ART={normal:'assets/story/rosie_normal.webp',happy:'assets/story/rosie_happy.webp'};
  Object.values(ART).forEach(u=>{const i=new Image();i.src=u;});
  const HAPPY=/(\.defeated|\.clear|^police\.return|^common\.return)$/;
  function heroArt(l){return ART[l.mood||(HAPPY.test(scene.key||'')?'happy':'normal')];}
  function stopTyping(){clearInterval(timer);timer=null;}
  function show(){
    stopTyping();const l=scene.lines[index],c=scene.ctx,speaks=l.who==='hero';
    hero.src=heroArt(l);hero.classList.toggle('dim',!speaks);
    if(l.who==='caption'){ // 현장 안내자: 초상화 없이 자막만(양쪽 모두 어둡게)
      hero.classList.add('dim');npc.removeAttribute('src');npc.hidden=true;$('stNpcLabel').textContent='';
      $('stName').textContent=l.name||'현장 안내자';$('stName').className='npc';
    }else{
    const firstActor=scene.lines.find(x=>x.actor)?.actor;
    const actorId=speaks?(scene.lastActor||firstActor):l.actor;
    if(!speaks&&l.actor)scene.lastActor=l.actor;
    const actor=(actorId&&(c.actors?.[actorId]||window.BeltDialogue.actors[actorId]))||c;
    if(actor.portrait){npc.src=actor.portrait;npc.hidden=false;}else{npc.removeAttribute('src');npc.hidden=true;}
    npc.classList.toggle('dim',speaks);$('stNpcLabel').textContent=actor.name||'';
    $('stName').textContent=speaks?'로지':(l.name||actor.name||'상대');$('stName').className=speaks?'hero':'npc';
    }
    $('stContext').textContent=c.title||'';full=l.text;$('stText').textContent='';$('stMore').style.opacity='0';
    const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(reduce){$('stText').textContent=full;$('stMore').style.opacity='1';return;}
    let k=0;timer=setInterval(()=>{$('stText').textContent=full.slice(0,++k);if(k>=full.length){stopTyping();$('stMore').style.opacity='1';}},28);
  }
  function take(){scene=queue.shift()||null;index=0;if(scene){root.classList.remove('hidden');show();}else root.classList.add('hidden');}
  function end(){if(!scene)return;stopTyping();const done=scene.done;scene=null;take();if(done)done();}
  function next(){if(!scene)return;if(timer){stopTyping();$('stText').textContent=full;$('stMore').style.opacity='1';return;}if(++index>=scene.lines.length)end();else show();}
  function play(key,ctx,done){
    const lines=scenes[key];if(!lines?.length){done?.();return;}
    queue.push({key,lines:lines.slice(),ctx:ctx||{},done});if(!scene)take();
  }
  function cancel(){stopTyping();queue.length=0;scene=null;root.classList.add('hidden');hero.removeAttribute('src');npc.removeAttribute('src');}
  root.addEventListener('pointerdown',e=>e.stopPropagation());
  root.addEventListener('click',e=>{e.stopPropagation();if(e.target.closest('#stSkip'))end();else next();});
  document.addEventListener('keydown',e=>{if(!scene)return;if(['Space','Enter','Escape','ArrowRight'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)(e.code==='Escape'?end:next)();}},true);
  window.BeltStory={play,key,cancel,next,skip:end,scenes,get active(){return !!scene;}};
})();
