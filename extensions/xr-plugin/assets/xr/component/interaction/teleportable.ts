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

import { _decorator, ccenum, Node } from 'cc';
import { InteractorTriggerState, InteractorState, XrControlEventType, XrEventHandle, XrInteractable, StateType } from './xr-interactable';
import { Teleporter } from '../locomotion/teleporter';

const { ccclass, help, menu, property } = _decorator;

enum Teleportable_Type {
    Area = 0,
    Anchor = 1
}

enum TeleportTrigger_Type {
    OnSelectExited = 0,
    OnSelectEntered = 1,
    OnActivated = 2,
    OnDeactivited = 3
}

ccenum(Teleportable_Type);
ccenum(TeleportTrigger_Type);

/**
 * @en
 * Make objects available to be a teleportable area/anchor.
 * @zh
 * 可传送对象组件
 */
@ccclass('cc.Teleportable')
@help('i18n:cc.Teleportable')
@menu('XR/Interaction/Teleportable')
export class Teleportable extends XrInteractable {
    @property({ serializable: true })
    protected _teleportableType: Teleportable_Type = Teleportable_Type.Area;
    @property({ serializable: true })
    protected _teleportAnchorNode: Node | null = null;
    @property({ serializable: true })
    protected _teleportTrigger: TeleportTrigger_Type = TeleportTrigger_Type.OnSelectExited;
    @property({ serializable: true })
    protected _teleporter: Teleporter | null = null;

    @property({
        type: Teleportable_Type,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.teleportable.teleportableType'
        })
    set teleportableType (val) {
        if (val === this._teleportableType) {
            return;
        }
        this._teleportableType = val;
    }
    get teleportableType () {
        return this._teleportableType;
    }

    @property({
        type: Node,
        displayOrder: 2,
        visible: (function (this: Teleportable) {
            return this._teleportableType === Teleportable_Type.Anchor;
            }),
        tooltip: 'i18n:xr-plugin.teleportable.teleportAnchorNode'
        })
    set teleportAnchorNode (val) {
        if (val === this._teleportAnchorNode) {
            return;
        }
        this._teleportAnchorNode = val;
    }
    get teleportAnchorNode () {
        return this._teleportAnchorNode;
    }

    @property({
        type: TeleportTrigger_Type,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.teleportable.teleportTrigger'
        })
    set teleportTrigger (val) {
        if (val === this._teleportTrigger) {
            return;
        }
        this._teleportTrigger = val;
    }
    get teleportTrigger () {
        return this._teleportTrigger;
    }

    @property({
        type: Teleporter,
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.teleportable.teleporter'
        })
    set teleporter (val) {
        if (val === this._teleporter) {
            return;
        }
        this._teleporter = val;
    }
    get teleporter () {
        return this._teleporter;
    }

    private _teleportIsCanceled = false;

    public onEnable () {
        if (!this._colliderCom) {
            return;
        }
        switch (this._teleportTrigger) {
        case TeleportTrigger_Type.OnSelectExited:
        case TeleportTrigger_Type.OnSelectEntered:
            this._colliderCom.node.on(InteractorTriggerState.Select_Start, this._selectEntered, this);
            this._colliderCom.node.on(InteractorTriggerState.Select_End, this._selectExited, this);
            this._colliderCom.node.on(InteractorTriggerState.Select_Canceled, this._selectCanceled, this);
            break;
        case TeleportTrigger_Type.OnActivated:
        case TeleportTrigger_Type.OnDeactivited:
            this._colliderCom.node.on(InteractorTriggerState.Activite_Start, this._activited, this);
            this._colliderCom.node.on(InteractorTriggerState.Activite_End, this._deactivited, this);
            this._colliderCom.node.on(InteractorTriggerState.Activite_Canceled, this._activitetCanceled, this);
            break;
        default:
            break;
        }

        if (this.teleportableType === Teleportable_Type.Area) {
            this._colliderCom.node.on(XrControlEventType.HOVER_STAY, this._setRayReticle, this);
        }
    }

    public onDisable () {
        if (!this._colliderCom) {
            return;
        }
        switch (this._teleportTrigger) {
        case TeleportTrigger_Type.OnSelectExited:
        case TeleportTrigger_Type.OnSelectEntered:
            this._colliderCom.node.off(InteractorTriggerState.Select_Start, this._selectEntered, this);
            this._colliderCom.node.off(InteractorTriggerState.Select_End, this._selectExited, this);
            this._colliderCom.node.off(InteractorTriggerState.Select_Canceled, this._selectCanceled, this);
            break;
        case TeleportTrigger_Type.OnActivated:
        case TeleportTrigger_Type.OnDeactivited:
            this._colliderCom.node.off(InteractorTriggerState.Activite_Start, this._activited, this);
            this._colliderCom.node.off(InteractorTriggerState.Activite_End, this._deactivited, this);
            this._colliderCom.node.off(InteractorTriggerState.Activite_Canceled, this._activitetCanceled, this);
            break;
        default:
            break;
        }

        if (this.teleportableType === Teleportable_Type.Area) {
            this._colliderCom.node.off(XrControlEventType.HOVER_STAY, this._setRayReticle, this);
        }
    }

    protected _selectEntered (event: XrEventHandle) {
        this._triggerNode = event.triggerNode;
        if (this._teleportTrigger === TeleportTrigger_Type.OnSelectEntered) {
            this._teleportAction(event);
        }
        this._triggerNode?.emit(InteractorState.Start, StateType.Select);
    }

    protected _selectExited (event: XrEventHandle) {
        if (!this._triggerNode) {
            return;
        }

        if (this._teleportTrigger === TeleportTrigger_Type.OnSelectExited) {
            this._teleportAction(event);
        }
        this._triggerNode?.emit(InteractorState.End, StateType.Select);
        this._triggerNode = null;
    }

    protected _selectCanceled (event: XrEventHandle) {
        this._triggerNode?.emit(InteractorState.Cancel, StateType.Select);
        this._teleportIsCanceled = true;
        this._triggerNode = null;
    }

    protected _activited (event: XrEventHandle) {
        this._triggerNode = event.triggerNode;
        if (this._teleportTrigger === TeleportTrigger_Type.OnActivated) {
            this._teleportAction(event);
        }
        this._triggerNode?.emit(InteractorState.Start, StateType.Activite);
    }

    protected _deactivited (event: XrEventHandle) {
        if (!this._triggerNode) {
            return;
        }

        if (this._teleportTrigger === TeleportTrigger_Type.OnDeactivited) {
            this._teleportAction(event);
        }
        this._triggerNode?.emit(InteractorState.End, StateType.Activite);
        this._triggerNode = null;
    }

    protected _activitetCanceled (event: XrEventHandle) {
        this._triggerNode?.emit(InteractorState.Cancel, StateType.Activite);
        this._teleportIsCanceled = true;
        this._triggerNode = null;
    }

    protected _setRayReticle (event: XrEventHandle) {
        if (!this._rayReticle) {
            return;
        }

        if (this._teleportableType === Teleportable_Type.Anchor) {
            if (this._teleportAnchorNode) {
                this._rayReticle.setWorldPosition(this._teleportAnchorNode.getWorldPosition());
            } else if (event.attachNode) {
                this._rayReticle.setWorldPosition(this.node.getWorldPosition());
            }
        } else if (event.hitPoint) {
            this._rayReticle.setWorldPosition(event.hitPoint);
        }
        this._rayReticle.active = true;
    }

    private _teleportToModel (event: XrEventHandle) {
        if (this._rayReticle) {
            this._rayReticle.active = false;
        }

        if (this._teleportableType === Teleportable_Type.Anchor) {
            if (this._teleporter?.checker?.XR_Agent) {
                if (this._teleportAnchorNode) {
                    this._teleporter.checker.XR_Agent.setWorldPosition(this._teleportAnchorNode.getWorldPosition());
                } else if (event.attachNode) {
                    this._teleporter.checker.XR_Agent.setWorldPosition(this.node.getWorldPosition());
                }
            }
        } else if (this._teleporter?.checker?.XR_Agent && event.hitPoint) {
            this._teleporter.checker.XR_Agent.setWorldPosition(event.hitPoint);
        }
    }

    protected _teleportAction (event: XrEventHandle) {
        if (!event || !this._colliderCom || !event.hitPoint) {
            return;
        }

        this._teleportToModel(event);
    }
}
