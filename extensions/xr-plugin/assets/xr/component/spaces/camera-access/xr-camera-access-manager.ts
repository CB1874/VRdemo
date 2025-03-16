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

import { _decorator, sys, Vec2, Texture2D } from 'cc';
import { XrBufferOperationType, xrExtension, XrExtensionKey } from '../../interface/xr-extension';
import { XRConfigKey, xrInterface } from '../../interface/xr-interface';
import { XRSpacesFeatureManager, XRSpacesFeatureType } from '../xr-spaces-feature-manager';

const { ccclass, menu } = _decorator;

export class XRCameraConfiguration {
    constructor (cameraConfiguration: number[]) {
        this.resolutionWidth = cameraConfiguration[0];
        this.resolutionHeight = cameraConfiguration[1];
        this.format = cameraConfiguration[2];
        this.minFps = cameraConfiguration[3];
        this.maxFps = cameraConfiguration[4];
        this.bufferCount = this.resolutionWidth * this.resolutionHeight * 4;
        this.isValid = true;
    }

    public minFps = 30;
    public maxFps = 30;
    public format = 0;
    public resolutionWidth = 1280;
    public resolutionHeight = 720;
    public bufferCount = 0;
    public isValid = false;

    public toString (): string {
        return `Camera Configuration: size:${this.resolutionWidth}x${this.resolutionHeight
        }, format:${this.format},fps:${this.minFps}~${this.maxFps}`;
    }
}

export class XRCameraIntrinsics {
    constructor () {

    }

    public focalLength: Vec2 = new Vec2();
    public principalPoint: Vec2 = new Vec2();
    public resolution: Vec2 = new Vec2(1280, 720);
    public isValid = false;

    public parseData (cameraIntrinsicsData: Float32Array) {
        this.focalLength.x = cameraIntrinsicsData[0];
        this.focalLength.y = cameraIntrinsicsData[1];
        this.principalPoint.x = cameraIntrinsicsData[2];
        this.principalPoint.y = cameraIntrinsicsData[3];
        this.resolution.x = cameraIntrinsicsData[4];
        this.resolution.y = cameraIntrinsicsData[5];
        this.isValid = true;
    }

    public toString (): string {
        return `Camera Intrinsics: size:${this.resolution.x}x${this.resolution.y
        }, focalLength:${this.focalLength.x},${this.focalLength.y},principalPoint:${this.principalPoint.x},${this.principalPoint.y}`;
    }
}

@ccclass('cc.spaces.XRCameraAccessManager')
@menu('hidden:XR/Spaces/XRCameraAccessManager')
export class XRCameraAccessManager extends XRSpacesFeatureManager {
    private _frameTime = 0;
    private _currentFrameTime = 0;
    private _cameraBufferArray: Uint8Array | null = null;
    private _cameraConfiguration: XRCameraConfiguration | null = null;
    private _cameraIntrinsicsArray: Float32Array = new Float32Array(6);
    private _cameraIntrinsics: XRCameraIntrinsics | null = null;
    private _feedPaused = false;
    private _previewTexture: Texture2D | null = null;
    private _internalCreateTexture = false;

    public get cameraBufferArray () {
        return this._cameraBufferArray;
    }

    public get cameraIntrinsics () {
        return this._cameraIntrinsics;
    }

    public get cameraConfiguration () {
        return this._cameraConfiguration;
    }

    set internalCreateTexture (value) {
        this._internalCreateTexture = value;
    }

    get internalCreateTexture () {
        return this._internalCreateTexture;
    }

    public get cameraPreviewTexture () {
        return this._previewTexture;
    }

    public releaseTexture () {
        this._previewTexture?.destroy();
        this._previewTexture = null;
    }

    protected onStart (): void {
        if (sys.isXR) {
            xrInterface.setIntConfig(XRConfigKey.CAMERA_ACCESS, 1);
            const cameraConfiguration: number[] = xrExtension.getUInt32Data(XrExtensionKey.XEK_SPACES_CAMERA_CONFIGURATION);
            this._cameraConfiguration = new XRCameraConfiguration(cameraConfiguration);
            this._cameraBufferArray = new Uint8Array(this._cameraConfiguration.bufferCount);
            this._cameraBufferArray.fill(255);
            this._cameraIntrinsics = new XRCameraIntrinsics();
            this._frameTime = 1.0 / this._cameraConfiguration.minFps;
            this._currentFrameTime = this._frameTime;

            if (this._internalCreateTexture) {
                this._previewTexture = new Texture2D();
                this._previewTexture.create(this._cameraConfiguration.resolutionWidth, this._cameraConfiguration.resolutionHeight, 35/*RGBA8888*/);
            }
        }
    }

    protected onStop (): void {
        if (sys.isXR) {
            xrInterface.setIntConfig(XRConfigKey.CAMERA_ACCESS, 0);
        }
    }

    public getFeatureType (): XRSpacesFeatureType {
        return XRSpacesFeatureType.CAMERA_ACCESS;
    }

    public pauseCameraFrameFeed () {
        this._feedPaused = true;
    }

    public resumeCameraFrameFeed () {
        this._feedPaused = false;
    }

    protected onRetrieveChanges (deltaTime: number): void {
        if (sys.isXR) {
            if (this._feedPaused) {
                return;
            }

            this._currentFrameTime -= deltaTime;
            if (this._currentFrameTime <= 0) {
                this._currentFrameTime = this._frameTime;
                if (this._cameraConfiguration && this._cameraBufferArray) {
                    xrExtension.syncSharedBufferWithNative_UINT8(XrExtensionKey.XEK_SPACES_CAMERA_FRAME_DATA, XrBufferOperationType.XBOT_GET,
                        this._cameraBufferArray, this._cameraBufferArray.length);

                    xrExtension.syncSharedBufferWithNative_Float32(XrExtensionKey.XEK_SPACES_CAMERA_INTRINSICS, XrBufferOperationType.XBOT_GET,
                        this._cameraIntrinsicsArray, this._cameraIntrinsicsArray.length);
                    this.cameraIntrinsics?.parseData(this._cameraIntrinsicsArray);

                    if (this.internalCreateTexture && this._previewTexture) {
                        this._previewTexture.uploadData(this._cameraBufferArray);
                    }
                }
            }
        }
    }
}
