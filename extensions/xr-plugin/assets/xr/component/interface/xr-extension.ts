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

export enum XrExtensionKey {
    XEK_DEFAULT = 0,
    XEK_SPACES_CAMERA_FRAME_DATA = 1,
    XEK_SPACES_CAMERA_CONFIGURATION = 2,
    XEK_SPACES_CAMERA_INTRINSICS = 3,
    XEK_SPACES_MESH_INFO = 4,
    XEK_SPACES_MESH_VERTICES = 5,
    XEK_SPACES_MESH_INDICES = 6,
    XEK_COMPOSITION_LAYER_CREATE = 7,
    XEK_COMPOSITION_LAYER_SWAPCHAIN_IMAGES = 8,
    XEK_COMPOSITION_LAYER_TICK = 9,
    XEK_COMPOSITION_LAYER_DESTROY = 10,
    XEK_PASSTHROUGH_LAYER_TICK = 11,
    XEK_ASSETS_IMAGE_DATA = 12,
    XEK_PREVENT_SLEEP_MODE = 13,
    XEK_IMAGE_TARGET_TRACKING_MODE = 14,
    XEK_COMPOSITION_LAYER_ANDROID_SURFACE_ID = 15,
}

export enum XrBufferOperationType {
    XBOT_SET = 0,
    XBOT_GET = 1
}

type XrEventCallback = (eventType: number, eventCode: number) => void;

export const xrExtension = {
    getInt8Data (key: number): number[] {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().getInt8Data(key);
    },
    getUInt8Data (key: number): number[] {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().getUInt8Data(key);
    },
    getInt32Data (key: number): number[] {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().getInt32Data(key);
    },
    getUInt32Data (key: number): number[] {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().getUInt32Data(key);
    },
    getFloat32Data (key: number): number[] {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().getFloat32Data(key);
    },
    getStringData (key: number): string[] {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().getStringData(key);
    },
    syncSharedBufferWithNative_INT8 (key: number, operationType: number, buffer: Int8Array, length: number): number {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().syncSharedBufferWithNative_INT8(key, operationType, buffer, length);
    },
    syncSharedBufferWithNative_UINT8 (key: number, operationType: number, buffer: Uint8Array, length: number): number {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().syncSharedBufferWithNative_UINT8(key, operationType, buffer, length);
    },
    syncSharedBufferWithNative_INT32 (key: number, operationType: number, buffer: Int32Array, length: number): number {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().syncSharedBufferWithNative_INT32(key, operationType, buffer, length);
    },
    syncSharedBufferWithNative_UINT32 (key: number, operationType: number, buffer: Uint32Array, length: number): number {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().syncSharedBufferWithNative_UINT32(key, operationType, buffer, length);
    },
    syncSharedBufferWithNative_Float32 (key: number, operationType: number, buffer: Float32Array, length: number): number {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().syncSharedBufferWithNative_Float32(key, operationType, buffer, length);
    },
    querySharedBufferLength (key: number): number {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return xr.XrExtension.getInstance().querySharedBufferLength(key);
    },
    setXrEventCallback (callback: XrEventCallback): void {
        xr.XrExtension.getInstance().setXrEventCallback(callback);
    },
    notifyXrEvent (eventType: number, eventCode: number, arg0: number, arg1: number): void {
        xr.XrExtension.getInstance().notifyXrEvent(eventType, eventCode, arg0, arg1);
    },

};
