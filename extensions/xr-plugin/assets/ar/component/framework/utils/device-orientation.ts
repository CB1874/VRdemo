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

import { math, Vec3, _decorator } from 'cc';
import { arEvent, ARInternalEventType } from './ar-event';

export interface DeviceOrientationInputEvent {
    euler: math.Vec3;
    absolute: boolean;
}

const { ccclass } = _decorator;

@ccclass('cc.DeviceOrientationInputSource')
export default class DeviceOrientationInputSource {
    private static instance: DeviceOrientationInputSource | null = null;
    static get Instance (): DeviceOrientationInputSource {
        if (!DeviceOrientationInputSource.instance) {
            DeviceOrientationInputSource.instance = new DeviceOrientationInputSource();
        }
        return DeviceOrientationInputSource.instance;
    }
    private _granted = false;
    private _intervalInMileSeconds = 16.6667;
    private _accelTimer = 0;
    private _firstData: Vec3 | null = null;
    private _didAccelerateFunc: (event: DeviceOrientationEvent) => void;

    constructor () {
        this._didAccelerateFunc = this._didAccelerate.bind(this);
    }

    private _registerEvent () {
        this._accelTimer = performance.now();
        window.addEventListener('deviceorientation', this._didAccelerateFunc, false);
    }

    private _unregisterEvent () {
        this._accelTimer = 0;
        window.removeEventListener('deviceorientation', this._didAccelerateFunc, false);
    }

    private _didAccelerate (event: DeviceOrientationEvent) {
        const now = performance.now();
        if (now - this._accelTimer < this._intervalInMileSeconds) {
            return;
        }
        this._accelTimer = now;

        const x = event.beta || 0;
        const y = event.gamma || 0;
        const z = event.alpha || 0;
        if (!this._firstData) {
            this._firstData = new Vec3(x, y, z);
        }
        const inputEvent: DeviceOrientationInputEvent = {
            euler: new Vec3(x, y, z),
            absolute: event.absolute || false,
        };
        arEvent.dispatch(ARInternalEventType.DEVICE_ORIENTATION_EVENT, inputEvent);
    }

    public get granted () {
        return this._granted;
    }

    public get initEulerData () {
        return this._firstData;
    }

    public start () {
        return new Promise<boolean>((resolve, reject) => {
            if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then((response) => {
                    //'granted', 'denied' or 'prompt'
                    if (response === 'granted') {
                        this._granted = true;
                        this._registerEvent();
                        resolve(true);
                    }
                    reject();
                }).catch((e) => reject());
            } else {
                this._granted = true;
                this._registerEvent();
                resolve(true);
            }
        })
            .catch(() => false);
    }

    public stop () {
        this._granted = false;
        this._firstData = null;
        this._unregisterEvent();
    }

    public setInterval (intervalInMileSeconds: number) {
        this._intervalInMileSeconds = intervalInMileSeconds;
    }
}
