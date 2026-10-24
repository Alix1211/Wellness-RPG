function gaiaMiniAudioEditorFix(doc,game){
 const replace=(from,to)=>{if(!doc.includes(from))throw new Error('Mini patch anchor missing: '+from.slice(0,70));doc=doc.replace(from,to);};
 if(game==='squat'){
  replace('({1:2.1,2:1.45,3:1.35}[TIER]||1.35)','({1:3.6,2:3.2,3:3.0}[TIER]||3.0)');
  replace('({1:10.5,2:6.25,3:4.3}[TIER]||4.3)','({1:2.7,2:2.1,3:.55}[TIER]||.55)');
  replace('shot(name,0,vol);','shot(name,0,vol*.5);');
  replace('shot(PERFECTS[i],0,.36)','shot(PERFECTS[i],0,.18)');
 }
 if(game==='cylinder'){
  replace('function decode(id,url){','window.CylinderCustomArt=new Set();function decode(id,url){');
  replace('images[id]=im;ok();','images[id]=im;window.CylinderCustomArt.add(id);window.MEDIA_BACKGROUND=!images.bg;ok();');
  replace('loadArt();requestAnimationFrame(tick);','window.CylinderArtReady=loadArt();requestAnimationFrame(tick);');
  replace('if(v.src&&imgs&&imgs[id]?.src!==v.src){','if(v.src&&imgs&&!window.CylinderCustomArt?.has(id)&&imgs[id]?.src!==v.src){');
  replace('delete images[id];Q(\'#notice\').textContent=\'기본 그림으로 되돌렸습니다.\';',"delete images[id];window.CylinderCustomArt.delete(id);window.MEDIA_BACKGROUND=!images.bg;window.SceneEditor?.apply(window.CasualImageEditor.merge(window.GAME_SCENE.layout,window.CASUAL_MEDIA_RECORD?.layout||{}),false);Q('#notice').textContent='기본 그림으로 되돌렸습니다.';");
  const css='<style id="gaia-cylinder-settings-visible">html body #settings:not([hidden]){display:flex!important;position:absolute!important;inset:5%!important;max-height:90%;overflow:auto;box-sizing:border-box;z-index:1001!important}html body #settings[hidden]{display:none!important}html body #settings input,html body #settings select{max-width:100%;box-sizing:border-box}</style>';
  doc=doc.includes('</head>')?doc.replace('</head>',css+'</head>'):doc.replace('<html lang="ko">','<html lang="ko">'+css);
 }
 return doc;
}
