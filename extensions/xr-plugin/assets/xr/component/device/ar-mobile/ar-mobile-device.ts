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

import { geometry, Quat, sys, Vec2, Vec3 } from 'cc';
import { ARDevice } from '../ar-base/ar-device-base';
import * as features from '../ar-base/ar-features';
import * as handlers from './ar-handler';
import { ARAnchor, ARFeatureData, ARRayCastMode, ARTrackingState, FeatureType } from '../../../../ar/component/framework/utils/ar-defines';
import { ARFeature } from '../ar-base/ar-feature-base';
import { XRSessionModeControllerType } from '../../../../ar/component/framework/utils/ar-enum';
import { XRPermissionHelper } from '../../utils/xr-permission-helper';

declare const xr: any;
export class ARMobileDevice extends ARDevice {
    private _nativeObj;
    private _isArReady = 0;
    get NativeObj () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this._nativeObj;
    }
    get HandlerPrefix (): string {
        return 'ARMobileHandler';
    }

    public create () {
        if (sys.platform === 'ANDROID') {
            this._isArReady = 1;
            XRPermissionHelper.setARReadyListener(() => {
                this._isArReady = 2;
            });
        }
        this._nativeObj = xr.ARModule.get();
        if (!this._nativeObj) {
            this._nativeObj = xr.ARModule.createARModule();
        }
    }

    public init (mode: XRSessionMode, featuresDataset: ARFeatureData[]): Promise<boolean> {
        if (!this._nativeObj) {
            console.error('... armodule init in native failed! ...');
            return Promise.resolve(false);
        }
        this.createFeatures(featuresDataset);
        this.createHandlers();

        if (this.canFallBack(featuresDataset)) {
            this._featureConfigMask |= FeatureType.EnableDemotion;
        }
        this._nativeObj.config(this._featureConfigMask);

        // init native features setting feature configs
        // after mask config and before native session start
        this.initFeatures(featuresDataset);
        this._nativeObj.start();

        const mask = this._nativeObj.getSupportMask();
        if (mask === 0) {
            return Promise.resolve(false);
        }
        // check for feature support, eliminate unsupported features
        this.checkFeaturesSupport(mask);

        return Promise.resolve(true);
    }

    public start () {
        this._featuresMap.forEach((feature) => {
            feature.start();
        });
    }

    public stop () {
        this._featuresMap.forEach((feature) => {
            feature.stop();
        });
        this._nativeObj.stop();
    }

    public update () {
        if (sys.platform === sys.Platform.ANDROID) {
            this._nativeObj.update();
        }
        this.updateHandlers();
    }

    public getAPIState (): number {
        const state: number = this._nativeObj.getAPIState();
        return state;
    }

    protected canFallBack (featuresDataset: ARFeatureData[]) {
        const list = featuresDataset.filter((e) => e && e.enableNativeFallBack);
        console.log('native fall back :', list.length > 0);
        if (list.length > 0) {
            return true;
        }
        return false;
    }

    protected checkFeatureAvailable (featureClassName: string): boolean {
        return !!(features as any)[featureClassName];
    }
    protected createFeature (featureClassName: string): any {
        const featureInstance = new (features as any)[featureClassName](this);
        return featureInstance;
    }
    protected checkHandlerAvailable (handlerClassName: string): boolean {
        return !!(handlers as any)[handlerClassName];
    }
    protected createHandler (feature: ARFeature): any {
        const handlerClass = this.HandlerPrefix + FeatureType[feature.featureId];
        if (this.checkHandlerAvailable(handlerClass)) {
            const handler = new (handlers as any)[handlerClass](this, feature);
            return handler;
        }
        return null;
    }

    public getCameraTexCoords (): number[] {
        const coords: number [] = this._nativeObj.getCameraTexCoords();
        return coords;
    }

    public setDisplayGeometry (rotation: number, width: number, height: number) {
        this._nativeObj.setDisplayGeometry(rotation, width, height);
    }

    public setCameraTextureName (id: number) {
        this._nativeObj.setCameraTextureName(id);
    }

    public getCameraTextureRef () {
        return this._nativeObj.getCameraTextureRef() as WebGLTexture;
    }

    public screenHitTest (mode: ARRayCastMode, touchPoint?: Vec2): Promise<ARAnchor | null> {
        return new Promise<ARAnchor | null>((resolve, reject) => {
            if (touchPoint) {
                const bHit = this._nativeObj.tryHitTest(touchPoint.x, touchPoint.y, mode);
                if (bHit) {
                    const pose = this._nativeObj.getHitResult();
                    const anchor: ARAnchor = {
                        id: this._nativeObj.getHitId(),
                        pose: {
                            position: new Vec3(pose[0], pose[1], pose[2]),
                            rotation: new Quat(pose[3], pose[4], pose[5], pose[6]),
                        },
                    };
                    resolve(anchor);
                } else {
                    resolve(null);
                }
            }
        });
    }

    public worldHitTest (mode: ARRayCastMode, ray: geometry.Ray): Promise<ARAnchor | ARTrackingState> {
        return Promise.reject(new Error('mobile device Ray hit test is not supported '));
    }

    public checkSupported (mode?: XRSessionModeControllerType): Promise<boolean> {
        if (sys.platform === 'ANDROID') {
            if (this._isArReady === 2) {
                return Promise.resolve(true);
            } else {
                return new Promise<boolean>((resolve) => {
                    if (this._isArReady === 1) {
                        XRPermissionHelper.setARReadyListener(() => {
                            resolve(true);
                        });
                        XRPermissionHelper.checkARReady();
                    } else {
                        resolve(true);
                    }
                });
            }
        } else {
            return Promise.resolve(true);
        }
    }
}
