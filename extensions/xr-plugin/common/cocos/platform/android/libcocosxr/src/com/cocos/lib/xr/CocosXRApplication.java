package com.cocos.lib.xr;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;

public class CocosXRApplication extends Application {
    private static final String TAG = "CocosXRApplication";
    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "onCreate:" + hashCode());

        registerActivityLifecycleCallbacks(new ActivityLifecycleCallbacks() {

            @Override
            public void onActivityCreated(Activity activity, Bundle savedInstanceState) {

            }

            @Override
            public void onActivityStarted(Activity activity) {

            }

            @Override
            public void onActivityResumed(Activity activity) {
                Log.d(TAG, "onActivityResumed:" + activity.getLocalClassName());
                if(TextUtils.equals("com.qualcomm.snapdragon.spaces.spacescontroller.ControllerActivity", activity.getLocalClassName())) {
                    CocosXRApi.getInstance().setControllerActivity(activity);
                }
            }

            @Override
            public void onActivityPaused(Activity activity) {
                Log.d(TAG, "onActivityPaused:" + activity.getLocalClassName());
                if(TextUtils.equals("com.qualcomm.snapdragon.spaces.spacescontroller.ControllerActivity", activity.getLocalClassName())) {
                    CocosXRApi.getInstance().setControllerActivity(null);
                }
            }

            @Override
            public void onActivityStopped(Activity activity) {

            }

            @Override
            public void onActivitySaveInstanceState(Activity activity, Bundle outState) {

            }

            @Override
            public void onActivityDestroyed(Activity activity) {
                if(TextUtils.equals("com.qualcomm.snapdragon.spaces.spacescontroller.ControllerActivity", activity.getLocalClassName())) {
                    CocosXRApi.getInstance().setControllerActivity(null);
                }
            }
        });
    }


}
