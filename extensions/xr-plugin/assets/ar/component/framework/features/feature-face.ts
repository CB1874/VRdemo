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

import { _decorator, Node, ccenum } from 'cc';
import { FaceTrackingConfig, FeatureType } from '../utils/ar-defines';
import { ARFeatureBase } from './feature-base';

const { ccclass, property } = _decorator;

export enum FaceTrackingMode {
    Singleton,
    Duplication,
    Ordered_Tracking,
}

ccenum(FaceTrackingMode);

export enum FaceTrackingType {
    Position,
    Rotation,
    Position_And_Rotation,
}

ccenum(FaceTrackingType);

@ccclass('cc.ARFeatureFace')
export class ARFeatureFace extends ARFeatureBase {
    @property({ serializable: true })
    protected _trackingMode: FaceTrackingMode = FaceTrackingMode.Singleton;
    @property({ serializable: true })
    protected _faceTrackingType: FaceTrackingType = FaceTrackingType.Position_And_Rotation;
    @property({ serializable: true })
    protected _faceTrackingNode: Node | null = null;
    @property({ serializable: true })
    protected _maxTrackingNumber = 1;
    @property({ serializable: true })
    protected _faceTrackingOrderList: Node [] = [];

    protected _config: FaceTrackingConfig | null = null;

    constructor () {
        super();
        this.type = FeatureType.FaceTracking;
        this.isShowTrackingList = true;
        this.resetConfig();
    }

    @property({
        type: FaceTrackingMode,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.feature.face.trackingMode',
        })
    set trackingMode (val) {
        if (val === this._trackingMode) {
            return;
        }
        this._trackingMode = val;
    }
    get trackingMode () {
        return this._trackingMode;
    }

    @property({
        type: Node,
        displayOrder: 3,
        visible: (function (this: ARFeatureFace) {
            return this.trackingMode === FaceTrackingMode.Singleton;
            }),
        tooltip: 'i18n:xr-plugin.feature.face.faceTrackingNode',
        })
    set faceTrackingNode (val) {
        if (val === this._faceTrackingNode) {
            return;
        }
        this._faceTrackingNode = val;
    }
    get faceTrackingNode () {
        return this._faceTrackingNode;
    }

    @property({
        type: FaceTrackingType,
        displayOrder: 4,
        visible: (function (this: ARFeatureFace) {
            return this.trackingMode === FaceTrackingMode.Singleton;
            }),
        tooltip: 'i18n:xr-plugin.feature.face.faceTrackingType',
        })
    set faceTrackingType (val) {
        if (val === this._faceTrackingType) {
            return;
        }
        this._faceTrackingType = val;
    }
    get faceTrackingType () {
        return this._faceTrackingType;
    }

    @property({
        displayOrder: 5,
        step: 1,
        visible: (function (this: ARFeatureFace) {
            return this.trackingMode === FaceTrackingMode.Duplication;
            }),
        tooltip: 'i18n:xr-plugin.feature.face.maxTrackingNumber',
        })
    set max_Tracking_Number (val) {
        if (val === this._maxTrackingNumber) {
            return;
        }
        this._maxTrackingNumber = val;
    }
    get max_Tracking_Number () {
        return this._maxTrackingNumber;
    }

    @property({
        type: Node,
        displayOrder: 6,
        visible: (function (this: ARFeatureFace) {
            return this.trackingMode === FaceTrackingMode.Ordered_Tracking;
            }),
        tooltip: 'i18n:xr-plugin.feature.face.faceTrackingOrderList',
        })
    set faceTrackingOrderList (val) {
        if (val === this._faceTrackingOrderList) {
            return;
        }
        this._faceTrackingOrderList = val;
    }
    get faceTrackingOrderList () {
        return this._faceTrackingOrderList;
    }
    public resetConfig () {
        super.resetConfig();
        this._config = {
            type: this.type,
            enable: false,
            trackingMode: FaceTrackingMode.Singleton,
            maxFaceNumber: 1,
            trackingNodeList: [],
        };
    }

    public getConfig () {
        let list: Node[] = [];
        if (this.trackingMode === FaceTrackingMode.Singleton && this.faceTrackingNode) {
            list.push(this.faceTrackingNode);
        } else if (this.trackingMode === FaceTrackingMode.Ordered_Tracking) {
            list = this.faceTrackingOrderList.slice(0);
        }
        this._config = {
            type: this.type,
            enable: this.enable,
            trackingMode: this.trackingMode,
            maxFaceNumber: this.max_Tracking_Number,
            trackingNodeList: list,
        };
        return this._config;
    }
}
