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

import { _decorator, ccenum, Node, Collider, ITriggerEvent, ICollisionEvent } from 'cc';
import { XrInteractor } from './xr-interactor';
import { SelectActionTrigger_Type, XrControlEventType, XrInteractable } from './xr-interactable';
import { InteractorEvents } from '../event/interactor-events';

const { ccclass, help, menu, property } = _decorator;

ccenum(SelectActionTrigger_Type);

/**
 * @en
 * Interact with object directly by controller.
 * @zh
 * 直接交互器组件。
 */
@ccclass('cc.DirectInteractor')
@help('i18n:cc.DirectInteractor')
@menu('XR/Interaction/DirectInteractor')
export class DirectInteractor extends XrInteractor {
    @property({ serializable: true })
    protected _startingSelectedInteractable: Node | null = null;

    private _colliderCom: Collider | null = null;
    private _directHitCollider: Collider | null = null;

    onLoad () {
        this._event.forceGrab = true;
        this._colliderCom = this.node.getComponent(Collider);
        if (!this._colliderCom) {
            console.error('this node does not have');
        }
    }

    onEnable () {
        super.onEnable();
        if (!this._colliderCom) {
            return;
        }
        this._interactorEvents = this.getComponent(InteractorEvents);
        this._setAttachNode();
        if (this._colliderCom.isTrigger) {
            this._colliderCom.on('onTriggerEnter', this._onTriggerEnterCb, this);
            this._colliderCom.on('onTriggerStay', this._onTriggerEnterCb, this);
            this._colliderCom.on('onTriggerExit', this._onTriggerEnterCb, this);
        } else {
            this._colliderCom.on('onCollisionEnter', this._onCollisionEnterCb, this);
            this._colliderCom.on('onCollisionStay', this._onCollisionEnterCb, this);
            this._colliderCom.on('onCollisionExit', this._onCollisionEnterCb, this);
        }
    }

    onDisable () {
        super.onDisable();
        if (!this._colliderCom) {
            return;
        }
        if (this._colliderCom.isTrigger) {
            this._colliderCom.off('onTriggerEnter', this._onTriggerEnterCb, this);
            this._colliderCom.off('onTriggerStay', this._onTriggerEnterCb, this);
            this._colliderCom.off('onTriggerExit', this._onTriggerEnterCb, this);
        } else {
            this._colliderCom.off('onCollisionEnter', this._onCollisionEnterCb, this);
            this._colliderCom.off('onCollisionStay', this._onCollisionEnterCb, this);
            this._colliderCom.off('onCollisionExit', this._onCollisionEnterCb, this);
        }
    }

    protected _setAttachNode () {
        if (this._attachTransform) {
            this._event.attachNode = this._attachTransform;
        } else {
            this._event.attachNode = this.node;
        }
    }

    protected _judgeHit (type: XrControlEventType) {
        if (!this._directHitCollider) {
            return false;
        }
        // Check whether interacTable exists in the collision box
        const xrInteractable = this._directHitCollider?.getComponent(XrInteractable);
        if (xrInteractable) {
            if (type === XrControlEventType.SELECT_ENTERED) {
                this._collider = this._directHitCollider;
            } else if (type === XrControlEventType.ACTIVATED) {
                this._activateCollider = this._directHitCollider;
            }
            this._beTriggerNode = xrInteractable;
            return true;
        }

        return false;
    }

    private _onTriggerEnterCb (event: ITriggerEvent) {
        switch (event.type) {
        case 'onTriggerEnter':
            this._interactorEvents?.hoverEntered(this._event);
            this._directHitCollider = event.otherCollider;
            break;
        case 'onTriggerStay':
            this._interactorEvents?.hoverStay(this._event);
            break;
        case 'onTriggerExit':
            this._interactorEvents?.hoverExited(this._event);
            this._directHitCollider = null;
            break;
        default:
            break;
        }
    }

    private _onCollisionEnterCb (event: ICollisionEvent) {
        switch (event.type) {
        case 'onCollisionEnter':
            this._interactorEvents?.hoverEntered(this._event);
            this._directHitCollider = event.otherCollider;
            break;
        case 'onCollisionStay':
            this._interactorEvents?.hoverStay(this._event);
            break;
        case 'onCollisionExit':
            this._interactorEvents?.hoverExited(this._event);
            this._directHitCollider = null;
            break;
        default:
            break;
        }
    }

    public uiPressEnter () {
        this._directHitCollider?.node.emit(XrControlEventType.UIPRESS_ENTERED, this._event);
    }

    public uiPressExit () {
        this._directHitCollider?.node.emit(XrControlEventType.UIPRESS_EXITED, this._event);
    }
}
