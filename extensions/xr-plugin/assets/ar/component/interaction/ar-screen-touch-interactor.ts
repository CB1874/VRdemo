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

import { _decorator,
    Vec2,
    Component,
    Input,
    input,
    director,
    geometry,
    PhysicsSystem,
    EventTouch,
    ccenum,
    Prefab,
    Node,
    screen,
    Vec3,
    Quat,
    instantiate } from 'cc';
import { arEvent, ARInternalEventType } from '../framework/utils/ar-event';
import { Selectable } from './ar-selectable';
import { ARCameraMgr } from '../ar-camera';
import { ARAnchor, ARPose, ARRayCastMode, PlaneDetectionConfig, WorldMeshConfig } from '../framework/utils/ar-defines';
import { ARTrackingType } from '../framework/utils/ar-enum';
import {
    RotateEvent,
    ScaleEvent,
    StateAction,
    MoveEvent,
    SelectEvent,
    PlaceEvent,
    TransformModeType } from './ar-interaction-define';
import { ScreenTouchGesture, Gesture } from './ar-screen-touch-gesture';
import { Placeable } from './ar-placeable';
import { arApi } from '../../../xr/component/interface/ar-api';

const { ccclass, help, menu, property, disallowMultiple } = _decorator;

enum SelectGesture {
    Tap = Gesture.Tap,
    Double_Tap = Gesture.Double_Tap,
    Hold_Tap = Gesture.Hold_Tap,
}
ccenum(SelectGesture);

enum PlaceGesture {
    Drag = Gesture.Drag,
    Tap = Gesture.Tap,
}

ccenum(PlaceGesture);

enum ScaleGesture {
    Spread_And_Pinch = Gesture.Spread_And_Pinch,
}
ccenum(ScaleGesture);

enum MoveGesture {
    Drag = Gesture.Drag,
}
ccenum(MoveGesture);

enum RotateGesture {
    Drag = Gesture.Drag,
    Two_Finger_Drag = Gesture.Two_Finger_Drag,
    Two_Finger_Rotate = Gesture.Two_Finger_Rotate,
}
ccenum(RotateGesture);

enum ResetGesture {
    Drag = Gesture.Drag,
    Tap = Gesture.Tap,
}
ccenum(ResetGesture);

enum CalculationMode {
    AR_HIT_DETECTION = 0,
    SPATIAL_DISTANCE = 1,
    COLLISION_DETECTION = 2,
}
ccenum(CalculationMode);

@ccclass('cc.SelectAction')
export class SelectAction extends ScreenTouchGesture {
    @property({ serializable: true })
    protected _doubleTapGap = 0.8;
    @property({ serializable: true })
    protected _holdTouchDuration = 1.0;
    @property({ serializable: true })

    @property({
        type: SelectGesture,
        displayOrder: 1,
        override: true,
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.gesture',
        })
    set gesture (val) {
        if (val === this._gesture) {
            return;
        }
        this._gesture = val;
    }
    get gesture () {
        return this._gesture;
    }

    @property({
        displayOrder: 2,
        visible: (function (this: SelectAction) {
            return this._gesture == SelectGesture.Double_Tap;
            }),
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.selectAction.doubleTapGap',
        })
    set doubleTapGap (val) {
        if (val === this._doubleTapGap) {
            return;
        }
        this._doubleTapGap = val;
        this.doubleTapDuration = val;
    }
    get doubleTapGap () {
        return this._doubleTapGap;
    }

    @property({
        displayOrder: 3,
        visible: (function (this: SelectAction) {
            return this._gesture == SelectGesture.Hold_Tap;
            }),
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.selectAction.holdTouchDuration',
        })
    set holdTouchDuration (val) {
        if (val === this._holdTouchDuration) {
            return;
        }
        this._holdTouchDuration = val;
        this.holdTapDuration = val;
    }
    get holdTouchDuration () {
        return this._holdTouchDuration;
    }

    public init () {
        this.actionName = 'SelectAction';
        if (this._gesture === Gesture.None) {
            this.gesture = SelectGesture.Tap;
        }
        this.doubleTapDuration = this.doubleTapGap;
        this.holdTapDuration = this.holdTouchDuration;
    }
}

@ccclass('cc.SelectMoveAction')
export class SelectMoveAction extends ScreenTouchGesture {
    @property({
        type: MoveGesture,
        displayOrder: 1,
        override: true,
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.gesture',
        })
    set gesture (val) {
        if (val === this._gesture) {
            return;
        }
        this._gesture = val;
    }
    get gesture () {
        return this._gesture;
    }

    private _isMoving = false;
    set isMoving (val) {
        this._isMoving = val;
    }
    get isMoving () {
        return this._isMoving;
    }

    public init () {
        this.actionName = 'SelectMoveAction';
        if (this._gesture === Gesture.None) {
            this.gesture = MoveGesture.Drag;
        }
    }
}

@ccclass('cc.SelectRotateAction')
export class SelectRotateAction extends ScreenTouchGesture {
    @property({ serializable: true })
    protected _dragDegree = 10;
    @property({ serializable: true })
    protected _twistDegree = 2.5;

    @property({
        type: RotateGesture,
        displayOrder: 1,
        override: true,
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.gesture',
        })
    set gesture (val) {
        if (val === this._gesture) {
            return;
        }
        this._gesture = val;
    }
    get gesture () {
        return this._gesture;
    }

    @property({
        serializable: true,
        displayOrder: 2,
        visible: (function (this: SelectRotateAction) {
            return this._gesture === RotateGesture.Drag || this._gesture === RotateGesture.Two_Finger_Drag;
            }),
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.selectRotateAction.dragDegree',
        })
    set dragDegree (val) {
        if (val === this._dragDegree) {
            return;
        }
        this._dragDegree = val;
    }
    get dragDegree () {
        return this._dragDegree;
    }

    @property({
        serializable: true,
        displayOrder: 3,
        visible: (function (this: SelectRotateAction) {
            return this._gesture === RotateGesture.Two_Finger_Rotate;
            }),
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.selectRotateAction.twistDegree',
        })
    set twistDegree (val) {
        if (val === this._twistDegree) {
            return;
        }
        this._twistDegree = val;
    }
    get twistDegree () {
        return this._twistDegree;
    }
    private _isRotation = false;
    set isRotation (val) {
        this._isRotation = val;
    }
    get isRotation () {
        return this._isRotation;
    }

    public init () {
        this.actionName = 'SelectRotateAction';
        if (this._gesture === Gesture.None) {
            this.gesture = RotateGesture.Two_Finger_Drag;
        }
    }
}

@ccclass('cc.SelectScaleAction')
export class SelectScaleAction extends ScreenTouchGesture {
    @property({ serializable: true })
    protected _sensitivity = 0.7;

    @property({
        type: ScaleGesture,
        displayOrder: 1,
        override: true,
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.gesture',
        })
    set gesture (val) {
        if (val === this._gesture) {
            return;
        }
        this._gesture = val;
    }
    get gesture () {
        return this._gesture;
    }

    @property({
        serializable: true,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.selectScaleAction.sensitivity',
        })
    set sensitivity (val) {
        if (val === this._sensitivity) {
            return;
        }
        this._sensitivity = val;
    }
    get sensitivity () {
        return this._sensitivity;
    }
    private _isScaling = false;
    set isScaling (val) {
        this._isScaling = val;
    }
    get isScaling () {
        return this._isScaling;
    }
    private _originalTouchDistance = -1;
    set originalTouchDistance (val) {
        this._originalTouchDistance = val;
    }
    get originalTouchDistance () {
        return this._originalTouchDistance;
    }
    public init () {
        this.actionName = 'SelectScaleAction';
        if (this._gesture === Gesture.None) {
            this.gesture = ScaleGesture.Spread_And_Pinch;
        }
    }
}

@ccclass('cc.PlaceAction')
export class PlaceAction extends ScreenTouchGesture {
    @property({ serializable: true })
    protected _calculation_Mode: CalculationMode = CalculationMode.AR_HIT_DETECTION;
    @property({ serializable: true })
    protected _distance = 0.5;
    @property({ serializable: true })
    protected _detectOcclusion = true;
    @property({ serializable: true })
    protected _located_Prefab: Prefab | null = null;
    @property({ serializable: true })
    protected _placement_Prefab: Prefab | null = null;

    @property({
        type: PlaceGesture,
        displayOrder: 1,
        override: true,
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.gesture',
        })
    set gesture (val) {
        if (val === this._gesture) {
            return;
        }
        this._gesture = val;
    }
    get gesture () {
        return this._gesture;
    }

    @property({
        type: CalculationMode,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.placeAction.calculationMode',
        })
    set calculation_Mode (val) {
        if (val === this._calculation_Mode) {
            return;
        }
        this._calculation_Mode = val;
    }
    get calculation_Mode () {
        return this._calculation_Mode;
    }

    @property({
        serializable: true,
        displayOrder: 3,
        visible: (function (this: PlaceAction) {
            return this.calculation_Mode === CalculationMode.SPATIAL_DISTANCE;
            }),
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.placeAction.distance',
        })
    set distance (val) {
        if (val === this._distance) {
            return;
        }
        this._distance = val;
    }
    get distance () {
        return this._distance;
    }

    @property({
        serializable: true,
        displayOrder: 4,
        visible: (function (this: PlaceAction) {
            return this.calculation_Mode === CalculationMode.SPATIAL_DISTANCE;
            }),
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.placeAction.detectOcclusion',
        })
    set detectOcclusion (val) {
        if (val === this._detectOcclusion) {
            return;
        }
        this._detectOcclusion = val;
    }
    get detectOcclusion () {
        return this._detectOcclusion;
    }

    @property({
        type: Prefab,
        displayOrder: 5,
        visible: (function (this: PlaceAction) {
            return this.calculation_Mode === CalculationMode.SPATIAL_DISTANCE;
            }),
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.placeAction.located_Prefab',
        })
    set located_Prefab (val) {
        if (val === this._located_Prefab) {
            return;
        }
        this._located_Prefab = val;
        this.createLocatedNode();
    }
    get located_Prefab () {
        return this._located_Prefab;
    }

    @property({
        type: Prefab,
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.screen_touch_gesture.placeAction.placement_Prefab',
        })
    set placement_Prefab (val) {
        if (val === this._placement_Prefab) {
            return;
        }
        this._placement_Prefab = val;
        this.createPlaceNode();
    }
    get placement_Prefab () {
        return this._placement_Prefab;
    }
    private _isPlacing = false;
    set isPlacing (val) {
        this._isPlacing = val;
    }
    get isPlacing () {
        return this._isPlacing;
    }

    private _placeNode: Node | null = null;
    private _locatedNode: Node | null = null;
    public init () {
        this.actionName = 'PlaceAction';
        if (this._gesture === Gesture.None) {
            this.gesture = PlaceGesture.Tap;
        }
        this.createPlaceNode();
        this.createLocatedNode();
    }

    public createPlaceNode () {
        const root = director.getScene();
        if (!root) {
            return;
        }
        this._placeNode = root.getChildByName('__scene_place__');
        if (this._placeNode && this._placeNode.isValid) {
            this._placeNode.destroy();
            this._placeNode = null;
        }
        if (this.placement_Prefab) {
            this._placeNode = instantiate(this.placement_Prefab);
            this._placeNode.name = '__scene_place__';
            root.addChild(this._placeNode);
            this._placeNode.active = false;
        }
    }

    public createLocatedNode () {
        const root = director.getScene();
        if (!root) {
            return;
        }
        this._locatedNode = root.getChildByName('__scene_located__');
        if (this._locatedNode && this._locatedNode.isValid) {
            this._locatedNode.destroy();
            this._locatedNode = null;
        }
        if (this.located_Prefab) {
            this._locatedNode = instantiate(this.located_Prefab);
            this._locatedNode.name = '__scene_place__';
            root.addChild(this._locatedNode);
            this._locatedNode.active = false;
        }
    }

    public updateLocatedNode (anchor?: ARAnchor) {
        if (this._locatedNode && anchor) {
            this._locatedNode.active = true;
            this._locatedNode.setPosition(anchor.pose.position);
            this._locatedNode.setRotation(anchor.pose.rotation);
        }
    }

    onEnable () {
        arEvent.on(ARInternalEventType.PLACE_ACTION, this.onPlaceActionEvent, this);
    }

    onDisable () {
        arEvent.off(ARInternalEventType.PLACE_ACTION, this.onPlaceActionEvent, this);
    }

    public getPlaceable () {
        if (!this._placeNode) {
            return null;
        }
        const placeable: Placeable = this._placeNode.getComponent(Placeable)!;
        return placeable;
    }

    public getPlaceHitRayCastMode (): ARRayCastMode {
        let raycast = 0;
        if (!this._placeNode) {
            return raycast;
        }
        const placeable: Placeable = this._placeNode.getComponent(Placeable)!;
        if (!placeable) {
            return raycast;
        }
        const cfg = arApi.getFeatureConfig(ARTrackingType.Plane) as PlaneDetectionConfig;
        if (cfg && cfg.enable) {
            if (cfg.usePlaneShape) {
                raycast |= ARRayCastMode.RAYCAST_PLANE_POLYGON;
            } else {
                raycast |= ARRayCastMode.RAYCAST_PLANE_EXTENT;
            }
        }
        const cfg2 = arApi.getFeatureConfig(ARTrackingType.WorldMesh) as WorldMeshConfig;
        if (cfg2 && cfg2.enable) {
            raycast |= ARRayCastMode.RAYCAST_MESH;
        }
        return raycast;
    }

    private onPlaceActionEvent (event: PlaceEvent) {
        if (!this._placeNode) {
            return;
        }
        const placeable: Placeable = this._placeNode.getComponent(Placeable)!;
        if (!placeable) {
            return;
        }
        const previewNode = placeable.previewNode;
        if (event.state === StateAction.Enter) {
            if (previewNode && event.anchor) {
                previewNode.setPosition(event.anchor.pose.position);
                previewNode.setRotation(event.anchor.pose.rotation);
                previewNode.active = true;
            }
            placeable.placementEvents.placeEntered(event);
        } else if (event.state === StateAction.Update) {
            if (previewNode && event.anchor) {
                previewNode.setPosition(event.anchor.pose.position);
                previewNode.setRotation(event.anchor.pose.rotation);
            }
        } else if (event.state === StateAction.Exit) {
            if (previewNode) {
                previewNode.active = false;
            }
            if (event.prefab && event.anchor) {
                const placeObject: Node = instantiate(event.prefab);
                director.getScene()!.addChild(placeObject);
                const temp: Vec3 = placeable.placementOffset.clone();
                temp.add(event.anchor.pose.position);
                placeObject.setPosition(temp);
                placeObject.setRotation(event.anchor.pose.rotation);
                placeObject.active = true;

                const selectable: Selectable = placeObject.getComponent(Selectable)!;
                if (selectable) {
                    selectable.transformMode = TransformModeType.PLANE;
                    selectable.transformPoint = event.anchor.pose.position;
                }
            }
            placeable.placementEvents.placeFinished(event);
        } else if (event.state === StateAction.Cancel) {
            if (previewNode) {
                previewNode.active = false;
            }

            placeable.placementEvents.placeCanceled(event);
        }
    }
}

/**
 * @en
 * Screen interaction component that emits a class for placing, selecting, rotating, moving, zooming behavior message
 * @zh
 * 屏幕交互组件,用于发出放置、选择、旋转、移动、缩放行为消息的类
 */
@ccclass('cc.ScreenTouchInteractor')
@help('i18n:cc.ScreenTouchInteractor')
@menu('XR/Interaction/ScreenTouchInteractor')
@disallowMultiple
export class ScreenTouchInteractor extends Component {
    @property({
        serializable: true,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.screen_touch_interactor.selectAction',
        })
    protected selectAction: SelectAction = new SelectAction();

    @property({
        serializable: true,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.screen_touch_interactor.selectMoveAction',
        visible: (function (this: ScreenTouchInteractor) {
            return this.selectAction.enable;
            }),
        })
    protected selectMoveAction: SelectMoveAction = new SelectMoveAction();

    @property({
        serializable: true,
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.screen_touch_interactor.selectRotateAction',
        visible: (function (this: ScreenTouchInteractor) {
            return this.selectAction.enable;
            }),
        })
    protected selectRotateAction: SelectRotateAction = new SelectRotateAction();

    @property({
        serializable: true,
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.screen_touch_interactor.selectScaleAction',
        visible: (function (this: ScreenTouchInteractor) {
            return this.selectAction.enable;
            }),
        })
    protected selectScaleAction: SelectScaleAction = new SelectScaleAction();

    @property({
        serializable: true,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.screen_touch_interactor.placeAction',
        })
    protected placeAction: PlaceAction  = new PlaceAction();

    private _isTouching = false;
    private _selected: Selectable [] = [];
    protected onLoad () {
        this.selectAction.init();
        this.selectMoveAction.init();
        this.selectRotateAction.init();
        this.selectScaleAction.init();
        this.placeAction.init();
    }

    public setPlacementPrefab (p: Prefab) {
        this.placeAction.placement_Prefab = p;
    }

    protected onEnable () {
        input.on(Input.EventType.TOUCH_START, this._onTouchBegin, this);
        input.on(Input.EventType.TOUCH_MOVE, this._onTouchMoved, this);
        input.on(Input.EventType.TOUCH_END, this._onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
        this.placeAction.onEnable();
    }

    protected onDisable () {
        input.off(Input.EventType.TOUCH_START, this._onTouchBegin, this);
        input.off(Input.EventType.TOUCH_MOVE, this._onTouchMoved, this);
        input.off(Input.EventType.TOUCH_END, this._onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this._onTouchCancel, this);
        this.placeAction.onDisable();
    }

    protected update (dt) {
        if (this._isTouching) {
            this.selectAction.updateGesture(dt);
            this.placeAction.updateGesture(dt);
            this.selectMoveAction.updateGesture(dt);

            if (this.selectAction.isHoldTapGesture() && !this.selectAction.triggerHoldTap && this.selectAction.touch) {
                this.selectAction.triggerHoldTap = true;
                this._handlerSelectTouch(this.selectAction.touch, StateAction.Enter);
            }

            if (this.placeAction.isTapGesture() && !this.placeAction.triggerTap && this.placeAction.touch) {
                this.placeAction.triggerTap = true;
                this._handlerPlaceTouch(this.placeAction.touch, StateAction.Enter);
            }
        }
        this._updateLocatedPlace();
    }

    private _onTouchBegin (event: EventTouch) {
        this._isTouching = true;
        this.selectAction.startTouch(event);
        this.placeAction.startTouch(event);
        this.selectMoveAction.startTouch(event);
    }

    private _onTouchMoved (event: EventTouch) {
        this.selectAction.updateTouch(event, false, false);
        this.placeAction.updateTouch(event, false, false);
        this.selectMoveAction.updateTouch(event, false, false);

        if (!this.selectAction.isSelectGesture()) {
            this._handlerUpdateTouch(event, StateAction.Update);
        }

        if (this.placeAction.isDragGesture() && !this._isSelectStageAction()) {
            if (!this.placeAction.isPlacing) {
                this._handlerPlaceTouch(event, StateAction.Enter);
            } else {
                this._handlerPlaceTouch(event, StateAction.Update);
            }
        } else if (this.placeAction.isPlacing && !this.placeAction.isTapGesture()) {
            this._handlerPlaceTouch(event, StateAction.Cancel);
        }
    }

    private _onTouchEnd (event: EventTouch) {
        this.selectAction.updateTouch(event, true, true);
        this.placeAction.updateTouch(event, true, true);
        this.selectMoveAction.updateTouch(event, false, true);

        let trigger = false;
        if (this.selectAction.isTapGesture() || this.selectAction.isDoubleTapGesture()) {
            trigger = this._handlerSelectTouch(event, StateAction.Enter);
        }
        if (!trigger) {
            if (this.placeAction.isTapGesture() || this.placeAction.isDragGesture() && !this._isSelectStageAction()) {
                this._handlerPlaceTouch(event, StateAction.Exit);
            } else {
                this._handlerPlaceTouch(event, StateAction.Cancel);
            }
        }
        this._handlerUpdateTouch(event, StateAction.Exit);

        this._isTouching = false;
        this.selectAction.resetGesture();
        this.placeAction.resetGesture();
        this.selectMoveAction.resetGesture();
    }

    private _onTouchCancel (event: EventTouch) {
        this._handlerSelectTouch(event, StateAction.Cancel);
        this._isTouching = false;
        this.selectAction.resetGesture();
        this.placeAction.resetGesture();
        this.selectMoveAction.resetGesture();
    }

    private _isSelectStageAction () {
        if (this.selectMoveAction.isMoving || this.selectRotateAction.isRotation || this.selectScaleAction.isScaling) {
            return true;
        }
        return false;
    }

    private _handlerSelectTouch (event: EventTouch, state: StateAction) {
        const point = event.getLocation();
        let isSelected = false;
        if (this.selectAction.isSelectGesture()) {
            isSelected = this._triggerSelect(point, state);
        }
        return isSelected;
    }

    private _handlerPlaceTouch (event: EventTouch, state: StateAction) {
        if (!this.placeAction.enable) {
            return;
        }
        if (this.selectMoveAction.isMoving && this.placeAction.isDragGesture() && (state === StateAction.Enter || state === StateAction.Update)) {
            this._cancelPlace();
            return;
        }
        const point = event.getLocation();
        if (state === StateAction.Enter || state === StateAction.Exit) {
            const newSel = this.placeAction.hitSelectable(point);
            if (newSel) {
                this._cancelPlace();
                return;
            }
        }
        if (state !== StateAction.Cancel) {
            this.selectAction.resetDoubTabGesture();
        }
        this._triggerPlace(point, state);
    }

    private _handlerUpdateTouch (event: EventTouch, state: StateAction) {
        if (!this.selectAction.enable) {
            return;
        }
        if (this._selected.length > 0) {
            this._triggerScale(event, state);
            this._triggerRotation(event, state);
            this._triggerMove(event, state);
        }
    }

    private _triggerSelect (touchPoint: Vec2, state: StateAction): boolean {
        if (!this.selectAction.enable) {
            return false;
        }
        const selectEvent: SelectEvent = {
            uuid: '',
            state: StateAction.Enter,
        };
        const newSel = this.selectAction.hitSelectable(touchPoint);
        if (newSel) {
            if (state === StateAction.Enter) {
                const index = this._selected.indexOf(newSel);
                if (index === -1) {
                    if (this._selected.length > 0) {
                        selectEvent.uuid = this._selected[0].node.uuid;
                        selectEvent.state = StateAction.Cancel;
                        arEvent.dispatch(ARInternalEventType.SELECT_ACTION, selectEvent);
                        this._selected.splice(0, 1);
                    }
                    selectEvent.uuid = newSel.node.uuid;
                    selectEvent.state = StateAction.Enter;
                    arEvent.dispatch(ARInternalEventType.SELECT_ACTION, selectEvent);
                    this._selected.push(newSel);
                } else {
                    selectEvent.uuid = newSel.node.uuid;
                    selectEvent.state = StateAction.Cancel;
                    arEvent.dispatch(ARInternalEventType.SELECT_ACTION, selectEvent);
                    this._selected.splice(index, 1);
                }
            } else if (state === StateAction.Exit) {
                selectEvent.uuid = newSel.node.uuid;
                selectEvent.state = StateAction.Exit;
                arEvent.dispatch(ARInternalEventType.SELECT_ACTION, selectEvent);
            } else if (state === StateAction.Cancel) {
                const index = this._selected.indexOf(newSel);
                if (index !== -1) {
                    selectEvent.uuid = newSel.node.uuid;
                    selectEvent.state = StateAction.Cancel;
                    arEvent.dispatch(ARInternalEventType.SELECT_ACTION, selectEvent);
                    this._selected.splice(index, 1);
                }
            }
            return true;
        } else if (this._selected.length > 0) {
            selectEvent.uuid = this._selected[0].node.uuid;
            selectEvent.state = StateAction.Cancel;
            arEvent.dispatch(ARInternalEventType.SELECT_ACTION, selectEvent);
            this._selected.splice(0, 1);
        }
        return false;
    }

    private _getHitRayCastMode (): ARRayCastMode {
        let raycast = 0;
        const cfg = arApi.getFeatureConfig(ARTrackingType.Plane) as PlaneDetectionConfig;
        if (cfg && cfg.enable) {
            if (cfg.usePlaneShape) {
                raycast |= ARRayCastMode.RAYCAST_PLANE_POLYGON;
            } else {
                raycast |= ARRayCastMode.RAYCAST_PLANE_EXTENT;
            }
        }
        const cfg2 = arApi.getFeatureConfig(ARTrackingType.WorldMesh) as WorldMeshConfig;
        if (cfg2 && cfg2.enable) {
            raycast |= ARRayCastMode.RAYCAST_MESH;
        }
        return raycast;
    }

    private _cancelPlace () {
        const placeEvent: PlaceEvent = {
            anchor: null,
            prefab: null,
            state: StateAction.Cancel,
        };
        this.placeAction.isPlacing = false;
        arEvent.dispatch(ARInternalEventType.PLACE_ACTION, placeEvent);
    }

    private _triggerPlace (touchPoint: Vec2, state: StateAction) {
        if (state === StateAction.Cancel) {
            this._cancelPlace();
            return;
        }
        const placeable = this.placeAction.getPlaceable();
        if (!placeable) {
            this._cancelPlace();
            return;
        }

        if (this.placeAction.calculation_Mode === CalculationMode.AR_HIT_DETECTION) {
            const device = arApi.getDevice();
            if (device) {
                const raycast = this.placeAction.getPlaceHitRayCastMode();
                if (raycast === 0) {
                    this._cancelPlace();
                    return;
                }
                const promise = device.screenHitTest(raycast, touchPoint).then((hitResult) => {
                    if (hitResult) {
                        this._placeHitResult(hitResult, state);
                    } else {
                        this._cancelPlace();
                    }
                });
            }
        } else if (this.placeAction.calculation_Mode === CalculationMode.SPATIAL_DISTANCE) {
            const width = screen.windowSize.width;
            const height = screen.windowSize.height;
            touchPoint = new Vec2(width / 2, height / 2);

            if (!this.placeAction.detectOcclusion) {
                this._placeBySpatialAnchor(touchPoint, state);
            } else {
                const device = arApi.getDevice();
                if (device) {
                    const raycast = this.placeAction.getPlaceHitRayCastMode();
                    if (raycast === 0) {
                        this._cancelPlace();
                        return;
                    }
                    const promise = device.screenHitTest(raycast, touchPoint).then((hitResult) => {
                        if (hitResult) {
                            const out = new Vec3();
                            const arCamera = director.getScene()!.getComponentInChildren(ARCameraMgr)!;
                            arCamera?.Camera?.screenToWorld(new Vec3(touchPoint.x, touchPoint.y), out);
                            const dist = hitResult.pose.position.clone().subtract(out).length();
                            if (dist > this.placeAction.distance) {
                                this._placeBySpatialAnchor(touchPoint, state);
                                return;
                            }
                            this._placeHitResult(hitResult, state);
                        } else {
                            this._placeBySpatialAnchor(touchPoint, state);
                        }
                    });
                }
            }
        } else if (this.placeAction.calculation_Mode === CalculationMode.COLLISION_DETECTION)  {
            const arCamera = director.getScene()!.getComponentInChildren(ARCameraMgr)!;
            const outRay = new geometry.Ray();
            arCamera?.Camera?.screenPointToRay(touchPoint.x, touchPoint.y, outRay);
            const hit = PhysicsSystem.instance.raycastClosest(outRay, 0xffffffff, 10000000, false);
            if (hit) {
                const raycastClosestResult = PhysicsSystem.instance.raycastClosestResult;
                const anchor = {
                    id: -1,
                    pose: {
                        position: raycastClosestResult.hitPoint,
                        rotation: new Quat(0, 0, 0, 1),
                    },
                };
                this._placeHitResult(anchor, state);
            } else {
                this._cancelPlace();
            }
        }
    }

    private _placeBySpatialAnchor (touchPoint: Vec2, state?: StateAction) {
        const outRay = new geometry.Ray();
        const arCamera = director.getScene()!.getComponentInChildren(ARCameraMgr)!;
        arCamera?.Camera?.screenPointToRay(touchPoint.x, touchPoint.y, outRay);
        const temp = outRay.o.add(outRay.d.multiplyScalar(this.placeAction.distance));

        const anchor = {
            id: -1,
            pose: {
                position: temp,
                rotation: new Quat(0, 0, 0, 1),
            },
        };

        if (state) {
            this._placeHitResult(anchor, state);
        } else {
            this.placeAction.updateLocatedNode(anchor);
        }
    }

    private _placeHitResult (anchor: ARAnchor, state: StateAction) {
        const placeEvent: PlaceEvent = {
            anchor,
            prefab: this.placeAction.placement_Prefab,
            state,
        };

        if (state === StateAction.Enter) {
            this.placeAction.isPlacing = true;
        } else if (state === StateAction.Exit) {
            this.placeAction.isPlacing = false;
        }
        arEvent.dispatch(ARInternalEventType.PLACE_ACTION, placeEvent);
    }

    private _updateLocatedPlace () {
        if (this.placeAction.calculation_Mode === CalculationMode.SPATIAL_DISTANCE) {
            const width = screen.windowSize.width;
            const height = screen.windowSize.height;
            const centerPos = new Vec2(width / 2, height / 2);
            //console.log(centerPos.x, centerPos.y);

            if (!this.placeAction.detectOcclusion) {
                this._placeBySpatialAnchor(centerPos);
            } else {
                const device = arApi.getDevice();
                if (device) {
                    const raycast = this.placeAction.getPlaceHitRayCastMode();
                    if (raycast === 0) {
                        this.placeAction.updateLocatedNode();
                        return;
                    }
                    const promise = device.screenHitTest(raycast, centerPos).then((hitResult) => {
                        if (hitResult) {
                            const out = new Vec3();
                            const arCamera = director.getScene()!.getComponentInChildren(ARCameraMgr)!;
                            arCamera?.Camera?.screenToWorld(new Vec3(centerPos.x, centerPos.y), out);
                            const dist = hitResult.pose.position.clone().subtract(out).length();
                            if (dist > this.placeAction.distance) {
                                this._placeBySpatialAnchor(centerPos);
                                return;
                            }
                            this.placeAction.updateLocatedNode(hitResult);
                        } else {
                            this._placeBySpatialAnchor(centerPos);
                        }
                    });
                }
            }
        }
    }

    private _triggerScale (event: EventTouch, state: StateAction) {
        if (!this.selectScaleAction.enable) {
            return;
        }
        const touches = event.getTouches();
        const scaleEvent: ScaleEvent = {
            scale: 0,
            state: StateAction.Enter,
        };
        if (touches.length > 1 && event.getAllTouches().length > 1) {
            const temp = new Vec2();
            Vec2.subtract(temp, touches[0].getLocation(), touches[1].getLocation());
            // 双指当前间距
            const distance = temp.length();
            if (!this.selectScaleAction.isScaling) {
                this.selectScaleAction.isScaling = true;
                // 双指初始间距
                this.selectScaleAction.originalTouchDistance = distance;
                scaleEvent.state = StateAction.Enter;
                arEvent.dispatch(ARInternalEventType.SELECT_SCALE_ACTION, scaleEvent);
            }
            // 等比关系：双指当前间距 / 双指初始间距 = 节点当前缩放 / 节点初始缩放
            const originalTouchDistance = this.selectScaleAction.originalTouchDistance;
            const scale = 1 + ((distance - originalTouchDistance) / originalTouchDistance) * this.selectScaleAction.sensitivity;
            scaleEvent.state = StateAction.Update;
            scaleEvent.scale = scale;
            arEvent.dispatch(ARInternalEventType.SELECT_SCALE_ACTION, scaleEvent);
        } else if (this.selectScaleAction.isScaling) {
            this.selectScaleAction.isScaling = false;
            scaleEvent.state = StateAction.Exit;
            arEvent.dispatch(ARInternalEventType.SELECT_SCALE_ACTION, scaleEvent);
        }
    }

    private _handlerRotateRotation (event: EventTouch) {
        const touches = event.getTouches();
        const tempPrevious = new Vec2();
        const tempNow = new Vec2();
        Vec2.subtract(tempPrevious, touches[0].getPreviousLocation(), touches[1].getPreviousLocation());
        Vec2.subtract(tempNow, touches[0].getLocation(), touches[1].getLocation());
        // 双指对比上一次变化角度
        let rotation = tempPrevious.signAngle(tempNow);
        //Fixed drag direction
        const delta = touches[0].getDelta();
        if (delta.x > 0 && delta.y >= 0) {
            rotation = Math.abs(rotation);
        } else if (delta.x < 0 && delta.y <= 0) {
            rotation = -Math.abs(rotation);
        }
        // 手指旋转角度*旋转速率
        const rot = rotation * this.selectRotateAction.twistDegree;

        const rotateEvent: RotateEvent = {
            rotation: new Vec3(0, rot, 0),
            state: StateAction.Enter,
        };
        if (!this.selectRotateAction.isRotation) {
            this.selectRotateAction.isRotation = true;
            rotateEvent.state = StateAction.Enter;
            arEvent.dispatch(ARInternalEventType.SELECT_ROTATE_ACTION, rotateEvent);
        } else {
            rotateEvent.state = StateAction.Update;
            arEvent.dispatch(ARInternalEventType.SELECT_ROTATE_ACTION, rotateEvent);
        }
    }

    private _handlerDragRotation (event: EventTouch, isTwoFinger: boolean) {
        const touches = event.getTouches();
        let delta;
        if (isTwoFinger) {
            delta = touches[0].getDelta().length() < touches[1].getDelta().length() ? touches[0].getDelta() : touches[1].getDelta();
        } else {
            delta = touches[0].getDelta();
        }

        // (手指移动增量/width)*拖拽速率
        const width = screen.windowSize.width;
        const rotY = (delta.x / width) * this.selectRotateAction.dragDegree;
        const rotX = (delta.y / width) * this.selectRotateAction.dragDegree;

        const rotateEvent: RotateEvent = {
            rotation: new Vec3(rotX, rotY, 0),
            state: StateAction.Enter,
        };
        if (!this.selectRotateAction.isRotation) {
            this.selectRotateAction.isRotation = true;
            rotateEvent.state = StateAction.Enter;
            arEvent.dispatch(ARInternalEventType.SELECT_ROTATE_ACTION, rotateEvent);
        } else {
            rotateEvent.state = StateAction.Update;
            arEvent.dispatch(ARInternalEventType.SELECT_ROTATE_ACTION, rotateEvent);
        }
    }

    private _triggerRotation (event: EventTouch, state: StateAction) {
        if (!this.selectRotateAction.enable) {
            return;
        }
        const touches = event.getTouches();
        if (touches.length > 1 && state === StateAction.Update) {
            if (this.selectRotateAction.gesture === RotateGesture.Two_Finger_Rotate) {
                this._handlerRotateRotation(event);
            } else if (this.selectRotateAction.gesture === RotateGesture.Two_Finger_Drag) {
                this._handlerDragRotation(event, true);
            }
        } else if (this.selectRotateAction.gesture === RotateGesture.Drag && state === StateAction.Update) {
            this._handlerDragRotation(event, false);
        } else if (state === StateAction.Exit) {
            this.selectRotateAction.isRotation = false;
            const rotateEvent: RotateEvent = {
                rotation: new Vec3(0, 0, 0),
                state,
            };
            arEvent.dispatch(ARInternalEventType.SELECT_ROTATE_ACTION, rotateEvent);
        }
    }

    private _triggerMove (event: EventTouch, state: StateAction) {
        if (!this.selectMoveAction.enable) {
            return;
        }
        const selectable: Selectable = this._selected[0];
        if (!selectable) {
            return;
        } else if (state === StateAction.Exit) {
            selectable.isMoveHit = false;
            this.selectMoveAction.isMoving = false;

            const moveEvent: MoveEvent = {
                moveNodeUuid: selectable.node.uuid,
                pose: null,
                ray: null,
                state,
            };
            arEvent.dispatch(ARInternalEventType.SELECT_MOVE_ACTION, moveEvent);
            return;
        }

        if (!this.selectMoveAction.isDragGesture()) {
            return;
        }

        const touchPoint = event.getLocation();
        const arCamera = director.getScene()!.getComponentInChildren(ARCameraMgr)!;
        const outRay = new geometry.Ray();
        arCamera?.Camera?.screenPointToRay(touchPoint.x, touchPoint.y, outRay);

        if (!selectable.isMoveHit) {
            const hit = PhysicsSystem.instance.raycast(outRay, 0xffffffff, 10000000, false);
            if (hit) {
                const results = PhysicsSystem.instance.raycastResults;
                for (let i = 0; i < results.length; i++) {
                    const result = results[i];
                    const collider = result.collider;
                    const hitSelectable: Selectable = collider.node.getComponent(Selectable)!;
                    if (hitSelectable && hitSelectable.isSelected && hitSelectable.node.uuid === selectable.node.uuid) {
                        selectable.isMoveHit = true;
                    }
                }
            }
        }

        if (selectable.isMoveHit) {
            this.selectMoveAction.isMoving = true;
            if (selectable.transformMode === TransformModeType.SPACE) {
                const moveEvent: MoveEvent = {
                    moveNodeUuid: selectable.node.uuid,
                    pose: null,
                    ray: outRay,
                    state,
                };
                arEvent.dispatch(ARInternalEventType.SELECT_MOVE_ACTION, moveEvent);
            } else {
                const device = arApi.getDevice();
                if (device) {
                    const raycast = this._getHitRayCastMode();
                    const promise = device.screenHitTest(raycast, touchPoint).then((hitResult) => {
                        if (hitResult) {
                            const pose: ARPose = hitResult.pose;
                            const moveEvent: MoveEvent = {
                                moveNodeUuid: selectable.node.uuid,
                                pose,
                                ray: null,
                                state,
                            };
                            arEvent.dispatch(ARInternalEventType.SELECT_MOVE_ACTION, moveEvent);
                        }
                    });
                }
            }
        }
    }

    public enableActionProp (args0: any, args1: any): void {
        //console.log(args0, args1);
        switch (args0) {
        case 'cc.SelectAction':
            this.selectAction.enable = args1;
            break;
        case 'cc.SelectMoveAction':
            this.selectMoveAction.enable = args1;
            break;
        case 'cc.SelectRotateAction':
            this.selectRotateAction.enable = args1;
            break;
        case 'cc.SelectScaleAction':
            this.selectScaleAction.enable = args1;
            break;
        case 'cc.PlaceAction':
            this.placeAction.enable = args1;
            break;
        default:
            break;
        }
    }
}
