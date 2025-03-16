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

import { _decorator, Node, instantiate } from 'cc';
import { TransformModeType } from '../../interaction/ar-interaction-define';
import { Selectable } from '../../interaction/ar-selectable';
import { ARTrackable } from '../../tracking/ar-trackable';
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
import { ARActionData } from '../utils/ar-defines';
import { ActionType, ARTrackingType } from '../utils/ar-enum';
import { ARActionBase } from './action-base';
import { ARTrackEvent } from './track-event';

const { ccclass, property } = _decorator;

/**
 * @en
 * AR displays the behavior class of the child node
 * @zh
 * AR展示子节点的行为类
 */
@ccclass('cc.ARDisplayChildren')
export class ARDisplayChildren extends ARActionBase <ARActionData> {
    @property({ serializable: true })
    protected _displayChildrenNode = true;

    @property({ serializable: true })
    protected _stopTracking = false;

    @property({ serializable: true })
    protected _resetWhenLoss = true;

    constructor () {
        super();
        this.type = ActionType.DISPLAY_CHILDREN;
        this.priority = 2;
    }

    @property({
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.action.display.displayChildrenNode',
        })
    set displayChildrenNode (val) {
        if (val === this._displayChildrenNode) {
            return;
        }
        this._displayChildrenNode = val;
    }
    get displayChildrenNode () {
        return this._displayChildrenNode;
    }

    @property({
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.action.display.stopTracking',
        })
    set stopTracking (val) {
        if (val === this._stopTracking) {
            return;
        }
        this._stopTracking = val;
    }
    get stopTracking () {
        return this._stopTracking;
    }

    @property({
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.action.display.resetWhenLoss',
        })
    set resetWhenLoss (val) {
        if (val === this._resetWhenLoss) {
            return;
        }
        this._resetWhenLoss = val;
    }
    get resetWhenLoss () {
        return this._resetWhenLoss;
    }

    /**
    * @en run The action
    * @zh 执行行为
    */
    public runAction (data: ARActionData) {
        if (!this._displayChildrenNode) {
            return;
        }
        if (!data.trackingNode || !data.trackableRootNode) {
            return;
        }

        const tb = data.trackingNode.getComponent(ARTrackingBase);
        if (this.getActivated(tb?.trackingType)) {
            return;
        }
        const node: Node = instantiate(data.trackingNode);
        node.active = false;
        data.trackableRootNode.addChild(node);

        const childObj = new Node('ChildObj');
        for (const child of node.children) {
            child.removeFromParent();
            childObj.addChild(child);
            child.active = true;
        }
        node.addChild(childObj);
        data.trackableChildNode = childObj;

        let trackable = node.getComponent(ARTrackable);
        if (!trackable) {
            trackable = node.addComponent(ARTrackable);
        }
        if (trackable) {
            trackable.trackingId = data.id;
        }

        const trackingBase = node.getComponent(ARTrackingBase);
        if (trackingBase) {
            trackingBase.showChildren();

            const trackEvent = (trackingBase._trackEvent as ARTrackEvent);
            if (trackEvent) {
                tb?.addTrackEvent(node.uuid, trackEvent);
            }
            trackingBase.destroy();
        }
        const selectable = node.getComponent(Selectable);
        if (selectable) {
            if (tb?.trackingType === ARTrackingType.Plane) {
                selectable.transformMode = TransformModeType.PLANE;
            }
        }
        node.active = true;
        node.setScale(1, 1, 1);
        data.trackablePose = {
            position: data.pose.position.clone(),
            rotation: data.pose.rotation.clone(),
        };

        data.closeTracking = this._stopTracking;
        data.resetWhenLoss = this._resetWhenLoss;
        data.trackableNode = node;

        this.setActivated(true);
    }

    /**
    * @en reset the action
    * @zh 重置行为
    */
    public resetAction (data: ARActionData) {
        super.resetAction(data);

        if (data.trackableNode) {
            data.trackableNode.active = false;

            if (data.trackingNode) {
                const tb = data.trackingNode.getComponent(ARTrackingBase);
                tb?.removeTrackEvent(data.trackableNode.uuid);
            }
        }
    }

    public reset () {
        this.displayChildrenNode = true;
        this.resetWhenLoss = true;
        this.stopTracking = false;
        this.setActivated(false);
    }
}
