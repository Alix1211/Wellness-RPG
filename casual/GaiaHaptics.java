package com.gaia.casual;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.SystemClock;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.webkit.JavascriptInterface;

/** Fixed, non-repeating game effects. Calls are bounded and run on the UI thread. */
public final class GaiaHaptics {
    private final Activity activity;
    private final Vibrator vibrator;
    private final SharedPreferences prefs;
    private volatile boolean foreground=false;
    private volatile boolean enabled;
    private long last=-1000; private boolean lastWasStrong=false;
    public GaiaHaptics(Activity activity) {
        this.activity=activity;
        prefs=activity.getSharedPreferences("haptics",Context.MODE_PRIVATE);
        enabled=prefs.getBoolean("enabled",true);
        Vibrator found=null;
        if(Build.VERSION.SDK_INT>=31){VibratorManager m=(VibratorManager)activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);if(m!=null)found=m.getDefaultVibrator();}
        if(found==null)found=(Vibrator)activity.getSystemService(Context.VIBRATOR_SERVICE);
        vibrator=found;
    }
    public void foreground(boolean value){foreground=value;if(!value)cancel();}
    @JavascriptInterface public boolean hasVibrator(){return vibrator!=null&&vibrator.hasVibrator();}
    @JavascriptInterface public void setEnabled(boolean value){enabled=value;prefs.edit().putBoolean("enabled",value).apply();if(!value)cancel();}
    @JavascriptInterface public void cancel(){activity.runOnUiThread(()->{if(vibrator!=null)try{vibrator.cancel();}catch(RuntimeException ignored){}});}
    @JavascriptInterface public void pulse(String event){
        final long[] pattern;final int amp;final boolean priority;
        if(event==null)return;
        switch(event){
            case "tap":pattern=new long[]{0,35};amp=220;priority=false;break;
            case "tick":pattern=new long[]{0,48};amp=240;priority=false;break;
            case "jump":pattern=new long[]{0,55};amp=240;priority=false;break;
            case "hit":pattern=new long[]{0,90};amp=255;priority=true;break;
            case "collision":pattern=new long[]{0,130};amp=255;priority=true;break;
            case "success":pattern=new long[]{0,65,65,110};amp=255;priority=true;break;
            case "fail":pattern=new long[]{0,120,80,140};amp=255;priority=true;break;
            case "test":pattern=new long[]{0,240};amp=255;priority=true;break;
            default:return;
        }
        if(!enabled||!foreground||!hasVibrator())return;
        activity.runOnUiThread(()->{
            if(!enabled||!foreground||!hasVibrator())return;
            long now=SystemClock.elapsedRealtime();if(now-last<(priority&&!lastWasStrong?0:priority?45:85))return;last=now;lastWasStrong=priority;
            int power=vibrator.hasAmplitudeControl()?amp:VibrationEffect.DEFAULT_AMPLITUDE;
            VibrationEffect effect;
            if(pattern.length==2)effect=VibrationEffect.createOneShot(pattern[1],power);
            else{int[] amps=new int[pattern.length];for(int i=1;i<amps.length;i+=2)amps[i]=power;effect=VibrationEffect.createWaveform(pattern,amps,-1);}
            try{
                if(Build.VERSION.SDK_INT>=33)vibrator.vibrate(effect,new VibrationAttributes.Builder().setUsage(VibrationAttributes.USAGE_TOUCH).build());
                else vibrator.vibrate(effect,new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_GAME).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            }catch(RuntimeException ignored){/* Unsupported or system-disabled haptics never interrupt play. */}
        });
    }
}

