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

import { _decorator, EventHandler as ComponentEventHandler } from 'cc';
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
import { FeatureEventParam, FeatureType } from '../utils/ar-defines';

const { ccclass, property } = _decorator;

@ccclass('cc.ARFeatureBase')
export abstract class ARFeatureBase {
    @property({ serializable: true })
    protected _enable = true;
    @property({ serializable: true })
    protected _trackingList: ARTrackingBase[] = [];
    @property({ serializable: true })
    protected _unsupportedEvent: ComponentEventHandler[] = [];

    @property({
        displayOrder: 1,
        readonly: true,
        tooltip: 'i18n:xr-plugin.feature.enable',
        })
    set enable (val) {
        if (val === this._enable) {
            return;
        }
        this._enable = val;
    }
    get enable () {
        return this._enable;
    }

    @property({
        type: [ARTrackingBase],
        displayOrder: 2,
        readonly: true,
        visible: (function (this: ARFeatureBase) {
            return this.isShowTrackingList;
            }),
        tooltip: 'i18n:xr-plugin.feature.tracking_List',
        })
    set tracking_List (val) {
        if (val === this._trackingList) {
            return;
        }
        this._trackingList = val;
    }
    get tracking_List () {
        return this._trackingList;
    }

    @property({
        type: [ComponentEventHandler],
        displayOrder: 10,
        tooltip: 'i18n:xr-plugin.feature.unsupportedEvent',
        })
    set unsupportedEvent (val) {
        if (val === this._unsupportedEvent) {
            return;
        }
        this._unsupportedEvent = val;
    }
    get unsupportedEvent () {
        return this._unsupportedEvent;
    }

    /**
    * @en Show tracking object list
    * @zh 是否显示追踪对象列表
    */
    public isShowTrackingList = false;

    /**
    * @en The features map
    * @zh 特征列表
    */
    protected _features: Map<string, FeatureEventParam> = new Map();

    /**
    * @en The feature type
    * @zh 特征类型
    */
    public type = FeatureType.None;

    /**
    * @en
    * @zh 编辑器模式下，是否持有此特征
    */
    @property({ serializable: true, visible:false})
    public canUse = false;

    /**
    * @en get feature data
    * @zh 获取特征数据
    */
    public abstract getConfig();

    /**
    * @en reset feature data
    * @zh 重置特征数据
    */
    public resetConfig () {
        this.tracking_List = [];
        this.unsupportedEvent = [];
        this._features.clear();
        this.canUse = false;
        this.enable = false;
    }

    /**
    * @en update feature data
    * @zh 更新特征数据
    */
    public updateFeature (event: FeatureEventParam) {
        if (event.canUse) {
            this._features[event.uuid] = event;
        } else {
            delete this._features[event.uuid];
        }

        this.canUse = Object.keys(this._features).length > 0;
        this.enable = this.canUse;
    }

    public getNativeFallBack () {
        let enableNativeFallBack = false;
        for (const key in this._features) {
            if (Object.prototype.hasOwnProperty.call(this._features, key)) {
                const element = this._features[key];
                if (element.enableNativeFallBack) {
                    enableNativeFallBack = true;
                    break;
                }
            }
        }
        return enableNativeFallBack;
    }

    public getWebFallBack () {
        let enableWebFallBack = false;
        for (const key in this._features) {
            if (Object.prototype.hasOwnProperty.call(this._features, key)) {
                const element = this._features[key];
                if (element.enableWebFallBack) {
                    enableWebFallBack = true;
                    break;
                }
            }
        }
        return enableWebFallBack;
    }

    public emitUnsupportedEvent () {
        ComponentEventHandler.emitEvents(this.unsupportedEvent, this);
    }
}
