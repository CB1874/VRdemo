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

import { _decorator, Vec3, Prefab, Mat4, Quat } from 'cc';
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
import { ARActionData } from '../utils/ar-defines';
import { ActionType } from '../utils/ar-enum';
import { ARActionUpdateBase } from './action-base';

const { ccclass, property } = _decorator;

/**
 * @en
 * AR surface overlay behavior class
 * @zh
 * AR表面覆盖的行为类
 */
@ccclass('cc.ARSurfaceOverlay')
export class ARSurfaceOverlay extends ARActionUpdateBase {
    @property({ serializable: true })
    protected _surfaceOffset = new Vec3(0, 0, 0);
    @property({ serializable: true })
    protected _replaceVisualizer: Prefab | null = null;

    constructor () {
        super();
        this.type = ActionType.SURFACE_OVERLAY;
        this.priority = 1;
    }

    @property({
        type: Vec3,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.action.surface_overlay.surfaceOffset',
        })
    set surfaceOffset (val) {
        if (val === this._surfaceOffset) {
            return;
        }
        this._surfaceOffset = val;
    }
    get surfaceOffset () {
        return this._surfaceOffset;
    }

    @property({
        type: Prefab,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.action.surface_overlay.replaceVisualizer',
        })
    set replaceVisualizer (val) {
        if (val === this._replaceVisualizer) {
            return;
        }
        this._replaceVisualizer = val;
    }
    get replaceVisualizer () {
        return this._replaceVisualizer;
    }

    /**
    * @en run The action
    * @zh 执行行为
    */
    public runAction (data: ARActionData) {
        if (!data.trackingNode) {
            return;
        }
        const trackingBase = data.trackingNode.getComponent(ARTrackingBase);
        if (this.getActivated(trackingBase?.trackingType)) {
            return;
        }

        data.replaceVisualizer = this._replaceVisualizer;
        this._updateAction(data);

        this.setActivated(true);
    }

    private _addOffset (rot: Quat, pos: Vec3) {
        const mat4 = new Mat4();
        Mat4.fromRT(mat4, rot, pos);
        const out = new Vec3();
        Vec3.transformMat4(out, this._surfaceOffset, mat4);
        return out;
    }

    private _updateAction (data: ARActionData) {
        data.pose.position.set(this._addOffset(data.pose.rotation, data.pose.position));
        if (data.trackablePose) {
            data.trackablePose.position.set(this._addOffset(data.trackablePose.rotation, data.trackablePose.position));
        }
    }

    /**
    * @en update The action
    * @zh 刷新行为
    */
    public updateAction (data: ARActionData) {
        if (!data.closeTracking) {
            this._updateAction(data);
        }
    }

    public reset () {
        this.setActivated(false);
        this.surfaceOffset = new Vec3(0, 0, 0);
        this.replaceVisualizer = null;
    }
}
