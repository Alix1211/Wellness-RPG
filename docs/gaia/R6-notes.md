# R6 (2026-10-20)

## Done
1. **Protagonist room background** — `ART["bg/starter-villa"]` (단칸 빌라 + opening) replaced by the pink room art (webp q88, 1536x864). Source jpg: `assets/backgrounds/starter-villa-pink-room.jpg`.
2. **New teasing lines (17)** appended to `ORIGINAL_DIALOGUE` pools (`n:*` center trainers, `o:*` office peers/superiors). Existing lines untouched. Tone: trainers/peers call her 암캐/신입계집, superiors strict and cold, heroine answers with exaggerated devotion. No explicit sexual-act wording in the new lines. Generator kept as `tools/gaia/r6-add-lines.py.txt`.
3. **Minigame result reaction lines** — `RESULT_LINES` (9 games x success/fail x 2 variants) in `script-16.js`; `endGame()` stores `life.living.resultLine`, `flowSpeak()` shows it (then the flow hint) as protagonist dialogue. Road cylinder encounter (settled by CityTravel) does not show it yet.
4. `tools/gaia/make-parts.py LABEL html` builds the committed gzip parts + manifest.

## Not done
- Road encounter / late-night queue scenes (new scene + lines).
- Male portraits (waiting for art), field pad support, male NPC silhouettes.
- 점원 인사 빈도 (once per day?) — waiting for decision.
