package com.cocos.lib.xr.audio.gvr;

import android.content.Context;
import android.util.Log;

import com.cocos.lib.xr.audio.CocosXRAudioEngine;
import com.google.vr.sdk.audio.GvrAudioEngine;

public class GVRAudioEngine implements CocosXRAudioEngine.CXRBaseAudioEngine {
    private static final String TAG = "GVRAudioEngine";
    private GvrAudioEngine gvrAudioEngine;
    @Override
    public void init(Context context) {
        gvrAudioEngine = new GvrAudioEngine(context, GvrAudioEngine.RenderingMode.BINAURAL_HIGH_QUALITY);
    }

    @Override
    public int createSoundObject(String filePath) {
        if (gvrAudioEngine != null) {
            int soundId = gvrAudioEngine.createSoundObject(filePath);
            Log.d(TAG, "createSoundObject:" + soundId + " | " + filePath);
            return soundId;
        }
        return -1;
    }

    @Override
    public void pause() {
        if (gvrAudioEngine != null) {
            Log.d(TAG, "onPause");
            gvrAudioEngine.pause();
        }
    }

    @Override
    public void pauseSound(int sourceId) {
        if (gvrAudioEngine != null) {
            Log.d(TAG, "pauseSound:" + sourceId);
            gvrAudioEngine.pauseSound(sourceId);
        }
    }

    @Override
    public void playSound(int sourceId, boolean loopingEnabled) {
        if (gvrAudioEngine != null) {
            Log.d(TAG, "playSound:" + sourceId);
            gvrAudioEngine.playSound(sourceId, loopingEnabled);
        }
    }

    @Override
    public boolean preloadSoundFile(String filePath) {
        if (gvrAudioEngine != null) {
            return gvrAudioEngine.preloadSoundFile(filePath);
        }
        return false;
    }

    @Override
    public void resume() {
        if (gvrAudioEngine != null) {
            Log.d(TAG, "onResume");
            gvrAudioEngine.resume();
        }
    }

    @Override
    public void resumeSound(int sourceId) {
        if (gvrAudioEngine != null) {
            Log.d(TAG, "resumeSound:" + sourceId);
            gvrAudioEngine.resumeSound(sourceId);
        }
    }

    @Override
    public void setHeadPosition(float x, float y, float z) {
        if (gvrAudioEngine != null) {
            gvrAudioEngine.setHeadPosition(x, y, z);
        }
    }

    @Override
    public void setHeadRotation(float x, float y, float z, float w) {
        if (gvrAudioEngine != null) {
            gvrAudioEngine.setHeadRotation(x, y, z, w);
        }
    }

    @Override
    public void setSoundObjectPosition(int soundObjectId, float x, float y, float z) {
        if (gvrAudioEngine != null) {
            gvrAudioEngine.setSoundObjectPosition(soundObjectId, x, y, z);
        }
    }

    @Override
    public void setSoundVolume(int sourceId, float volume) {
        if (gvrAudioEngine != null) {
            Log.d(TAG, "setSoundVolume:" + sourceId + "," + volume);
            gvrAudioEngine.setSoundVolume(sourceId, volume);
        }
    }

    @Override
    public void setSoundObjectDistanceRolloffModel(int soundObjectId, int rolloffModel, float minDistance, float maxDistance) {
        if (gvrAudioEngine != null) {
            Log.d(TAG, "setSoundObjectDistanceRolloffModel:" + soundObjectId + "," + rolloffModel + "," + minDistance + "," + maxDistance);
            gvrAudioEngine.setSoundObjectDistanceRolloffModel(soundObjectId, rolloffModel, minDistance, maxDistance);
        }
    }

    @Override
    public void stopSound(int sourceId) {
        if (gvrAudioEngine != null) {
            Log.d(TAG, "stopSound:" + sourceId);
            gvrAudioEngine.stopSound(sourceId);
        }
    }

    @Override
    public void unloadSoundFile(String filePath) {
        if (gvrAudioEngine != null) {
            gvrAudioEngine.unloadSoundFile(filePath);
        }
    }

    @Override
    public void update() {
        if (gvrAudioEngine != null) {
            gvrAudioEngine.update();
        }
    }

    @Override
    public boolean isSoundPlaying(int sourceId) {
        if (gvrAudioEngine != null) {
            return gvrAudioEngine.isSoundPlaying(sourceId);
        }
        return false;
    }
}
