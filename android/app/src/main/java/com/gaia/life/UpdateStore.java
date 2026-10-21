package com.gaia.life;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.GZIPInputStream;
import org.json.*;

/** Atomic, checksum-verified game updates. No authentication token is bundled. */
final class UpdateStore {
    static final long MAX_HTML=200L*1024*1024, MAX_DOWNLOAD=150L*1024*1024;
    final File dir;
    UpdateStore(File dir){this.dir=dir;dir.mkdirs();}
    File current(){return new File(dir,"current.html");}
    File metadata(){return new File(dir,"current.json");}
    JSONObject info(){try{return new JSONObject(new String(Files.readAllBytes(metadata().toPath()),StandardCharsets.UTF_8));}catch(Exception e){return new JSONObject();}}
    static String hex(byte[] b){StringBuilder s=new StringBuilder();for(byte x:b)s.append(String.format(Locale.ROOT,"%02x",x&255));return s.toString();}
    static JSONObject validate(File file,String expected,long size,String build)throws Exception{
        long n=0;MessageDigest d=MessageDigest.getInstance("SHA-256");ByteArrayOutputStream head=new ByteArrayOutputStream();
        try(InputStream in=new FileInputStream(file)){byte[] b=new byte[65536];int c;while((c=in.read(b))!=-1){n+=c;if(n>MAX_HTML)throw new IOException("게임 파일이 너무 큽니다");d.update(b,0,c);if(head.size()<65536)head.write(b,0,Math.min(c,65536-head.size()));}}
        String h=new String(head.toByteArray(),StandardCharsets.UTF_8).toLowerCase(Locale.ROOT);
        if(!h.contains("<html")&&!h.contains("<!doctype html"))throw new IOException("HTML 게임 파일이 아닙니다");
        String hash=hex(d.digest());if(expected!=null&&!hash.equalsIgnoreCase(expected))throw new IOException("파일 검증 실패: SHA256 불일치");
        if(size>0&&n!=size)throw new IOException("파일 크기 불일치");
        return new JSONObject().put("build",build).put("sha256",hash).put("size",n);
    }
    static void move(File from,File to)throws IOException{
        try{Files.move(from.toPath(),to.toPath(),StandardCopyOption.REPLACE_EXISTING,StandardCopyOption.ATOMIC_MOVE);}
        catch(AtomicMoveNotSupportedException e){Files.move(from.toPath(),to.toPath(),StandardCopyOption.REPLACE_EXISTING);}
    }
    void install(File source,JSONObject meta)throws Exception{
        File staged=new File(dir,"install.tmp");
        try(InputStream in=new FileInputStream(source);FileOutputStream out=new FileOutputStream(staged)){copy(in,out,MAX_HTML);out.getFD().sync();}
        // Revalidate the actual staged bytes before replacing the working game.
        validate(staged,meta.getString("sha256"),meta.getLong("size"),meta.optString("build"));
        File m=new File(dir,"metadata.tmp");try(FileOutputStream out=new FileOutputStream(m)){out.write(meta.toString(2).getBytes(StandardCharsets.UTF_8));out.getFD().sync();}
        move(staged,current());move(m,metadata());
    }
    JSONObject importHtml(InputStream in)throws Exception{
        File temp=new File(dir,"import.tmp");try(FileOutputStream out=new FileOutputStream(temp)){copy(in,out,MAX_HTML);out.getFD().sync();}
        try{JSONObject m=validate(temp,null,0,"파일 업데이트");install(temp,m);return m;}finally{temp.delete();}
    }
    static long copy(InputStream in,OutputStream out,long limit)throws IOException{byte[] b=new byte[65536];long n=0;int c;while((c=in.read(b))!=-1){n+=c;if(n>limit)throw new IOException("파일 용량 제한 초과");out.write(b,0,c);}return n;}
    static HttpURLConnection connection(URL u)throws Exception{
        if(!"https".equalsIgnoreCase(u.getProtocol())||u.getUserInfo()!=null)throw new IOException("HTTPS 주소만 사용할 수 있습니다");
        HttpURLConnection c=(HttpURLConnection)u.openConnection();c.setConnectTimeout(12000);c.setReadTimeout(30000);c.setInstanceFollowRedirects(false);c.setRequestProperty("User-Agent","GAIA-LIFE/1");return c;
    }
    static InputStream get(URL url)throws Exception{
        URL u=url;
        for(int i=0;i<6;i++){HttpURLConnection c=connection(u);int status=c.getResponseCode();if(status>=300&&status<400){String next=c.getHeaderField("Location");c.disconnect();if(next==null)throw new IOException("잘못된 리다이렉트");u=new URL(u,next);continue;}
            if(status!=200){c.disconnect();throw new IOException("다운로드 실패 (HTTP "+status+")");}
            if(c.getContentLengthLong()>MAX_DOWNLOAD){c.disconnect();throw new IOException("파일이 너무 큽니다");}
            return new FilterInputStream(c.getInputStream()){@Override public void close()throws IOException{try{super.close();}finally{c.disconnect();}}};
        }throw new IOException("리다이렉트가 너무 많습니다");
    }
    JSONObject fetch(String address,String bundledHash)throws Exception{
        URL url=new URL(address);JSONObject manifest;
        try(InputStream in=get(url);ByteArrayOutputStream out=new ByteArrayOutputStream()){copy(in,out,1024*1024);manifest=new JSONObject(out.toString("UTF-8"));}
        String hash=manifest.getString("sha256");if(!hash.matches("(?i)[0-9a-f]{64}"))throw new IOException("검증값이 없는 업데이트입니다");
        String active=current().isFile()?info().optString("sha256"):bundledHash;
        if(hash.equalsIgnoreCase(active))return null;
        long size=manifest.getLong("size");if(size<=0||size>MAX_HTML)throw new IOException("게임 크기가 잘못되었습니다");
        File temp=new File(dir,"download.tmp");File expanded=new File(dir,"pending.html");
        try{
            try(FileOutputStream out=new FileOutputStream(temp)){
                if(manifest.has("parts")){
                    JSONArray parts=manifest.getJSONArray("parts");if(parts.length()<1||parts.length()>64)throw new IOException("분할 파일 목록 오류");long total=0;
                    // parts are resolved relative to the manifest, not the repository root.
                    for(int i=0;i<parts.length();i++)try(InputStream in=get(new URL(url,parts.getString(i)))){total+=copy(in,out,MAX_DOWNLOAD-total);}
                }else try(InputStream in=get(new URL(url,manifest.getString("url")))){copy(in,out,MAX_DOWNLOAD);}
                out.getFD().sync();
            }
            String compression=manifest.optString("compression","");if(!compression.isEmpty()&&!compression.equals("gzip"))throw new IOException("지원하지 않는 압축 형식");
            try(InputStream raw=new FileInputStream(temp);InputStream in=compression.equals("gzip")?new GZIPInputStream(raw):raw;FileOutputStream out=new FileOutputStream(expanded)){copy(in,out,MAX_HTML);out.getFD().sync();}
            return validate(expanded,hash,size,manifest.optString("build","업데이트"));
        }catch(Exception e){expanded.delete();throw e;}finally{temp.delete();}
    }
}
