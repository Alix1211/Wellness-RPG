#!/usr/bin/env python3
"""Restore depth movement and separate rooms on top of R60, without editing dialogue.

Usage: r61-belt-scroll.py EXTRACTED_SCRIPT_DIRECTORY
Keeps R60 room IDs, game assignments, home floors, embedded assets and save keys.
"""
import sys
from pathlib import Path

work = Path(sys.argv[1])
model = work / 'script-07.js'
host = work / 'script-16.js'

layout = r'''
/* R61: R44 corridor/room interaction with R60 content and stable IDs. */
window.GAIA_BELT_LAYOUT = {};
for (const [index, floor] of CenterModel.FLOORS.entries()) {
  if (!['center', 'company', 'street'].includes(floor.place)) continue;
  GAIA_BELT_LAYOUT[index] = {
    width: floor.width,
    rooms: floor.rooms.map(r => ({id:r.id, x:r.x, x0:r.x0, x1:r.x1}))
  };
  floor.locked = false;
  floor.strip = false;
  // The old elevator approaches the doorway at y=445, then steps out to y=575.
  delete floor.gy;
  if (floor.place !== 'street') {
    floor.width = 420 + floor.rooms.length * 570;
    floor.doorX = 95;
    floor.rooms.forEach((r, i) => {r.x = 570 + i * 570;});
  }
}
window.GAIA_MOVEMENT_BUILD = '20261105-R61-BELT';
'''

source = model.read_text()
assert 'GAIA_BELT_LAYOUT' not in source, 'Already patched'
model.write_text(source + '\n' + layout)

source = host.read_text()
old = "function ensureSceneValid(){const s=world.scene,f=M.FLOORS[s.floor];if(!f||f.place==='unused'){M.changeFloor(world,0);return;}if(f.strip&&(s.type==='room'||!f.rooms[s.room])){world.scene={type:'corridor',floor:s.floor,room:0};world.player.x=220;world.player.y=f.gy;world.target=null;world.camera=0;}if(f.locked&&world.scene.type==='corridor')world.player.y=f.gy;}"
new = r'''function ensureSceneValid(){
 const s=world.scene,f=M.FLOORS[s.floor];
 if(!f||f.place==='unused'){M.changeFloor(world,0);return;}
 if(!f.rooms[s.room])s.room=0;
 if(f.strip&&s.type==='room'){
  world.scene={type:'corridor',floor:s.floor,room:s.room};
  world.player.x=f.rooms[s.room]?.x??f.entryX??220;
  world.player.y=f.gy;world.target=null;world.camera=0;
 }
 const legacy=window.GAIA_BELT_LAYOUT?.[world.scene.floor];
 if(loaded&&legacy&&life.beltMapVersion!==1){
  if(world.scene.type==='corridor'&&f.place!=='street'){
   const oldRoom=legacy.rooms.find(r=>world.player.x>=r.x0&&world.player.x<r.x1);
   const target=oldRoom&&f.rooms.find(r=>r.id===oldRoom.id);
   world.player.x=target?target.x:220;
  }
  world.player.y=world.scene.type==='room'?644:575;
  world.target=null;world.camera=0;life.beltMapVersion=1;
 }
 const b=M.bounds(world.scene);
 world.player.x=M.clamp(Number.isFinite(world.player.x)?world.player.x:640,b.left,b.right);
 world.player.y=M.clamp(Number.isFinite(world.player.y)?world.player.y:575,b.top,b.bottom);
}'''
assert source.count(old) == 1, 'Unexpected R60 scene validator'
source = source.replace(old, new)
# Street gate code had hard-coded floor-line coordinates from the strip layout.
for old, new in [
    ("world.player.y=M.FLOORS[6].gy;", "world.player.y=M.FLOORS[6].gy||575;"),
    ("world.outfit=life.outfit||'jeans';}hud();save();}",
     "world.outfit=life.outfit||'jeans';}ensureSceneValid();life.beltMapVersion=1;hud();save();}")
]:
    assert source.count(old) == 1, old
    source = source.replace(old, new)
host.write_text(source)
print('R61 belt movement / room entry restored; dialogue and asset scripts untouched')
