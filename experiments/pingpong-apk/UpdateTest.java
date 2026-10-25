package com.gaia.pingpong;
import java.io.*;import java.nio.file.*;import java.util.zip.*;
public class UpdateTest{
 static File zip(File root,String name,String text)throws Exception{File f=new File(root,"test.zip");try(ZipOutputStream o=new ZipOutputStream(new FileOutputStream(f))){o.putNextEntry(new ZipEntry(name));o.write(text.getBytes("UTF-8"));o.closeEntry();}return f;}
 public static void main(String[] args)throws Exception{
 File root=Files.createTempDirectory("gaia-update-test").toFile();GameUpdates u=new GameUpdates(new File(root,"installed"));
 String html="<!doctype html><html>"+new String(new char[2000]).replace('\0','x')+"</html>";
 File f=zip(root,"index.html",html);u.install(f,2026102504L,GameUpdates.hash(f),f.length());File before=u.active();
 if(before==null||u.build()!=2026102504L)throw new Error("install");
 try{u.install(f,2026102505L,"0".repeat(64),f.length());throw new Error("hash accepted");}catch(IOException expected){}
 if(!u.active().equals(before))throw new Error("lost current");
 f=zip(root,"../escape",html);try{u.install(f,2026102505L,GameUpdates.hash(f),f.length());throw new Error("traversal accepted");}catch(IOException expected){}
 if(!u.active().equals(before))throw new Error("lost current after traversal");
 f=zip(root,"assets/file.txt",html);try{u.install(f,2026102505L,GameUpdates.hash(f),f.length());throw new Error("missing index accepted");}catch(IOException expected){}
 f=zip(root,"index.html",html+"NEW");u.install(f,2026102505L,GameUpdates.hash(f),f.length());
 if(before.equals(u.active())||!new File(before,"index.html").isFile())throw new Error("active session overwritten");
 try{u.install(f,2026102504L,GameUpdates.hash(f),f.length());throw new Error("downgrade accepted");}catch(IOException expected){}
 if(GameUpdates.allowed(new java.net.URL("https://evil.example/game")))throw new Error("external host");
 System.out.println("PASS: install, hash rejection, traversal rejection, incomplete update rejection, old-session retention, downgrade rejection, host restriction");GameUpdates.remove(root);
 }
}
