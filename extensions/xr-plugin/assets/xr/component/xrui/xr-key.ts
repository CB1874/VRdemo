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

import { _decorator, ccenum, Component, XrUIPressEventType, Vec3, Button, Input, Node, XrKeyboardEventType } from 'cc';
import { xrKeyboardEventInput, XrKeyCode } from './xr-keyboard-handle';
import { XrKeyboardInput } from './xr-keyboard-input';

const { ccclass, help, menu, property } = _decorator;

ccenum(XrKeyCode);

@ccclass('cc.XRKey')
@help('i18n:cc.XRKey')
@menu('XR/XRUI/XRKey')
export class XRKey extends Component {
    @property({ serializable: true })
    private _key: XrKeyCode = XrKeyCode.NONE;

    private _lowerNode: Node | null = null;
    private _capitalNode: Node | null = null;

    @property({
        type: XrKeyCode,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_key.key'
        })
    set key (val) {
        if (val === this._key) {
            return;
        }
        this._key = val;
    }
    get key () {
        return this._key;
    }

    private _button: Button | null = null;
    private _capsLock = false;
    // only input use
    private _xrKeyboardInput: XrKeyboardInput | null = null;

    onLoad () {
        this._button = this.node.getComponent(Button);
        if (this._key === XrKeyCode.NONE) {
            if (!this._xrKeyboardInput) {
                this._xrKeyboardInput = this.node.addComponent(XrKeyboardInput);
            }
        }
    }

    onEnable () {
        this._lowerNode = this.node.getChildByName('lower');
        this._capitalNode = this.node.getChildByName('capital');
        this.node.on(XrUIPressEventType.XRUI_CLICK, this._xrUIClick, this);
        this.node.on(XrUIPressEventType.XRUI_UNCLICK, this._xrUIUnClick, this);
        xrKeyboardEventInput.on(XrKeyboardEventType.XR_KEYBOARD_INIT, this._init, this);
        xrKeyboardEventInput.on(XrKeyboardEventType.XR_CAPS_LOCK, this._xrCapsLock, this);
    }

    onDisable () {
        this.node.off(XrUIPressEventType.XRUI_CLICK, this._xrUIClick, this);
        this.node.off(XrUIPressEventType.XRUI_UNCLICK, this._xrUIUnClick, this);
        xrKeyboardEventInput.off(XrKeyboardEventType.XR_KEYBOARD_INIT, this._init, this);
        xrKeyboardEventInput.off(XrKeyboardEventType.XR_CAPS_LOCK, this._xrCapsLock, this);
    }

    protected _xrUIClick () {
        if (this._key !== XrKeyCode.NONE) {
            xrKeyboardEventInput.emit(Input.EventType.KEY_DOWN, this._key);
        }
    }

    protected _xrUIUnClick (point: Vec3) {
        if (this._key === XrKeyCode.NONE) {
            this._xrKeyboardInput?.moveCursor(point);
        } else if (this._key === XrKeyCode.F1) {
            xrKeyboardEventInput.emit(XrKeyboardEventType.TO_SYMBOL, XrKeyboardEventType.TO_SYMBOL);
        } else if (this._key === XrKeyCode.F2) {
            xrKeyboardEventInput.emit(XrKeyboardEventType.TO_LATIN, XrKeyboardEventType.TO_LATIN);
        } else {
            xrKeyboardEventInput.emit(Input.EventType.KEY_UP, this._key);
            if (this._key === XrKeyCode.CAPS_LOCK) {
                xrKeyboardEventInput.emit(XrKeyboardEventType.XR_CAPS_LOCK, this._key);
            }
        }
    }

    protected _init () {
        if (this._capsLock) {
            this._xrCapsLock();
        }
    }

    protected _xrCapsLock () {
        if (!this._button) {
            return;
        }

        if (this._key === XrKeyCode.CAPS_LOCK) {
            const sprite = this._button.normalSprite;
            this._button.normalSprite = this._button.pressedSprite;
            this._button.pressedSprite = sprite;
        } else if (this._key > 64 && this._key < 91) {
            if (this._capsLock) {
                if (this._lowerNode) {
                    this._lowerNode.active = true;
                }
                if (this._capitalNode) {
                    this._capitalNode.active = false;
                }
            } else {
                if (this._lowerNode) {
                    this._lowerNode.active = false;
                }
                if (this._capitalNode) {
                    this._capitalNode.active = true;
                }
            }
        }

        this._capsLock = !this._capsLock;
    }
}
