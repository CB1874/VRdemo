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

package com.cocos.lib.xr;

import android.app.Activity;
import android.app.Application;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.Surface;
import android.view.WindowManager;

import com.cocos.lib.xr.audio.CocosXRAudioEngine;

import java.lang.ref.WeakReference;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class CocosXRApi {
    public static int API_VERSION = 1;
    private static final String TAG = "CocosXRApi";
    private final static String ACTION_ADB_CMD = "com.cocosxr.adb.cmd";
    private enum ActivityLifecycleType {
        UnKnown,
        Created,
        Started,
        Resumed,
        Paused,
        Stopped,
        SaveInstanceState,
        Destroyed
    }

    private final static CocosXRApi instance = new CocosXRApi();

    /**
     * adb shell am broadcast -a com.cocosxr.adb.cmd --es CMD_KEY LOG --ei CMD_VALUE 1
     * adb shell am broadcast -a com.cocosxr.adb.cmd --es CMD_KEY LOG --es CMD_VALUE abc
     */
    private class CocosXRActionReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (ACTION_ADB_CMD.equals(intent.getAction())) {
                // adb cmd
                if (intent.getExtras() == null) {
                    Log.w(TAG, "[CocosXRActionReceiver] intent.getExtras() == null");
                    return;
                }
                Object cmdKey = intent.getExtras().get("CMD_KEY");
                String key = cmdKey == null ? "" : cmdKey.toString();
                Object cmdValue = intent.getExtras().get("CMD_VALUE");
                String valueStr = null;
                if (cmdValue instanceof Integer) {
                    valueStr = String.valueOf(intent.getIntExtra("CMD_VALUE", Integer.MIN_VALUE));
                } else if (cmdValue instanceof String) {
                    valueStr = intent.getStringExtra("CMD_VALUE");
                }

                try {
                    onAdbCmd(key, valueStr);
                } catch (Throwable e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private CocosXRApi() {
    }

    public static CocosXRApi getInstance() {
        return instance;
    }

    private Application application;
    private WeakReference<Activity> activityWeakReference;
    private WeakReference<Activity> controllerActivityWeakReference;
    private Context applicationContext;
    private Application.ActivityLifecycleCallbacks activityLifecycleCallbacks;
    private CocosXRActionReceiver actionReceiver;
    private CocosXRWebViewManager webViewManager;
    private CocosXRAudioEngine spatialAudioEngine = CocosXRAudioEngine.getInstance();
    private String startActivityName = "";
    private boolean isKeepScreenOn = false;
    private HashMap<Integer, Surface> xrSurfaceMap = new HashMap<Integer, Surface>();

    public void onCreate(Activity activity) {
        ArrayList<Activity> resumedActivities = getCurrentResumedActivities();
        for(Activity aty : resumedActivities) {
            Log.d(TAG, "CurrentResumedActivity:" + aty.getLocalClassName());
            if(TextUtils.equals("com.qualcomm.snapdragon.spaces.spacescontroller.ControllerActivity", aty.getLocalClassName())) {
                setControllerActivity(aty);
            }
        }
        startActivityName = activity.getLocalClassName();
        activityWeakReference = new WeakReference<>(activity);
        application = activity.getApplication();
        applicationContext = activity.getApplicationContext();
        webViewManager = new CocosXRWebViewManager();
        spatialAudioEngine.onCreate();
        webViewManager.onCreate(activity);
        if (activityLifecycleCallbacks == null) {
            activityLifecycleCallbacks = new Application.ActivityLifecycleCallbacks() {
                @Override
                public void onActivityCreated(Activity activity, Bundle savedInstanceState) {
                    try {
                        onActivityLifecycleCallback(ActivityLifecycleType.Created.ordinal(), activity.getLocalClassName());
                    } catch (Throwable e) {
                        e.printStackTrace();
                    }
                }

                @Override
                public void onActivityStarted(Activity activity) {
                    try {
                        onActivityLifecycleCallback(ActivityLifecycleType.Started.ordinal(), activity.getLocalClassName());
                    } catch (Throwable e) {
                        e.printStackTrace();
                    }
                }

                @Override
                public void onActivityResumed(Activity activity) {
                    try {
                        onActivityLifecycleCallback(ActivityLifecycleType.Resumed.ordinal(), activity.getLocalClassName());
                    } catch (Throwable e) {
                        e.printStackTrace();
                    }

                    if(TextUtils.equals(startActivityName, activity.getLocalClassName())) {
                        webViewManager.onResume();
                        spatialAudioEngine.onResume();
                    }
                }

                @Override
                public void onActivityPaused(Activity activity) {
                    try {
                        onActivityLifecycleCallback(ActivityLifecycleType.Paused.ordinal(), activity.getLocalClassName());
                    } catch (Throwable e) {
                        e.printStackTrace();
                    }

                    if(TextUtils.equals(startActivityName, activity.getLocalClassName())) {
                        webViewManager.onPause();
                        spatialAudioEngine.onPause();
                    }
                }

                @Override
                public void onActivityStopped(Activity activity) {
                    try {
                        onActivityLifecycleCallback(ActivityLifecycleType.Stopped.ordinal(), activity.getLocalClassName());
                    } catch (Throwable e) {
                        e.printStackTrace();
                    }
                }

                @Override
                public void onActivitySaveInstanceState(Activity activity, Bundle outState) {
                    try {
                        onActivityLifecycleCallback(ActivityLifecycleType.SaveInstanceState.ordinal(), activity.getLocalClassName());
                    } catch (Throwable e) {
                        e.printStackTrace();
                    }
                }

                @Override
                public void onActivityDestroyed(Activity activity) {
                    try {
                        onActivityLifecycleCallback(ActivityLifecycleType.Destroyed.ordinal(), activity.getLocalClassName());
                    } catch (Throwable e) {
                        e.printStackTrace();
                    }

                    if(TextUtils.equals(startActivityName, activity.getLocalClassName())) {
                        webViewManager.onDestroy();
                        spatialAudioEngine.onDestroy();
                    }
                }
            };
        }
        application.registerActivityLifecycleCallbacks(activityLifecycleCallbacks);

        if(actionReceiver != null) {
            applicationContext.unregisterReceiver(actionReceiver);
            actionReceiver =null;
        }

        actionReceiver = new CocosXRActionReceiver();

        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(ACTION_ADB_CMD);
        applicationContext.registerReceiver(actionReceiver, intentFilter);
    }

    public void onDestroy() {
        if (application != null && activityLifecycleCallbacks != null) {
            application.unregisterActivityLifecycleCallbacks(activityLifecycleCallbacks);
            activityLifecycleCallbacks = null;
        }

        if(applicationContext != null && actionReceiver != null) {
            applicationContext.unregisterReceiver(actionReceiver);
            actionReceiver = null;
        }
        xrSurfaceMap.clear();
    }

    public Context getContext() {
        return applicationContext;
    }

    public Activity getActivity() {
        return activityWeakReference.get();
    }

    public void setControllerActivity(Activity activity) {
        controllerActivityWeakReference = new WeakReference<>(activity);
    }

    public Activity getControllerActivity() {
        return controllerActivityWeakReference == null ? null : controllerActivityWeakReference.get();
    }

    public ArrayList<Activity> getCurrentResumedActivities() {
        ArrayList<Activity> list = new ArrayList<>();
        try {
            Class activityThreadClass = Class.forName("android.app.ActivityThread");
            Object activityThread = activityThreadClass.getMethod("currentActivityThread").invoke(null);
            Field activitiesField = activityThreadClass.getDeclaredField("mActivities");
            activitiesField.setAccessible(true);
            Map activities = (Map) activitiesField.get(activityThread);
            for (Object activityRecord : activities.values()) {
                Class activityRecordClass = activityRecord.getClass();
                Field pausedField = activityRecordClass.getDeclaredField("paused");
                pausedField.setAccessible(true);
                if (!pausedField.getBoolean(activityRecord)) {
                    Field activityField = activityRecordClass.getDeclaredField("activity");
                    activityField.setAccessible(true);
                    Activity activity = (Activity) activityField.get(activityRecord);
                    list.add(activity);
                }
            }
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        } finally {
            return list;
        }
    }

    public boolean isKeepScreenOnEnabled() {
        return isKeepScreenOn;
    }

    public void keepScreenOn(boolean enable) {
        if (getActivity() == null) {
            Log.e(TAG, "keeScreenOn failed, activity is null !!!");
            return;
        }
        isKeepScreenOn = enable;

        if (enable) {
            getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Log.d(TAG, "==============> [JAVA] keepScreenOn(true) - Disabled screen saver");
                    getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
            });
        } else {
            getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Log.d(TAG, "==============> [JAVA] keepScreenOn(false) - Enabled screen saver");
                    getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                }
            });
        }
    }

    // native
    private native void onActivityLifecycleCallback(int id, String activityClassName);
    private native void onAdbCmd(String key, String value);

    // called from native
    public void onSurfaceCreatedFromNative(int id, Surface surface) {
        xrSurfaceMap.put(id, surface);
    }

    public Surface getXrSurface(int id) {
        return xrSurfaceMap.get(id);
    }

    public void removeXrSurface(int id) {
        xrSurfaceMap.remove(id);
    }
}
