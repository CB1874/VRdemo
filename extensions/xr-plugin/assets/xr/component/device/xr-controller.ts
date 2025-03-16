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

import { _decorator, Component, ccenum, Node, input, Input, EventGamepad, EventHandle, DeviceType, CCFloat, Vec2 } from 'cc';
import { XrEventHandle } from '../interaction/xr-interactable';
import { XrInteractor } from '../interaction/xr-interactor';

const { ccclass, help, menu, property, executeInEditMode } = _decorator;

export enum XrEventTypeLeft {
    BUTTON_X = 0,
    BUTTON_Y = 2,
    TRIGGER_LEFT = 4,
    GRIP_LEFT = 6,
    THUMBSTICK_LEFT = 8,
    TRIGGER_BTN_LEFT = 10
}

export enum XrEventTypeRight {
    BUTTON_A = 1,
    BUTTON_B = 3,
    TRIGGER_RIGHT = 5,
    GRIP_RIGHT = 7,
    THUMBSTICK_RIGHT = 9,
    TRIGGER_BTN_RIGHT = 11
}

export enum XrInputDeviceType {
    Left_Hand,
    Right_Hand
}

enum InteractorType {
    Start = 0,
    Stay = 1,
    End = 2
}

ccenum(XrEventTypeLeft);
ccenum(XrEventTypeRight);
ccenum(XrInputDeviceType);

export enum InteractorEventType {
    Select = 0,
    Activate = 1,
    UIPress = 2
}

export type XrEventType = XrEventTypeLeft | XrEventTypeRight;

export enum XrEventActionType {
    KEY_DOWN,
    KEY_UP,
    KEY_PRESSING,
    TOUCH_DOWN,
    TOUCH_UP,
    TOUCHING
}

export class XrInputAction {
    public inputSourceType: XrInputDeviceType | null = null;
    public eventType: XrEventType | null = null;
    public keyEventActionType: XrEventActionType | null = null;
    public touchEventActionType: XrEventActionType | null = null;
    public eventValue = 0;
    public isEventChanged = false;
    public touchPosition: Vec2 = new Vec2();
    constructor (deviceType: XrInputDeviceType) {
        this.inputSourceType = deviceType;
    }
}

/**
 * @en
 * Accept input from VR device control and map to interactive action.
 * @zh
 * 控制器抽象组件
 */
@ccclass('cc.XRController')
@help('i18n:cc.XRController')
@menu('XR/Device/XRController')
@executeInEditMode
export class XRController extends Component {
    @property({ serializable: true })
    protected _inputDevice: XrInputDeviceType = XrInputDeviceType.Left_Hand;

    @property({ serializable: true })
    protected _selectActionLeft: XrEventTypeLeft = XrEventTypeLeft.GRIP_LEFT;
    @property({ serializable: true })
    protected _selectActionRight: XrEventTypeRight = XrEventTypeRight.GRIP_RIGHT;

    @property({ serializable: true })
    protected _activateActionLeft: XrEventTypeLeft = XrEventTypeLeft.TRIGGER_LEFT;
    @property({ serializable: true })
    protected _activateActionRight: XrEventTypeRight = XrEventTypeRight.TRIGGER_RIGHT;

    @property({ serializable: true })
    protected _UIPressActionLeft: XrEventTypeLeft = XrEventTypeLeft.TRIGGER_LEFT;
    @property({ serializable: true })
    protected _UIPressActionRight: XrEventTypeRight = XrEventTypeRight.TRIGGER_RIGHT;

    @property({ serializable: true })
    protected _axisToPressThreshold = 0.1;

    @property({ serializable: true })
    protected _model: Node | null = null;

    private _xrEventHandle: XrEventHandle = new XrEventHandle('xrEventHandle');
    private _xrInteractor: XrInteractor | null = null;
    private _selectState: InteractorType = InteractorType.End;
    private _activateState: InteractorType = InteractorType.End;
    private _uiPressState: InteractorType = InteractorType.End;

    private _leftInputActionMap: Map<XrEventTypeLeft, XrInputAction> = new Map<XrEventTypeLeft, XrInputAction>();
    private _rightInputActionMap: Map<XrEventTypeRight, XrInputAction> = new Map<XrEventTypeRight, XrInputAction>();
    private _isSimulateKeyInput = false;

    @property({
        type: XrInputDeviceType,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_controller.inputDevice'
        })
    set inputDevice (val) {
        if (val === this._inputDevice) {
            return;
        }
        this._inputDevice = val;
    }
    get inputDevice () {
        return this._inputDevice;
    }

    @property({
        type: XrEventTypeLeft,
        displayName: "SelectAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Left_Hand;
            }),
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.xr_controller.selectActionLeft'
        })
    set selectActionLeft (val) {
        if (val === this._selectActionLeft) {
            return;
        }
        this._selectActionLeft = val;
    }
    get selectActionLeft () {
        return this._selectActionLeft;
    }

    @property({
        type: XrEventTypeLeft,
        displayName: "ActivateAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Left_Hand;
            }),
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.xr_controller.activateActionLeft'
        })
    set activateActionLeft (val) {
        if (val === this._activateActionLeft) {
            return;
        }
        this._activateActionLeft = val;
    }
    get activateActionLeft () {
        return this._activateActionLeft;
    }

    @property({
        type: XrEventTypeLeft,
        displayName: "UIPressAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Left_Hand;
            }),
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.xr_controller.UIPressActionLeft'
        })
    set UIPressActionLeft (val) {
        if (val === this._UIPressActionLeft) {
            return;
        }
        this._UIPressActionLeft = val;
    }
    get UIPressActionLeft () {
        return this._UIPressActionLeft;
    }

    @property({
        type: XrEventTypeRight,
        displayName: "SelectAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Right_Hand;
            }),
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.xr_controller.selectActionRight'
        })
    set selectActionRight (val) {
        if (val === this._selectActionRight) {
            return;
        }
        this._selectActionRight = val;
    }
    get selectActionRight () {
        return this._selectActionRight;
    }

    @property({
        type: XrEventTypeRight,
        displayName: "ActivateAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Right_Hand;
            }),
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.xr_controller.activateActionRight'
        })
    set activateActionRight (val) {
        if (val === this._activateActionRight) {
            return;
        }
        this._activateActionRight = val;
    }
    get activateActionRight () {
        return this._activateActionRight;
    }

    @property({
        type: XrEventTypeRight,
        displayName: "UIPressAction",
        visible: (function (this: XRController) {
            return this._inputDevice === XrInputDeviceType.Right_Hand;
            }),
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.xr_controller.UIPressActionRight'
        })
    set UIPressActionRight (val) {
        if (val === this._UIPressActionRight) {
            return;
        }
        this._UIPressActionRight = val;
    }
    get UIPressActionRight () {
        return this._UIPressActionRight;
    }

    @property({
        type: CCFloat,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.xr_controller.axisToPressThreshold'
        })
    set axisToPressThreshold (val) {
        if (val === this._axisToPressThreshold) {
            return;
        }
        this._axisToPressThreshold = val;
    }
    get axisToPressThreshold () {
        return this._axisToPressThreshold;
    }

    @property({
        type: Node,
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.xr_controller.model'
        })
    set model (val) {
        if (val === this._model) {
            return;
        }
        this._model = val;
    }
    get model () {
        return this._model;
    }

    onLoad () {
        this._leftInputActionMap.set(XrEventTypeLeft.BUTTON_X, new XrInputAction(XrInputDeviceType.Left_Hand));
        this._leftInputActionMap.set(XrEventTypeLeft.BUTTON_Y, new XrInputAction(XrInputDeviceType.Left_Hand));
        this._leftInputActionMap.set(XrEventTypeLeft.TRIGGER_LEFT, new XrInputAction(XrInputDeviceType.Left_Hand));
        this._leftInputActionMap.set(XrEventTypeLeft.GRIP_LEFT, new XrInputAction(XrInputDeviceType.Left_Hand));
        this._leftInputActionMap.set(XrEventTypeLeft.THUMBSTICK_LEFT, new XrInputAction(XrInputDeviceType.Left_Hand));
        this._leftInputActionMap.set(XrEventTypeLeft.TRIGGER_BTN_LEFT, new XrInputAction(XrInputDeviceType.Left_Hand));

        this._rightInputActionMap.set(XrEventTypeRight.BUTTON_A, new XrInputAction(XrInputDeviceType.Right_Hand));
        this._rightInputActionMap.set(XrEventTypeRight.BUTTON_B, new XrInputAction(XrInputDeviceType.Right_Hand));
        this._rightInputActionMap.set(XrEventTypeRight.TRIGGER_RIGHT, new XrInputAction(XrInputDeviceType.Right_Hand));
        this._rightInputActionMap.set(XrEventTypeRight.GRIP_RIGHT, new XrInputAction(XrInputDeviceType.Right_Hand));
        this._rightInputActionMap.set(XrEventTypeRight.THUMBSTICK_RIGHT, new XrInputAction(XrInputDeviceType.Right_Hand));
        this._rightInputActionMap.set(XrEventTypeRight.TRIGGER_BTN_RIGHT, new XrInputAction(XrInputDeviceType.Right_Hand));

        if (this.model) {
            const position = this.model.position;
            const rotation = this.model.rotation;
            const scale = this.model.scale;
            this.node.addChild(this.model);
            this.model.setPosition(position);
            this.model.setRotation(rotation);
            this.model.setScale(scale);
            this._xrEventHandle.model = this.model;
        }
    }

    public onEnable () {
        this._isSimulateKeyInput = false;
        input.on(Input.EventType.HANDLE_INPUT, this._dispatchEventHandleInput, this);
        input.on(Input.EventType.GAMEPAD_INPUT, this._dispatchEventHandleInput, this);

        this._xrInteractor = this.getComponent(XrInteractor);
        if (this._inputDevice === XrInputDeviceType.Left_Hand) {
            this._xrEventHandle.deviceType = DeviceType.Left;
            if (this._xrInteractor) {
                this._xrInteractor.event.deviceType = DeviceType.Left;
            }
        } else if (this._inputDevice === XrInputDeviceType.Right_Hand) {
            this._xrEventHandle.deviceType = DeviceType.Right;
            if (this._xrInteractor) {
                this._xrInteractor.event.deviceType = DeviceType.Right;
            }
        }
    }

    public onDisable () {
        input.off(Input.EventType.HANDLE_INPUT, this._dispatchEventHandleInput, this);
        input.off(Input.EventType.GAMEPAD_INPUT, this._dispatchEventHandleInput, this);
    }

    private _dispatchEventHandleInput (event: EventHandle | EventGamepad) {
        let handleInputDevice: any = null;
        let isGamepadEvent = false;
        if (event instanceof EventGamepad) {
            isGamepadEvent = true;
            handleInputDevice = event.gamepad;
            if (this._inputDevice === XrInputDeviceType.Left_Hand) {
                this._handleEventGamepad(InteractorEventType.Select, this.selectActionLeft, handleInputDevice);
                this._handleEventGamepad(InteractorEventType.Activate, this.activateActionLeft, handleInputDevice);
                this._handleEventGamepad(InteractorEventType.UIPress, this.UIPressActionLeft, handleInputDevice);
            } else if (this._inputDevice === XrInputDeviceType.Right_Hand) {
                this._handleEventGamepad(InteractorEventType.Select, this.selectActionRight, handleInputDevice);
                this._handleEventGamepad(InteractorEventType.Activate, this.activateActionRight, handleInputDevice);
                this._handleEventGamepad(InteractorEventType.UIPress, this.UIPressActionRight, handleInputDevice);
            }
        } else if (event instanceof EventHandle) {
            isGamepadEvent = false;
            handleInputDevice = event.handleInputDevice;
            if (this._inputDevice === XrInputDeviceType.Left_Hand) {
                this._handleEventHandle(InteractorEventType.Select, this.selectActionLeft, handleInputDevice);
                this._handleEventHandle(InteractorEventType.Activate, this.activateActionLeft, handleInputDevice);
                this._handleEventHandle(InteractorEventType.UIPress, this.UIPressActionLeft, handleInputDevice);
            } else if (this._inputDevice === XrInputDeviceType.Right_Hand) {
                this._handleEventHandle(InteractorEventType.Select, this.selectActionRight, handleInputDevice);
                this._handleEventHandle(InteractorEventType.Activate, this.activateActionRight, handleInputDevice);
                this._handleEventHandle(InteractorEventType.UIPress, this.UIPressActionRight, handleInputDevice);
            }
        }

        if (handleInputDevice) {
            this._notifyControllerEvent(handleInputDevice, isGamepadEvent);
        }
    }

    private _notifyControllerEvent (handleInputDevice: any, isGamepadEvent: boolean) {
        let curInputActionMap!: Map<XrEventType, XrInputAction>;
        if (this._inputDevice === XrInputDeviceType.Left_Hand) {
            curInputActionMap = this._leftInputActionMap;
        } else if (this._inputDevice === XrInputDeviceType.Right_Hand) {
            curInputActionMap = this._rightInputActionMap;
        }
        for (const [xrEventTypeLeftOrRight, xrInputAction] of curInputActionMap) {
            let eventValue = 0;
            if (isGamepadEvent) {
                eventValue = this._getGamepadEventValue(xrEventTypeLeftOrRight, handleInputDevice);
            } else {
                eventValue = this._getHandleEventValue(xrEventTypeLeftOrRight, handleInputDevice);
            }
            xrInputAction.isEventChanged = false;
            xrInputAction.eventValue = eventValue;
            xrInputAction.eventType = xrEventTypeLeftOrRight;

            if (eventValue > 0.1) {
                if (xrInputAction.keyEventActionType === null || xrInputAction.keyEventActionType === XrEventActionType.KEY_UP) {
                    xrInputAction.keyEventActionType = XrEventActionType.KEY_DOWN;
                    xrInputAction.isEventChanged = true;
                } else if (xrInputAction.keyEventActionType === XrEventActionType.KEY_DOWN) {
                    xrInputAction.keyEventActionType = XrEventActionType.KEY_PRESSING;
                    xrInputAction.isEventChanged = true;
                } else if (xrInputAction.keyEventActionType === XrEventActionType.KEY_PRESSING) {
                    xrInputAction.isEventChanged = true;
                }

                if (xrInputAction.touchEventActionType === null || xrInputAction.touchEventActionType === XrEventActionType.TOUCH_UP) {
                    xrInputAction.touchEventActionType = XrEventActionType.TOUCH_DOWN;
                    xrInputAction.isEventChanged = true;
                    const touchPos = this._inputDevice === XrInputDeviceType.Left_Hand ? handleInputDevice.leftStick.getValue()
                        : handleInputDevice.rightStick.getValue();
                    xrInputAction.touchPosition.x = touchPos.x;
                    xrInputAction.touchPosition.y = touchPos.y;
                } else if (xrInputAction.touchEventActionType === XrEventActionType.TOUCH_DOWN
                    || xrInputAction.touchEventActionType === XrEventActionType.TOUCHING) {
                    const touchPos = this._inputDevice === XrInputDeviceType.Left_Hand ? handleInputDevice.leftStick.getValue()
                        : handleInputDevice.rightStick.getValue();
                    xrInputAction.touchPosition.x = touchPos.x;
                    xrInputAction.touchPosition.y = touchPos.y;
                    xrInputAction.touchEventActionType = XrEventActionType.TOUCHING;
                    xrInputAction.isEventChanged = true;
                }
            } else {
                let isKeyDownOrPressing = xrInputAction.keyEventActionType === XrEventActionType.KEY_DOWN
                || xrInputAction.keyEventActionType === XrEventActionType.KEY_PRESSING;
                if (isKeyDownOrPressing) {
                    xrInputAction.keyEventActionType = XrEventActionType.KEY_UP;
                    xrInputAction.isEventChanged = true;
                    isKeyDownOrPressing = false;
                }

                const isThumbStickDown = isKeyDownOrPressing && (xrInputAction.eventType === XrEventTypeLeft.THUMBSTICK_LEFT
                    || (xrInputAction.eventType === XrEventTypeRight.THUMBSTICK_RIGHT));
                const isTouchDownOrIng = xrInputAction.touchEventActionType === XrEventActionType.TOUCH_DOWN
                    || xrInputAction.touchEventActionType === XrEventActionType.TOUCHING;
                if (isThumbStickDown && isTouchDownOrIng) {
                    const touchPos = this._inputDevice === XrInputDeviceType.Left_Hand ? handleInputDevice.leftStick.getValue()
                        : handleInputDevice.rightStick.getValue();
                    xrInputAction.touchPosition.x = touchPos.x;
                    xrInputAction.touchPosition.y = touchPos.y;
                    xrInputAction.touchEventActionType = XrEventActionType.TOUCHING;
                    xrInputAction.isEventChanged = true;
                } else if (!isThumbStickDown && isTouchDownOrIng) {
                    xrInputAction.touchEventActionType = XrEventActionType.TOUCH_UP;
                    xrInputAction.isEventChanged = true;
                }
            }

            if (xrInputAction.isEventChanged) {
                this.node.emit(Input.EventType.HANDLE_INPUT, xrInputAction);
                xrInputAction.isEventChanged = false;
            }
        }
    }

    private _getHandleEventValue (eventType: XrEventTypeLeft | XrEventTypeRight, handleInputDevice: any): number {
        let value = 0;
        switch (eventType) {
        case XrEventTypeRight.BUTTON_A:
            value = handleInputDevice.buttonSouth.getValue();
            break;
        case XrEventTypeRight.BUTTON_B:
            value = handleInputDevice.buttonEast.getValue();
            break;
        case XrEventTypeLeft.BUTTON_X:
            value = handleInputDevice.buttonWest.getValue();
            break;
        case XrEventTypeLeft.BUTTON_Y:
            value = handleInputDevice.buttonNorth.getValue();
            break;
        case XrEventTypeLeft.TRIGGER_LEFT:
            value = handleInputDevice.triggerLeft.getValue();
            break;
        case XrEventTypeRight.TRIGGER_RIGHT:
            value = handleInputDevice.triggerRight.getValue();
            break;
        case XrEventTypeLeft.GRIP_LEFT:
            value = handleInputDevice.gripLeft.getValue();
            break;
        case XrEventTypeRight.GRIP_RIGHT:
            value = handleInputDevice.gripRight.getValue();
            break;
        case XrEventTypeLeft.THUMBSTICK_LEFT:
            value = handleInputDevice.buttonLeftStick.getValue();
            break;
        case XrEventTypeRight.THUMBSTICK_RIGHT:
            value = handleInputDevice.buttonRightStick.getValue();
            break;
        case XrEventTypeLeft.TRIGGER_BTN_LEFT:
            value = handleInputDevice.buttonTriggerLeft.getValue();
            break;
        case XrEventTypeRight.TRIGGER_BTN_RIGHT:
            value = handleInputDevice.buttonTriggerRight.getValue();
            break;
        default:
            break;
        }
        return value;
    }

    private _getGamepadEventValue (eventType: XrEventTypeLeft | XrEventTypeRight, gamepad: any): number {
        let value = 0;
        switch (eventType) {
        case XrEventTypeRight.BUTTON_A:
            value = gamepad.buttonSouth.getValue();
            break;
        case XrEventTypeRight.BUTTON_B:
            value = gamepad.buttonEast.getValue();
            break;
        case XrEventTypeLeft.BUTTON_X:
            value = gamepad.buttonWest.getValue();
            break;
        case XrEventTypeLeft.BUTTON_Y:
            value = gamepad.buttonNorth.getValue();
            break;
        case XrEventTypeLeft.TRIGGER_LEFT:
            value = gamepad.buttonL2.getValue();
            break;
        case XrEventTypeRight.TRIGGER_RIGHT:
            value = gamepad.buttonR2.getValue();
            break;
        case XrEventTypeLeft.GRIP_LEFT:
            value = gamepad.gripLeft.getValue();
            break;
        case XrEventTypeRight.GRIP_RIGHT:
            value = gamepad.gripRight.getValue();
            break;
        case XrEventTypeLeft.THUMBSTICK_LEFT:
            value = gamepad.buttonL3.getValue();
            break;
        case XrEventTypeRight.THUMBSTICK_RIGHT:
            value = gamepad.buttonR3.getValue();
            break;
        case XrEventTypeLeft.TRIGGER_BTN_LEFT:
            value = gamepad.buttonL2.getValue();
            break;
        case XrEventTypeRight.TRIGGER_BTN_RIGHT:
            value = gamepad.buttonR2.getValue();
            break;
        default:
            break;
        }
        return value;
    }

    private _handleEventHandle (type: InteractorEventType, eventType: XrEventTypeLeft | XrEventTypeRight, handleInputDevice: any) {
        this._handleEvent(type, this._getHandleEventValue(eventType, handleInputDevice));
    }

    private _handleEventGamepad (type: InteractorEventType, eventType: XrEventTypeLeft | XrEventTypeRight, gamepad: any) {
        this._handleEvent(type, this._getGamepadEventValue(eventType, gamepad));
    }

    private _handleEvent (type: InteractorEventType, value: number) {
        switch (type) {
        case InteractorEventType.Select:
            this._selectState = this._handleState(type, this._selectState, value);
            break;
        case InteractorEventType.Activate:
            this._activateState = this._handleState(type, this._activateState, value);
            break;
        case InteractorEventType.UIPress:
            this._uiPressState = this._handleState(type, this._uiPressState, value);
            break;
        default:
            break;
        }
    }

    private _handleState (type: InteractorEventType, state: InteractorType, value: number) {
        this._xrEventHandle.eventHandle = value;
        if (value > 0.1) {
            if (state === InteractorType.End) {
                switch (type) {
                case InteractorEventType.Select:
                    this._xrInteractor?.selectStart(this._xrEventHandle);
                    break;
                case InteractorEventType.Activate:
                    this._xrInteractor?.activateStart(this._xrEventHandle);
                    break;
                case InteractorEventType.UIPress:
                    this._xrInteractor?.uiPressEnter(this._xrEventHandle);
                    break;
                default:
                    break;
                }
                state = InteractorType.Start;
            } else {
                switch (type) {
                case InteractorEventType.Select:
                    this._xrInteractor?.selectStay(this._xrEventHandle);
                    break;
                case InteractorEventType.Activate:
                    this._xrInteractor?.activateStay(this._xrEventHandle);
                    break;
                case InteractorEventType.UIPress:
                    this._xrInteractor?.uiPressStay(this._xrEventHandle);
                    break;
                default:
                    break;
                }
                state = InteractorType.Stay;
            }
        } else if (state !== InteractorType.End) {
            switch (type) {
            case InteractorEventType.Select:
                this._xrInteractor?.selectEnd(this._xrEventHandle);
                break;
            case InteractorEventType.Activate:
                this._xrInteractor?.activateEnd(this._xrEventHandle);
                break;
            case InteractorEventType.UIPress:
                this._xrInteractor?.uiPressExit(this._xrEventHandle);
                break;
            default:
                break;
            }
            state = InteractorType.End;
        }
        return state;
    }

    public simulateKeyInput (type: XrEventType, actionType: XrEventActionType) {
        if (!this._isSimulateKeyInput) {
            this._isSimulateKeyInput = true;
            input.off(Input.EventType.HANDLE_INPUT, this._dispatchEventHandleInput, this);
            input.off(Input.EventType.GAMEPAD_INPUT, this._dispatchEventHandleInput, this);
        }

        const value: number = actionType === XrEventActionType.KEY_UP ? 0 : 1;
        if (this._inputDevice === XrInputDeviceType.Left_Hand) {
            this._handleEvent(InteractorEventType.Select, this.selectActionLeft === type ? value : 0);
            this._handleEvent(InteractorEventType.Activate, this.activateActionLeft === type ? value : 0);
            this._handleEvent(InteractorEventType.UIPress, this.UIPressActionLeft === type ? value : 0);
        } else if (this._inputDevice === XrInputDeviceType.Right_Hand) {
            this._handleEvent(InteractorEventType.Select, this.selectActionRight === type ? value : 0);
            this._handleEvent(InteractorEventType.Activate, this.activateActionRight === type ? value : 0);
            this._handleEvent(InteractorEventType.UIPress, this.UIPressActionRight === type ? value : 0);
        }

        const xrInputAction: XrInputAction = new XrInputAction(this._inputDevice);
        xrInputAction.eventType = type;
        xrInputAction.eventValue = value;
        xrInputAction.keyEventActionType = actionType;
        this.node.emit(Input.EventType.HANDLE_INPUT, xrInputAction);
    }
}
