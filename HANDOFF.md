# Handoff — GAIA CITY Wellness RPG

## Mandatory shared AI work log protocol (2026-10-19)

**User instruction, applies to ChatGPT, ChatGPT Work, Claude, Codex, and any other AI/chat/session working on this project.** This `HANDOFF.md` is the common cross-session record in the private `Alix1211/Wellness-RPG` repository. It is not optional background documentation.

### Every work session: required sequence

1. **Before beginning any project work:** Read the latest `HANDOFF.md` from the **actual branch/repository being worked on**. Review its latest work log, user decisions, pending changes, and any relevant older sections. Check the actual GitHub working branch/commit and files as needed; do not assume a previous conversation's copy is current.
2. **At the beginning of the session:** Append a dated **START** entry to the work log below, including the AI/tool or chat context, branch and baseline commit (if known), the user's requested task, and which working artifact is authoritative. If direct repository access is unavailable, explicitly identify the unsaved local log and incorporate it into this file at the next possible opportunity; do not claim it was committed.
3. **Whenever the user makes an important decision or correction:** Record the exact decision, restrictions, and its status as soon as feasible. Preserve user terminology. Do not quietly rewrite or reinterpret prior confirmed choices.
4. **After each actual change:** Update this log with affected file paths, what changed, verification/tests, GitHub commit or local/uncommitted status, unresolved issues, and next actions. Never write 'completed', 'uploaded', 'tested', or 'merged' unless that event really occurred and was checked.
5. **At the end of the session or when handing off to another AI/chat:** Append a dated **END/HANDOFF** entry with the last verifiable working version, completed and pending work, warnings, and the exact next action. The next AI must read this file **first**.
6. **When Work usage limits, another chat, or another AI forces a switch:** Continue using the common log and verify what was committed. Work-local files, downloaded HTMLs, user-supplied assets, and GitHub `main` may differ. Explicitly distinguish them. **Never overwrite the newer working artifact with an older GitHub build.**
7. **Concurrent branches:** Record the working branch, commit hash, any unmerged work, and the intended merge path. Do not assume an AI or Work session automatically pulls/pushes another branch or local edits.

### Work log entry format

```markdown
### YYYY-MM-DD HH:MM KST | START / UPDATE / END | AI or chat
- User instruction / confirmed decision:
- Working source: file + location, repo + branch + baseline commit (if verified)
- Changed files / actual modifications:
- Status: completed, pending, local-only, or GitHub-committed
- Test/verification (pass/fail/not run):
- Commit / output file (only if verified):
- Next action / constraints:
```

### Known handoff at protocol creation (2026-10-19 KST)

- **User-identified latest work file:** `GAIA-RPG-test-20261019.html`. User reports this is newer than the GitHub build; its full contents and location have **not** been verified in this repository.
- **Current feature being worked on:** Street / inter-location travel. The agreed direction involves side-scrolling running and jumping, destination icons placed in the road area (the road itself is **not** the character's travel lane), different travel times by destination, and morning/afternoon/night visual assets. Check the newest working file before claiming any element is implemented.
- **Status boundary:** Existing GitHub `main` and its nine-minigame standalone editor are not automatically equivalent to the most recent Work/local artifact. Verify and reconcile deliberately; preserve original assets and already-working features.
- **This entry:** Documents the user-mandated process only. It does not claim to have implemented the travel feature or imported the latest HTML.

### 2026-10-19 KST | UPDATE / HANDOFF | ChatGPT (chat)

- User instruction / confirmed decision: All AIs and chats must read this MD **at each start**, record important user instructions and start/end points, and **update it after changes**, using it to share project status.
- Working source: `HANDOFF.md` on `main`; latest separate HTML `GAIA-RPG-test-20261019.html` named by user, not verified in GitHub.
- Changed files / actual modifications: Added this mandatory process and initial shared status to `HANDOFF.md` only.
- Status: Documentation change submitted to GitHub `main`; no game code changed.
- Test/verification: Confirm file update by reading it back after commit.
- Next action / constraints: Review this log **before any further change**; locate/inspect the latest HTML before altering the street travel system.


## Project scope

- Repository: `Alix1211/Wellness-RPG`, separate from the original Wellness repository.
- GAIA CITY life RPG controlling one female member; indoor belt-scroll movement is the agreed map direction. No street travel map. The user authorized implementation on 2026-10-17; build only the agreed indoor belt-scroll map.
- Life expands from own home/Wellness Center to company, partner/marriage and later Dream House. The Center remains a repeatable growth hub after employment/marriage.
- Current confirmed stats: **색기, 음란도, 복종도, 개방성** (ki/um/bo/ge). Resources: **HP** and **M파워(마조력)**; M파워 is used for skills. Growth comes from mission/minigame performance, not waiting in rooms.
- Adapt suitable Wellness minigames after a read-only inventory of the original project. Do not modify the original Wellness repository for this work.

## Character art added on 2026-10-17

The user explicitly requested **all character sprite and portrait assets shared in the referenced conversation** be uploaded to this **private** repository, including the temporary portrait. This supersedes the earlier handoff's blanket exclusion of adult character images. It does **not** authorize uploading the separate private photo/video gallery pack (approximately 300 files); keep that pack local and out of GitHub.

Ten original PNG files were committed byte-for-byte, with their original filenames, under `assets/characters/portraits/`:

| Folder | Files | Intended use / status |
| --- | --- | --- |
| `jeans/` | `01_Jeans_2x2_1.png`, `01_Jeans_2x2_2.png` | Main four dialogue portraits, then four secondary reactions. |
| `jeans/` | `표정 가득한 여성 캐릭터 2×2 포즈 시트-1(1).png`, `투명 배경의 네 가지 포즈 애니 캐릭터 시트-3.png` | Earlier jeans pose-sheet originals; keep as source variants. |
| `office/` | `02_Office_2x2_1.png`, `02_Office_2x2_2(1).png` | Office main and secondary reaction sheets. |
| `lavender-yoga/` | `03_Lavender_Yoga_2x2_1.png`, `03_Lavender_Yoga_2x2_2.png` | Wellness/yoga main and secondary reaction sheets. |
| `adult-nude/` | `image (1) 복사(1).png` | Temporary nude 2×2 portrait. User plans to send an upscaled replacement later; retain this original meanwhile. |
| `swimwear/` | `image (2) 복사.png` | Swimwear reaction sheet. |

For the numbered 2×2 outfits, use the first sheet's four expressions most often in dialogue; reserve the second sheet for special reactions. The user said some hair/background removal remains imperfect in current versions. Preserve these originals and replace only when corrected files are actually supplied. Avoid assuming every sheet has a transparent or clean background.

## Four-legged movement and jump sheets added on 2026-10-17

The user subsequently supplied the six missing original PNG sheets. They are committed byte-for-byte under `assets/characters/sprites/four-legged/`, preserving filenames:

| Outfit | Front/back 4×4 sheet | Side 4×2 sheet |
| --- | --- | --- |
| Lavender/yoga | `lavender-yoga/1000080801(1).png` | `lavender-yoga/ChatGPT 이미지 2026년 10월 16일 오후 10_37_57.png` |
| Office | `office/1000080812.png` | `office/투명 배경 치비 소녀 스프라이트 시트.png` |
| Jeans | `jeans/1000080811.png` | `jeans/투명 배경의 치비 여성 액션 스프라이트 시트.png` |

These are source sheets for four-legged crawling and jumping poses, not pre-cut animation frames. The 4×4 sheets visually contain front/back crawl and jump sequences; the 4×2 sheets contain side crawl and jump sequences. Confirm frame coordinates, timing, direction mirroring, foot alignment, alpha edges, and scale in-engine. Preserve originals if making cleaned or cropped derivatives. See [`assets/characters/sprites/four-legged/README.md`](assets/characters/sprites/four-legged/README.md).

## Privacy and publication

The repository was confirmed private before this asset upload. Nude/adult character art is in `assets/characters/portraits/adult-nude/`. Before making the repository public or publishing a public build with these files, explicitly warn the user that they would become exposed and get confirmation. The separate photo/video gallery pack stays local regardless of repository visibility. Do not copy images from the original Wellness repository or from unrelated conversations into this project without a specific asset decision.

## Implementation handoff for Claude/GPT

1. Keep the committed PNG sheets as source originals. Add derived/cropped/upscaled files in distinct paths with provenance only after they are produced and reviewed.
2. Define portrait and movement manifests mapping outfit, emotion/action, direction, and sheet/cell position. Confirm crop boundaries and alpha edges visually before using cells in-game.
3. Design room movement, chapter gates, save data, four stats, HP/M파워, and a minigame interface before building a full gameplay loop.
4. Inventory original Wellness minigames read-only; adapt selected code/assets into this repository only after checking ownership and integration needs.
5. Keep local gallery imports under ignored paths such as `assets/local/`; never commit that private pack.

## Current implementation status

Repository documents, ten portrait/source sheets, and six four-legged movement/jump source sheets are present. The standalone sausage/video test is in tests/. All six original Wellness minigames and 105 byte-identical source/dependency assets have now been imported under src/minigames/legacy-wellness/. This is a source import, not yet an RPG integration. No private gallery pack has been committed.

## 2026-10-17 minigame import and current design decisions

- User requested bringing all Wellness minigames first and discussing room matching. See src/minigames/README.md and room-matching.proposal.json. Assignments are proposals, not active configuration.
- Original special (별도 훈련방) is **화장실 훈련방**, explicitly corrected by the user. Leave its minigame unassigned for discussion. This early proposal was later rejected: 뒤를 조심!! belongs to 체벌방, not 단체방.
- Imported 3 original scripts, complete minigame image/audio directories, Matter.js/license and four item dependencies. All 105 copied blobs match the pinned original ad0b677a965607e75bb86d555d1ce1dc45e1a342. JS syntax checks passed; no six-game RPG runtime has been wired or tested.
- Early Center expenses are loans; later income is salary and events, used for repayment, training and items. Three male partner routes are planned, with continuing play after marriage. Keep story light; missions/minigames support player-directed life and growth.
- Places: own home, Center, company, later Dream House. Instant travel between places; belt-scroll movement indoors. Open entrances; doors are rare. Map resources/layout must be discussed before building. No map work was done in that earlier import; the later implementation is described below.

## 2026-10-17 Center exploration implementation

User authorized the Center map, movement and rooms while considering stat decay. Additional instruction: several rooms of the same kind per floor, walk to the next bay to reach another room, bathrooms on every floor; do not cram all rooms onto one map.

- Entry point: index.html, single-file offline build. Sources/build/provenance: src/center/README.md.
- Six corridors/floors, 26 independent interiors: 1F lobby/shop/two recovery rooms/toilet; 2F three basic rooms/toilet; 3F three apparatus rooms/toilet; 4F three group rooms/toilet; 5F three posture rooms/toilet; 6F three punishment rooms/recovery/toilet. Elevator on the corridor left. Open room entrances, room-side adjacent transitions, lower-center return to corridor.
- Three outfits (center lavender, office, jeans), four directions, 4-frame crawl and jump, touch target movement, stick, keyboard, responsive portrait follow camera and landscape view. Player/source art originals unchanged.
- Room backgrounds are derivatives of the nine original Wellness Center images, embedded with provenance. Corridors use code-drawn repeating tiles. Male staff are temporary silhouette markers; dialogue/portrait integration remains pending.
- Connected existing games: basic=fetch, group=wiggle, posture=balance, punishment=tap and behind. Sausage remains reserved for company private office/home bedroom; the host was tested for it but it is not arbitrarily placed in Center.
- Gear=cut-rope and toilet=4-bottle water-aiming are planned, not implemented. Pressure-cylinder/three-heart game remains design only for public office/living room. Pantry game remains undecided.
- Recovery has rest interaction; shop only inspection, no purchasing. No passive growth, new stat decay, economy, skills, or new RPG stat balancing was introduced. Existing minigames run inside isolated iframes; only best results are saved locally. Full company/home/Dream House maps are not implemented.
- Validation: 26 room bounds/entry/return checks, six floor toilets, actual Chrome touch entrances/exits and elevator UI, three outfits, joystick/keyboard/jump, portrait/landscape renders, all six existing minigame starts. No pageerror observed. Android device testing and full minigame completion/balance remain pending.


## 2026-10-17 주인공 animation v2 correction

User reported dirty/jittery frame alignment, changing player sizes during movement and jump working only in place. Fixed by deriving 72 shared-size 224x208 frames with pivot (112,190) and 74px head-width normalization, removing detached source alpha flecks and avoiding side-jump bun clipping at the row split. Source PNGs are unchanged. drawPlayer now draws fixed-size tiles with no depth resizing. Jump uses immediate pointerdown with independent touch pointer IDs, captures recent movement for airborne momentum (0.18s grace for one-finger transition), freezes jump-facing until landing and delays target-triggered room transitions until landing. Five-direction model tests and real Chrome two-finger and one-finger jump input tests passed; three outfits/portrait renders passed with no pageerror. See tools/test_center_animation.cjs and src/center/prepare_sprites.py. Android device confirmation remains pending.

## 2026-10-17 복도 액자와 생활 인물 v3

User requested corridor picture frames before populating the map, with a photo-change button and temporary art, then animated people to make the current Center feel inhabited. The uploaded JPG screenshot is the protagonist and was explicitly excluded.

- Added editable picture frames in all six corridors. Temporary landscapes are drawn in code. Tap a frame or use the top ▧ button to select a frame, change its picture, or restore the default. User-selected photos are stored per frame in device-local IndexedDB (1600px maximum edge); never committed or transmitted. Persistence depends on the same browser/document origin. No cross-device save integration was added.
- All 14 supplied PNG sheets are preserved byte-for-byte under assets/characters/npcs/source/. 57 appearances / 148 frames are derived with component-based cropping, shared sequence scale, and fixed foot pivots. A special connected pair in 1000081091.png is separated by the nearest body masks. No source regeneration, protagonist replacement, or JPG import.
- Men use independent, visible turn/bow/lean gestures at fixed locations, because the sheets have no walk frames. Women with actual movement frames roam short bounded routes, pause, change pose and occasionally hop. Two-pose sheets use each person's same column only. Trainers, reception/shop staff, visitors and members populate the existing corridors/rooms; company and street maps are still unimplemented.
- NPCs update only in the current scene, pause in dialogs/minigames, and are depth-sorted with the player. No stat/economy/story changes. Existing staff interaction point, entrances, controls and minigame host remain connected.
- Sources: src/center/life.js, gallery.js, prepare_npcs.py, npc-assets.json, npc-manifest.json; tests: tools/test_center_life.cjs. Offline artifact: index.html and builds/wellness-center-alive-v3.html.
- Chrome validation: all 32 scenes' NPC bounds, all 14 source sheets, 148 loaded frames, travel/gestures/poses/hops, direct frame hit, photo upload/reload/reset persistence, gallery toolbar in portrait and rooms, no pageerror. Existing 72-frame protagonist and real moving multi-touch jump regression passed. Android device testing remains pending.


## 2026-10-17 회사 지도 · 복장 분리 v4

- 상단 ⇄ 장소 이동: 센터 6개 층과 회사 3개 층을 즉시 오간다. 회사 진입 시 주인공은 office 복장, 센터 진입 시 lavender-yoga로 전환한다. 이후 복장 버튼은 계속 사용 가능하다. 엘리베이터는 현재 건물 층만 표시한다.
- 회사 14개 공간: 1F 로비/휴게실/탕비실/화장실, 2F 공용 사무실 2개/회의실/탕비실/화장실, 3F 개인 사무실 2개/회의실/휴게실/화장실. 인접 방/복도 출입, 액자 사진 변경, 기존 저장/조작을 유지한다.
- 회사 배경 7종은 Canvas로 그린 밝은 푸른 사무실이다. 책상/모니터/바퀴 의자/회의 가구/소파/식물/탕비 시설을 포함한다. 새 사용자 그림을 생성하거나 원본 시트를 수정하지 않았다. 회사 업무 미니게임, 경제/급여/취업 조건은 아직 연결하지 않았다.
- 센터 NPC: trainer 남성, yoga-member 여성, member-0/1/2/3/5 요가복 이동 인물. 회사 NPC: office 남성, office-member 여성, member-4/6 오피스룩 이동 인물. casual, casual-member는 어느 건물에도 배치하지 않는다. 주인공 시트는 기존 것을 유지한다.
- 검증: 실제 headless Chromium에서 9개 층/49개 장면/총 271개 NPC의 복장 분리와 프레임 로드, 모든 방 진입/복귀/렌더, 층별 화장실, 장소 버튼 양방향 이동, 회사 엘리베이터 3개 층만 노출, 412×915 세로 툴바 위치 확인. pageerror 0. JS 문법 검사 통과. Android 실기기 확인은 남아 있다.
- 오프라인 전달본: builds/wellness-center-company-v4.html (루트 index.html과 동일).


## 2026-10-17 · v5 화장실 물병 미션
- 현재 v4(회사·NPC·액자 포함)에 물병 미션만 추가. 센터 6층 및 회사 3층 각 화장실에서 실행.
- 새 모듈: `src/minigames/water-bottles/` (모델/뷰, 스타일, 단독 빌더, 이미지/입구 좌표 교체 설명).
- 물병 4개, 각도·파워·발사 지속 입력, 포물선 물줄기, 입구 하강 통과 판정, 몸통 충돌/넘침/바닥 흘림 계산.
- 각 병100, 물통600. 4병 모두 채우고 받은 물>흘린 물이면 성공. 시간 제한 없음. 성장/금전 보상은 아직 연결하지 않음.
- 단독 테스트 `tests/water-bottles.html`, 통합 `index.html`, 보관본 `builds/wellness-center-water-v5.html`.
- 확인: 모델 20~120fps 4병 도달/완주/실패/물량 보존/일시정지, 실제 터치 발사·해제, 모바일 가로 넘침 없음, 센터·회사 화장실 실행/복귀, 브라우저 오류 없음.


## 2026-10-17 · v6 세 미니게임과 집

- 12:27 사용자 실행 요청에 따라 기존 v5 위에 구현. 세계관·대사 작업은 올려주신 마스터 가이드와 최신 사용자 정정을 기준으로 하며 이번에는 시스템·화면만 변경했다.
- 기존 v5 물병을 새 정사각 터치 방식으로 교체. 2×2 그림 네 개, 각 정중앙 입구, 개별 게이지4개, 하단 중앙 물총. 버튼 없이 누르는 동안 발사/드래그 조준, 손 떼면 중지. 기본45초 총 충전량 평가. 그림/배경/물총은 게임 안에서 교체·기기 내 저장 가능.
- 새 줄 자르기: 센터 기구방 3개 모두 연결. 6단계, 실제 스와이프로 줄 절단, 중력/흔들림/장력/장애물, 하단 정중앙 입구. 구슬·배경 이미지 교체 가능. 단계별 재시도/다음 단계. 자동 시간 제한 없음.
- 새 리듬 실린더: 회사 공용 사무실 2개와 집 거실. 정사각 화면 중앙 이미지·3곳 랜덤 하트·측면 게이지. 연타 상승/무입력 하강, 한계 눈금 초과 감점. 기본60초 목표1000. 하트 폭발은 핑크 안개·하트 입자·불꽃놀이, 입력 때 기존 음원 재생. 안정구간 밖의 하트 점수는 줄여 게이지를 무시하는 우회를 제한했다. 모든 수치는 조정 가능한 구현 기본값.
- 집: 가상 floor index9는 실제 층/복도가 아니다. 거실↔서재↔빈방↔침실↔화장실↔지하실↔거실의 배경판 연결. 좌우 끝 도달 시 자동 전환(착지 후), 반대편 안쪽에 등장. 상단 ⇄로 센터/회사/집 이동. 화장실=물병, 거실=실린더, 침실=쉬기. 주인공 캐주얼 사용. 집에는 임의 NPC/배우자/스토리/급여/결혼조건을 추가하지 않았다.
- 집 배경6종은 원본 Wellness `배경/집/` 이미지의 WebP 파생본. 원본 수정 없음. `assets/backgrounds/home/provenance.json`에 원본 blob SHA·경로 보존. 상단 ▧로 현재 집 공간의 배경을 사용자 사진으로 교체할 수 있고 IndexedDB에 기기 내 저장. 방 위치도 저장한다.
- 새 소스/상세 규칙: `src/minigames/life-suite/README.md`, models.js/game.js/style.css/build.py. build.py가 실제 홈 WebP를 읽어 내장하므로 prepared-assets.json 원본을 다시 만들 필요 없다. 예전 water-bottles 모듈은 v5 보관용이고 v6 런타임은 life-suite를 사용한다.
- 확인: 모델20~120fps 물량 보존·성공/실패, 줄6단계 성공 경로, 실린더 리듬/초과/우회 검사. 실제 Chromium 전체55장면, 집 양방향 전환, 세 게임 터치/판정/일시정지/복귀, 세로 화면, 음원7개 디코딩과 재생/정지, CDP 멀티터치, 사용자 그림 업로드/재진입/기본복원, 집 배경/위치/게임기록 저장. pageerror0. Android 실기기 성능은 사용자 확인 필요.
- 전달본: `index.html` = `builds/wellness-life-home-v6.html`.

## 2026-10-17 · v7 주인공 밤색 머리·초록 눈 교체

- 사용자 추가 요청: 새 PNG6장으로 주인공 애니메이션 교체, 이동/방향/점프/복장 사이의 크기와 발 기준점을 맞출 것. v6의 세 게임·집·기존 NPC를 함께 유지한다.
- 원본6장 그대로 `assets/characters/sprites/four-legged/chestnut-green/`에 보존. Side:1396=jeans,1391=office,1392=lavender-yoga. Directions:1393=office,1394=lavender-yoga,1395=jeans. 원래 소스6장은 덮어쓰지 않았다.
- 새 시트는 인물이 정사각 그리드 경계를 넘는다. `prepare_sprites.py` components-v3가 시트 전체 알파 연결성분8/16개를 찾아 행별/좌우순으로 매핑한다. 각 성분을 독립 마스크로 잘라 머리/손/발이 이웃 칸에 잘리는 것을 막는다. 원본 가장자리에 이미 잘린 부분은 새로 만들어 붙이지 않는다.
- 파생본에만 외곽3px의 빨강/노랑 배경제거 잔상과 떨어진 알파 점을 제거했다. 인물 내부의 입술·눈동자·의상은 유지한다. 새 머리/초록 눈은 사용자 원본 그대로다.
- 72프레임 모두 224×208, 발 기준(112,190), 머리 기준폭74px 정규화. 게임의 주인공 렌더는 모든 복장·방향에 같은 고정1.16배율을 적용해 기존 생활 NPC와 크기를 맞춘다. 점프 높이는 배율로 부풀리지 않는다. 이동 깊이별 확대/축소 없음.
- `source-frame-rects.json`에 실제 소스 경계, `sprite-alignment.json` version3에 원본 경로/SHA256/추출·배치 정보를 기록. 준비 JSON은 새72프레임으로 교체. source originals remain unchanged.
- 확인: 72개 공통 크기·머리 기준·바닥 pivot, 모델5방향 이동 점프·제자리 점프·착지. 새 그림을 로드한 실제 Chromium의 두 손가락 스틱+점프/독립 해제, 한 손가락 이동 직후 점프, 3복장/세로 렌더, 전체55장면·세 게임·집 양방향 이동. v6의 이미지/집 저장·게임 기록·음원 테스트도 재확인. Android 실기기 확인은 남아 있다.
- 최종 전달본: `index.html` = `builds/wellness-life-home-hero-v7.html`. 이전 v6 전달본도 builds에 보존한다.


## v8 session media editor
- All 9 minigames have full viewport background and portrait edit buttons. Scope: room/game session, or game default. IndexedDB saves editable source plus translation, zoom and rotation; explicit save/cancel/reset.
- Whole scene backgrounds remain behind transparent game canvases. Fetch scrolling scenery is skipped when a custom full background exists; foreground collision art remains unchanged.
- Legacy mgClock/fetch simulation and new LifeMini pause during editing. Resize rerenders saved transform at viewport aspect ratio.
- Clothed chestnut/green-eye portraits derived from original hero sheets; movement sprites unchanged.
- QA: test_media_v8.cjs passed all 9 editors, transform persistence/reopen, pause and portrait save; zero page errors. test_life_models.cjs passed.
- This update does not implement other pending water pull-control/cylinder point-layout/NPC/dialogue requests.
