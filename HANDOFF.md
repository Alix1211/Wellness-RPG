# Handoff — GAIA CITY Wellness RPG

## Scope agreed so far

- New, separate repository: `Alix1211/Wellness-RPG`.
- Portrait-screen, stage-based RPG in GAIA CITY.
- Free character movement between rooms within the active chapter.
- Sequential chapter unlocks: **Wellness Center → Company → Marriage/Home**. Later chapters remain locked until their earlier chapter's requirements are met; exact requirements are open.
- Five stats: **색기, 음란도, 개방성, 인내력, 친밀도**.
- Resources: **HP** and **M파워**.
- Reuse appropriate minigames from the existing Wellness game.
- Use character costume sprites. A movement sprite sheet exists; minor left/right foot mismatch was considered acceptable for now.
- User-imported local ZIP image packs must remain local and out of GitHub.
- No adult images belong in this repository.

## Reuse strategy

1. Inventory the Wellness minigames and their dependencies **read-only** before choosing which to adapt. Do not modify the original Wellness repository as part of this project.
2. Define a small interface between an RPG encounter and each reused minigame: entry conditions, result, HP/M파워 costs or rewards, stat effects, and return destination.
3. Port or adapt only the selected minigame code and assets after checking ownership, licenses, and suitability. Keep source attribution where needed.
4. Build the RPG's room movement, chapter gates, and state/save model around those interfaces. Preserve the portrait layout as a design constraint.
5. Keep costume sprite manifests separate from image files so locally imported packs can be substituted without entering source control.

## Proposed first playable slice

A portrait-screen Wellness Center with room-to-room movement, one encounter using an adapted minigame, and visible HP/M파워 plus the five stats. This is a proposed validation slice, not a finalized implementation spec.

## Decisions needed before core code

- Runtime/engine and target platforms; reference device size and input method.
- Room map and movement rules, chapter completion/unlock conditions.
- Definitions, ranges, and update rules for the five stats and two resources.
- Which Wellness minigame to reuse first and its integration contract.
- Costume sprite dimensions, animation states, naming, and local import workflow.
- Save data and content rating/distribution requirements.

## Current implementation status

Only repository documentation, ignore rules, and empty code/asset guidance are initialized. No gameplay or images have been committed.
