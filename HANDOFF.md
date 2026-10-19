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


### 2026-10-19 11:29 KST | UPDATE / HANDOFF | ChatGPT (audio review)

- User instruction / current intent: Review user-supplied female game voice/sound tracks to replace the previous awkward Western female voice sounds, and keep impact SFX (slap/punch) separate from character vocal reactions so slow strikes and rapid repeated hits can be controlled independently. This is **sound-source collection/review**, not authorization to modify current game files yet.
- New user-provided audio candidates (conversation attachments, **not GitHub-committed**):
  - `로프 자르기.wav`: 69.92s, female vocal/breathing track intended for rope cutting
  - `실린더 게임120.wav`: 38.50s, cylinder-game variant marked 120
  - `실린더 게임150.wav`: 38.04s, cylinder-game variant marked 150
  - `게임시작시.ogg`: 0.85s, game-start English phrase (“Are you ready?”)
  - `자세잡기 게임.wav`: 36.12s, posture/balance-game breathing track
- Earlier conversation sound sources: 8 short reaction MP3s, `찰싹1.wav`, `찰싹2.wav`, `찰싹3.wav` (vocal/impact mixtures), plus Freesound `face-punch-91909.mp3` and `slap-in-the-face-101869.mp3`. These are not confirmed uploaded to this GitHub repository.
- Verified metadata only for new five: `실린더 게임150.wav` has a noticeably hotter average level (~-24.4 dBFS RMS) than `실린더 게임120.wav` (~-37.3 dBFS RMS); volume normalization/limiting needs review if blending or switching. No game/runtime tests performed.
- Working source: GitHub `main` HANDOFF only; newer game HTML remains user-identified `GAIA-RPG-test-20261019.html`, unverified in this repo.
- Changed files / actual modifications: This documentation log only. No audio transformed, added to GitHub, or integrated in HTML; no game source modified.
- Status: Audio candidates supplied and identified; integration and licensing details pending.
- Next action / constraints: Wait for user direction on actual edit, select game event/loop timing and volume, preserve original audio, and never overwrite the newer local Work HTML.

### 2026-10-19 12:12 KST | START / UPDATE / END | ChatGPT (sound integration)

- **User request:** Apply **all sound files shared so far** to the *latest* game and record the complete handoff. Earlier Western female sound effects were considered out of place; keep female reactions separate from slap/punch SFX, with adjustable strike sound interval for slow hits or rapid tapping.
- **Working source found and verified:** Library file `GAIA-RPG-test-20261019.html` (original 47,844,489 bytes; SHA256 `c328c3e238d0159815ed98f0eaf078969cc66b8884e74e3d42b8b449d3c56dcb`). This is newer than the repo's existing built-in `index.html`, so **DO NOT overwrite this HTML with the older GitHub main build**.
- **Actual edited runtime, persisted to the user’s Library root (NOT GitHub):** `/GAIA-RPG-test-20261019-AUDIO.html` (50,008,124 bytes; SHA256 `e16019bce46724c4408cd80604b9a322c3aa5baf594d30b72c438f0bb66d8b69`; Library file ID `libfile_9bc435bda62c8191b8b0a40b2f7aacfe`). The original remains unchanged.
- **Additional Library artifacts:**
  - `/GAIA-RPG-AUDIO-PACK-20261019.zip` (24 converted OGG clips plus `sound-manifest.json`, SHA256 `a686f67b19a15adee6e61b3f1fe3c1e68f6ae3c78482a8ac03d3afd3b2aa075b`; Library ID `libfile_966caa7536d88191857a8b5e5d6e424d`).
  - `/GAIA-SOUND-CHANGELOG.md` (source-to-sample mapping and restrictions; Library ID `libfile_8df84eb55b1881918af30a1ab440f313`).
- **All 18 user audio originals represented (24 OGG derivatives):** 8 short reactions (`으음_불만,mp3.mp3`, `기쁜반응.mp3`, `울음.mp3`, `으윽_힘주기.mp3`, `으응_칭얼댐.mp3`, `아앗_놀람i.mp3`, `지친소리_한숨.mp3`, `헉헉.mp3`); 3 long mixed voice/hit recordings (`찰싹1.wav`, `찰싹2.wav`, `찰싹3.wav`) cut into 3 short clips each, associated with the 3 tap actors; 2 impact recordings (`freesound_community-face-punch-91909.mp3`, `freesound_community-slap-in-the-face-101869.mp3`); 5 game-specific tracks (`로프 자르기.wav`, `실린더 게임120.wav`, `실린더 게임150.wav`, `게임시작시.ogg`, `자세잡기 게임.wav`). Long mixed `찰싹` recordings are **not clean voice-only stems**.
- **Applied audio behavior in edited HTML:** game-start cue, contextual reaction pool replacing playback of old Western 7 OGG voices, independent slap/punch on hits, 3 participant-specific mixed tap reactions, posture/balance bed loop, rope-cutting bed loop and cut impacts, cylinder 120/150 tempo-triggered loop selection, water breathing reactions, penalty hits. `🔊 음향` mixer controls gain, hit-sound minimum gap, reaction frequency and saves choices locally. The game input/scoring/balance/road travel logic is untouched.
- **Implementation boundary:** Only the recovered Library HTML was patched. GitHub `main` game JavaScript/images/assets were **not** changed. Old voice data is preserved in the existing HTML bundle but *playback* is intercepted/muted by new hooks. The 24 compressed audio clips are embedded as offline data URLs in the newly named HTML. Original uploaded audio files remain untouched.
- **Verification actually done:** ffmpeg conversion and per-file SHA256 manifest; Node JS syntax checks passed for sound bridge, parent engine, extracted legacy/suite scripts. Headless Chromium loaded all 24 embedded clips; with isolated iframe tests: rope bed start and pause stop, cylinder 120 start and 150 after rapid taps, legacy tap impact+voice, mixer opens. Full end-to-end 9-game playthrough or real Android device test **not performed**. Isolated `about:blank` browser harness had IndexedDB-origin errors unrelated to the sound asset/bridge checks.
- **Status:** Sound-integrated latest HTML and asset pack persisted in Library, not merged into GitHub game `main`; this `HANDOFF.md` update only is GitHub-committed. Source attribution/license for public distribution and in-game listening/volume tuning are pending.
- **Next AI MUST:** Read this entry and the Library `/GAIA-SOUND-CHANGELOG.md`; open **`/GAIA-RPG-test-20261019-AUDIO.html`** as the new authoritative audio-enhanced test build, preserve its street/inter-location work, then conduct practical Android listening and gameplay tests before integrating audio changes with any newer Work revisions. Avoid blindly overwriting existing other AI/Work game files.

### 2026-10-19 KST | AUDIO delivery ZIP / accessibility fix | ChatGPT

- User report: Original 50 MB sound-enhanced HTML link did not open in their client. Do not assume the file/content is missing.
- Confirmed `/mnt/data/GAIA-RPG-test-20261019-AUDIO.html` exists (50,008,124 bytes), and Chromium `page.set_content` initialized `GameHost`, with all 24 `GaiaAudioStatus.sources` present. This confirms runtime initialization in the test harness, **not** successful preview/open in every user's client.
- Created `GAIA-RPG-AUDIO-OPEN.zip` (36,781,079 bytes, SHA256 `f47d471fb5bd53d3dcd6e0c08138aefdf3a7b3c2e23b190aa7dd8c3032f3e45a`). ZIP holds the unchanged sound-enhanced HTML and `START-HERE.txt` extraction instructions; zip test passed.
- Saved ZIP to Library `/GAIA-RPG-AUDIO-OPEN.zip`, ID `libfile_a5af1b8b7da48191b2e6e1977c561dee`; no game code or audio changed, and original test HTML is still preserved.
- Delivery guidance: Download ZIP, extract HTML, then open locally using Chrome, rather than attempting to preview a 50 MB embedded-media HTML inside chat or a ZIP viewer. GitHub game runtime remains untouched.

### 2026-10-19 KST | END / HANDOFF | ChatGPT (audio repair and user ZIP images)

- **User requests and correction:** Fix overall sound issues (cylinder female audio silent, rope female audio silent, water-game reactions silent); **completely remove** intermittent game-start “Are you ready?”; then replace images in **백만 대 챌린지** and **움찔 찾기** using the **just provided user ZIP**, NOT older sheets.
- **User-provided image ZIP identified:** Library `/이미지 교체(1).zip` (~7.99 MB), same content as `/이미지 교체.zip`. Contains `백만대-센터.png`, `백만대-일반.png`, `백만대-회사.png` (1536×1024 each, 2×2), and `움찔 찾기/센터 나 일반/01..09.png` (250px square), `움찔 찾기/회사/01..09.png` (300px square). Preserve original ZIP and source images.
- **Actual working source:** user’s latest `GAIA-RPG-test-20261019.html` (from Library). Rebuilt previous audio experiment *from this version*, with separate audio bridge, without overwriting the original or touching street travel.
- **SOUND FIX:** Moved sound unlock to parent input capture (tap/touch/keyboard), before iframe game launch; legacy voices disabled via alternate sound bridge and legacy 7-voice life-suite array emptied. Omitted `start` sound sample entirely from runtime source map (no “Are you ready?”). Roped-game voice loop, cylinder 120→150 on repeated taps, water touch/holding breathing reaction. Effects independent from female voice; mixer preserved. Existing 9-game results/physics untouched.
- **IMAGE FIX:** At legacy iframe build time, replace only `MINI_ASSETS` entries for game kind 0 animals (9 for company, 9 for all other places) and kind 3 `poses/tap1..3.webp` (center/office/other variants). Source 2×2 sheet split with alpha-preserving individual crops. Fourth crop retained in original ZIP, not displayed in 3-actor game. No effect on game logic or hitboxes.
- **Verified Library deliverables (not GitHub source):**
  - `/GAIA-RPG-test-20261019-AUDIO-IMAGE-FIX.html` (51,931,727 bytes, SHA256 `11f559231a31dba99088d0244464ecdce0725cfd60aeb58570d862f27d20d7c9`, Library ID `libfile_83b999c960488191b33379c185edea62`).
  - `/GAIA-RPG-20261019-SOUND-IMAGE-FIX.zip` (38,115,773 bytes, SHA256 `00beaedd410cc13c0204551f9d8b3e62d46c0c31bb27f31488b1a3fbc676667c`, Library ID `libfile_f59dc907df688191869cc5865d8997dc`). Contains HTML, changelog, README; ZIP CRC test passed.
  - `/GAIA-CHANGELOG-20261019.md` (Library ID `libfile_1a42167493ac81918ae5ebfdf7aa7bee`).
- **Browser verification:** Prior sound fix test showed rope background voice start/pause stop, cylinder 120 start→150 rapid taps, water shoot→female reaction event; no reported bridge-level play/decode errors. Separate Chromium test loaded the final image-enhanced HTML and entered actual `움찔 찾기` in company + center and `백만 대` in company + center, confirming proper data images inside iframe. Verified 9+9 and 3+3 asset mappings. `about:blank` test runs showed IndexedDB restrictions from the test origin and an unrelated page error; no full 9-game run or Android audio listening was done.
- **Status:** Sound and image changes completed and uploaded to user's Library (separate offline HTML), with changelog. Only this HANDOFF documentation was committed to GitHub `main`. **Do not claim** the GitHub `index.html` contains these changes and do not replace the newer work with older `main`.
- **Next AI:** Read `HANDOFF.md` first, then `/GAIA-CHANGELOG-20261019.md` and **use `/GAIA-RPG-test-20261019-AUDIO-IMAGE-FIX.html` as the latest TEST baseline**, confirm Android audibility in all 9 minigames and location-specific images; integrate new Work changes carefully rather than blindly replacing the HTML.

### 2026-10-19 KST | END / HANDOFF | ChatGPT (Wiggle Find landscape square layout)

- **User request:** Keep portrait presentation as is. In landscape mode, make the `움찔 찾기` 3×3 picture grid a large **square** and move time, score, streak and countdown progress **to the side**.
- **Source baseline:** `GAIA-RPG-test-20261019-AUDIO-IMAGE-FIX2.html`, which already preserves the user ZIP image swaps, sound fixes and newest available street/inter-location travel work. Do **not** regress by copying the GitHub `index.html`.
- **Change scope:** Only the `MINI_SOURCE.main` code embedded in latest standalone HTML. `mgWiggle()` now uses three separate HUD fields; on wide landscape (width >=700px) it puts the HUD/progress in the existing right-side NPC panel, scales the nine-image grid as one square up to available viewport height, and handles orientation changes and listener cleanup. Portrait HUD is restored to its previous original board location. Existing square-image `object-fit:cover` setting retained. Other minigames, audio, image assets, score, timing, and travel code not intentionally changed.
- **Authoritative new test artifact saved in Library root (NOT GitHub game source):** `/GAIA-RPG-test-20261019-AUDIO-IMAGE-WIGGLE-SQUARE.html`, 51,932,644 bytes, SHA256 `72823b24aa2d8be0b5eabaeafaa119ea63ca7e5a83f4cd97ab8907aa18153a70`, Library ID `libfile_3dd50ba1eb648191aa23ac0a340c991c`.
- **Download ZIP:** `/GAIA-RPG-20261019-WIGGLE-SQUARE.zip`, SHA256 `387da22b2edba779fa5b394386ee4bd6970e19ecfa34e9a0290651def9c57929`, Library ID `libfile_7b8a485ea554819187bb5567055da4f2`. Change log: `/GAIA-WIGGLE-SQUARE-CHANGELOG.md`, Library ID `libfile_b8b5384325ec8191913c5f8974a0c48e`.
- **Validation:** Extracted `MINI_SOURCE.main` passed `node --check`. Chromium fixture reusing the production CSS passed square grid and non-overlapping side HUD at 1280×720, 1024×768, 960×540, 854×480; rotating to 650×980 returned HUD to board and cleared landscape class. ZIP integrity/CRC test passed. **Full 52 MB integrated Chromium run timed out** in the isolated environment; real Android screen test still pending. Do not describe the integration as fully tested.
- **GitHub scope:** Only append to `HANDOFF.md`. Original HTML and former FIX2 stay available, no GitHub game code touched.
- **Next step:** Android landscape visual test and adjust spacing if requested; use the Library WIGGLE-SQUARE HTML as newest game-file baseline and preserve all sound/image/road changes.

### 2026-10-19 13:55 KST | END / HANDOFF | ChatGPT (Behind sprite replacement)

- **Exact user request:** Stop image generation. Cut and use the exact user-uploaded `뒤를조심(1).png` (1992×1168 transparent RGBA) in **뒤를 조심!!** game: top row 6 frames, second row 5 return frames (first duplicate excluded), lower three directional comedic knockback images. Animate them in order, freeze the leg-spread pose briefly and **ONLY allow hits then**, while the actor moves left-right along a large fan-shaped curved slide. Do not add new images or change other games.
- **Working baseline:** `/GAIA-RPG-test-20261019-AUDIO-IMAGE-WIGGLE-SQUARE.html` in Library, **NOT** the older GitHub game `index.html`. Existing sound, new image overrides, square landscape Wiggle Find and road movement retained.
- **Actual new executable:** `/GAIA-RPG-test-20261019-BEHIND-SPRITE.html` (52,284,190 bytes; SHA256 `c95d42ebeb6da0da8ac7c91b98ebc973a66b18d50bce42901ea7a8a0f9a6d7c0`, Library ID `libfile_f8a6fbbfb93c81919dd04457cdf3739a`). **This is the newest game-file baseline.**
- **Download package:** `/GAIA-RPG-20261019-BEHIND-SPRITE.zip` (40,555,201 bytes; SHA256 `7a885ef90128c506a9de1ce24ff48a7fdc21c2eb57d1324f68d5200ebd3b0c88`, Library ID `libfile_604b523604908191b90840ddbbc6baa2`). Contains HTML, README, changelog and source-sprite ZIP. Frame archive `/GAIA-BEHIND-SPRITE-ASSETS-20261019.zip` (Library ID `libfile_f33f6a7b57a48191ade68583ce41b357`) includes exact cut 11 movement + 3 knockback PNG frames and original user PNG. Changelog `/GAIA-BEHIND-SPRITE-CHANGELOG-20261019.md` (Library ID `libfile_0535c3b983788191b7f91b4d0e4d9f92`).
- **Only game kind 4 changed:** extended `MINI_SOURCE.main` image loading / preview; adapted `MINI_SOURCE.behind` target timing, rendering, motion/collision gate and directional fly animation. Movement uses 16%-84% screen width and a sine-shaped fan arc with rise up to 13% of height, alternating direction. Holding the sixth frame lasts 0.52 s; `target.open` gates collision. Throw inputs, trajectories, scoring/timer and other game code not intentionally changed.
- **Verification:** Node syntax check on extracted `main` and `behind` passed, image archive ZIP CRC passed. Headless Chromium test using the same game build loaded all 14 cut assets (11 + 3), opened Behind kind=4 and rendered its active game canvas. Parent iframe harness used `about:blank` and emitted IndexedDB permission warning and a separate `null.textContent` pageerror; full game progression/real Android hit timing still require user testing. After this test, the variant flight path CSS received a small syntax-checked change (left/up/right), not independently replay-tested in browser. Avoid claiming all end-to-end tests passed.
- **Status:** All generated executable/ZIP/change log saved in Library; **GitHub game source not changed**. This `HANDOFF.md` record only is committed to GitHub. Preserve original game HTML and sprite sheet.
- **Next session:** Read HANDOFF first, then use `GAIA-RPG-test-20261019-BEHIND-SPRITE.html` as the latest test HTML and validate target timing on tablet; never replace it with previous game builds.

### 2026-10-19 KST | START / UPDATE / END | ChatGPT (Behind motion speed and crop fix)

- **User feedback:** In latest Behind sprite test, movement/animation are **far too fast**, and the invisible game-canvas boundary clips the character's **head**. Requested correction only to Behind; do not generate or redraw any image.
- **Baseline:** Library `/GAIA-RPG-test-20261019-BEHIND-SPRITE.html` based on exact user-supplied `뒤를조심(1).png`, including existing audio/image, landscape square Wiggle Find, and street travel. Do NOT substitute older GitHub `index.html`.
- **Changes restricted to embedded `MINI_SOURCE.behind`:** Frame step `0.105s → 0.22s` (about half speed); hit pose open hold `0.52s → 0.95s`. Lower actor foot anchor from canvas `62% → 84%`; lower fan arc rise `13% → 7%` of canvas height; clamp horizontal slide inset by visual sprite half-width plus padding to keep entire sprite inside the canvas. Since slower motion reduces chances in a 30s game, adjust success denominator `14 → 8` and fast-hit bonus age window `2.3s → 4.0s`. Hit detection remains **only during open pose**, all physics/throw inputs/other games unchanged.
- **New verified Library deliverables (game code NOT committed to GitHub):**
  - `/GAIA-RPG-test-20261019-BEHIND-SLOW-SAFE.html` (52,284,238 bytes; SHA256 `6cc1eb530b22d3132813012a72b8a2aeeb2e3cff649570c8cc81c65073593058`, Library ID `libfile_8755f6860fe88191a9d29cd7b6cc6803`) is the newest test baseline.
  - `/GAIA-RPG-20261019-BEHIND-SLOW-SAFE.zip` (38,379,007 bytes; SHA256 `149a3354b294773286dc393ec28e6df6a0d45f087b5daeedbcbd4e567e955b89`, Library ID `libfile_df60db3c2cc481918fb2fb525e152099`).
  - `/BEHIND-SLOW-SAFE-CHANGELOG.md` (Library ID `libfile_0ba56352f19c81918b7d49b74d6c9110`).
- **Validation:** Embedded Behind JavaScript passes `node --check`; ZIP CRC test passes. Chromium ran the new 52MB HTML: loaded all 11 movement + 3 knockback original-sprite frames; Behind kind 4 canvas rendered and screenshot saved. Numerical fan-arc/canvas tests passed at 840x540, 600x700, 400x720, 1280x720 and 960x540, with minimum head clearances 64.8, 167, 306.4, 86.4, 64.8px. Chromium harness on `about:blank` emitted known IndexedDB permission and null.textContent errors; no Android device validation and no complete 30s Behind playthrough has been performed.
- **Scope/status:** Saved updated offline test game and README/change log to Library, preserved previous HTML and source assets; only this HANDOFF entry is committed to GitHub `main`. Please confirm movement pace and visibility on user's tablet before further tuning.
- **Next action:** Open `GAIA-RPG-test-20261019-BEHIND-SLOW-SAFE.html` (not prior fast version), test Behind on landscape tablet, preserve all other game functions.

### 2026-10-19 KST | END / HANDOFF | ChatGPT (Behind independent fan slide)

- **User correction:** The old Behind character's opening/leg-spread pose happened exactly in the middle of the screen, so a player could score without changing aim. User's originally specified mechanic is that the character **folds and unfolds in its own local animation while the whole character independently slides left/right along a broad fan-shaped path**. Preserve 11 movement frames, short open-pose hold and hit-only-during-open gate. User also reported unwanted character name `나` floating over its head.
- **Baseline**: Library `/GAIA-RPG-test-20261019-BEHIND-SLOW-SAFE.html` (not older GitHub game HTML). **Only `MINI_SOURCE.behind` changed.**
- **Implemented**: Decoupled the character's 11-frame fold/unfold animation timing from continuous side-to-side travel position. Independent sine swing with full cycle 7.2–8.0 s, per-spawn randomized phase and period; continuous motion **through the 0.95s open-pose hold**, fan arc with prior safe bottom anchor and left/right clipping margins retained. Sliding direction only changes with movement tangent, not when frame loop restarts. Hit physics still verifies `target.open` only during the held sixth frame. Removed the overhead `나` character-name label from Behind. No new images or audio, no other minigame, road travel or mechanics changed.
- **New test baseline in Library**: `/GAIA-RPG-test-20261019-BEHIND-SLIDE-FIX.html` (52,284,456 bytes, SHA256 `5811252aa0bb9dad01d06745bd3d33c28561d2627de1524e81a81db5398d1f46`, Library ID `libfile_5c6795aeeebc8191af942dbb4bffc21e`). ZIP `/GAIA-RPG-20261019-BEHIND-SLIDE-FIX.zip` (38,378,764 bytes, SHA256 `1141b713a00f0549673c817527771b5e67db3538625f6f963a4694e313eff13a`, Library ID `libfile_9e7481c84a408191a53b5809997556bf`). Changelog `/BEHIND-SLIDE-FIX-CHANGELOG.md` Library ID `libfile_bda5684b689c8191a8c7dce919b6db79`.
- **Verification**: `node --check` passed on actual extracted Behind script; deterministic 16s simulation confirmed open-pose positions vary (example x=571,353,391,540,231 on 840 canvas), continuous ~74px travel during first 0.95s hold, 452px overall horizontal range, hit gate bound to held pose. Chromium test loaded the full 52MB HTML, found all 14 user sprite frames and active Behind canvas; audio/other game paths not retested here. The isolated harness emitted pre-existing IndexedDB permission and null.textContent errors. Real tablet targeting play remains user verification.
- **Status**: New executable, ZIP and MD persisted in Library. Only this HANDOFF documentation committed to GitHub; no GitHub game code changed. Preserve earlier test artifacts and use new `BEHIND-SLIDE-FIX.html` as latest game baseline for future changes.

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
