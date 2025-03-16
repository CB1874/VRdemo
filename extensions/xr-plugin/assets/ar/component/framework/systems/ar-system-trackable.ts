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

import { _decorator } from 'cc';
import { ARActionData } from '../utils/ar-defines';
import { ARSystemBase } from './ar-system-base';

const { ccclass } = _decorator;

@ccclass('cc.ARSystemTrackable')
export class ARSystemTrackable {
    private _trackableAddMap: Set<ARActionData> = new Set<ARActionData>();
    private _trackableUpdateMap: Set<ARActionData> = new Set<ARActionData>();
    private _trackableRemoveMap: Set<ARActionData> = new Set<ARActionData>();

    public registerFeatureSystem (system: ARSystemBase<ARActionData>) {
        system.onAddTrackableEvent.on((trackable) => {
            this.onEnableTrackable(trackable);
        });
        system.onUpdateTrackableEvent.on((trackable) => {
            this.onUpdateTrackable(trackable);
        });
        system.onRemoveTrackableEvent.on((trackable) => {
            this.onDisableTrackable(trackable);
        });
    }

    public update () {
        for (const e of this._trackableAddMap) {
            if (e.trackableNode && e.trackablePose) {
                e.trackableNode.setPosition(e.trackablePose.position);
                e.trackableNode.setRotation(e.trackablePose.rotation);
                e.trackableNode.active = true;
            }
        }

        for (const e of this._trackableRemoveMap) {
            if (e.trackableNode) {
                e.trackableNode.active = false;
            }
        }

        for (const e of this._trackableUpdateMap) {
            if (e.trackableNode && e.trackablePose) {
                e.trackableNode.setPosition(e.trackablePose.position);
                e.trackableNode.setRotation(e.trackablePose.rotation);
            }
        }

        this._trackableUpdateMap.clear();
        this._trackableAddMap.clear();
        this._trackableRemoveMap.clear();
    }

    private onEnableTrackable (data: ARActionData | undefined) {
        if (data) {
            this._trackableAddMap.add(data);
        }
    }

    private onUpdateTrackable (data: ARActionData | undefined) {
        if (data) {
            this._trackableUpdateMap.add(data);
        }
    }

    private onDisableTrackable (data: ARActionData | undefined) {
        if (data) {
            this._trackableRemoveMap.add(data);
        }
    }
}
