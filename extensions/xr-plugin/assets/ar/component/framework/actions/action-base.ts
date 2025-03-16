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
import { ARActionData, ARAnchor } from '../utils/ar-defines';
import { ActionType, ARTrackingType } from '../utils/ar-enum';

const { ccclass, property } = _decorator;

/**
 * @en
 * The base class of AR property tracing behavior
 * @zh
 * AR特性追踪行为的基类
 */
@ccclass('cc.ARActionBase')
export abstract class ARActionBase <T extends ARAnchor> {
    /**
    * @en the action type
    * @zh 行为类型
    */
    public type = ActionType.NONE;

    /**
    * @en run priority
    * @zh 优先级(数字越小，优先级越大)
    */
    public priority = 999;

    /**
    * @en action is activated
    * @zh 是否已激活
    */
    protected activated = false;
    public setActivated (v: boolean) {
        this.activated = v;
    }
    public getActivated (trackingType: ARTrackingType | undefined) {
        if (trackingType === ARTrackingType.Image) {
            return false;
        }
        return this.activated;
    }

    /**
    * @en run the action
    * @zh 执行行为
    */
    public abstract runAction(data: T);

    /**
    * @en reset the action
    * @zh 重置行为
    */
    public resetAction (data: T) {
        this.activated = false;
    }

    /**
    * @en reset the action ui
    * @zh 重置ui
    */
    public abstract reset();
}

@ccclass('cc.ARActionUpdateBase')
export abstract class ARActionUpdateBase extends ARActionBase<ARActionData> {
    @property({ serializable: true })
    protected _matchTrackingUpdate = true;

    /**
    * @en close tracking
    * @zh 关闭追踪
    */
    @property({ serializable: true, visible: false })
    public closeTracking = false;

    /**
    * @en update the action
    * @zh 刷新行为
    */
    public abstract updateAction(data: ARActionData);
}

@ccclass('cc.ARActionFallbackBase')
export abstract class ARActionFallbackBase extends ARActionBase<ARActionData> {
    /**
    * @en update the action
    * @zh 刷新行为
    */
    public abstract runFallbackAction(data: ARActionData);
}
