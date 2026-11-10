package com.gaia.beltscroll;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.WebResourceResponse;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import org.json.*;

/**
 * 게임 파일 자동 업데이트.
 * 앱이 켜질 때 GitHub 릴리스의 update.json(파일별 해시 목록)을 읽고, APK 안에 든 것과 다른 파일만 받아 둔다.
 * 전부 받은 뒤에만 새 버전으로 바꾸므로(원자적) 도중에 끊겨도 이전 버전/APK 그대로 실행된다. 오프라인이어도 마찬가지.
 * 저장(localStorage)은 주소가 같아서 그대로 유지된다.
 */
final class WebUpdates {
    private static final String REPO = "Alix1211/Wellness-RPG";
    private static final String TAG = "beltscroll-web-latest";

    private final Context context;
    private final SharedPreferences prefs;
    private final File root, cache;
    private volatile JSONObject files = new JSONObject();     // 현재 쓰는 업데이트의 경로 → 해시 (없으면 빈 목록 = APK 그대로)
    private JSONObject bundled = new JSONObject();            // APK 안 파일의 경로 → 해시
    private volatile Progress progress;

    interface Progress { void say(String text); }

    WebUpdates(Context c) {
        context = c;
        prefs = c.getSharedPreferences("beltscrollUpdates", Context.MODE_PRIVATE);
        root = new File(c.getFilesDir(), "beltscrollUpdates");
        cache = new File(root, "files");
        cache.mkdirs();
        try { bundled = new JSONObject(new String(read(c.getAssets().open("bundled_files.json"), 4000000), "UTF-8")); } catch (Exception ignored) { }
        try {
            File m = new File(root, "active.json");
            if (m.isFile()) {
                JSONObject j = new JSONObject(new String(read(new FileInputStream(m), 4000000), "UTF-8"));
                JSONObject f = j.getJSONObject("files");
                if (complete(f)) files = f;      // 파일이 하나라도 없으면 쓰지 않고 APK 로 실행
            }
        } catch (Exception ignored) { }
    }

    static String safePath(String path) {
        if (path == null || path.isEmpty() || path.startsWith("/") || path.contains("\\") || path.indexOf('\0') >= 0) return null;
        for (String part : path.split("/")) if (part.equals("..") || part.equals(".") || part.isEmpty()) return null;
        return path;
    }

    private static boolean validHash(String h) { return h != null && h.matches("[a-f0-9]{64}"); }

    /** 목록에서 APK 와 다른 파일이 모두 내려받아져 있는지. */
    private boolean complete(JSONObject f) {
        Iterator<String> it = f.keys();
        while (it.hasNext()) {
            String path = it.next();
            String hash = f.optString(path);
            if (!validHash(hash)) return false;
            if (!hash.equals(bundled.optString(path)) && !new File(cache, hash).isFile()) return false;
        }
        return true;
    }

    private static byte[] read(InputStream in, int limit) throws Exception {
        try (InputStream input = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] b = new byte[32768]; int n;
            while ((n = input.read(b)) != -1) { if (out.size() + n > limit) throw new IOException("size"); out.write(b, 0, n); }
            return out.toByteArray();
        }
    }

    private static HttpURLConnection open(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(4000); c.setReadTimeout(10000);
        c.setRequestProperty("User-Agent", "GaiaBeltscroll-Updates");
        c.setRequestProperty("Cache-Control", "no-cache");
        return c;
    }

    private static byte[] downloadSmall(String url, int limit) throws Exception {
        HttpURLConnection c = open(url);
        try { if (c.getResponseCode() != 200) throw new IOException("HTTP " + c.getResponseCode()); return read(c.getInputStream(), limit); }
        finally { c.disconnect(); }
    }

    /** 큰 파일은 메모리에 올리지 않고 임시 파일로 받으면서 해시를 계산한다. 해시가 맞아야만 보관한다. */
    private void downloadFile(String url, String hash) throws Exception {
        File dest = new File(cache, hash);
        if (dest.isFile()) return;
        HttpURLConnection c = open(url);
        File temp = File.createTempFile("dl-", ".tmp", cache);
        try {
            if (c.getResponseCode() != 200) throw new IOException("HTTP " + c.getResponseCode());
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            long total = 0;
            try (InputStream in = c.getInputStream(); FileOutputStream out = new FileOutputStream(temp)) {
                byte[] b = new byte[65536]; int n;
                while ((n = in.read(b)) != -1) { total += n; if (total > 80000000L) throw new IOException("size"); md.update(b, 0, n); out.write(b, 0, n); }
            }
            StringBuilder d = new StringBuilder();
            for (byte x : md.digest()) d.append(String.format("%02x", x & 255));
            if (!hash.equals(d.toString())) throw new IOException("hash");
            if (!temp.renameTo(dest)) throw new IOException("commit");
        } finally { c.disconnect(); if (temp.exists()) temp.delete(); }
    }

    void setProgress(Progress p) { progress = p; }

    private void say(String t) { Progress p = progress; if (p != null) p.say(t); }

    /** 백그라운드에서 확인·내려받기. 끝나면(성공이든 실패든) finished 를 부른다. */
    void check(Runnable finished) {
        new Thread(() -> {
            try {
                JSONObject release = new JSONObject(new String(downloadSmall("https://api.github.com/repos/" + REPO + "/releases/tags/" + TAG, 2000000), "UTF-8"));
                JSONArray assets = release.getJSONArray("assets");
                JSONObject manifestAsset = null;
                for (int i = 0; i < assets.length(); i++) if (assets.getJSONObject(i).optString("name").equals("update.json")) manifestAsset = assets.getJSONObject(i);
                if (manifestAsset == null) throw new IOException("No update");
                String stamp = manifestAsset.getString("updated_at") + ":" + manifestAsset.getLong("id");
                if (stamp.equals(prefs.getString("stamp", "")) && complete(files)) return;      // 이미 최신
                String url = manifestAsset.getString("browser_download_url");
                if (!url.startsWith("https://github.com/" + REPO + "/releases/download/")) throw new IOException("URL");
                JSONObject next = new JSONObject(new String(downloadSmall(url + "?v=" + manifestAsset.getLong("id"), 4000000), "UTF-8"));
                String version = next.getString("version");
                if (!version.matches("[a-f0-9]{40}")) throw new IOException("version");
                JSONObject nextFiles = next.getJSONObject("files");

                // 앱(APK) 안 것과 다르고 아직 없는 파일만 받는다.
                Set<String> need = new HashSet<>();
                Iterator<String> it = nextFiles.keys();
                while (it.hasNext()) {
                    String path = it.next();
                    String hash = nextFiles.getString(path);
                    if (safePath(path) == null || !validHash(hash)) throw new IOException("manifest");
                    if (!hash.equals(bundled.optString(path)) && !new File(cache, hash).isFile()) need.add(path);
                }
                if (!nextFiles.has("index.html")) throw new IOException("incomplete");
                int done = 0;
                if (!need.isEmpty()) say("업데이트 받는 중… (0/" + need.size() + ")");
                for (String path : need) {
                    String encoded = new android.net.Uri.Builder().path("/belt-scroll/" + path).build().getEncodedPath();
                    downloadFile("https://raw.githubusercontent.com/" + REPO + "/" + version + encoded, nextFiles.getString(path));
                    say("업데이트 받는 중… (" + (++done) + "/" + need.size() + ")");
                }
                // 전부 받았을 때만 새 목록으로 교체한다.
                File tmp = new File(root, "active.json.tmp");
                try (FileOutputStream out = new FileOutputStream(tmp)) { out.write(new JSONObject().put("version", version).put("files", nextFiles).toString().getBytes("UTF-8")); }
                File active = new File(root, "active.json");
                if (!tmp.renameTo(active)) { active.delete(); if (!tmp.renameTo(active)) throw new IOException("commit"); }
                prefs.edit().putString("stamp", stamp).apply();
                files = nextFiles;
                prune(nextFiles);
            } catch (Exception ignored) { /* 마지막으로 완성된 업데이트 또는 APK 를 그대로 쓴다. */ }
            finally { finished.run(); }
        }, "beltscroll-update").start();
    }

    /** 이제 안 쓰는 옛 파일 정리. */
    private void prune(JSONObject keep) {
        try {
            Set<String> hashes = new HashSet<>();
            Iterator<String> it = keep.keys();
            while (it.hasNext()) hashes.add(keep.optString(it.next()));
            File[] list = cache.listFiles();
            if (list != null) for (File f : list) if (!hashes.contains(f.getName())) f.delete();
        } catch (Exception ignored) { }
    }

    static String mimeOf(String p) {
        String s = p.toLowerCase();
        if (s.endsWith(".html")) return "text/html"; if (s.endsWith(".js")) return "application/javascript";
        if (s.endsWith(".css")) return "text/css"; if (s.endsWith(".json")) return "application/json";
        if (s.endsWith(".webp")) return "image/webp"; if (s.endsWith(".png")) return "image/png";
        if (s.endsWith(".jpg") || s.endsWith(".jpeg")) return "image/jpeg"; if (s.endsWith(".svg")) return "image/svg+xml";
        if (s.endsWith(".ogg")) return "audio/ogg"; if (s.endsWith(".mp3")) return "audio/mpeg";
        return "application/octet-stream";
    }

    /** 앱 주소 /assets/<path> 요청에 답한다: 업데이트로 받은 파일이 있으면 그것, 아니면 APK 안의 파일. */
    WebResourceResponse serve(String requested) {
        String path = safePath(requested);
        if (path == null) return null;
        String mime = mimeOf(path);
        String enc = mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json") ? "UTF-8" : null;
        try {
            String hash = files.optString(path);
            if (validHash(hash) && !hash.equals(bundled.optString(path))) {
                File f = new File(cache, hash);
                if (f.isFile()) return new WebResourceResponse(mime, enc, new FileInputStream(f));
            }
            return new WebResourceResponse(mime, enc, context.getAssets().open(path));
        } catch (Exception e) { return null; }
    }
}
