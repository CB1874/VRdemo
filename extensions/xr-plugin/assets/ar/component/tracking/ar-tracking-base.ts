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

import { _decorator, Component, sys } from 'cc';
import { EDITOR } from 'cc/env';
import { ARActionBase } from '../framework/actions/action-base';
import { ARAnchor, ARActionData } from '../framework/utils/ar-defines';
import { ARFactorBase } from '../framework/factors/factor-base';
import { ActionType, FactorType, ARTrackingType } from '../framework/utils/ar-enum';
import { ARTrackEvent } from '../framework/actions/track-event';

const { property, disallowMultiple, ccclass } = _decorator;

/**
 * @en
 * AR features trace component base classes
 * @zh
 * AR特性追踪组件基类
 */
@ccclass('cc.ARTrackingBase')
@disallowMultiple
export class ARTrackingBase extends Component {
    @property({ serializable: true })
    protected _trackingType: ARTrackingType = ARTrackingType.None;

    @property({ serializable: true })
    public _trackEvent: ARActionBase<ARActionData> | null = null;

    @property({ serializable: true, type: ARFactorBase, visible: false })
    public factors: ARFactorBase<ARAnchor>[] = [];

    @property({ serializable: true, type: ARActionBase, visible: false })
    public actions: ARActionBase<ARActionData>[] = [];

    @property({ serializable: true, type: FactorType, visible: false })
    public menuFactors: FactorType[] = [];

    @property({ serializable: true, type: ActionType, visible: false })
    public menuActions: ActionType[] = [];

    @property({ serializable: true, visible: false })
    public initialized = false;

    @property({ serializable: true, visible: false })
    public dependOnFactorOrAction = true;

    @property({
        serializable: true,
        group: { name: 'Factor', displayOrder: 1},
        visible: false
        })
    private factorFlag = true;
    @property({
        serializable: true,
        group: { name: 'Factor', displayOrder: 2},
        visible: false
        })
    private actionFlag = true;

    public updateFeature (canUse: boolean): void {}
    public addProp (args0: any, args1: any): void {}
    public resetProp (args0: any, args1: any): void {}
    public removeProp (args0: any, args1: any): void {}

    @property({ serializable: true, visible: false })
    protected _childNodes: Map<number, boolean> = new Map<number, boolean>();
    private _trackEvents: Map<string, ARTrackEvent> = new Map<string, ARTrackEvent>();
    protected _startTime = 0;

    set trackingType (val) {
        if (val === this._trackingType) {
            return;
        }
        this._trackingType = val;
    }
    get trackingType () {
        return this._trackingType;
    }

    public addTrackEvent (uuid: string, event: ARTrackEvent) {
        this._trackEvents.set(uuid, event);
    }

    public removeTrackEvent (uuid: string) {
        if (this._trackEvents.has(uuid)) {
            this._trackEvents.delete(uuid);
        }
    }

    public getTrackEvents () {
        return this._trackEvents;
    }

    public addMenuFactor (t: FactorType) {
        if (this.menuFactors.indexOf(t) === -1) {
            this.menuFactors.push(t);
        }
    }
    public addMenuAction (t: ActionType) {
        if (this.menuActions.indexOf(t) === -1) {
            this.menuActions.push(t);
        }
    }
    public addFactor (t: ARFactorBase<ARAnchor>) {
        let hasFactor = false;
        for (let index = 0; index < this.factors.length; index++) {
            const e = this.factors[index];
            if (e.type === t.type) {
                hasFactor = true;
                break;
            }
        }
        if (!hasFactor) {
            this.factors.push(t);
        }
    }

    public removeFactor (type: FactorType) {
        for (let index = 0; index <  this.factors.length; index++) {
            const e = this.factors[index];
            if (e.type === type) {
                this.factors.splice(index, 1);
                break;
            }
        }
    }

    public addAction (t: ARActionBase<ARActionData>) {
        let hasAction = false;
        for (let index = 0; index <  this.actions.length; index++) {
            const e =  this.actions[index];
            if (e.type === t.type) {
                hasAction = true;
                break;
            }
        }
        if (!hasAction) {
            this.actions.push(t);
        }
    }

    public removeAction (type: ActionType) {
        for (let index = 0; index <  this.actions.length; index++) {
            const e =  this.actions[index];
            if (e.type === type) {
                this.actions.splice(index, 1);
                break;
            }
        }
    }

    public showChildren () {
        this.node.children.forEach((child) => {
            child.active = this._childNodes.get(child.getSiblingIndex())!;
        });
    }

    public hideChildren () {
        this.node.children.forEach((child) => {
            child.active = false;
        });
    }

    public init () {
        this._childNodes.clear();
        if (!EDITOR) {
            this.node.children.forEach((child) => {
                this._childNodes.set(child.getSiblingIndex(), child.active);
                child.active = false;
            });
        }
    }

    protected start () {
        this._startTime = sys.now();
    }

    protected onDestroy () {
        this.updateFeature(false);
    }

    protected onEnable () {
        this.updateFeature(true);
    }

    protected onDisable () {
        this.updateFeature(false);
    }

    protected update () {
        if (!EDITOR) {
            if (this._trackEvent) {
                const event = this._trackEvent as ARTrackEvent;
                event.judgeTimeout(sys.now() - this._startTime);
            }
        }
    }
}
