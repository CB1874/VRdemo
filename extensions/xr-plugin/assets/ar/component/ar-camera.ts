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

import { _decorator, Component, Camera, director, DirectionalLight, sys } from 'cc';
import { EDITOR } from 'cc/env';
import { TrackingOrigin } from '../../xr/component';
import { ARTrackingType, XRSessionModeControllerType } from './framework/utils/ar-enum';
import { arEvent } from './framework/utils/ar-event';
import { ARManager } from './ar-manager';
import { ARSession } from './ar-session';
import { ARLightingMode, CameraFeatureEventParam, LightingFeatureEventParam } from './framework/utils/ar-defines';
import { WebXRSessionController } from '../../xr/component/device/webxr-session-controller';

const { ccclass, property, requireComponent, disallowMultiple, menu, help, executeInEditMode } = _decorator;

/**
 * @en
 * AR camera replaces the original camera with the AR SDK camera
 * @zh
 * AR相机,会替换原有相机为AR SDK的相机
 */
@ccclass('cc.ARCameraMgr')
@help('i18n:cc.ARCameraMgr')
@menu('XR/Device/ARCameraMgr')
@requireComponent(Camera)
@disallowMultiple
@executeInEditMode
export class ARCameraMgr extends Component {
    @property({ serializable: true })
    private _autoFocus = true;

    @property({ serializable: true })
    private _lightEstimate = false;

    @property({
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.tracking.cameraMgr.autoFocus',
        })
    set autoFocus (val) {
        if (val === this._autoFocus) {
            return;
        }
        this._autoFocus = val;
    }
    get autoFocus () {
        return this._autoFocus;
    }

    @property({
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.tracking.cameraMgr.lightEstimate',
        })
    set lightEstimate (val) {
        if (val === this._lightEstimate) {
            return;
        }
        this._lightEstimate = val;
        this.updateLightingFeature(val);
    }
    get lightEstimate () {
        return this._lightEstimate;
    }

    private _targetCamera: Camera | null = null;
    get Camera () {
        return this._targetCamera;
    }

    private _mainLight: DirectionalLight | null = null;
    get MainLight () {
        return this._mainLight;
    }
    private _visibility: number | null = null;
    onLoad () {
        let mode = XRSessionModeControllerType.IMMERSIVE_AR;
        const trackingOrigin = director.getScene()!.getComponentInChildren(TrackingOrigin);
        if (trackingOrigin) {
            const webXRSessionController = trackingOrigin.node.getComponent(WebXRSessionController);
            if (webXRSessionController) {
                mode = webXRSessionController.defaultSessionMode;
            }
        }
        if (!EDITOR && ARSession.getSession()?.autoStartARSession
            && (sys.isNative || mode === XRSessionModeControllerType.AUTO || mode === XRSessionModeControllerType.IMMERSIVE_AR)) {
            const camera = this.node.getComponent(Camera)!;
            this._visibility = camera.camera.visibility;
            camera.camera.visibility = 0;
        }
    }

    protected onEnable () {
        this._targetCamera = this.node.getComponent(Camera);
        this._mainLight = director.getScene()!.getComponentInChildren(DirectionalLight);

        const trackingOrigin = director.getScene()!.getComponentInChildren(TrackingOrigin);
        if (trackingOrigin) {
            const arManager = trackingOrigin.node.getComponent(ARManager);
            if (!arManager) {
                trackingOrigin.node.addComponent(ARManager);
            }

            const arSession = trackingOrigin.node.getComponent(ARSession);
            if (!arSession) {
                trackingOrigin.node.addComponent(ARSession);
            }
        }
        this.updateFeature(true);
        this.updateLightingFeature(this._lightEstimate);
    }

    protected onDisable () {
        const trackingOrigin = director.getScene()!.getComponentInChildren(TrackingOrigin);
        if (trackingOrigin) {
            const arManager = trackingOrigin.node.getComponent(ARManager);
            if (arManager) {
                trackingOrigin.node.removeComponent(ARManager);
            }

            const arSession = trackingOrigin.node.getComponent(ARSession);
            if (arSession) {
                trackingOrigin.node.removeComponent(ARSession);
            }
        }
        this.updateFeature(false);
        this.updateLightingFeature(false);
    }

    protected start () {
        if (!EDITOR) {
            //手持AR，屏蔽offset值
            const trackingOrigin = director.getScene()!.getComponentInChildren(TrackingOrigin);
            if (trackingOrigin) {
                trackingOrigin.resetOffset();
            }
        }
    }

    protected onDestroy () {
        this.updateFeature(false);
        this.updateLightingFeature(false);
    }

    public updateFeature (canUse: boolean) {
        if (canUse && sys.isXR) {
            canUse = false;
        }

        const param: CameraFeatureEventParam = {
            ft: ARTrackingType.Camera,
            uuid: this.node.uuid,
            canUse,
            camera: this,
            visibility: this._visibility,
        };
        arEvent.collectFeature(param);
    }

    public updateLightingFeature (canUse: boolean) {
        const useHDR = director.getScene()?.globals.skybox.useHDR;
        const mode = useHDR ? ARLightingMode.HDR : ARLightingMode.NO_HDR;
        const param: LightingFeatureEventParam = {
            ft: ARTrackingType.Lighting,
            uuid: this.node.uuid,
            canUse,
            mainLight: this._mainLight,
            lightingMode: mode,
        };
        arEvent.collectFeature(param);
    }
}
