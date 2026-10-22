package com.gaia.casual;

import android.app.Activity;
import android.content.*;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract;
import android.webkit.*;
import java.io.*;
import java.util.*;
import org.json.*;

/** User-selected SAF tree only. Streams authorized MP4s without copying them into saves. */
public final class GaiaVideos {
    public static final int PICK=81;
    private final Activity activity;
    private final WebView web;
    private final SharedPreferences prefs;
    private final Map<String,Uri> files=new HashMap<>();
    public GaiaVideos(Activity a,WebView w){activity=a;web=w;prefs=a.getSharedPreferences("cylinder-videos",Context.MODE_PRIVATE);}
    @JavascriptInterface public void chooseFolder(){activity.runOnUiThread(()->{try{
        Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        activity.startActivityForResult(i,PICK);
    }catch(Exception e){changed("폴더 탐색기를 열 수 없습니다.");}});}
    public void result(int result,Intent data){if(result!=Activity.RESULT_OK||data==null||data.getData()==null){changed("");return;}
        Uri uri=data.getData();try{
            activity.getContentResolver().takePersistableUriPermission(uri,Intent.FLAG_GRANT_READ_URI_PERMISSION);
            String old=prefs.getString("tree","");prefs.edit().putString("tree",uri.toString()).apply();
            if(!old.isEmpty()&&!old.equals(uri.toString()))try{activity.getContentResolver().releasePersistableUriPermission(Uri.parse(old),Intent.FLAG_GRANT_READ_URI_PERMISSION);}catch(Exception ignored){}
            changed("");
        }catch(Exception e){changed("폴더 접근 권한을 저장하지 못했습니다. 다시 선택해 주세요.");}
    }
    private void changed(String error){activity.runOnUiThread(()->web.evaluateJavascript("dispatchEvent(new CustomEvent('gaia-video-folder',{detail:"+JSONObject.quote(error)+"}))",null));}
    @JavascriptInterface public synchronized void clear(){String old=prefs.getString("tree","");prefs.edit().remove("tree").apply();files.clear();if(!old.isEmpty())try{activity.getContentResolver().releasePersistableUriPermission(Uri.parse(old),Intent.FLAG_GRANT_READ_URI_PERMISSION);}catch(Exception ignored){}}
    @JavascriptInterface public synchronized String list(){JSONObject out=new JSONObject();JSONArray items=new JSONArray();files.clear();try{
        String saved=prefs.getString("tree","");out.put("selected",!saved.isEmpty());if(!saved.isEmpty()){
            Uri tree=Uri.parse(saved);String id=DocumentsContract.getTreeDocumentId(tree);
            Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(tree,id);
            String[] projection={DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_DISPLAY_NAME,DocumentsContract.Document.COLUMN_MIME_TYPE};
            try(Cursor c=activity.getContentResolver().query(children,projection,null,null,null)){
                if(c==null)throw new IOException("폴더를 읽지 못했습니다.");
                while(c.moveToNext()){
                    String name=c.getString(1),mime=c.getString(2);
                    if(name==null||!name.toLowerCase(Locale.ROOT).endsWith(".mp4")||DocumentsContract.Document.MIME_TYPE_DIR.equals(mime))continue;
                    String token=UUID.randomUUID().toString();files.put(token,DocumentsContract.buildDocumentUriUsingTree(tree,c.getString(0)));
                    items.put(new JSONObject().put("name",name).put("url","https://appassets.androidplatform.net/cylinder-video/"+token));
                }
            }
        }
        out.put("files",items);
    }catch(Exception e){try{out.put("error","폴더를 읽지 못했습니다. 폴더를 다시 선택해 주세요.").put("files",items);}catch(Exception ignored){}}
        return out.toString();
    }
    public WebResourceResponse intercept(WebResourceRequest request){Uri u=request.getUrl();if(!"https".equals(u.getScheme())||!"appassets.androidplatform.net".equals(u.getHost())||!u.getPath().startsWith("/cylinder-video/"))return null;
        Uri file; synchronized(this){file=files.get(u.getLastPathSegment());}
        if(file==null)return empty(404,"Not Found");
        ParcelFileDescriptor fd=null;try{
            fd=activity.getContentResolver().openFileDescriptor(file,"r");if(fd==null)throw new IOException();
            long size=fd.getStatSize(),start=0,end=size-1;String range=null;
            for(Map.Entry<String,String> h:request.getRequestHeaders().entrySet())if("range".equalsIgnoreCase(h.getKey()))range=h.getValue();
            boolean partial=range!=null&&size>=0;
            if(partial){if(!range.matches("bytes=\\d*-\\d*")){fd.close();return empty(416,"Range Not Satisfiable");}
                String[] parts=range.substring(6).split("-",-1);
                if(parts[0].isEmpty()){if(parts[1].isEmpty()){fd.close();return empty(416,"Range Not Satisfiable");}start=Math.max(0,size-Long.parseLong(parts[1]));}
                else{start=Long.parseLong(parts[0]);if(!parts[1].isEmpty())end=Math.min(end,Long.parseLong(parts[1]));}
                if(start> end||start>=size){fd.close();return empty(416,"Range Not Satisfiable");}
            }
            InputStream in=new ParcelFileDescriptor.AutoCloseInputStream(fd);fd=null;long skip=start;
            while(skip>0){long n=in.skip(skip);if(n==0){if(in.read()<0){in.close();throw new EOFException();}n=1;}skip-=n;}
            Map<String,String> headers=new HashMap<>();headers.put("Cache-Control","no-store");
            if(size>=0){long count=end-start+1;headers.put("Accept-Ranges","bytes");headers.put("Content-Length",Long.toString(count));if(partial)headers.put("Content-Range","bytes "+start+"-"+end+"/"+size);in=new Limited(in,count);}
            return new WebResourceResponse("video/mp4",null,partial?206:200,partial?"Partial Content":"OK",headers,in);
        }catch(Exception e){if(fd!=null)try{fd.close();}catch(Exception ignored){}return empty(404,"Not Found");}
    }
    static WebResourceResponse empty(int status,String reason){return new WebResourceResponse("video/mp4",null,status,reason,Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
    static final class Limited extends FilterInputStream{long left;Limited(InputStream in,long n){super(in);left=n;}public int read()throws IOException{if(left<=0)return -1;int n=super.read();if(n>=0)left--;return n;}public int read(byte[] b,int o,int n)throws IOException{if(left<=0)return -1;int r=in.read(b,o,(int)Math.min(left,n));if(r>0)left-=r;return r;}}
}
