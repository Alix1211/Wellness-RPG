from pathlib import Path
import os,subprocess,zipfile,shutil,json,hashlib,secrets,sys
p=Path(__file__).resolve().parent;out=p/'build';out.mkdir(exist_ok=True);bt=p/'sdk/android-15';platform=p/'sdk/android-35/android.jar';android=p/'android'
env=dict(os.environ);env['LD_LIBRARY_PATH']=str(bt/'lib64')
for f in bt.iterdir():
 if f.is_file():f.chmod(f.stat().st_mode|0o111)
def run(args):subprocess.run([str(x) for x in args],check=True,env=env)
run([bt/'aapt2','compile','--dir',android/'app/src/main/res','-o',out/'res.zip'])
run([bt/'aapt2','link','-o',out/'base.apk','-I',platform,'--manifest',android/'app/src/main/AndroidManifest.xml','-A',android/'app/src/main/assets','--min-sdk-version','26','--target-sdk-version','35',out/'res.zip'])
classes=out/'classes';shutil.rmtree(classes,ignore_errors=True);classes.mkdir()
run(['java','-m','jdk.compiler/com.sun.tools.javac.Main','-encoding','UTF-8','-source','8','-target','8','-bootclasspath',str(bt/'core-lambda-stubs.jar')+os.pathsep+str(platform),'-d',classes,*sorted((android/'app/src/main/java').rglob('*.java'))])
dex=out/'dex';shutil.rmtree(dex,ignore_errors=True);dex.mkdir();run(['java','-cp',bt/'lib/d8.jar','com.android.tools.r8.D8','--release','--min-api','26','--lib',platform,'--output',dex,*classes.rglob('*.class')])
shutil.copyfile(out/'base.apk',out/'unsigned.apk')
with zipfile.ZipFile(out/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:
 for f in dex.glob('*.dex'):z.write(f,f.name)
run([bt/'zipalign','-f','-p','4',out/'unsigned.apk',out/'aligned.apk'])
private=p/'private';private.mkdir(exist_ok=True);key=private/'gaia-pingpong.p12';password=private/'password.txt'
if not key.exists():
 if '--first-build' not in sys.argv:raise SystemExit('Restore the signing backup to private/ before rebuilding. Only the first release may use --first-build.')
 password.write_text(secrets.token_urlsafe(32)+'\n');password.chmod(0o600);env['GAIA_SIGN_PASSWORD']=password.read_text().strip()
 run(['java','-m','java.base/sun.security.tools.keytool.Main','-genkeypair','-keystore',key,'-storetype','PKCS12','-storepass:env','GAIA_SIGN_PASSWORD','-keypass:env','GAIA_SIGN_PASSWORD','-alias','gaia-pingpong','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=GAIA Pingpong, O=Personal Game, C=KR'])
final=out/'GAIA-Pingpong-v12.12.3.apk';pending=out/'signed.pending'
run(['java','-jar',bt/'lib/apksigner.jar','sign','--ks',key,'--ks-key-alias','gaia-pingpong','--ks-pass','file:'+str(password),'--out',pending,out/'aligned.apk'])
with pending.open('rb') as f:os.fsync(f.fileno())
os.replace(pending,final)
run(['java','-jar',bt/'lib/apksigner.jar','verify','--verbose','--print-certs',final]);run([bt/'zipalign','-c','4',final])
with zipfile.ZipFile(final) as z:
 assert z.testzip() is None
 assert z.read('assets/game/index.html')==(android/'app/src/main/assets/game/index.html').read_bytes()
 for f in (android/'app/src/main/assets/game/assets').rglob('*'):
  if f.is_file():assert z.read('assets/game/assets/'+str(f.relative_to(android/'app/src/main/assets/game/assets')))==f.read_bytes()
result={'apk':final.name,'bytes':final.stat().st_size,'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'package':'com.gaia.pingpong','versionCode':2026102503,'versionName':'12.12.3','signature_verified':True,'zipalign_verified':True,'assets_verified':True}
(out/'build-result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
