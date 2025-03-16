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

import { _decorator } from 'cc';
import { EDITOR } from 'cc/env';
import { ARTrackEvent } from '../framework/actions/track-event';
import { ARTrackingBase } from './ar-tracking-base';
import { ActionType, FactorType, ARTrackingType } from '../framework/utils/ar-enum';
import { ARFactorBase } from '../framework/factors/factor-base';
import { ARActionBase } from '../framework/actions/action-base';
import { ARActionData, PlaneFeatureEventParam, ARAnchor, ARPlaneDetectionMode } from '../framework/utils/ar-defines';
import { ARPlaneDirection } from '../framework/factors/plane-direction';
import { ARPlaneSize } from '../framework/factors/plane-size';
import { ARDisplayChildren } from '../framework/actions/display-children';
import { ARSurfaceOverlay } from '../framework/actions/surface-overlay';
import { arEvent } from '../framework/utils/ar-event';
import { ARPlaneSemantic } from '../framework/factors/plane-semantic';
import { ARFaceTrackingContent } from '../framework/factors/face-tracking-content';

const { ccclass, property, help, menu, executeInEditMode } = _decorator;

/**
 * @en
 * AR custom composite trace component base class
 * @zh
 * AR自定义组合追踪组件基类
 */
@ccclass('cc.ARCustomizedTracking')
@help('i18n:cc.ARCustomizedTracking')
@menu('hidden:XR/AR Tracking/ARCustomizedTracking')
@executeInEditMode
export class ARCustomizedTracking extends ARTrackingBase {
    @property({ serializable: true })
    protected _factorType: FactorType  = FactorType.NONE;
    @property({ serializable: true })
    protected _actionType: ActionType = ActionType.NONE;
    @property({ serializable: true })
    protected _factor: ARFactorBase<ARAnchor> | null = null;
    @property({ serializable: true })
    protected _action: ARActionBase<ARActionData> | null = null;

    @property({
        type: ARTrackingType,
        displayOrder: 1,
        readonly: false,
        tooltip: 'i18n:xr-plugin.ar_customized_tracking.trackingType',
        })
    set trackingType (val) {
        if (val === this._trackingType) {
            return;
        }
        this._trackingType = val;
    }
    get trackingType () {
        return this._trackingType;
    }

    @property({
        type: FactorType,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.ar_customized_tracking.factorType',
        })
    set factorType (val) {
        if (val === this._factorType) {
            return;
        }
        this._factorType = val;

        if (this._factorType === FactorType.PLANE_DIRECTION) {
            this.factor = new ARPlaneDirection(this.node.uuid);
        } else if (this._factorType === FactorType.PLANE_SIZE) {
            this.factor = new ARPlaneSize(this.node.uuid);
        } else if (this._factorType === FactorType.PLANE_SEMANTIC) {
            this.factor = new ARPlaneSemantic(this.node.uuid);
        } else if (this._factorType === FactorType.FACE_CONTENT) {
            this.factor = new ARFaceTrackingContent(this.node.uuid);
        } else {
            this.factor = null;
        }
        if (this.factor) {
            this.addFactor(this.factor);
        }
        this.updateFeature(true);
    }
    get factorType () {
        return this._factorType;
    }

    @property({
        displayOrder: 3,
        visible:(function (this: ARCustomizedTracking) {
            return this.factorType !== FactorType.NONE;
            }),
        tooltip: 'i18n:xr-plugin.ar_customized_tracking.factor',
        })
    set factor (val) {
        if (val === this._factor) {
            return;
        }
        this._factor = val;
    }
    get factor () {
        return this._factor;
    }

    @property({
        type: ActionType,
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.ar_customized_tracking.actionType',
        })
    set actionType (val) {
        if (val === this._actionType) {
            return;
        }
        this._actionType = val;

        if (this._actionType === ActionType.DISPLAY_CHILDREN) {
            this.action = new ARDisplayChildren();
        } else if (this._actionType === ActionType.TRACK_EVENT) {
            this.action = new ARTrackEvent();
        } else if (this._actionType === ActionType.SURFACE_OVERLAY) {
            this.action = new ARSurfaceOverlay();
        } else {
            this.action = null;
        }
        if (this.action) {
            this.addAction(this.action);
        }
        this.updateFeature(true);
    }
    get actionType () {
        return this._actionType;
    }

    @property({
        displayOrder: 5,
        visible:(function (this: ARCustomizedTracking) {
            return this._actionType !== ActionType.NONE;
            }),
        tooltip: 'i18n:xr-plugin.ar_customized_tracking.action',
        })
    set action (val) {
        if (val === this._action) {
            return;
        }
        this._action = val;
    }
    get action () {
        return this._action;
    }

    onLoad () {
        this.initialized = true;
        if (!EDITOR) {
            const c = this.node.children;
            c.forEach((element) => {
                element.active = false;
            });
        }
    }

    updateFeature (canUse: boolean) {
        if (this._actionType === ActionType.NONE || this._factorType === FactorType.NONE) {
            canUse = false;
        }
        let direction = ARPlaneDetectionMode.All;
        if (this._factor && this._factor.type === FactorType.PLANE_DIRECTION) {
            direction = (this._factor as ARPlaneDirection).directionType;
        }

        const param: PlaneFeatureEventParam = {
            ft: this.trackingType,
            uuid: this.node.uuid,
            canUse,
            tracking: this,
            direction,
        };
        arEvent.collectFeature(param);
    }
}
