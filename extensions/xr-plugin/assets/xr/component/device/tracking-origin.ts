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

import { Component, _decorator, Node, sys, Vec3, ccenum } from 'cc';
import { xrInterface } from '../interface/xr-interface';

const { ccclass, help, menu, property } = _decorator;

export enum TrackingOriginMode_Type {
    Unbond = 0,
    Device = 1,
    Floor = 2
}
ccenum(TrackingOriginMode_Type);

/**
 * @en
 * The agent of tracking origin.
 * @zh
 * 追踪原点代理组件。
 */
@ccclass('cc.TrackingOrigin')
@help('i18n:cc.TrackingOrigin')
@menu('XR/Device/TrackingOrigin')
export class TrackingOrigin extends Component {
    @property({ serializable: true })
    protected _offsetObject: Node | null = null;
    @property({ serializable: true })
    protected _trackingOriginMode: TrackingOriginMode_Type = TrackingOriginMode_Type.Unbond;
    @property({ serializable: true })
    protected _yOffsetValue = 1.36144;

    @property({
        type: Node,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.tracking_origin.offsetObject'
        })
    set offsetObject (val) {
        if (val === this._offsetObject) {
            return;
        }
        this._setYOffset(0);
        this._offsetObject = val;
        this._setYOffset(this._yOffsetValue);
    }
    get offsetObject () {
        return this._offsetObject;
    }

    @property({
        type: TrackingOriginMode_Type,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.tracking_origin.trackingOriginMode'
        })
    set trackingOriginMode (val) {
        if (val === this._trackingOriginMode) {
            return;
        }
        this._trackingOriginMode = val;
        if (this._trackingOriginMode === TrackingOriginMode_Type.Floor) {
            this._setYOffset(0);
        } else {
            this._setYOffset(this._yOffsetValue);
        }
    }
    get trackingOriginMode () {
        return this._trackingOriginMode;
    }

    @property({
        displayOrder: 3,
        visible: (function (this: TrackingOrigin) {
            return this._trackingOriginMode !== TrackingOriginMode_Type.Floor;
            }),
        tooltip: 'i18n:xr-plugin.tracking_origin.trackingOriginMode'
        })
    set yOffsetValue (val) {
        if (val === this._yOffsetValue) {
            return;
        }
        this._yOffsetValue = val;
        this._setYOffset(this._yOffsetValue);
    }
    get yOffsetValue () {
        return this._yOffsetValue;
    }

    private _setYOffset (value) {
        if (this._offsetObject) {
            this._offsetObject.position.set(this._offsetObject.position.x, value, this._offsetObject.position.z);
        }
    }

    public resetOffset () {
        this._yOffsetValue = 0;
        if (this._offsetObject) {
            this._offsetObject.position = new Vec3(0, 0, 0);
            this._offsetObject.eulerAngles = new Vec3(0, 0, 0);
            this._offsetObject.scale = new Vec3(1, 1, 1);
        }
    }

    onEnable () {
        if (sys.isXR) {
            xrInterface.setBaseSpaceType(this.trackingOriginMode);
        }
    }
}
