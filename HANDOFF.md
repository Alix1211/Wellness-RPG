# Handoff — GAIA CITY Wellness RPG

## Project scope

- Repository: `Alix1211/Wellness-RPG`, separate from the original Wellness repository.
- GAIA CITY life RPG controlling one female member; indoor belt-scroll movement is the agreed map direction. No street travel map. Discuss map layout/resources with the user before implementation.
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
- Original special (별도 훈련방) is **화장실 훈련방**, explicitly corrected by the user. Leave its minigame unassigned for discussion. 뒤를 조심!! moves to the group-room candidate list.
- Imported 3 original scripts, complete minigame image/audio directories, Matter.js/license and four item dependencies. All 105 copied blobs match the pinned original ad0b677a965607e75bb86d555d1ce1dc45e1a342. JS syntax checks passed; no six-game RPG runtime has been wired or tested.
- Early Center expenses are loans; later income is salary and events, used for repayment, training and items. Three male partner routes are planned, with continuing play after marriage. Keep story light; missions/minigames support player-directed life and growth.
- Places: own home, Center, company, later Dream House. Instant travel between places; belt-scroll movement indoors. Open entrances; doors are rare. Map resources/layout must be discussed before building. No map work was done in this import.
