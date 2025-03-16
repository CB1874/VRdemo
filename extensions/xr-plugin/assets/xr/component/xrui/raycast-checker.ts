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

import { _decorator, Component, Collider, XrUIPressEvent, BoxCollider, UITransform, XrUIPressEventType } from 'cc';
import { XrControlEventType, XrEventHandle } from '../interaction/xr-interactable';

const { ccclass, help, menu, executeInEditMode } = _decorator;

/**
 * @en Check XR UI collide with raycast
 * @zh XRUI射线碰撞检测
 */
@ccclass('cc.RaycastChecker')
@help('i18n:cc.RaycastChecker')
@menu('XR/XRUI/RaycastChecker')
@executeInEditMode
export class RaycastChecker extends Component {
    private _collider: Collider | null = null;
    private _event: XrUIPressEvent = new XrUIPressEvent('XrUIPressEvent');
    private _hoverState = '';
    private _pressState = '';
    private _hasHoverEnter = false;

    onLoad () {
        this._event.target = this.node;
        this._event.currentTarget = this.node;
        if (this.node.getComponent(Collider)) {
            return;
        }
        const collider = this.node.addComponent(BoxCollider);
        const uiTransform = this.node.getComponent(UITransform);
        if (uiTransform) {
            collider.center.set(0, 0, 0);
            collider.size.set(uiTransform.width, uiTransform.height, 0.01);
        }
    }

    onEnable () {
        this._collider = this.node.getComponent(Collider);
        if (this._collider) {
            this._collider.node.on(XrControlEventType.HOVER_ENTERED, this._hoverEnter, this);
            this._collider.node.on(XrControlEventType.HOVER_EXITED, this._hoverExit, this);
            this._collider.node.on(XrControlEventType.HOVER_STAY, this._hoverStay, this);
            this._collider.node.on(XrControlEventType.UIPRESS_ENTERED, this._uiPressEnter, this);
            this._collider.node.on(XrControlEventType.UIPRESS_EXITED, this._uiPressExit, this);
        }
    }

    onDisable () {
        if (this._collider) {
            this._collider.node.off(XrControlEventType.HOVER_ENTERED, this._hoverEnter, this);
            this._collider.node.off(XrControlEventType.HOVER_EXITED, this._hoverExit, this);
            this._collider.node.off(XrControlEventType.HOVER_STAY, this._hoverStay, this);
            this._collider.node.off(XrControlEventType.UIPRESS_ENTERED, this._uiPressEnter, this);
            this._collider.node.off(XrControlEventType.UIPRESS_EXITED, this._uiPressExit, this);
        }
        this._hasHoverEnter = false;
        this._hoverState = XrControlEventType.HOVER_EXITED;
    }

    private _hoverEnter (event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        if (event.hitPoint) {
            this._event.hitPoint.set(event.hitPoint);
        }
        this._hoverState = XrControlEventType.HOVER_ENTERED;
    }

    private _hoverExit () {
        this._hoverState = XrControlEventType.HOVER_EXITED;
    }

    private _hoverStay (event: XrEventHandle) {
        if (this._hasHoverEnter) {
            this._event.deviceType = event.deviceType;
            if (event.hitPoint) {
                this._event.hitPoint.set(event.hitPoint);
            }
            this._hoverState = XrControlEventType.HOVER_STAY;
        }
    }

    private _uiPressEnter (event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        if (event.hitPoint) {
            this._event.hitPoint.set(event.hitPoint);
        }
        this._pressState = XrControlEventType.UIPRESS_ENTERED;
    }

    private _uiPressExit (event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        if (event.hitPoint) {
            this._event.hitPoint.set(event.hitPoint);
        }
        this._pressState = XrControlEventType.UIPRESS_EXITED;
    }

    update () {
        if (this._hoverState === XrControlEventType.HOVER_ENTERED) {
            this.node.emit(XrUIPressEventType.XRUI_HOVER_ENTERED, this._event);
            this._hasHoverEnter = true;
        } else if (this._hoverState === XrControlEventType.HOVER_EXITED) {
            this.node.emit(XrUIPressEventType.XRUI_HOVER_EXITED, this._event);
            this._hasHoverEnter = false;
        } else if (this._hoverState === XrControlEventType.HOVER_STAY) {
            this.node.emit(XrUIPressEventType.XRUI_HOVER_STAY, this._event);
        }
        this._hoverState = '';

        if (this._pressState === XrControlEventType.UIPRESS_ENTERED) {
            this.node.emit(XrUIPressEventType.XRUI_CLICK, this._event);
        } else if (this._pressState === XrControlEventType.UIPRESS_EXITED) {
            this.node.emit(XrUIPressEventType.XRUI_UNCLICK, this._event.hitPoint);
        }
        this._pressState = '';
    }
}
