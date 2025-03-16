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

import { _decorator, Prefab, assetManager } from 'cc';
import { EDITOR } from 'cc/env';
import { ARPlaneTracking } from '../../tracking/ar-plane-tracking';
import { ARPlaneDetectionMode, FeatureType, PlaneDetectionConfig, PlaneFeatureEventParam, TrackingQuality } from '../utils/ar-defines';
import { ARFeatureBase } from './feature-base';

const { ccclass, property } = _decorator;

@ccclass('cc.ARFeaturePlane')
export class ARFeaturePlane extends ARFeatureBase {
    @property({ serializable: true })
    protected _directionType = 'All';
    @property({ serializable: true })
    protected _trackingVisualizer: Prefab | null = null;
    @property({ serializable: true, visible: false })
    protected _directionValue: number = ARPlaneDetectionMode.All;
    @property({ serializable: true })
    protected _trackingQualityCondition: TrackingQuality = TrackingQuality.Poor_Quality;
    @property({serializable: true})
    protected _usePlaneShape = true;

    protected _config: PlaneDetectionConfig | null = null;

    constructor () {
        super();
        this.type = FeatureType.PlaneDetection;
        this.isShowTrackingList = true;
        this.resetConfig();
    }

    @property({
        displayOrder: 3,
        readonly: true,
        tooltip: 'i18n:xr-plugin.feature.plane.direction_Type',
        })
    set direction_Type (val) {
        if (val === this._directionType) {
            return;
        }
        this._directionType = val;
    }
    get direction_Type () {
        return this._directionType;
    }

    @property({
        type: Prefab,
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.feature.plane.trackingVisualizer',
        })
    set trackingVisualizer (val) {
        if (val === this._trackingVisualizer) {
            return;
        }
        this._trackingVisualizer = val;

        this._trackingList.forEach((node) => {
            if (this._trackingVisualizer) {
                (node as ARPlaneTracking).createScenePlane(this._trackingVisualizer);
            } else {
                (node as ARPlaneTracking).removeScenePlane();
            }
        });
    }
    get trackingVisualizer () {
        return this._trackingVisualizer;
    }

    @property({
        type: TrackingQuality,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.feature.plane.trackingQualityCondition',
        })
    set trackingQualityCondition (val) {
        if (val === this._trackingQualityCondition) {
            return;
        }
        this._trackingQualityCondition = val;
    }
    get trackingQualityCondition () {
        return this._trackingQualityCondition;
    }

    @property({
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.feature.plane.usePlaneShape',
        })
    set usePlaneShape (val) {
        if (val === this._usePlaneShape) {
            return;
        }
        this._usePlaneShape = val;
    }
    get usePlaneShape () {
        return this._usePlaneShape;
    }

    public resetConfig () {
        super.resetConfig();
        this._config = {
            type: this.type,
            enable: false,
            direction: ARPlaneDetectionMode.All,
            planePrefab: null,
            trackingQualityCondition: TrackingQuality.Poor_Quality,
            usePlaneShape: true,
            enableNativeFallBack: false,
        };
    }

    public getConfig () {
        this._config = {
            type: this.type,
            enable: this._enable,
            direction: this._directionValue,
            planePrefab: this._trackingVisualizer,
            trackingQualityCondition: this._trackingQualityCondition,
            usePlaneShape: this._usePlaneShape,
            enableNativeFallBack: this.getNativeFallBack(),
            enableWebFallBack: this.getWebFallBack(),
        };
        return this._config;
    }

    public updateFeature (event: PlaneFeatureEventParam) {
        super.updateFeature(event);

        let tmpValue = 0;
        for (const key in this._features) {
            if (Object.prototype.hasOwnProperty.call(this._features, key)) {
                const element = this._features[key];
                tmpValue |= element.direction;
            }
        }
        let temp = '';
        if ((tmpValue & ARPlaneDetectionMode.Horizontal_Upward) === ARPlaneDetectionMode.Horizontal_Upward) {
            temp += ARPlaneDetectionMode[ARPlaneDetectionMode.Horizontal_Upward];
        }
        if ((tmpValue & ARPlaneDetectionMode.Horizontal_Downward) === ARPlaneDetectionMode.Horizontal_Downward) {
            if (temp.length > 0) {
                temp += '|';
            }
            temp += ARPlaneDetectionMode[ARPlaneDetectionMode.Horizontal_Downward];
        }
        if ((tmpValue & ARPlaneDetectionMode.Vertical) === ARPlaneDetectionMode.Vertical) {
            if (temp.length > 0) {
                temp += '|';
            }
            temp += ARPlaneDetectionMode[ARPlaneDetectionMode.Vertical];
        }
        if ((tmpValue & ARPlaneDetectionMode.All) === ARPlaneDetectionMode.All) {
            temp = ARPlaneDetectionMode[ARPlaneDetectionMode.All];
        }
        this._directionValue = tmpValue;
        this.direction_Type = temp;

        if (!this.canUse) {
            this._trackingVisualizer = null;
        } else if (EDITOR && !this._trackingVisualizer) {
            assetManager.loadAny({ uuid: 'fcd70a72-6a5a-471f-b889-4ae2d7876e0e' }, (err, assets) => {
                this._trackingVisualizer = assets;
            });
        }
    }
}
