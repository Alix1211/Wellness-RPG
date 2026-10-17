# 물병 채우기

4개의 병에 포물선 물줄기를 조준해 채우는 오프라인 미션. 센터 모든 층과 회사 모든 층의 화장실에서 실행한다.

- 각도/파워 슬라이더 또는 화면 드래그로 조준. 발사 버튼을 누르고 있으면 발사한다.
- 각 병 100, 물통 600. 네 병을 모두 채우고 받은 물이 흘린 물보다 많으면 성공한다.
- 병 입구를 위에서 아래로 통과한 물만 받아진다. 몸통 충돌, 입구 밖, 넘친 물은 흘린 물로 센다.
- 무제한 시간. 일시정지 및 재도전 가능. 숨김/포커스 해제 시 발사 해제.
- 현재 성장 수치/보상은 부여하지 않으며 기존 기록 체계에 받은 물 점수를 저장한다.

## 이미지와 판정 교체

`WaterBottles.mount(host, config)` 또는 `new WaterBottles.Model(config)`.

`config.muzzle = {x:80,y:440}`는 물이 시작하는 정확한 점이다.
`config.bottles`의 각 항목은 `{x,mouthY,mouthWidth,width,bottom,capacity}`.
입구는 `(x-mouthWidth/2, mouthY)`부터 `(x+mouthWidth/2, mouthY)`까지의 선분이다.
`width`와 `bottom`은 몸통 충돌 영역을 정한다. 기본 화면 좌표는 1000×540이다.
`config.art = {gun: '이미지 URL', bottle: '이미지 URL'}`로 그림을 교체한다.
병 그림은 각 병의 x 중심, mouthY~bottom, width 안에 표시된다. 물총 그림은 발사점 기준 왼쪽 95~오른쪽 5, 위아래 35이며 각도에 맞춰 회전한다. 그림과 입구 판정은 서로 독립적이다.

## 빌드와 확인

`python src/minigames/water-bottles/build.py` → `tests/water-bottles.html`.
`python src/center/build.py` → 통합 `index.html` (기존 NPC/센터 자산 필요).
`node tools/test_water_bottles.cjs` → 20~120fps 조준, 성공/실패, 물량 보존, 일시정지 확인.
