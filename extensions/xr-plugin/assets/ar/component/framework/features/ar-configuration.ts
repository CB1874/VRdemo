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
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
// eslint-disable-next-line max-len
import { ARFeatureData, CameraFeatureEventParam, FeatureEventParam, ImageFeatureEventParam, LightingFeatureEventParam, MeshFeatureEventParam, PlaneFeatureEventParam } from '../utils/ar-defines';
import { ARTrackingType } from '../utils/ar-enum';
import { arEvent, AREventType, ARInternalEventType } from '../utils/ar-event';
import { ARFeatureAnchor } from './feature-anchor';
import { ARFeatureCamera } from './feature-camera';
import { ARFeatureFace } from './feature-face';
import { ARFeatureImage } from './feature-image';
import { ARFeatureLighting } from './feature-lighting';
import { ARFeaturePlane } from './feature-plane';
import { ARFeatureWorldMesh } from './feature-world-mesh';

const { ccclass, property } = _decorator;

@ccclass('cc.ARConfiguration')
export class ARConfiguration {
    @property({ serializable: true, visible:false })
    protected _cameraFeature: ARFeatureCamera = new ARFeatureCamera();

    @property({ serializable: true, visible:false })
    protected _lightingFeature: ARFeatureLighting = new ARFeatureLighting();

    @property({ serializable: true })
    protected _anchorFeature: ARFeatureAnchor = new ARFeatureAnchor();

    @property({ serializable: true })
    protected _planeFeature: ARFeaturePlane = new ARFeaturePlane();

    @property({ serializable: true })
    protected _meshingFeature: ARFeatureWorldMesh = new ARFeatureWorldMesh();

    @property({ serializable: true })
    protected _imageFeature: ARFeatureImage = new ARFeatureImage();

    @property({ serializable: true })
    protected _faceFeature: ARFeatureFace = new ARFeatureFace();

    private _trackings: ARTrackingBase[] = [];

    @property({
        displayOrder: 1,
        visible: (function (this: ARConfiguration) {
            return this._planeFeature.canUse === true;
            })
        })
    set planeFeature (val) {
        if (val === this._planeFeature) {
            return;
        }
        this._planeFeature = val;
    }
    get planeFeature () {
        return this._planeFeature;
    }

    @property({
        displayOrder: 2,
        visible: (function (this: ARConfiguration) {
            return this._meshingFeature.canUse === true;
            })
        })
    set meshingFeature (val) {
        if (val === this._meshingFeature) {
            return;
        }
        this._meshingFeature = val;
    }
    get meshingFeature () {
        return this._meshingFeature;
    }

    @property({
        displayOrder: 3,
        visible: (function (this: ARConfiguration) {
            return this._imageFeature.canUse === true;
            })
        })
    set imageFeature (val) {
        if (val === this._imageFeature) {
            return;
        }
        this._imageFeature = val;
    }
    get imageFeature () {
        return this._imageFeature;
    }

    @property({
        displayOrder: 3,
        visible: (function (this: ARConfiguration) {
            return this._faceFeature.canUse === true;
            })
        })
    set faceFeature (val) {
        if (val === this._faceFeature) {
            return;
        }
        this._faceFeature = val;
    }
    get faceFeature () {
        return this._faceFeature;
    }

    public registerEvent () {
        arEvent.on(AREventType.COLLECT_FEATURE, this.onCollectFeatureEvent, this);
    }

    public unregisterEvent () {
        arEvent.off(AREventType.COLLECT_FEATURE, this.onCollectFeatureEvent, this);
    }

    public reset () {
        this._trackings.length = 0;
        this._anchorFeature.resetConfig();
        this._planeFeature.resetConfig();
        this._imageFeature.resetConfig();
        this._meshingFeature.resetConfig();
        this._faceFeature.resetConfig();
    }

    public get trackings () {
        return this._trackings;
    }

    public get hasConfig () {
        return this._planeFeature.canUse
            || this._meshingFeature.canUse
            || this._imageFeature.canUse
            || this._faceFeature.canUse;
    }

    public getFeatureEnable (type: ARTrackingType) {
        switch (type) {
        case ARTrackingType.Plane:
            return this.planeFeature.enable;
        case ARTrackingType.Image:
            return this.imageFeature.enable;
        case ARTrackingType.WorldMesh:
            return this.meshingFeature.enable;
        case ARTrackingType.Face:
            return this.faceFeature.enable;
        case ARTrackingType.Lighting:
            return this._lightingFeature.enable;
        default:
            break;
        }
        return false;
    }

    public setFeatureEnable (type: ARTrackingType, enable: boolean) {
        switch (type) {
        case ARTrackingType.Plane:
            this.planeFeature.enable = enable;
            break;
        case ARTrackingType.Image:
            this.imageFeature.enable = enable;
            break;
        case ARTrackingType.WorldMesh:
            this.meshingFeature.enable = enable;
            break;
        case ARTrackingType.Face:
            this.faceFeature.enable = enable;
            break;
        case ARTrackingType.Lighting:
            this._lightingFeature.enable = enable;
            break;
        default:
            break;
        }
    }

    public getFeatureConfig (type: ARTrackingType) {
        switch (type) {
        case ARTrackingType.Plane:
            return this.planeFeature.getConfig();
        case ARTrackingType.Image:
            return this.imageFeature.getConfig();
        case ARTrackingType.WorldMesh:
            return this.meshingFeature.getConfig();
        case ARTrackingType.Face:
            return this.faceFeature.getConfig();
        case ARTrackingType.Lighting:
            return this._lightingFeature.getConfig();
        default:
            break;
        }
        return null;
    }

    public getImageAssetsIndex (uuid: string, url: string) {
        return this._imageFeature.getImageAssetsIndex(uuid, url);
    }

    public get config () {
        const featuresData: ARFeatureData[] = [];

        let cfg;
        cfg = this._cameraFeature.getConfig();
        if (cfg.enable && this._cameraFeature.canUse) {
            featuresData.push(cfg);
        }
        cfg = this._lightingFeature.getConfig();
        if (cfg.enable && this._lightingFeature.canUse) {
            featuresData.push(cfg);
        }
        cfg = this._anchorFeature.getConfig();
        if (cfg.enable && this._anchorFeature.canUse) {
            featuresData.push(cfg);
        }
        cfg = this.planeFeature.getConfig();
        if (cfg.enable && this.planeFeature.canUse) {
            featuresData.push(cfg);
        }
        cfg = this._meshingFeature.getConfig();
        if (cfg.enable && this._meshingFeature.canUse) {
            featuresData.push(cfg);
        }
        cfg = this.imageFeature.getConfig();
        if (cfg.enable && this.imageFeature.canUse) {
            featuresData.push(cfg);
        }
        cfg = this.faceFeature.getConfig();
        if (cfg.enable && this.faceFeature.canUse) {
            featuresData.push(cfg);
        }
        return featuresData;
    }

    private onCollectFeatureEvent (event: FeatureEventParam) {
        //console.log('收集特性：', event.uuid, ARTrackingType[event.ft], event);
        if (event.canUse) {
            if (event.tracking) {
                const arr = this._trackings.filter((e) => e && e.node.uuid === event.uuid);
                if (arr.length <= 0 && event.tracking.isValid) {
                    this._trackings.push(event.tracking);
                }
            }
        } else {
            for (let index = 0; index < this._trackings.length; index++) {
                const element = this._trackings[index];
                if (element.node.uuid === event.uuid) {
                    this._trackings.splice(index, 1);
                    break;
                }
            }
        }

        switch (event.ft) {
        case ARTrackingType.Camera:
            this._cameraFeature.updateFeature(event as CameraFeatureEventParam);
            break;
        case ARTrackingType.Lighting:
            this._lightingFeature.updateFeature(event as LightingFeatureEventParam);
            break;
        case ARTrackingType.Plane:
            this.planeFeature.updateFeature(event as PlaneFeatureEventParam);
            this.planeFeature.tracking_List = this._trackings.filter((e) => e && e.trackingType === ARTrackingType.Plane);
            break;
        case ARTrackingType.WorldMesh:
            this.meshingFeature.updateFeature(event as MeshFeatureEventParam);
            this.meshingFeature.tracking_List = this._trackings.filter((e) => e && e.trackingType === ARTrackingType.WorldMesh);
            break;
        case ARTrackingType.Image:
            this.imageFeature.updateFeature(event as ImageFeatureEventParam);
            this.imageFeature.tracking_List = this._trackings.filter((e) => e && e.trackingType === ARTrackingType.Image);
            break;
        case ARTrackingType.Face:
            this.faceFeature.updateFeature(event);
            this.faceFeature.tracking_List = this._trackings.filter((e) => e && e.trackingType === ARTrackingType.Face);
            break;
        default:
            break;
        }
        if (!EDITOR) {
            arEvent.dispatch(ARInternalEventType.CHECK_TRACKING_NODE_STATE, event);
        }
    }
}
