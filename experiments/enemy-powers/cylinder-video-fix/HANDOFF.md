# 실린더 MP4 폴더 · 10초 수정

## 기준
직전 GAIA-Squat-Audio-Cylinder-Fix.zip의 HTML을 기준으로 적용. 직전 스쿼트 음악 증가·신음 감소, 적 스킬·컷인·라켓 터치 수정 유지.

## 변경
- 실린더 기존 편집창을 MP4 폴더 선택으로 연결(webkitdirectory). 폴더 내 .mp4만 정렬해 영상 선택 목록 제공.
- File/Blob 원본을 IndexedDB wellness-life-art-v1 / art / cylinder/mp4-folder에 저장. 영상과 선택 번호를 재진입 시 복원. base64 변환과 HTML 내 영상 추가 없음.
- Blob URL로 재생하고 기존 SceneEditor.paint의 videoWidth/videoHeight 기반 비례 렌더링 사용. 기존 캐릭터 이미지·애니메이션·배경 파일은 변경하지 않음.
- 영상 무음 반복, 편집창에서 일시정지, 닫기 후 재개. 종료·프레임 해제 시 정지하고 Blob URL 해제.
- 기본 그림 복원은 저장한 MP4와 과거 중앙 이미지 업로드 기록도 삭제. 기존 기본 에셋으로 즉시 복원.
- 실린더 모델 생성 시 duration=10, goal=Math.round(원래 goal*0.3). 최소 1점. 기존 난이도·판정·결과 전달 형식 유지.
- 스쿼트는 추가 변경 없음. 다른 미니게임·보상·성장 공식 변경 없음.

## 검증
Headless Chromium에서 최종 HTML을 실행.
- 1/5/10단계 시간 10초와 목표점수 77/143/225 확인(기존 255/475/750).
- 폴더 FileList 이벤트에 실제 H.264 MP4 2개와 비영상 파일을 넣어 MP4만 목록 표시 확인.
- 실제 MP4 디코딩·재생 시간 증가, 영상 선택 전환, IndexedDB 저장 후 게임 재진입 복원 확인.
- 세로→가로 크기 변경 후 VIDEO 유지, 편집창 개폐 시 영상 정지·재개 확인.
- 기본 그림 복원 후 재진입 시 영상 목록 비어 있음 확인.
- 10초 제한에서 게임 종료·wellness-result 성공 메시지 확인. 결과 전달 검증을 위해 점수는 목표치로 설정함. 손으로 완주한 성공 난이도 검증은 아님.
- 검증 실행 중 pageerror 없음. 결과는 verification/results.json.

## 미확인
실제 Android 폴더 선택기 조작 및 해당 기기의 MP4 코덱 지원은 미확인. 자동 검증에서는 FileList를 주입했으므로 운영체제 파일 선택창을 직접 조작한 검증은 아님.
스쿼트 실제 스피커 청취와 미니게임 전체 전수 완주·보상 스탯 회귀 검증은 수행하지 않음.

## 파일
GAIA-Pingpong-v12.11.html만 교체. assets 추가 없음. source/cylinder-video.js와 build.cjs는 직전 음량 패치 HTML을 입력으로 하는 추가 패치. 중복 적용 금지.
