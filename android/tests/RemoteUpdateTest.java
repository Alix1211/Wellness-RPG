package com.gaia.life;
import javax.net.ssl.*;import java.security.*;import java.security.cert.X509Certificate;import com.sun.net.httpserver.*;import java.net.*;import java.io.*;import java.nio.file.*;import java.nio.charset.StandardCharsets;import java.util.*;import java.util.zip.*;import org.json.*;
/** Local TLS fixture trusts ONLY the test certificate context. Not used by the APK. */
public class RemoteUpdateTest {
 public static void main(String[] args)throws Exception{
  KeyStore k=KeyStore.getInstance("PKCS12");try(InputStream in=new FileInputStream(args[0])){k.load(in,"testpass".toCharArray());}KeyManagerFactory km=KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());km.init(k,"testpass".toCharArray());
  SSLContext tls=SSLContext.getInstance("TLS");tls.init(km.getKeyManagers(),new TrustManager[]{new X509TrustManager(){public void checkClientTrusted(X509Certificate[] c,String a){}public void checkServerTrusted(X509Certificate[] c,String a){}public X509Certificate[] getAcceptedIssuers(){return new X509Certificate[0];}}},null);HttpsURLConnection.setDefaultSSLSocketFactory(tls.getSocketFactory());
  byte[] html="<!doctype html><html>download version 2</html>".getBytes(StandardCharsets.UTF_8);ByteArrayOutputStream zipped=new ByteArrayOutputStream();try(GZIPOutputStream g=new GZIPOutputStream(zipped)){g.write(html);}byte[] gz=zipped.toByteArray();
  JSONObject m=new JSONObject().put("build","remote-2").put("sha256",UpdateStore.hex(MessageDigest.getInstance("SHA-256").digest(html))).put("size",html.length).put("compression","gzip").put("parts",new JSONArray().put("part0").put("part1"));
  Map<String,byte[]> routes=new HashMap<>();routes.put("/feed/update.json",m.toString().getBytes(StandardCharsets.UTF_8));routes.put("/feed/part0",Arrays.copyOfRange(gz,0,gz.length/2));routes.put("/feed/part1",Arrays.copyOfRange(gz,gz.length/2,gz.length));
  HttpsServer server=HttpsServer.create(new InetSocketAddress("localhost",0),0);server.setHttpsConfigurator(new HttpsConfigurator(tls));server.createContext("/",e->{byte[] b=routes.get(e.getRequestURI().getPath());e.sendResponseHeaders(b==null?404:200,b==null?0:b.length);if(b!=null)e.getResponseBody().write(b);e.close();});server.start();
  try{
   UpdateStore st=new UpdateStore(Files.createTempDirectory("remote-test").toFile());String address="https://localhost:"+server.getAddress().getPort()+"/feed/update.json";
   JSONObject meta=st.fetch(address,"bundled");UpdateStoreTest.ok(meta.getString("build").equals("remote-2"),"TLS multipart gzip download and hash validation");
   st.install(new File(st.dir,"pending.html"),meta);UpdateStoreTest.ok(Arrays.equals(html,Files.readAllBytes(st.current().toPath())),"download install exact bytes");
   UpdateStoreTest.ok(st.fetch(address,"bundled")==null,"same version skipped");
   m.put("sha256",String.join("",Collections.nCopies(64,"0")));routes.put("/feed/update.json",m.toString().getBytes(StandardCharsets.UTF_8));UpdateStoreTest.fails(()->st.fetch(address,"bundled"),"remote checksum mismatch rejected");
   UpdateStoreTest.ok(Arrays.equals(html,Files.readAllBytes(st.current().toPath())),"remote bad checksum preserves current");
   routes.remove("/feed/part1");UpdateStoreTest.fails(()->st.fetch(address,"bundled"),"missing part rejected");
   UpdateStoreTest.ok(Arrays.equals(html,Files.readAllBytes(st.current().toPath())),"missing part preserves current");
   routes.put("/feed/part1",new byte[]{1,2,3});UpdateStoreTest.fails(()->st.fetch(address,"bundled"),"corrupt gzip rejected");
   UpdateStoreTest.fails(()->st.fetch("https://localhost:1/offline","bundled"),"connection failure leaves offline game available");
   UpdateStoreTest.ok(Arrays.equals(html,Files.readAllBytes(st.current().toPath())),"offline current preserved");
   System.out.println("REMOTE TOTAL "+UpdateStoreTest.count);
  }finally{server.stop(0);}
 }
}
