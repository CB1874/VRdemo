/*
 Copyright (c) 2022 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

import { _decorator, Component, Node, ccenum, Vec3, Quat, __private } from 'cc';
import { XRController, XrEventActionType, XrEventTypeLeft, XrEventTypeRight, XrInputDeviceType } from '../../device/xr-controller';

const { ccclass, property, menu } = _decorator;

export enum XRHandType {
    HAND_LEFT,
    HAND_RIGHT
}
ccenum(XRHandType);

export enum XRHandGestureType {
    XR_HAND_GESTURE_TYPE_UNKNOWN = -1,
    XR_HAND_GESTURE_TYPE_OPEN_HAND = 0,
    XR_HAND_GESTURE_TYPE_GRAB = 2,
    XR_HAND_GESTURE_TYPE_PINCH = 7,
    XR_HAND_GESTURE_TYPE_POINT = 8,
    XR_HAND_GESTURE_TYPE_VICTORY = 9,
    XR_HAND_GESTURE_TYPE_METAL = 11,
    XR_HAND_GESTURE_TYPE_MAX_ENUM = 0x7FFFFFFF
}
ccenum(XRHandGestureType);

export enum XRHandJoint {
    XR_HAND_JOINT_PALM_EXT = 0,
    XR_HAND_JOINT_WRIST_EXT = 1,
    XR_HAND_JOINT_THUMB_METACARPAL_EXT = 2,
    XR_HAND_JOINT_THUMB_PROXIMAL_EXT = 3,
    XR_HAND_JOINT_THUMB_DISTAL_EXT = 4,
    XR_HAND_JOINT_THUMB_TIP_EXT = 5,
    XR_HAND_JOINT_INDEX_METACARPAL_EXT = 6,
    XR_HAND_JOINT_INDEX_PROXIMAL_EXT = 7,
    XR_HAND_JOINT_INDEX_INTERMEDIATE_EXT = 8,
    XR_HAND_JOINT_INDEX_DISTAL_EXT = 9,
    XR_HAND_JOINT_INDEX_TIP_EXT = 10,
    XR_HAND_JOINT_MIDDLE_METACARPAL_EXT = 11,
    XR_HAND_JOINT_MIDDLE_PROXIMAL_EXT = 12,
    XR_HAND_JOINT_MIDDLE_INTERMEDIATE_EXT = 13,
    XR_HAND_JOINT_MIDDLE_DISTAL_EXT = 14,
    XR_HAND_JOINT_MIDDLE_TIP_EXT = 15,
    XR_HAND_JOINT_RING_METACARPAL_EXT = 16,
    XR_HAND_JOINT_RING_PROXIMAL_EXT = 17,
    XR_HAND_JOINT_RING_INTERMEDIATE_EXT = 18,
    XR_HAND_JOINT_RING_DISTAL_EXT = 19,
    XR_HAND_JOINT_RING_TIP_EXT = 20,
    XR_HAND_JOINT_LITTLE_METACARPAL_EXT = 21,
    XR_HAND_JOINT_LITTLE_PROXIMAL_EXT = 22,
    XR_HAND_JOINT_LITTLE_INTERMEDIATE_EXT = 23,
    XR_HAND_JOINT_LITTLE_DISTAL_EXT = 24,
    XR_HAND_JOINT_LITTLE_TIP_EXT = 25,
    XR_HAND_JOINT_MAX_ENUM_EXT = 0x7FFFFFFF
}
ccenum(XRHandJoint);
export const XR_HAND_JOINT_COUNT_EXT = 26;

export enum XRStickKeyCode {
    UNDEFINE = 0,
    A,
    B,
    X,
    Y,
    L1,
    R1,
    MINUS,
    PLUS,
    L3,
    R3,
    MENU,
    START,
    TRIGGER_LEFT,
    TRIGGER_RIGHT,
}

export class XRHandJointData {
    public radius = 0.001;
    public position: Vec3 = new Vec3();
    public orientation: Quat = new Quat();
}

export class XRHandData {
    public internalIndex = 0;
    public index = -1;
    public isTracked = false;
    public joints: Array<XRHandJointData> = new Array(XR_HAND_JOINT_COUNT_EXT);
    public gestureData: XRHandGestureData = new XRHandGestureData();
    constructor () {
        for (let i = 0; i < XR_HAND_JOINT_COUNT_EXT; i++) {
            this.joints[i] = new XRHandJointData();
        }
    }

    praseData (data: string) {
        this.isTracked = false;
        const dataArray: string[] = data.split('|');
        if (dataArray.length > 0) {
            this.index = parseInt(dataArray[0]);
            this.isTracked = parseInt(dataArray[1]) === 1;
            if (this.isTracked) {
                const fromIndex = 2;
                for (let i = 0; i < XR_HAND_JOINT_COUNT_EXT; i++) {
                    this.joints[i].radius = parseFloat(dataArray[i * 8 + fromIndex]);
                    this.joints[i].orientation.x = parseFloat(dataArray[i * 8 + fromIndex + 1]);
                    this.joints[i].orientation.y = parseFloat(dataArray[i * 8 + fromIndex + 2]);
                    this.joints[i].orientation.z = parseFloat(dataArray[i * 8 + fromIndex + 3]);
                    this.joints[i].orientation.w = parseFloat(dataArray[i * 8 + fromIndex + 4]);
                    this.joints[i].position.x = parseFloat(dataArray[i * 8 + fromIndex + 5]);
                    this.joints[i].position.y = parseFloat(dataArray[i * 8 + fromIndex + 6]);
                    this.joints[i].position.z = parseFloat(dataArray[i * 8 + fromIndex + 7]);
                }
            }
        }

        if (this.internalIndex !== this.index) {
            console.log(`hand data is wrong index:${this.internalIndex} vs ${this.index}, data is ${data}`);
        }
    }
}

export class XRHandGestureData {
    public index = 0;
    public isTracked = false;
    public gestureType: XRHandGestureType = XRHandGestureType.XR_HAND_GESTURE_TYPE_UNKNOWN;
    public gestureRadio = 0;
    public gestureFlipRadio = 0;
    praseData (data: string) {
        this.isTracked = false;
        const dataArray: string[] = data.split('|');
        if (dataArray.length > 0) {
            this.index = parseInt(dataArray[0]);
            this.isTracked = parseInt(dataArray[1]) === 1;
            this.gestureType = parseInt(dataArray[2]) as XRHandGestureType;
            this.gestureRadio = parseFloat(dataArray[3]);
            this.gestureFlipRadio = parseFloat(dataArray[4]);
        }
    }
}

export enum HandEventType {
    GESTURE_CHANGE = 'hand-gesture',
    TRACK_STATE_CHANGE = 'hand-track-state'
}

@ccclass('cc.spaces.XRHand')
@menu('hidden:XR/Spaces/XRHand')
export class XRHand extends Component {
    private _handData: XRHandData = new XRHandData();
    private _lastGestureType: XRHandGestureType = XRHandGestureType.XR_HAND_GESTURE_TYPE_UNKNOWN;
    private _isTracked = false;
    private _controller: XRController | null = null;
    private _isPinched = false;
    private _isGrabed = false;

    get HandData () {
        return this._handData;
    }

    syncData (data: XRHandData) {
        this._handData = data;
    }

    start () {
        this._controller = this.node.getComponent(XRController);
        if (!this._controller || !this._controller.enabled) {
            const jointNode = this.node.getChildByName('Joint_0');
            if (jointNode) {
                this._controller = jointNode.getComponent(XRController);
            }
        }
    }

    update (deltaTime: number) {
        if (this._isTracked !== this._handData.isTracked) {
            this.node.emit(HandEventType.TRACK_STATE_CHANGE, this, this._isTracked, this._handData.isTracked);
            this._isTracked = this._handData.isTracked;
            if (this._controller) {
                this._controller.inputDevice = this._handData.index === 0 ? XrInputDeviceType.Left_Hand : XrInputDeviceType.Right_Hand;
                if (this._handData.index === 0) {
                    this._controller.inputDevice = XrInputDeviceType.Left_Hand;
                    this._controller.selectActionLeft = XrEventTypeLeft.GRIP_LEFT;
                    this._controller.activateActionLeft = XrEventTypeLeft.BUTTON_X;
                    this._controller.UIPressActionLeft = XrEventTypeLeft.TRIGGER_LEFT;
                } else {
                    this._controller.inputDevice = XrInputDeviceType.Right_Hand;
                    this._controller.selectActionRight = XrEventTypeRight.GRIP_RIGHT;
                    this._controller.activateActionRight = XrEventTypeRight.BUTTON_A;
                    this._controller.UIPressActionRight = XrEventTypeRight.TRIGGER_RIGHT;
                }
            }
        }

        for (let i = 0; i < XR_HAND_JOINT_COUNT_EXT; i++) {
            const jointNode = this.node.getChildByName(`Joint_${i}`);
            if (jointNode) {
                jointNode.setRotation(this._handData.joints[i].orientation);
                jointNode.setPosition(this._handData.joints[i].position);
                jointNode.active = this._isTracked;
            }
        }

        const jointRayNode = this.node.getChildByName('Joint_Ray');
        if (jointRayNode) {
            jointRayNode.position = this._handData.joints[XRHandJoint.XR_HAND_JOINT_WRIST_EXT].position;
            jointRayNode.rotation = this._handData.joints[XRHandJoint.XR_HAND_JOINT_WRIST_EXT].orientation;
        }
        //

        if (this._controller != null) {
            if (this._handData.gestureData.gestureRadio >= 0.5
                && this._handData.gestureData.gestureType > XRHandGestureType.XR_HAND_GESTURE_TYPE_UNKNOWN) {
                const gestureType: XRHandGestureType = this._handData.gestureData.gestureType;
                //
                if (gestureType === XRHandGestureType.XR_HAND_GESTURE_TYPE_PINCH
                    && this._lastGestureType !== XRHandGestureType.XR_HAND_GESTURE_TYPE_PINCH) {
                    this._controller.simulateKeyInput(this._handData.index === 0
                        ? XrEventTypeLeft.TRIGGER_LEFT : XrEventTypeRight.TRIGGER_RIGHT, XrEventActionType.KEY_DOWN);
                    this._isPinched = true;
                } else if (this._isPinched && this._lastGestureType === gestureType && gestureType === XRHandGestureType.XR_HAND_GESTURE_TYPE_PINCH) {
                    this._controller.simulateKeyInput(this._handData.index === 0
                        ? XrEventTypeLeft.TRIGGER_LEFT : XrEventTypeRight.TRIGGER_RIGHT, XrEventActionType.KEY_PRESSING);
                } else if (this._isPinched && this._lastGestureType !== gestureType
                    && this._lastGestureType === XRHandGestureType.XR_HAND_GESTURE_TYPE_PINCH) {
                    this._controller.simulateKeyInput(this._handData.index === 0
                        ? XrEventTypeLeft.TRIGGER_LEFT : XrEventTypeRight.TRIGGER_RIGHT, XrEventActionType.KEY_UP);
                    this._isPinched = false;
                }

                // open->grab->open
                if (gestureType === XRHandGestureType.XR_HAND_GESTURE_TYPE_GRAB
                    && this._lastGestureType !== XRHandGestureType.XR_HAND_GESTURE_TYPE_GRAB) {
                    this._controller.simulateKeyInput(this._handData.index === 0
                        ? XrEventTypeLeft.GRIP_LEFT : XrEventTypeRight.GRIP_RIGHT, XrEventActionType.KEY_DOWN);
                    this._isGrabed = true;
                } else if (this._isGrabed && gestureType !== XRHandGestureType.XR_HAND_GESTURE_TYPE_OPEN_HAND) {
                    this._controller.simulateKeyInput(this._handData.index === 0
                        ? XrEventTypeLeft.GRIP_LEFT : XrEventTypeRight.GRIP_RIGHT, XrEventActionType.KEY_PRESSING);
                } else if (this._isGrabed && gestureType === XRHandGestureType.XR_HAND_GESTURE_TYPE_OPEN_HAND) {
                    this._controller.simulateKeyInput(this._handData.index === 0
                        ? XrEventTypeLeft.GRIP_LEFT : XrEventTypeRight.GRIP_RIGHT, XrEventActionType.KEY_UP);
                    this._isGrabed = false;
                }

                if (this._lastGestureType !== gestureType) {
                    this.node.emit(HandEventType.GESTURE_CHANGE, this, this._lastGestureType, gestureType);
                    this._lastGestureType = gestureType;
                }
            }
        }
    }
}
