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

import { _decorator, Node, Component, Label, Graphics, Input, Vec3, XrKeyboardEventType } from 'cc';
import { xrKeyboardEventInput, XrKeyCode } from './xr-keyboard-handle';

const MAX_SIZE = 2048;

enum StringChangeType {
    INIT = 0,
    DELETE = 1,
    ADD = 2
}

export class XrKeyboardInput extends Component {
    private _string = '';
    private _label: Label | null = null;
    private _cursor: Graphics | null = null;
    private _cursorNode: Node = new Node();
    private _stringWidths: number[] = [];
    private _capsLock = false;
    private _maxContextLength = 0;
    private _pos = -1;

    set maxContextLength (val) {
        this._maxContextLength = val;
    }
    get maxContextLength () {
        return this._maxContextLength;
    }

    set string (val) {
        for (let i = 0; i < val.length; i++) {
            this.addString(val[i]);
        }
    }
    get string () {
        return this._string;
    }

    onEnable () {
        this._label = this.node.getComponentInChildren(Label);
        if (this._label) {
            this._label.node.addChild(this._cursorNode);
            this._cursor = this._cursorNode.addComponent(Graphics);
            this._cursor.lineWidth = 8;
            this._cursor.color.fromHEX('#ffffff');
            this._cursor.fillColor.fromHEX('#ffffff');
            this._cursor.strokeColor.fromHEX('#ffffff');
            if (this._label.node._uiProps.uiTransformComp) {
                this._cursorNode.setPosition(0, -this._label.node._uiProps.uiTransformComp.height / 2, 0);
            }
            this._cursor.moveTo(0, -this._label.fontSize / 2);
            this._cursor.lineTo(0, this._label.fontSize / 2);
            this._cursor.stroke();
            this._cursor.fill();

            this.updateStringWidth(this._label.string, StringChangeType.INIT);
        }

        xrKeyboardEventInput.on(Input.EventType.KEY_UP, this._keyUp, this);
        xrKeyboardEventInput.on(XrKeyboardEventType.XR_CAPS_LOCK, this._xrCapsLock, this);
        xrKeyboardEventInput.on(XrKeyboardEventType.XR_KEYBOARD_INIT, this._init, this);
    }

    onDisable () {
        xrKeyboardEventInput.off(Input.EventType.KEY_UP, this._keyUp, this);
        xrKeyboardEventInput.off(XrKeyboardEventType.XR_CAPS_LOCK, this._xrCapsLock, this);
        xrKeyboardEventInput.off(XrKeyboardEventType.XR_KEYBOARD_INIT, this._init, this);
    }

    protected _init () {
        this._capsLock = false;
    }

    protected _xrCapsLock () {
        this._capsLock = !this._capsLock;
    }

    public moveCursor (point: Vec3) {
        if (this._stringWidths.length <= 0 || !this._label) {
            return;
        }
        const pos = new Vec3();
        this._label.node.inverseTransformPoint(pos, point);
        let stringWidth = 0;
        let posx = pos.x;
        // @ts-expect-error internal API usage
        if (this._label.contentWidth >= MAX_SIZE) {
            // @ts-expect-error internal API usage
            posx = pos.x + (this._label.contentWidth as number) - MAX_SIZE;
        }

        let i = 0;
        for (; i < this._stringWidths.length; i++) {
            if (this._stringWidths[i] > posx) {
                break;
            }
        }
        this._pos = i - 1;
        stringWidth = (this._pos === -1) ? 0 : this._stringWidths[this._pos];

        // @ts-expect-error internal API usage
        if (this._label.contentWidth >= MAX_SIZE) {
            // @ts-expect-error internal API usage
            stringWidth -= (this._label.contentWidth - MAX_SIZE);
        }

        this._cursorNode.setPosition(stringWidth, this._cursorNode.position.y, this._cursorNode.position.z);
    }

    protected _keyUp (key: XrKeyCode) {
        if (key === XrKeyCode.ENTER) {
            this.node.emit(XrKeyboardEventType.XR_KEYBOARD_INPUT, this._string);
        } else if (key === XrKeyCode.BACKSPACE) {
            if (this._pos >= 0) {
                this._string = this._string.substring(0, this._pos) + this._string.substring(this._pos + 1, this._string.length);
                this._pos--;
                this.updateStringWidth(this._string, StringChangeType.DELETE);
            }
        } else if (this._string.length < this._maxContextLength) {
            let code;
            if (!this._capsLock && key > 64 && key < 91) {
                code = String.fromCharCode(key + 32);
            } else if (key === XrKeyCode.CAPS_LOCK || key === XrKeyCode.SHIFT_LEFT || key === XrKeyCode.SHIFT_RIGHT) {
                return;
            } else if (key === XrKeyCode.COMMA) {
                code = String.fromCharCode(44);
            } else {
                code = String.fromCharCode(key);
            }
            this.addString(code);
        }
    }

    private addString (code: string) {
        this._string = this._string.substring(0, this._pos + 1) + code + this._string.substring(this._pos + 1, this._string.length);
        this._pos++;
        this.updateStringWidth(this._string, StringChangeType.ADD);
    }

    public updateStringWidth (str: string, type: StringChangeType) {
        if (!this._label) {
            return;
        }
        this._label.string = str;
        this._label.updateRenderData(true);
        if (type === StringChangeType.DELETE) {
            this._stringDeleteWidth();
        } else if (type === StringChangeType.ADD) {
            this._stringAddWidth();
        } else {
            this._stringInitWidth();
        }

        let stringWidth = (this._pos === -1) ? 0 : this._stringWidths[this._pos];
        // @ts-expect-error internal API usage
        stringWidth = this._label.contentWidth > MAX_SIZE ? stringWidth - (this._label.contentWidth - MAX_SIZE) : stringWidth;

        this._cursorNode.setPosition(stringWidth, this._cursorNode.position.y, this._cursorNode.position.z);
    }

    private _stringDeleteWidth () {
        let d = 0;
        if (this._pos === -1) {
            d = this._stringWidths[this._pos + 1];
        } else {
            d = this._stringWidths[this._pos + 1] - this._stringWidths[this._pos];
        }
        for (let i = this._pos + 1; i < this._stringWidths.length - 1; ++i) {
            this._stringWidths[i] = this._stringWidths[i + 1] - d;
        }
        this._stringWidths.pop();
    }

    private _stringAddWidth () {
        if (!this._label) {
            return;
        }
        if (this._stringWidths.length > 0) {
            // @ts-expect-error internal API usage
            const d = this._label.contentWidth - this._stringWidths[this._stringWidths.length - 1];
            for (let i = this._stringWidths.length - 1; i > this._pos - 1; --i) {
                if (i === 0) {
                    this._stringWidths[i] = d;
                } else {
                    this._stringWidths[i] = this._stringWidths[i - 1] + d;
                }
            }
        }
        // @ts-expect-error internal API usage
        this._stringWidths.push(this._label.contentWidth);
    }

    private _stringInitWidth () {
        this._pos = this._stringWidths.length - 1;
    }

    public clear () {
        const len = this._string.length;
        this._pos = len - 1;
        // const eventKeyboard = new EventKeyboard(XrKeyCode.BACKSPACE, Input.EventType.KEY_UP);
        for (let i = 0; i < len; i++) {
            this._keyUp(XrKeyCode.BACKSPACE);
        }
    }
}
