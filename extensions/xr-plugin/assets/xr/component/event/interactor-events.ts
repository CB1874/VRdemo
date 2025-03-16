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

import { _decorator, Component, EventHandler as ComponentEventHandler, AudioClip, CCBoolean, sys, DeviceType } from 'cc';
import { XrEventHandle } from '../interaction/xr-interactable';
import { xrInterface } from '../interface/xr-interface';

const { ccclass, help, menu, property } = _decorator;

enum HapticType {
    Select_Entered = 1,
    Select_Stay = 2,
    Select_Exited = 3,
    Hover_Entered = 4,
    Hover_Stay = 5,
    Hover_Exited = 6,
}

@ccclass('cc.AudioEvents')
class AudioEvents {
    @property({ serializable: true })
    protected _onSelectEntered = false;
    @property({ serializable: true })
    protected _onSelectEnteredAudioClip: AudioClip | null = null;
    @property({ serializable: true })
    protected _onSelectStay = false;
    @property({ serializable: true })
    protected _onSelectStayAudioClip: AudioClip | null = null;
    @property({ serializable: true })
    protected _onSelectExited = false;
    @property({ serializable: true })
    protected _onSelectExitedAudioClip: AudioClip | null = null;

    @property({ serializable: true })
    protected _onHoverEntered = false;
    @property({ serializable: true })
    protected _onHoverEnteredAudioClip: AudioClip | null = null;
    @property({ serializable: true })
    protected _onHoverStay = false;
    @property({ serializable: true })
    protected _onHoverStayAudioClip: AudioClip | null = null;
    @property({ serializable: true })
    protected _onHoverExited = false;
    @property({ serializable: true })
    protected _onHoverExitedAudioClip: AudioClip | null = null;

    @property({
        type: CCBoolean,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectEntered'
        })
    set onSelectEntered (val) {
        if (val === this._onSelectEntered) {
            return;
        }
        this._onSelectEntered = val;
    }
    get onSelectEntered () {
        return this._onSelectEntered;
    }

    @property({
        type: AudioClip,
        displayOrder: 2,
        visible: (function (this: AudioEvents) {
            return this._onSelectEntered;
            }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectEnteredAudioClip'
        })
    set onSelectEnteredAudioClip (val) {
        if (val === this._onSelectEnteredAudioClip) {
            return;
        }
        this._onSelectEnteredAudioClip = val;
    }
    get onSelectEnteredAudioClip () {
        return this._onSelectEnteredAudioClip;
    }

    @property({
        type: CCBoolean,
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectStay'
        })
    set onSelectStay (val) {
        if (val === this._onSelectStay) {
            return;
        }
        this._onSelectStay = val;
    }
    get onSelectStay () {
        return this._onSelectStay;
    }

    @property({
        type: AudioClip,
        displayOrder: 4,
        visible: (function (this: AudioEvents) {
            return this._onSelectStay;
            }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectStayAudioClip'
        })
    set onSelectStayAudioClip (val) {
        if (val === this._onSelectStayAudioClip) {
            return;
        }
        this._onSelectStayAudioClip = val;
    }
    get onSelectStayAudioClip () {
        return this._onSelectStayAudioClip;
    }

    @property({
        type: CCBoolean,
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectExited'
        })
    set onSelectExited (val) {
        if (val === this._onSelectExited) {
            return;
        }
        this._onSelectExited = val;
    }
    get onSelectExited () {
        return this._onSelectExited;
    }

    @property({
        type: AudioClip,
        displayOrder: 6,
        visible: (function (this: AudioEvents) {
            return this._onSelectExited;
            }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onSelectExitedAudioClip'
        })
    set onSelectExitedAudioClip (val) {
        if (val === this._onSelectExitedAudioClip) {
            return;
        }
        this._onSelectExitedAudioClip = val;
    }
    get onSelectExitedAudioClip () {
        return this._onSelectExitedAudioClip;
    }

    @property({
        type: CCBoolean,
        displayOrder: 7,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverEntered'
        })
    set onHoverEntered (val) {
        if (val === this._onHoverEntered) {
            return;
        }
        this._onHoverEntered = val;
    }
    get onHoverEntered () {
        return this._onHoverEntered;
    }

    @property({
        type: AudioClip,
        displayOrder: 8,
        visible: (function (this: AudioEvents) {
            return this._onHoverEntered;
            }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverEnteredAudioClip'
        })
    set onHoverEnteredAudioClip (val) {
        if (val === this._onHoverEnteredAudioClip) {
            return;
        }
        this._onHoverEnteredAudioClip = val;
    }
    get onHoverEnteredAudioClip () {
        return this._onHoverEnteredAudioClip;
    }

    @property({
        type: CCBoolean,
        displayOrder: 9,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverStay'
        })
    set onHoverStay (val) {
        if (val === this._onHoverStay) {
            return;
        }
        this._onHoverStay = val;
    }
    get onHoverStay () {
        return this._onHoverStay;
    }

    @property({
        type: AudioClip,
        displayOrder: 10,
        visible: (function (this: AudioEvents) {
            return this._onHoverStay;
            }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverStayAudioClip'
        })
    set onHoverStayAudioClip (val) {
        if (val === this._onHoverStayAudioClip) {
            return;
        }
        this._onHoverStayAudioClip = val;
    }
    get onHoverStayAudioClip () {
        return this._onHoverStayAudioClip;
    }

    @property({
        type: CCBoolean,
        displayOrder: 11,
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverExited'
        })
    set onHoverExited (val) {
        if (val === this._onHoverExited) {
            return;
        }
        this._onHoverExited = val;
    }
    get onHoverExited () {
        return this._onHoverExited;
    }

    @property({
        type: AudioClip,
        displayOrder: 12,
        visible: (function (this: AudioEvents) {
            return this._onHoverExited;
            }),
        displayName: "AudioClip",
        tooltip: 'i18n:xr-plugin.interactor_events.audio_events.onHoverExitedAudioClip'
        })
    set onHoverExitedAudioClip (val) {
        if (val === this._onHoverExitedAudioClip) {
            return;
        }
        this._onHoverExitedAudioClip = val;
    }
    get onHoverExitedAudioClip () {
        return this._onHoverExitedAudioClip;
    }
}

@ccclass('cc.HapticEvents')
class HapticEvents {
    @property({ serializable: true })
    protected _onSelectEntered = false;
    @property({ serializable: true })
    protected _onSelectEnteredHaptic = 0.5;
    @property({ serializable: true })
    protected _onSelectEnteredDuration = 1;

    @property({ serializable: true })
    protected _onSelectStay = false;
    @property({ serializable: true })
    protected _onSelectStayHaptic = 0.5;
    @property({ serializable: true })
    protected _onSelectStayDuration = 1;

    @property({ serializable: true })
    protected _onSelectExited = false;
    @property({ serializable: true })
    protected _onSelectExitedHaptic = 0.5;
    @property({ serializable: true })
    protected _onSelectExitedDuration = 1;

    @property({ serializable: true })
    protected _onHoverEntered = false;
    @property({ serializable: true })
    protected _onHoverEnteredHaptic = 0.5;
    @property({ serializable: true })
    protected _onHoverEnteredDuration = 1;

    @property({ serializable: true })
    protected _onHoverStay = false;
    @property({ serializable: true })
    protected _onHoverStayHaptic = 0.5;
    @property({ serializable: true })
    protected _onHoverStayDuration = 1;

    @property({ serializable: true })
    protected _onHoverExited = false;
    @property({ serializable: true })
    protected _onHoverExitedHaptic = 0.5;
    @property({ serializable: true })
    protected _onHoverExitedDuration = 1;

    /**
    * @en
    * The current HapticEvents of the bar sprite. The valid value is between 0-1.
    * @zh
    * 当前进度值，该数值的区间是 0-1 之间。
    */
    @property({
        type: CCBoolean,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onSelectEntered'
        })
    set onSelectEntered (val) {
        if (val === this._onSelectEntered) {
            return;
        }
        this._onSelectEntered = val;
    }
    get onSelectEntered () {
        return this._onSelectEntered;
    }

    /**
    * @en The current HapticEvent of the bar sprite. The valid value is between 0-1.
    *
    * @zh 当前进度值，该数值的区间是 0-1 之间。
    */
    @property({
        displayOrder: 2,
        visible: (function (this: HapticEvents) {
            return this._onSelectEntered;
            }),
        slide: true,
        range: [0, 1, 0.1],
        displayName: "Haptic Intensity",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onSelectEnteredHaptic'
        })
    set onSelectEnteredHaptic (val) {
        if (this._onSelectEnteredHaptic === val) {
            return;
        }

        this._onSelectEnteredHaptic = val;
    }
    get onSelectEnteredHaptic () {
        return this._onSelectEnteredHaptic;
    }

    @property({
        displayOrder: 3,
        visible: (function (this: HapticEvents) {
            return this._onSelectEntered;
            }),
        min: 0,
        displayName: "Duration",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onSelectEnteredDuration'
        })
    set onSelectEnteredDuration (val) {
        if (val === this._onSelectEnteredDuration) {
            return;
        }
        this._onSelectEnteredDuration = val;
    }
    get onSelectEnteredDuration () {
        return this._onSelectEnteredDuration;
    }

    @property({
        type: CCBoolean,
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onSelectStay'
        })
    set onSelectStay (val) {
        if (val === this._onSelectStay) {
            return;
        }
        this._onSelectStay = val;
    }
    get onSelectStay () {
        return this._onSelectStay;
    }

    /**
    * @en The current HapticEvents of the bar sprite. The valid value is between 0-1.
    *
    * @zh 当前进度值，该数值的区间是 0-1 之间。
    */
    @property({
        displayOrder: 5,
        visible: (function (this: HapticEvents) {
            return this._onSelectStay;
            }),
        slide: true,
        range: [0, 1, 0.1],
        displayName: "Haptic Intensity",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onSelectStayHaptic'
        })
    set onSelectStayHaptic (value) {
        if (this._onSelectStayHaptic === value) {
            return;
        }

        this._onSelectStayHaptic = value;
    }
    get onSelectStayHaptic () {
        return this._onSelectStayHaptic;
    }

    @property({
        displayOrder: 6,
        visible: (function (this: HapticEvents) {
            return this._onSelectStay;
            }),
        min: 0,
        displayName: "Duration",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onSelectStayDuration'
        })
    set onSelectStayDuration (val) {
        if (val === this._onSelectStayDuration) {
            return;
        }
        this._onSelectStayDuration = val;
    }
    get onSelectStayDuration () {
        return this._onSelectStayDuration;
    }

    @property({
        type: CCBoolean,
        displayOrder: 7,
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onSelectExited'
        })
    set onSelectExited (val) {
        if (val === this._onSelectExited) {
            return;
        }
        this._onSelectExited = val;
    }
    get onSelectExited () {
        return this._onSelectExited;
    }

    /**
    * @en The current HapticEvents of the bar sprite. The valid value is between 0-1.
    *
    * @zh 当前进度值，该数值的区间是 0-1 之间。
    */
    @property({
        displayOrder: 8,
        visible: (function (this: HapticEvents) {
            return this._onSelectExited;
            }),
        slide: true,
        range: [0, 1, 0.1],
        displayName: "Haptic Intensity",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onSelectExitedHaptic'
        })
    set onSelectExitedHaptic (value) {
        if (this._onSelectExitedHaptic === value) {
            return;
        }

        this._onSelectExitedHaptic = value;
    }
    get onSelectExitedHaptic () {
        return this._onSelectExitedHaptic;
    }

    @property({
        displayOrder: 9,
        visible: (function (this: HapticEvents) {
            return this._onSelectExited;
            }),
        min: 0,
        displayName: "Duration",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onSelectExitedDuration'
        })
    set onSelectExitedDuration (val) {
        if (val === this._onSelectExitedDuration) {
            return;
        }
        this._onSelectExitedDuration = val;
    }
    get onSelectExitedDuration () {
        return this._onSelectExitedDuration;
    }

    @property({
        type: CCBoolean,
        displayOrder: 10,
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onHoverEntered'
        })
    set onHoverEntered (val) {
        if (val === this._onHoverEntered) {
            return;
        }
        this._onHoverEntered = val;
    }
    get onHoverEntered () {
        return this._onHoverEntered;
    }

    /**
    * @en
    * The current HapticEvents of the bar sprite. The valid value is between 0-1.
    * @zh
    * 当前进度值，该数值的区间是 0-1 之间。
    */
    @property({
        displayOrder: 11,
        visible: (function (this: HapticEvents) {
            return this._onHoverEntered;
            }),
        slide: true,
        range: [0, 1, 0.1],
        displayName: "Haptic Intensity",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onHoverEnteredHaptic'
        })
    set onHoverEnteredHaptic (value) {
        if (this._onHoverEnteredHaptic === value) {
            return;
        }

        this._onHoverEnteredHaptic = value;
    }
    get onHoverEnteredHaptic () {
        return this._onHoverEnteredHaptic;
    }

    @property({
        displayOrder: 12,
        visible: (function (this: HapticEvents) {
            return this._onHoverEntered;
            }),
        min: 0,
        displayName: "Duration",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onHoverEnteredDuration'
        })
    set onHoverEnteredDuration (val) {
        if (val === this._onHoverEnteredDuration) {
            return;
        }
        this._onHoverEnteredDuration = val;
    }
    get onHoverEnteredDuration () {
        return this._onHoverEnteredDuration;
    }

    @property({
        type: CCBoolean,
        displayOrder: 13,
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onHoverStay'
        })
    set onHoverStay (val) {
        if (val === this._onHoverStay) {
            return;
        }
        this._onHoverStay = val;
    }
    get onHoverStay () {
        return this._onHoverStay;
    }

    /**
    * @en The current HapticEvents of the bar sprite. The valid value is between 0-1.
    *
    * @zh 当前进度值，该数值的区间是 0-1 之间。
    */
    @property({
        displayOrder: 14,
        visible: (function (this: HapticEvents) {
            return this._onHoverStay;
            }),
        slide: true,
        range: [0, 1, 0.1],
        displayName: "Haptic Intensity",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onHoverStayHaptic'
        })
    set onHoverStayHaptic (value) {
        if (this._onHoverStayHaptic === value) {
            return;
        }

        this._onHoverStayHaptic = value;
    }
    get onHoverStayHaptic () {
        return this._onHoverStayHaptic;
    }

    @property({
        displayOrder: 15,
        visible: (function (this: HapticEvents) {
            return this._onHoverStay;
            }),
        min: 0,
        displayName: "Duration",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onHoverStayDuration'
        })
    set onHoverStayDuration (val) {
        if (val === this._onHoverStayDuration) {
            return;
        }
        this._onHoverStayDuration = val;
    }
    get onHoverStayDuration () {
        return this._onHoverStayDuration;
    }

    @property({
        type: CCBoolean,
        displayOrder: 16,
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onHoverExited'
        })
    set onHoverExited (val) {
        if (val === this._onHoverExited) {
            return;
        }
        this._onHoverExited = val;
    }
    get onHoverExited () {
        return this._onHoverExited;
    }

    /**
    * @en The current HapticEvents of the bar sprite. The valid value is between 0-1.
    *
    * @zh 当前进度值，该数值的区间是 0-1 之间。
    */
    @property({
        displayOrder: 17,
        visible: (function (this: HapticEvents) {
            return this._onHoverExited;
            }),
        slide: true,
        range: [0, 1, 0.1],
        displayName: "Haptic Intensity",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onHoverExitedHaptic'
        })
    set onHoverExitedHaptic (value) {
        if (this._onHoverExitedHaptic === value) {
            return;
        }

        this._onHoverExitedHaptic = value;
    }
    get onHoverExitedHaptic () {
        return this._onHoverExitedHaptic;
    }

    @property({
        displayOrder: 18,
        visible: (function (this: HapticEvents) {
            return this._onHoverExited;
            }),
        min: 0,
        displayName: "Duration",
        tooltip: 'i18n:xr-plugin.interactor_events.haptic_events.onHoverExitedDuration'
        })
    set onHoverExitedDuration (val) {
        if (val === this._onHoverExitedDuration) {
            return;
        }
        this._onHoverExitedDuration = val;
    }
    get onHoverExitedDuration () {
        return this._onHoverExitedDuration;
    }

    public hapticController (type: HapticType, deviceType: DeviceType) {
        if (!sys.isXR) {
            return;
        }

        let controllerHandle = 0;
        switch (deviceType) {
        case DeviceType.Left:
            controllerHandle = 0;
            break;
        case DeviceType.Right:
            controllerHandle = 1;
            break;
        default:
            break;
        }

        switch (type) {
        case HapticType.Select_Entered:
            xrInterface.applyHapticController(this._onSelectEnteredHaptic, this._onSelectEnteredDuration, controllerHandle);
            break;
        case HapticType.Select_Stay:
            xrInterface.applyHapticController(this._onSelectStayHaptic, this._onSelectStayDuration, controllerHandle);
            break;
        case HapticType.Select_Exited:
            xrInterface.applyHapticController(this._onSelectExitedHaptic, this._onSelectExitedDuration, controllerHandle);
            break;
        case HapticType.Hover_Entered:
            xrInterface.applyHapticController(this._onHoverEnteredHaptic, this._onHoverEnteredDuration, controllerHandle);
            break;
        case HapticType.Hover_Stay:
            xrInterface.applyHapticController(this._onHoverStayHaptic, this._onHoverStayDuration, controllerHandle);
            break;
        case HapticType.Hover_Exited:
            xrInterface.applyHapticController(this._onHoverExitedHaptic, this._onHoverExitedDuration, controllerHandle);
            break;
        default:
            break;
        }
    }
}

@ccclass('cc.SubInteractorEvents')
class SubInteractorEvents {
    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.hoverEnterEvents'
        })
    public hoverEnterEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.hoverStayEvents'
        })
    public hoverStayEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.hoverExitEvents'
        })
    public hoverExitEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 4,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.selectEnterEvents'
        })
    public selectEnterEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 5,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.selectStayEvents'
        })
    public selectStayEvents: ComponentEventHandler[] = [];

    @property({
        serializable: true,
        type: [ComponentEventHandler],
        displayOrder: 6,
        tooltip: 'i18n:xr-plugin.interactor_events.sub_interactor_events.selectExitEvents'
        })
    public selectExitEvents: ComponentEventHandler[] = [];

    public selectEntered (event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.selectEnterEvents, event);
    }

    public selectStay (event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.selectStayEvents, event);
    }

    public selectExited (event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.selectExitEvents, event);
    }

    public hoverEntered (event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.hoverEnterEvents, event);
    }

    public hoverStay (event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.hoverStayEvents, event);
    }

    public hoverExited (event: XrEventHandle) {
        ComponentEventHandler.emitEvents(this.hoverExitEvents, event);
    }
}

/**
 * @en
 * Event of interactable.
 * @zh
 * 交互器事件组件。
 */
@ccclass('cc.InteractorEvents')
@help('i18n:cc.InteractorEvents')
@menu('XR/Interaction/InteractorEvents')
export class InteractorEvents extends Component {
    @property({
        serializable: true,
        type: AudioEvents,
        displayOrder: 1,
        tooltip: 'i18n:xr-plugin.interactor_events.audioEvents'
        })
    public audioEvents: AudioEvents = new AudioEvents();

    @property({
        serializable: true,
        type: HapticEvents,
        displayOrder: 2,
        tooltip: 'i18n:xr-plugin.interactor_events.hapticEvents'
        })
    public hapticEvents: HapticEvents = new HapticEvents();

    @property({
        serializable: true,
        type: SubInteractorEvents,
        displayOrder: 3,
        tooltip: 'i18n:xr-plugin.interactor_events.interactorEvents'
        })
    public interactorEvents: SubInteractorEvents = new SubInteractorEvents();

    public selectEntered (event: XrEventHandle) {
        this.interactorEvents.selectEntered(event);
        if (this.audioEvents.onSelectEntered) {
            this.audioEvents.onSelectEnteredAudioClip?.play();
        }
        if (this.hapticEvents.onSelectEntered) {
            this.hapticEvents.hapticController(HapticType.Select_Entered, event.deviceType);
        }
    }

    public selectStay (event: XrEventHandle) {
        this.interactorEvents.selectStay(event);
        if (this.audioEvents.onSelectStay) {
            this.audioEvents.onSelectStayAudioClip?.play();
        }
        if (this.hapticEvents.onSelectStay) {
            this.hapticEvents.hapticController(HapticType.Select_Stay, event.deviceType);
        }
    }

    public selectExited (event: XrEventHandle) {
        this.interactorEvents.selectExited(event);
        if (this.audioEvents.onSelectExited) {
            this.audioEvents.onSelectExitedAudioClip?.play();
        }
        if (this.hapticEvents.onSelectExited) {
            this.hapticEvents.hapticController(HapticType.Select_Exited, event.deviceType);
        }
    }

    public hoverEntered (event: XrEventHandle) {
        this.interactorEvents.hoverEntered(event);
        if (this.audioEvents.onHoverEntered) {
            this.audioEvents.onHoverEnteredAudioClip?.play();
        }
        if (this.hapticEvents.onHoverEntered) {
            this.hapticEvents.hapticController(HapticType.Hover_Entered, event.deviceType);
        }
    }

    public hoverStay (event: XrEventHandle) {
        this.interactorEvents.hoverStay(event);
        if (this.audioEvents.onHoverStay) {
            this.audioEvents.onHoverStayAudioClip?.play();
        }
        if (this.hapticEvents.onHoverStay) {
            this.hapticEvents.hapticController(HapticType.Hover_Stay, event.deviceType);
        }
    }

    public hoverExited (event: XrEventHandle) {
        this.interactorEvents.hoverExited(event);
        if (this.audioEvents.onHoverExited) {
            this.audioEvents.onHoverExitedAudioClip?.play();
        }
        if (this.hapticEvents.onHoverExited) {
            this.hapticEvents.hapticController(HapticType.Hover_Exited, event.deviceType);
        }
    }
}
