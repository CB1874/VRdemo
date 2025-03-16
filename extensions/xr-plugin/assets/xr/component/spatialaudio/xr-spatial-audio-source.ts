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

import { _decorator, Component, Node, AudioClip, clamp, ccenum, sys, native, find, director, Director } from 'cc';
import { PoseTracker, TrackingSource_Type } from '../device/pose-tracker';

const { ccclass, property, menu, type } = _decorator;

export enum XRAudioState {
    DEFAULT,
    LOADING,
    LOADED,
    UNLOAD,
    CREATED,
    PLAYING,
    PAUSED,
    RESUMED,
    STOPPED,
    PLAY_COMPLETED,
}
ccenum(XRAudioState);

export enum XRAudioDistanceRolloffModel {
    OFF = -1,
    LINEAR = 1,
    LOGARITHMIC = 0
}
ccenum(XRAudioDistanceRolloffModel);

@ccclass('cc.XRSpatialAudioSource')
@menu('XR/Extra/XRSpatialAudioSource')
export class XRSpatialAudioSource extends Component {
    public static XR_SPATIAL_AUDIO_EVENT_NAME = 'xr-spatial-audio';
    public static XR_SPATIAL_AUDIO_EVENT_TAG_INIT = 'to-init';
    public static XR_SPATIAL_AUDIO_EVENT_TAG_STATUS_SOUND_OBJECT = 'sound-status';
    public static XR_SPATIAL_AUDIO_EVENT_TAG_PAUSE_SOUND_OBJECT = 'sound-pause';
    public static XR_SPATIAL_AUDIO_EVENT_TAG_RESUME_SOUND_OBJECT = 'sound-resume';
    public static XR_SPATIAL_AUDIO_EVENT_TAG_STOP_SOUND_OBJECT = 'sound-stop';
    public static XR_SPATIAL_AUDIO_EVENT_TAG_PLAY_SOUND_OBJECT = 'sound-play';
    public static XR_SPATIAL_AUDIO_EVENT_TAG_LOCATION_SOUND_OBJECT = 'sound-position';
    public static XR_SPATIAL_AUDIO_EVENT_TAG_VOLUME_SOUND_OBJECT = 'sound-volume';
    public static XR_SPATIAL_AUDIO_EVENT_TAG_UNLOAD = 'sound-unload';
    public static XR_SPATIAL_AUDIO_EVENT_TAG_SYNC_SIXDOF_DATA = 'sound-sync-sixdof-data';
    static tickFrameCount = 0;

    @property({type:AudioClip, serializable: true})
    protected _clip: AudioClip | null = null;
    @property({ serializable: true })
    protected _loop = false;
    @property({ serializable: true })
    protected _playOnAwake = true;
    @property({ serializable: true })
    protected _volume = 1;
    @property({type:XRAudioDistanceRolloffModel, serializable: true})
    protected _audioDistanceRolloffModel = XRAudioDistanceRolloffModel.OFF;
    @property({ serializable: true })
    protected _minDistance = 0;
    @property({ serializable: true })
    protected _maxDistance = 1;

    @property({type: AudioClip, tooltip: 'i18n:xr-plugin.spatialAudio.clip'})
    set clip (val) {
        if (val === this._clip) {
            return;
        }
        this._clip = val;
    }
    get clip () {
        return this._clip;
    }

    @property({tooltip: 'i18n:xr-plugin.spatialAudio.loop'})
    set loop (val) {
        this._loop = val;
    }
    get loop () {
        return this._loop;
    }

    @property({tooltip: 'i18n:xr-plugin.spatialAudio.playOnAwake'})
    set playOnAwake (val) {
        this._playOnAwake = val;
    }
    get playOnAwake () {
        return this._playOnAwake;
    }

    @property({tooltip: 'i18n:xr-plugin.spatialAudio.volume', range: [0.0, 1.0]})
    set volume (val) {
        if (Number.isNaN(val)) { console.warn('illegal audio volume!'); return; }
        val = clamp(val, 0, 1);
        this._volume = val;
        this.setVolumeInternal();
    }
    get volume () {
        return this._volume;
    }

    @property({
        type: XRAudioDistanceRolloffModel,
        displayName: 'Distance Rolloff Model',
        tooltip: 'i18n:xr-plugin.spatialAudio.distanceRolloffModel'
        })
    set distanceRolloffModel (val) {
        if (val === this._audioDistanceRolloffModel) {
            return;
        }
        this._audioDistanceRolloffModel = val;
    }
    get distanceRolloffModel () {
        return this._audioDistanceRolloffModel;
    }

    @property({tooltip: 'i18n:xr-plugin.spatialAudio.minDistance', range: [0.0, 1000000],
        visible: (function (this: XRSpatialAudioSource) {
            return this._audioDistanceRolloffModel !== XRAudioDistanceRolloffModel.OFF;
            })})
    set rolloffMinDistance (val) {
        this._minDistance = val;
    }
    get rolloffMinDistance () {
        return this._minDistance;
    }

    @property({tooltip: 'i18n:xr-plugin.spatialAudio.maxDistance', range: [1.0, 1000000],
        visible: (function (this: XRSpatialAudioSource) {
            return this._audioDistanceRolloffModel !== XRAudioDistanceRolloffModel.OFF;
            })})
    set rolloffMaxDistance (val) {
        this._maxDistance = val;
    }
    get rolloffMaxDistance () {
        return this._maxDistance;
    }

    private _xrAgent: Node | null = null;
    private _hmdNode: Node | null = null;
    private _audioState: XRAudioState = XRAudioState.DEFAULT;
    onLoad () {
        if (sys.isXR && sys.isNative) {
            if (!this._xrAgent) {
                this._xrAgent = find('XR Agent');
            }

            if (this._xrAgent) {
                const poseTrackerComps = this._xrAgent.getComponentsInChildren(PoseTracker);
                for (const poseTrackerComp of poseTrackerComps) {
                    if (poseTrackerComp.trackingSource === TrackingSource_Type.VIEW_POSE_ACTIVE_HMD) {
                        this._hmdNode = poseTrackerComp.node;
                    }
                }
            }
            console.log(`onLoad.xr-spatial-audio-source:${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME}_${this.uuid}`);
            native.jsbBridgeWrapper.addNativeEventListener(`${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME}_${this.uuid}`, (data: string) => {
                const dataArray: Array<string> = data.split('&');
                if (dataArray[0] === XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_TAG_STATUS_SOUND_OBJECT) {
                    this._audioState = parseInt(dataArray[1]) as XRAudioState;
                }
            });
            // init
            const eventArg = `${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_TAG_INIT}&${
                this.uuid}&${this._clip?.nativeUrl}&${this.node.worldPosition.x}&${this.node.worldPosition.y}&${this.node.worldPosition.z}&${
                this._volume}&${this._loop ? '1' : '0'}&${this._playOnAwake ? '1' : '0'}&${
                this._audioDistanceRolloffModel}&${this._minDistance}&${this._maxDistance}`;
            native.jsbBridgeWrapper.dispatchEventToNative(XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME, eventArg);
        }

        this.node.on(Node.EventType.TRANSFORM_CHANGED, (type) => {
            if (type & Node.TransformBit.POSITION) {
                if (sys.isXR && sys.isNative) {
                    const eventArg = `${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_TAG_LOCATION_SOUND_OBJECT}&${this.uuid}&${
                        this.node.worldPosition.x}&${this.node.worldPosition.y}&${this.node.worldPosition.z}`;
                    native.jsbBridgeWrapper.dispatchEventToNative(XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME, eventArg);
                }
            }
        }, this);
    }

    update (deltaTime: number) {
        if (sys.isXR && sys.isNative) {
            if (this._hmdNode && XRSpatialAudioSource.tickFrameCount !== director.getTotalFrames()) {
                const eventArg = `${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_TAG_SYNC_SIXDOF_DATA}&${
                    this._hmdNode.worldPosition.x}&${this._hmdNode.worldPosition.y}&${this._hmdNode.worldPosition.z}&${
                    this._hmdNode.worldRotation.x}&${this._hmdNode.worldRotation.y}&${this._hmdNode.worldRotation.z}&${
                    this._hmdNode.worldRotation.w}`;
                native.jsbBridgeWrapper.dispatchEventToNative(XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME, eventArg);
                XRSpatialAudioSource.tickFrameCount = director.getTotalFrames();
            }
        }
    }

    onDestroy () {
        if (sys.isXR && sys.isNative) {
            const eventArg = `${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_TAG_STOP_SOUND_OBJECT}&${this.uuid}`;
            native.jsbBridgeWrapper.dispatchEventToNative(XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME, eventArg);
            native.jsbBridgeWrapper.removeAllListenersForEvent(`${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME}_${this.uuid}`);
        }
    }

    public play () {
        if (sys.isXR && sys.isNative && this._audioState !== XRAudioState.PLAYING) {
            const eventArg_resume = `${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_TAG_RESUME_SOUND_OBJECT}&${this.uuid}`;
            native.jsbBridgeWrapper.dispatchEventToNative(XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME, eventArg_resume);

            const eventArg_play = `${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_TAG_PLAY_SOUND_OBJECT}&${this.uuid}`;
            native.jsbBridgeWrapper.dispatchEventToNative(XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME, eventArg_play);
        }
    }

    public pause () {
        if (sys.isXR && sys.isNative && this._audioState !== XRAudioState.PAUSED) {
            const eventArg = `${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_TAG_PAUSE_SOUND_OBJECT}&${this.uuid}`;
            native.jsbBridgeWrapper.dispatchEventToNative(XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME, eventArg);
        }
    }

    private setVolumeInternal () {
        if (sys.isXR && sys.isNative) {
            const eventArg = `${XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_TAG_VOLUME_SOUND_OBJECT}&${this.uuid}&${this._volume}`;
            native.jsbBridgeWrapper.dispatchEventToNative(XRSpatialAudioSource.XR_SPATIAL_AUDIO_EVENT_NAME, eventArg);
        }
    }
}
