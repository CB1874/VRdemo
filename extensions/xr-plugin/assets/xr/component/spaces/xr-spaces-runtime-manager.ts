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

import { _decorator, Component, Node } from 'cc';
import { XRHandTrackingManager } from './hand-tracking/xr-hand-tracking-manager';
import { XRHitTestingManager } from './hit-testing/xr-hit-testing-manager';
import { XRTrackedImageManager } from './image-tracking/xr-tracked-image-manager';
import { XRPlaneDetectionManager } from './plane-detection/xr-plane-detection-manager';
import { XRSpatialAnchorManager } from './spatial-anchor/xr-spatial-anchor-manager';
import { XRSpacesFeatureType, XRSpacesFeatureManager } from './xr-spaces-feature-manager';

const { ccclass, property, menu } = _decorator;

@ccclass('cc.spaces.XRSpacesRuntimeManager')
@menu('hidden:XR/Spaces/RuntimeManager')
export class XRSpacesRuntimeManager extends Component {
    public static instance: XRSpacesRuntimeManager | null = null;

    @property({ type: [Node] })
    public featureManagerNodes: Node[] | null = [];

    private _currentActivedFeatureType: XRSpacesFeatureType = XRSpacesFeatureType.UNKNOWN;
    get activedFeatureType (): XRSpacesFeatureType {
        return this._currentActivedFeatureType;
    }
    set activedFeatureType (value: XRSpacesFeatureType) {
        this._currentActivedFeatureType = value;
    }

    private _activedFeatureManager: XRSpacesFeatureManager | null | undefined = null;
    private _featureManagerMap: Map<XRSpacesFeatureType, XRSpacesFeatureManager> = new Map<XRSpacesFeatureType, XRSpacesFeatureManager>();

    onLoad () {
        XRSpacesRuntimeManager.instance = this;

        if (this.featureManagerNodes) {
            for (const node of this.featureManagerNodes) {
                const trackedImageManager = node.getComponent(XRTrackedImageManager);
                const hitTestingManager = node.getComponent(XRHitTestingManager);
                const planeDetectionManager = node.getComponent(XRPlaneDetectionManager);
                const spatialAnchorManager = node.getComponent(XRSpatialAnchorManager);
                const handTrackingManager = node.getComponent(XRHandTrackingManager);

                if (trackedImageManager) {
                    this._featureManagerMap.set(trackedImageManager.getFeatureType(), trackedImageManager);
                }

                if (hitTestingManager) {
                    this._featureManagerMap.set(hitTestingManager.getFeatureType(), hitTestingManager);
                }

                if (planeDetectionManager) {
                    this._featureManagerMap.set(planeDetectionManager.getFeatureType(), planeDetectionManager);
                }

                if (spatialAnchorManager) {
                    this._featureManagerMap.set(spatialAnchorManager.getFeatureType(), spatialAnchorManager);
                }

                if (handTrackingManager) {
                    this._featureManagerMap.set(handTrackingManager.getFeatureType(), handTrackingManager);
                }
            }
        }
    }

    update (deltaTime: number) {

    }

    public onToggleFeature (featureType: XRSpacesFeatureType): void {
        if (this._activedFeatureManager && this._activedFeatureManager.getFeatureType() === featureType) {
            console.log(`[XRSpacesRuntimeManager] onToggleFeature:${featureType} is already enabled !!!`);
            return;
        }
        console.log(`[XRSpacesRuntimeManager] onToggleFeature:${featureType}`);
        if (this._activedFeatureManager && this.isFeatureMutuallyExclusive(this._activedFeatureManager.getFeatureType(), featureType)) {
            this.disableActivedFeature();
        }
        this.enableFeature(featureType);
    }

    protected disableActivedFeature (): void {
        if (this._activedFeatureManager) {
            console.log(`[XRSpacesRuntimeManager] disableActivedFeature.${this._activedFeatureManager.getFeatureType().toString()}`);
            this._activedFeatureManager.disableFeature();
            this._activedFeatureManager.node.active = false;
        }
    }

    protected enableFeature (featureType: XRSpacesFeatureType): void {
        if (!this._featureManagerMap.has(featureType)) {
            console.error(`[XRSpacesRuntimeManager] Not support feature type : ${featureType.toString()}`);
            return;
        }
        console.log(`[XRSpacesRuntimeManager] enableFeature:${featureType.toString()}`);
        this.activedFeatureType = featureType;
        this._activedFeatureManager = this._featureManagerMap.get(featureType);
        if (this._activedFeatureManager) {
            this._activedFeatureManager.enableFeature();
            this._activedFeatureManager.node.active = true;
        }
    }

    onEnable (): void {

    }

    onDisable (): void {

    }

    onDestroy (): void {
        XRSpacesRuntimeManager.instance = null;
    }

    isFeatureMutuallyExclusive (featureTypeLeft: XRSpacesFeatureType, featureTypeRight: XRSpacesFeatureType): boolean {
        return true;
    }

    getHandTrackingManager (): XRHandTrackingManager {
        return this._featureManagerMap.get(XRSpacesFeatureType.HAND_TRACKING) as XRHandTrackingManager;
    }
}
