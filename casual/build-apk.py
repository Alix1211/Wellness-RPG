#!/usr/bin/env python3
"""Build a separate com.gaia.casual app, preserving the RPG install and its data."""
from pathlib import Path
import shutil,subprocess,os,sys,re,fcntl
root=Path(__file__).resolve().parents[1];here=Path(__file__).resolve().parent
lock=(here/'.apk-build.lock').open('w');fcntl.flock(lock,fcntl.LOCK_EX)
work=here/'android-work';(work/'android').mkdir(parents=True,exist_ok=True)
# Reuse maintained wrapper sources; never copy the RPG's bundled assets/build output.
shutil.copytree(root/'android/app/src/main',work/'android/app/src/main',dirs_exist_ok=True,ignore=shutil.ignore_patterns('assets'))
for p in (work/'android/app/src/main').rglob('*'):
 if p.is_file() and p.suffix in ['.java','.xml']:
  s=p.read_text().replace('com.gaia.life','com.gaia.casual').replace('GAIA LIFE','GAIA CASUAL').replace('1.1-R61','1.6-CASUAL-07').replace('1.0-R60','1.6-CASUAL-07').replace('R61','CASUAL-06').replace('R60','CASUAL-06').replace('android:versionCode="1"','android:versionCode="7"').replace('android:versionCode="2"','android:versionCode="7"')
  # Let existing responsive games work in both tablet orientations.
  if p.suffix=='.xml' and p.name=='AndroidManifest.xml':
   s=s.replace('<uses-permission android:name="android.permission.INTERNET"/>','<uses-permission android:name="android.permission.INTERNET"/><uses-permission android:name="android.permission.VIBRATE"/>')
  if p.name=='MainActivity.java':
   s=s.replace('immersive();prefs=getSharedPreferences("shell",MODE_PRIVATE);store=', 'immersive();prefs=getSharedPreferences("shell",MODE_PRIVATE);if(!prefs.getBoolean("official_update_v1",false)){prefs.edit().putString("update_url","https://gaia-casual-updates.sagebean9.chatgpt.site/update.json").putBoolean("official_update_v1",true).apply();}store=')
   s=s.replace('WebView web;','GaiaHaptics haptics; WebView web;')
   s=s.replace('web.addJavascriptInterface(new FileBridge(),"GaiaFiles");','web.addJavascriptInterface(new FileBridge(),"GaiaFiles");haptics=new GaiaHaptics(this);web.addJavascriptInterface(haptics,"GaiaHaptics");')
   s=s.replace('protected void onPause(){super.onPause();','protected void onPause(){if(haptics!=null)haptics.foreground(false);super.onPause();')
   s=s.replace('protected void onResume(){super.onResume();','protected void onResume(){super.onResume();if(haptics!=null)haptics.foreground(true);')
   s=s.replace('protected void onDestroy(){','protected void onDestroy(){if(haptics!=null)haptics.foreground(false);')
   s=s.replace('web.removeJavascriptInterface("GaiaFiles");','web.removeJavascriptInterface("GaiaFiles");web.removeJavascriptInterface("GaiaHaptics");')
   s=s.replace('GaiaHaptics haptics;', 'GaiaVideos videos; GaiaHaptics haptics;')
   s=s.replace('haptics=new GaiaHaptics(this);', 'videos=new GaiaVideos(this,web);web.addJavascriptInterface(videos,"GaiaVideos");haptics=new GaiaHaptics(this);')
   s=s.replace('Uri u=request.getUrl();if(!', 'WebResourceResponse media=videos.intercept(request);if(media!=null)return media;Uri u=request.getUrl();if(!')
   s=s.replace('super.onActivityResult(code,result,data);', 'super.onActivityResult(code,result,data);if(code==GaiaVideos.PICK){videos.result(result,data);return;}')
   s=s.replace('web.removeJavascriptInterface("GaiaHaptics");', 'web.removeJavascriptInterface("GaiaHaptics");web.removeJavascriptInterface("GaiaVideos");')
  if p.suffix=='.java':
   s=s.replace('void menu(){','void menu(){if(web!=null)web.evaluateJavascript("window.GaiaCasual?.pause()",null);')
   s=s.replace("try{window.GaiaAudioStatus?.reset();document.querySelectorAll","try{window.GaiaCasual?.pause();window.GaiaAudioStatus?.reset();document.querySelectorAll")
  s=s.replace('android:screenOrientation="sensorPortrait"','android:screenOrientation="fullSensor"')
  p.write_text(s)
shutil.copyfile(here/'GaiaVideos.java',work/'android/app/src/main/java/com/gaia/life/GaiaVideos.java')
shutil.copyfile(here/'GaiaHaptics.java',work/'android/app/src/main/java/com/gaia/life/GaiaHaptics.java')
shutil.copyfile(root/'GAIA-CASUAL-06.html',work/'GAIA-LIFE-20261020.html')
manifest=work/'builds/gaia-life-20261020';manifest.mkdir(parents=True,exist_ok=True);shutil.copyfile(here/'manifest.json',manifest/'manifest.json')
s=re.sub(r"final=out/'GAIA-LIFE-R\d+\.apk'","final=out/'GAIA-CASUAL-07.apk'",(root/'android/build.py').read_text())
(work/'android/build.py').write_text(s)
env={**os.environ,'GAIA_KEYSTORE':str(root/'android/private/gaia-life.jks'),'GAIA_KEYSTORE_PASS_FILE':str(root/'android/private/password.txt')}
subprocess.run([sys.executable,work/'android/build.py'],env=env,check=True)
shutil.copyfile(work/'android/build/GAIA-CASUAL-07.apk',root/'GAIA-CASUAL-07.apk')
shutil.copyfile(work/'android/build/build-result.json',here/'apk-verification.json')


