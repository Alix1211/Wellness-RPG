package com.gaia.pingpong;
import org.json.JSONObject;
import java.util.Arrays;
public final class NativeCoreTest{
 public static void main(String[]args)throws Exception{
  if(MainActivity.decide(20,10,-1)!=MainActivity.SYNC_ASK)throw new AssertionError("unknown base must ask");
  if(MainActivity.decide(10,20,10)!=MainActivity.SYNC_APPLY)throw new AssertionError("remote only");
  if(MainActivity.decide(20,10,10)!=MainActivity.SYNC_WRITE)throw new AssertionError("local only");
  if(MainActivity.decide(21,20,10)!=MainActivity.SYNC_ASK)throw new AssertionError("both changed");
  if(MainActivity.decide(20,20,10)!=MainActivity.SYNC_NONE)throw new AssertionError("equal");
  if(MainActivity.decide(20,-1,10)!=MainActivity.SYNC_WRITE)throw new AssertionError("empty remote");
  if(MainActivity.decide(-1,20,-1)!=MainActivity.SYNC_APPLY)throw new AssertionError("empty local");
  if(!Arrays.equals(MainActivity.hapticTimings("18,20,30"),new long[]{18,20,30}))throw new AssertionError("haptics");
  boolean bad=false;try{MainActivity.hapticTimings("-1");}catch(IllegalArgumentException e){bad=true;}if(!bad)throw new AssertionError("duration");
  JSONObject save=new JSONObject("{\"version\":2,\"id\":\"test\",\"region\":0,\"hp\":100,\"money\":120,\"stats\":{\"charm\":0,\"power\":0,\"defense\":0,\"spin\":0},\"wins\":[],\"hand\":[1,2,3,4],\"gear\":{\"version\":1,\"coins\":20,\"items\":[],\"equipped\":{}},\"t\":123}");
  JSONObject all=new JSONObject().put("gaia-pingpong-champion-items-v1",save.toString());
  MainActivity.validBackup(all.toString());if(MainActivity.saveTime(all)!=123)throw new AssertionError("save timestamp");
  if(MainActivity.parseRemote("")!=null||MainActivity.parseRemote("broken")!=null)throw new AssertionError("broken files");
  boolean unrelated=false;try{MainActivity.parseRemote("{\"arpg_save_v3\":\"other game\"}");}catch(IllegalArgumentException e){unrelated=true;}if(!unrelated)throw new AssertionError("unrelated save must not be overwritten");
  System.out.println("PASS native sync decision cases, haptic timing, GAIA save schema, invalid remote recovery");
 }
}
