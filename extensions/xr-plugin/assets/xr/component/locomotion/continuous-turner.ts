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

import { _decorator, Node, Vec2, Input, input, EventHandle, EventGamepad, Vec3, Quat, misc } from 'cc';
import { LocomotionBase } from './locomotion-base';
import { XrInputDeviceType } from '../device/xr-controller';

const { ccclass, help, menu, property } = _decorator;

enum TurnDir {
    OFF = 0,
    Left = 1,
    Right = 2
}

/**
 * @en Continuous turn Driver
 * @zh 连续转弯驱动
 */
@ccclass('cc.ContinuousTurner')
@help('i18n:cc.ContinuousTurner')
@menu('XR/Locomotion/ContinuousTurner')
export class ContinuousTurner extends LocomotionBase {
    @property({ serializable: true })
    protected _turnSpeed = 60;

    private _isTurn: TurnDir = TurnDir.OFF;
    private _xrSessionNode: Node | null = null;

    @property({
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.continuous_turner.turnSpeed'
        })
    set turnSpeed (val) {
        if (val === this._turnSpeed) {
            return;
        }
        this._turnSpeed = val;
    }
    get turnSpeed () {
        return this._turnSpeed;
    }

    onEnable () {
        this._findChecker();
        input.on(Input.EventType.HANDLE_INPUT, this._dispatchEventHandleInput, this);
        input.on(Input.EventType.GAMEPAD_INPUT, this._dispatchEventHandleInput, this);
    }

    onDisable () {
        input.off(Input.EventType.HANDLE_INPUT, this._dispatchEventHandleInput, this);
        input.off(Input.EventType.GAMEPAD_INPUT, this._dispatchEventHandleInput, this);
    }

    private _dispatchEventHandleInput (event: EventHandle | EventGamepad) {
        let handleInputDevice;
        if (event instanceof EventGamepad) {
            handleInputDevice = event.gamepad;
        } else if (event instanceof EventHandle) {
            handleInputDevice = event.handleInputDevice;
        }
        let value;
        if (this.inputDevice?.inputDevice === XrInputDeviceType.Left_Hand) {
            value = handleInputDevice.leftStick.getValue();
        } else {
            value = handleInputDevice.rightStick.getValue();
        }

        if (value.equals(Vec2.ZERO)) {
            this._turnOff();
        } else {
            this._turnOn(value);
        }
    }

    private _turnOn (event: Vec2) {
        const xrAgentNode = this._checker?.XR_Agent;
        if (xrAgentNode) {
            this._xrSessionNode = xrAgentNode;
        }
        if (event.x < 0) {
            this._isTurn = TurnDir.Left;
        } else if (event.x > 0) {
            this._isTurn = TurnDir.Right;
        } else {
            this._isTurn = TurnDir.OFF;
        }
    }

    private _turnOff () {
        this._isTurn = TurnDir.OFF;
    }

    update (dt: number) {
        if (!this._xrSessionNode || this._isTurn === TurnDir.OFF) {
            return;
        }

        const out = new Quat();
        switch (this._isTurn) {
        case TurnDir.Left:
            Quat.rotateAroundLocal(out, this._xrSessionNode.rotation, Vec3.UP, misc.degreesToRadians(this._turnSpeed * dt));
            break;
        case TurnDir.Right:
            Quat.rotateAroundLocal(out, this._xrSessionNode.rotation, Vec3.UP, misc.degreesToRadians(-this._turnSpeed * dt));
            break;
        default:
            break;
        }

        this._xrSessionNode.setRotation(out);
    }
}
