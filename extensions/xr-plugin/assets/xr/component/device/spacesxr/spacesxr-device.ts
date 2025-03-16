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
import { ARAPI, ARRayCastMode, ARAnchor, FeatureType, ARFeatureData, ARTrackingState } from '../../../../ar/component/framework/utils/ar-defines';
import { XRSessionModeControllerType } from '../../../../ar/component/framework/utils/ar-enum';
import { XRConfigKey, xrInterface } from '../../interface/xr-interface';
import { ARDevice } from '../ar-base/ar-device-base';
import { ARFeature } from '../ar-base/ar-feature-base';
import * as features from '../ar-base/ar-features';
import * as handlers from './ar-handler';

class SpacesXRRaycastHitResult {
    public targetId = 0;
    public position: Vec3 = new Vec3();
    public rotation = new Quat();
    public surfaceNormal: Vec3 = new Vec3();
    public isValid = false;

    public parseData (data: string | null) {
        //"targetId|x|y|z|normal x|normal y|normal z&targetId|x|y|z|normal x|normal y|normal z"
        this.isValid = false;
        if (data && data.length > 0) {
            const info: string[] = data.split('|');
            if (info.length > 0) {
                this.targetId = parseInt(info[0]);

                this.position.x = parseFloat(info[1]);
                this.position.y = parseFloat(info[2]);
                this.position.z = parseFloat(info[3]);

                this.surfaceNormal.x = parseFloat(info[4]);
                this.surfaceNormal.y = parseFloat(info[5]);
                this.surfaceNormal.z = parseFloat(info[6]);
                Quat.fromViewUp(this.rotation, Vec3.UNIT_Z, this.surfaceNormal);
                this.isValid = true;
            }
        }
    }
}

export class SpacesXRDevice extends ARDevice {
    private _hitResult: SpacesXRRaycastHitResult = new SpacesXRRaycastHitResult();
    private _isHitTestingStarted  = false;
    private _hitTestingTrackingState: ARTrackingState = ARTrackingState.PAUSED;
    protected get HandlerPrefix (): string {
        return 'SpacesXRHandler';
    }

    public checkSupported (mode?: XRSessionModeControllerType): Promise<boolean> {
        return Promise.resolve(true);
    }

    public getAPIState (): number {
        return ARAPI.SpacesXR;
    }

    public screenHitTest (mode: ARRayCastMode, touchPoint?: Vec2): Promise<ARAnchor | null> {
        return Promise.reject(new Error('spacesxr device Ray hit test is not supported '));
    }

    public worldHitTest (mode: ARRayCastMode, ray: geometry.Ray): Promise<ARAnchor | ARTrackingState> {
        return new Promise<ARAnchor | ARTrackingState>((resolve, reject) => {
            if (ray) {
                if (this._hitTestingTrackingState === ARTrackingState.STOPPED) {
                    reject(ARTrackingState.STOPPED);
                    return;
                }

                if (!this._isHitTestingStarted) {
                    xrInterface.setIntConfig(XRConfigKey.HIT_TESTING, 1);
                    this._isHitTestingStarted = true;
                    reject(ARTrackingState.STARTING);
                    return;
                }

                if (sys.isXR && this._hitResult.isValid) {
                    const anchor: ARAnchor = {
                        id: this._hitResult.targetId,
                        pose: {
                            position: this._hitResult.position.clone(),
                            rotation: this._hitResult.rotation.clone(),
                        },
                    };
                    anchor.trackingState = ARTrackingState.TRACKING;
                    resolve(anchor);
                } else {
                    reject(ARTrackingState.STARTED);
                }
            }
        });
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
        console.error(`SpacesXRDevice.createHandler.${handlerClass} failed !!!`);
        return null;
    }

    protected checkFeatureAvailable (featureClassName: string): boolean {
        return !!(features as any)[featureClassName];
    }

    protected createFeature (featureClassName: string): any {
        const featureInstance = new (features as any)[featureClassName](this);
        return featureInstance;
    }

    public init (mode: XRSessionMode, featuresDataset: ARFeatureData[]): Promise<boolean> {
        for (const data of featuresDataset) {
            console.log(`SpacesXRDevice ARFeatureData.${data.type},${data.enable}`);
        }
        this.createFeatures(featuresDataset);
        this.createHandlers();
        this.initFeatures(featuresDataset);

        return Promise.resolve(true);
    }

    start (): void {
        this._featuresMap.forEach((feature, id) => {
            feature.start();
        });
    }

    stop (): void {
        this._featuresMap.forEach((feature) => {
            feature.stop();
        });

        if (this._isHitTestingStarted) {
            xrInterface.setIntConfig(XRConfigKey.HIT_TESTING, 0);
            this._isHitTestingStarted = false;
            this._hitTestingTrackingState = ARTrackingState.STOPPED;
        }
    }

    update (): void {
        this.updateHandlers();
        if (this._isHitTestingStarted && sys.isXR) {
            const hitResultData: string = xrInterface.getStringConfig(XRConfigKey.HIT_TESTING_DATA);
            if (hitResultData.length > 0) {
                this._hitResult.parseData(hitResultData);
            }
        }
    }
}
