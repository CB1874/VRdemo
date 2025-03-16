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

import { Camera, Vec3, Quat } from 'cc';
import { ARHandlerCameraDevice } from '../../ar-base/ar-handler-base';
import { WebXRDevice } from '../webxr-device';
import { ARPose } from '../../../../../ar/component/framework/utils/ar-defines';

export class ARWebXRHandlerCameraDevice extends ARHandlerCameraDevice {
    set Camera (val: Camera | null) {
        this._camera = val;
        const webXR = (this._device as WebXRDevice).WebXRObj;
        if (webXR) {
            webXR.Camera = val;
        }
    }

    public enableCameraAutoFocus (enable: boolean) {

    }
    public canUseCamera (): boolean {
        return true;
    }
    public attachFeatureSessionInit (): Promise<XRSessionInit> {
        return Promise.resolve({});
    }

    public getCameraPose (): ARPose {
        if (!(this._device as WebXRDevice).WebXRObj) {
            return {
                position: new Vec3(0, 0, 0),
                rotation: new Quat(0, 0, 0, 1),
            };
        }

        const pose = (this._device as WebXRDevice).WebXRObj?.getCameraPose();
        if (pose) {
            return {
                position: new Vec3(
                    pose[0],
                    pose[1],
                    pose[2],
                ),
                rotation: new Quat(
                    pose[3],
                    pose[4],
                    pose[5],
                    pose[6],
                ),
            };
        }
        return {
            position: new Vec3(0, 0, 0),
            rotation: new Quat(0, 0, 0, 1),
        };
    }

    public getCameraFov (): number {
        if ((this._device as WebXRDevice).getSessionMode() === 'immersive-vr') {
            return 0;
        }

        const matArr = (this._device as WebXRDevice).WebXRObj?.getCameraProjectionMatrix();
        if (matArr) {
            const fov = 2 * Math.atan(1 / matArr[5]) * 180 / Math.PI;
            return fov;
        }
        return 0;
    }

    public update () {
        if (!this._feature || !this._feature.config?.enable) {
            return;
        }

        this._feature.update();
    }
}
