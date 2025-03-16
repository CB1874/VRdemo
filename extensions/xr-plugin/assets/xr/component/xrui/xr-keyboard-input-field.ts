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

import { _decorator, Node, Component, Input, XrKeyboardEventType } from 'cc';
import { XRKeyboard } from './xr-keyboard';
import { xrKeyboardEventInput, XrKeyCode } from './xr-keyboard-handle';
import { XrKeyboardInput } from './xr-keyboard-input';

const { ccclass, help, menu, property } = _decorator;

@ccclass('cc.XRKeyboardInputField')
@help('i18n:cc.XRKeyboardInputField')
@menu('XR/XRUI/XRKeyboardInputField')
export class XRKeyboardInputField extends Component {
    @property({ serializable: true })
    private _suspendTransform: Node | null = null;
    @property({ serializable: true })
    private _xrKeyboard: XRKeyboard | null = null;

    @property({
        type: Node,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_keyboard_input_field.suspendTransform'
        })
    set suspendTransform (val) {
        if (val === this._suspendTransform) {
            return;
        }
        this._suspendTransform = val;
    }
    get suspendTransform () {
        return this._suspendTransform;
    }

    @property({
        type: XRKeyboard,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.xr_keyboard_input_field.xRKeyboard'
        })
    set xRKeyboard (val) {
        if (val === this._xrKeyboard) {
            return;
        }
        this._xrKeyboard = val;
    }
    get xRKeyboard () {
        return this._xrKeyboard;
    }

    private _keyboardNode: Node | null = null;
    private _xrKeyboardInput: XrKeyboardInput | null = null;
    private _hideFlag = false;

    onEnable () {
        if (this._xrKeyboard) {
            this._xrKeyboard.node.active = false;
        }
        this.node.on('xr-editing-did-began', this._show, this);
    }

    public onDisable () {
        this.node.off('xr-editing-did-began', this._show, this);
        this._hide();
    }

    private _show (len: number, str: string) {
        if (this._xrKeyboard && this._suspendTransform) {
            if (this._keyboardNode) {
                return;
            } else {
                this._keyboardNode = this._xrKeyboard.getXRKeyboardNode();
                if (this._keyboardNode) {
                    this._suspendTransform.addChild(this._keyboardNode);
                    this._xrKeyboard.occupy = true;
                    this._xrKeyboard.node.active = true;
                    const inputNode = this._xrKeyboard.node.getChildByName('input');
                    if (inputNode) {
                        this._xrKeyboardInput = inputNode.getComponentInChildren(XrKeyboardInput);
                        if (this._xrKeyboardInput) {
                            this._xrKeyboardInput.maxContextLength = len;
                            this._xrKeyboardInput.string = str;
                            this._xrKeyboardInput.node.on(XrKeyboardEventType.XR_KEYBOARD_INPUT, this._xrKeyBoardInput, this);
                        }
                    }
                    this._xrKeyboard.showKeyboard();
                } else {
                    return;
                }
            }
        }

        xrKeyboardEventInput.on(Input.EventType.KEY_UP, this._xrKeyBoardUp, this);
        xrKeyboardEventInput.emit(XrKeyboardEventType.XR_KEYBOARD_INIT);
    }

    protected _xrKeyBoardUp (key: XrKeyCode) {
        if (key === XrKeyCode.ENTER) {
            if (this._xrKeyboard) {
                this._xrKeyboard.commitText();
            }
            this._hideFlag = true;
        } else if (key === XrKeyCode.HIDE) {
            this._hideFlag = true;
        }
    }

    update () {
        if (this._hideFlag) {
            this._hide();
            this._hideFlag = false;
        }
    }

    private _hide () {
        if (this._xrKeyboard) {
            this._xrKeyboard.occupy = false;
            this._xrKeyboard.node.active = false;
            this._xrKeyboard.hideKeyboard();
            this._keyboardNode = null;
        }

        if (this._xrKeyboardInput) {
            this._xrKeyboardInput.node.off(XrKeyboardEventType.XR_KEYBOARD_INPUT, this._xrKeyBoardInput, this);
            this._xrKeyboardInput.clear();
        }

        xrKeyboardEventInput.off(Input.EventType.KEY_UP, this._xrKeyBoardUp, this);
    }

    private _xrKeyBoardInput (str: string) {
        this.node.emit(XrKeyboardEventType.XR_KEYBOARD_INPUT, str);
    }
}
