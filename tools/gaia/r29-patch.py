#!/usr/bin/env python3
"""R29 (on top of R28 scripts): usage r29-patch.py WORKDIR
 Video layers keep their own aspect ratio: separate horizontal/vertical stretch is ignored for video
 (scale uses the horizontal ratio for both axes), the editor's two ratio sliders move together and
 the vertical one is disabled while a video is selected. Applies to background, board, targets and room layers."""
import sys
from pathlib import Path
W=Path(sys.argv[1])
def rd(n):return (W/n).read_text(encoding='utf8')
def wr(n,s):(W/n).write_text(s,encoding='utf8')
def sub(s,old,new,n=1):
    assert s.count(old)==n,(old[:90],s.count(old))
    return s.replace(old,new)
s=rd('script-06.js')
s=sub(s,"(bg.z||1)*(bg.sy||1)","(bg.z||1)*(/video/.test(bg.mime||'')?(bg.sx||1):(bg.sy||1))")
s=sub(s,"(v.z||1)*(v.sy||1)","(v.z||1)*(/video/.test(v.mime||'')?(v.sx||1):(v.sy||1))",2)
s=sub(s,"ctx.scale(v.z*(v.sx||1),v.z*(v.sy||1))","ctx.scale(v.z*(v.sx||1),v.z*(/video/.test(v.mime||'')?(v.sx||1):(v.sy||1)))")
s=sub(s,"video.style.objectFit=cfg.kind==='cylinder'?'contain':'cover';","video.style.objectFit='contain';")
wr('script-06.js',s)
s=rd('script-12.js')
s=sub(s,"(v.z||1)*(v.sy||1)","(v.z||1)*(/video/.test(v.mime||'')?(v.sx||1):(v.sy||1))")
s=sub(s,"const v=val();for(const[k,id]of Object.entries({x:'X',y:'Y',z:'Z',sx:'Sx',sy:'Sy',r:'R',opacity:'Opacity'}))q('#studio'+id).value=","const v=val(),isVideo=/video/.test(v.mime||'');if(isVideo)v.sy=v.sx;q('#studioSy').disabled=isVideo;for(const[k,id]of Object.entries({x:'X',y:'Y',z:'Z',sx:'Sx',sy:'Sy',r:'R',opacity:'Opacity'}))q('#studio'+id).value=")
s=sub(s,".oninput=e=>{val()[k]=+e.target.value;refresh();};",".oninput=e=>{const w=val(),n=+e.target.value;w[k]=n;if((k==='sx'||k==='sy')&&/video/.test(w.mime||''))w.sx=w.sy=n;refresh();};")
wr('script-12.js',s)
for n in ('script-06.js','script-12.js'):
    t=rd(n);t=t.replace("video.style.cssText='width:100%;height:100%;object-fit:cover'","video.style.cssText='width:100%;height:100%;object-fit:contain'");wr(n,t)
print('r29 patched')
