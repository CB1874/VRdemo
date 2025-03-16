/****************************************************************************
 * Copyright (c) 2018-2023 Xiamen Yaji Software Co., Ltd.
 *
 * http://www.cocos.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 ****************************************************************************/

package com.cocos.lib.xr.audio;


import static java.util.Objects.*;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import com.cocos.lib.JsbBridgeWrapper;
import com.cocos.lib.xr.CocosXRApi;
import com.cocos.lib.xr.audio.empty.CocosXREmptyAudioEngine;

import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class CocosXRAudioEngine {
    private static final String TAG = "CocosXRAudioEngine";

    enum XRAudioState {
        DEFAULT,
        LOADING,
        LOADED,
        UNLOAD,
        CREATED,
        PLAYING,
        PAUSED,
        RESUMED,
        STOPPED,
        PLAY_COMPLETED,
    }

    static class XRAudioInfo {
        public String filePath;
        public int soundId;
        public float volume;
        public float positionX;
        public float positionY;
        public float positionZ;
        public boolean isLooping;
        public boolean playOnAwake;
        public XRAudioState audioState;
        Future<String> loadFuture;
        int distanceRollOffModel;
        float minDistance;
        float maxDistance;

        XRAudioInfo() {
            resetData();
        }

        public void resetData() {
            filePath = "";
            soundId = -1;
            volume = 0;
            positionX = 0;
            positionY = 0;
            positionZ = 0;
            audioState = XRAudioState.DEFAULT;
            loadFuture = null;
            isLooping = false;
            playOnAwake = false;
            distanceRollOffModel = 0;
            minDistance = 0;
            maxDistance = 100;
        }
    }

    class XRAudioCallable implements Callable<String> {
        String _uuid;
        String _filePath;
        Runnable _loadRunable;
        XRAudioCallable(Runnable loadRunable, String uuid, String filePath) {
            _loadRunable = loadRunable;
            _filePath = filePath;
            _uuid = uuid;
        }

        @Override
        public String call() throws Exception {
            long start = System.currentTimeMillis();
            if (_loadRunable != null) {
                _loadRunable.run();
                Log.d(TAG, "async preloadSoundFile." + _filePath + " | consume " + (System.currentTimeMillis() - start) + "ms");
            }
            return _uuid;
        }
    }

    private final static CocosXRAudioEngine instance = new CocosXRAudioEngine();

    private CocosXRAudioEngine() {
    }

    public static CocosXRAudioEngine getInstance() {
        return instance;
    }

    public static final String XR_SPATIAL_AUDIO_EVENT_NAME = "xr-spatial-audio";
    public static final String XR_SPATIAL_AUDIO_EVENT_TAG_INIT = "to-init";
    public static final String XR_SPATIAL_AUDIO_EVENT_TAG_STATUS_SOUND_OBJECT = "sound-status";
    public static final String XR_SPATIAL_AUDIO_EVENT_TAG_PAUSE_SOUND_OBJECT = "sound-pause";
    public static final String XR_SPATIAL_AUDIO_EVENT_TAG_RESUME_SOUND_OBJECT = "sound-resume";
    public static final String XR_SPATIAL_AUDIO_EVENT_TAG_STOP_SOUND_OBJECT = "sound-stop";
    public static final String XR_SPATIAL_AUDIO_EVENT_TAG_PLAY_SOUND_OBJECT = "sound-play";
    public static final String XR_SPATIAL_AUDIO_EVENT_TAG_LOCATION_SOUND_OBJECT = "sound-position";
    public static final String XR_SPATIAL_AUDIO_EVENT_TAG_VOLUME_SOUND_OBJECT = "sound-volume";
    public static final String XR_SPATIAL_AUDIO_EVENT_TAG_UNLOAD = "sound-unload";
    public static final String XR_SPATIAL_AUDIO_EVENT_TAG_SYNC_SIXDOF_DATA = "sound-sync-sixdof-data";

    private HashMap<String, XRAudioInfo> audioInfoHashMap = new HashMap<>();
    private ExecutorService fixedThreadPool;

    public void onCreate() {
        JsbBridgeWrapper.getInstance().addScriptEventListener(XR_SPATIAL_AUDIO_EVENT_NAME, arg -> {
            if (arg == null) {
                Log.e(TAG, "Invalid arg is null !!!");
                return;
            }
            String[] dataArray = arg.split("&");
            if (TextUtils.equals(dataArray[0], XR_SPATIAL_AUDIO_EVENT_TAG_INIT)) {
                Log.d(TAG, arg);
                // eventName&uuid&assetPath&positionX&positionY&positionZ&volume&isLoop&autoPlay&rolloffmodel&min&max
                String uuid = dataArray[1];

                if (!audioInfoHashMap.containsKey(uuid)) {
                    audioInfoHashMap.put(uuid, new XRAudioInfo());
                } else {
                    requireNonNull(audioInfoHashMap.get(uuid)).resetData();
                }
                requireNonNull(audioInfoHashMap.get(uuid)).filePath = dataArray[2];
                requireNonNull(audioInfoHashMap.get(uuid)).positionX = Float.parseFloat(dataArray[3]);
                requireNonNull(audioInfoHashMap.get(uuid)).positionY = Float.parseFloat(dataArray[4]);
                requireNonNull(audioInfoHashMap.get(uuid)).positionZ = Float.parseFloat(dataArray[5]);
                requireNonNull(audioInfoHashMap.get(uuid)).volume = Float.parseFloat(dataArray[6]);
                requireNonNull(audioInfoHashMap.get(uuid)).isLooping = dataArray[7].equals("1");
                requireNonNull(audioInfoHashMap.get(uuid)).playOnAwake = dataArray[8].equals("1");
                requireNonNull(audioInfoHashMap.get(uuid)).audioState = XRAudioState.LOADING;
                requireNonNull(audioInfoHashMap.get(uuid)).distanceRollOffModel = Integer.parseInt(dataArray[9]);
                requireNonNull(audioInfoHashMap.get(uuid)).minDistance = Float.parseFloat(dataArray[10]);
                requireNonNull(audioInfoHashMap.get(uuid)).maxDistance = Float.parseFloat(dataArray[11]);
                initializeAudioEngine();

                requireNonNull(audioInfoHashMap.get(uuid)).loadFuture = fixedThreadPool.submit(new XRAudioCallable(new Runnable() {
                    @Override
                    public void run() {
                        preloadSoundFile(dataArray[2]);
                    }
                }, uuid, dataArray[2]));
            } else if (TextUtils.equals(dataArray[0], XR_SPATIAL_AUDIO_EVENT_TAG_PLAY_SOUND_OBJECT)) {
                // eventName&uuid
                String uuid = dataArray[1];
                if(isSoundPlaying(requireNonNull(audioInfoHashMap.get(uuid)).soundId)) {
                    playSound(requireNonNull(audioInfoHashMap.get(uuid)).soundId, requireNonNull(audioInfoHashMap.get(uuid)).isLooping);
                    requireNonNull(audioInfoHashMap.get(uuid)).audioState = XRAudioState.PLAYING;
                    syncAudioStatus(uuid);
                } else {
                    int soundId = createSoundObject(requireNonNull(audioInfoHashMap.get(uuid)).filePath);
                    requireNonNull(audioInfoHashMap.get(uuid)).soundId = soundId;
                    setSoundObjectPosition(soundId, requireNonNull(audioInfoHashMap.get(uuid)).positionX, requireNonNull(audioInfoHashMap.get(uuid)).positionY,
                            requireNonNull(audioInfoHashMap.get(uuid)).positionZ);
                    setSoundVolume(soundId, requireNonNull(audioInfoHashMap.get(uuid)).volume);
                    if(requireNonNull(audioInfoHashMap.get(uuid)).distanceRollOffModel > 0) {
                        setSoundObjectDistanceRolloffModel(soundId, requireNonNull(audioInfoHashMap.get(uuid)).distanceRollOffModel, requireNonNull(audioInfoHashMap.get(uuid)).minDistance,
                                requireNonNull(audioInfoHashMap.get(uuid)).maxDistance);
                    }
                    playSound(requireNonNull(audioInfoHashMap.get(uuid)).soundId, requireNonNull(audioInfoHashMap.get(uuid)).isLooping);
                    requireNonNull(audioInfoHashMap.get(uuid)).audioState = XRAudioState.PLAYING;
                    syncAudioStatus(uuid);
                }
            } else if (TextUtils.equals(dataArray[0], XR_SPATIAL_AUDIO_EVENT_TAG_PAUSE_SOUND_OBJECT)) {
                // eventName&uuid
                String uuid = dataArray[1];
                pauseSound(requireNonNull(audioInfoHashMap.get(uuid)).soundId);
                requireNonNull(audioInfoHashMap.get(uuid)).audioState = XRAudioState.PAUSED;
                syncAudioStatus(uuid);
            } else if (TextUtils.equals(dataArray[0], XR_SPATIAL_AUDIO_EVENT_TAG_RESUME_SOUND_OBJECT)) {
                // eventName&uuid
                String uuid = dataArray[1];
                resumeSound(requireNonNull(audioInfoHashMap.get(uuid)).soundId);
                requireNonNull(audioInfoHashMap.get(uuid)).audioState = XRAudioState.RESUMED;
                syncAudioStatus(uuid);
            } else if (TextUtils.equals(dataArray[0], XR_SPATIAL_AUDIO_EVENT_TAG_STOP_SOUND_OBJECT)) {
                // eventName&uuid
                String uuid = dataArray[1];
                stopSound(requireNonNull(audioInfoHashMap.get(uuid)).soundId);
                requireNonNull(audioInfoHashMap.get(uuid)).audioState = XRAudioState.STOPPED;
                syncAudioStatus(uuid);
            } else if (TextUtils.equals(dataArray[0], XR_SPATIAL_AUDIO_EVENT_TAG_LOCATION_SOUND_OBJECT)) {
                // eventName&uuid&x&y&z
                String uuid = dataArray[1];
                requireNonNull(audioInfoHashMap.get(uuid)).positionX = Float.parseFloat(dataArray[2]);
                requireNonNull(audioInfoHashMap.get(uuid)).positionY = Float.parseFloat(dataArray[3]);
                requireNonNull(audioInfoHashMap.get(uuid)).positionZ = Float.parseFloat(dataArray[4]);

                setSoundObjectPosition(requireNonNull(audioInfoHashMap.get(uuid)).soundId,
                        requireNonNull(audioInfoHashMap.get(uuid)).positionX,
                        requireNonNull(audioInfoHashMap.get(uuid)).positionY,
                        requireNonNull(audioInfoHashMap.get(uuid)).positionZ);
            } else if (TextUtils.equals(dataArray[0], XR_SPATIAL_AUDIO_EVENT_TAG_VOLUME_SOUND_OBJECT)) {
                // eventName&uuid&volume
                String uuid = dataArray[1];
                requireNonNull(audioInfoHashMap.get(uuid)).volume = Float.parseFloat(dataArray[2]);
                setSoundVolume(requireNonNull(audioInfoHashMap.get(uuid)).soundId, requireNonNull(audioInfoHashMap.get(uuid)).volume);
            } else if (TextUtils.equals(dataArray[0], XR_SPATIAL_AUDIO_EVENT_TAG_UNLOAD)) {
                // eventName&uuid
                String uuid = dataArray[1];
                unloadSoundFile(requireNonNull(audioInfoHashMap.get(uuid)).filePath);
                requireNonNull(audioInfoHashMap.get(uuid)).audioState = XRAudioState.UNLOAD;
                syncAudioStatus(uuid);
            } else if (TextUtils.equals(dataArray[0], XR_SPATIAL_AUDIO_EVENT_TAG_SYNC_SIXDOF_DATA)) {
                // eventName&headpositonX&headpositonY&headpositonZ&headQuatX&headQuatY&headQuatZ&headQuatW
                syncHeadPoseToAudioEngine(Float.parseFloat(dataArray[1]), Float.parseFloat(dataArray[2]), Float.parseFloat(dataArray[3]),
                        Float.parseFloat(dataArray[4]),Float.parseFloat(dataArray[5]),Float.parseFloat(dataArray[6]),Float.parseFloat(dataArray[7]));
                onTick();
            }

        });
    }

    private void syncAudioStatus(String uuid) {
        Log.d(TAG, "JS syncAudioStatus:" + uuid);
        JsbBridgeWrapper.getInstance().dispatchEventToScript(XR_SPATIAL_AUDIO_EVENT_NAME + "_" + uuid,
                XR_SPATIAL_AUDIO_EVENT_TAG_STATUS_SOUND_OBJECT + "&" + requireNonNull(audioInfoHashMap.get(uuid)).audioState.ordinal());
    }

    public void onResume() {
        audioEngineResume();
    }

    public void onPause() {
        audioEnginePause();
    }

    public void onDestroy() {
        Log.d(TAG, "onDestroy");
        audioEngineDestroy();

        if (fixedThreadPool != null) {
            fixedThreadPool.shutdownNow();
            fixedThreadPool = null;
        }
        JsbBridgeWrapper.getInstance().removeAllListenersForEvent(XR_SPATIAL_AUDIO_EVENT_NAME);
    }

    private void onTick() {
        if (audioInfoHashMap.size() > 0) {
            Set<Map.Entry<String, XRAudioInfo>> set = audioInfoHashMap.entrySet();
            for (Map.Entry<String, XRAudioInfo> entry : set) {
                if (entry.getValue().audioState == XRAudioState.LOADING && entry.getValue().loadFuture.isDone()) {
                    entry.getValue().audioState = XRAudioState.LOADED;
                    syncAudioStatus(entry.getKey());
                } else if (entry.getValue().audioState == XRAudioState.LOADED) {
                    entry.getValue().audioState = XRAudioState.CREATED;
                    int soundId = createSoundObject(entry.getValue().filePath);
                    entry.getValue().soundId = soundId;

                    setSoundObjectPosition(entry.getValue().soundId, entry.getValue().positionX, entry.getValue().positionY, entry.getValue().positionZ);
                    setSoundVolume(entry.getValue().soundId, entry.getValue().volume);
                    if(entry.getValue().distanceRollOffModel > 0) {
                        setSoundObjectDistanceRolloffModel(entry.getValue().soundId, entry.getValue().distanceRollOffModel, entry.getValue().minDistance, entry.getValue().maxDistance);
                    }

                    syncAudioStatus(entry.getKey());
                    if (entry.getValue().playOnAwake) {
                        playSound(soundId, entry.getValue().isLooping);
                        entry.getValue().audioState = XRAudioState.PLAYING;
                        syncAudioStatus(entry.getKey());
                    }
                } else if (entry.getValue().audioState == XRAudioState.PLAYING && !isSoundPlaying(entry.getValue().soundId)) {
                    entry.getValue().audioState = XRAudioState.PLAY_COMPLETED;
                    syncAudioStatus(entry.getKey());
                    Log.d(TAG, "onPlayCompleted:" + entry.getValue().soundId);
                }
            }
        }
        audioEngineUpdate();
    }

    //Within the Min distance the AudioSource will cease to grow louder in volume.
    //Outside the min distance the volume starts to attenuate.
    //(Logarithmic rolloff) MaxDistance is the distance a sound stops attenuating at.
    //(Linear rolloff) MaxDistance is the distance where the sound is completely inaudible.
    public static int DistanceRolloffModel_LOGARITHMIC = 0;
    public static int DistanceRolloffModelLINEAR = 1;
    public static int DistanceRolloffModelNONE = 2;
    // Interface
    public interface CXRBaseAudioEngine {
        void init(Context context);
        int createSoundObject(String filePath);
        void pause();
        void pauseSound(int sourceId);
        void playSound(int sourceId, boolean loopingEnabled);
        boolean preloadSoundFile(String filePath);
        void resume();
        void resumeSound(int sourceId);
        void setHeadPosition(float x, float y, float z);
        void setHeadRotation(float x, float y, float z, float w);
        void setSoundObjectPosition(int soundObjectId, float x, float y, float z);
        void setSoundVolume(int sourceId, float volume);
        void setSoundObjectDistanceRolloffModel(int soundObjectId, int rolloffModel, float minDistance, float maxDistance);
        void stopSound(int sourceId);
        void unloadSoundFile(String filePath);
        void update();
        boolean isSoundPlaying(int sourceId);

        static CXRBaseAudioEngine newInstance() {
            try {
                Class gvrAudioEngineCls  = Class.forName("com.cocos.lib.xr.audio.gvr.GVRAudioEngine");
                return (CXRBaseAudioEngine) gvrAudioEngineCls.getDeclaredConstructors()[0].newInstance();
            } catch (ClassNotFoundException e) {
                e.printStackTrace();
            } catch (InvocationTargetException e) {
                e.printStackTrace();
            } catch (IllegalAccessException e) {
                e.printStackTrace();
            } catch (InstantiationException e) {
                e.printStackTrace();
            }
            return new CocosXREmptyAudioEngine();
        }
    }
    //
    private CXRBaseAudioEngine audioEngine;
    protected boolean preloadSoundFile(String filePath) {
        if (audioEngine != null) {
            return audioEngine.preloadSoundFile(filePath);
        }
        return false;
    }

    protected void syncHeadPoseToAudioEngine(float px, float py, float pz, float qx, float qy, float qz, float qw) {
        if (audioEngine != null) {
            audioEngine.setHeadPosition(px, py, pz);
            audioEngine.setHeadRotation(qx, qy, qz, qw);
        }
    }

    protected void audioEngineUpdate() {
        if (audioEngine != null) {
            audioEngine.update();
        }
    }

    protected void audioEngineResume() {
        if (audioEngine != null) {
            Log.d(TAG, "onResume");
            audioEngine.resume();
        }
    }

    protected void audioEnginePause() {
        if (audioEngine != null) {
            Log.d(TAG, "onPause");
            audioEngine.pause();
        }
    }

    protected void audioEngineDestroy() {
        if (audioEngine != null) {
            Log.d(TAG, "onDestroy");
            audioEngine = null;
        }
    }

    protected int createSoundObject(String filePath) {
        if (audioEngine != null) {
            int soundId = audioEngine.createSoundObject(filePath);
            Log.d(TAG, "createSoundObject:" + soundId + " | " + filePath);
            return soundId;
        }
        return -1;
    }

    protected void initializeAudioEngine() {
        if (audioEngine == null) {
            Log.d(TAG, "initializeAudioEngine");
            fixedThreadPool = Executors.newFixedThreadPool(2);
            audioEngine = CXRBaseAudioEngine.newInstance();
            audioEngine.init(CocosXRApi.getInstance().getContext());
        }
    }

    protected void playSound(int soundId, boolean isLooping) {
        if (audioEngine != null) {
            Log.d(TAG, "playSound:" + soundId);
            audioEngine.playSound(soundId, isLooping);
        }
    }

    protected void pauseSound(int soundId) {
        if (audioEngine != null) {
            Log.d(TAG, "pauseSound:" + soundId);
            audioEngine.pauseSound(soundId);
        }
    }

    protected void resumeSound(int soundId) {
        if (audioEngine != null) {
            Log.d(TAG, "resumeSound:" + soundId);
            audioEngine.resumeSound(soundId);
        }
    }

    protected void stopSound(int soundId) {
        if (audioEngine != null) {
            Log.d(TAG, "stopSound:" + soundId);
            audioEngine.stopSound(soundId);
        }
    }

    protected void setSoundObjectPosition(int soundId, float x, float y, float z) {
        if (audioEngine != null) {
            audioEngine.setSoundObjectPosition(soundId, x, y, z);
        }
    }

    protected void setSoundObjectDistanceRolloffModel(int soundObjectId, int rolloffModel, float minDistance, float maxDistance) {
        if (audioEngine != null) {
            audioEngine.setSoundObjectDistanceRolloffModel(soundObjectId, rolloffModel, minDistance, maxDistance);
        }
    }

    protected void setSoundVolume(int soundId, float volume) {
        if (audioEngine != null) {
            Log.d(TAG, "setSoundVolume:" + soundId + "," + volume);
            audioEngine.setSoundVolume(soundId, volume);
        }
    }

    protected void unloadSoundFile(String filename) {
        if (audioEngine != null) {
            audioEngine.unloadSoundFile(filename);
        }
    }

    protected boolean isSoundPlaying(int soundId) {
        if (audioEngine != null) {
            return audioEngine.isSoundPlaying(soundId);
        }
        return false;
    }
}
