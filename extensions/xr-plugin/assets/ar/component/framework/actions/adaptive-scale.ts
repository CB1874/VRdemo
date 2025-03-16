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

import { CCFloat, _decorator, Node, Quat, ccenum } from 'cc';
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
import { ARActionData } from '../utils/ar-defines';
import { ActionType } from '../utils/ar-enum';
import { ARActionUpdateBase } from './action-base';

const { ccclass, property } = _decorator;

enum PlaneStretchType {
    Uniform = 0,
    NonUniform = 1,
    AlignLongSideToX = 2
}

enum VerticalStretchType {
    None = 0,
    Minimum = 1,
    Average = 2
}

ccenum(PlaneStretchType);
ccenum(VerticalStretchType);

/**
 * @en
 * AR adaptive scaling behavior class
 * @zh
 * AR自适应缩放的行为类
 */
@ccclass('cc.ARAdaptiveScale')
export class ARAdaptiveScale extends ARActionUpdateBase {
    @property({ serializable: true })
    protected _maxScale = 2.0;

    private _planeStretch: PlaneStretchType = PlaneStretchType.Uniform;
    private _verticalStretch: VerticalStretchType = VerticalStretchType.Minimum;

    constructor () {
        super();
        this.type = ActionType.ADAPTIVE_SCALE;
    }

    set planeStretch (val) {
        if (val === this._planeStretch) {
            return;
        }
        this._planeStretch = val;
    }
    get planeStretch () {
        return this._planeStretch;
    }

    set verticalStretch (val) {
        if (val === this._verticalStretch) {
            return;
        }
        this._verticalStretch = val;
    }
    get verticalStretch () {
        return this._verticalStretch;
    }

    @property({
        type: CCFloat,
        displayOrder: 3,
        slide: true,
        range: [1.0, 10.0, 0.1],
        tooltip: 'i18n:xr-plugin.action.adaptive_scale.maxScale',
        })
    set maxScale (val) {
        if (val === this._maxScale) {
            return;
        }
        this._maxScale = val;
    }
    get maxScale () {
        return this._maxScale;
    }

    @property({
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.action.adaptive_scale.matchTrackingUpdate'
        })
    set matchTrackingUpdate (val) {
        if (val === this._matchTrackingUpdate) {
            return;
        }
        this._matchTrackingUpdate = val;
    }
    get matchTrackingUpdate () {
        return this._matchTrackingUpdate;
    }

    private static ROTATE_QUARTER: Quat = Quat.fromEuler(new Quat(), 0, 90, 0);
    private _trackableChildNode: Node | null = null;

    private _updateAction (data: ARActionData) {
        if (!this._trackableChildNode) {
            return;
        }

        const extent = data.extent;
        if (!extent) {
            return;
        }
        const smallestBounds = Math.min(extent.x, extent.y);
        const newScale = this._trackableChildNode.scale.clone();
        const newPose = this._trackableChildNode.worldRotation.clone();
        // 平面拉伸
        switch (this._planeStretch) {
        case PlaneStretchType.Uniform:
            newScale.x = smallestBounds;
            newScale.z = smallestBounds;
            break;
        case PlaneStretchType.NonUniform:
            newScale.x = extent.x;
            newScale.z = extent.y;
            break;
        case PlaneStretchType.AlignLongSideToX:
            if (extent.x < extent.y) {
                Quat.multiply(newPose, newPose, ARAdaptiveScale.ROTATE_QUARTER);
                newScale.x = extent.y;
                newScale.z = extent.x;
            } else {
                newScale.x = extent.x;
                newScale.z = extent.y;
            }
            break;
        default:
            break;
        }

        // 竖直拉伸
        switch (this._verticalStretch) {
        case VerticalStretchType.Minimum:
            newScale.y = smallestBounds;
            break;
        case VerticalStretchType.Average:
            newScale.y = (extent.x + extent.y) * 0.5;
            break;
        default:
            break;
        }

        newScale.x = Math.min(newScale.x, this._maxScale);
        newScale.y = Math.min(newScale.y, this._maxScale);
        newScale.z = Math.min(newScale.z, this._maxScale);

        this._trackableChildNode.setScale(newScale);
        if (this._planeStretch === PlaneStretchType.AlignLongSideToX) {
            this._trackableChildNode.setWorldRotation(newPose);
        }
    }

    /**
    * @en run The action
    * @zh 执行行为
    */
    public runAction (data: ARActionData) {
        if (!data.trackableNode || !data.trackingNode || !data.trackableChildNode) {
            return;
        }
        const trackingBase = data.trackingNode.getComponent(ARTrackingBase);
        if (this.getActivated(trackingBase?.trackingType)) {
            return;
        }
        this._trackableChildNode = data.trackableChildNode;

        this._updateAction(data);
        this.setActivated(true);
    }

    /**
    * @en update The action
    * @zh 刷新行为
    */
    public updateAction (data: ARActionData) {
        if (this._matchTrackingUpdate) {
            this._updateAction(data);
        }
    }

    public reset () {
        this.planeStretch = PlaneStretchType.Uniform;
        this.verticalStretch = VerticalStretchType.Minimum;
        this.maxScale = 2.0;
        this.matchTrackingUpdate = true;

        this.setActivated(false);
        this._trackableChildNode = null;
    }
}
