# GAIA LIFE Android

R60 원본 HTML을 바꾸지 않는 개인 테스트 APK입니다. Android 8 이상, 세로 화면(sensorPortrait), 패키지 `com.gaia.life`.

## 설치와 메뉴
1. `GAIA-LIFE-R60.apk`를 기기로 받아 설치합니다. 다운로드한 앱의 설치 허용이 필요할 수 있습니다.
2. 앱은 인터넷 없이 내장 R60을 실행합니다. Android **뒤로 버튼/뒤로 제스처**로 앱 메뉴를 엽니다.
3. 기존 Chrome 세이브는 자동으로 옮겨지지 않습니다. 기존 게임에서 내보낸 JSON을 APK 게임 안 불러오기에서 선택합니다.
4. 앱 메뉴의 **세이브 백업/복원**은 이 APK의 localStorage 진행 상태용입니다. 커스텀 PNG/사진(IndexedDB)은 포함되지 않습니다. 사진까지 옮기려면 게임 자체 JSON 내보내기/불러오기를 사용하고 별도로 확인하세요.
5. 앱 삭제 또는 Android 앱 데이터 삭제는 내부 세이브와 내려받은 게임을 지웁니다. HTML 업데이트·동일 서명 APK 덮어설치는 앱 데이터를 지우지 않습니다.

## 빌드 재현
필요: Python3, Java17(compiler 모듈 포함), Android SDK `platforms;android-35`, `build-tools;35.0.0`.

```sh
export ANDROID_HOME=/path/to/android-sdk
python3 tools/gaia/restore.py
export GAIA_KEYSTORE=/secure/path/gaia-life.jks
export GAIA_KEYSTORE_PASS_FILE=/secure/path/password.txt
python3 android/build.py
```

결과: `android/build/GAIA-LIFE-R60.apk`. 스크립트는 manifest SHA256/크기 검증, gzip 내장, javac → d8 → aapt2 → zipalign → apksigner, 서명 및 게임 바이트 동일성 검사를 수행합니다. 로컬 출력 이름은 R60 고정이므로 이후 네이티브판 배포 때 Manifest의 versionCode/versionName과 출력명을 함께 갱신하세요.

서명 키는 별도 개인 백업 `GAIA-LIFE-signing-backup.zip`에 있습니다. 키 별칭 `gaia-life`, PKCS12/RSA3072. **키와 비밀번호를 GitHub에 올리지 마세요.** 이후 같은 앱을 덮어설치하려면 반드시 이 키를 재사용합니다. 새 키를 만들면 기존 앱에 업데이트 설치할 수 없습니다.

## APK 재빌드 없이 게임 업데이트

### 지금 가능한 방법: HTML 파일
뒤로 → `HTML 파일로 업데이트` → 최신 복원 HTML 선택 → 적용. 크기 제한/HTML 검사를 통과하면 내부 저장소에 복사해 원자적으로 교체합니다. 이후 오프라인으로 그 버전을 실행합니다. 파일 업데이트는 manifest 검증값이 따로 없으므로 선택한 파일이 의도한 원본인지 사용자가 확인해야 합니다. 실패 시 기존 게임 유지. `기본 R60으로 복구`도 세이브는 유지합니다.

### 온라인 자동 확인: 배포 주소 필요
**현재 저장소는 비공개이며 기본 업데이트 주소는 비어 있습니다. 자동 온라인 배포는 활성화하지 않았습니다.** 인증 토큰을 APK에 넣거나 저장소를 공개하지 않았습니다. 인증 없이 다운로드되는 HTTPS 정적 배포 위치를 사용자가 정하면 앱 메뉴에 주소를 입력할 수 있습니다. 이 설정은 APK 재빌드가 필요 없습니다.

```sh
python3 tools/gaia/restore.py
python3 android/prepare-update.py --html GAIA-LIFE-20261020.html --build 20261021-R60 --out /tmp/gaia-update-feed
```

생성된 버전 폴더를 먼저 업로드하고 **update.json은 마지막**에 교체합니다. 구버전 폴더는 다운로드 중인 기기를 위해 남겨 둡니다. 스크립트 자체는 업로드하지 않습니다. 배포한 `https://.../update.json` 주소를 앱에 설정합니다. 앱 재실행 시 백그라운드 확인·다운로드 → 검증 완료 후 적용/나중에 선택. 게임 진행 중 강제 새로고침은 하지 않습니다. 네트워크·해시·gzip 오류는 기존 버전을 유지합니다.

일반 GitHub 비공개 raw URL, 일시 토큰 URL, Google Drive 미리보기/로그인 링크는 이 배포 주소가 아닙니다. 자동 업데이트를 하려면 별도 공개 배포(게임 파일 공개에 대한 사용자 선택 필요) 또는 인증 프록시 등 별도 운영이 필요합니다. **전체 저장소를 공개할 필요는 없습니다.**

manifest 형식은 `build`, `sha256`(압축 해제된 HTML), `size`, `compression:"gzip"`, `parts`(update.json 기준 상대 HTTPS 파일 경로). 단일 파일은 `url`도 지원합니다. 저장소의 기존 manifest는 parts가 저장소 루트 기준이므로 직접 주소를 넣지 말고 위 스크립트로 배포용 manifest를 생성하세요.

## 검증과 한계
`docs/gaia/APK-20261021.md`를 확인하세요. 실기기가 연결되지 않았으므로 실제 스피커 음향·기기별 터치·전체 미니게임 완주는 확인되지 않았습니다. 앱 메뉴 `진단 기록 저장`으로 오류 로그를 전달할 수 있습니다. 이 로그에는 세이브 본문/비밀번호/배포 주소를 넣지 않습니다.

## 변경 범위
게임 HTML은 R60과 바이트 단위 동일. Android 껍데기에만 파일 선택/내보내기, 오프라인 게임 보관, 업데이트, 뒤로 메뉴, 미디어 재생 설정을 추가했습니다. 패배/성공 효과음 또는 게임 규칙은 수정하지 않았습니다.
