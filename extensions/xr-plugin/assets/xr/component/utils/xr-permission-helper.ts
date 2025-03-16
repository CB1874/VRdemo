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

import { native } from 'cc';

export enum XRPermissionResult {
    PERMISSION_GRANTED = 0,
    PERMISSION_DENIED = -1
}

export enum XRPermissionName {
    INTERNET = 'android.permission.INTERNET',
    READ_EXTERNAL_STORAGE = 'android.permission.READ_EXTERNAL_STORAGE',
    RECORD_AUDIO = 'android.permission.RECORD_AUDIO',
    ACCESS_FINE_LOCATION = 'android.permission.ACCESS_FINE_LOCATION',
    ACCESS_COARSE_LOCATION = 'android.permission.ACCESS_COARSE_LOCATION',
    WRITE_EXTERNAL_STORAGE = 'android.permission.WRITE_EXTERNAL_STORAGE',
    CAMERA = 'android.permission.CAMERA',
    READ_PHONE_STATE = 'android.permission.READ_PHONE_STATE'
}

export type OnXRCheckPermissionEventListener = (arg: XRPermissionResult) => void;
export type OnXRRequestPermissionEventListener = (names: Array<string>, results: Array<XRPermissionResult>) => void;
export type OnARReadyEventListener = () => void;
export class XRPermissionHelper {
    public static XR_PERMISSION_EVENT_NAME = 'xr-permission';
    public static XR_PERMISSION_TAG_CHECK = 'check';
    public static XR_PERMISSION_TAG_REQUEST = 'request';
    public static XR_PERMISSION_TAG_AR_CHECK = "ar-check-availability";

    private static _listenerAdded = false;
    private static _arReadyEventListener: OnARReadyEventListener | null = null;
    private static _requestPermissionEventListener: OnXRRequestPermissionEventListener | null = null;
    private static _checkPermissionMap: Map<string, OnXRCheckPermissionEventListener> = new Map < string, OnXRCheckPermissionEventListener>();
    public static checkPermission (name: string, listener: OnXRCheckPermissionEventListener | null): boolean {
        if (listener) {
            this._checkPermissionMap.set(name, listener);
        }
        this.addListenerCheck();
        native.jsbBridgeWrapper.dispatchEventToNative(this.XR_PERMISSION_EVENT_NAME,
            `${this.XR_PERMISSION_TAG_CHECK}:${name}`);
        return false;
    }

    public static requestPermissions (names: Array<string>, listener: OnXRRequestPermissionEventListener | null): boolean {
        this._requestPermissionEventListener = listener;
        this.addListenerCheck();
        let eventData = '';
        for (let i = 0; i < names.length; i++) {
            if (i !== names.length - 1) {
                eventData = `${eventData + names[i]}&`;
            } else {
                eventData += names[i];
            }
        }
        native.jsbBridgeWrapper.dispatchEventToNative(this.XR_PERMISSION_EVENT_NAME,
            `${this.XR_PERMISSION_TAG_REQUEST}:${eventData}`);
        return false;
    }

    public static setARReadyListener (listener: OnARReadyEventListener): void {
        this._arReadyEventListener = listener;
        this.addListenerCheck();
    }

    public static checkARReady (): void {
        native.jsbBridgeWrapper.dispatchEventToNative(this.XR_PERMISSION_EVENT_NAME,
            `${this.XR_PERMISSION_TAG_AR_CHECK}:1`);
    }

    private static addListenerCheck (): void {
        if (!this._listenerAdded) {
            this._listenerAdded = true;
            native.jsbBridgeWrapper.addNativeEventListener(this.XR_PERMISSION_EVENT_NAME,
                (data: string) => {
                    const dataArray: string[] = data.split(':');
                    if (dataArray[0] === this.XR_PERMISSION_TAG_CHECK) {
                        if (this._checkPermissionMap.has(dataArray[1])) {
                            const res: number = parseInt(dataArray[2]);
                            this._checkPermissionMap.get(dataArray[1])!(res as XRPermissionResult);
                        }
                    } else if (dataArray[0] === this.XR_PERMISSION_TAG_REQUEST) {
                        const results: string[] = dataArray[1].split('&');
                        const resultNames: Array<string> = [];
                        const resultTypes: Array<XRPermissionResult> = [];
                        for (const result of results) {
                            const permissionData: string[] = result.split('#');
                            resultNames.push(permissionData[0]);
                            const resType: number = parseInt(permissionData[1]);
                            resultTypes.push(resType as XRPermissionResult);
                        }
                        if (this._requestPermissionEventListener) {
                            this._requestPermissionEventListener(resultNames, resultTypes);
                        }
                    } else if (dataArray[0] === this.XR_PERMISSION_TAG_AR_CHECK) {
                        if(this._arReadyEventListener) {
                            this._arReadyEventListener();
                        }
                    }
                });
        }
    }
}
