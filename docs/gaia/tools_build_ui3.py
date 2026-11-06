import json,re,sys
A=json.load(open('ui3/assets.json'))
u=lambda k:'url('+A[k]+')'
css=f"""
:root{{--u3-cream:#f9ede1}}
dialog#panel{{border-width:46px 38px 44px!important;border-image:{u('frame')} 120 fill/46px 38px 44px/0 stretch!important;padding:2px 8px!important}}
dialog#panel .close{{width:36px!important;height:36px!important;border:0!important;border-radius:0!important;background:{u('close')} center/contain no-repeat!important;box-shadow:none!important;font-size:0!important;top:-2px!important;right:0!important}}
dialog#panel .close:focus,dialog#panel .close:focus-visible{{outline:none!important}}
dialog#panel .panel-button,dialog#panel:not(.compact-menu) .panel-button{{border-width:0 24px!important;border-image:{u('pill1')} 0 48 0 48 fill/0 24px 0 24px stretch!important;text-shadow:0 1px 2px #b0386a99}}
dialog#panel .profile-tabs button{{border-width:0 24px!important;border-image:{u('tab2')} 0 40 0 40 fill/0 24px 0 24px stretch!important;color:#a65a7a!important;text-shadow:none!important}}
dialog#panel .profile-tabs button.selected{{border-image:{u('tab1')} 0 40 0 40 fill/0 24px 0 24px stretch!important;color:#fff!important;text-shadow:0 1px 2px #b0386a99!important}}
dialog#panel input:not([type=range]):not([type=number]){{border:0!important;border-width:0 20px!important;border-image:{u('input')} 0 34 0 34 fill/0 20px 0 20px stretch!important;background:none!important;border-radius:0!important;padding:8px 4px!important;color:#7a4a60}}
dialog#panel .stat-row progress{{height:14px!important;border:0!important;border-radius:9px!important;background:#c9a2b3!important}}
dialog#panel .stat-row progress::-webkit-progress-bar{{background:#c9a2b3!important;border-radius:9px}}
dialog#panel .stat-row progress::-webkit-progress-value{{background:linear-gradient(#ff9bbb,#ee4c85)!important;border-radius:9px!important}}
dialog#panel .stat-row progress::-moz-progress-bar{{background:linear-gradient(#ff9bbb,#ee4c85)!important;border-radius:9px!important}}
dialog#panel .inventory-grid button{{background:#fff3f6!important;border:2px solid #f2a7c0!important;border-radius:14px!important}}
dialog#panel.lift-guide{{width:min(660px,94vw)!important}}
dialog#panel.lift-guide .panel-list{{gap:8px!important;grid-template-columns:minmax(0,1fr)!important}}
dialog#panel.lift-guide .lift-floor{{min-width:0!important;width:100%!important;height:58px!important;min-height:58px!important;aspect-ratio:auto!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:flex-start!important;gap:16px!important;padding:0 8px!important;text-align:left;color:#fff!important}}
dialog#panel.lift-guide .lift-floor strong{{font:800 18px Gaia,system-ui!important;white-space:nowrap;flex:none;color:#fff;text-shadow:0 1px 3px #b0386a}}
dialog#panel.lift-guide .lift-floor small{{font:600 15px Gaia,system-ui!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;color:#fff5ee;text-shadow:0 1px 3px #b0386a}}
dialog#panel.lift-guide .lift-floor.current-floor{{filter:drop-shadow(0 0 5px #fff) brightness(1.06)}}
#heroHUD{{width:270px!important;height:84px!important;transform:none!important;background:none!important;display:block!important;filter:drop-shadow(0 3px 4px #7a3a5a40)!important;overflow:visible}}
body.city-road #heroHUD{{opacity:1!important}}\n#heroHUD::before{{content:'';position:absolute;inset:0;background:{u('hud')} center/100% 100% no-repeat;z-index:2;pointer-events:none}}
#heroHUD .avatar{{position:absolute!important;left:4.5%;top:22.5%;width:20%!important;height:64.3%!important;background:#f6dfd5!important;border-radius:50%!important;overflow:hidden;z-index:1}}
#heroHUD .avatar::after{{display:none!important}}
#heroHUD .avatar img{{left:0!important;top:0!important;width:100%!important;height:100%!important;border-radius:50%!important;object-position:center 10%}}
#heroHUD .resource{{position:absolute!important;inset:0!important;display:block!important;z-index:3;background:none!important;border:0!important;padding:0!important;margin:0!important;border-radius:0!important;gap:0!important}}
#heroHUD .meter{{position:absolute;left:28.5%;width:66%;top:33.8%;height:17%!important;background:none!important;overflow:hidden;border-radius:0}}
#heroHUD .meter.mp{{top:58.8%}}
#heroHUD .meter i{{display:none!important}}
#heroHUD .meter::after{{content:'';position:absolute;top:0;bottom:0;right:0;width:calc(100% - var(--hp,100%));background:var(--u3-cream);transition:width .25s;box-shadow:inset 2px 0 3px #c9a2b366}}
#heroHUD .meter.mp::after{{width:calc(100% - var(--mp,100%))}}
#heroHUD .meter span{{z-index:3;font-size:10px;padding:0 10px;color:#fff;text-shadow:0 1px 2px #b0386a}}
#wallet{{background:{u('tab2')} center/100% 100% no-repeat!important;padding:5px 22px 4px!important;min-width:84px;text-align:center!important;color:#8a4a68!important;text-shadow:none!important;top:12px!important;right:76px!important}}
#wallet small{{color:#a8708a}}
#storyPeek{{background:{u('tab2')} center/100% 100% no-repeat!important;border:0!important;border-radius:0!important;padding:10px 26px!important;color:#8a4a68!important;max-width:250px!important}}
#cityReturn,#corridorDecorTools button{{color:#fff!important;text-shadow:0 1px 2px #b0386a99;font-weight:800}}
#cityClock{{color:#8a4a68!important;font-weight:700;background-size:100% 100%!important;height:34px!important;min-height:34px!important;min-width:96px;padding:0 20px!important;display:inline-flex;align-items:center;justify-content:center}}
@media (max-width:560px){{
#heroHUD{{width:204px!important;height:63px!important}}
#heroHUD .meter span{{font-size:8px;padding:0 6px}}
#wallet{{right:68px!important;min-width:78px!important;padding:4px 14px 3px!important;font-size:12px!important}}
dialog#panel.lift-guide .lift-floor{{box-sizing:border-box!important;max-width:100%;gap:10px!important}}
dialog#panel.lift-guide .lift-floor strong{{font-size:14px!important}}
dialog#panel.lift-guide .lift-floor small{{font-size:11.5px!important}}
dialog#panel.lift-guide h2{{font-size:13px!important}}
dialog#panel.lift-guide{{width:97vw!important;border-width:44px 22px 42px!important;border-image-width:44px 22px 42px!important}}
dialog#panel.lift-guide .lift-floor{{gap:8px!important;padding:0 2px!important}}
dialog#panel.lift-guide .lift-floor strong{{font-size:13.5px!important}}
dialog#panel.lift-guide .lift-floor small{{font-size:11px!important}}
}}
"""
js="const UI3_ART="+json.dumps({k:A[k] for k in ['pill1','tab2','run','check','menu','gear','door_pink','door_gray']},ensure_ascii=False)+";\n"
js+="const UI3_CSS="+json.dumps(css,ensure_ascii=False)+";\n"
js+="""function ui3Install(){const R=document.documentElement.style,set=(k,v)=>R.setProperty('--ui-'+k,`url("${v}")`);set('button',UI3_ART.pill1);set('plate',UI3_ART.tab2);set('jump',UI3_ART.run);set('action',UI3_ART.check);set('menu',UI3_ART.menu);set('gear',UI3_ART.gear);document.head.append(Object.assign(document.createElement('style'),{id:'ui3Style',textContent:UI3_CSS}));}
const UI3_DOORS={};
function drawExitDoor(f,dx){const k=f.place==='company'?'gray':'pink';let i=UI3_DOORS[k];if(!i){i=UI3_DOORS[k]=new Image();i.src=UI3_ART['door_'+k];}if(!(i.complete&&i.naturalWidth))return;const h=290,w=h*i.naturalWidth/i.naturalHeight,b=540;ctx.drawImage(i,dx-w/2,b-h,w,h);}
"""
mjs=open('fix_map2.mjs',encoding='utf8').read()
i0=mjs.index('const CHANGES=')+len('const CHANGES=')
dec=json.JSONDecoder();arr,e=dec.raw_decode(mjs[i0:])
new=[
 {"script":16,"before":"function drawCenterFloor(){","after":js+"function drawCenterFloor(){","count":1,"_ui3":1},
 {"script":16,"before":"text('▲ 거리',dx,FL_Y+FL_T*.26,15,'#79516a');","after":"drawExitDoor(f,dx);","count":1,"_ui3":1},
 {"script":16,"before":"document.documentElement.style.setProperty('--ui-'+k,`url(\"${v}\")`);loaded=true;","after":"document.documentElement.style.setProperty('--ui-'+k,`url(\"${v}\")`);ui3Install();loaded=true;","count":1,"_ui3":1},
 {"script":16,"before":"$('#hpFill').style.width=world.hp+'%';$('#mpFill').style.width=world.mp+'%';","after":"$('#hpFill').style.width=world.hp+'%';$('#mpFill').style.width=world.mp+'%';$('#heroHUD').style.setProperty('--hp',Math.max(0,Math.min(100,world.hp))+'%');$('#heroHUD').style.setProperty('--mp',Math.max(0,Math.min(100,world.mp))+'%');","count":1,"_ui3":1},
]
arr=[a for a in arr if not a.get('_ui3')]
needle="box(f.doorX-54,265,108,260,8,'#efdad4','#c5aaa6');box(f.doorX-41,284,82,205,4,'#d9e9e2');text('거리',f.doorX,248,17);"
hit=0
for a in arr:
    if needle in a['after']:a['after']=a['after'].replace(needle,"drawExitDoor(f,f.doorX);");hit+=1
print('needle entries',hit)
arr+=new
open('fix_ui3.mjs','w',encoding='utf8').write(mjs[:i0]+json.dumps(arr,ensure_ascii=False)+mjs[i0+e:])
print(len(arr))
