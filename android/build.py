#!/usr/bin/env python3
"""Build the dependency-free WebView wrapper. Game HTML is restored, never patched."""
from pathlib import Path
import subprocess,os,sys,gzip,json,hashlib,zipfile,shutil
root=Path(__file__).resolve().parents[1]; android=root/'android';sdk=Path(os.environ.get('ANDROID_HOME','/tmp/android-sdk'));bt=sdk/'build-tools/35.0.0';platform=sdk/'platforms/android-35/android.jar';out=android/'build';out.mkdir(exist_ok=True)
def run(args):subprocess.run([str(x) for x in args],check=True)
source=root/'GAIA-LIFE-20261020.html'
if not source.exists():run([sys.executable,root/'tools/gaia/restore.py'])
manifest=json.loads((root/'builds/gaia-life-20261020/manifest.json').read_text());data=source.read_bytes()
assert len(data)==manifest['size'] and hashlib.sha256(data).hexdigest()==manifest['sha256'], 'Game does not match manifest'
assets=android/'app/src/main/assets';assets.mkdir(exist_ok=True,parents=True)
(assets/'game.html.gz').write_bytes(gzip.compress(data,compresslevel=6,mtime=0));(assets/'bundled.json').write_text(json.dumps({k:manifest[k] for k in ['build','sha256','size']},indent=2)+'\n')
res=android/'app/src/main/res';compiled=out/'resources.zip'
run([bt/'aapt2','compile','--dir',res,'-o',compiled])
base=out/'base.apk'
run([bt/'aapt2','link','-o',base,'-I',platform,'--manifest',android/'app/src/main/AndroidManifest.xml','-A',assets,'--min-sdk-version','26','--target-sdk-version','35',compiled])
classes=out/'classes';classes.mkdir(exist_ok=True)
java=sorted((android/'app/src/main/java').rglob('*.java'))
run(['java','-m','jdk.compiler/com.sun.tools.javac.Main','-encoding','UTF-8','-source','8','-target','8','-bootclasspath',str(bt/'core-lambda-stubs.jar')+os.pathsep+str(platform),'-d',classes,*java])
classfiles=sorted(classes.rglob('*.class'));dex=out/'dex';dex.mkdir(exist_ok=True)
run([bt/'d8','--release','--min-api','26','--lib',platform,'--output',dex,*classfiles])
unsigned=out/'unsigned.apk';shutil.copyfile(base,unsigned)
with zipfile.ZipFile(unsigned,'a',compression=zipfile.ZIP_DEFLATED) as z:
 for f in dex.glob('*.dex'):z.write(f,f.name)
aligned=out/'aligned.apk';run([bt/'zipalign','-f','-p','4',unsigned,aligned])
key=Path(os.environ.get('GAIA_KEYSTORE',str(android/'private/gaia-life.jks')));password=Path(os.environ.get('GAIA_KEYSTORE_PASS_FILE',str(android/'private/password.txt')))
if not key.is_file() or not password.is_file():raise SystemExit('Set GAIA_KEYSTORE and GAIA_KEYSTORE_PASS_FILE to the preserved signing key and password file. Do not generate another key for updates.')
final=out/'GAIA-LIFE-R60.apk'
run([bt/'apksigner','sign','--ks',key,'--ks-key-alias','gaia-life','--ks-pass','file:'+str(password),'--out',final,aligned])
run([bt/'apksigner','verify','--verbose','--print-certs',final]);run([bt/'zipalign','-c','4',final])
with zipfile.ZipFile(final) as z:
 assert z.testzip() is None
 assert hashlib.sha256(gzip.decompress(z.read('assets/game.html.gz'))).hexdigest()==manifest['sha256']
sha=hashlib.sha256(final.read_bytes()).hexdigest();print('APK',final,final.stat().st_size,sha)
(out/'build-result.json').write_text(json.dumps({'apk':final.name,'bytes':final.stat().st_size,'sha256':sha,'game':manifest,'game_unchanged':True,'signature_verified':True,'zipalign_verified':True},indent=2)+'\n')
