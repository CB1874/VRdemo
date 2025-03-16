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

import { _decorator, Component, ccenum, Node, Collider } from 'cc';
// eslint-disable-next-line max-len
import { InteractorState, InteractorTriggerState, IXrInteractable, SelectActionTrigger_Type, StateType, XrControlEventType, XrEventHandle } from './xr-interactable';
import { InteractorEvents } from '../event/interactor-events';
import { InteractionMask } from './interaction-mask';

const { property } = _decorator;

ccenum(SelectActionTrigger_Type);

export class XrInteractor extends Component {
    @property({ serializable: true })
    protected _interactionLayerMask = 1;
    @property({ serializable: true })
    protected _attachTransform: Node | null = null;
    @property({ serializable: true })
    protected _selectActionTrigger: SelectActionTrigger_Type = SelectActionTrigger_Type.State;

    protected _selectInteractorState: InteractorState = InteractorState.End;
    protected _activateInteractorState: InteractorState = InteractorState.End;
    protected _selectValue = 0;
    protected _activateValue = 0;

    protected _triggerState = false;
    protected _triggerToggleState = false;
    protected _triggerStickyState = false;
    protected _activateTriggerState = false;
    protected _activateTriggerToggleState = false;
    protected _activateTriggerStickyState = false;
    protected _selectState = false;
    protected _activateState = false;
    protected _interactorEvents: InteractorEvents | null = null;
    protected _event = new XrEventHandle('XrInteractor');
    protected _collider: Collider | null = null;
    protected _activateCollider: Collider | null = null;
    protected _uiPressCollider: Collider | null = null;
    protected _accupyLine = false;

    // The triggered object Interactable
    protected _beTriggerNode: IXrInteractable | null = null;

    @property({
        type: InteractionMask.BitMask,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_interactor.interactionLayerMask'
        })
    set interactionLayerMask (val) {
        if (val === this._interactionLayerMask) {
            return;
        }
        this._interactionLayerMask = val;
    }
    get interactionLayerMask () {
        return this._interactionLayerMask;
    }

    @property({
        type: Node,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.xr_interactor.attachTransform'
        })
    set attachTransform (val) {
        if (val === this._attachTransform) {
            return;
        }
        this._attachTransform = val;
    }
    get attachTransform () {
        return this._attachTransform;
    }

    @property({
        type: SelectActionTrigger_Type,
        displayOrder: 8,
        tooltip: 'i18n:xr-plugin.xr_interactor.selectActionTrigger'
        })
    set selectActionTrigger (val) {
        if (val === this._selectActionTrigger) {
            return;
        }
        this._selectActionTrigger = val;
    }
    get selectActionTrigger () {
        return this._selectActionTrigger;
    }

    set event (val) {
        if (val === this._event) {
            return;
        }
        this._event = val;
    }
    get event () {
        return this._event;
    }

    onEnable () {
        this.node.on(InteractorState.Start, this._stateStart, this);
        this.node.on(InteractorState.Stay, this._stateStay, this);
        this.node.on(InteractorState.End, this._stateEnd, this);
        this.node.on(InteractorState.Cancel, this._stateCancel, this);

        this._event.triggerNode = this.node;
        this._event.triggerType = this._selectActionTrigger;
    }

    onDisable () {
        this.node.off(InteractorState.Start, this._stateStart, this);
        this.node.off(InteractorState.Stay, this._stateStay, this);
        this.node.off(InteractorState.End, this._stateEnd, this);
        this.node.off(InteractorState.Cancel, this._stateCancel, this);
    }

    private _stateStart (stateType: StateType) {
        if (stateType === StateType.Select) {
            this._selectInteractorState = InteractorState.Start;
        } else {
            this._activateInteractorState = InteractorState.Start;
        }
    }

    private _stateStay (stateType: StateType) {
        if (stateType === StateType.Select) {
            this._selectInteractorState = InteractorState.Stay;
        } else {
            this._activateInteractorState = InteractorState.Stay;
        }
    }

    private _stateEnd (stateType: StateType) {
        if (stateType === StateType.Select) {
            this._selectInteractorState = InteractorState.End;
            this._selectState = false;
        } else {
            this._activateInteractorState = InteractorState.End;
            this._activateState = false;
        }
    }

    private _stateCancel (stateType: StateType) {
        if (stateType === StateType.Select) {
            this._selectInteractorState = InteractorState.Cancel;
        } else {
            this._activateInteractorState = InteractorState.Cancel;
        }
    }

    protected _judgeHit (type: XrControlEventType) {
        return false;
    }

    protected _judgeTrigger () {
        // Determine if the object is captured
        if (!this._beTriggerNode) {
            return false;
        }
        // Has captured the object, judge the captured object, its grasp is its own
        if (this._beTriggerNode.triggerNode === this.node) {
            return true;
        }
        return false;
    }

    protected _emitSelectEntered (type: XrControlEventType) {
        if (type === XrControlEventType.SELECT_ENTERED) {
            this._collider?.node.emit(InteractorTriggerState.Select_Start, this._event);
        } else if (type === XrControlEventType.ACTIVATED) {
            this._activateCollider?.node.emit(InteractorTriggerState.Activite_Start, this._event);
        }
    }

    private _emitSelectEnd (type: XrControlEventType) {
        if (type === XrControlEventType.SELECT_EXITED) {
            this._collider?.node.emit(InteractorTriggerState.Select_End, this._event);
            this._collider = null;
        } else if (type === XrControlEventType.DEACTIVITED) {
            this._activateCollider?.node.emit(InteractorTriggerState.Activite_End, this._event);
            this._activateCollider = null;
        }
    }

    private _interactorStart (event: XrEventHandle, state: boolean, typeEnter: XrControlEventType, stateType: StateType) {
        this._event.model = event.model;
        this._event.eventHandle = event.eventHandle;
        switch (this._selectActionTrigger) {
        case SelectActionTrigger_Type.State:
        case SelectActionTrigger_Type.State_Change:
            if ((this._selectInteractorState === InteractorState.End && stateType === StateType.Select)
                || (this._activateInteractorState === InteractorState.End && stateType === StateType.Activite)) {
                if (this._judgeHit(typeEnter)) {
                    this._emitSelectEntered(typeEnter);
                }
            }
            break;
        case SelectActionTrigger_Type.Toggle:
            if ((this._selectInteractorState === InteractorState.End && stateType === StateType.Select)
                || (this._activateInteractorState === InteractorState.End && stateType === StateType.Activite)) {
                if (this._judgeHit(typeEnter)) {
                    this._emitSelectEntered(typeEnter);
                }
            } else if ((this._selectInteractorState === InteractorState.Start && stateType === StateType.Select)
                || (this._activateInteractorState === InteractorState.Start && stateType === StateType.Activite) && state) {
                this._judgeHit(typeEnter);
                if (stateType === StateType.Select) {
                    this._emitSelectEnd(XrControlEventType.SELECT_EXITED);
                } else {
                    this._emitSelectEnd(XrControlEventType.DEACTIVITED);
                }

                state = false;
                // The first time it's triggered, the second time it's over whether it hits or not
                this._stateEnd(stateType);
            }
            break;
        case SelectActionTrigger_Type.Sticky:
            if ((this._selectInteractorState === InteractorState.End && stateType === StateType.Select)
                || (this._activateInteractorState === InteractorState.End && stateType === StateType.Activite)) {
                if (this._judgeHit(typeEnter)) {
                    this._emitSelectEntered(typeEnter);
                }
            }
            break;
        default:
            break;
        }

        return state;
    }

    private _interactorStay (event: XrEventHandle, typeEnter: XrControlEventType, stateType: StateType) {
        if (this._selectActionTrigger === SelectActionTrigger_Type.State) {
            this._event.model = event.model;
            this._event.eventHandle = event.eventHandle;
            if ((this._selectInteractorState === InteractorState.End && stateType === StateType.Select)
                || (this._activateInteractorState === InteractorState.End && stateType === StateType.Activite)) {
                if (this._judgeHit(typeEnter)) {
                    this._emitSelectEntered(typeEnter);
                }
            }
        }
    }

    private _interactorEnd (event: XrEventHandle, state: boolean, stateType: StateType) {
        this._event.model = event.model;
        this._event.eventHandle = event.eventHandle;
        let typeEnd;
        if (stateType === StateType.Select) {
            typeEnd = XrControlEventType.SELECT_EXITED;
        } else {
            typeEnd = XrControlEventType.DEACTIVITED;
        }
        switch (this._selectActionTrigger) {
        case SelectActionTrigger_Type.State:
        case SelectActionTrigger_Type.State_Change:
            if ((this._selectInteractorState === InteractorState.Start && stateType === StateType.Select)
                || (this._activateInteractorState === InteractorState.Start && stateType === StateType.Activite)) {
                this._emitSelectEnd(typeEnd);
            }
            break;
        case SelectActionTrigger_Type.Toggle:
            if ((this._selectInteractorState === InteractorState.Start && stateType === StateType.Select)
                || (this._activateInteractorState === InteractorState.Start && stateType === StateType.Activite)) {
                state = true;
            }
            break;
        case SelectActionTrigger_Type.Sticky:
            if ((this._selectInteractorState === InteractorState.Start && stateType === StateType.Select)
                || (this._activateInteractorState === InteractorState.Start && stateType === StateType.Activite)) {
                if (state) {
                    if ((typeEnd === XrControlEventType.SELECT_EXITED && this._collider)
                        || (typeEnd === XrControlEventType.DEACTIVITED && this._activateCollider)) {
                        this._judgeHit(typeEnd);
                        this._emitSelectEnd(typeEnd);
                        state = false;
                        // The first time it's triggered, the second time it's over whether it hits or not
                        this._stateEnd(stateType);
                    }
                } else {
                    state = true;
                }
            }
            break;
        default:
            break;
        }

        return state;
    }

    public selectStart (event: XrEventHandle) {
        this._interactorEvents?.selectEntered(this._event);
        this._selectState = this._interactorStart(event, this._selectState, XrControlEventType.SELECT_ENTERED, StateType.Select);
        this._collider?.node.emit(XrControlEventType.SELECT_ENTERED, this._event);
    }

    public selectStay (event: XrEventHandle) {
        this._interactorEvents?.selectStay(this._event);
        this._interactorStay(event, XrControlEventType.SELECT_ENTERED, StateType.Select);
        this._collider?.node.emit(XrControlEventType.SELECT_STAY, this._event);
    }

    public selectEnd (event: XrEventHandle) {
        this._interactorEvents?.selectExited(this._event);
        this._collider?.node.emit(XrControlEventType.SELECT_EXITED, this._event);
        this._selectState = this._interactorEnd(event, this._selectState, StateType.Select);
    }

    public activateStart (event: XrEventHandle) {
        this._activateState = this._interactorStart(event, this._activateState, XrControlEventType.ACTIVATED, StateType.Activite);
        this._activateCollider?.node.emit(XrControlEventType.ACTIVATED, this._event);
    }

    public activateStay (event: XrEventHandle) {
        this._interactorStay(event, XrControlEventType.ACTIVATED, StateType.Activite);
        this._activateCollider?.node.emit(XrControlEventType.ACTIVATE_STAY, this._event);
    }

    public activateEnd (event: XrEventHandle) {
        this._activateCollider?.node.emit(XrControlEventType.DEACTIVITED, this._event);
        this._activateState = this._interactorEnd(event, this._activateState, StateType.Activite);
    }

    public uiPressEnter (event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_ENTERED, this._event);
    }

    public uiPressStay (event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_STAY, this._event);
    }

    public uiPressExit (event: XrEventHandle) {
        this._event.deviceType = event.deviceType;
        this._uiPressCollider?.node.emit(XrControlEventType.UIPRESS_EXITED, this._event);
    }
}
