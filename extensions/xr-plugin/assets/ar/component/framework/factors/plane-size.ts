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

import { _decorator, Vec2 } from 'cc';
import { ARPlane } from '../utils/ar-defines';
import { FactorType } from '../utils/ar-enum';
import { ARFactorBase } from './factor-base';

const { ccclass, property } = _decorator;

@ccclass('cc.ARPlaneSize')
export class ARPlaneSize extends ARFactorBase<ARPlane> {
    @property({ serializable: true })
    protected _useMinSize = true;
    @property({ serializable: true })
    protected _useMaxSize = false;
    @property({ serializable: true })
    protected _minSize: Vec2 = new Vec2(0.5, 0.5);
    @property({ serializable: true })
    protected _maxSize: Vec2 = new Vec2(1.5, 1.5);

    constructor (uuid: string) {
        super();
        this.uuid = uuid;
        this.type = FactorType.PLANE_SIZE;
    }

    @property({
        displayOrder: 1,
        group: {name:'Minimum Size'},
        tooltip: 'i18n:xr-plugin.factor.plane_size.useMinSize',
        })
    set useMinSize (val) {
        if (val === this._useMinSize) {
            return;
        }
        this._useMinSize = val;
        this.updateListener(val);
    }
    get useMinSize () {
        return this._useMinSize;
    }

    @property({
        displayOrder: 2,
        group: {name:'Minimum Size'},
        tooltip: 'i18n:xr-plugin.factor.plane_size.minSize',
        })
    set minSize (val) {
        if (val === this._minSize) {
            return;
        }
        if (val.x > this.maxSize.x) {
            val.x = this.maxSize.x;
        }
        if (val.y > this.maxSize.y) {
            val.y = this.maxSize.y;
        }
        this._minSize = val;
        this.updateListener(val);
    }
    get minSize () {
        return this._minSize;
    }

    @property({
        displayOrder: 3,
        group: {name:'Maximum Size'},
        tooltip: 'i18n:xr-plugin.factor.plane_size.useMaxSize',
        })
    set useMaxSize (val) {
        if (val === this._useMaxSize) {
            return;
        }
        this._useMaxSize = val;
        this.updateListener(null);
    }
    get useMaxSize () {
        return this._useMaxSize;
    }

    @property({
        displayOrder: 4,
        group: {name:'Maximum Size'},
        tooltip: 'i18n:xr-plugin.factor.plane_size.maxSize',
        })
    set maxSize (val) {
        if (val === this._maxSize) {
            return;
        }
        if (val.x < this.minSize.x) {
            val.x = this.minSize.x;
        }
        if (val.y < this.minSize.y) {
            val.y = this.minSize.y;
        }
        this._maxSize = val;
        this.updateListener(val);
    }
    get maxSize () {
        return this._maxSize;
    }

    get PlaneSize () {
        if (this.useMinSize && !this.useMaxSize) {
            return [this.minSize.x, this.minSize.y];
        }
        if (!this.useMinSize && this.useMaxSize) {
            return [this.maxSize.x, this.maxSize.y];
        }
        if (this.useMinSize && this.useMaxSize) {
            return [(this.minSize.x + this.maxSize.x) / 2, (this.minSize.y + this.maxSize.y) / 2];
        }
        return [0, 0];
    }

    public match (trackable: ARPlane): boolean {
        if (!this.useMinSize && !this.useMaxSize) return true;
        if (this.useMinSize && !this.useMaxSize && trackable.extent) {
            return trackable.extent.x > this.minSize.x && trackable.extent.y > this.minSize.y;
        }

        if (!this.useMinSize && this.useMaxSize && trackable.extent) {
            return trackable.extent.x < this.maxSize.x && trackable.extent.y < this.maxSize.y;
        }

        if (this.useMinSize && this.useMaxSize && trackable.extent) {
            return trackable.extent.x > this.minSize.x && trackable.extent.y > this.minSize.y
            && trackable.extent.x < this.maxSize.x && trackable.extent.y < this.maxSize.y;
        }

        return false;
    }

    public reset () {
        this.useMinSize = true;
        this.useMaxSize = false;
        this.minSize = new Vec2(0.5, 0.5);
        this.maxSize = new Vec2(1.5, 1.5);
    }
}
