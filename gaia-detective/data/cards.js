// 카드 데이터 — 1막 25종 + 토큰. 그림은 assets/gaia-detective/cards/<id>.webp 가 있으면 자동 표시.
// ops: dmg / block / draw / dopa / tight / lube / hpLoss / heal / weak / vuln / bind / disgust / enemyStrDown / overclock
window.GAIA = window.GAIA || {};
(function () {
  const L = [
    { id:'C01', no:1,  name:'엉덩이 대주기',     grade:'기본', cost:1, type:'공격', folder:'경찰관', ops:[{op:'dmg',n:6},{op:'dopa',n:5}], text:'적에게 6 피해. 도파민 +5.', line:'주인님, 제 둔부를 가차 없이 후려쳐 주시겠습니까?' },
    { id:'C02', no:2,  name:'다리 활짝 벌리기',   grade:'기본', cost:1, type:'스킬', folder:'경찰관', ops:[{op:'block',n:6},{op:'tight',n:2}], text:'방어도 6. 조임력 +2.', line:'속살까지 다 보이도록 M자로 찢어둘 테니 마음껏 관통하십시오!' },
    { id:'C03', no:3,  name:'0.1초 호흡 정돈',    grade:'기본', cost:0, type:'스킬', folder:'경찰관', ops:[{op:'block',n:4},{op:'draw',n:1}], exhaust:true, text:'방어도 4. 카드 1장 드로우. 소멸.', line:'후- 하. 맥박 리셋 완료했습니다. 계속 수사 진행하시죠.' },
    { id:'C04', no:4,  name:'경찰봉 대신 자지 물기', grade:'기본', cost:2, type:'공격', folder:'경찰관', ops:[{op:'dmg',n:11},{op:'weak',n:1}], text:'적에게 11 피해. 약화 1.', line:'흐읍, 츱…… 목구멍 끝까지 삼켜서 좆물을 다 짜내 드리겠습니다!' },
    { id:'C05', no:5,  name:'치마 걷어 올리기',   grade:'일반', cost:1, type:'스킬', folder:'뒷골목', ops:[{op:'dopa',n:20},{op:'lube',n:20}], text:'도파민 +20. 윤활도 +20.', line:'치마를 완전히 깠으니 어디든 마음껏 찔러 넣어 주십시오!' },
    { id:'C06', no:6,  name:'뺨따귀 갈증',       grade:'일반', cost:0, type:'스킬', folder:'뒷골목', ops:[{op:'hpLoss',n:3},{op:'dopa',n:20},{op:'draw',n:1}], exhaust:true, text:'체력 3 손실. 도파민 +20. 카드 1장 드로우. 소멸.', line:'철썩-! 이빨이 흔들리게 더 쳐주십시오! 머리가 하얘집니다!' },
    { id:'C07', no:7,  name:'체액 윤활 슬라이딩', grade:'일반', cost:1, type:'공격', folder:'클럽', lubeCost:20, ops:[{op:'dmg',n:10}], text:'윤활도 20 소모. 적에게 10 피해.', line:'흘러넘치는 씹물로 바닥을 미끄러지며 안쪽으로 파고들어도 되겠습니까?' },
    { id:'C08', no:8,  name:'가랑이 매달리기',    grade:'일반', cost:1, type:'스킬', folder:'뒷골목', ops:[{op:'block',n:6},{op:'bind'}], text:'방어도 6. 봉쇄.', line:'도망치지 마시고 제 젖은 얼굴을 발로 짓밟아 주십시오!' },
    { id:'C09', no:9,  name:'감사 인사 연타',     grade:'일반', cost:1, type:'스킬', folder:'경찰관', ops:[{op:'block',n:6},{op:'disgust'}], exhaust:true, text:'방어도 6. 질림. 소멸.', line:'때려주셔서 감사합니다! 더 거칠게 짓밟아 주시길 간청드립니다!' },
    { id:'C10', no:10, name:'명기 괄약근 락',     grade:'일반', cost:1, type:'스킬', folder:'트레이닝', ops:[{op:'block',n:6},{op:'tight',n:3}], text:'방어도 6. 조임력 +3.', line:'안쪽 주름이 주인님의 살점을 꽉 물고 절대 안 놓아줍니다!' },
    { id:'C11', no:11, name:'음란한 도발',       grade:'일반', cost:1, type:'스킬', folder:'란제리', ops:[{op:'block',n:6},{op:'vuln',n:2}], text:'방어도 6. 취약 2.', line:'겨우 그 정도 물건으로 형사의 구멍을 길들이겠다고 으스대신 겁니까?' },
    { id:'C12', no:12, name:'란제리 수색 청원',   grade:'일반', cost:1, type:'스킬', folder:'란제리', ops:[{op:'block',n:7},{op:'lube',n:20}], text:'방어도 7. 윤활도 +20.', line:'겉옷을 벗고 레이스 속옷만 걸친 채로 증거를 수색해도 되겠습니까?' },
    { id:'C13', no:13, name:'유연한 골반 꺾기',   grade:'일반', cost:1, type:'스킬', folder:'트레이닝', ops:[{op:'block',n:7},{op:'tight',n:2}], text:'방어도 7. 조임력 +2.', line:'허리를 유연하게 꺾어 언제든 대기할 테니 골반을 부숴주십시오!' },
    { id:'C14', no:14, name:'제복 셔츠 찢기',     grade:'일반', cost:1, type:'공격', folder:'경찰관', ops:[{op:'dmg',n:7},{op:'dopa',n:10}], text:'적에게 7 피해. 도파민 +10.', line:'단추가 뜯겨 가슴이 다 드러났으니 젖꼭지를 비틀어 주시겠습니까?' },
    { id:'C15', no:15, name:'미란다 원칙 복창',   grade:'특별', cost:1, type:'공격', folder:'경찰관', ops:[{op:'dmg',n:6,ratioMult:{ratio:0.5,mult:2}}], text:'적에게 6 피해. 적 기력 50% 이하면 피해 2배.', line:'당신은 묵비권을…… 흐앙! 행사할 수 있으며…… 하아앗!' },
    { id:'C16', no:16, name:'스트립 댄서의 유혹', grade:'특별', cost:1, type:'스킬', folder:'스트립 댄서', ops:[{op:'weak',n:1,all:true},{op:'vuln',n:1,all:true}], text:'적 전체에게 약화 1, 취약 1.', line:'형사이기 전에 발정 난 암캐입니다…… 제 알몸을 감상해 주십시오!' },
    { id:'C17', no:17, name:'비너스 7호 자궁 쑤심', grade:'특별', cost:2, type:'공격', folder:'클럽', ops:[{op:'dmg',n:8,addTightHalf:true},{op:'tight',n:2}], text:'적에게 8 + (조임력의 절반) 피해. 조임력 +2.', line:'배 안쪽이 찢어질 것 같습니다! 자궁 입구까지 짓이겨주십시오!' },
    { id:'C18', no:18, name:'애널 비즈 역류 발사', grade:'특별', cost:1, type:'공격', folder:'클럽', ops:[{op:'dmg',n:9,all:true},{op:'tight',n:3}], text:'적 전체에게 9 피해. 조임력 +3.', line:'내장이 딸려 나오는 쾌락입니다! 뽑힌 비즈를 받아내십시오!' },
    { id:'C19', no:19, name:'소변 직수 음용',     grade:'특별', cost:1, type:'스킬', folder:'뒷골목', ops:[{op:'dopa',n:20},{op:'heal',n:5},{op:'draw',n:1}], exhaust:true, text:'도파민 +20. 체력 5 회복. 카드 1장 드로우. 소멸.', line:'꿀꺽, 읍……! 주인님의 뜨거운 오줌을 마시니 기운이 솟구칩니다!' },
    { id:'C20', no:20, name:'분수 역류 분사',     grade:'특별', cost:1, type:'공격', folder:'스트립 댄서', lubeCost:30, ops:[{op:'dmg',n:8,all:true},{op:'vuln',n:1,all:true}], text:'윤활도 30 소모. 적 전체에게 8 피해, 취약 1.', line:'터져 나오는 씹물 세례를 온몸으로 받아내 주시겠습니까 주인님!' },
    { id:'C21', no:21, name:'절정 분출 타격',     grade:'특별', cost:1, type:'공격', folder:'트레이닝', ops:[{op:'dmg',n:7,orgBonus:6}], text:'적에게 7 피해. [절정] 중이면 추가 6 피해.', line:'절정의 순간에 뿜어내는 괄약근의 압력을 맛보시겠습니까!' },
    { id:'C22', no:22, name:'바짓가랑이 애원',    grade:'특별', cost:0, type:'스킬', folder:'뒷골목', ops:[{op:'bind'},{op:'weak',n:1}], exhaust:true, text:'봉쇄. 약화 1. 소멸.', line:'바짓가랑이를 물고 늘어질 테니 도망치지 말고 자지를 박아주십시오!' },
    { id:'C23', no:23, name:'도파민 오버클럭',    grade:'희귀', cost:3, type:'파워', folder:'스트립 댄서', ops:[{op:'overclock'}], text:'피격될 때마다 [절정 유도]를 손패에 1장 생성 (턴당 최대 2장).', line:'아무리 쑤시고 패셔도 저는 죽지 않습니다. 더 황홀할 뿐이죠!' },
    { id:'C24', no:24, name:'무적의 형사 수갑',   grade:'희귀', cost:2, type:'스킬', folder:'경찰관', ops:[{op:'bind'},{op:'enemyStrDown',n:2}], exhaust:true, text:'봉쇄. 적의 힘 -2. 소멸.', line:'제 몸을 마음껏 유린하셨으니, 이제 얌전히 수갑을 차시겠습니까?' },
    { id:'C25', no:25, name:'구속영장 청구 타격', grade:'희귀', cost:2, type:'공격', folder:'경찰관', ops:[{op:'dmg',n:14,ratioMult:{ratio:0.3,mult:2}}], text:'적에게 14 피해. 적 기력 30% 이하면 피해 2배.', line:'체포 영장이 발부되었으니 남은 기력을 모조리 뽑아내 드리겠습니다!' },
    // ── C26~C50: 초안(케인 승인 대기). draft:true 는 개발 패널에서만 쓰고 보상 풀·덱에는 섞이지 않는다. 대사(line)는 아직 없음 ──
    { id:'C26', no:26, name:'불심검문',              grade:'일반', cost:1, type:'공격', folder:'경찰관', draft:true, ops:[{op:'dmg',n:8},{op:'dopa',n:3}], text:'적에게 8 피해. 도파민 +3.', line:'' },
    { id:'C27', no:27, name:'순찰 중 허벅지 훑기',    grade:'일반', cost:1, type:'스킬', folder:'경찰관', draft:true, ops:[{op:'block',n:5},{op:'draw',n:1}], text:'방어도 5. 카드 1장 드로우.', line:'' },
    { id:'C28', no:28, name:'현장 증거 압수',         grade:'일반', cost:1, type:'공격', folder:'경찰관', draft:true, ops:[{op:'dmg',n:7},{op:'vuln',n:1}], text:'적에게 7 피해. 취약 1.', line:'' },
    { id:'C29', no:29, name:'무전기 비명',            grade:'특별', cost:1, type:'스킬', folder:'경찰관', draft:true, ops:[{op:'weak',n:1,all:true},{op:'dopa',n:10}], text:'적 전체에게 약화 1. 도파민 +10.', line:'' },
    { id:'C30', no:30, name:'체포 직전 몸수색',       grade:'특별', cost:1, type:'공격', folder:'경찰관', draft:true, ops:[{op:'dmg',n:6,all:true},{op:'weak',n:1,all:true}], text:'적 전체에게 6 피해. 약화 1.', line:'' },
    { id:'C31', no:31, name:'순직 각오 돌격',         grade:'희귀', cost:2, type:'공격', folder:'경찰관', draft:true, ops:[{op:'dmg',n:18},{op:'hpLoss',n:5}], text:'적에게 18 피해. 체력 5 손실.', line:'' },
    { id:'C32', no:32, name:'골목 구석 웅크리기',     grade:'일반', cost:1, type:'스킬', folder:'뒷골목', draft:true, ops:[{op:'block',n:7},{op:'lube',n:10}], text:'방어도 7. 윤활도 +10.', line:'' },
    { id:'C33', no:33, name:'쓰레기통 뒤 숨 고르기',  grade:'일반', cost:0, type:'스킬', folder:'뒷골목', draft:true, exhaust:true, ops:[{op:'dopa',n:15},{op:'lube',n:10}], text:'도파민 +15. 윤활도 +10. 소멸.', line:'' },
    { id:'C34', no:34, name:'길바닥 포박 풀기',       grade:'특별', cost:1, type:'스킬', folder:'뒷골목', draft:true, exhaust:true, ops:[{op:'block',n:8},{op:'disgust'}], text:'방어도 8. 질림. 소멸.', line:'' },
    { id:'C35', no:35, name:'구겨진 지폐 한 장',      grade:'희귀', cost:0, type:'스킬', folder:'뒷골목', draft:true, exhaust:true, ops:[{op:'heal',n:6},{op:'draw',n:2}], text:'체력 6 회복. 카드 2장 드로우. 소멸.', line:'' },
    { id:'C36', no:36, name:'미러볼 아래 허리 돌리기', grade:'일반', cost:1, type:'공격', folder:'클럽', draft:true, ops:[{op:'dmg',n:9},{op:'lube',n:10}], text:'적에게 9 피해. 윤활도 +10.', line:'' },
    { id:'C37', no:37, name:'VIP 룸 입장권',          grade:'특별', cost:1, type:'스킬', folder:'클럽', draft:true, ops:[{op:'dopa',n:15},{op:'vuln',n:1}], text:'도파민 +15. 취약 1.', line:'' },
    { id:'C38', no:38, name:'샴페인 샤워',            grade:'특별', cost:1, type:'공격', folder:'클럽', draft:true, lubeCost:20, ops:[{op:'dmg',n:10,all:true}], text:'윤활도 20 소모. 적 전체에게 10 피해.', line:'' },
    { id:'C39', no:39, name:'클럽 DJ 믹스',           grade:'희귀', cost:2, type:'스킬', folder:'클럽', draft:true, ops:[{op:'draw',n:3},{op:'dopa',n:15}], text:'카드 3장 드로우. 도파민 +15.', line:'' },
    { id:'C40', no:40, name:'스쿼트 100개',           grade:'일반', cost:1, type:'스킬', folder:'트레이닝', draft:true, ops:[{op:'block',n:5},{op:'tight',n:4}], text:'방어도 5. 조임력 +4.', line:'' },
    { id:'C41', no:41, name:'케겔 인터벌',            grade:'특별', cost:0, type:'스킬', folder:'트레이닝', draft:true, exhaust:true, ops:[{op:'tight',n:5},{op:'draw',n:1}], text:'조임력 +5. 카드 1장 드로우. 소멸.', line:'' },
    { id:'C42', no:42, name:'근육통 전부 쏟기',       grade:'희귀', cost:2, type:'공격', folder:'트레이닝', draft:true, ops:[{op:'dmg',n:12,addTightHalf:true}], text:'적에게 12 + (조임력의 절반) 피해.', line:'' },
    { id:'C43', no:43, name:'레이스 끈 풀기',         grade:'일반', cost:1, type:'스킬', folder:'란제리', draft:true, ops:[{op:'block',n:6},{op:'weak',n:1}], text:'방어도 6. 약화 1.', line:'' },
    { id:'C44', no:44, name:'스타킹 올 나가기',       grade:'일반', cost:0, type:'스킬', folder:'란제리', draft:true, ops:[{op:'lube',n:25},{op:'hpLoss',n:2}], text:'윤활도 +25. 체력 2 손실.', line:'' },
    { id:'C45', no:45, name:'가터벨트 잡아당기기',    grade:'특별', cost:1, type:'공격', folder:'란제리', draft:true, ops:[{op:'dmg',n:8},{op:'vuln',n:1}], text:'적에게 8 피해. 취약 1.', line:'' },
    { id:'C46', no:46, name:'속옷 차림 수색 영장',    grade:'희귀', cost:1, type:'스킬', folder:'란제리', draft:true, exhaust:true, ops:[{op:'block',n:10},{op:'disgust'}], text:'방어도 10. 질림. 소멸.', line:'' },
    { id:'C47', no:47, name:'봉 돌기',                grade:'일반', cost:1, type:'공격', folder:'스트립 댄서', draft:true, ops:[{op:'dmg',n:5,all:true},{op:'dopa',n:10}], text:'적 전체에게 5 피해. 도파민 +10.', line:'' },
    { id:'C48', no:48, name:'팁 박스 던지기',         grade:'특별', cost:1, type:'스킬', folder:'스트립 댄서', draft:true, ops:[{op:'vuln',n:2,all:true},{op:'dopa',n:10}], text:'적 전체에게 취약 2. 도파민 +10.', line:'' },
    { id:'C49', no:49, name:'앙코르 요청',            grade:'특별', cost:1, type:'스킬', folder:'스트립 댄서', draft:true, ops:[{op:'draw',n:2},{op:'dopa',n:10}], text:'카드 2장 드로우. 도파민 +10.', line:'' },
    { id:'C50', no:50, name:'피날레 쇼',              grade:'희귀', cost:3, type:'공격', folder:'스트립 댄서', draft:true, exhaust:true, ops:[{op:'dmg',n:18,all:true,orgBonus:8}], text:'적 전체에게 18 피해. [절정] 중이면 추가 8 피해. 소멸.', line:'' },
    // 토큰 (덱에 들어가지 않음)
    { id:'T01', no:0, name:'절정 유도', grade:'토큰', cost:0, type:'스킬', folder:'-', token:true, ops:[{op:'dopa',n:20}], exhaust:true, text:'도파민 +20. 소멸.', line:'앗, 이 느낌…… 조금만 더요!' }
  ];
  const dict = {};
  const SINGLE = ['dmg','weak','vuln','bind','disgust','enemyStrDown'];
  L.forEach(c => { c.needsTarget = c.ops.some(o => SINGLE.indexOf(o.op) >= 0 && !o.all); dict[c.id] = c; });
  GAIA.cards = dict;
  GAIA.cardList = L.filter(c => !c.token && !c.draft);       // 덱·보상에 쓰는 확정 카드
  GAIA.cardListAll = L.filter(c => !c.token);                  // 개발 패널용(초안 포함)
})();
