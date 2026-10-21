# 작업 기록 · 2026-10-20

사용자 최신 GAIA-FIXED를 읽고 별도 결과본 생성. 오프닝·등록·외상·생활 모델·13개 의뢰·취업/결혼과 출입 자격·심야반·BGM·실린더 contain 표시 연결. 원본·GitHub는 변경하지 않음. 실제 검증 목록은 runtime-verification.json, media-verification.json, balance-simulation.json.

## 2026-10-20 진행 연결 및 오류 수정
사용자 지적: 불필요한 설명/심야 메뉴/음향 테스트 UI, 퀘스트 연결 부재, 실린더 배경 반복, 점프 및 거리 음향 문제.
센터 도착 보상과 자동 접수 연결, 방 체험 순차 목표, 짧은 혼잣말, 목표 미리보기/목적지 시각 신호 추가. 진단 UI와 수동 심야 메뉴 삭제. 미디어 반복 제거, 음향 로드 경합 완화, 입력 정리 보강.
점프 먹통은 브라우저에서 재현하지 못함. 실기기 해결로 단정하지 않음. 집 이미지 보류. 검증 상세는 repair-verification.json.

## 2026-10-20 01:52 이후 사용자 재지적 수정
방 대사 런타임 덮어쓰기 제거 및 원본 STORY 복원(원본 데이터 동등성 검사). 물어와 양끝 기존 그림 버튼, 물병 실제 발사 음향, 하루2회 휴식 제한, 무관한 방의 부탁/취소 제거. 게임 시작 전/비동기 로딩 중 취소 시 입력과 iframe 복구 보강. 세로 실린더 contain 전경과 흐린 배경 채움.
최종검증은 final-verification.json. 실제기기 재현/청취가 완료됐다고 말하지 않을 것. 이전 01:23 빌드는 검증 누락과 대사 덮어쓰기가 있었음.

## 20261020-R3
입력/음향/전환 수정. SHA256 473d1d4039ab80950a6e60be38f92b0b72be68d316f85d5d0a33f3b71f48ce0b. 상세와 검증 한계: docs/gaia/REVIEW-20261020.md.


## 2026-10-21 18:59 KST — APK 제작 시작
- 사용자 첨부 GPT-APK-요청문.md 확인. main R60(e5fd3583b9492387c75e1208946e1e6f3a52830f)을 기준으로 고정. 게임 HTML 내용 수정 금지.
- 분할 gzip 다운로드 및 복원: 87,031,121 bytes, SHA256 575d4b2751f34b0cf251735330773735633401168117cf7c0520e4a136d3f244 일치.
- 기존 루트 README/HANDOFF/PROJECT_STATUS가 R3를 가리키는 것을 확인. APK 완료 시 동시 갱신 예정.
- 비공개 GitHub를 인증 없이 앱에서 자동 다운로드할 수 없음. 토큰 내장/저장소 공개 없이, 내장판+마지막 버전 보관+파일 업데이트+선택적 HTTPS 업데이트 주소로 구현. 자동 배포 주소는 미정.
- 실제 Android 기기는 연결되어 있지 않음. 실기기 음향·진동·조작 완료로 보고하지 않음.
- 빌드 환경: JRE17은 있으나 javac 실행파일/Android SDK는 없음. 기본 apt 설치는 setgroups 권한 실패. 기존 JRE의 jdk.compiler 모듈이 있으므로 java -m jdk.compiler/com.sun.tools.javac.Main 사용 가능 확인. Android SDK 다운로드 및 설치 시작.

## 2026-10-21 19:05 KST — Android 소스 및 빌드
- 추가: android/app/src/main/AndroidManifest.xml, MainActivity.java, UpdateStore.java, res/drawable/ic_launcher.xml, android/build.py.
- 세로 고정(sensorPortrait), 전체 화면, JavaScript/DOM 저장소, 사용자 제스처 제한 없는 미디어 재생 설정. 파일 접근(file://) 비활성, 전용 HTTPS 가상 원점에서 원본 HTML을 스트리밍.
- 뒤로 버튼 앱 메뉴: HTML 파일 업데이트, HTTPS manifest 업데이트 주소/확인, 세이브 백업/복원, 진단 로그 내보내기, 기본 R60 복구.
- 업데이트는 SHA256/크기 검증 후 원자적 교체. 오류 시 기존 게임 유지. 내장 게임은 gzip으로 포함하되 복원된 HTML 해시는 R60과 동일하게 검사.
- 게임 내 파일 탐색기와 blob 다운로드를 Android 문서 선택/저장으로 연결. 런타임 호환 처리만 있으며 HTML 파일은 변경하지 않음.
- 서명: 새 개인 테스트용 RSA3072 키를 생성. 비밀번호/키는 GitHub에 올리지 않고 별도 개인 백업으로 전달 예정. 이후 동일 APK 패키지 업데이트는 동일 키 필요.
- 초기 일반 apt 설치 실패(setgroups) 후 root sandbox 옵션으로 JDK 패키지 다운로드 가능했지만, 기존 JRE의 compiler 모듈로 빌드하므로 추가 JDK 설치 불필요.
- SDK platform 35/build-tools35.0.0 설치. 물리 기기 없이 Android 실행 검증을 보완하려고 에뮬레이터 설치 시도 중(실기기 검증 대체 아님).

- 빌드 1차 실패: android.jar의 LambdaMetafactory 스텁에 javac 람다 메서드가 없어 컴파일 실패. SDK core-lambda-stubs.jar를 부트 클래스 경로 앞에 추가해 재시도.

## 2026-10-21 19:06 KST — 빌드 오류 수정 및 업데이트 보존 검사
- javac 람다 스텁 경로 보완 후 Java/Dex/APK 패키징 성공.
- 서명 1차 실패: apksigner에 동일한 1줄 비밀번호 파일을 --ks-pass와 --key-pass로 두 번 전달해 두 번째 읽기 EOF. 키 비밀번호=스토어 비밀번호이므로 --key-pass 생략 방식으로 수정(비밀번호 변경/새 키 생성 없음).
- UpdateStore 호스트 테스트 12개 통과: 바이트 동일성, 메타데이터, 해시/크기 오류 거부, 잘못된 HTML 거부, 실패 시 기존 파일 보존, 설치 직전 재검증, 용량 상한, HTTP/URL 내장 인증정보 거부, 정상 두 번째 교체.
- 테스트는 Android 실기기나 WebView에서 실행한 것이 아닌 Java 파일 저장/검증 로직 테스트임.

## 2026-10-21 19:10 KST — 서명·무결성 및 온라인 업데이트 검사
- APK 생성: android/build/GAIA-LIFE-R60.apk, 64,905,823 bytes, SHA256 b87dacfb4403c6a9c47ad3f8ac4b579c5f8df2f10731c932e09daedc4b744607.
- apksigner v2/v3 서명 및 zipalign/ZIP CRC 통과. 내장 game.html.gz를 풀어 R60 SHA256 동일 확인.
- 서명 인증서 SHA256: 89886897567f1fb0086f0f48eda955295ec483d6ddeab4a20df1f9a8063a004a.
- 로컬 TLS 서버에서 실제 HTTPS 분할 다운로드·gzip·검증·교체, 동일 버전 건너뛰기, 잘못된 해시/없는 조각/손상 gzip/연결 실패 시 기존 버전 보존 등 10개 추가 통과. 테스트용 인증서 신뢰는 tests/RemoteUpdateTest.java에만 있으며 APK에는 없음.
- android/prepare-update.py 추가: 배포용 상대 경로 manifest와 버전 폴더 생성. 외부 업로드/공개는 하지 않음.
- 에뮬레이터 초기 시도: 도구 호출별 네트워크 격리로 다른 호출의 adb에서 장치를 볼 수 없음. 같은 호출 내 adb+에뮬레이터를 실행하도록 변경. 기존 AVD 잠금으로 재실행 실패, 별도 AVD 생성 후 재시도.

## 2026-10-21 19:12 KST — 최종 패키지 및 기록
- 뒤로 제스처가 네이티브 메뉴로 들어오도록 Android 예측 뒤로 콜백을 비활성화하고, 노치 안전 영역 패딩과 다중 파일 선택 결과 처리를 보완. HTML은 변경하지 않음.
- 같은 키로 재빌드한 최종 APK SHA256: 015d8e7bfd5915a54c3910224524a0795bec9b2146ae02f202ce0a5508212340 (64,905,823 bytes). 이전 시제품 해시 b87d... 대신 이 최종 파일을 전달.
- 최종 R60 스크립트 23개 문법 검사 통과. 업데이트 배포용 manifest/조각 생성 및 복원 해시 검사 통과.
- 에뮬레이터 별도 AVD 재시도는 프로세스 signal11 종료. 실제 Android 설치/플레이/음향은 미검증으로 명시. 물리 기기 연결 없음.
- README/HANDOFF/PROJECT_STATUS를 R60+APK 빌드 완료/온라인 배포 주소 미정/미검증 범위로 교체. android/README.md, docs/gaia/APK-20261021.md, APK-verification.json 추가.
- 최종 APK와 설치 안내, 개인 서명 백업 ZIP을 사용자 전달 파일로 준비. ZIP은 임시 위치에서 완성·CRC 검사 후 fsync/rename. 서명 키는 GitHub 대상에서 제외.

## 2026-10-21 19:14 KST — 전달 저장 및 GitHub 반영 완료
- Android 소스/재빌드 절차/상태 문서 16개 파일을 main 커밋 305bad3bf490d6192a79a712231a1a53fe429148로 반영. 커밋 변경 목록에서 게임 builds/ 파일 변경이 없음을 재확인.
- 사용자 전달 파일 저장 성공: GAIA-LIFE-R60.apk, GAIA-LIFE-APK-guide.md, GAIA-LIFE-signing-backup.zip. 모든 로컬 파일에 저장 식별 메타데이터 적용 성공.
- APK 보관 ID libfile_15437e6641b88191a8f7c24ce453b0dc, 안내문 libfile_bd511e0f2acc8191a5b0da3b7ec58433, 개인 키 백업 libfile_a1ab0261ad488191b43f8dd297e88ec4. 세 항목 모두 최초 버전 0.
- 최종 상태: 빌드/서명/원본 무변경 검증 및 업데이트 로직 검사 완료. 기기 실행·실제 음향·터치·저장 UI 검증은 사용자 설치 후 필요. 온라인 자동 배포는 주소 결정 전까지 비활성.
