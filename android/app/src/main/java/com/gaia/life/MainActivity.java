package com.gaia.life;

import android.app.*;
import android.content.*;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.*;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import java.util.concurrent.*;
import java.util.zip.GZIPInputStream;
import org.json.*;

public class MainActivity extends Activity {
    static final String ORIGIN="https://appassets.androidplatform.net", PAGE=ORIGIN+"/game.html";
    static final int PICK_GAME=21,PICK_BACKUP=22,WRITE_FILE=23,PICK_WEB=24;
    WebView web; FrameLayout root; View fullscreen; WebChromeClient.CustomViewCallback fullscreenCallback;
    ValueCallback<Uri[]> chooser; UpdateStore store; SharedPreferences prefs; JSONObject bundled;
    ExecutorService worker=Executors.newSingleThreadExecutor(); boolean busy=false,loaded=false;
    byte[] exportBytes; String exportName; ArrayList<String> log=new ArrayList<>();
    @Override public void onCreate(Bundle state){
        super.onCreate(state);getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if(Build.VERSION.SDK_INT>=28)getWindow().getAttributes().layoutInDisplayCutoutMode=WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        immersive();prefs=getSharedPreferences("shell",MODE_PRIVATE);store=new UpdateStore(new File(getFilesDir(),"game"));
        try(InputStream in=getAssets().open("bundled.json")){bundled=new JSONObject(read(in,1024*1024));}catch(Exception e){fail("내장 게임 정보 오류",e);return;}
        root=new FrameLayout(this);
        if(Build.VERSION.SDK_INT>=28)root.setOnApplyWindowInsetsListener((v,insets)->{DisplayCutout c=insets.getDisplayCutout();if(c!=null)v.setPadding(c.getSafeInsetLeft(),c.getSafeInsetTop(),c.getSafeInsetRight(),c.getSafeInsetBottom());else v.setPadding(0,0,0,0);return insets;});
        root.setBackgroundColor(Color.rgb(255,242,239));setContentView(root);
        web=new WebView(this);web.setBackgroundColor(Color.rgb(255,242,239));root.addView(web,new FrameLayout.LayoutParams(-1,-1));
        WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setSupportMultipleWindows(false);s.setJavaScriptCanOpenWindowsAutomatically(false);s.setSupportZoom(false);s.setBuiltInZoomControls(false);s.setDisplayZoomControls(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);s.setTextZoom(100);s.setDatabaseEnabled(true);
        web.addJavascriptInterface(new FileBridge(),"GaiaFiles");
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
                Uri u=request.getUrl();if(!"appassets.androidplatform.net".equals(u.getHost()))return null;
                if(!"https".equals(u.getScheme())||!"/game.html".equals(u.getPath()))return response(404,"Not Found",new ByteArrayInputStream(new byte[0]));
                try{
                    InputStream in=store.current().isFile()?new FileInputStream(store.current()):new GZIPInputStream(getAssets().open("game.html.gz"));
                    return response(200,"OK",in);
                }catch(Exception e){record("game-load: "+e);return response(500,"Load Error",new ByteArrayInputStream("게임을 불러오지 못했습니다. 뒤로 버튼에서 기본 게임을 복구해 주세요.".getBytes(StandardCharsets.UTF_8)));}
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
                if(!r.isForMainFrame())return false;String url=r.getUrl().toString();
                if(url.equals(PAGE)||url.equals("about:blank")||url.startsWith("blob:"))return false;
                if(url.startsWith("https://")||url.startsWith("http://"))try{startActivity(new Intent(Intent.ACTION_VIEW,r.getUrl()));}catch(Exception ignored){}
                return true;
            }
            @Override public void onPageFinished(WebView v,String url){
                loaded=true;record("loaded "+activeBuild()+" / "+webVersion());
                // Compatibility helper lives only in the WebView. The bundled HTML bytes remain identical.
                v.evaluateJavascript("window.addEventListener('unhandledrejection',function(e){console.error('Unhandled promise: '+e.reason)});",null);
            }
            @Override public void onReceivedError(WebView v,WebResourceRequest r,WebResourceError e){record("web-error "+e.getErrorCode()+" "+e.getDescription());if(r.isForMainFrame())toast("게임 로딩 오류: 뒤로 버튼에서 기본 게임 복구를 선택해 주세요");}
            @Override public boolean onRenderProcessGone(WebView v,RenderProcessGoneDetail d){record("renderer gone crashed="+d.didCrash());new AlertDialog.Builder(MainActivity.this).setTitle("게임 화면이 종료됐습니다").setMessage("앱을 닫고 다시 실행해 주세요. 저장파일은 그대로 있습니다.").setPositiveButton("닫기",(a,b)->finish()).show();return true;}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onConsoleMessage(ConsoleMessage m){if(m.messageLevel()==ConsoleMessage.MessageLevel.ERROR)record("JS "+m.lineNumber()+" "+m.message());return true;}
            @Override public boolean onShowFileChooser(WebView w,ValueCallback<Uri[]> cb,FileChooserParams params){
                if(chooser!=null)chooser.onReceiveValue(null);chooser=cb;
                Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                String[] types=params.getAcceptTypes();if(types!=null&&types.length>0&&!types[0].isEmpty())i.putExtra(Intent.EXTRA_MIME_TYPES,types);
                i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,params.getMode()==FileChooserParams.MODE_OPEN_MULTIPLE);
                try{startActivityForResult(i,PICK_WEB);}catch(Exception e){chooser=null;cb.onReceiveValue(null);toast("파일 탐색기를 열 수 없습니다");}return true;
            }
            @Override public void onShowCustomView(View v,CustomViewCallback callback){if(fullscreen!=null){callback.onCustomViewHidden();return;}fullscreen=v;fullscreenCallback=callback;root.addView(v,new FrameLayout.LayoutParams(-1,-1));web.setVisibility(View.GONE);immersive();}
            @Override public void onHideCustomView(){hideFullscreen();}
            @Override public void onPermissionRequest(PermissionRequest p){p.deny();}
        });
        web.setDownloadListener((url,ua,disposition,mime,length)->{
            if(url.startsWith("blob:")||url.startsWith("data:")){
                String filename=URLUtil.guessFileName(url,disposition,mime);if(filename.endsWith(".bin"))filename="GAIA-save.json";
                String js="(async function(){try{const r=await fetch("+JSONObject.quote(url)+");const b=await r.blob();if(b.size>33554432)throw Error('내보내기 파일이 너무 큽니다');const f=new FileReader();f.onload=()=>GaiaFiles.saveData("+JSONObject.quote(filename)+",String(f.result));f.readAsDataURL(b)}catch(e){console.error(e);GaiaFiles.error(String(e))}})()";
                web.evaluateJavascript(js,null);
            }else toast("게임 안 파일 내보내기 또는 앱의 세이브 백업을 이용해 주세요");
        });
        web.loadUrl(PAGE);
        if(!prefs.getBoolean("hint",false)){prefs.edit().putBoolean("hint",true).apply();new Handler(Looper.getMainLooper()).postDelayed(()->toast("뒤로 버튼을 누르면 업데이트·세이브 백업 메뉴가 열립니다"),1800);}
        if(!prefs.getString("update_url","").isEmpty())new Handler(Looper.getMainLooper()).postDelayed(()->checkUpdate(false),3500);
    }
    WebResourceResponse response(int status,String reason,InputStream in){Map<String,String> h=new HashMap<>();h.put("Cache-Control","no-store");return new WebResourceResponse("text/html","UTF-8",status,reason,h,in);}
    void immersive(){getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);}
    String activeBuild(){return store.current().isFile()?store.info().optString("build","파일 업데이트"):bundled.optString("build","R60");}
    String webVersion(){PackageInfo p=WebView.getCurrentWebViewPackage();return p==null?"unknown":p.packageName+" "+p.versionName;}
    synchronized void record(String text){log.add(new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss",Locale.KOREA).format(new Date())+" "+text);while(log.size()>120)log.remove(0);}
    void toast(String s){runOnUiThread(()->Toast.makeText(this,s,Toast.LENGTH_LONG).show());}
    void fail(String title,Exception e){record(title+": "+e);runOnUiThread(()->new AlertDialog.Builder(this).setTitle(title).setMessage(e.getMessage()).setPositiveButton("확인",null).show());}
    static String read(InputStream in,long max)throws Exception{ByteArrayOutputStream b=new ByteArrayOutputStream();UpdateStore.copy(in,b,max);return b.toString("UTF-8");}
    @Override public void onBackPressed(){if(fullscreen!=null){hideFullscreen();return;}menu();}
    void hideFullscreen(){if(fullscreen==null)return;root.removeView(fullscreen);fullscreen=null;web.setVisibility(View.VISIBLE);if(fullscreenCallback!=null)fullscreenCallback.onCustomViewHidden();fullscreenCallback=null;immersive();}
    void menu(){if(isFinishing())return;String[] items={"게임으로 돌아가기","HTML 파일로 업데이트","온라인 업데이트 확인","업데이트 주소 설정","세이브 백업","세이브 복원","진단 기록 저장","기본 R60으로 복구","앱 종료"};
        new AlertDialog.Builder(this).setTitle("GAIA LIFE · "+activeBuild()).setItems(items,(d,n)->{
            switch(n){case 0:break;case 1:pick(PICK_GAME,"text/html");break;case 2:checkUpdate(true);break;case 3:address();break;case 4:backup();break;case 5:pick(PICK_BACKUP,"application/json");break;case 6:diagnostics();break;case 7:new AlertDialog.Builder(this).setMessage("게임 파일만 기본 R60으로 바꿉니다. 세이브는 유지됩니다.").setPositiveButton("복구",(a,b)->{store.current().delete();store.metadata().delete();web.reload();}).setNegativeButton("취소",null).show();break;case 8:finish();}
        }).show();
    }
    void pick(int code,String type){Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");if(code==PICK_GAME)i.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"text/html","application/xhtml+xml","application/octet-stream"});else i.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"application/json","text/plain","application/octet-stream"});try{startActivityForResult(i,code);}catch(Exception e){fail("파일 선택 실패",e);}}
    void address(){EditText text=new EditText(this);text.setSingleLine(true);text.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_URI);text.setHint("https://…/update.json");text.setText(prefs.getString("update_url",""));
        new AlertDialog.Builder(this).setTitle("업데이트 주소").setMessage("인증 없이 내려받을 수 있는 HTTPS 배포 주소입니다. 비워 두면 자동 확인을 끕니다.").setView(text).setPositiveButton("저장",(a,b)->{String u=text.getText().toString().trim();if(!u.isEmpty()&&(!u.startsWith("https://")||u.contains("@"))){toast("HTTPS 배포 주소를 입력해 주세요");return;}prefs.edit().putString("update_url",u).apply();toast("저장했습니다");}).setNegativeButton("취소",null).show();
    }
    void checkUpdate(boolean manual){String address=prefs.getString("update_url","");if(address.isEmpty()){if(manual)address();return;}if(busy){if(manual)toast("파일을 처리 중입니다");return;}busy=true;if(manual)toast("업데이트를 확인하고 있습니다");
        worker.execute(()->{try{JSONObject meta=store.fetch(address,bundled.getString("sha256"));runOnUiThread(()->{busy=false;if(meta==null){if(manual)toast("최신 버전입니다");return;}
            new AlertDialog.Builder(this).setTitle("업데이트 준비 완료").setMessage(meta.optString("build")+"\n지금 적용하면 게임 화면을 다시 엽니다. 저장 후 적용해 주세요.").setPositiveButton("적용",(d,n)->installPending(meta)).setNegativeButton("나중에",null).show();});}
            catch(Exception e){record("update failed: "+e);runOnUiThread(()->{busy=false;if(manual)fail("업데이트 실패 · 기존 게임 유지",e);});}});
    }
    void installPending(JSONObject meta){busy=true;worker.execute(()->{try{store.install(new File(store.dir,"pending.html"),meta);record("installed "+meta);runOnUiThread(()->{busy=false;web.reload();toast("업데이트를 적용했습니다");});}catch(Exception e){busy=false;fail("업데이트 적용 실패",e);}});}
    void backup(){web.evaluateJavascript("JSON.stringify({format:'gaia-shell-save-v1',created:new Date().toISOString(),build:window.GAIA_BUILD||'',storage:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))})",result->{try{String data=new JSONArray("["+result+"]").getString(0);export(data.getBytes(StandardCharsets.UTF_8),"GAIA-save-"+System.currentTimeMillis()+".json","application/json");}catch(Exception e){fail("세이브 백업 실패",e);}});}
    void export(byte[] bytes,String name,String mime){if(exportBytes!=null){toast("먼저 열린 파일 저장을 마쳐 주세요");return;}exportBytes=bytes;exportName=name.replaceAll("[^\\p{L}\\p{N}._ -]","_");Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime).putExtra(Intent.EXTRA_TITLE,exportName);try{startActivityForResult(i,WRITE_FILE);}catch(Exception e){exportBytes=null;fail("파일 저장 실패",e);}}
    void restore(Uri uri){worker.execute(()->{try(InputStream in=getContentResolver().openInputStream(uri)){JSONObject b=new JSONObject(read(in,32L*1024*1024));if(!b.optString("format").equals("gaia-shell-save-v1"))throw new IOException("이 앱의 세이브 백업 파일이 아닙니다. 게임 자체 JSON은 게임 안 불러오기를 사용해 주세요");JSONObject storage=b.getJSONObject("storage");Iterator<String> it=storage.keys();while(it.hasNext()){String k=it.next();if(!(storage.get(k) instanceof String))throw new IOException("세이브 형식 오류");}
            runOnUiThread(()->new AlertDialog.Builder(this).setTitle("세이브 복원").setMessage("현재 진행을 선택한 백업으로 바꾸시겠습니까?").setPositiveButton("복원",(a,c)->web.evaluateJavascript("(()=>{const s="+storage.toString()+";const old={...localStorage};try{localStorage.clear();Object.entries(s).forEach(([k,v])=>localStorage.setItem(k,v));return 'ok'}catch(e){localStorage.clear();Object.entries(old).forEach(([k,v])=>localStorage.setItem(k,v));return String(e)}})()",r->{if("\"ok\"".equals(r)){web.reload();toast("세이브를 복원했습니다");}else toast("복원 실패: "+r);})).setNegativeButton("취소",null).show());
        }catch(Exception e){fail("세이브 복원 실패",e);}});}
    void diagnostics(){try{JSONObject d=new JSONObject().put("app","1.0-R60").put("build",activeBuild()).put("device",Build.MANUFACTURER+" "+Build.MODEL).put("android",Build.VERSION.RELEASE).put("webview",webVersion()).put("errors",new JSONArray(log)).put("physical_test","not_verified_here");export(d.toString(2).getBytes(StandardCharsets.UTF_8),"GAIA-diagnostics.json","application/json");}catch(Exception e){fail("진단 기록 저장 실패",e);}}
    final class FileBridge {
        @JavascriptInterface public void saveData(String name,String url){
            try{if(!url.startsWith("data:")||url.length()>46*1024*1024)throw new IOException("내보내기 용량 초과 또는 잘못된 파일");int comma=url.indexOf(',');if(comma<0)throw new IOException("파일 형식 오류");boolean base=url.substring(0,comma).contains(";base64");byte[] bytes=base?android.util.Base64.decode(url.substring(comma+1),android.util.Base64.DEFAULT):java.net.URLDecoder.decode(url.substring(comma+1),"UTF-8").getBytes(StandardCharsets.UTF_8);runOnUiThread(()->export(bytes,name,"application/octet-stream"));}catch(Exception e){fail("파일 내보내기 실패",e);}
        }
        @JavascriptInterface public void error(String text){toast(text);}
    }
    @Override protected void onActivityResult(int code,int result,Intent data){super.onActivityResult(code,result,data);if(code==PICK_WEB){if(chooser!=null){Uri[] selected=null;if(result==RESULT_OK&&data!=null){ClipData clip=data.getClipData();if(clip!=null){selected=new Uri[Math.min(clip.getItemCount(),32)];for(int n=0;n<selected.length;n++)selected[n]=clip.getItemAt(n).getUri();}else if(data.getData()!=null)selected=new Uri[]{data.getData()};}chooser.onReceiveValue(selected);chooser=null;}return;}
        if(code==WRITE_FILE){byte[] bytes=exportBytes;exportBytes=null;if(result==RESULT_OK&&data!=null&&bytes!=null){Uri uri=data.getData();worker.execute(()->{try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){out.write(bytes);toast("파일을 저장했습니다");}catch(Exception e){fail("파일 저장 실패",e);}});}return;}
        if(result!=RESULT_OK||data==null||data.getData()==null)return;Uri uri=data.getData();if(code==PICK_BACKUP){restore(uri);return;}
        if(code==PICK_GAME){if(busy){toast("파일 처리 중입니다");return;}new AlertDialog.Builder(this).setTitle("게임 파일 업데이트").setMessage("선택한 HTML로 게임을 교체합니다. 세이브는 유지되며 화면이 다시 열립니다.").setPositiveButton("적용",(a,b)->{busy=true;toast("게임 파일을 확인하고 있습니다");worker.execute(()->{try(InputStream in=getContentResolver().openInputStream(uri)){JSONObject m=store.importHtml(in);record("file update "+m);runOnUiThread(()->{busy=false;web.reload();toast("게임 파일 업데이트 완료");});}catch(Exception e){busy=false;fail("업데이트 실패 · 기존 게임 유지",e);}});}).setNegativeButton("취소",null).show();}
    }
    @Override protected void onPause(){super.onPause();if(web!=null){web.evaluateJavascript("try{window.GaiaAudioStatus?.reset();document.querySelectorAll('audio,video').forEach(x=>x.pause())}catch(e){}",null);web.onPause();web.pauseTimers();}}
    @Override protected void onResume(){super.onResume();if(web!=null){web.resumeTimers();web.onResume();}immersive();}
    @Override protected void onDestroy(){if(web!=null){web.stopLoading();web.removeJavascriptInterface("GaiaFiles");web.destroy();}worker.shutdownNow();super.onDestroy();}
    @Override public void onWindowFocusChanged(boolean focus){super.onWindowFocusChanged(focus);if(focus)immersive();}
}
