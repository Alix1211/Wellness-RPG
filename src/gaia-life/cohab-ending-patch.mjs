import {COHAB_DATA} from './cohab-ending-data.mjs';

// Apply only after the original, user-supplied LIVING-CORRIDORS updates.
// Original dialogue, ambient monologues and quest pacing stay untouched.
export const COHAB_REPLACEMENTS=[
 ['const L=GaiaLife;','const L=GaiaLife;\n/* GAIA_COHAB_RUNTIME */'],
 ['if(!L.length)return;const ms=castManSrc(name);','if(!L.length)return;gaiaTrackTalk(name,L);const ms=castManSrc(name);'],
 ['lineIndex=0;$(\'#femalePortrait\').src=','if(options.castPerson)gaiaTrackTalk(options.castPerson,currentLines);lineIndex=0;$(\'#femalePortrait\').src='],
 ["$('#roomScene').classList.toggle('solo-home',soloHome());currentLines=", "$('#roomScene').classList.toggle('solo-home',soloHome()&&!options.lines);currentLines="],
 ["function livingGoal(){if(!life.living.registered)return '센터 로비에서 접수';if(!life.employed)return '취업 준비 · 평균 '+average().toFixed(0)+' / 50';if(life.living.jobLocked)return '재훈련 · 평균 50으로 출근 재개';if(!life.living.married)return '생활 중 · 평균 80이면 공원에서 만남';if(life.living.homeLocked)return '재훈련 · 평균 80으로 귀가 재개';return '출근 · 훈련 · 둘만의 생활';}", "function livingGoal(){if(!life.living.registered)return '센터 로비에서 접수';if(!life.employed)return '취업 준비 · 평균 '+average().toFixed(0)+' / 50';if(life.living.jobLocked)return '재훈련 · 평균 50으로 출근 재개';return gaiaNewGoal();}"],
 ["if(r.kind==='park'&&average()>=80&&!life.living.married)add('! 기다리는 사람',meetPartner);",'/* The former instant park marriage is disabled; the full cohabitation arc replaces it. */'],
 ["if(r.kind==='park'&&life.living.married&&L.nightly(life)){", "if(r.kind==='park'&&life.living.married&&L.nightly(life)&&!gaiaState().husband){"],
 [' const active=QUESTS.find(q=>q.id===life.active),p=active&&life.quests[active.id];',' gaiaHomeServices(r,add);\n const active=QUESTS.find(q=>q.id===life.active),p=active&&life.quests[active.id];'],
 ["function qGate(q){const st=life.stats;if(q.locked)","function qGate(q){const st=life.stats;if(q.id==='Q30'&&(life.day%7!==0||life.slot<5||life.slot>=12))return false;if(q.locked)"],
 ["function accessDestination(id){const a=L.access(life,id);if(!a.ok)toast(a.why);return a;}","function accessDestination(id){const a=id==='family'&&life.living.cohab&&!life.living.homeLocked?{ok:true}:L.access(life,id);if(!a.ok){if(id==='family')gaiaLockMessage();else toast(a.why);}return a;}"],
 ["||r.kind==='park'&&!life.living.married&&average()>=80;",';'],
];

function one(src,before,after){
 const first=src.indexOf(before);
 if(first<0||src.indexOf(before,first+before.length)>=0)throw Error('Cohab patch source drift: '+before.slice(0,85));
 return src.slice(0,first)+after+src.slice(first+before.length);
}

export function fixCohabEnding(html,runtime){
 if(typeof runtime!=='string'||!runtime.includes('function gaiaPropose('))throw Error('cohab runtime missing');
 const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script\s*>/g)];
 if(scripts.length!==25)throw Error('LIVING-CORRIDORS script layout changed: '+scripts.length);
 const m=scripts[18],src=m[2];
 let patched=src;
 for(const [before,after] of COHAB_REPLACEMENTS)patched=one(patched,before,after);
 const data=JSON.stringify(COHAB_DATA).replace(/<\/script/gi,'<\\/script');
 patched=one(patched,'/* GAIA_COHAB_RUNTIME */','const COHAB_DATA='+data+';\n'+runtime);
 return html.slice(0,m.index+m[0].indexOf(src))+patched+html.slice(m.index+m[0].indexOf(src)+src.length);
}
