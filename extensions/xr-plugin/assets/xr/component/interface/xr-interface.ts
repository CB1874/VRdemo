/*
Xiamen Yaji Software Co., Ltd., (the “Licensor”) grants the user (the “Licensee”) non-exclusive and non-transferable rights
to use the software according to the following conditions:

a.  The Licensee shall pay royalties to the Licensor, and the amount of those royalties and the payment method are subject
    to separate negotiations between the parties.
b.  The software is licensed for use rather than sold, and the Licensor reserves all rights over the software that are not
    expressly granted (whether by implication, reservation or prohibition).
c.  The open source codes contained in the software are subject to the MIT Open Source Licensing Agreement (see the attached
    for the details);
d.  The Licensee acknowledges and consents to the possibility that errors may occur during the operation of the software for
    one or more technical reasons, and the Licensee shall take precautions and prepare remedies for such events. In such
    circumstance, the Licensor shall provide software patches or updates according to the agreement between the two parties.
    The Licensor will not assume any liability beyond the explicit wording of this  Licensing Agreement.
e.  Where the Licensor must assume liability for the software according to relevant laws, the Licensor’s entire liability is
    limited to the annual royalty payable by the Licensee.
f.  The Licensor owns the portions listed in the root directory and subdirectory (if any) in the software and enjoys the
    intellectual property rights over those portions. As for the portions owned by the Licensor, the Licensee shall not:
    i.  Bypass or avoid any relevant technical protection measures in the products or services;
    ii. Release the source codes to any other parties;
    iii.Disassemble, decompile, decipher, attack, emulate, exploit or reverse-engineer these portion of code;
    iv. Apply it to any third-party products or services without Licensor’s permission;
    v.  Publish, copy, rent, lease, sell, export, import, distribute or lend any products containing these portions of code;
    vi. Allow others to use any services relevant to the technology of these codes; and
    vii.Conduct any other act beyond the scope of this Licensing Agreement.
g.  This Licensing Agreement terminates immediately if the Licensee breaches this Agreement. The Licensor may claim
    compensation from the Licensee where the Licensee’s breach causes any damage to the Licensor.
h.  The laws of the People's Republic of China apply to this Licensing Agreement.
i.  This Agreement is made in both Chinese and English, and the Chinese version shall prevail the event of conflict.
*/

declare const xr: any;
declare const jsb: any;
type XrEyeRenderCallback = (eye: number) => void;

// XrEntry must not be destroyed
// xr.entry = xr.XrEntry.getInstance();
// xr.entry initialize in game.init()

export enum XRConfigKey {
    DEVICE_VENDOR = 13,
    RUNTIME_VERSION = 14,
    RENDER_EYE_FRAME_LEFT = 16,
    RENDER_EYE_FRAME_RIGHT = 17,
    FEATURE_PASSTHROUGH = 18,
    IMAGE_TRACKING = 19,
    IMAGE_TRACKING_CANDIDATEIMAGE = 20,
    IMAGE_TRACKING_DATA = 21,
    IMAGE_TRACKING_SUPPORT_STATUS = 22,
    HIT_TESTING = 23,
    HIT_TESTING_DATA = 24,
    HIT_TESTING_SUPPORT_STATUS = 25,
    PLANE_DETECTION = 26,
    PLANE_DETECTION_DATA = 27,
    PLANE_DETECTION_SUPPORT_STATUS = 28,
    SPATIAL_ANCHOR = 29,
    SPATIAL_ANCHOR_DATA = 30,
    SPATIAL_ANCHOR_SUPPORT_STATUS = 31,
    HAND_TRACKING = 32,
    HAND_TRACKING_DATA = 33,
    HAND_TRACKING_SUPPORT_STATUS = 34,
    APPLY_HAPTIC_CONTROLLER = 35,
    STOP_HAPTIC_CONTROLLER = 36,
    DEVICE_IPD = 37,
    APP_COMMAND = 38,
    ADB_COMMAND = 39,
    ACTIVITY_LIFECYCLE = 40,
    NATIVE_WINDOW = 41,
    SPLIT_AR_GLASSES = 42,
    ENGINE_VERSION = 43,
    RECENTER_HMD = 44,
    RECENTER_CONTROLLER = 45,
    FOVEATION_LEVEL = 46,
    DISPLAY_REFRESH_RATE = 47,
    CAMERA_ACCESS = 48,
    CAMERA_ACCESS_DATA = 49,
    CAMERA_ACCESS_SUPPORT_STATUS = 50,
    SPATIAL_MESHING = 51,
    SPATIAL_MESHING_DATA = 52,
    SPATIAL_MESHING_SUPPORT_STATUS = 53,
    EYE_RENDER_JS_CALLBACK = 54,
    ASYNC_LOAD_ASSETS_IMAGE = 55,
}

export enum XRVendor {
    MONADO,
    META,
    HUAWEIVR,
    PICO,
    ROKID,
    SEED,
    SPACESXR,
    GSXR,
    YVR,
    HTC,
    IQIYI,
    SKYWORTH,
    FFALCON,
    NREAL,
    INMO,
    LENOVO
}

export const xrInterface = {
    getVendor (): XRVendor {
        const cfg: XRVendor = xr.entry.getXRIntConfig(XRConfigKey.DEVICE_VENDOR);
        return cfg;
    },
    setIPDOffset (offset: number) {
        xr.entry.setIPDOffset(offset);
    },
    setBaseSpaceType (mode: number) {
        xr.entry.setBaseSpaceType(mode);
    },
    applyHapticController (strength: number, time: number, controllerHandle: number) {
        const value = `${strength}+${time}+${controllerHandle}`;
        xr.entry.setXRStringConfig(XRConfigKey.APPLY_HAPTIC_CONTROLLER, value);
    },
    stopHapticController (controllerHandle: number) {
        xr.entry.setXRIntConfig(XRConfigKey.STOP_HAPTIC_CONTROLLER, controllerHandle);
    },
    setIntConfig (key: XRConfigKey, value: number) {
        xr.entry.setXRIntConfig(key, value);
    },
    getIntConfig (key: XRConfigKey): number {
        const cfg: number = xr.entry.getXRIntConfig(key);
        return cfg;
    },
    setBoolConfig (key: XRConfigKey, value: boolean): void {
        xr.entry.setXRBoolConfig(key, value);
    },
    getBoolConfig (key: XRConfigKey): boolean {
        const cfg: boolean = xr.entry.getXRBoolConfig(key);
        return cfg;
    },
    setStringConfig (key: XRConfigKey, value: string) {
        xr.entry.setXRStringConfig(key, value);
    },
    getStringConfig (key: XRConfigKey): string {
        const cfg: string = xr.entry.getXRStringConfig(key);
        return cfg;
    },
    setEyeRenderCallback (beginRender: XrEyeRenderCallback, endRender: XrEyeRenderCallback, target: any): void {
        jsb.onXREyeRenderBegin = (eye: number) => {
            if (target) {
                beginRender.call(target, eye);
            }
        };

        jsb.onXREyeRenderEnd = (eye: number) => {
            if (target) {
                endRender.call(target, eye);
            }
        };
    },
};
