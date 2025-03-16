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

import { _decorator, EventHandler as ComponentEventHandler } from 'cc';
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
// eslint-disable-next-line max-len
import { ARActionData, ARImageActionData, ARMeshActionData, TrackEvent, ARPlaneActionData, ARTrackingState, ImageTrackEvent, MeshTrackEvent, PlaneTrackEvent } from '../utils/ar-defines';
import { ActionType, ARTrackingType } from '../utils/ar-enum';
import { ARActionUpdateBase } from './action-base';

const { ccclass, property } = _decorator;

enum TrackEventState {
    Success,
    Loss,
    Refresh,
    TimeOut
}

/**
 * @en
 * The AR feature tracks the timeout event class
 * @zh
 * AR特性追踪超时事件类
 */
@ccclass('cc.ARTimeoutEvent')
class ARTimeoutEvent {
    @property({
        serializable: true,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.action.trackEvent.timeout.time',
        })
    protected timeout = 10;

    @property({
        serializable: true,
        type:[ComponentEventHandler],
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.action.trackEvent.timeout.event',
        })
    protected event: ComponentEventHandler[] = [];

    private _isEmited = false;

    public handleEvent (t: number) {
        if (!this._isEmited && (t > this.timeout * 1000)) {
            ComponentEventHandler.emitEvents(this.event, null);
            this._isEmited = true;
        }
    }
}

/**
 * @en
 * AR features track the behavior class of events
 * @zh
 * AR特性追踪事件的行为类
 */
@ccclass('cc.ARTrackEvent')
export class ARTrackEvent extends ARActionUpdateBase {
    @property({
        serializable: true,
        type:[ComponentEventHandler],
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.action.trackEvent.onTrackSuccess',
        })
    protected onTrackSuccess: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type:[ComponentEventHandler],
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.action.trackEvent.onTrackRefresh',
        })
    protected onTrackRefresh: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type:[ComponentEventHandler],
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.action.trackEvent.onTrackLoss',
        })
    protected onTrackLoss: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type:[ARTimeoutEvent],
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.action.trackEvent.onTrackTimeout',
        })
    protected onTrackTimeout: ARTimeoutEvent[] = [];

    constructor () {
        super();
        this.type = ActionType.TRACK_EVENT;
    }

    private _isSuccess = false;

    public getTrackingEvent (data: ARActionData): TrackEvent | null {
        if (!data.trackingNode) {
            return null;
        }
        const tb = data.trackingNode.getComponent(ARTrackingBase);
        switch (tb?.trackingType) {
        case ARTrackingType.Plane:
            if (data) {
                const info = data as ARPlaneActionData;
                const plane = new PlaneTrackEvent('PlaneTrackEvent');
                plane.id = info.id;
                plane.anchorType = info.type;
                plane.pose = info.pose;
                plane.trackingState = info.trackingState;
                plane.extent = info.extent;
                return plane;
            }
            break;
        case ARTrackingType.Image:
            if (data) {
                const info = data as ARImageActionData;
                const image = new ImageTrackEvent('ImageTrackEvent');
                image.id = info.id;
                image.pose = info.pose;
                image.trackingState = info.trackingState;
                image.extent = info.extent;
                image.libIndex = info.libIndex;
                return image;
            }
            break;
        case ARTrackingType.WorldMesh:
            if (data) {
                const info = data as ARMeshActionData;
                const mesh = new MeshTrackEvent('MeshTrackEvent');
                mesh.id = info.id;
                mesh.pose = info.pose;
                mesh.trackingState = info.trackingState;
                mesh.vertices = info.vertices;
                mesh.indices = info.indices;
                return mesh;
            }
            break;
        default:
            break;
        }
        return null;
    }

    private getEvents (data, type: TrackEventState) {
        let events: ComponentEventHandler[] = [];
        if (!data.trackingNode) {
            return events;
        }
        const tb = data.trackingNode.getComponent(ARTrackingBase);
        const maps: Map<string, ARTrackEvent> = tb?.getTrackEvents();
        switch (type) {
        case TrackEventState.Success:
            for (const v of maps.values()) {
                events = events.concat(v.onTrackSuccess.slice(0));
            }
            break;
        case TrackEventState.Loss:
            for (const v of maps.values()) {
                events = events.concat(v.onTrackLoss.slice(0));
            }
            break;
        case TrackEventState.Refresh:
            for (const v of maps.values()) {
                events = events.concat(v.onTrackRefresh.slice(0));
            }
            break;
        default:
            break;
        }
        return events;
    }
    /**
    * @en run The action
    * @zh 执行行为
    */
    public runAction (data: ARActionData) {
        let events: ComponentEventHandler[] = [];
        const args = this.getTrackingEvent(data);
        if (data.trackingState === ARTrackingState.TRACKING || data.trackingState === ARTrackingState.PAUSED) {
            events = this.getEvents(data, TrackEventState.Success);
        } else {
            events = this.getEvents(data, TrackEventState.Loss);
        }
        ComponentEventHandler.emitEvents(events, args);
        this._isSuccess = true;
        this.setActivated(true);
    }

    /**
    * @en update The action
    * @zh 刷新行为
    */
    public updateAction (data: ARActionData) {
        if (!data.closeTracking) {
            const args = this.getTrackingEvent(data);
            let events: ComponentEventHandler[] = [];
            if (data.trackingState === ARTrackingState.TRACKING || data.trackingState === ARTrackingState.PAUSED) {
                events = this.getEvents(data, TrackEventState.Refresh);
            } else {
                events = this.getEvents(data, TrackEventState.Loss);
            }
            ComponentEventHandler.emitEvents(events, args);
        }
    }

    /**
    * @en reset the action
    * @zh 重置行为
    */
    public resetAction (data: ARActionData) {
        super.resetAction(data);
        this.updateAction(data);
    }

    public judgeTimeout (t: number) {
        if (this._isSuccess) {
            return;
        }
        this.onTrackTimeout.forEach((element) => {
            element.handleEvent(t);
        });
    }

    public reset () {
        this.onTrackSuccess = [];
        this.onTrackRefresh = [];
        this.onTrackLoss = [];
        this.onTrackTimeout = [];
        this.setActivated(false);
    }
}
