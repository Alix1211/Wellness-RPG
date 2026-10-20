# R6 (2026-10-20)

## Done
1. **Protagonist room background** — `ART["bg/starter-villa"]` (단칸 빌라 + opening) replaced by the pink room art (webp q88, 1536x864). Source jpg: `assets/backgrounds/starter-villa-pink-room.jpg`.
2. **New teasing lines (17)** appended to `ORIGINAL_DIALOGUE` pools (`n:*` center trainers, `o:*` office peers/superiors). Existing lines untouched. Tone: trainers/peers call her 암캐/신입계집, superiors strict and cold, heroine answers with exaggerated devotion. No explicit sexual-act wording in the new lines. Generator kept as `tools/gaia/r6-add-lines.py.txt`.
3. **Minigame result reaction lines** — `RESULT_LINES` (9 games x success/fail x 2 variants) in `script-16.js`; `endGame()` stores `life.living.resultLine`, `flowSpeak()` shows it (then the flow hint) as protagonist dialogue. Road cylinder encounter (settled by CityTravel) does not show it yet.
4. `tools/gaia/make-parts.py LABEL html` builds the committed gzip parts + manifest.

5. **Road encounter lines** — intro overlay (over-apology + over-plea + '미션 시작!') with 4 variants; result headings '용서해 주셔서 감사합니다!' / '아앙…… 죄송합니다……' (inside CITY_ENCOUNTER_DOCUMENT, script-13).
6. **Stat balance** (`script-07` GaiaLife):
   - cylinder (room): two distinct random stats, 11 and 8 (was fixed um8/ki6/bo3/ge2). Road cylinder success: two distinct random stats +1 each (was ki+1, um+1) and the toast shows which.
   - center games rebalanced so one full center cycle (5, water, rope, 0, 2, 3, 4) gives ~31/31/30/31 (was bo40/ge31/ki28/um24). Per-game sums unchanged.
   - diminishing gain: each stat gain x (1 - stat/250).
   - gates: besides average (job 50, home 80) the lowest stat must be >= 30 (job, close 25) and >= 60 (home, close 55). Messages updated.
   - Open question: cylinder pass threshold (900 pass / 1100 excellent proposed) not applied; needs score samples.

## Not done
- Late-night queue scene (new scene + lines).
- Male portraits (waiting for art), field pad support, male NPC silhouettes.
- 점원 인사 빈도 (once per day?) — waiting for decision.
