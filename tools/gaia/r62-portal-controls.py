#!/usr/bin/env python3
"""R61 -> R62: stop portal ping-pong and give the road run button its space back."""
import sys
from pathlib import Path

work = Path(sys.argv[1])
p = work / 'script-13.js'
road = p.read_text(encoding='utf-8')
start = road.index(" const testEnc=document.createElement('button');")
end = road.index(" back=document.createElement('button');", start)
road = road[:start] + road[end:]
p.write_text(road, encoding='utf-8')

p = work / 'script-16.js'
s = p.read_text(encoding='utf-8')

def replace(old, new, count=1):
    global s
    assert s.count(old) == count, (s.count(old), old[:100])
    s = s.replace(old, new)

helpers = r'''/* R62 portal input: physical holds survive resetInput(), unlike logical movement. */
const portalKeys=new Set(),portalPointers=new Set();let portalNeedsRelease=false;
document.addEventListener('keydown',e=>{if(!e.target.matches('input,textarea,select'))portalKeys.add(e.key.toLowerCase());},true);
document.addEventListener('keyup',e=>portalKeys.delete(e.key.toLowerCase()),true);
document.addEventListener('pointerdown',e=>portalPointers.add(e.pointerId),true);
for(const ev of ['pointerup','pointercancel'])document.addEventListener(ev,e=>portalPointers.delete(e.pointerId),true);
addEventListener('blur',()=>{portalKeys.clear();portalPointers.clear();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){portalKeys.clear();portalPointers.clear();}});
function armPortal(){portalNeedsRelease=true;}
function portalReady(){
 if(portalNeedsRelease){
  if(portalKeys.size||portalPointers.size)return false;
  portalNeedsRelease=false;
 }
 return portalCooldown<=0&&!liftState;
}
function safeStairArrival(f,preferred){
 const b=M.bounds(world.scene),left=b.left+30,right=b.right-30;
 const safe=x=>x>=left&&x<=right&&
  !(f.stairs||[]).some(t=>x>=t.x0-90&&x<=t.x1+90)&&
  !(f.doorX!=null&&Math.abs(x-f.doorX)<200);
 for(let d=0;d<=f.width;d+=100){
  for(const x of d?[preferred+d,preferred-d]:[preferred])if(safe(x))return x;
 }
 return M.clamp(f.entryX??f.width/2,left,right);
}
'''
replace('function resetInput(){', helpers+'function resetInput(){')
replace('function sceneChange(fn){resetInput();', 'function sceneChange(fn){armPortal();resetInput();')
replace("function useStairs(st){sceneChange(()=>{M.changeFloor(world,st.to);world.player.x=st.ax;world.player.y=floor().gy;world.camera=0;});}",
        "function useStairs(st){if(!portalReady())return false;sceneChange(()=>{M.changeFloor(world,st.to);world.player.x=safeStairArrival(floor(),st.ax);world.player.y=floor().gy||575;world.camera=0;});return true;}")
replace('function centerAction(){if(talkNear())return;', 'function centerAction(){if(!portalReady())return;if(talkNear())return;')
replace('function centerEdge(dy){const p=', 'function centerEdge(dy){if(!portalReady())return;const p=')
replace('function centerTap(x,y,joy){const f=', 'function centerTap(x,y,joy){if(joy)return false;if(!portalReady())return false;const f=')
replace("if(Math.abs(x-mx)<100&&y>130&&y<660){", "if(Math.abs(x-mx)<100&&y>210&&y<270){")
replace('function enterIndex(i){const r=', 'function enterIndex(i){if(!portalReady())return;const r=')
replace('function elevator(){if(liftState)return;', 'function elevator(){if(liftState||!portalReady())return;armPortal();')
replace('function streetExit(){cityStreetExit();}', 'function streetExit(){if(portalReady())cityStreetExit();}')
replace("if(mode!=='field'||$('#panel').open)return;if(world.scene.type==='corridor'&&floor().strip)",
        "if(mode!=='field'||$('#panel').open||!portalReady())return;if(world.scene.type==='corridor'&&floor().strip)")
replace('portalCooldown<=0&&!world.player.jumpTime', 'portalReady()&&!world.player.jumpTime', 2)
replace("liftState=null;portalCooldown=1;save();", "liftState=null;portalCooldown=1;armPortal();save();")
# A touch starting in the movement pad must never first click a doorway, stairs, or decoration.
replace("canvas.addEventListener('pointerdown',e=>{if(CityTravel.active)return;",
        "canvas.addEventListener('pointerdown',e=>{if(CityTravel.active)return;const joyZone=e.clientX<=innerWidth*.55&&e.clientY>=innerHeight*.38;")
replace("world.scene.type==='corridor'){const v=view(),x=e.clientX/v.s+v.cam", "world.scene.type==='corridor'&&!joyZone){const v=view(),x=e.clientX/v.s+v.cam")
replace("world.scene.type==='corridor'&&place()!=='street'&&!floor().strip){const v=view(),hit=", "world.scene.type==='corridor'&&!joyZone&&place()!=='street'&&!floor().strip){const v=view(),hit=")
p.write_text(s, encoding='utf-8')
print('R62: physical input release guard, safe stair landing, joystick hit separation, road test button removed')
