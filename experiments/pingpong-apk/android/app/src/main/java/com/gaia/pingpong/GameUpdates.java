package com.gaia.pingpong;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.*;

/** Versioned, atomic game-only updates. Game origin and native save storage stay unchanged. */
final class GameUpdates {
    static final long BUNDLED_BUILD=2026102503L, NATIVE_BUILD=2026102503L;
    static final String BASE="https://raw.githubusercontent.com/Alix1211/Wellness-RPG/gaia-pingpong-apk-20261025/experiments/pingpong-apk/updates/";
    static final long MAX_ZIP=128L*1024*1024,MAX_EXPANDED=256L*1024*1024;
    final File root;
    GameUpdates(File root){this.root=root;root.mkdirs();}
    File active(){
        try{
            String id=new String(Files.readAllBytes(new File(root,"current.txt").toPath()),StandardCharsets.UTF_8).trim();
            if(!id.matches("v[0-9]+-[a-f0-9]{12}"))return null;
            File dir=new File(root,id);
            return new File(dir,"index.html").isFile()?dir:null;
        }catch(Exception e){return null;}
    }
    long build(){File a=active();if(a==null)return BUNDLED_BUILD;try{return Long.parseLong(a.getName().split("-")[0].substring(1));}catch(Exception e){return BUNDLED_BUILD;}}
    static String hash(File file)throws Exception{
        MessageDigest md=MessageDigest.getInstance("SHA-256");try(InputStream in=new FileInputStream(file)){byte[] b=new byte[65536];int n;while((n=in.read(b))!=-1)md.update(b,0,n);}
        StringBuilder s=new StringBuilder();for(byte b:md.digest())s.append(String.format(Locale.ROOT,"%02x",b&255));return s.toString();
    }
    static void move(File a,File b)throws IOException{
        try{Files.move(a.toPath(),b.toPath(),StandardCopyOption.REPLACE_EXISTING,StandardCopyOption.ATOMIC_MOVE);}
        catch(AtomicMoveNotSupportedException e){Files.move(a.toPath(),b.toPath(),StandardCopyOption.REPLACE_EXISTING);}
    }
    static void remove(File f){if(f.isDirectory()){File[] all=f.listFiles();if(all!=null)for(File c:all)remove(c);}f.delete();}
    static boolean allowed(URL u){return "https".equals(u.getProtocol())&&"raw.githubusercontent.com".equals(u.getHost())&&u.getUserInfo()==null&&(u.getPort()==-1||u.getPort()==443)&&u.toString().startsWith(BASE)&&!u.getPath().contains("..");}
    static InputStream get(URL url)throws Exception{
        if(!allowed(url))throw new IOException("unsupported-update-address");
        HttpURLConnection c=(HttpURLConnection)url.openConnection();c.setConnectTimeout(12000);c.setReadTimeout(30000);c.setInstanceFollowRedirects(false);c.setUseCaches(false);c.setRequestProperty("Cache-Control","no-cache");
        if(c.getResponseCode()!=200){c.disconnect();throw new IOException("update-unavailable");}
        return new FilterInputStream(c.getInputStream()){@Override public void close()throws IOException{try{super.close();}finally{c.disconnect();}}};
    }
    static long copy(InputStream in,OutputStream out,long max)throws IOException{byte[] b=new byte[65536];long total=0;int n;while((n=in.read(b))!=-1){total+=n;if(total>max)throw new IOException("update-too-large");out.write(b,0,n);}return total;}
    synchronized boolean check()throws Exception{
        Properties m=new Properties();try(InputStream in=get(new URL(BASE+"update.properties?t="+System.currentTimeMillis()));ByteArrayOutputStream out=new ByteArrayOutputStream()){copy(in,out,65536);m.load(new StringReader(out.toString("UTF-8")));}
        long next=Long.parseLong(m.getProperty("build")),min=Long.parseLong(m.getProperty("minNative"));
        if(next<=build())return false;
        if(min>NATIVE_BUILD)throw new IOException("native-update-required");
        String digest=m.getProperty("sha256","");if(!digest.matches("[a-f0-9]{64}"))throw new IOException("missing-hash");
        long size=Long.parseLong(m.getProperty("size"));if(size<=0||size>MAX_ZIP)throw new IOException("invalid-size");
        File temp=new File(root,"download.tmp");
        try{
            try(FileOutputStream out=new FileOutputStream(temp)){
                String[] parts=m.getProperty("parts",m.getProperty("file","")).split(",");
                if(parts.length<1||parts.length>128)throw new IOException("invalid-parts");long total=0;
                for(String part:parts){if(!part.matches("[a-zA-Z0-9_.-]+"))throw new IOException("invalid-part");try(InputStream in=get(new URL(BASE+part))){total+=copy(in,out,MAX_ZIP-total);}}
                if(total!=size)throw new IOException("wrong-size");out.getFD().sync();
            }
            install(temp,next,digest,size);return true;
        }finally{temp.delete();}
    }
    synchronized void install(File zip,long next,String digest,long size)throws Exception{
        if(next<=build())throw new IOException("older-version");
        if(zip.length()!=size||!hash(zip).equals(digest))throw new IOException("checksum-failed");
        String id="v"+next+"-"+digest.substring(0,12);File stage=new File(root,"staging");remove(stage);stage.mkdirs();
        try{
            Set<String> names=new HashSet<>();long total=0;int count=0;
            try(ZipInputStream in=new ZipInputStream(new FileInputStream(zip))){ZipEntry e;while((e=in.getNextEntry())!=null){
                String name=e.getName();if(++count>2048||name.contains("\\")||name.startsWith("/")||name.contains("..")||!(name.equals("index.html")||name.startsWith("assets/"))||!names.add(name))throw new IOException("invalid-entry");
                File f=new File(stage,name);if(!f.getCanonicalPath().startsWith(stage.getCanonicalPath()+File.separator))throw new IOException("invalid-path");
                if(e.isDirectory()){f.mkdirs();continue;}f.getParentFile().mkdirs();try(FileOutputStream out=new FileOutputStream(f)){total+=copy(in,out,MAX_EXPANDED-total);out.getFD().sync();}
            }}
            File html=new File(stage,"index.html");if(!html.isFile()||html.length()<1000)throw new IOException("missing-game");
            byte[] head=new byte[4096];int n;try(InputStream in=new FileInputStream(html)){n=in.read(head);}String h=new String(head,0,n,StandardCharsets.UTF_8).toLowerCase(Locale.ROOT);if(!h.contains("<html")&&!h.contains("<!doctype html"))throw new IOException("invalid-game");
            File dest=new File(root,id);if(dest.exists())remove(dest);move(stage,dest);
            File pointer=new File(root,"current.tmp");try(FileOutputStream out=new FileOutputStream(pointer)){out.write(id.getBytes(StandardCharsets.UTF_8));out.getFD().sync();}move(pointer,new File(root,"current.txt"));
        }finally{remove(stage);}
    }
}
