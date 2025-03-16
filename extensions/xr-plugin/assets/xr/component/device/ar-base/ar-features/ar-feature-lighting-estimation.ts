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

import { DirectionalLight, director, sys, Vec4 } from 'cc';
import { ARLightingMode, FeatureType, LightingEstimationConfig } from '../../../../../ar/component/framework/utils/ar-defines';
import { ARFeature } from '../ar-feature-base';
import { ARHandlerLightingEstimation } from '../ar-handler-base';

const _v4Sky = new Vec4();
const _v4Ground = new Vec4();

export class ARFeatureLightingEstimation extends ARFeature {
    public get featureId (): FeatureType {
        return FeatureType.LightingEstimation;
    }

    protected _mainLight: DirectionalLight | null = null;
    private _lightingMode: ARLightingMode | null = null;
    private _skyColorLDR: Vec4 | null = null;
    private _groundAlbedoLDR: Vec4 | null = null;

    init (config: LightingEstimationConfig): void {
        super.init(config);

        this._mainLight = config.mainLight;
        this._lightingMode = (this.config as LightingEstimationConfig).lightingMode;
        const handler = this._handler as ARHandlerLightingEstimation;
        if (handler && this.config) {
            handler.setLightingMode(this._lightingMode);
        }
    }

    update (): void {
        if (!this.config || !this.config.enable) {
            return;
        }
        const handler = this._handler as ARHandlerLightingEstimation;
        if (this._lightingMode === ARLightingMode.NO_HDR) {
            if (sys.isBrowser) {
                return;
            }

            const ambient = director.getScene()?.globals.ambient;
            if (ambient) {
                // 光照强度(lux/lx)
                const ambientIntensity = handler.getAmbientIntensity();
                ambient.skyIllum = ambientIntensity;
            }
            if (sys.platform === 'IOS') {
                // 色温
                const ambientColorTemperature = handler.getAmbientColorTemperature();
                if (ambientColorTemperature > 0 && this._mainLight) {
                    this._mainLight.colorTemperature = ambientColorTemperature;
                }
            } else {
                // 颜色矫正
                const ambientColor = handler.getAmbientColor();
                if (ambient && !ambientColor.equals(Vec4.ZERO)) {
                    if (!this._skyColorLDR && !this._groundAlbedoLDR) {
                        this._skyColorLDR = ambient.skyColorLDR.clone();
                        this._groundAlbedoLDR = ambient.groundAlbedoLDR.clone();
                    }
                    if (this._skyColorLDR && this._groundAlbedoLDR) {
                        ambient.skyColor = Vec4.multiply(_v4Sky, this._skyColorLDR, ambientColor);
                        ambient.groundAlbedo = Vec4.multiply(_v4Ground, this._groundAlbedoLDR, ambientColor);
                    }
                }
            }
        } else if (sys.platform !== 'IOS') {
            const dir = handler.getMainLightDirection();
            const intensity = handler.getMainLightIntensity();
            const sphericalHarmonics = handler.getSphericalHarmonics();

            if (this._mainLight) {
                this._mainLight.node.setWorldRotationFromEuler(dir.x, dir.y, dir.z);
                this._mainLight.illuminance = intensity;
                if (director.getScene()!.globals.skybox.useHDR) {
                    this._mainLight.illuminance *= 38400;
                }
            }
        }
    }
}
