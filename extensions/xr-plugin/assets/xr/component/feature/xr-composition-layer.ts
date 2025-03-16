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

import { _decorator, Camera, ccenum, CCFloat, Component, director, Director, gfx, ImageAsset, Quat, RenderTexture, sys, Vec3, VERSION } from 'cc';
import { XrBufferOperationType, xrExtension, XrExtensionKey } from '../interface/xr-extension';
import { CxrLayerType, CxrLockType, CxrShapeType, CxrTextureType } from './xr-feature-define';
import { XRConfigKey, xrInterface } from '../interface/xr-interface';

const { ccclass, property, menu } = _decorator;

class CxrCompositionLayerParam {
    public textureType: CxrTextureType = CxrTextureType.Static;
    public layerType: CxrLayerType = CxrLayerType.Overlay;
    public shapeType: CxrShapeType = CxrShapeType.Quad;
    public lockType: CxrLockType = CxrLockType.WorldLock;
    public layerDepth = 0;
    public layerId = 0;
    public width = 0;
    public height = 0;
    public sizeXInMeters = 1;
    public sizeYInMeters = 1;
    public orientation: Quat = new Quat();
    public position: Vec3 = new Vec3();
    public cylinderRadius = 1;
    public cylinderCentralAngle = 30;

    public toBufferArray (): Float32Array {
        const buffer: Float32Array = new Float32Array(19);
        buffer[0] = this.layerType;
        buffer[1] = this.shapeType;
        buffer[2] = this.lockType;
        buffer[3] = this.layerDepth;
        buffer[4] = this.layerId;
        buffer[5] = this.width;
        buffer[6] = this.height;
        buffer[7] = this.sizeXInMeters;
        buffer[8] = this.sizeYInMeters;
        buffer[9] = this.orientation.x;
        buffer[10] = this.orientation.y;
        buffer[11] = this.orientation.z;
        buffer[12] = this.orientation.w;
        buffer[13] = this.position.x;
        buffer[14] = this.position.y;
        buffer[15] = this.position.z;
        buffer[16] = this.cylinderRadius;
        buffer[17] = this.cylinderCentralAngle;
        buffer[18] = this.textureType;
        return buffer;
    }

    public toTickBufferArray (): Float32Array {
        const buffer: Float32Array = new Float32Array(9);
        buffer[0] = this.layerId;
        buffer[1] = 0;
        buffer[2] = this.orientation.x;
        buffer[3] = this.orientation.y;
        buffer[4] = this.orientation.z;
        buffer[5] = this.orientation.w;
        buffer[6] = this.position.x;
        buffer[7] = this.position.y;
        buffer[8] = this.position.z;
        return buffer;
    }
}

@ccclass('cc.XRCompositionLayer')
@menu('XR/Extra/XRCompositionLayer')
export class XRCompositionLayer extends Component {
    @property({group: { name: 'Texture Settings', displayOrder: 99, id: '2' }, displayName: 'Texture Type', type: CxrTextureType,
        tooltip: 'i18n:xr-plugin.compositionLayer.texturetype', visible: (function (this: XRCompositionLayer) {
            return this.isSupportStaticTexture();
            })})
    set textureType (val) {
        this._textureType = val;
        if (!this.isSupportStaticTexture() && this.textureType === CxrTextureType.Static) {
            console.warn('Currently cocos engine version is not support static texture type !!!');
            this.staticImage = null;
        }
    }
    get textureType () {
        return this._textureType;
    }

    @property({group: { name: 'Texture Settings', displayOrder: 100, id: '2' }, type:Camera, displayName: 'Camera', displayOrder: 0,
        tooltip: 'i18n:xr-plugin.compositionLayer.rtcamera', visible: (function (this: XRCompositionLayer) {
            return this.textureType === CxrTextureType.Dynamic;
            })})
    private renderTextureCamera: Camera|null = null;

    @property({group: { name: 'Texture Settings', displayOrder: 101, id: '2' }, displayName: 'Width', displayOrder: 1,
        tooltip: 'i18n:xr-plugin.compositionLayer.rtwidth', visible: (function (this: XRCompositionLayer) {
            return this.textureType === CxrTextureType.Dynamic;
            })})
    private renderTextureWidth = 1280;

    @property({group: { name: 'Texture Settings', displayOrder: 102, id: '2' }, displayName: 'Height', displayOrder: 2,
        tooltip: 'i18n:xr-plugin.compositionLayer.rtheight', visible: (function (this: XRCompositionLayer) {
            return this.textureType === CxrTextureType.Dynamic;
            })})
    private renderTextureHeight = 720;

    @property({group: { name: 'Texture Settings', displayOrder: 103, id: '2' }, displayName: 'Static Texture', displayOrder: 3,
        type: ImageAsset, tooltip: 'i18n:xr-plugin.compositionLayer.staticimage', visible: (function (this: XRCompositionLayer) {
            return this.textureType === CxrTextureType.Static;
            })})
    public staticImage: ImageAsset | null = null;

    @property({group: { name: 'Layer Settings', displayOrder: 10 }, displayName: 'Type', type: CxrLayerType,
        tooltip: 'i18n:xr-plugin.compositionLayer.layertype'})
    private layerType: CxrLayerType = CxrLayerType.Overlay;

    @property({group: { name: 'Layer Settings', displayOrder: 20  }, displayName: 'Shape', type: CxrShapeType,
        tooltip: 'i18n:xr-plugin.compositionLayer.shapetype'})
    private shapeType: CxrShapeType = CxrShapeType.Quad;

    /*@property({group: { name: 'Layer Settings', displayOrder: 30  }, displayName: 'Lock', type: CxrLockType,
        tooltip: 'i18n:xr-plugin.compositionLayer.locktype'})*/
    private lockType: CxrLockType = CxrLockType.WorldLock;

    @property({group: { name: 'Layer Settings', displayOrder: 40  }, displayName: 'Depth',
        tooltip: 'i18n:xr-plugin.compositionLayer.depth'})
    private layerDepth = 0;

    @property({group: { name: 'Layer Settings', displayOrder: 50  }, tooltip: 'i18n:xr-plugin.compositionLayer.cylinderradius',
        displayName: 'Radius', range: [0.1, 1000000],
        visible: (function (this: XRCompositionLayer) {
            return this.shapeType === CxrShapeType.Cylinder;
            })})
    set cylinderRadius (val) {
        this._cylinderRadius = val;
    }
    get cylinderRadius () {
        return this._cylinderRadius;
    }

    @property({group: { name: 'Layer Settings', displayOrder: 60  }, tooltip: 'i18n:xr-plugin.compositionLayer.cylindercentralangle',
        displayName: 'CentralAngle', range: [1, 360],
        visible: (function (this: XRCompositionLayer) {
            return this.shapeType === CxrShapeType.Cylinder;
            })})
    set cylinderCentralAngle (val) {
        this._cylinderCentralAngleInDeg = val;
    }
    get cylinderCentralAngle () {
        return this._cylinderCentralAngleInDeg;
    }

    @property(CCFloat)
    private _cylinderRadius = 1.0;
    @property(CCFloat)
    private _cylinderCentralAngleInDeg = 30;
    @property({type: CxrTextureType})
    private _textureType: CxrTextureType = CxrTextureType.Dynamic;

    private _layerParam: CxrCompositionLayerParam = new CxrCompositionLayerParam();
    private _layerId = 0;
    private _swapchainImagesCount = 0;
    private _rendetexturesArray: RenderTexture[] | null = null;
    private static layerIdCount = 0;
    private staticImageData: Uint8Array | null = null;
    private staticImageDataUploaded = false;

    start () {
        if (!this.isSupportStaticTexture() && this.textureType === CxrTextureType.Static) {
            console.warn('Currently cocos engine version is not support static texture type !!!');
            this.staticImage = null;
        }
        XRCompositionLayer.layerIdCount++;
        this._layerId = XRCompositionLayer.layerIdCount;
        this._layerParam.textureType = this.textureType;
        this._layerParam.layerType = this.layerType;
        this._layerParam.shapeType = this.shapeType;
        this._layerParam.lockType = this.lockType;
        this._layerParam.layerDepth = this.layerDepth;
        this._layerParam.layerId = this._layerId;
        this._layerParam.sizeXInMeters = this.node.scale.x;
        this._layerParam.sizeYInMeters = this.node.scale.y;
        this._layerParam.position = this.node.worldPosition.clone();
        this._layerParam.orientation = this.node.worldRotation.clone();
        this._layerParam.cylinderRadius = this._cylinderRadius;
        this._layerParam.cylinderCentralAngle = this._cylinderCentralAngleInDeg;
        const textureWidth = (this.textureType === CxrTextureType.Static && this.staticImage) ? this.staticImage.width
            : this.renderTextureWidth;
        const textureHeight = (this.textureType === CxrTextureType.Static && this.staticImage) ? this.staticImage.height
            : this.renderTextureHeight;
        this._layerParam.width = textureWidth;
        this._layerParam.height = textureHeight;

        director.on(Director.EVENT_BEFORE_DRAW, this.beforeDraw, this);
        director.on(Director.EVENT_BEFORE_RENDER, this.beforeFrameRender, this);
        if (sys.isXR && sys.isNative) {
            const buffer = this._layerParam.toBufferArray();
            xrExtension.syncSharedBufferWithNative_Float32(XrExtensionKey.XEK_COMPOSITION_LAYER_CREATE,
                XrBufferOperationType.XBOT_SET, buffer, buffer.length);
            if (this.textureType === CxrTextureType.Static && this.staticImage) {
                // @assets/assets/main/native/95/95x.png
                xrInterface.setStringConfig(XRConfigKey.ASYNC_LOAD_ASSETS_IMAGE, `@assets/${this.staticImage.nativeUrl}`);
            }

            const swapchianImagesBuffer = new Uint32Array(24);
            swapchianImagesBuffer[0] = this._layerId;
            xrExtension.syncSharedBufferWithNative_UINT32(XrExtensionKey.XEK_COMPOSITION_LAYER_SWAPCHAIN_IMAGES,
                XrBufferOperationType.XBOT_GET, swapchianImagesBuffer, swapchianImagesBuffer.length);
            this._swapchainImagesCount = swapchianImagesBuffer[1];
            if (this._swapchainImagesCount > 0) {
                this._rendetexturesArray = [];
                for (let i = 0; i < this._swapchainImagesCount; i++) {
                    const textureIdLow = swapchianImagesBuffer[2 + i * 2];
                    const textureIdHigh = swapchianImagesBuffer[2 + i * 2 + 1];
                    console.log(`[XRCompositionLayer] texture id.${textureIdLow}|${textureIdHigh}, index.${i}`);
                    const _colorAttachment = new gfx.ColorAttachment();
                    _colorAttachment.format = gfx.Format.RGBA8;
                    const _depthStencilAttachment = new gfx.DepthStencilAttachment();
                    _depthStencilAttachment.format = gfx.Format.DEPTH_STENCIL;
                    const passInfo = new gfx.RenderPassInfo([_colorAttachment], _depthStencilAttachment);
                    const rt: RenderTexture = new RenderTexture();
                    rt.reset({
                        width: textureWidth,
                        height: textureHeight,
                        passInfo,
                        externalResLow: textureIdLow,
                        externalResHigh: textureIdHigh,
                        externalFlag: gfx.TextureFlagBit.EXTERNAL_NORMAL,
                    });
                    this._rendetexturesArray.push(rt);
                }
            } else if (this.renderTextureCamera) {
                this.renderTextureCamera.node.active = false;
            }
        }
    }

    update (deltaTime: number) {
        if (sys.isXR && sys.isNative) {
            // update pose
            this._layerParam.position = this.node.worldPosition.clone();
            this._layerParam.orientation = this.node.worldRotation.clone();
            const buffer = this._layerParam.toTickBufferArray();
            xrExtension.syncSharedBufferWithNative_Float32(XrExtensionKey.XEK_COMPOSITION_LAYER_TICK,
                XrBufferOperationType.XBOT_SET, buffer, buffer.length);
            if (this.textureType === CxrTextureType.Dynamic) {
                const imageIndex = buffer[1];
                if (this.renderTextureCamera && this._rendetexturesArray) {
                    this.renderTextureCamera.targetTexture = this._rendetexturesArray[imageIndex];
                }
            } else if (this.textureType === CxrTextureType.Static && this.staticImage && !this.staticImageDataUploaded) {
                if (!this.staticImageData) {
                    const imagePathBuffer = this.stringToUint8Array(`@assets/${this.staticImage.nativeUrl}`);
                    const pixelsDataSize = xrExtension.syncSharedBufferWithNative_UINT8(XrExtensionKey.XEK_ASSETS_IMAGE_DATA,
                        XrBufferOperationType.XBOT_SET, imagePathBuffer, imagePathBuffer.length);
                    if (pixelsDataSize > 0) {
                        this.staticImageData = new Uint8Array(pixelsDataSize);
                    }
                }

                if (this.staticImageData) {
                    const imagePathBuffer = this.stringToUint8Array(`@assets/${this.staticImage.nativeUrl}`);
                    this.staticImageData.fill(0);
                    this.staticImageData.set(imagePathBuffer, 0);
                    const resultLength = xrExtension.syncSharedBufferWithNative_UINT8(XrExtensionKey.XEK_ASSETS_IMAGE_DATA,
                        XrBufferOperationType.XBOT_GET, this.staticImageData, imagePathBuffer.length);
                    if (resultLength > 0 && this._rendetexturesArray) {
                        const _regions: gfx.BufferTextureCopy[] = [new gfx.BufferTextureCopy()];
                        const region = _regions[0];
                        region.texExtent.width = this._rendetexturesArray[0].width;
                        region.texExtent.height = this._rendetexturesArray[0].height;
                        region.texSubres.mipLevel = 0;
                        region.texSubres.baseArrayLayer = 0;
                        const gfxTexture = this._rendetexturesArray[0].getGFXTexture();
                        if (gfxTexture) {
                            gfx.deviceManager.gfxDevice.copyBuffersToTexture([this.staticImageData], gfxTexture, _regions);
                        }
                        this.staticImageDataUploaded = true;
                    }
                }
            }
        }
    }

    private beforeDraw (): void {
        // console.error(`beforDraw:${director.getTotalFrames()}_${this.uuid}`);
    }

    private beforeFrameRender (): void {
        // console.error(`beforeFrameRender:${director.getTotalFrames()}_${this.uuid}`);
    }

    protected onDestroy (): void {
        if (sys.isXR && sys.isNative) {
            const buffer = new Uint8Array(1);
            buffer[0] = this._layerId;
            xrExtension.syncSharedBufferWithNative_UINT8(XrExtensionKey.XEK_COMPOSITION_LAYER_DESTROY, XrBufferOperationType.XBOT_SET,
                buffer, buffer.length);
        }
    }

    protected stringToUint8Array (str: string): Uint8Array {
        const arr: number[] = [];
        for (let i = 0, j = str.length; i < j; ++i) {
            arr.push(str.charCodeAt(i));
        }
        const tmpUint8Array = new Uint8Array(arr);
        return tmpUint8Array;
    }

    private isSupportStaticTexture (): boolean {
        // // >v3.7.3
        const engineVersionInfo = VERSION.split('.');
        const majorVersion: number = parseInt(engineVersionInfo[0]);
        const minjorVersion: number = parseInt(engineVersionInfo[1]);
        const patchVersion: number = parseInt(engineVersionInfo[2]);
        return (majorVersion > 3)
        || (majorVersion === 3 && minjorVersion > 7)
        || (majorVersion === 3 && minjorVersion === 7 && patchVersion > 3);
    }
}
