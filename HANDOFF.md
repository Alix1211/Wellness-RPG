# Handoff — GAIA CITY Wellness RPG

## Project scope

- Repository: `Alix1211/Wellness-RPG`, separate from the original Wellness repository.
- Portrait-screen, stage-based GAIA CITY RPG with movement between rooms in the active chapter.
- Chapter order: **Wellness Center → Company → Marriage/Home**; unlock criteria remain open.
- Stats: **색기, 음란도, 개방성, 인내력, 친밀도**. Resources: **HP** and **M파워**.
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

**Unavailable:** The requested four-legged moving and jumping sprite sheets were not in the referenced conversation's retrievable attachment list. They were not uploaded. Ask for the original files again before adding or wiring those animations; do not substitute unrelated images. The earlier discussion allowed a minor left/right foot mismatch in a movement sheet, but that discussion is not evidence that the file is present here.

## Privacy and publication

The repository was confirmed private before this asset upload. Nude/adult character art is in `assets/characters/portraits/adult-nude/`. Before making the repository public or publishing a public build with these files, explicitly warn the user that they would become exposed and get confirmation. The separate photo/video gallery pack stays local regardless of repository visibility. Do not copy images from the original Wellness repository or from unrelated conversations into this project without a specific asset decision.

## Implementation handoff for Claude/GPT

1. Keep the committed PNG sheets as source originals. Add derived/cropped/upscaled files in distinct paths with provenance only after they are produced and reviewed.
2. Define a portrait manifest mapping outfit, emotion, and sheet/cell position. Confirm crop boundaries and alpha edges visually before using cells in-game.
3. Design room movement, chapter gates, save data, five stats, HP/M파워, and a minigame interface before building a full gameplay loop.
4. Inventory original Wellness minigames read-only; adapt selected code/assets into this repository only after checking ownership and integration needs.
5. Keep local gallery imports under ignored paths such as `assets/local/`; never commit that private pack.

## Current implementation status

Repository documents, ten portrait/source sheets, and one isolated minigame performance prototype are present. No full RPG gameplay loop, four-legged movement/jump sheets, or private gallery pack has been committed.

## 2026-10-17 performance prototype

The user's current request explicitly calls for a **16:9 landscape fixed performance test**. This applies to `prototype/` only; the earlier portrait-screen direction for the full RPG remains open.

Read-only inspection of Wellness selected **소시지 합치기**: its Matter.js compound-body collisions run at fixed 120Hz while a 1280×1020 canvas is redrawn each animation frame. `prototype/` carries one adapted game, a full-viewport cover-cropped local MP4 layer, adjustable translucent game backdrop, opaque controls, reserved portrait/dialog area, a nonvideo fallback, and FPS/frame-drop counters. Generated stand-in sausage art avoids copying Wellness images; no private video or gallery files were added. `*.mp4` and related video suffixes are ignored globally.

The prototype has no APK or RPG integration. Follow `prototype/README.md` for Android Chrome testing. The browser environment used during implementation could not connect to the local test server; syntax and static checks were completed instead.
