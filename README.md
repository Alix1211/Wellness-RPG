# GAIA CITY Wellness RPG

A **portrait-screen, stage-based RPG** set in GAIA CITY. This repository is the separate home for the new RPG; the existing Wellness project remains its own project.

## Agreed direction

- The player moves freely between rooms within the currently available chapter.
- Chapters unlock in order: **Wellness Center → Company → Marriage/Home**.
- Character progression tracks five stats: **색기, 음란도, 개방성, 인내력, 친밀도**.
- **HP** and **M파워** are resources.
- Suitable minigames from Wellness will be adapted for RPG encounters and progression.
- Characters use costume sprites. The movement sprite sheet may be used as-is for the first pass; gait polish can follow gameplay validation.
- User-supplied ZIP image packs are imported locally and stay outside source control.

## Current state

This is a planning and setup skeleton. The gameplay engine, data format, controls, stat formulas, chapter gates, save format, minigame integration, and asset pipeline are still to be specified. No gameplay implementation or image assets are included yet.

## Repository layout

- `HANDOFF.md` — current decisions, reuse strategy, and implementation questions.
- `src/` — reserved for game code after the technical design is agreed.
- `assets/` — guidance for reviewed public assets and local-only imports.

## Asset boundary

Do not commit adult images or user-imported ZIP packs to GitHub. Keep imported packs under `assets/local/` (ignored by Git). Only intentionally reviewed, distributable, non-adult assets should go under a future tracked public asset path. Check rights and contents before any asset commit.
