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

import { Color, Quat, Vec3, Vec4 } from 'cc';
import { ARHandlerLightingEstimation } from '../../ar-base/ar-handler-base';
import { ARLightingMode } from '../../../../../ar/component/framework/utils/ar-defines';

export class ARWebXRHandlerLightingEstimation extends ARHandlerLightingEstimation {
    protected _featureName = 'light-estimation';
    private _lightingMode: ARLightingMode | null = null;
    private _xrLightEstimate: XRLightEstimate | null = null;
    private _xrLightProbe: XRLightProbe | null = null;
    private _isRequestLightProbe = false;
    private _lightDirection: Vec3 = new Vec3();
    private _intensity = 1;

    public enableLightingEstimation (enable: boolean) {
        if (this._feature) {
            this._feature.enable = enable;
        }
    }

    public setLightingMode (lightingMode: ARLightingMode) {
        this._lightingMode = lightingMode;
    }

    public getAmbientIntensity (): number {
        return 0;
    }

    public getAmbientColorTemperature (): number {
        return 0;
    }
    public getAmbientColor (): Vec4 {
        return Vec4.ZERO;
    }

    public getSphericalHarmonics (): number[] {
        return [];
    }
    public getMainLightDirection (): Vec3 {
        return this._lightDirection;
    }
    public getMainLightIntensity (): number {
        return this._intensity;
    }

    public attachFeatureSessionInit (): Promise<XRSessionInit> {
        return Promise.resolve({
            optionalFeatures: [this._featureName],
        });
    }

    public process (frame: XRFrame, immersiveRefSpace: XRReferenceSpace) {
        if (!this._feature || !this._feature.config?.enable || !frame) {
            return;
        }
        if (this._lightingMode === ARLightingMode.NO_HDR) {
            return;
        }
        if (!this._xrLightProbe) {
            if (!this._isRequestLightProbe) {
                this._isRequestLightProbe = true;
                const preferredReflectionFormat = this._lightingMode === ARLightingMode.HDR ? 'rgba16f' : 'srgba8';
                const promises = frame.session.requestLightProbe({
                    reflectionFormat: preferredReflectionFormat,
                }).then((xrLightProbe: XRLightProbe) => {
                    this._xrLightProbe = xrLightProbe;
                });
            }
        } else {
            this._xrLightEstimate = frame.getLightEstimate(this._xrLightProbe);
            if (this._xrLightEstimate) {
                this._intensity = Math.max(
                    this._xrLightEstimate.primaryLightIntensity.x,
                    this._xrLightEstimate.primaryLightIntensity.y,
                    this._xrLightEstimate.primaryLightIntensity.z,
                );
                Quat.toEuler(this._lightDirection, this._xrLightEstimate.primaryLightDirection);
            }
        }
    }

    public update () {
        if (!this._feature || !this._feature.config?.enable) {
            return;
        }

        this._feature.update();
    }
}
