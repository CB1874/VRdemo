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

import { _decorator, ccenum, Node, input, Input, EventHandle, EventGamepad, Vec2, Quat, Vec3, misc } from 'cc';
import { LocomotionBase } from './locomotion-base';
import { XrInputDeviceType } from '../device/xr-controller';

const { ccclass, help, menu, property } = _decorator;

enum EnableTurnAround_Type {
    ON = 0,
    OFF = 1
}

enum Trigger_Type {
    THUMBSTICK_MOVE = 0,
}

ccenum(EnableTurnAround_Type);
ccenum(Trigger_Type);

/**
 * @en
 * Sharp turn control
 * @zh
 * 瞬间转向驱动
 */
@ccclass('cc.SharpTurner')
@help('i18n:cc.SharpTurner')
@menu('XR/Locomotion/SharpTurner')
export class SharpTurner extends LocomotionBase {
    @property({ serializable: true })
    protected _turnAngle = 45;
    @property({ serializable: true })
    protected _enableTurnAround: EnableTurnAround_Type = EnableTurnAround_Type.ON;
    @property({ serializable: true })
    protected _activationTimeout = 0.5;

    private _waitEnd = true;
    private _xrSessionNode: Node | null = null;
    private _stickClickState = 0;

    @property({
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.sharp_turner.turnAngle'
        })
    set turnAngle (val) {
        if (val === this._turnAngle) {
            return;
        }
        this._turnAngle = val;
    }
    get turnAngle () {
        return this._turnAngle;
    }

    @property({
        type: EnableTurnAround_Type,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.sharp_turner.enableTurnAround'
        })
    set enableTurnAround (val) {
        if (val === this._enableTurnAround) {
            return;
        }
        this._enableTurnAround = val;
    }
    get enableTurnAround () {
        return this._enableTurnAround;
    }

    @property({
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.sharp_turner.activationTimeout'
        })
    set activationTimeout (val) {
        if (val === this._activationTimeout) {
            return;
        }
        this._activationTimeout = val;
    }
    get activationTimeout () {
        return this._activationTimeout;
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
        let stickValue;
        let stickClick;
        if (this.inputDevice?.inputDevice === XrInputDeviceType.Left_Hand) {
            stickValue = handleInputDevice.leftStick.getValue();
            if (this._enableTurnAround === EnableTurnAround_Type.ON) {
                if (event instanceof EventGamepad) {
                    stickClick = handleInputDevice.buttonL3.getValue();
                } else {
                    stickClick = handleInputDevice.buttonLeftStick.getValue();
                }
            }
        } else {
            stickValue = handleInputDevice.rightStick.getValue();
            if (this._enableTurnAround === EnableTurnAround_Type.ON) {
                if (event instanceof EventGamepad) {
                    stickClick = handleInputDevice.buttonR3.getValue();
                } else {
                    stickClick = handleInputDevice.buttonRightStick.getValue();
                }
            }
        }

        this._turnMove(stickValue);
        if (!this._stickClickState && stickClick) {
            this._turnAround();
        }
        this._stickClickState = stickClick;
    }

    private _turnMove (event: Vec2) {
        if (event.x === 0) {
            return;
        }
        const xrAgentNode = this._checker?.XR_Agent;
        if (xrAgentNode) {
            this._xrSessionNode = xrAgentNode;
        }
        if (!this._xrSessionNode || !this._waitEnd) {
            return;
        }
        const out = new Quat();
        if (event.x < 0) {
            Quat.rotateAround(out, this._xrSessionNode.rotation, Vec3.UP, misc.degreesToRadians(this._turnAngle));
        } else if (event.x > 0) {
            Quat.rotateAround(out, this._xrSessionNode.rotation, Vec3.UP, misc.degreesToRadians(-this._turnAngle));
        }
        this._xrSessionNode.setRotation(out);
        // delay time
        this._waitEnd = false;
        this.scheduleOnce(() => {
            this._waitTimeout();
        }, this._activationTimeout);
    }

    private _turnAround () {
        const xrAgentNode = this._checker?.XR_Agent;
        if (xrAgentNode) {
            this._xrSessionNode = xrAgentNode;
        }
        if (!this._xrSessionNode) {
            return;
        }
        const out = new Quat();
        Quat.rotateAround(out, this._xrSessionNode.rotation, Vec3.UP, misc.degreesToRadians(180));
        this._xrSessionNode.setRotation(out);
    }

    private _waitTimeout () {
        this._waitEnd = true;
    }
}
