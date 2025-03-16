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

import { Camera, Quat, sys, Vec3 } from 'cc';
import { CameraConfig, FeatureType } from '../../../../../ar/component/framework/utils/ar-defines';
import { arEvent } from '../../../../../ar/component/framework/utils/ar-event';
import { ARFeature } from '../ar-feature-base';
import { ARHandlerCameraDevice } from '../ar-handler-base';

export class ARFeatureCameraDevice extends ARFeature {
    public get featureId (): FeatureType {
        return FeatureType.CameraDevice;
    }

    protected _arCamera: Camera | null = null;
    private _bInited = false;

    init (config: CameraConfig): void {
        super.init(config);

        this._arCamera = config.camera;
        this._bInited = false;

        const handler = this._handler as ARHandlerCameraDevice;
        if (handler) {
            handler.enableCameraAutoFocus(config.autoFocus);
            handler.Camera = this._arCamera;
        } else {
            console.warn('not found camera handler !!!');
        }
    }

    update (): void {
        if (this._arCamera) {
            const handler = this._handler as ARHandlerCameraDevice;
            const pose = handler.getCameraPose();
            this._arCamera.node.setPosition(pose.position);
            this._arCamera.node.setRotation(pose.rotation);

            const cfg = (this.config as CameraConfig);
            if ((!pose.position.equals(Vec3.ZERO) || sys.isBrowser && !pose.rotation.equals(Quat.IDENTITY))
                && !this._bInited && cfg.visibility) {
                this._arCamera.visibility = cfg.visibility;
                this._bInited = true;
                arEvent.dispatchCameraDataInitialized();
            }

            const fov = handler.getCameraFov();
            if (fov !== 0) {
                this._arCamera.fov = fov;
            }
        }
    }
}
