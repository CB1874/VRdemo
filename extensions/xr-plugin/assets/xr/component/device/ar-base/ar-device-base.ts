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

import { geometry, Vec2 } from 'cc';
import { ARAnchor, ARAPI, ARFeatureData, ARRayCastMode, ARTrackingState, FeatureType } from '../../../../ar/component/framework/utils/ar-defines';
import { XRSessionModeControllerType } from '../../../../ar/component/framework/utils/ar-enum';
import { ARFeature } from './ar-feature-base';

export abstract class IARDevice {
    public abstract checkSupported (mode?: XRSessionModeControllerType): Promise<boolean>;
    public abstract init(mode: XRSessionMode, featuresDataset: ARFeatureData[]): Promise<boolean>;
    public abstract getSessionMode(): XRSessionMode;
    public abstract getCheckSessionMode (): XRSessionMode;
    public abstract getAPIState(): number;
    public abstract start(): void;
    public abstract stop(): void;
    public abstract update(): void;
    public abstract screenHitTest(mode: ARRayCastMode, touchPoint?: Vec2): Promise<ARAnchor | null>;
    public abstract worldHitTest(mode: ARRayCastMode, ray: geometry.Ray): Promise<ARAnchor | ARTrackingState>;

    protected abstract get HandlerPrefix(): string;
    protected abstract checkFeatureAvailable(featureClassName: string): boolean;
    protected abstract checkHandlerAvailable(handlerClassName: string): boolean;
    protected abstract createFeature(featureClassName: string): any;
    protected abstract createHandler(feature: ARFeature): any;
}

export abstract class ARDevice extends IARDevice {
    protected _featureConfigMask = FeatureType.None;
    protected _featuresMap: Map<string, ARFeature> = new Map<string, ARFeature>();
    protected _featuresDataset: ARFeatureData[] = [];

    get FeaturePrefix (): string {
        return 'ARFeature';
    }

    public getSessionMode (): XRSessionMode {
        return 'immersive-ar';
    }
    public getCheckSessionMode (): XRSessionMode {
        return 'immersive-ar';
    }

    public isSupportedAR () {
        const api = this.getAPIState();
        if (api === ARAPI.ARKit || api === ARAPI.ARCore || api === ARAPI.AREngine || api === ARAPI.WebXR || api === ARAPI.SpacesXR) {
            return true;
        }
        return false;
    }

    // need use this after device init and device state is normal
    get FeatureSupportMask (): FeatureType {
        return this._featureConfigMask;
    }
    public checkFeatureSupport (type: FeatureType) {
        return (this._featureConfigMask & type) !== 0;
    }
    public tryGetFeature (featureName: string): ARFeature | null {
        if (this._featuresMap.has(featureName)) {
            const feature = this._featuresMap.get(featureName)!;
            return feature;
        }
        return null;
    }

    public tryGetFeatureByType (featureType: FeatureType): ARFeature | null {
        const featureClass = this.FeaturePrefix + FeatureType[featureType];
        return this.tryGetFeature(featureClass);
    }

    public setAllFeaturesActive (enable: boolean) {
        this._featuresMap.forEach((feature) => {
            feature.enable = enable;
        });
    }

    protected createFeatures (featuresDataset: ARFeatureData[]) {
        featuresDataset.forEach((configData) => {
            if (configData != null) {
                const featureClass = this.FeaturePrefix + FeatureType[configData.type];
                // check constructor
                if (this.checkFeatureAvailable(featureClass)) {
                    const featureInstance = this.createFeature(featureClass);

                    if (!this._featuresMap.has(featureClass)) {
                        this._featureConfigMask |= featureInstance.featureId;
                        this._featuresMap.set(featureClass, featureInstance);
                    } else {
                        console.warn('Error! Duplicate Feature:', configData.type);
                    }
                } else {
                    console.warn(`Feature: <${configData.type}> is not available on`, this);
                }
            } else {
                console.error('ARDevice.createFeatures failed, configData is null!!!');
            }
        });
    }

    protected checkFeaturesSupport (supportMask: number) {
        for (let index = 0; index < 8; index++) {
            const configBit = this._featureConfigMask & (1 << index);
            if (configBit === 0) {
                continue;
            }
            const supportBit = supportMask & (1 << index);
            if (supportBit === 0) {
                const feaName = FeatureType[index * index];
                this.removeHandler(this.FeaturePrefix + feaName);
                this._featuresMap.delete(this.FeaturePrefix + feaName);
            }
        }

        this._featureConfigMask = supportMask;
    }

    protected initFeatures (featuresDataset: ARFeatureData[]) {
        featuresDataset.forEach((configData) => {
            if (configData != null) {
                const featureClass = this.FeaturePrefix + FeatureType[configData.type];
                if (this._featuresMap.has(featureClass)) {
                    this._featuresMap.get(featureClass)?.init(configData);
                }
            }
        });
    }

    protected createHandlers () {
        this._featuresMap.forEach((feature) => {
            const handler = this.createHandler(feature);
            if (handler) {
                feature.setHandler(handler);
            }
        });
    }

    protected updateHandlers () {
        this._featuresMap.forEach((feature) => {
            const handler = feature.getHandler();
            if (handler) {
                handler.update();
            }
        });
    }

    protected removeHandler (featureClass: string) {
        if (this._featuresMap.has(featureClass)) {
            this._featuresMap.get(featureClass)?.setHandler(null);
        }
    }

    public clearHandlers () {
        this._featuresMap.forEach((feature) => {
            feature.setHandler(null);
        });
        this._featuresMap.clear();
    }
}
