#!/usr/bin/env python3
"""Build a separate com.gaia.casual app, preserving the RPG install and its data."""
from pathlib import Path
import shutil,subprocess,os,sys,re
root=Path(__file__).resolve().parents[1];here=Path(__file__).resolve().parent
work=here/'android-work';(work/'android').mkdir(parents=True,exist_ok=True)
# Reuse maintained wrapper sources; never copy the RPG's bundled assets/build output.
shutil.copytree(root/'android/app/src/main',work/'android/app/src/main',dirs_exist_ok=True,ignore=shutil.ignore_patterns('assets'))
for p in (work/'android/app/src/main').rglob('*'):
 if p.is_file() and p.suffix in ['.java','.xml']:
  s=p.read_text().replace('com.gaia.life','com.gaia.casual').replace('GAIA LIFE','GAIA CASUAL').replace('1.1-R61','1.0-CASUAL-01').replace('1.0-R60','1.0-CASUAL-01').replace('R61','CASUAL-01').replace('R60','CASUAL-01').replace('android:versionCode="2"','android:versionCode="1"')
  # Let existing responsive games work in both tablet orientations.
  if p.suffix=='.java':
   s=s.replace('void menu(){','void menu(){if(web!=null)web.evaluateJavascript("window.GaiaCasual?.pause()",null);')
   s=s.replace("try{window.GaiaAudioStatus?.reset();document.querySelectorAll","try{window.GaiaCasual?.pause();window.GaiaAudioStatus?.reset();document.querySelectorAll")
  s=s.replace('android:screenOrientation="sensorPortrait"','android:screenOrientation="fullSensor"')
  p.write_text(s)
shutil.copyfile(root/'GAIA-CASUAL-01.html',work/'GAIA-LIFE-20261020.html')
manifest=work/'builds/gaia-life-20261020';manifest.mkdir(parents=True,exist_ok=True);shutil.copyfile(here/'manifest.json',manifest/'manifest.json')
s=re.sub(r"final=out/'GAIA-LIFE-R\d+\.apk'","final=out/'GAIA-CASUAL-01.apk'",(root/'android/build.py').read_text())
(work/'android/build.py').write_text(s)
env={**os.environ,'GAIA_KEYSTORE':str(root/'android/private/gaia-life.jks'),'GAIA_KEYSTORE_PASS_FILE':str(root/'android/private/password.txt')}
subprocess.run([sys.executable,work/'android/build.py'],env=env,check=True)
shutil.copyfile(work/'android/build/GAIA-CASUAL-01.apk',root/'GAIA-CASUAL-01.apk')
shutil.copyfile(work/'android/build/build-result.json',here/'apk-verification.json')
