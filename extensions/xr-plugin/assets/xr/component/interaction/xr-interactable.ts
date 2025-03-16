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

import { _decorator, Component, Node, Collider, DeviceType, math } from 'cc';
import { InteractionMask } from './interaction-mask';

const { property } = _decorator;

/**
 * @en
 * xr handle event.
 *
 * @zh
 * xr手柄事件。
 */
export class XrEventHandle extends Event {
    /**
     * @en Event trigger
     * @zh 事件触发者（左右手柄等）
     */
    deviceType: DeviceType = DeviceType.Other;
    /**
     * @en The way the interaction is triggered
     * @zh 触发交互的方式
     */
    triggerType: SelectActionTrigger_Type = SelectActionTrigger_Type.State_Change;
    /**
     * @en Collision detection point
     * @zh 碰撞检测点
     */
    hitPoint: math.Vec3 | null = null;
    /**
     * @en Controller model
     * @zh Controller模型
     */
    model: Node | null = null;
    /**
     * @en Handle events
     * @zh 手柄事件
     */
    eventHandle = 0;
    /**
     * @en Trigger Id
     * @zh 触发者Id
     */
    triggerNode: Node | null = null;
    /**
     * @en The attached node
     * @zh 被附着者节点
     */
    attachNode: Node | null = null;
    /**
     * @en Whether to force grab
     * @zh 是否强制抓取
     */
    forceGrab = true;
}

/**
 * @en The input event type
 * @zh 输入事件类型
 */
export enum XrControlEventType {
    SELECT_ENTERED = 'select-entered',
    SELECT_EXITED = 'select-exited',
    SELECT_STAY = 'select-stay',
    SELECT_CANCELED = 'select-canceled',

    ACTIVATED = 'OnActivited',
    DEACTIVITED = 'Deactivited',
    ACTIVATE_STAY = 'activite-stay',
    ACTIVATE_CANCELED = 'activate-canceled',

    UIPRESS_ENTERED = 'UI-press-entered',
    UIPRESS_EXITED = 'UI-press-exited',
    UIPRESS_STAY = 'UI-press-stay',
    UIPRESS_CANCELED = 'UI-press-canceled',

    HOVER_ENTERED = 'hover-entered',
    HOVER_EXITED = 'hover-exited',
    HOVER_STAY = 'hover-stay',
    HOVER_CANCELED = 'hover-canceled'
}

export enum StateType {
    Select = 'select',
    Activite = 'activite',
}

export enum InteractorState {
    Start = 'interactor_start',
    Stay = 'interactor_stay',
    End = 'interactor_end',
    Cancel = 'interactor_cancel'
}

export enum InteractorTriggerState {
    Select_Start = 'select_start',
    Select_Stay = 'select_stay',
    Select_End = 'select_end',
    Select_Canceled = 'select_canceled',
    Activite_Start = 'activite_start',
    Activite_Stay = 'activite_stay',
    Activite_End = 'activite_end',
    Activite_Canceled = 'activite_canceled'
}

export enum SelectActionTrigger_Type {
    State = 0,
    State_Change = 1,
    Toggle = 2,
    Sticky = 3
}

export class IXrInteractable extends Component {
    protected _colliderCom: Collider | null = null;

    protected _triggerNode: Node | null = null;

    set triggerNode (val) {
        if (val === this._triggerNode) {
            return;
        }
        this._triggerNode = val;
    }
    get triggerNode () {
        return this._triggerNode;
    }
}

export class XrInteractable extends IXrInteractable {
    @property({ serializable: true })
    protected _rayReticle: Node | null = null;
    @property({ serializable: true })
    protected _interactionLayerMask = 0xffffffff;

    @property({
        type: InteractionMask.BitMask,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_interactable.interactionLayerMask'
        })
    set interactionLayerMask (val) {
        if (val === this._interactionLayerMask) {
            return;
        }
        this._interactionLayerMask = val;
    }
    get interactionLayerMask () {
        return this._interactionLayerMask;
    }

    @property({
        type: Node,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.xr_interactable.rayReticle'
        })
    set rayReticle (val) {
        if (val === this._rayReticle) {
            return;
        }
        this._rayReticle = val;
    }
    get rayReticle () {
        return this._rayReticle;
    }

    onLoad () {
        this._colliderCom = this.node.getComponent(Collider);
        if (!this._colliderCom?.node) {
            return;
        }

        this._colliderCom.node.on(XrControlEventType.HOVER_ENTERED, this._setRayReticle, this);
        this._colliderCom.node.on(XrControlEventType.HOVER_STAY, this._setRayReticle, this);
        this._colliderCom.node.on(XrControlEventType.HOVER_EXITED, this._unsetRayReticle, this);
    }

    onDestroy () {
        if (!this._colliderCom?.node) {
            return;
        }

        this._colliderCom.node.off(XrControlEventType.HOVER_ENTERED, this._setRayReticle, this);
        this._colliderCom.node.off(XrControlEventType.HOVER_STAY, this._setRayReticle, this);
        this._colliderCom.node.off(XrControlEventType.HOVER_EXITED, this._unsetRayReticle, this);
    }

    start () {
        if (this._colliderCom) {
            this._colliderCom.setGroup(this._interactionLayerMask);
        }
    }

    protected _setRayReticle (event: XrEventHandle) {

    }

    protected _unsetRayReticle () {
        if (this._rayReticle) {
            this._rayReticle.active = false;
        }
    }
}
