window.GaiaCampaign=(()=>{
 const regions={warehouse:{name:'뒷골목',stages:[1,2]},club:{name:'클럽',stages:[3,4]},farm:{name:'농장',stages:[5,6]},hotel:{name:'호텔',stages:[7,8]},studio:{name:'영화촬영소',stages:[9,10]},district:{name:'환락가',stages:[11,12]},park:{name:'공원',stages:[13]},casino:{name:'카지노',stages:[14]}};
 const stages={};for(const [id,r] of Object.entries(regions))r.stages.forEach((n,i)=>stages[n]={id:n,region:id,name:r.name,route:i+1,bg:n===1?'alley_a':n===2?'alley_b':n===3?'club_a':n===4?'club_b':id+'_'+(i?'b':'a'),arena:n===2?'alleyBoss':n===4?'club_arena':n<=4?null:id+'_arena',hpScale:n<=4?1:id==='farm'?1.04:id==='hotel'?1.08:id==='studio'?1.10:id==='district'?1.14:1,event:id==='park'});stages[13].arena='park_b';Object.assign(stages[14],{bg:'hotel_b',arena:'hotel_arena',entry:'casino_entry'}); // 카지노 전투 배경은 호텔 그림 임시 사용
 
 const boss=(name,hp,attack,speed,drawH,reach,spacing,telegraph,interval,pattern,art,extra={})=>({name,hp,attack,speed,drawH,reach,spacing,telegraph,interval,style:pattern[0],pattern,boss:true,regional:true,frames:[art+'_idle',art+'_attack'],reward:100,...extra});
 const types={
 scientist:boss('연구소장',290,9,76,214,150,106,.95,2.35,['spray','bottle','spray'],'scientist',{name:'연구소장',keep:270}),
 farmer:boss('농장주',470,14,67,270,174,110,.95,2.35,['rake','stomp','rush'],'farmer'),
 mafiaA:boss('마피아 사수',125,7,80,204,85,75,.95,2.9,['bullet'],'mafiaA',{frames:['mafiaA_idle'],keep:300,reward:35}),
 mafiaB:boss('마피아 사수',150,8,59,214,85,75,1.05,3.2,['bullet'],'mafiaB',{frames:['mafiaB_idle'],keep:270,reward:35}),
 mafiaC:boss('마피아 사수',120,7,89,202,85,75,.90,3.1,['bullet'],'mafiaC',{frames:['mafiaC_idle'],keep:325,reward:35}),
 mafiaD:boss('마피아 사수',140,9,70,210,85,75,1.15,3.4,['bullet'],'mafiaD',{frames:['mafiaD_idle'],keep:290,reward:35}),
 mafiaBoss:boss('호텔 마피아 보스',560,14,49,278,160,105,1.08,2.6,['womanThrow','bullet','rush','womanThrow'],'mafiaBoss',{keep:260,reward:180}),
 director:boss('촬영감독',330,10,89,216,146,96,.92,2.6,['megaphone','clapper','callCrew'],'director'),
 heiress:boss('제작사 회장',290,10,82,211,145,95,.90,2.35,['handbag','banknotes','callCrew'],'heiress',{keep:250}),
 host:boss('숨은 실세',510,13,118,226,174,110,.85,2.15,['cane','heartShot','rush'],'host',{keep:265,reward:180}),
 pimp:boss('환락가 업주',430,13,74,258,158,105,.95,2.5,['baton','contract','callCrew'],'pimp',{keep:250}),
 studentBoss:boss('웃는 남자',650,15,117,223,173,108,.88,2.05,['cleaver','feint','rush','cleaverFan'],'studentBoss',{keep:255,reward:200})};return {regions,stages,types};
})();
