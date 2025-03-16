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

import { _decorator, Vec2, EventTouch, ccenum, director, geometry, PhysicsSystem } from 'cc';
import { ARCameraMgr } from '../ar-camera';
import { Selectable } from './ar-selectable';

const { ccclass, property } = _decorator;

export enum Gesture {
    None = 0,
    Tap,
    Double_Tap,
    Hold_Tap,
    Drag,
    Two_Finger_Drag,
    Two_Finger_Rotate,
    Spread_And_Pinch
}
ccenum(Gesture);

/**
 * @en
 * Screen touch gesture class. To distinguish between various types of screen gestures.
 * @zh
 * 屏幕触摸手势类。用于区分各类屏幕手势。
 */
@ccclass('cc.ScreenTouchGesture')
export abstract class ScreenTouchGesture {
    @property({ serializable: true })
    protected _gesture: number = Gesture.None;

    @property({ serializable: true, visible: false})
    private _enable = true;
    public get enable () {
        return this._enable;
    }
    public set enable (v: boolean) {
        this._enable = v;
    }

    public abstract init ();
    constructor () {
        this.init();
    }
    public actionName = '';

    private _doubleTapDuration = 0.8;
    public get doubleTapDuration () {
        return this._doubleTapDuration;
    }
    public set doubleTapDuration (v: number) {
        this._doubleTapDuration = v;
    }

    private _holdTapDuration = 1.0;
    public get holdTapDuration () {
        return this._holdTapDuration;
    }
    public set holdTapDuration (v: number) {
        this._holdTapDuration = v;
    }

    private _tick = 0;
    private _isDoubleTap = false;
    private _isHoldTap = false;
    private _tapDuration = 0.3;
    private _slopPixels = 30;
    private _isTap = false;
    private _doubleBeginTick = 0;
    private _doubleHitIds: string[] = [];
    private _isDrag = false;
    private _dragPixels = 50;
    private _curFingerNumber = 0;
    public get curFingerNumber () {
        return this._curFingerNumber;
    }
    public set curFingerNumber (v: number) {
        this._curFingerNumber = v;
    }
    private _triggerHoldTap = false;
    public get triggerHoldTap () {
        return this._triggerHoldTap;
    }
    public set triggerHoldTap (v: boolean) {
        this._triggerHoldTap = v;
    }

    private _triggerTap = false;
    public get triggerTap () {
        return this._triggerTap;
    }
    public set triggerTap (v: boolean) {
        this._triggerTap = v;
    }

    private _startTouch: EventTouch | null = null;
    private _touch: EventTouch | null = null;
    public get touch () {
        return this._touch;
    }

    public isSelectGesture () {
        return this.isTapGesture() || this.isHoldTapGesture() || this.isDoubleTapGesture();
    }
    public isPlaceGesture () {
        return this.isTapGesture() || this.isDragGesture();
    }
    public isTapGesture () {
        return this._isTap;
    }
    public isHoldTapGesture () {
        return this._isHoldTap;
    }
    public isDoubleTapGesture () {
        return this._isDoubleTap;
    }
    public isDragGesture () {
        return this._isDrag;
    }
    public startTouch (event: EventTouch) {
        this._startTouch = event;
        this.updateTouch(event, true, false);

        if (this._gesture === Gesture.Double_Tap) {
            if (this._doubleBeginTick === 0) {
                this._doubleBeginTick = new Date().getTime();
                this._doubleHitIds.length = 0;
            }
        }
    }
    public updateTouch (event: EventTouch, bCheck: boolean, isEndTouch: boolean) {
        this._touch = event;
        if (!isEndTouch) {
            this.curFingerNumber = event.getTouches().length;
        }
        if (isEndTouch && this._gesture === Gesture.Double_Tap && this.isSingleTouch()) {
            const point = this._touch.getLocation();
            const selectable: Selectable = this.hitSelectable(point)!;
            if (selectable) {
                this._doubleHitIds.push(selectable.node.uuid);
            }
        }
        if (bCheck) {
            this.checkGesture();
        }
    }
    public updateGesture (dt: number) {
        this._tick += dt;
        this.checkGesture();
    }
    private isSingleTouch (): boolean {
        if (!this._startTouch || !this._touch) {
            return false;
        }
        if (this._curFingerNumber !== 1) {
            return false;
        }
        const beginTouches = this._startTouch.getTouches();
        const touches = this._touch.getTouches();
        if (beginTouches.length > 1 || touches.length > 1) {
            return false;
        }
        return true;
    }

    private isTapTouch (): boolean {
        if (!this._startTouch || !this._touch) {
            return false;
        }
        if (!this.isSingleTouch()) {
            return false;
        }
        const startPoint = this._startTouch.getLocation();
        const point = this._touch.getLocation();
        const temp = new Vec2();
        Vec2.subtract(temp, startPoint, point);
        const distance = temp.length();
        if (distance > this._slopPixels) {
            return false;
        }

        return true;
    }

    private isHoldTapTouch (): boolean {
        if (!this._startTouch || !this._touch) {
            return false;
        }
        if (!this.isSingleTouch()) {
            return false;
        }
        const startPoint = this._startTouch.getLocation();
        const point = this._touch.getLocation();
        const temp = new Vec2();
        Vec2.subtract(temp, startPoint, point);
        const distance = temp.length();
        if (distance > 2 * this._dragPixels) {
            return false;
        }
        return true;
    }

    private isDragTouch (): boolean {
        if (!this._startTouch || !this._touch) {
            return false;
        }
        if (!this.isSingleTouch()) {
            return false;
        }
        const startPoint = this._startTouch.getLocation();
        const point = this._touch.getLocation();
        const temp = new Vec2();
        Vec2.subtract(temp, startPoint, point);
        const distance = temp.length();
        if (distance > this._dragPixels) {
            return true;
        }

        return false;
    }

    public checkGesture () {
        if (!this.enable) {
            return;
        }
        if (!this._startTouch || !this._touch) {
            return;
        }
        //console.log('当前手势:', this.actionName, this._gesture, Gesture[this._gesture]);
        switch (this._gesture) {
        case Gesture.Tap:
            if (!this.isTapTouch()) {
                this.resetGesture();
                return;
            }
            this._isTap = this._tick <= this._tapDuration;
            break;
        case Gesture.Hold_Tap:
            if (!this.isHoldTapTouch()) {
                this.resetGesture();
                return;
            }
            if (!this._isHoldTap && this._tick >= this._holdTapDuration) {
                this._isHoldTap = true;
            }
            break;
        case Gesture.Double_Tap:
            if (!this.isTapTouch()) {
                this.resetGesture();
                this.resetDoubTabGesture();
                return;
            }
            if (this._doubleBeginTick !== 0) {
                const cd = (new Date().getTime() - this._doubleBeginTick) / 1000;
                if (cd <= this._doubleTapDuration) {
                    if (this._doubleHitIds.length === 2) {
                        this.resetDoubTabGesture();
                        if (this._doubleHitIds[0] === this._doubleHitIds[1]) {
                            this._isDoubleTap = true;
                        }
                    }
                } else {
                    this.resetDoubTabGesture();
                    this._doubleBeginTick = new Date().getTime();
                }
            }
            break;
        case Gesture.Drag:
            this._isDrag = this.isDragTouch();
            break;
        default:
            break;
        }
        //console.log('手势状态:', this.actionName, Gesture[this._gesture], this._isTap, this._isHoldTap, this._isDoubleTap, this._isDrag);
    }

    public hitSelectable (touchPoint: Vec2): Selectable | null {
        const arCamera = director.getScene()!.getComponentInChildren(ARCameraMgr)!;
        if (arCamera && touchPoint) {
            const outRay = new geometry.Ray();
            arCamera?.Camera?.screenPointToRay(touchPoint.x, touchPoint.y, outRay);
            const hit = PhysicsSystem.instance.raycastClosest(outRay, 0xffffffff, 10000000, false);
            if (hit) {
                const raycastClosestResult = PhysicsSystem.instance.raycastClosestResult;
                const newSel: Selectable = raycastClosestResult.collider.node.getComponent(Selectable)!;
                if (newSel) {
                    return newSel;
                }
            }
        }
        return null;
    }

    public resetDoubTabGesture () {
        this._doubleBeginTick = 0;
        this._doubleHitIds.length = 0;
        this._isDoubleTap = false;
    }

    public resetGesture () {
        this._tick = 0;
        this._isTap = false;
        this._isHoldTap = false;
        this._isDoubleTap = false;
        this._isDrag = false;
        this._startTouch = null;
        this._touch = null;
        this.triggerHoldTap = false;
        this.triggerTap = false;
    }
}
