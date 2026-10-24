(()=>{
 const B=window.GaiaBridge;if(!B)return;
 const originalSave=save;let lastSignature='',gateTimer=null,conflict=false,autoPaused=null,nativeSettings=false;
 function signature(){const copy=JSON.parse(JSON.stringify(state));delete copy.t;if(copy.career)delete copy.career.seconds;return JSON.stringify(copy)}
 try{lastSignature=signature()}catch{}
 save=function(){if(window.GAIA_NATIVE_GATE){window.GAIA_NATIVE_DIRTY=true;return;}
  const next=signature();if(next!==lastSignature||!Number.isSafeInteger(state.t)){state.t=Math.max(Date.now(),(Number(state.t)||0)+1);lastSignature=next;}
  originalSave();
 };
 window.GaiaNativeFlush=()=>{save();if(!window.GAIA_NATIVE_GATE)try{B.put(SAVE_KEY+'-settings',JSON.stringify(settings))}catch{}};
 let lastHit=0;
 window.GaiaNativeHit=type=>{if(settings.vibration===false)return;const now=performance.now();if(now-lastHit<80)return;let pattern=type==='playerHit'?'35':type==='serve'?'25':type==='pointLost'?'65':type==='fanfare'?'25,30,25':null;if(!pattern)return;lastHit=now;try{B.vibrate(pattern)}catch{}};
 function pauseForNative(){if(activeGame&&$('#overlay').hidden){autoPaused=activeGame.token;pauseGame()}}
 function resumeNative(){if(autoPaused&&activeGame?.token===autoPaused){resumeGame()}autoPaused=null;}
 function gate(value){window.GAIA_NATIVE_GATE=value;
  if(value){pauseForNative();if(!document.querySelector('#gaia-native-gate'))document.body.insertAdjacentHTML('beforeend','<div id="gaia-native-gate" style="position:fixed;inset:0;z-index:100000;background:#4c294c88;display:grid;place-items:center;color:white;font:16px sans-serif"><span style="padding:20px;background:#845f80;border-radius:20px">저장 확인 중…</span></div>');}
  else{document.querySelector('#gaia-native-gate')?.remove();resumeNative();if(window.GAIA_NATIVE_DIRTY){window.GAIA_NATIVE_DIRTY=false;save();}GaiaNativeFlush();}
 }
 window.onGaiaSyncStart=()=>{clearTimeout(gateTimer);gate(true);gateTimer=setTimeout(()=>{if(!conflict)window.onGaiaSyncDone()},20000)};
 window.onGaiaSyncDone=()=>{if(conflict)return;clearTimeout(gateTimer);gate(false);refresh()};
 window.onGaiaBackup=()=>refresh();
 window.onGaiaBackupFail=message=>{try{B.cancelRestore()}catch{}window.onGaiaSyncDone();toast(message||'저장을 확인하지 못했습니다.')};
 function valid(text){const all=typeof text==='string'?JSON.parse(text):text;if(!all||Array.isArray(all)||Object.entries(all).some(([k,v])=>!k.startsWith('gaia-pingpong-')||typeof v!=='string'))throw Error('형식');const s=JSON.parse(all[SAVE_KEY]);validate(s);if(!s.gear||!Number.isSafeInteger(s.t)||s.t<0)throw Error('저장');return all}
 window.onGaiaBackupApplied=text=>{try{const all=valid(text);window.GAIA_NATIVE_GATE=true;for(const k of Object.keys(localStorage))if(k.startsWith('gaia-pingpong-'))GaiaRawStorage.remove(k);for(const[k,v]of Object.entries(all))GaiaRawStorage.set(k,v);location.reload()}catch{window.onGaiaBackupFail('호환되는 탁구 저장이 아닙니다.')}};
 function progress(text){try{const s=JSON.parse(valid(text)[SAVE_KEY]);return['동네','국내','국제'][s.region]+' · '+s.turn+'턴 · Lv.'+(s.career?.level||1)+' · 코인 '+(s.gear?.coins||0)+' · 장비 '+(s.gear?.items?.length||0)}catch{return '읽을 수 없는 저장'}}
 window.onGaiaSyncConflict=(remote,local)=>{
  clearTimeout(gateTimer);conflict=true;window.GAIA_NATIVE_GATE=true;document.querySelector('#gaia-native-gate')?.remove();pauseForNative();
  const node=document.createElement('div');node.id='gaia-native-conflict';node.style.cssText='position:fixed;inset:0;z-index:100001;background:#4b254b99;display:grid;place-items:center';
  node.innerHTML='<div style="max-width:min(90vw,520px);padding:24px;border-radius:24px;background:#fff0e6;color:#683d59;font:15px/1.7 sans-serif"><h3>어느 진행으로 이어갈까요?</h3><p>드라이브: <b id="gn-remote"></b></p><p>이 기기: <b id="gn-local"></b></p><button id="gn-use-remote">드라이브 진행으로 이어서 하기</button><button id="gn-use-local">이 기기 진행으로 파일 덮어쓰기</button></div>';
  document.body.append(node);node.querySelector('#gn-remote').textContent=progress(remote);node.querySelector('#gn-local').textContent=progress(local);
  for(const [selector,useFile]of [['#gn-use-remote',true],['#gn-use-local',false]])node.querySelector(selector).onclick=()=>{if(!confirm(useFile?'드라이브 진행을 적용할까요? 이 기기 진행은 바뀝니다.':'이 기기 진행으로 드라이브 파일을 덮어쓸까요?'))return;node.remove();conflict=false;try{B.resolveConflict(useFile)}catch{window.onGaiaSyncDone()}};
 };
 function refresh(){const el=document.querySelector('#gaia-native-status');if(!el)return;try{const s=JSON.parse(B.backupStatus()||'{}');el.textContent=(s.linked?'파일 연결됨':'파일 연결 안 됨')+(s.syncing?' · 동기화 중':s.error?' · 동기화 대기':'')+(s.at?' · '+new Date(s.at).toLocaleString():'')}catch{el.textContent='기기 저장 사용 중'}}
 const previousSettings=settingsModal;
 settingsModal=function(){previousSettings();const m=$('#overlay .modal');m.insertAdjacentHTML('beforeend','<div class="settings-row"><span>진동</span><button data-action="native-vibration">'+(settings.vibration===false?'꺼짐':'켜짐')+'</button></div><h3>기기 간 세이브</h3><p id="gaia-native-status" class="notice"></p><div class="actions"><button data-action="native-link">드라이브 파일 연결</button><button class="secondary" data-action="native-sync">지금 동기화</button></div>');refresh()};
 window.GaiaNativeSettings=()=>{pauseForNative();nativeSettings=true;settingsModal()};
 window.GaiaNativeBack=()=>{if(conflict||window.GAIA_NATIVE_GATE)return true;if(!$('#overlay').hidden){if(activeGame)resumeGame();else closeModal();nativeSettings=false;autoPaused=null;return true;}if(activeGame){pauseGame();return true}return false};
 window.GaiaNativeLifecycle=value=>{if(value){pauseForNative();GaiaNativeFlush()}else if(!window.GAIA_NATIVE_GATE&&!nativeSettings)resumeNative()};
 document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action;
  if(a==='native-vibration'){e.preventDefault();e.stopImmediatePropagation();settings.vibration=settings.vibration===false;try{localStorage.setItem(SAVE_KEY+'-settings',JSON.stringify(settings));if(settings.vibration)B.vibrate('30');else B.vibrate('0')}catch{}settingsModal();}
  else if(a==='native-link'){e.preventDefault();e.stopImmediatePropagation();GaiaNativeFlush();B.pickBackup()}
  else if(a==='native-sync'){e.preventDefault();e.stopImmediatePropagation();GaiaNativeFlush();B.syncBackup()}
  else if(a==='close'&&nativeSettings){e.preventDefault();e.stopImmediatePropagation();nativeSettings=false;if(autoPaused)resumeNative();else closeModal()}
 },true);
 window.GAIA_NATIVE_GATE=true;window.GAIA_NATIVE_DIRTY=true;window.onGaiaSyncStart();try{B.webReady()}catch{window.onGaiaSyncDone()}
})();
