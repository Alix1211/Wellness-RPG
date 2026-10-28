// 공통 음량 설정. 세이브와 별도 보관하며 설정 조작은 일시정지를 해제하지 않는다.
(function(){
  const KEY='gaia_beltscroll_settings_v1';
  const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:1));
  let saved={};try{saved=JSON.parse(localStorage.getItem(KEY))||{};}catch{}
  const values={music:clamp(saved.music),effects:clamp(saved.effects)};
  window.GaiaSettings=values;
  function save(){try{localStorage.setItem(KEY,JSON.stringify(values));}catch{}}
  for(const [key,id,out] of [['music','musicVolume','musicPercent'],['effects','effectsVolume','effectsPercent']]){
    const el=document.getElementById(id),label=document.getElementById(out);
    function sync(){el.value=Math.round(values[key]*100);label.textContent=el.value+'%';}
    sync();el.addEventListener('input',()=>{values[key]=clamp(Number(el.value)/100);sync();save();window.AlleyAudio?.setLevels();});
  }
  const vib=document.getElementById('vibrationToggle'),status=document.getElementById('vibrationStatus');
  function syncVib(){vib.checked=window.GAIA_HAPTICS?.enabled!==false;status.textContent=vib.checked?'켜짐':'꺼짐';}
  syncVib();vib.addEventListener('change',()=>{window.GAIA_HAPTICS?.setEnabled(vib.checked);syncVib();});
})();
