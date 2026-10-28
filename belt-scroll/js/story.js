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
  function stopTyping(){clearInterval(timer);timer=null;}
  function show(){
    stopTyping();const l=scene.lines[index],c=scene.ctx,speaks=l.who==='hero';
    hero.src=c.hero||'assets/ui/rosie-portrait.jpg';hero.classList.toggle('dim',!speaks);
    const firstActor=scene.lines.find(x=>x.actor)?.actor;
    const actorId=speaks?(scene.lastActor||firstActor):l.actor;
    if(!speaks&&l.actor)scene.lastActor=l.actor;
    const actor=(actorId&&(c.actors?.[actorId]||window.BeltDialogue.actors[actorId]))||c;
    if(actor.portrait){npc.src=actor.portrait;npc.hidden=false;}else{npc.removeAttribute('src');npc.hidden=true;}
    npc.classList.toggle('dim',speaks);$('stNpcLabel').textContent=actor.name||'';
    $('stName').textContent=speaks?'로지':(l.name||actor.name||'상대');$('stName').className=speaks?'hero':'npc';
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
    queue.push({lines:lines.slice(),ctx:ctx||{},done});if(!scene)take();
  }
  function cancel(){stopTyping();queue.length=0;scene=null;root.classList.add('hidden');hero.removeAttribute('src');npc.removeAttribute('src');}
  root.addEventListener('pointerdown',e=>e.stopPropagation());
  root.addEventListener('click',e=>{e.stopPropagation();if(e.target.closest('#stSkip'))end();else next();});
  document.addEventListener('keydown',e=>{if(!scene)return;if(['Space','Enter','Escape','ArrowRight'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)(e.code==='Escape'?end:next)();}},true);
  window.BeltStory={play,key,cancel,next,skip:end,scenes,get active(){return !!scene;}};
})();
