# GAIA CITY Wellness RPG

Single-file offline indoor life RPG prototype. Open `index.html` in Chrome. This private project is separate from the original `Alix1211/Wellness`, which is read-only reference material.

## Current build · 2026-10-17 v7

- Center: 6 corridors and 26 rooms; company: 3 corridors and 14 rooms.
- Home: 6 linked background scenes. Walk to either edge to change spaces. Use the top ⇄ button for Center / Company / Home.
- Center NPCs wear yoga/training outfits; company NPCs wear officewear/suits. Existing 72-frame protagonist animation and moving jump controls remain active.
- Three new square minigames: touch-aimed timed water filling (toilets), rope cutting into a bottom-center target (Center apparatus rooms), rhythmic pressure + random hearts (company shared offices and home living room).
- Existing minigames remain connected in their Center rooms. Best results are saved locally. New RPG growth, employment, marriage conditions, economy and cross-device sync are not added by this build.
- Change game art using each game's **그림 변경**. Top ▧ changes corridor pictures or the current home background. Images are stored only on the device, independently of hitboxes.

New protagonist: chestnut hair and green eyes, 72 extracted frames with common feet pivot and fixed render scale.

Offline copy: `builds/wellness-life-home-hero-v7.html`. Build: `python src/center/build.py`.

See [HANDOFF.md](HANDOFF.md), [Center implementation](src/center/README.md), [new minigames](src/minigames/life-suite/README.md) and `tools/test_life_*.cjs` for current decisions, configurable defaults and validation. Android device performance still needs user testing.

## Asset boundary

Original user character sheets are preserved. Derived home backgrounds have source hashes in `assets/backgrounds/home/provenance.json`. Some private character-source folders contain adult artwork; repository privacy must be preserved. The separate local photo/video gallery pack must never be committed. Runtime user-selected images are neither sent to a server nor committed.
