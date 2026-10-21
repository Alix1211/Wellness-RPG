package com.gaia.life;
import java.io.*;import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.util.*;import java.util.zip.*;import org.json.*;
public class UpdateStoreTest {
 static int count=0;
 static void ok(boolean v,String name){if(!v)throw new AssertionError(name);count++;System.out.println("PASS "+name);}
 static void fails(RunnableEx fn,String name)throws Exception{try{fn.run();throw new AssertionError(name);}catch(AssertionError e){throw e;}catch(Exception expected){ok(true,name);}}
 interface RunnableEx{void run()throws Exception;}
 public static void main(String[] args)throws Exception{
  Path p=Files.createTempDirectory("gaia-update-test");UpdateStore store=new UpdateStore(p.toFile());
  File src=p.resolve("source.html").toFile();Files.write(src.toPath(),"<!doctype html><html>game A</html>".getBytes(StandardCharsets.UTF_8));
  JSONObject meta=UpdateStore.validate(src,null,0,"A");store.install(src,meta);
  ok(Arrays.equals(Files.readAllBytes(src.toPath()),Files.readAllBytes(store.current().toPath())),"valid install byte equality");
  ok(store.info().getString("build").equals("A"),"metadata persisted");
  fails(()->UpdateStore.validate(src,"0000000000000000000000000000000000000000000000000000000000000000",0,"bad"),"checksum mismatch rejected");
  fails(()->UpdateStore.validate(src,null,999,"bad"),"size mismatch rejected");
  Files.write(src.toPath(),"not HTML".getBytes(StandardCharsets.UTF_8));fails(()->store.importHtml(new FileInputStream(src)),"invalid HTML import rejected");
  ok(store.info().getString("build").equals("A")&&new String(Files.readAllBytes(store.current().toPath()),StandardCharsets.UTF_8).contains("game A"),"working game survives failed import");
  JSONObject invalid=new JSONObject(meta.toString()).put("sha256","0000000000000000000000000000000000000000000000000000000000000000");fails(()->store.install(src,invalid),"staged bytes revalidated");
  ok(new String(Files.readAllBytes(store.current().toPath()),StandardCharsets.UTF_8).contains("game A"),"working game survives failed install");
  fails(()->UpdateStore.copy(new ByteArrayInputStream(new byte[11]),new ByteArrayOutputStream(),10),"download size cap enforced");
  fails(()->UpdateStore.connection(new java.net.URL("http://example.com/")),"cleartext HTTP rejected");
  fails(()->UpdateStore.connection(new java.net.URL("https://user:pass@example.com/")),"embedded URL credentials rejected");
  store.importHtml(new ByteArrayInputStream("<!DOCTYPE html><html>game B</html>".getBytes(StandardCharsets.UTF_8)));
  ok(new String(Files.readAllBytes(store.current().toPath()),StandardCharsets.UTF_8).contains("game B"),"second valid update replaces game");
  System.out.println("TOTAL "+count);
 }
}
