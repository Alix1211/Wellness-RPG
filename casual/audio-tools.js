(()=>{'use strict';
const prepared={},played={},failures=[],seen=new WeakMap();
function prepare(buffer,name){if(!buffer)return buffer;if(seen.has(buffer))return seen.get(buffer);if(!/^(hit_|reaction_|tap_mix_|perfect_|normal$|homerun$|miss$)/.test(name)||buffer.duration>6)return buffer;
 let peak=0,energy=0;const channels=[];for(let c=0;c<buffer.numberOfChannels;c++){const a=buffer.getChannelData(c);channels.push(a);for(let i=0;i<a.length;i++){peak=Math.max(peak,Math.abs(a[i]));energy+=a[i]*a[i];}}
 const threshold=Math.max(.004,peak*.04);let first=buffer.length;for(const a of channels){for(let i=0;i<first;i++)if(Math.abs(a[i])>=threshold){first=i;break;}}
 const offset=Math.max(0,first/buffer.sampleRate-.012);let result=buffer;
 if(offset>.025&&offset<Math.min(2,buffer.duration-.03)){try{const start=Math.floor(offset*buffer.sampleRate);result=new AudioBuffer({length:buffer.length-start,numberOfChannels:buffer.numberOfChannels,sampleRate:buffer.sampleRate});for(let c=0;c<channels.length;c++)result.copyToChannel(channels[c].subarray(start),c);}catch(e){failures.push(String(e));}}
 prepared[name]={original:buffer.duration,trim:result===buffer?0:offset,duration:result.duration,peak,rms:Math.sqrt(energy/(buffer.length*buffer.numberOfChannels))};seen.set(buffer,result);seen.set(result,result);return result;}
function note(name,volume){played[name]=(played[name]||0)+1;}
window.GaiaAudioTools={prepare,note,get diagnostics(){return{prepared:{...prepared},played:{...played},errors:[...failures]}}};
})();
