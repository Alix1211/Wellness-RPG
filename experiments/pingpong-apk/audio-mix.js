function gaiaInstallAudioMix(){
 if(window.GaiaAudioMix)return;
 let root=null;try{if(parent!==window)root=parent.GaiaAudioMix}catch{}
 const key='gaia-pingpong-champion-items-v1-settings';let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
 let values={music:Number.isFinite(saved.musicVolume)?saved.musicVolume:1,effects:Number.isFinite(saved.effectsVolume)?saved.effectsVolume:1,muted:!!saved.muted};
 const buffers=new WeakMap(),routeMap=new WeakMap(),routes=new Set(),media=new Map(),children=new Set();
 const current=()=>root?root.values:values;
 const level=kind=>{const v=current();return v.muted?0:Math.max(0,Math.min(1,Number(v[kind])||0))};
 function kind(name){return /(?:bgm|music|background_music)/i.test(name||'')?'music':'effects'}
 function tagBuffer(buffer,name){if(buffer&&typeof buffer==='object')buffers.set(buffer,kind(name));return buffer}
 function wrapTools(tools){if(tools&&typeof tools.prepare==='function'&&!tools.__gaiaMix){const prepare=tools.prepare;tools.prepare=function(buffer,name,...args){const result=prepare.call(this,buffer,name,...args);return result?.then?result.then(b=>tagBuffer(b,name)):tagBuffer(result,name)};tools.__gaiaMix=true}return tools}
 try{let tools=wrapTools(window.GaiaAudioTools);Object.defineProperty(window,'GaiaAudioTools',{configurable:true,get:()=>tools,set:v=>{tools=wrapTools(v)}})}catch{}
 function sourceKind(source){return buffers.get(source.buffer)||'effects'}
 const Node=window.AudioNode,Source=window.AudioScheduledSourceNode;
 if(Node&&Source){const connect=Node.prototype.connect,disconnect=Node.prototype.disconnect;
  Node.prototype.connect=function(...args){
   if(!(this instanceof Source))return connect.apply(this,args);
   let route=routeMap.get(this);if(!route){const source=this,gain=source.context.createGain();route={source,gain};routeMap.set(source,route);routes.add(route);gain.gain.value=level(sourceKind(source));connect.call(source,gain);
    source.addEventListener('ended',()=>{routes.delete(route);routeMap.delete(source);try{disconnect.call(gain)}catch{}},{once:true});
   }
   return connect.apply(route.gain,args);
  };
  Node.prototype.disconnect=function(...args){const route=routeMap.get(this);if(!route)return disconnect.apply(this,args);if(args.length)return disconnect.apply(route.gain,args);routes.delete(route);routeMap.delete(this);try{disconnect.call(route.gain)}catch{}return disconnect.call(this)};
  for(const Type of [window.AudioBufferSourceNode,window.OscillatorNode])if(Type){const start=Type.prototype.start;Type.prototype.start=function(...args){const route=routeMap.get(this);if(route)route.gain.gain.value=level(sourceKind(this));return start.apply(this,args)}}
 }
 const Media=window.HTMLMediaElement,volume=Media&&Object.getOwnPropertyDescriptor(Media.prototype,'volume');
 function mediaKind(el){const explicit=media.get(el)?.kind;if(explicit)return explicit;return el.loop||/(?:bgm|music)/i.test(el.id||'')?'music':'effects'}
 function scaleMedia(el){if(!volume)return;const data=media.get(el);if(data)try{volume.set.call(el,data.base*level(mediaKind(el)))}catch{}}
 if(volume?.get&&volume?.set&&volume.configurable){Object.defineProperty(Media.prototype,'volume',{configurable:true,enumerable:volume.enumerable,get(){return media.get(this)?.base??volume.get.call(this)},set(value){const base=Math.max(0,Math.min(1,Number(value)));if(!Number.isFinite(base))return;const data=media.get(this)||{};data.base=base;media.set(this,data);scaleMedia(this)}});
  const play=Media.prototype.play;Media.prototype.play=function(...args){if(!media.has(this))media.set(this,{base:volume.get.call(this)});scaleMedia(this);return play.apply(this,args)};
 }
 function update(){for(const route of routes)route.gain.gain.value=level(sourceKind(route.source));for(const el of media.keys())scaleMedia(el);for(const child of children)try{child.update()}catch{children.delete(child)}}
 const api={get values(){return{...current()}},tagBuffer,tagMedia(el,channel){const data=media.get(el)||{base:volume?.get.call(el)??1};data.kind=channel;media.set(el,data);scaleMedia(el)},update,
  configure(next){if(root)return root.configure(next);values={...values,...next};update()},
  register(child){children.add(child)},unregister(child){children.delete(child)},
  status(){return{values:current(),sources:[...routes].map(r=>({kind:sourceKind(r.source),gain:r.gain.gain.value})),media:[...media].map(([el,data])=>({kind:mediaKind(el),base:data.base,actual:volume.get.call(el)}))}}
 };
 window.GaiaAudioMix=api;if(root)root.register(api);
 addEventListener('pagehide',()=>{if(root)root.unregister(api);routes.clear();media.clear()});
}
gaiaInstallAudioMix();
