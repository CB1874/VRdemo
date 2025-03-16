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

import { _decorator, Component, Node, MeshRenderer, Texture2D, ImageAsset, sys, native, XrUIPressEventType, Vec3, Vec2 } from 'cc';
import { XrEventHandle } from '../interaction/xr-interactable';

const { ccclass, property, menu } = _decorator;

@ccclass('cc.XRWebView')
@menu('XR/Extra/XRWebView')
export class XRWebView extends Component {
    public static XR_WEBVIEW_EVENT_NAME = 'xr-webview-';
    public static XR_WEBVIEW_EVENT_TAG_TO_ADD = 'to-add';
    public static XR_WEBVIEW_EVENT_TAG_TO_REMOVE = 'to-remove';
    public static XR_WEBVIEW_EVENT_TAG_ADDED = 'added';
    public static XR_WEBVIEW_EVENT_TAG_REMOVED = 'removed';
    public static XR_WEBVIEW_EVENT_TAG_TEXTUREINFO = 'textureinfo';
    public static XR_WEBVIEW_EVENT_TAG_HOVER = 'hover';
    public static XR_WEBVIEW_EVENT_TAG_CLICK_DOWN = 'click-down';
    public static XR_WEBVIEW_EVENT_TAG_CLICK_UP = 'click-up';
    public static XR_WEBVIEW_EVENT_TAG_GOFORWARD = 'go-forward';
    public static XR_WEBVIEW_EVENT_TAG_GOBACK = 'go-back';
    public static XR_WEBVIEW_EVENT_TAG_LOADURL = 'load-url';
    public static XR_WEBVIEW_EVENT_TAG_RELOAD= 'reload';

    /**
     * @en
     * The Renderer where the Video Player component renders its images.
     * When set to None, the Renderer on the same node as the Video Player component is used.
     */
    @property({ type: MeshRenderer, displayName: 'Content', tooltip: 'i18n:xr-plugin.webview.content' })
    private renderer: MeshRenderer | null = null;
    @property({ tooltip: 'i18n:xr-plugin.webview.url' })
    get url () {
        return this._url;
    }
    set url (value: string) {
        this._url = value;
        this.loadUrl(this._url);
    }

    @property({ serializable: true })
    private _url = '';
    private _videoTexture: Texture2D | null = null;
    private _textureWidth = 1920;
    private _textureHeight = 1080;
    private _eventName = '';
    private _eventUniqeueId = 0;
    private _localPoint = new Vec3();

    static webViewUniqueId = 0;
    onLoad () {
        this._eventUniqeueId = XRWebView.webViewUniqueId;
        this._eventName = `${XRWebView.XR_WEBVIEW_EVENT_NAME}${this._eventUniqeueId}`;
        XRWebView.webViewUniqueId++;
        if (XRWebView.webViewUniqueId === 3) {
            console.error('Currently a maximum of 3 XRWebView components can be used at the same time !!!');
        }
    }

    start () {
        if (!this.renderer) {
            this.renderer = this.getComponent(MeshRenderer);
            if (!this.renderer) {
                console.error('Must has a valid MeshRenderer component!!!');
            }
        }

        if (sys.isNative) {
            native.jsbBridgeWrapper.addNativeEventListener(this._eventName, (data: string) => {
                if (data === XRWebView.XR_WEBVIEW_EVENT_TAG_ADDED) {
                    this.createVideoTexture(this._textureWidth, this._textureHeight);
                } else if (data === XRWebView.XR_WEBVIEW_EVENT_TAG_REMOVED) {
                    //
                }
            });
            const eventArg = `${XRWebView.XR_WEBVIEW_EVENT_TAG_TO_ADD}&${this._textureWidth}&${this._textureHeight}&${this._url}`;
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, eventArg);
        }
    }

    createVideoTexture (videoSourceWidth: number, videoSourceHeight: number): void {
        console.log('createVideoTexture');
        const textureWidth: number = videoSourceWidth;
        const textureHeight: number = videoSourceHeight;

        let recreateTexture = false;
        if (this._videoTexture === null
            || (this._videoTexture && ((this._videoTexture.width !== textureWidth) || (this._videoTexture.height !== textureHeight)))) {
            recreateTexture = true;
        }

        if (recreateTexture) {
            if (this._videoTexture) {
                this._videoTexture.destroy();
            }
            // create texture 2d
            this._videoTexture = new Texture2D();
            this._videoTexture._uuid = 'xr-video-texture';
            const blackValueView = new Uint8Array(textureWidth * textureHeight * 4);
            const blackMemImageSource: any = {
                width: textureWidth,
                height: textureHeight,
                _data: blackValueView,
                _compressed: false,
                format: Texture2D.PixelFormat.RGBA8888,
            };
            const imgAsset = new ImageAsset(blackMemImageSource);
            this._videoTexture.image = imgAsset;
            this.renderer?.material?.setProperty('mainTexture', this._videoTexture);
            console.log(`create video texture :${textureWidth}x${textureHeight} | ${this._videoTexture?.getGFXTexture()?.getGLTextureHandle()}`);
        }

        if (sys.isNative) {
            const texture = this._videoTexture?.getGFXTexture();
            if (texture) {
                const eventArg = `${XRWebView.XR_WEBVIEW_EVENT_TAG_TEXTUREINFO}&${texture.getGLTextureHandle()}&${textureWidth}&${textureHeight}`;
                native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, eventArg);
            }
        }
    }

    public onDestroy () {
        if (sys.isNative) {
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, XRWebView.XR_WEBVIEW_EVENT_TAG_TO_REMOVE);
            native.jsbBridgeWrapper.removeAllListenersForEvent(this._eventName);
            XRWebView.webViewUniqueId--;
        }
    }

    onEnable () {
        this.renderer?.node.on(XrUIPressEventType.XRUI_HOVER_STAY, this.onHoverStay, this);
        this.renderer?.node.on(XrUIPressEventType.XRUI_CLICK, this.onClickDown, this);
        this.renderer?.node.on(XrUIPressEventType.XRUI_UNCLICK, this.onClickUp, this);
    }

    onDisable () {
        this.renderer?.node.off(XrUIPressEventType.XRUI_HOVER_STAY, this.onHoverStay, this);
        this.renderer?.node.off(XrUIPressEventType.XRUI_CLICK, this.onClickDown, this);
        this.renderer?.node.off(XrUIPressEventType.XRUI_UNCLICK, this.onClickUp, this);
    }

    calculateClickUVPostion (hitPoint: Vec3): Vec2 {
        if (this.renderer) {
            const matInv = this.renderer.node.getWorldMatrix().clone().invert();
            Vec3.transformMat4(this._localPoint, hitPoint, matInv);
            return new Vec2(this._localPoint.x + 0.5, this._localPoint.y + 0.5);
        }
        return Vec2.ZERO;
    }

    private onHoverStay (event: XrEventHandle) {
        if (this.renderer && event.hitPoint && sys.isNative) {
            const uv  = this.calculateClickUVPostion(event.hitPoint);
            const eventArg = `${XRWebView.XR_WEBVIEW_EVENT_TAG_HOVER}&${uv.x}&${uv.y}`;
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, eventArg);
        }
    }

    private onClickDown (event: XrEventHandle) {
        if (this.renderer && event.hitPoint && sys.isNative) {
            const uv  = this.calculateClickUVPostion(event.hitPoint);
            const eventArg = `${XRWebView.XR_WEBVIEW_EVENT_TAG_CLICK_DOWN}&${uv.x}&${uv.y}`;
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, eventArg);
        }
    }

    private onClickUp (hitPoint: Vec3) {
        if (this.renderer && sys.isNative) {
            const uv  = this.calculateClickUVPostion(hitPoint);
            const eventArg = `${XRWebView.XR_WEBVIEW_EVENT_TAG_CLICK_UP}&${uv.x}&${uv.y}`;
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, eventArg);
        }
    }

    public goBack () {
        if (sys.isNative) {
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, XRWebView.XR_WEBVIEW_EVENT_TAG_GOBACK);
        }
    }

    public goForward () {
        if (sys.isNative) {
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, XRWebView.XR_WEBVIEW_EVENT_TAG_GOFORWARD);
        }
    }

    public loadUrl (url: string) {
        if (sys.isNative) {
            const eventArg = `${XRWebView.XR_WEBVIEW_EVENT_TAG_LOADURL}&${url}`;
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, eventArg);
        }
    }

    public reload () {
        if (sys.isNative) {
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, XRWebView.XR_WEBVIEW_EVENT_TAG_RELOAD);
        }
    }
}
