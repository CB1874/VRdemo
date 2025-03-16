package com.cocos.lib.xr.audio.empty;

import android.content.Context;

import com.cocos.lib.xr.audio.CocosXRAudioEngine;

public class CocosXREmptyAudioEngine implements CocosXRAudioEngine.CXRBaseAudioEngine {
    @Override
    public void init(Context context) {

    }

    @Override
    public int createSoundObject(String filePath) {
        return -1;
    }

    @Override
    public void pause() {

    }

    @Override
    public void pauseSound(int sourceId) {

    }

    @Override
    public void playSound(int sourceId, boolean loopingEnabled) {

    }

    @Override
    public boolean preloadSoundFile(String filePath) {
        return false;
    }

    @Override
    public void resume() {

    }

    @Override
    public void resumeSound(int sourceId) {

    }

    @Override
    public void setHeadPosition(float x, float y, float z) {

    }

    @Override
    public void setHeadRotation(float x, float y, float z, float w) {

    }

    @Override
    public void setSoundObjectPosition(int soundObjectId, float x, float y, float z) {

    }

    @Override
    public void setSoundVolume(int sourceId, float volume) {

    }

    @Override
    public void setSoundObjectDistanceRolloffModel(int soundObjectId, int rolloffModel, float minDistance, float maxDistance) {

    }

    @Override
    public void stopSound(int sourceId) {

    }

    @Override
    public void unloadSoundFile(String filePath) {

    }

    @Override
    public void update() {

    }

    @Override
    public boolean isSoundPlaying(int sourceId) {
        return false;
    }
}
