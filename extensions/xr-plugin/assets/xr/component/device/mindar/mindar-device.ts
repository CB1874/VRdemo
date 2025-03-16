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

import { director, geometry, gfx, RenderPipeline, Vec2 } from 'cc';
import { MindAR } from './mindar';
import { ARDevice } from '../ar-base/ar-device-base';
import * as features from '../ar-base/ar-features';
import * as handlers from './ar-handler';
import { ARAnchor, ARAPI, ARFeatureData, ARRayCastMode, ARTrackingState, FeatureType } from '../../../../ar/component/framework/utils/ar-defines';
import { ARFeature } from '../ar-base/ar-feature-base';
import { XRSessionModeControllerType } from '../../../../ar/component/framework/utils/ar-enum';
import { ARBackgroundStage } from '../../../../ar/component/rendering/ar-background-stage';

export class MindARDevice extends ARDevice {
    private _webAR: MindAR | null = null;
    private _arBackgroundStage: ARBackgroundStage | null = null;

    get WebARObj () {
        return this._webAR;
    }

    get HandlerPrefix (): string {
        return 'ARWebARHandler';
    }

    public create () {
        if (!this._webAR) {
            this._webAR = new MindAR();
            this._webAR.adapterMediaDevice();
        }
    }

    public checkSupported (mode?: XRSessionModeControllerType): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                reject(new Error('checkSupported: sorry, your browser not support getUserMedia api.'));
                return;
            }
            resolve(true);
        })
            .catch(() => false);
    }

    public init (mode: XRSessionMode, featuresDataset: ARFeatureData[]): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._webAR?.startVideo().then((isSupported) => {
                if (isSupported) {
                    resolve(true);
                } else {
                    console.warn('init: sorry, your browser does not support MindAR.');
                    reject(new Error('sorry, your browser does not support MindAR.'));
                }
            });
        })
            .then((v) => {
                this.createFeatures(featuresDataset);
                this.createHandlers();
                this.initFeatures(featuresDataset);
                this._featuresMap.forEach((feature) => {
                    const handler = feature.getHandler();
                    if (handler && this._webAR) {
                        handler.start(this._webAR?.Video);
                    }
                });
                return true;
            })
            .then((v) => {
                this.initRender();
                if (this._webAR && this._webAR.Camera) {
                    this._webAR.Camera.camera.clearFlag = gfx.ClearFlagBit.NONE;
                }
                return true;
            })
            .catch(() => false);
    }

    private initRender () {
        if (!this._webAR || this._arBackgroundStage) {
            return;
        }
        const pipeline = director.root?.pipeline as RenderPipeline;
        this._arBackgroundStage = new ARBackgroundStage();
        this._arBackgroundStage.initialize(ARBackgroundStage.initInfo);
        this._arBackgroundStage.setVideoSource(this._webAR?.Video);

        const flows = pipeline.flows;
        const forwardFlow = flows[flows.length - 1];
        forwardFlow.stages.push(this._arBackgroundStage);
        forwardFlow.activate(forwardFlow.pipeline);
    }

    private clearRender () {
        const pipeline = director.root?.pipeline as RenderPipeline;
        const flows = pipeline.flows;
        const forwardFlow = flows[flows.length - 1];
        for (let index = 0; index < forwardFlow.stages.length; index++) {
            const element = forwardFlow.stages[index];
            if (element.name === 'ARStage') {
                forwardFlow.stages.splice(index, 1);
                break;
            }
        }

        if (this._arBackgroundStage) {
            this._arBackgroundStage?.destroy();
            this._arBackgroundStage = null;
        }
    }

    public start () {
        this._featuresMap.forEach((feature) => {
            feature.start();
        });
    }

    public stop () {
        this.clearRender();
        this._webAR?.stopVideo();
        this._featuresMap.forEach((feature) => {
            feature.stop();
            const handler = feature.getHandler();
            if (handler) {
                handler.stop();
            }
        });
        this._webAR = null;
    }

    public update () {
        if (!this._webAR) {
            return;
        }
        this._featuresMap.forEach((feature) => {
            const handler = feature.getHandler();
            if (handler) {
                handler.update(this._webAR?.Camera);
            }
        });
    }

    public getAPIState (): number {
        return ARAPI.MindAR;
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

    public screenHitTest (mode: ARRayCastMode, touchPoint?: Vec2): Promise<ARAnchor | null> {
        return Promise.reject(new Error('mindar device screen hit test is not supported '));
    }

    public worldHitTest (mode: ARRayCastMode, ray: geometry.Ray): Promise<ARAnchor | ARTrackingState> {
        return Promise.reject(new Error('mindar device Ray hit test is not supported '));
    }
}
