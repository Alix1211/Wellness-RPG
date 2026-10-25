# GAIA CITY — Belt-Scroll Battle Scene Assets

2026-10-25 image collection for the GAIA Detective / GAIA CITY battle maps.

This folder stores **original PNG image assets only**. The game code and existing scene selection are unchanged.

## Backgrounds

Each location has two distinct horizontal backgrounds, `a` and `b`, intended for side-scrolling stage sections. The rear scenery occupies approximately the upper half, with the open walking/combat corridor in the lower half.

| Prefix | Location | Files |
| --- | --- | --- |
| 01 | Alley / Backstreet | `01_alley_a.png`, `01_alley_b.png` |
| 02 | Club | `02_club_a.png`, `02_club_b.png` |
| 03 | Farm (outside / inside) | `03_farm_a.png`, `03_farm_b.png` |
| 04 | Hotel (lobby / corridor) | `04_hotel_a.png`, `04_hotel_b.png` |
| 05 | Entertainment District | `05_entertainment_district_a.png`, `05_entertainment_district_b.png` |
| 06 | Casino | `06_casino_a.png`, `06_casino_b.png` |
| 07 | Park | `07_park_a.png`, `07_park_b.png` |
| 08 | Film Studio | `08_film_studio_a.png`, `08_film_studio_b.png` |

**Design decisions:** The casino is a combat map in this version. Separate larger boss-room backgrounds, if added later, are *not* represented by these sixteen scene images. No game logic is changed by this asset upload.

## UI

| File | Contents |
| --- | --- |
| `ui/combat_buttons_4.png` | Four circular combat buttons: upper attack, lower attack, jump, defense |
| `ui/frames_gauges_textboxes.png` | Round and square portrait frames; HP and energy bars; three rounded text boxes |
| `ui/inventory_plates.png` | Inventory square slot; large plain square plate; plain 3:4 portrait plate |

Palette: rose gold, pink, mint. UI sheets retain original transparent PNG format and spaced elements for cropping.
