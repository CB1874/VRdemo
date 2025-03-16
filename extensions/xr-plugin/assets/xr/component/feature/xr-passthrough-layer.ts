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

import { _decorator, CCInteger, Component, Node, sys } from 'cc';
import { XRConfigKey, xrInterface } from '../interface/xr-interface';
import { CxrLayerType } from './xr-feature-define';
import { XrBufferOperationType, xrExtension, XrExtensionKey } from '../interface/xr-extension';

const { ccclass, property, menu } = _decorator;

class CxrPassthroughLayerParam {
    public layerType: CxrLayerType = CxrLayerType.Underlay;
    public compositionDepth = 0;
    public hidden = false;
    public textureOpacity = 1.0;

    public toBufferArray (): Float32Array {
        const buffer: Float32Array = new Float32Array(4);
        buffer[0] = this.layerType as number;
        buffer[1] = this.compositionDepth;
        buffer[2] = this.hidden ? 1 : 0;
        buffer[3] = this.textureOpacity;
        return buffer;
    }

    public print () {
        console.log(`[CxrPassthroughLayerParam] layerType:${this.layerType},compositionDepth:${this.compositionDepth
        },hidden:${this.hidden},textureOpacity:${this.textureOpacity}`);
    }
}

@ccclass('cc.XRPassThroughLayer')
@menu('XR/Extra/XRPassThroughLayer')
export class XRPassThroughLayer extends Component {
    @property
    private _layerType: CxrLayerType = CxrLayerType.Underlay;
    @property
    private _layerDepth = 0;
    @property
    private _opacity = 1;
    private _layerParam: CxrPassthroughLayerParam = new CxrPassthroughLayerParam();
    @property
    private _hidden = false;

    set Hidden (val) {
        this._hidden = val;
    }
    get Hidden () {
        return this._hidden;
    }

    @property({group: { name: 'Compositing', displayOrder: 1 }, displayName: 'Placement', type: CxrLayerType,
        tooltip: 'i18n:xr-plugin.compositionLayer.layertype'})
    set Layer (val) {
        this._layerType = val;
    }
    get Layer () {
        return this._layerType;
    }

    @property({type: CCInteger, group: { name: 'Compositing', displayOrder: 2}, displayName: 'Depth', range: [0, 65500, 1],
        tooltip: 'i18n:xr-plugin.compositionLayer.depth'})
    set Depth (val) {
        this._layerDepth = val;
    }
    get Depth () {
        return this._layerDepth;
    }

    @property({displayOrder: 3, slide: true, range: [0, 1, 0.1],
        displayName: "Opacity",
        tooltip: 'i18n:xr-plugin.passthrough.opacity'})
    set Opacity (val) {
        this._opacity = val;
    }
    get Opacity () {
        return this._opacity;
    }

    start () {
        this._layerParam.compositionDepth = this._layerDepth;
        this._layerParam.hidden = this._hidden;
        this._layerParam.layerType = this._layerType;
        this._layerParam.textureOpacity = this._opacity;
        this._layerParam.print();
        this.syncToOverlay();
        this.enablePassthroughLayer(true);
    }

    update (deltaTime: number) {
        this.syncToOverlay();
    }

    protected syncToOverlay () {
        if (sys.isXR && sys.isNative) {
            this._layerParam.compositionDepth = this._layerDepth;
            this._layerParam.hidden = this._hidden;
            this._layerParam.layerType = this._layerType;
            this._layerParam.textureOpacity = this._opacity;
            const buffer = this._layerParam.toBufferArray();
            xrExtension.syncSharedBufferWithNative_Float32(XrExtensionKey.XEK_PASSTHROUGH_LAYER_TICK,
                XrBufferOperationType.XBOT_SET, buffer, buffer.length);
        }
    }

    protected onDestroy (): void {
        this.enablePassthroughLayer(false);
    }

    protected enablePassthroughLayer (enabled: boolean) {
        if (sys.isXR && sys.isNative) {
            xrInterface.setIntConfig(XRConfigKey.FEATURE_PASSTHROUGH, enabled ? 1 : 0);
        }
    }
}
