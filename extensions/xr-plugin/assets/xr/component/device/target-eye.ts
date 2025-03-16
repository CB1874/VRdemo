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

import { _decorator, Component, ccenum, CameraComponent, renderer } from 'cc';

const { ccclass, help, menu, property, executeInEditMode } = _decorator;

export enum TargetEye_Type {
    BOTH = 0,
    LEFT = 1,
    RIGHT = 2,
}
ccenum(TargetEye_Type);

/**
 * @en
 * Specifies the camera which accepts the render.
 * @zh
 * 指定接受渲染相机的组件。
 */
@ccclass('cc.TargetEye')
@help('i18n:cc.TargetEye')
@menu('XR/Device/TargetEye')
@executeInEditMode
export class TargetEye extends Component {
    @property({ serializable: true })
    protected _targetEye: TargetEye_Type = TargetEye_Type.BOTH;

    @property({
        type: TargetEye_Type,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.target_eye.targetEye'
        })
    set targetEye (val) {
        if (val === this._targetEye) {
            return;
        }
        this._targetEye = val;

        this.setCameraType();
    }
    get targetEye () {
        return this._targetEye;
    }

    setCameraType () {
        const cameraComponent = this.node?.getComponent(CameraComponent);
        if (cameraComponent) {
            switch (this._targetEye) {
            case TargetEye_Type.LEFT:
                cameraComponent.cameraType = renderer.scene.CameraType.LEFT_EYE;
                break;
            case TargetEye_Type.RIGHT:
                cameraComponent.cameraType = renderer.scene.CameraType.RIGHT_EYE;
                break;
            default:
                cameraComponent.cameraType = renderer.scene.CameraType.MAIN;
                break;
            }
        }
    }

    resetCameraType () {
        const cameraComponent = this.node?.getComponent(CameraComponent);
        if (cameraComponent) {
            cameraComponent.cameraType = renderer.scene.CameraType.MAIN;
        }
    }

    public onEnable () {
        this.setCameraType();
    }

    public onDisable () {
        this.resetCameraType();
    }
}
