package com.gaia.beltscroll;

import android.app.Activity;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

// 벨트스크롤 게임을 앱 안의 파일로 열어 주는 얇은 껍데기. 저장은 게임이 쓰는 localStorage(앱 안에 유지)를 그대로 쓴다.
public class MainActivity extends Activity {
    private static final String START = "https://appassets.androidplatform.net/assets/index.html";
    private WebView web;
    private final Object hapticLock = new Object();
    private Vibrator vibrator;
    private volatile boolean foreground = false;

    private Vibrator getVibrator() {
        if (vibrator == null) {
            if (Build.VERSION.SDK_INT >= 31) {
                VibratorManager manager = (VibratorManager) getSystemService(VIBRATOR_MANAGER_SERVICE);
                if (manager != null) vibrator = manager.getDefaultVibrator();
            } else vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        }
        return vibrator;
    }

    private void stopVibration() {
        try { Vibrator v = getVibrator(); if (v != null) v.cancel(); } catch (Exception ignored) { }
    }

    /** 게임이 부르는 앱 기능: 진동(카드게임 앱과 같은 방식, 항상 최대 세기). */
    private final class Bridge {
        @JavascriptInterface public String vibrate(String text) {
            synchronized (hapticLock) {
                try {
                    if (text == null || text.length() > 1000) return "bad-pattern";
                    String[] parts = text.split(",", -1);
                    if (parts.length > 99) return "bad-pattern";
                    long[] timings = new long[parts.length];
                    int[] amplitudes = new int[parts.length];
                    boolean hasOn = false, hasDuration = false;
                    for (int i = 0; i < parts.length; i++) {
                        timings[i] = Long.parseLong(parts[i].trim());
                        if (timings[i] < 0 || timings[i] > 10000) return "bad-duration";
                        amplitudes[i] = i % 2 == 0 ? 255 : 0;
                        if (timings[i] > 0) { hasDuration = true; if (i % 2 == 0) hasOn = true; }
                    }
                    if (!hasDuration) { stopVibration(); return "ok"; }
                    if (!hasOn) return "bad-pattern";
                    if (!foreground) return "inactive";
                    Vibrator v = getVibrator();
                    if (v == null || !v.hasVibrator()) return "no-vibrator";
                    VibrationEffect effect;
                    if (v.hasAmplitudeControl()) effect = VibrationEffect.createWaveform(timings, amplitudes, -1);
                    else {
                        long[] offFirst = new long[timings.length + 1];
                        System.arraycopy(timings, 0, offFirst, 1, timings.length);
                        effect = VibrationEffect.createWaveform(offFirst, -1);
                    }
                    v.cancel();
                    v.vibrate(effect, new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
                    return "ok";
                } catch (Exception e) { return "error:" + e.getClass().getSimpleName(); }
            }
        }
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });
        web.addJavascriptInterface(new Bridge(), "GaiaBridge");
        web.setWebChromeClient(new WebChromeClient());
        web.setBackgroundColor(0xFF000000);
        if (state == null) web.loadUrl(START);
        else web.restoreState(state);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override
    public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus) hideSystemBars();
    }

    @SuppressWarnings("deprecation")
    private void hideSystemBars() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    // 전투 중 실수로 뒤로 가기를 눌러 앱이 닫히지 않게 한다. 나갈 때는 홈 버튼을 쓴다.
    @Override
    public void onBackPressed() { }

    @Override
    protected void onPause() {
        super.onPause();
        synchronized (hapticLock) { foreground = false; stopVibration(); }
        if (web != null) { web.onPause(); web.pauseTimers(); }
    }

    @Override
    protected void onResume() {
        super.onResume();
        foreground = true;
        if (web != null) { web.onResume(); web.resumeTimers(); }
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
