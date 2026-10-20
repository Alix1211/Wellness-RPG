#!/usr/bin/env python3
"""Bat-hit sound candidates (no ringing tones). Usage: make-bat-sounds.py OUT_DIR
Writes A/B/C x perfect/good as .wav and .ogg. A = dry wood crack (default in game), B = thick thump, C = big hit with short room."""
import sys,subprocess
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io import wavfile
SR=44100
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
def bp(x,lo,hi):
    b,a=signal.butter(2,[lo/(SR/2),hi/(SR/2)],'band');return signal.lfilter(b,a,x)
def build(kind,var,seed):
    rng=np.random.default_rng(seed);n=int(SR*(.30 if var=='C' else .22));t=np.arange(n)/SR
    nz=rng.normal(size=n)
    click=bp(nz,4000,11000)*np.exp(-t/.0022)
    crack=bp(nz,1500,6500)*np.exp(-t/{'A':.012,'B':.008,'C':.010}[var])
    wood=bp(nz,280,950)*np.exp(-t/{'A':.020,'B':.030,'C':.026}[var])
    f=60+{'A':110,'B':95,'C':80}[var]*np.exp(-t*60);ph=2*np.pi*np.cumsum(f)/SR
    thump=np.sin(ph)*np.exp(-t/{'A':.022,'B':.045,'C':.050}[var])
    g={'A':(1.0,1.0,.9,.9),'B':(.55,.8,1.2,1.7),'C':(.8,1.0,1.1,1.5)}[var]
    big=1.0 if kind=='perfect' else .62
    x=(click*.9*g[0]+crack*1.1*g[1]+wood*1.0*g[2]+thump*1.4*g[3])*big
    if kind=='good':x=x*np.exp(-t/.09)
    if var=='C':
        ir=rng.normal(size=int(SR*.12))*np.exp(-np.arange(int(SR*.12))/SR/.035);ir[0]=0
        x=x+signal.fftconvolve(x,ir)[:n]*.10
    x=np.tanh(x*1.5);x[:int(SR*.0006)]*=np.linspace(0,1,int(SR*.0006))
    x=x/np.max(np.abs(x))*.89;fade=int(SR*.02);x[-fade:]*=np.linspace(1,0,fade)
    return x
for var,seed in (('A',11),('B',22),('C',33)):
    for kind in ('perfect','good'):
        x=build(kind,var,seed+(0 if kind=='perfect' else 7));w=out/f'bat_{var}_{kind}.wav'
        wavfile.write(w,SR,(x*32767).astype(np.int16))
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(w),'-c:a','libvorbis','-q:a','4',str(w.with_suffix('.ogg'))],check=True)
print('ok',sorted(p.name for p in out.glob('*.ogg')))
