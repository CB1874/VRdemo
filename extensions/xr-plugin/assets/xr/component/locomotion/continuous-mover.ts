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

import { _decorator, Node, Vec2, Input, input, EventHandle, EventGamepad, Vec3 } from 'cc';
import { XrInputDeviceType } from '../device/xr-controller';
import { LocomotionBase } from './locomotion-base';

const { ccclass, help, menu, property } = _decorator;

/**
 * @en Continuous movement driver
 * @zh 平移运动驱动
 */
@ccclass('cc.ContinuousMover')
@help('i18n:cc.ContinuousMover')
@menu('XR/Locomotion/ContinuousMover')
export class ContinuousMover extends LocomotionBase {
    @property({ serializable: true })
    protected _moveSpeed = 1;
    @property({ serializable: true })
    protected _forwardSource: Node | null = null;

    private _isMove = false;
    private _xrSessionNode: Node | null = null;
    private _move: Vec2 = new Vec2(0, 0);

    @property({
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.continuous_mover.moveSpeed'
        })
    set moveSpeed (val) {
        if (val === this._moveSpeed) {
            return;
        }
        this._moveSpeed = val;
    }
    get moveSpeed () {
        return this._moveSpeed;
    }

    @property({
        type: Node,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.continuous_mover.forwardSource'
        })
    set forwardSource (val) {
        if (val === this._forwardSource) {
            return;
        }
        this._forwardSource = val;
    }
    get forwardSource () {
        return this._forwardSource;
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
            this._MoveOff();
        } else {
            this._MoveOn(value);
        }
    }

    private _MoveOn (event: Vec2) {
        const xrAgentNode = this._checker?.XR_Agent;
        if (xrAgentNode) {
            this._xrSessionNode = xrAgentNode;
        }
        this._move.set(event.x, event.y);
        this._isMove = true;
    }

    private _MoveOff () {
        this._isMove = false;
    }

    private _getDirection (x: number, y: number, z: number) {
        const result = new Vec3(x, y, z);
        if (this._forwardSource) {
            Vec3.transformQuat(result, result, this._forwardSource.getWorldRotation());
        } else {
            Vec3.transformQuat(result, result, this.node.getWorldRotation());
        }
        return result;
    }

    update (dt: number) {
        if (!this._xrSessionNode || !this._isMove) {
            return;
        }
        const position = this._xrSessionNode.getPosition();
        Vec3.scaleAndAdd(position, position, this._getDirection(this._move.x, 0, -this._move.y), this._moveSpeed * dt);
        this._xrSessionNode.setPosition(position);
    }
}
