'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const previous = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(root, '../v12_11_camera_gloss_patch/deliverable/GAIA-Pingpong-v12.11.html');
const output = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.join(root, 'deliverable/GAIA-Pingpong-Arcade-Powers-Trial.html');
const addon = fs.readFileSync(path.join(__dirname, 'arcade-powers.js'), 'utf8');
let html = fs.readFileSync(previous, 'utf8');
const prefix = 'const EMBEDDED_MATCH=';
const start = html.indexOf(prefix);
if (start < 0) throw Error('Embedded match was not found');
const end = html.indexOf('\n', start);
if (end < 0) throw Error('Match literal was not terminated');
let match = JSON.parse(html.slice(start + prefix.length, end).trim().replace(/;$/, ''));

function once(from, to) {
  const first = match.indexOf(from);
  if (first < 0 || match.indexOf(from, first + from.length) !== -1) {
    throw Error('Expected one occurrence: ' + from.slice(0, 110));
  }
  match = match.slice(0, first) + to + match.slice(first + from.length);
}

// One radius is shared by ball-table, ball-net and ball-racket collisions.
once('const NET_H = 0.3, BALL_R = 0.08;', 'const NET_H = 0.3; let BALL_R = 0.08;');
once('return 0.48 + Math.max(0, playerStats.speed - 60) * 0.0025;',
  'return (0.48 + Math.max(0, playerStats.speed - 60) * 0.0025) * (arcadePower.active === "bigRacket" ? 1.5 : 1);');
once("const reach = side === 'player' ? getPlayerReachRadius() : 0.46+(window._activeChamp?.defense ?? 60)*0.0015;",
  "const reach = side === 'player' ? getPlayerReachRadius() : (0.46+(window._activeChamp?.defense ?? 60)*0.0015)*(arcadePower.active === 'tinyRacket' ? 0.55 : 1);");

// AI has no actual visual viewport. Pink fog and paint affect its prediction.
once('const accuracy = (champ?.accuracy ?? 70) / 100;',
  "const accuracy = (champ?.accuracy ?? 70) / 100 * (['paint','pinkFog'].includes(arcadePower.active) ? 0.35 : 1);");
once('opponentRead.delay = 0.16 - defense * 0.08;',
  "opponentRead.delay = 0.16 - defense * 0.08 + (['paint','pinkFog'].includes(arcadePower.active) ? 0.18 : 0);");
once('oppRacketPos.x += dx*step;\n  oppRacketPos.z += dz*step;',
`if (arcadePower.active === 'slippery') {
    // Accelerate toward the desired target, but keep lateral inertia.
    const follow = 1 - Math.exp(-2.4 * dt);
    const vx = dx / Math.max(distance, 0.001) * moveSpeed;
    const vz = dz / Math.max(distance, 0.001) * moveSpeed;
    arcadePower.slipVX += (vx - arcadePower.slipVX) * follow;
    arcadePower.slipVZ += (vz - arcadePower.slipVZ) * follow;
    oppRacketPos.x += arcadePower.slipVX * dt;
    oppRacketPos.z += arcadePower.slipVZ * dt;
  } else {
    oppRacketPos.x += dx*step;
    oppRacketPos.z += dz*step;
  }`);

// The one-use allowance survives point resets and expires only on new match.
once('function scorePoint(scorer, reason, fromDeadBall) {',
  'function scorePoint(scorer, reason, fromDeadBall) {\n  arcadeResetPoint();');
once('function resetBall() {', 'function resetBall() {\n  arcadeResetPoint();');
once('function menuNewGame() {', 'function menuNewGame() {\n  arcadeResetMatch();');
once('const dt = realDt * gameTimeScale; // slow-mo scaling',
  'const dt = realDt * gameTimeScale; // slow-mo scaling\n  arcadeTick(realDt);');
once('// ─── START ───\ninitBackspinHold();',
  addon + '\n// ─── START ───\ninitBackspinHold();');

const lastScript = match.lastIndexOf('<script>');
const matchCode = match.slice(lastScript + 8, match.indexOf('</script>', lastScript));
new vm.Script(matchCode, {filename:'arcade-embedded-match.js'});
html = html.slice(0, start) + prefix + JSON.stringify(match).replaceAll('<','\\u003c') + ';' + html.slice(end);
const appStart = html.indexOf('<script type="module">');
new vm.Script(html.slice(appStart + '<script type="module">'.length, html.lastIndexOf('</script>')),
  {filename:'gaia-main-app.js'});
fs.mkdirSync(path.dirname(output), {recursive:true});
fs.writeFileSync(output, html);
console.log(JSON.stringify({output, htmlBytes:Buffer.byteLength(html), matchBytes:Buffer.byteLength(match), powerCount:8}));
