package com.gaia.detective;

import static org.junit.Assert.*;
import org.junit.Test;
import org.json.JSONObject;

public class SaveSyncTest {
    private String bundle(long t) throws Exception {
        JSONObject s = new JSONObject();
        s.put("v",1).put("t",t).put("deck",new org.json.JSONArray()).put("hp",80).put("cleared",new org.json.JSONArray());
        return new JSONObject().put("gaia_run_v1",s.toString()).put("gaia_mute","0").toString();
    }

    @Test public void baseTDecidesByChangedBranchesNotLatestTimestamp() {
        final int NONE=MainActivity.SYNC_NONE, WRITE=MainActivity.SYNC_WRITE,
                  APPLY=MainActivity.SYNC_APPLY, ASK=MainActivity.SYNC_ASK;
        assertEquals(ASK,MainActivity.decide(200,100,-1)); // 최초 연결: 무조건 시간 승자 금지
        assertEquals(ASK,MainActivity.decide(100,200,-1));
        assertEquals(APPLY,MainActivity.decide(100,200,100)); // Drive만 변경
        assertEquals(WRITE,MainActivity.decide(200,100,100)); // 이 기기만 변경
        assertEquals(ASK,MainActivity.decide(300,200,100)); // 양쪽 변경
        assertEquals(NONE,MainActivity.decide(200,200,100)); // 이미 같은 판
        assertEquals(WRITE,MainActivity.decide(200,-1,100)); // 파일 없음/깨짐
        assertEquals(APPLY,MainActivity.decide(-1,200,100)); // 이 기기에 저장 없음
        assertEquals(NONE,MainActivity.decide(-1,-1,-1));
    }

    @Test public void bundleKeepsExistingFormatAndTime() throws Exception {
        JSONObject parsed=MainActivity.validBackup(bundle(123456));
        assertEquals(123456,MainActivity.saveTime(parsed));
        assertEquals(new JSONObject(bundle(123456)).getString("gaia_run_v1"),parsed.getString("gaia_run_v1"));
        assertEquals(123456,MainActivity.saveTime(MainActivity.parseRemote(bundle(123456))));
    }

    @Test public void emptyOrBrokenRemoteCanBeRepairedButReadErrorsAreNotParsed() throws Exception {
        assertNull(MainActivity.parseRemote(""));
        assertNull(MainActivity.parseRemote("{broken"));
        assertNull(MainActivity.parseRemote("{}"));
        assertNull(MainActivity.parseRemote(new JSONObject().put("gaia_run_v1","{}").toString()));
        assertEquals(MainActivity.SYNC_WRITE,MainActivity.decide(123,-1,100));
    }

    @Test public void otherGameSaveCannotBeImported() throws Exception {
        assertNull(MainActivity.parseRemote(new JSONObject().put("arpg_save_v3","{}").toString()));
        assertNull(MainActivity.parseRemote(new JSONObject().put("gaia_run_v1","{}").toString()));
    }
}
