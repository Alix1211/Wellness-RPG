/* Shared runtime and simulation rules. Values are this build's tunable playtest defaults. */
(function(root){'use strict';
const R={slots:16,night:10,jobOpen:50,jobClose:45,homeOpen:80,homeClose:75,registration:240,weeklyFee:120,normalHP:12,nightHP:14,workPay:96};
const keys=['ki','um','bo','ge'],clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),round=v=>Math.round(v*100)/100;
const average=s=>keys.reduce((n,k)=>n+(+s.stats[k]||0),0)/4;
function fresh(){return {version:1,registered:false,opening:false,married:false,partner:null,jobLocked:false,homeLocked:false,recovery:{day:1,count:0},worked:0,trained:0,trainingLog:{},days:[],events:[],questsDone:0,nightMode:false};}
function setup(s,isNew){s.living={...fresh(),...s.living};s.living.trainingLog||={};s.living.events||=[];s.living.days||=[];if(isNew){s.gold=-120;s.debt=120;s.slot=0;s.day=1;}else if(!s.living.migrated){s.living.registered=true;s.living.opening=true;}s.living.migrated=true;s.debt=Math.max(0,-s.gold);return s;}
function gates(s){const l=s.living,a=average(s);if(s.employed)l.jobLocked=l.jobLocked?a<R.jobOpen:a<R.jobClose;else l.jobLocked=false;if(l.married)l.homeLocked=l.homeLocked?a<R.homeOpen:a<R.homeClose;else l.homeLocked=false;return {company:!s.employed||!l.jobLocked,home:!l.married||!l.homeLocked};}
function nightly(s){return s.slot>=R.night;}
function nextDay(s){const l=s.living,before={...s.stats};for(const k of keys)s.stats[k]=round(clamp(s.stats[k]-(4+s.stats[k]*.12),0,100));s.day++;l.nightMode=false;l.recovery={day:s.day,count:0};if(l.registered&&!s.employed&&(s.day-1)%7===0)s.gold-=R.weeklyFee;l.days.unshift({day:s.day,before,after:{...s.stats},gold:s.gold});l.days=l.days.slice(0,30);gates(s);}
function advance(s,n=1){let days=0;s.slot+=n;while(s.slot>=R.slots){s.slot-=R.slots;nextDay(s);days++;}s.debt=Math.max(0,-s.gold);gates(s);return days;}
const up={0:{ge:10,bo:3,ki:2,um:2},1:{um:10,ki:3,ge:2,bo:2},2:{ki:10,ge:3,bo:2,um:2},3:{bo:10,um:3,ki:2,ge:2},4:{ge:8,bo:6,um:3,ki:2},5:{bo:10,ki:3,ge:2,um:2},water:{um:10,ge:3,ki:2,bo:2},rope:{ki:7,bo:7,ge:3,um:2},cylinder:{um:8,ki:6,bo:3,ge:2}};
function gain(s,game,ratio,success,night){const delta={},l=s.living,mult=night?2:1,quality=success?.75+clamp(ratio,0,1)*.25:.22;for(const[k,v]of Object.entries(up[game]||{})){const old=s.stats[k];s.stats[k]=round(clamp(old+v*quality*mult,0,100));delta[k]=round(s.stats[k]-old);}l.trained++;l.trainingLog[game]=(l.trainingLog[game]||0)+1;gates(s);return delta;}
function recovery(s,hp,mp){const l=s.living;if(l.recovery.day!==s.day)l.recovery={day:s.day,count:0};const amount=[40,25,12][Math.min(l.recovery.count++,2)];return {hp:Math.min(100,hp+amount),mp:Math.min(100,mp+Math.ceil(amount/2)),amount};}
function access(s,id){gates(s);if(id==='company'&&s.employed&&s.living.jobLocked)return {ok:false,why:'출근 보류 · 평균 50까지 재훈련'};if(id==='family'&&(!s.living.married||s.living.homeLocked))return {ok:false,why:s.living.married?'귀가 보류 · 평균 80까지 재훈련':'결혼 후 열리는 집'};return {ok:true};}
const api={R,keys,average,fresh,setup,gates,nightly,advance,gain,recovery,access};root.GaiaLife=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
