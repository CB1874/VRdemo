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

import { Camera, Vec3, Quat, settings, Settings } from 'cc';
import { ARHandlerCameraDevice } from '../../ar-base/ar-handler-base';
import { ARPose } from '../../../../../ar/component/framework/utils/ar-defines';
import { MindARDevice } from '../mindar-device';
import { arEvent, ARInternalEventType } from '../../../../../ar/component/framework/utils/ar-event';
import DeviceOrientationInputSource, { DeviceOrientationInputEvent } from '../../../../../ar/component/framework/utils/device-orientation';

enum ScreenOrientation {
    VERTICAL = 0,
    LEFT_LANDSCAPE = 1,
    RIGHT_LANDSCAPE = 2,
}

export class ARWebARHandlerCameraDevice extends ARHandlerCameraDevice {
    private _isReading = false;
    private _tmpRot: Quat = new Quat();
    private _rotation: Quat = new Quat();
    private _initZRadian = 0;
    private _initRotFlag = false;
    private _orientation: ScreenOrientation = ScreenOrientation.VERTICAL;
    private _initOrientation: ScreenOrientation = ScreenOrientation.VERTICAL;
    private _initOrienFlag = false;
    private _invQuat: Quat = new Quat();
    private _tmpVec3: Vec3 = new Vec3();
    private _change = true;
    private _settingOrientation: string | null = null;

    set Camera (val: Camera | null) {
        this._camera = val;
        const webAR = (this._device as MindARDevice).WebARObj;
        if (webAR) {
            webAR.Camera = val;
        }
    }

    public enableCameraAutoFocus (enable: boolean) {

    }

    public canUseCamera (): boolean {
        return this._isReading;
    }

    private getOrientation () {
        switch (window.orientation) {
        case -90:
            // 左横屏
            this._orientation = ScreenOrientation.LEFT_LANDSCAPE;
            break;
        case 90:
            // 右横屏
            this._orientation = ScreenOrientation.RIGHT_LANDSCAPE;
            break;
        case 0:
        case 180:
            // 竖屏
            this._orientation = ScreenOrientation.VERTICAL;
            break;
        default:
            break;
        }

        if (!this._initOrienFlag) {
            this._initOrientation = this._orientation;

            this._initOrienFlag = true;
        }
    }

    private onDeviceOrientationEvent (event: DeviceOrientationInputEvent) {
        if (!this._isReading) {
            this._isReading = true;
        }

        const deg2Radian = Math.PI / 180.0;
        // beta [-180 180)
        const x = event.euler.x * deg2Radian * 0.5;
        // gamma [-90 90)
        const y = event.euler.y * deg2Radian * 0.5;
        // alpha [0 360)
        const z = event.euler.z * deg2Radian * 0.5;

        const cX = Math.cos(x);
        const cY = Math.cos(y);
        const cZ = Math.cos(z);
        const sX = Math.sin(x);
        const sY = Math.sin(y);
        const sZ = Math.sin(z);
        // engine Quat.fromEuler is use YZX
        // ZXY avoid gimbal lock
        const qw = cX * cY * cZ - sX * sY * sZ;
        const qx = sX * cY * cZ - cX * sY * sZ;
        const qy = cX * sY * cZ + sX * cY * sZ;
        const qz = cX * cY * sZ + sX * sY * cZ;
        this._tmpRot = new Quat(qx, qy, qz, qw);

        if (!this._initRotFlag) {
            const initEuler = DeviceOrientationInputSource.Instance.initEulerData;
            let z = event.euler.z;
            if (initEuler) {
                z -= initEuler.z;
            }
            this._initZRadian = z * deg2Radian;
            this._initRotFlag = true;
        }

        this.adaptDeviceOrientation(this._tmpRot, event.absolute);

        // 当屏幕旋转时
        if (this._change && this._settingOrientation === 'auto') {
            this._change = false;
            Quat.toEuler(this._tmpVec3, this._tmpRot);
            Quat.fromEuler(this._tmpRot, 0, this._tmpVec3.y, 0);
            Quat.invert(this._invQuat, this._tmpRot);
        }
        Quat.multiply(this._tmpRot, this._invQuat, this._tmpRot);

        this._rotation = this._tmpRot;
    }

    private adaptDeviceOrientation (rot: Quat, isAbsolute: boolean) {
        let temp: number;
        if (this._initOrientation === ScreenOrientation.LEFT_LANDSCAPE) {
            // init upside right
            temp = -rot.x;
            rot.x = rot.y;
            rot.y = temp;
        } else if (this._initOrientation === ScreenOrientation.RIGHT_LANDSCAPE) {
            // init upside left
            temp = rot.x;
            rot.x = -rot.y;
            rot.y = temp;
        }

        Quat.rotateX(rot, rot, -Math.PI * 0.5);
        // // device relative orientation coordinate is
        // // y -> horizontal forward(device upside)
        // // z -> vertical up(device screen out)
        temp = -rot.y;
        rot.y = rot.z;
        rot.z = temp;

        if (this._initOrientation === ScreenOrientation.VERTICAL) {
            if (isAbsolute) {
                Quat.rotateAround(rot, rot, Vec3.UP, -this._initZRadian);
            }
            if (this._settingOrientation !== 'portrait') {
                if (this._orientation === ScreenOrientation.LEFT_LANDSCAPE) {
                    // upside right
                    Quat.rotateZ(rot, rot, Math.PI * 0.5);
                } else if (this._orientation === ScreenOrientation.RIGHT_LANDSCAPE) {
                    // upside left
                    Quat.rotateZ(rot, rot, -Math.PI * 0.5);
                } else if (this._settingOrientation === 'landscape') {
                    Quat.rotateZ(rot, rot, -Math.PI * 0.5);
                }
            } else if (this._orientation === ScreenOrientation.RIGHT_LANDSCAPE) {
                Quat.rotateZ(rot, rot, Math.PI);
            }
        } else {
            Quat.rotateAround(rot, rot, Vec3.UP, -this._initZRadian);

            if (this._orientation === ScreenOrientation.VERTICAL) {
                if (this._initOrientation === ScreenOrientation.LEFT_LANDSCAPE) {
                    // init upside right
                    if (this._settingOrientation !== 'landscape') {
                        Quat.rotateZ(rot, rot, -Math.PI * 0.5);
                    } else {
                        Quat.rotateZ(rot, rot, Math.PI);
                    }
                } else if (this._settingOrientation !== 'landscape') {
                    // init upside left
                    Quat.rotateZ(rot, rot, Math.PI * 0.5);
                }
            } else if (this._initOrientation !== this._orientation) {
                // initOrientation: left, orientation: right, or
                // initOrientation: right, orientation: left
                if (this._settingOrientation !== 'portrait') {
                    Quat.rotateZ(rot, rot, Math.PI);
                } else {
                    Quat.rotateZ(rot, rot, Math.PI * 0.5);
                }
            } else if (this._initOrientation === this._orientation && this._settingOrientation === 'portrait') {
                // initOrientation == orientation == left/right
                Quat.rotateZ(rot, rot, -Math.PI * 0.5);
            }
        }
    }

    public start (video: HTMLVideoElement | null) {
        arEvent.on(ARInternalEventType.DEVICE_ORIENTATION_EVENT, this.onDeviceOrientationEvent, this);

        window.addEventListener('orientationchange', () => {
            this.getOrientation();
            this._change = true;
        });
        this.getOrientation();

        this._settingOrientation = settings.querySettings(Settings.Category.SCREEN, 'orientation');
    }

    public stop () {
        arEvent.off(ARInternalEventType.DEVICE_ORIENTATION_EVENT, this.onDeviceOrientationEvent, this);
    }

    public getCameraPose (): ARPose {
        if (!this._isReading) {
            return {
                position: new Vec3(),
                rotation: new Quat(),
            };
        }
        return {
            position: new Vec3(),
            rotation: this._rotation,
        };
    }

    public getCameraFov (): number {
        const webAR = (this._device as MindARDevice).WebARObj;
        if (webAR) {
            return webAR.getCameraFov();
        }

        return 45;
    }

    public update () {
        if (!this._feature || !this._feature.config?.enable) {
            return;
        }
        this._feature.update();
    }
}
