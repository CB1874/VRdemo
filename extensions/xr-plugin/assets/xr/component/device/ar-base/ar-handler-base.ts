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

import { Camera, Vec2, Vec3, Vec4 } from 'cc';
import { ARAnchor, ARFace, ARImage, ARLibImageData, ARMesh, ARObject, ARPlane, ARPose, ARLightingMode } from '../../../../ar/component/framework/utils/ar-defines';
import { IARDevice } from './ar-device-base';
import { ARTrackingFeature } from './ar-feature-base';

export abstract class ARHandler<T extends ARAnchor> {
    protected _device: IARDevice | null = null;
    protected _feature: ARTrackingFeature<T> | null = null;
    constructor (device: IARDevice, feature: ARTrackingFeature<T> | null) {
        this._device = device;
        this._feature = feature;
    }
    //native/mindar update.
    public update (camera?: Camera | null) {}
    //webxr update.
    public process (frame: XRFrame, immersiveRefSpace: XRReferenceSpace | null) {}
    //mindar
    public start (video: HTMLVideoElement | null) {}
    public stop () {}
}

export abstract class ARHandlerAnchor extends ARHandler<ARAnchor> {
    public abstract enableAnchor(enable: boolean);
}

export abstract class ARHandlerPlaneDetection extends ARHandler<ARPlane> {
    public abstract enablePlane(enable: boolean);
    public abstract setPlaneDetectionMode(mode: number);
    public abstract getPlanePolygon(planeId: number): Array<Vec2>;
}

export abstract class ARHandlerImageTracking extends ARHandler<ARImage> {
    public abstract enableImageTracking(enable: boolean);
    public abstract addImagesToLib(images: ARLibImageData[]);
    public abstract setImageMaxTrackingNumber(count: number);
}

export abstract class ARHandlerSceneMesh extends ARHandler<ARMesh> {
    public abstract enableSceneMesh(enable: boolean);
}

export abstract class ARHandlerFaceTracking extends ARHandler<ARFace> {
    public abstract enableFaceTracking(enable: boolean);
}

export abstract class ARHandlerObjectTracking extends ARHandler<ARObject> {
    public abstract enableObjectTracking(enable: boolean);
}

export abstract class ARHandlerCameraDevice extends ARHandler<ARAnchor> {
    protected _camera: Camera | null = null;
    get Camera (): Camera | null {
        return this._camera;
    }
    set Camera (val: Camera | null) {
        this._camera = val;
    }

    public abstract enableCameraAutoFocus(enable: boolean);
    public abstract canUseCamera(): boolean;
    public abstract getCameraPose(): ARPose;
    public abstract getCameraFov(): number;
}

export abstract class ARHandlerLightingEstimation extends ARHandler<ARAnchor> {
    public abstract enableLightingEstimation(enable: boolean);
    public abstract setLightingMode(lightingMode: ARLightingMode);
    public abstract getAmbientIntensity(): number;
    public abstract getAmbientColorTemperature(): number;
    public abstract getAmbientColor(): Vec4;
    public abstract getSphericalHarmonics(): number[];
    public abstract getMainLightDirection(): Vec3;
    public abstract getMainLightIntensity(): number;
}
