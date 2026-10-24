(()=>{
 const B=window.GaiaBridge;if(!B)return;
 const key='gaia-pingpong-champion-items-v1',prefix='gaia-pingpong-';
 const nativeSet=Storage.prototype.setItem,nativeRemove=Storage.prototype.removeItem;
 window.GAIA_NATIVE_GATE=true;window.GAIA_NATIVE_DIRTY=false;
 window.GaiaRawStorage={set:(k,v)=>nativeSet.call(localStorage,k,v),remove:k=>nativeRemove.call(localStorage,k)};
 try{
  const mirrored=JSON.parse(B.load()||'{}'),main=mirrored[key];
  if(main){const parsed=JSON.parse(main);let local=null;try{local=JSON.parse(localStorage.getItem(key))}catch{}
   if(parsed.version===2&&parsed.gear&&parsed.stats&&(!local||!local.gear||Number(parsed.t||0)>=Number(local.t||0)))for(const [k,v]of Object.entries(mirrored))if(k.startsWith(prefix)&&typeof v==='string')nativeSet.call(localStorage,k,v);}
  const snapshot={};for(const k of Object.keys(localStorage))if(k.startsWith(prefix))snapshot[k]=localStorage.getItem(k);if(snapshot[key]&&B.reconcileLocal)B.reconcileLocal(JSON.stringify(snapshot));
 }catch{}
 Storage.prototype.setItem=function(k,v){if(this===localStorage&&String(k).startsWith(prefix)){
   if(window.GAIA_NATIVE_GATE){window.GAIA_NATIVE_DIRTY=true;return;}
   nativeSet.call(this,k,v);try{B.put(String(k),String(v))}catch{};return;
  }return nativeSet.call(this,k,v)};
 Storage.prototype.removeItem=function(k){if(this===localStorage&&String(k).startsWith(prefix)){if(window.GAIA_NATIVE_GATE)return;nativeRemove.call(this,k);try{B.del(String(k))}catch{};return}return nativeRemove.call(this,k)};
})();
