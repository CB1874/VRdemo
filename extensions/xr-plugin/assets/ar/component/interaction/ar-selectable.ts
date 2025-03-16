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

// eslint-disable-next-line max-len
import { _decorator, Component, EventHandler as ComponentEventHandler, BoxCollider, Prefab, Node, instantiate, ccenum, BitMask, Vec3, Quat, Collider, CCObject, director } from 'cc';
import { EDITOR } from 'cc/env';
import { ARCameraMgr } from '../ar-camera';
import { arEvent, ARInternalEventType } from '../framework/utils/ar-event';
import { StateAction, ScaleEvent, RotateEvent, MoveEvent, TransformModeType, SelectEvent } from './ar-interaction-define';
import { AxisFlagType } from './constrain/axis-constraint';
import { MinMaxScaleConstraint } from './constrain/min-max-scale-constraint';
import { RotationAxisConstrain } from './constrain/rotation-axis-constraint';

const { ccclass, property, help, menu, disallowMultiple, executeInEditMode } = _decorator;

enum SelectableActionType {
    MOVE = 1 << 0,
    ROTATE = 1 << 1,
    SCALE = 1 << 2
}

class SelectableActionTypes {
    /**
      * @en All SelectActionType in [[BitMask]] type
      * @zh 包含所有行为类型的 [[BitMask]]
      */
    public static BitMask = BitMask({ ...SelectableActionType });
}

ccenum(SelectableActionTypes);

@ccclass('cc.SelectionEvents')
class SelectionEvents {
    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.selectable.select_events.selectEnterEvents',
        })
    protected selectEnterEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.selectable.select_events.selectExitEvents',
        })
    protected selectExitEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.selectable.select_events.selectCancelEvents',
        })
    protected selectCancelEvents: ComponentEventHandler[] = [];

    public selectEntered (args: any) {
        ComponentEventHandler.emitEvents(this.selectEnterEvents, args);
    }

    public selectExited (args: any) {
        ComponentEventHandler.emitEvents(this.selectExitEvents, args);
    }

    public selectCanceled (args: any) {
        ComponentEventHandler.emitEvents(this.selectCancelEvents, args);
    }
}

/**
 * @en
 * Select the interactive component, and the object added with the component can be selected and moved, rotated, and scaled
 * @zh
 * 选择交互组件，添加了该组件的物体能够被选中，并进行移动、旋转、缩放操作
 */
@ccclass('cc.Selectable')
@help('i18n:cc.Selectable')
@menu('XR/Interaction/Selectable')
@disallowMultiple
@executeInEditMode
export class Selectable extends Component {
    @property({serializable: true})
    protected _allowedActions = SelectableActionType.MOVE | SelectableActionType.ROTATE | SelectableActionType.SCALE;

    @property({serializable: true})
    protected _selectedVisualization: Prefab | null = null;

    @property({
        type: SelectableActionTypes.BitMask,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.selectable.allowedActions',
        })
    set allowedActions (val) {
        if (val === this._allowedActions) {
            return;
        }
        this._allowedActions = val;
    }
    get allowedActions () {
        return this._allowedActions;
    }

    @property({
        serializable: true,
        type: SelectionEvents,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.selectable.selectionEvents',
        })
    protected selectionEvents: SelectionEvents = new SelectionEvents();

    @property({
        type: Prefab,
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.selectable.selectedVisualization',
        })
    set selectedVisualization (val) {
        if (val === this._selectedVisualization) {
            return;
        }
        this._selectedVisualization = val;
        this.createScenePrefabEffect(val);
    }
    get selectedVisualization () {
        return this._selectedVisualization;
    }

    private _transformMode: TransformModeType = TransformModeType.SPACE;
    public set transformMode (val) {
        this._transformMode = val;
    }
    public get transformMode () {
        return this._transformMode;
    }

    private _transformPoint: Vec3 = new Vec3();
    public set transformPoint (val) {
        this._transformPoint.set(val);
    }
    public get transformPoint () {
        return this._transformPoint;
    }

    private _sceneEffect: Node | null = null;
    public get selectedEffect () {
        return this._sceneEffect;
    }

    private _isSelected = false;
    public set isSelected (bSel: boolean) {
        this._isSelected = bSel;

        if (!this._sceneEffect) {
            this.createScenePrefabEffect(this._selectedVisualization);
        }
        if (this._sceneEffect) {
            this._sceneEffect.active = this._isSelected;
        }
    }
    public get isSelected () {
        return this._isSelected;
    }

    private _isMoveHit = false;
    public set isMoveHit (bHit: boolean) {
        this._isMoveHit = bHit;
    }
    public get isMoveHit () {
        return this._isMoveHit;
    }

    private _enterScale: Vec3 = new Vec3(1, 1, 1);
    private _oriScale: Vec3 = new Vec3(1, 1, 1);
    private _enterPos: Vec3 = new Vec3(0, 0, 0);

    onLoad () {
        this._oriScale.set(this.node.scale);
        if (!this.node.getComponent(Collider)) {
            this.node.addComponent(BoxCollider);
        }
    }

    onEnable () {
        arEvent.on(ARInternalEventType.SELECT_ACTION, this._selectAction, this);

        if (this._allowedActions & SelectableActionType.MOVE) {
            arEvent.on(ARInternalEventType.SELECT_MOVE_ACTION, this._selectMoveAction, this);
        }
        if (this._allowedActions & SelectableActionType.ROTATE) {
            arEvent.on(ARInternalEventType.SELECT_ROTATE_ACTION, this._selectRotateAction, this);
        }
        if (this._allowedActions & SelectableActionType.SCALE) {
            arEvent.on(ARInternalEventType.SELECT_SCALE_ACTION, this._selectScaleAction, this);
        }

        this.createScenePrefabEffect(this._selectedVisualization);
    }

    onDisable () {
        arEvent.off(ARInternalEventType.SELECT_ACTION, this._selectAction, this);

        if (this._allowedActions & SelectableActionType.MOVE) {
            arEvent.off(ARInternalEventType.SELECT_MOVE_ACTION, this._selectMoveAction, this);
        }
        if (this._allowedActions & SelectableActionType.ROTATE) {
            arEvent.off(ARInternalEventType.SELECT_ROTATE_ACTION, this._selectRotateAction, this);
        }
        if (this._allowedActions & SelectableActionType.SCALE) {
            arEvent.off(ARInternalEventType.SELECT_SCALE_ACTION, this._selectScaleAction, this);
        }

        this.removePrefabEffect();
    }

    onDestroy () {
        this.removePrefabEffect();
    }

    private _selectAction (data: SelectEvent) {
        if (data.uuid !== this.node.uuid) {
            return;
        }
        switch (data.state) {
        case StateAction.Enter:
            this.isSelected = true;
            break;
        case StateAction.Cancel:
            this.isSelected = false;
            break;
        default:
            break;
        }
    }

    private _hitPlane (out: Vec3, ori: Vec3, direction: Vec3, planeOri: Vec3, planeNormal: Vec3) {
        // Calculating the cos angle between a ray and a plane
        const cosA = Vec3.dot(planeNormal, direction);
        if (cosA === 0) {
            return;
        }
        // Calculate distance
        const dot2 = Vec3.dot(planeNormal, ori);
        const dot3 = Vec3.dot(planeNormal, planeOri);
        // Distance ratio
        const t = (dot2 - dot3) / cosA;
        out = Vec3.subtract(out, ori, direction.multiplyScalar(t));
    }

    private _moveOutHit (data: MoveEvent) {
        const ray = data.ray;
        if (!ray) {
            return;
        }
        const desiredPosition = new Vec3();
        this._hitPlane(desiredPosition, ray.o, ray.d, this.node.worldPosition, Vec3.UP);
        const cosA = Vec3.dot(Vec3.UP, ray.d.normalize());
        if (Math.abs(cosA) <= 0.707) {
            const arCamera = director.getScene()!.getComponentInChildren(ARCameraMgr);
            const forward = arCamera?.Camera?.node.forward;
            if (forward) {
                this._hitPlane(desiredPosition, ray.o, ray.d, this.node.worldPosition, new Vec3(forward.x, 0, forward.z));
            }
        }

        this.node.setWorldPosition(desiredPosition);
    }

    private _moveInHit (data: MoveEvent) {
        if (!data.pose) {
            return;
        }
        const hitPoint = data.pose.position;
        if (hitPoint) {
            // Based on surface displacement
            const out = new Vec3();
            Vec3.subtract(out, this.node.worldPosition, this._transformPoint);
            this._transformPoint.set(hitPoint);
            Vec3.add(out, hitPoint, out);
            this.node.setWorldPosition(out);
        }
    }

    private _selectMoveAction (data: MoveEvent) {
        if (!this._isSelected) {
            return;
        }
        if (data.moveNodeUuid !== this.node.uuid) {
            return;
        }
        if (data.state === StateAction.Update) {
            if (this._transformMode !== TransformModeType.SPACE) {
                this._moveInHit(data);
            } else {
                this._moveOutHit(data);
            }
        }  else if (data.state === StateAction.Exit) {
            this.isMoveHit = false;
        }
    }

    private _rotateByLocal (dir: Vec3, rad: number) {
        // Rotate around itself
        const out = new Quat();
        Quat.rotateAroundLocal(out, this.node.rotation, dir, rad);
        this.node.setRotation(out);
    }

    private _rotateByWorld (dir: Vec3, rad: number) {
        // Rotate around the world
        const out = new Quat();
        Quat.rotateAround(out, this.node.worldRotation, dir, rad);
        this.node.setWorldRotation(out);
    }

    private _selectRotateAction (data: RotateEvent) {
        if (!this._isSelected) {
            return;
        }
        if (data.state === StateAction.Update) {
            const rotation = data.rotation;
            if (this._transformMode === TransformModeType.SPACE) {
                const rotationAxisConstrain = this.getComponent(RotationAxisConstrain);
                if (rotationAxisConstrain) {
                    if (!(rotationAxisConstrain.axisFlag & AxisFlagType.X)) {
                        rotation.x = 0;
                    }
                    if (!(rotationAxisConstrain.axisFlag & AxisFlagType.Y)) {
                        rotation.y = 0;
                    }

                    if (rotationAxisConstrain.useLocalSpace) {
                        if (rotation.y !== 0) {
                            // Rotate around self y
                            this._rotateByLocal(Vec3.UP, rotation.y);
                        }
                        if (rotation.x !== 0) {
                            // Rotate around self x
                            this._rotateByLocal(Vec3.RIGHT, rotation.x);
                        }
                    } else {
                        if (rotation.y !== 0) {
                            // Rotate around the world y
                            this._rotateByWorld(Vec3.UP, rotation.y);
                        }
                        if (rotation.x !== 0) {
                            // Rotate around the world y
                            this._rotateByWorld(Vec3.RIGHT, rotation.x);
                        }
                    }
                } else {
                    if (rotation.y !== 0) {
                        // Rotate around self y
                        this._rotateByLocal(Vec3.UP, rotation.y);
                    }
                    if (rotation.x !== 0) {
                        // Rotate around self x
                        this._rotateByLocal(Vec3.RIGHT, rotation.x);
                    }
                }
            } else {
                // Rotate around self y
                this._rotateByLocal(Vec3.UP, rotation.y);
            }
        }
    }

    private _selectScaleAction (data: ScaleEvent) {
        if (!this._isSelected) {
            return;
        }
        switch (data.state) {
        case StateAction.Enter:
            this._enterScale.set(this.node.scale);
            this._enterPos.set(this.node.worldPosition);
            break;
        case StateAction.Update:
            if (data.state === StateAction.Update) {
                let scale = data.scale;
                const newScale = new Vec3();
                Vec3.multiplyScalar(newScale, this._enterScale, scale);
                const minMax = this.getComponent(MinMaxScaleConstraint);
                if (minMax) {
                    const ratio = newScale.x / this._oriScale.x;
                    if (minMax.minScale > ratio) {
                        scale = minMax.minScale * this._oriScale.x / this._enterScale.x;
                    } else if (minMax.maxScale < ratio) {
                        scale = minMax.maxScale * this._oriScale.x / this._enterScale.x;
                    }
                }
                if (this._transformMode !== TransformModeType.SPACE) {
                    // Plane-based scaling
                    const out = new Vec3();
                    Vec3.subtract(out, this._enterPos, this._transformPoint);
                    Vec3.scaleAndAdd(out, this._transformPoint, out, scale);
                    this.node.setWorldPosition(out);
                }
                this.node.setScale(Vec3.multiplyScalar(new Vec3(), this._enterScale, scale));
            }
            break;
        default:
            break;
        }
    }

    private createScenePrefabEffect (prefab: Prefab | null) {
        this.removePrefabEffect();
        if (prefab) {
            this._sceneEffect = instantiate(prefab);
            this._sceneEffect.name = '__scene_select__';
            this.node.addChild(this._sceneEffect);
            this._sceneEffect._objFlags |= CCObject.Flags.HideInHierarchy;
            this._sceneEffect.setPosition(0, 0, 0);
            this._sceneEffect.active = EDITOR;
        }
    }

    public removePrefabEffect () {
        this._sceneEffect = this.node.getChildByName('__scene_select__');
        if (this._sceneEffect && this._sceneEffect.isValid) {
            this._sceneEffect.destroy();
            this._sceneEffect = null;
        }
    }
}
