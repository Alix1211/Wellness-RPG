// R61 transform: only map setup, scene validation and entry coordinates.
// Embedded assets and dialogue strings are left byte-for-byte unchanged.
const PATCH={
  "modelAppend": "\n\n/* R61: R44 corridor/room interaction with R60 content and stable IDs. */\nwindow.GAIA_BELT_LAYOUT = {};\nfor (const [index, floor] of CenterModel.FLOORS.entries()) {\n  if (!['center', 'company', 'street'].includes(floor.place)) continue;\n  GAIA_BELT_LAYOUT[index] = {\n    width: floor.width,\n    rooms: floor.rooms.map(r => ({id:r.id, x:r.x, x0:r.x0, x1:r.x1}))\n  };\n  floor.locked = false;\n  floor.strip = false;\n  // The old elevator approaches the doorway at y=445, then steps out to y=575.\n  delete floor.gy;\n  if (floor.place !== 'street') {\n    floor.width = 420 + floor.rooms.length * 570;\n    floor.doorX = 95;\n    floor.rooms.forEach((r, i) => {r.x = 570 + i * 570;});\n  }\n}\nwindow.GAIA_MOVEMENT_BUILD = '20261105-R61-BELT';\n",
  "hostReplacements": [
    {
      "before": "function ensureSceneValid(){const s=world.scene,f=M.FLOORS[s.floor];if(!f||f.place==='unused'){M.changeFloor(world,0);return;}if(f.strip&&(s.type==='room'||!f.rooms[s.room])){world.scene={type:'corridor',floor:s.floor,room:0};world.player.x=220;world.player.y=f.gy;world.target=null;world.camera=0;}if(f.locked&&world.scene.type==='corridor')world.player.y=f.gy;}",
      "after": "function ensureSceneValid(){\n const s=world.scene,f=M.FLOORS[s.floor];\n if(!f||f.place==='unused'){M.changeFloor(world,0);return;}\n if(!f.rooms[s.room])s.room=0;\n if(f.strip&&s.type==='room'){\n  world.scene={type:'corridor',floor:s.floor,room:s.room};\n  world.player.x=f.rooms[s.room]?.x??f.entryX??220;\n  world.player.y=f.gy;world.target=null;world.camera=0;\n }\n const legacy=window.GAIA_BELT_LAYOUT?.[world.scene.floor];\n if(loaded&&legacy&&life.beltMapVersion!==1){\n  if(world.scene.type==='corridor'&&f.place!=='street'){\n   const oldRoom=legacy.rooms.find(r=>world.player.x>=r.x0&&world.player.x<r.x1);\n   const target=oldRoom&&f.rooms.find(r=>r.id===oldRoom.id);\n   world.player.x=target?target.x:220;\n  }\n  world.player.y=world.scene.type==='room'?644:575;\n  world.target=null;world.camera=0;life.beltMapVersion=1;\n }\n const b=M.bounds(world.scene);\n world.player.x=M.clamp(Number.isFinite(world.player.x)?world.player.x:640,b.left,b.right);\n world.player.y=M.clamp(Number.isFinite(world.player.y)?world.player.y:575,b.top,b.bottom);\n}"
    },
    {
      "before": "world.player.y=M.FLOORS[6].gy;",
      "after": "world.player.y=M.FLOORS[6].gy||575;"
    },
    {
      "before": "world.outfit=life.outfit||'jeans';}hud();save();}",
      "after": "world.outfit=life.outfit||'jeans';}ensureSceneValid();life.beltMapVersion=1;hud();save();}"
    }
  ]
};
export function restoreBeltScroll(html) {
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script\s*>/g)];
  if (scripts.length !== 23) throw Error('Unexpected R60 script count');
  const replacements = new Map([[7, scripts[7][2] + PATCH.modelAppend]]);
  let host = scripts[16][2];
  for (const {before, after} of PATCH.hostReplacements) {
    if (host.split(before).length !== 2) throw Error('Unexpected R60 host revision');
    host = host.replace(before, () => after);
  }
  replacements.set(16, host);
  for (const i of [16, 7]) {
    const match = scripts[i];
    const start = match.index + match[0].indexOf('>') + 1;
    html = html.slice(0, start) + replacements.get(i) + html.slice(start + match[2].length);
  }
  return html;
}
