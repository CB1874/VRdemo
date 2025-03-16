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

import { _decorator, Component, Node, EventHandler as ComponentEventHandler, VideoPlayer, native, VideoClip, sys, Texture2D, ImageAsset,
    MeshRenderer, ccenum, utils, primitives, Vec3, Mesh, gfx, game, Game, director, VERSION } from 'cc';
import { EDITOR } from 'cc/env';
import { XRConfigKey, xrInterface } from '../interface/xr-interface';

const { ccclass, property, menu } = _decorator;
const ccwindow: typeof window = typeof globalThis.jsb !== 'undefined' ? (typeof jsb.window !== 'undefined' ? jsb.window : globalThis) : globalThis;
const ccdocument = ccwindow.document;

export enum MediaPlayerInfo {
    UNKNOWN = 1,
    STARTED_AS_NEXT = 2,
    VIDEO_RENDERING_START = 3,
    VIDEO_TRACK_LAGGING = 700,
    BUFFERING_START = 701,
    BUFFERING_END = 702,
    NETWORK_BANDWIDTH = 703,
    BAD_INTERLEAVING = 800,
    NOT_SEEKABLE = 801,
    METADATA_UPDATE = 802,
    EXTERNAL_METADATA_UPDATE = 803,
    AUDIO_NOT_PLAYING = 804,
    VIDEO_NOT_PLAYING = 805,
    TIMED_TEXT_ERROR = 900,
    UNSUPPORTED_SUBTITLE = 901,
    SUBTITLE_TIMED_OUT = 902
}
ccenum(MediaPlayerInfo);

export enum VideoShape {
    Quad, // 2d
    Pano180, // 180 2d
    Pano360, // 360 2d
    Quad_3D_LR,
    Quad_3D_TB,
    Pano360_3D_LR,
    Pano360_3D_TB
}
ccenum(VideoShape);

export enum PanoramicEffectOption {
    Performance,
    Balanced,
    Quality
}
ccenum(PanoramicEffectOption);

export class SubtitleData {
    id = '';
    startTime = '';
    startSeconds = 0;
    endTime = '';
    endSeconds = 0;
    text = '';
}

const VIDEO_SOURCE_TYPE_LOCAL = 1;
const VIDEO_SOURCE_TYPE_REMOTE = 2;
//xr-event&id&eventName&handleKey&params
const VIDEO_EVENT_INVALID = 1;
const VIDEO_EVENT_PREPARE = 2;
const VIDEO_EVENT_PLAY = 3;
const VIDEO_EVENT_PAUSE = 4;
const VIDEO_EVENT_STOP = 5;
const VIDEO_EVENT_RESET = 6;
const VIDEO_EVENT_DESTROY = 7;

const VIDEO_EVENT_GET_POSITION = 30;
const VIDEO_EVENT_GET_DURATION = 31;
const VIDEO_EVENT_GET_IS_PALYING = 32;
const VIDEO_EVENT_GET_IS_LOOPING = 33;

const VIDEO_EVENT_SET_LOOP = 50;
const VIDEO_EVENT_SEEK_TO = 51;
const VIDEO_EVENT_SET_VOLUME = 52;
const VIDEO_EVENT_SET_TEXTURE_INFO = 53;
const VIDEO_EVENT_SET_SPEED = 54;

const VIDEO_EVENT_MEDIA_PLAYER_PREPARED = 100;
const VIDEO_EVENT_MEDIA_PLAYER_PLAY_COMPLETE = 101;
const VIDEO_EVENT_MEDIA_PLAYER_SEEK_COMPLETE = 102;
const VIDEO_EVENT_MEDIA_PLAYER_ERROR = 103;
const VIDEO_EVENT_MEDIA_PLAYER_VIDEO_SIZE = 104;
const VIDEO_EVENT_MEDIA_PLAYER_ON_INFO = 105;

const XR_VIDEO_PLAYER_EVENT_NAME = 'xr-video-player:';
const XR_VIDEO_EVENT_TAG = 'xr-event';

class VideoEventData {
    public headTag: string = XR_VIDEO_EVENT_TAG;
    public eventId: number = VIDEO_EVENT_INVALID;
    public videoPlayerHandleKey = '';
    public videoSourceType = 0;
    public videoSourceUrl = '';
    public videoWidth = 0;
    public videoHeight = 0;
    public videoTextureId = 0;
    public isLoop = 0;
    public seekToMsec = 0;
    public isPlaying = false;
    public duration = 0;
    public currentPosition = 0
    public eventName = '';
    public onInfoWhat: MediaPlayerInfo = MediaPlayerInfo.UNKNOWN;
    public volume = 0;
    public videoSourceSizeWidth = 0;
    public videoSourceSizeHeight = 0;
    public playbackSpeed = 1;

    public decodeData (data: string): void {
        // xr-event&id&name&key
        const dataArray: string[] = data.split('&');
        if (dataArray[0] === XR_VIDEO_EVENT_TAG) {
            this.eventId = parseInt(dataArray[1]);
            this.eventName = dataArray[2];
            this.videoPlayerHandleKey = dataArray[3];
            switch (this.eventId) {
            case VIDEO_EVENT_SEEK_TO: {
                this.seekToMsec = parseInt(dataArray[4]);
                break;
            }
            case VIDEO_EVENT_SET_LOOP: {
                this.isLoop = parseInt(dataArray[4]);
                break;
            }
            case VIDEO_EVENT_GET_IS_PALYING: {
                this.isPlaying = parseInt(dataArray[4]) === 1;
                break;
            }
            case VIDEO_EVENT_GET_DURATION: {
                // millseconds to seconds
                this.duration = parseInt(dataArray[4]) * 0.001;
                break;
            }
            case VIDEO_EVENT_GET_POSITION: {
                // millseconds to seconds
                this.currentPosition = parseInt(dataArray[4]) * 0.001;
                break;
            }
            case VIDEO_EVENT_MEDIA_PLAYER_ON_INFO: {
                // what
                this.onInfoWhat = parseInt(dataArray[4]) as MediaPlayerInfo;
                break;
            }
            case VIDEO_EVENT_MEDIA_PLAYER_VIDEO_SIZE: {
                this.videoSourceSizeWidth = parseInt(dataArray[4]);
                this.videoSourceSizeHeight = parseInt(dataArray[5]);
                break;
            }
            default:
                break;
            }
        }
    }

    public encodeData (): string {
        switch (this.eventId) {
        case VIDEO_EVENT_PREPARE: {
            return `${XR_VIDEO_EVENT_TAG}&${this.eventId}&${this.eventName}&${
                this.videoPlayerHandleKey}&${this.videoSourceType}&${
                this.videoSourceUrl}&${this.isLoop}&${this.volume}&${this.playbackSpeed}`;
        }

        case VIDEO_EVENT_SEEK_TO: {
            return `${XR_VIDEO_EVENT_TAG}&${this.eventId}&${this.eventName}&${
                this.videoPlayerHandleKey}&${this.seekToMsec.toFixed()}`;
        }

        case VIDEO_EVENT_SET_LOOP: {
            return `${XR_VIDEO_EVENT_TAG}&${this.eventId}&${this.eventName}&${
                this.videoPlayerHandleKey}&${this.isLoop}`;
        }

        case VIDEO_EVENT_SET_VOLUME: {
            return `${XR_VIDEO_EVENT_TAG}&${this.eventId}&${this.eventName}&${
                this.videoPlayerHandleKey}&${this.volume}`;
        }

        case VIDEO_EVENT_SET_TEXTURE_INFO: {
            return `${XR_VIDEO_EVENT_TAG}&${this.eventId}&${this.eventName}&${
                this.videoPlayerHandleKey}&${this.videoWidth}&${this.videoHeight
            }&${this.videoTextureId}`;
        }

        case VIDEO_EVENT_SET_SPEED: {
            return `${XR_VIDEO_EVENT_TAG}&${this.eventId}&${this.eventName}&${
                this.videoPlayerHandleKey}&${this.playbackSpeed}`;
        }

        default: {
            return `${XR_VIDEO_EVENT_TAG}&${this.eventId}&${this.eventName}&${
                this.videoPlayerHandleKey}`;
        }
        }
    }
}

@ccclass('cc.XRVideoPlayer')
@menu('XR/Extra/XRVideoPlayer')
export class XRVideoPlayer extends Component {
    @property({ serializable: true })
    protected _loop = false;
    @property({ serializable: true })
    protected _playOnAwake = true;
    @property({ serializable: true })
    protected _volume = 0.5;
    @property({ serializable: true })
    protected _mute = false;
    @property({ serializable: true })
    protected _resourceType = VideoPlayer.ResourceType.LOCAL;
    @property({ serializable: true })
    protected _remoteURL = '';
    @property({ serializable: true })
    protected _clip: VideoClip | null = null;
    @property({ serializable: true })
    protected _keepAspectRatio = true;
    @property({ serializable: true })
    protected _playbackRate = 1;
    @property({ serializable: true })
    protected _videoShape: VideoShape = VideoShape.Quad;
    @property({ serializable: true})
    protected _panoramicEffectOption: PanoramicEffectOption = PanoramicEffectOption.Balanced;

    @property({ displayName: 'Source Type', type: VideoPlayer.ResourceType, tooltip: 'i18n:xr-plugin.videoplayer.resourceType' })
    get resourceType () {
        return this._resourceType;
    }
    set resourceType (val) {
        if (this._resourceType !== val) {
            this._resourceType = val;
        }
    }

    @property({
        tooltip: 'i18n:xr-plugin.videoplayer.remoteURL', visible: (function (this: XRVideoPlayer) {
            return this.resourceType === VideoPlayer.ResourceType.REMOTE;
            })
        })
    get remoteURL () {
        return this._remoteURL;
    }
    set remoteURL (val: string) {
        if (this._remoteURL !== val) {
            this._remoteURL = val;
        }
    }

    @property({
        type: VideoClip, tooltip: 'i18n:xr-plugin.videoplayer.clip', visible: (function (this: XRVideoPlayer) {
            return this.resourceType === VideoPlayer.ResourceType.LOCAL;
            })
        })
    get clip () {
        return this._clip;
    }
    set clip (val) {
        if (this._clip !== val) {
            this._clip = val;
        }
    }

    @property({ tooltip: 'i18n:xr-plugin.videoplayer.playOnAwake' })
    get playOnAwake () {
        return this._playOnAwake;
    }
    set playOnAwake (value) {
        this._playOnAwake = value;
    }

    @property({ tooltip: 'i18n:xr-plugin.videoplayer.playbackRate', slide: true, range: [0.0, 2.5, 0.5] })
    get playbackRate () {
        return this._playbackRate;
    }
    set playbackRate (value: number) {
        this._playbackRate = value < 0 ? 1 : (value > 4 ? 4 : value);
        if (sys.isNative) {
            const videoEventData: VideoEventData = new VideoEventData();
            videoEventData.eventId = VIDEO_EVENT_SET_SPEED;
            videoEventData.eventName = this._eventName;
            if (this._videoPlayerHandleKey) {
                videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            videoEventData.playbackSpeed = value;
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
        } else if (sys.isBrowser && this._webVideo) {
            this._webVideo.playbackRate = value;
        }
    }

    @property({ tooltip: 'i18n:xr-plugin.videoplayer.volume', slide: true, range: [0, 1, 0.1] })
    get volume () {
        if (!EDITOR && this._mute) {
            return 0;
        }
        return this._volume;
    }
    set volume (value: number) {
        this._volume = value;
        this.setPlayerVolume(this.mute ? 0 : value);
    }

    @property({ tooltip: 'i18n:xr-plugin.videoplayer.mute' })
    get mute () {
        return this._mute;
    }
    set mute (value) {
        this._mute = value;
        this.setPlayerVolume(value ? 0 : this._volume);
    }

    @property({ tooltip: 'i18n:xr-plugin.videoplayer.loop' })
    get loop () {
        return this._loop;
    }
    set loop (value) {
        this._loop = value;
        if (sys.isNative) {
            const videoEventData: VideoEventData = new VideoEventData();
            videoEventData.eventId = VIDEO_EVENT_SET_LOOP;
            videoEventData.eventName = this._eventName;
            if (this._videoPlayerHandleKey) {
                videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            videoEventData.isLoop = 1;
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
        } else if (sys.isBrowser && this._webVideo) {
            this._webVideo.loop = value;
        }
    }

    @property({ tooltip: 'i18n:xr-plugin.videoplayer.keepAspectRatio' })
    get keepAspectRatio () {
        return this._keepAspectRatio;
    }
    set keepAspectRatio (value) {
        if (this._keepAspectRatio !== value) {
            this._keepAspectRatio = value;
        }
    }

    @property({ type: VideoShape, tooltip: 'i18n:xr-plugin.videoplayer.videoShape' })
    get shape () {
        return this._videoShape;
    }
    set shape (value) {
        const is3DShape = value === VideoShape.Pano360_3D_LR || value === VideoShape.Pano360_3D_TB
        || value === VideoShape.Quad_3D_LR || value === VideoShape.Quad_3D_TB;
        if (is3DShape && !this._isSupport3DVideo) {
            console.warn('currently engine is not support 3d video shape, must be >=3.7.3!!!');
            return;
        }
        if (this._videoShape !== value) {
            this._videoShape = value;
            this.onChangeShape();
        }
    }

    @property({
        type: PanoramicEffectOption, visible: (function (this: XRVideoPlayer) {
            return false;
            })
        })
    get panoramicEffectOption () {
        return this._panoramicEffectOption;
    }
    set panoramicEffectOption (value) {
        if (this._panoramicEffectOption !== value) {
            this._panoramicEffectOption = value;
            this.onChangePanoramicEffectOption();
        }
    }

    @property({ type: [ComponentEventHandler], displayOrder: 100, tooltip: 'i18n:xr-plugin.videoplayer.videoPlayerEvent' })
    public videoPlayerEvent: ComponentEventHandler[] = [];

    /**
     * @en
     * The Renderer where the Video Player component renders its images.
     * When set to None, the Renderer on the same node as the Video Player component is used.
     */
    @property({ type: MeshRenderer, displayName: 'Content', tooltip: 'i18n:xr-plugin.videoplayer.videoContent' })
    private renderer: MeshRenderer | null = null;

    private _webVideoEventList: Map<string, ((e: Event) => void)> = new Map();
    private _webVideo: HTMLVideoElement | null = null;
    private _webVideoLoaded = false;
    private _copyWebVideoTexture = false;
    private _videoRegions: gfx.BufferTextureCopy[] = [];

    static videoPlayerUniqueId = 0;

    private _eventName: string = XR_VIDEO_PLAYER_EVENT_NAME;
    private _eventUniqeueId = 0;
    private _duration = 0;
    private _currentTime = 0;
    private _isPlayingCache = false;
    private _isPlaying = false;
    private _isReseted = false;
    private _videoPlayerHandleKey: string | null = null;
    private _videoEventDataPosition: VideoEventData = new VideoEventData();
    private _videoEventDataForDecode: VideoEventData = new VideoEventData();
    private _videoTexture: Texture2D | null = null;
    private _refreshTime: number = Number.MAX_VALUE;
    private _autoPlayOnReady = false;
    private _isPlayerPrepared = false;
    private _meshQuad: Mesh | null = null;
    private _meshPanoramic180: Mesh | null = null;
    private _meshPanoramic360: Mesh | null = null;
    private _videoDefaultThumbTexture: Texture2D | null = null;
    private _isCanSeekTo = true;

    //  id/startSeconds/endSeconds/text
    private _subtitleArrayData: Array<SubtitleData> = [];
    private _lastSubtitleBeginIdx = 0;
    private _isSupport3DVideo = false;

    set subtitleData (value) {
        this._subtitleArrayData = value;
    }

    get subtitleData () {
        return this._subtitleArrayData;
    }

    isSupport3DMode (): boolean {
        return this._isSupport3DVideo;
    }

    getVideoName (): string {
        if (this.resourceType === VideoPlayer.ResourceType.LOCAL) {
            if (this.clip) {
                return this.clip.name;
            }
            return '';
        } else {
            const array: string[] = this.remoteURL.split('/');
            if (array) {
                return array[array.length - 1];
            }
            return '';
        }
    }

    getSubtitleContent (timeInSeconds: number) {
        if (this._subtitleArrayData.length > 0) {
            for (let i = this._lastSubtitleBeginIdx; i < this._subtitleArrayData.length; i++) {
                if (timeInSeconds >= this._subtitleArrayData[i].startSeconds && timeInSeconds <= this._subtitleArrayData[i].endSeconds) {
                    this._lastSubtitleBeginIdx = i;
                    return this._subtitleArrayData[i].text;
                }
            }
        }
        return '';
    }

    checkEngineVersion () {
        const engineVersionInfo = VERSION.split('.');
        const majorVersion: number = parseInt(engineVersionInfo[0]);
        const minjorVersion: number = parseInt(engineVersionInfo[1]);
        const patchVersion: number = parseInt(engineVersionInfo[2]);
        this._isSupport3DVideo = (majorVersion > 3)
        || (majorVersion === 3 && minjorVersion > 7)
        || (majorVersion === 3 && minjorVersion === 7 && patchVersion > 2);
        console.log(`CEV:${majorVersion}_${minjorVersion}_${patchVersion}.${this._isSupport3DVideo}`);
    }

    onFocusInEditor (): void {
        this.checkEngineVersion();
    }

    onLoad () {
        this._videoPlayerHandleKey = `xr-vp-key-${this.node.name}-${XRVideoPlayer.videoPlayerUniqueId}`;
        this._eventUniqeueId = XRVideoPlayer.videoPlayerUniqueId;
        this._eventName = `${XR_VIDEO_PLAYER_EVENT_NAME}${this._eventUniqeueId}`;
        XRVideoPlayer.videoPlayerUniqueId++;
        if (XRVideoPlayer.videoPlayerUniqueId === 3) {
            console.error('Currently a maximum of 3 XRVideoPlayer components can be used at the same time !!!');
        }
        this.checkEngineVersion();
    }

    start () {
        this._videoEventDataPosition.eventId = VIDEO_EVENT_GET_POSITION;
        this._videoEventDataPosition.eventName = this._eventName;
        if (this._videoPlayerHandleKey) {
            this._videoEventDataPosition.videoPlayerHandleKey = this._videoPlayerHandleKey;
        }
        if (!this.renderer) {
            this.renderer = this.getComponent(MeshRenderer);
            if (!this.renderer) {
                console.error('Must has a valid MeshRenderer component!!!');
            }
        }
        this._videoDefaultThumbTexture = this.renderer?.material?.getProperty('mainTexture') as Texture2D;

        this.onChangeShape();

        if (sys.isNative) {
            native.jsbBridgeWrapper.addNativeEventListener(this._eventName, (data: string) => {
                // console.log('js callback from java.' + data);
                this._videoEventDataForDecode.decodeData(data);
                if (this._videoEventDataForDecode.eventId === VIDEO_EVENT_MEDIA_PLAYER_PREPARED) {
                    this.onReadyToPlay();
                } else if (this._videoEventDataForDecode.eventId === VIDEO_EVENT_MEDIA_PLAYER_ERROR) {
                    this.onError();
                } else if (this._videoEventDataForDecode.eventId === VIDEO_EVENT_MEDIA_PLAYER_PLAY_COMPLETE) {
                    this.onCompleted();
                } else if (this._videoEventDataForDecode.eventId === VIDEO_EVENT_MEDIA_PLAYER_SEEK_COMPLETE) {
                    this.onSeekCompleted();
                } else if (this._videoEventDataForDecode.eventId === VIDEO_EVENT_GET_DURATION) {
                    this._duration = Math.floor(this._videoEventDataForDecode.duration);
                } else if (this._videoEventDataForDecode.eventId === VIDEO_EVENT_GET_IS_PALYING) {
                    this._isPlaying = this._videoEventDataForDecode.isPlaying;
                } else if (this._videoEventDataForDecode.eventId === VIDEO_EVENT_GET_POSITION) {
                    this._currentTime = Math.floor(this._videoEventDataForDecode.currentPosition);
                } else if (this._videoEventDataForDecode.eventId === VIDEO_EVENT_MEDIA_PLAYER_ON_INFO) {
                    this.onInfo(this._videoEventDataForDecode.onInfoWhat);
                    if (this._videoEventDataForDecode.onInfoWhat === MediaPlayerInfo.VIDEO_RENDERING_START) {
                        console.log('video rendering start');
                        if (this._videoTexture) {
                            console.log('setProperty(mainTexture) to video...');
                            this.renderer?.material?.setProperty('mainTexture', this._videoTexture);
                        }
                        this.onPlaying();
                    }
                } else if (this._videoEventDataForDecode.eventId === VIDEO_EVENT_MEDIA_PLAYER_VIDEO_SIZE) {
                    this.createVideoTexture(this._videoEventDataForDecode.videoSourceSizeWidth, this._videoEventDataForDecode.videoSourceSizeHeight);
                }
            });

            // >=3.7.3
            if (this._isSupport3DVideo) {
                xrInterface.setBoolConfig(XRConfigKey.EYE_RENDER_JS_CALLBACK, true);
                xrInterface.setEyeRenderCallback(this.beforeRender, this.endRender, this);
            }

            game.on(Game.EVENT_HIDE, this.onGameHide, this);
            game.on(Game.EVENT_SHOW, this.onGameShow, this);
        } else if (sys.isBrowser) {
            let videoSourceUrl = '';
            if (this.resourceType === VideoPlayer.ResourceType.LOCAL) {
                if (this.clip) {
                    videoSourceUrl = this.clip.nativeUrl;
                }
            } else {
                videoSourceUrl = this.remoteURL;
            }
            this.createWebVideoPlayer(videoSourceUrl);

            game.on(Game.EVENT_HIDE, this.onGameHide, this);
            game.on(Game.EVENT_SHOW, this.onGameShow, this);
        }
        this.onPrepare();
    }

    onGameHide () {
        console.log('video will pause');
        if (sys.isBrowser) {
            this._isPlayingCache = this._isPlaying;
            if (this._isPlaying) {
                this.pause();
            }
        } else if (sys.isNative) {
            //
        }
    }

    onGameShow () {
        console.log('video will resume');
        if (sys.isBrowser) {
            if (this._isPlayingCache) {
                this.play();
            }
        } else if (sys.isNative) {
            const eventData: VideoEventData = new VideoEventData();
            eventData.eventId = VIDEO_EVENT_GET_IS_PALYING;
            eventData.eventName = this._eventName;
            if (this._videoPlayerHandleKey) {
                eventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, eventData.encodeData());
        }
    }

    beforeRender (eye: number): void {
        const is3D = this._videoShape === VideoShape.Pano360_3D_LR || this._videoShape === VideoShape.Pano360_3D_TB
        || this._videoShape === VideoShape.Quad_3D_LR || this._videoShape === VideoShape.Quad_3D_TB;
        if (this.renderer && is3D) {
            // left/right
            const frames = director.getTotalFrames();
            this.renderer?.material?.setProperty('leftEyeIndex', frames * 1.0);
        }
    }

    endRender (eye: number): void {
        const is3D = this._videoShape === VideoShape.Pano360_3D_LR || this._videoShape === VideoShape.Pano360_3D_TB
        || this._videoShape === VideoShape.Quad_3D_LR || this._videoShape === VideoShape.Quad_3D_TB;
        if (this.renderer && is3D) {
            // left/right
            const frames = director.getTotalFrames();
            this.renderer?.material?.setProperty('rightEyeIndex', (frames + 1) * 1.0);
        }
    }

    createVideoTexture (videoSourceWidth: number, videoSourceHeight: number): void {
        console.log('createVideoTexture');
        let textureWidth: number = videoSourceWidth;
        let textureHeight: number = videoSourceHeight;
        const aspect: number = videoSourceWidth / videoSourceHeight;
        if (this.keepAspectRatio) {
            // recalculate texture size, default we use 16:9 display aspect radio
            if (aspect > 1.77777) {
                textureHeight = Math.ceil(textureWidth / 16 * 9);
            } else {
                textureWidth = Math.ceil(textureHeight / 9 * 16);
            }
        }

        let recreateTexture = false;
        if (this._videoTexture === null
            || (this._videoTexture && ((this._videoTexture.width !== textureWidth) || (this._videoTexture.height !== textureHeight)))) {
            recreateTexture = true;
        }

        if (recreateTexture) {
            if (this._videoTexture) {
                this._videoTexture.destroy();
            }
            // create texture 2d
            this._videoTexture = new Texture2D();
            this._videoTexture._uuid = 'xr-video-texture';
            const blackValueView = new Uint8Array(textureWidth * textureHeight * 4);
            const blackMemImageSource: any = {
                width: textureWidth,
                height: textureHeight,
                _data: blackValueView,
                _compressed: false,
                format: Texture2D.PixelFormat.RGBA8888,
            };
            const imgAsset = new ImageAsset(blackMemImageSource);
            this._videoTexture.image = imgAsset;
            console.log(`create video texture :${textureWidth}x${textureHeight} | ${this._videoTexture?.getGFXTexture()?.getGLTextureHandle()}`);
        }

        if (sys.isNative) {
            const videoEventData: VideoEventData = new VideoEventData();
            videoEventData.eventName = this._eventName;
            videoEventData.eventId = VIDEO_EVENT_SET_TEXTURE_INFO;
            if (this._videoPlayerHandleKey) {
                videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            videoEventData.videoWidth = textureWidth;
            videoEventData.videoHeight = textureHeight;
            const texture = this._videoTexture?.getGFXTexture();
            if (texture) {
                videoEventData.videoTextureId = texture.getGLTextureHandle();
            }
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
        }
    }

    update (deltaTime: number) {
        if (this._isPlaying) {
            this._refreshTime += deltaTime;
            if (this._refreshTime > 1) {
                this._refreshTime = 0;
                if (sys.isNative) {
                    native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, this._videoEventDataPosition.encodeData());
                }
            }

            if (sys.isBrowser) {
                this.updateWebVideoTexture();
            }
        }
    }

    private setPlayerVolume (volume: number) {
        if (sys.isNative) {
            const videoEventData: VideoEventData = new VideoEventData();
            videoEventData.eventId = VIDEO_EVENT_SET_VOLUME;
            videoEventData.eventName = this._eventName;
            if (this._videoPlayerHandleKey) {
                videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            videoEventData.volume = volume;
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
        } else if (sys.isBrowser && this._webVideo) {
            this._webVideo.volume = volume;
        }
    }

    private onPrepare (): void {
        let videoSourceUrl = '';
        if (this.resourceType === VideoPlayer.ResourceType.LOCAL) {
            if (this.clip) {
                videoSourceUrl = this.clip.nativeUrl;
            }
        } else {
            videoSourceUrl = this.remoteURL;
        }

        if (sys.isNative) {
            const videoEventData: VideoEventData = new VideoEventData();
            videoEventData.eventName = this._eventName;
            videoEventData.eventId = VIDEO_EVENT_PREPARE;
            if (this._videoPlayerHandleKey) {
                videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            videoEventData.videoSourceType = this.resourceType === VideoPlayer.ResourceType.LOCAL
                ? VIDEO_SOURCE_TYPE_LOCAL : VIDEO_SOURCE_TYPE_REMOTE;
            videoEventData.videoSourceUrl = videoSourceUrl;
            videoEventData.isLoop = this.loop ? 1 : 0;
            videoEventData.volume = this.mute ? 0 : this.volume;
            videoEventData.playbackSpeed = this.playbackRate;
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
        }
    }

    public play () {
        if (this._isReseted || !this._isPlayerPrepared) {
            this._isReseted = false;
            this._autoPlayOnReady = true;
            this.onPrepare();
            return;
        }
        this._isPlaying = true;

        if (sys.isNative) {
            const videoEventData: VideoEventData = new VideoEventData();
            videoEventData.eventId = VIDEO_EVENT_PLAY;
            videoEventData.eventName = this._eventName;
            if (this._videoPlayerHandleKey) {
                videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
        } else if (sys.isBrowser && this._webVideo) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            const promise = this._webVideo.play();
            // the play API can only be initiated by user gesture.
            if (ccwindow.Promise && promise instanceof Promise) {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                promise.catch((error) => {
                    // Auto-play was prevented
                    // Show a UI element to let the user manually start playback
                    this._isPlaying = false;
                }).then(() => {

                });
            }
        }

        if (this._currentTime > 0) {
            this.onPlaying();
        }
    }

    public pause () {
        this._refreshTime = Number.MAX_VALUE;
        this._isPlaying = false;

        if (sys.isNative) {
            const videoEventData: VideoEventData = new VideoEventData();
            videoEventData.eventId = VIDEO_EVENT_PAUSE;
            videoEventData.eventName = this._eventName;
            if (this._videoPlayerHandleKey) {
                videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
        } else if (sys.isBrowser && this._webVideo) {
            this._webVideo.pause();
        }
        this.onPaused();
    }

    public stop () {
        this._refreshTime = Number.MAX_VALUE;
        this._isPlaying = false;
        const videoEventData: VideoEventData = new VideoEventData();
        videoEventData.eventId = VIDEO_EVENT_STOP;
        videoEventData.eventName = this._eventName;
        if (this._videoPlayerHandleKey) {
            videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
        }
        if (sys.isNative) {
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
        } else if (sys.isBrowser && this._webVideo) {
            this._webVideo.currentTime = 0;
            this._webVideo.pause();
        }
        this.onStopped();
    }

    public reset () {
        this._currentTime = 0;
        this._duration = 0;
        this._refreshTime = Number.MAX_VALUE;
        this._isPlayerPrepared = false;
        this._isPlaying = false;
        this._isReseted = true;
        console.log('setProperty(mainTexture) to default');
        // this.renderer.material.setProperty('mainTexture', this._videoDefaultThumbTexture);

        if (sys.isNative) {
            const videoEventData: VideoEventData = new VideoEventData();
            videoEventData.eventId = VIDEO_EVENT_RESET;
            videoEventData.eventName = this._eventName;
            if (this._videoPlayerHandleKey) {
                videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
        }
    }

    public onEnable () {
        console.log('XRVideoPlayer.onEnable');
    }

    public onDisable () {
        this._refreshTime = Number.MAX_VALUE;
        console.log('XRVideoPlayer.onDisable');
    }

    public onDestroy () {
        console.log('XRVideoPlayer.onDestroy');
        if (sys.isNative) {
            const videoEventData: VideoEventData = new VideoEventData();
            videoEventData.eventId = VIDEO_EVENT_DESTROY;
            videoEventData.eventName = this._eventName;
            if (this._videoPlayerHandleKey) {
                videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
            native.jsbBridgeWrapper.removeAllListenersForEvent(this._eventName);
        }  else if (sys.isBrowser && this._webVideo) {
            this.removeVideoPlayer();
        }
        XRVideoPlayer.videoPlayerUniqueId--;
        game.on(Game.EVENT_HIDE, this.onGameHide, this);
        game.on(Game.EVENT_SHOW, this.onGameShow, this);
    }

    get duration () {
        return this._duration;
    }

    get currentTime () {
        return this._currentTime;
    }

    set currentTime (val: number) {
        if (!this._isCanSeekTo) {
            console.error('set currentTime failed, because mediaplayer is seeking!!!');
            return;
        }
        this._currentTime = Math.max(val, 0);
        this._currentTime = Math.min(this._currentTime, this.duration);
        this._lastSubtitleBeginIdx = 0;
        this._refreshTime = Number.MAX_VALUE;
        if (sys.isNative) {
            const videoEventData: VideoEventData = new VideoEventData();
            videoEventData.eventId = VIDEO_EVENT_SEEK_TO;
            videoEventData.eventName = this._eventName;
            if (this._videoPlayerHandleKey) {
                videoEventData.videoPlayerHandleKey = this._videoPlayerHandleKey;
            }
            videoEventData.seekToMsec = Math.floor(val * 1000);
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, videoEventData.encodeData());
        }  else if (sys.isBrowser && this._webVideo) {
            this._webVideo.currentTime = val;
        }
        this._isCanSeekTo = false;
    }

    get isPlaying () {
        return this._isPlaying;
    }

    content (): Node | undefined {
        return this.renderer?.node;
    }

    private onReadyToPlay () {
        this._isPlayerPrepared = true;
        ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayer.EventType.READY_TO_PLAY);
        this.node.emit(VideoPlayer.EventType.READY_TO_PLAY, this);
        if (this.playOnAwake || this._autoPlayOnReady) {
            this._autoPlayOnReady = false;
            this.play();
        }
    }

    private onPlaying () {
        ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayer.EventType.PLAYING);
        this.node.emit(VideoPlayer.EventType.PLAYING, this);
    }

    private onPaused () {
        ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayer.EventType.PAUSED);
        this.node.emit(VideoPlayer.EventType.PAUSED, this);
    }

    private onStopped () {
        ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayer.EventType.STOPPED);
        this.node.emit(VideoPlayer.EventType.STOPPED, this);
    }

    private onCompleted () {
        if (this.loop) {
            ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayer.EventType.READY_TO_PLAY);
            this.node.emit(VideoPlayer.EventType.READY_TO_PLAY, this);
            this.play();
        }
        ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayer.EventType.COMPLETED);
        this.node.emit(VideoPlayer.EventType.COMPLETED, this);
    }

    private onError () {
        ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, VideoPlayer.EventType.ERROR);
        this.node.emit(VideoPlayer.EventType.ERROR, this);
    }

    private onSeekCompleted () {
        ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, 'seekto-completed');
        this.node.emit('seekto-completed', this);
        this._isCanSeekTo = true;
        if (sys.isNative) {
            native.jsbBridgeWrapper.dispatchEventToNative(this._eventName, this._videoEventDataPosition.encodeData());
        }
    }

    private onInfo (onInfoWhat: MediaPlayerInfo) {
        ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, 'on-info', onInfoWhat);
        this.node.emit('on-info', this, onInfoWhat);
    }

    private onChangeShape (): void {
        if (this.renderer && this.renderer.material) {
            this.renderer.material.setProperty('videoShape', this._videoShape as number);
        }

        const contentScale: Vec3 = new Vec3(1, 1, 1);
        switch (this._videoShape) {
        case VideoShape.Quad:
        case VideoShape.Quad_3D_LR:
        case VideoShape.Quad_3D_TB:
        {
            if (!this._meshQuad) {
                this._meshQuad = utils.MeshUtils.createMesh(this.generateQuadGeometry());
            }
            if (this.renderer) {
                this.renderer.mesh = this._meshQuad;
            }
            contentScale.x = 4;
            contentScale.y = 2.25;
            contentScale.z = 1;
            break;
        }
        case VideoShape.Pano360:
        case VideoShape.Pano360_3D_LR:
        case VideoShape.Pano360_3D_TB:
        {
            this.onChangePanoramicEffectOption();
            if (this.renderer) {
                this.renderer.mesh = this._meshPanoramic360;
            }
            contentScale.x = 10;
            contentScale.y = 10;
            contentScale.z = 10;
            break;
        }
        case VideoShape.Pano180:
        {
            this.onChangePanoramicEffectOption();
            if (this.renderer) {
                this.renderer.mesh = this._meshPanoramic180;
            }
            contentScale.x = 10;
            contentScale.y = 10;
            contentScale.z = 10;
            break;
        }
        default:
            break;
        }
        if (this.renderer) {
            this.renderer.node.scale = contentScale;
        }
        ComponentEventHandler.emitEvents(this.videoPlayerEvent, this, 'shapetype-changed');
        this.node.emit('shapetype-changed', this);
    }

    private onChangePanoramicEffectOption (): void {
        let segU = 40;
        let segV = 40;
        switch (this._panoramicEffectOption) {
        case PanoramicEffectOption.Performance:
        {
            segU = 40;
            segV = 40;
            break;
        }
        case PanoramicEffectOption.Balanced:
        {
            segU = 60;
            segV = 60;
            break;
        }
        case PanoramicEffectOption.Quality:
        {
            segU = 100;
            segV = 100;
            break;
        }
        default:
            break;
        }

        switch (this._videoShape) {
        case VideoShape.Pano360:
        case VideoShape.Pano360_3D_LR:
        case VideoShape.Pano360_3D_TB:
        {
            if (this.renderer) {
                if (this._meshPanoramic360) {
                    const mesh = utils.MeshUtils.createMesh(this.generateSphereGeometry(this._videoShape, segU, segV));
                    this._meshPanoramic360.destroy();
                    this._meshPanoramic360 = mesh;
                } else {
                    this._meshPanoramic360 = utils.MeshUtils.createMesh(this.generateSphereGeometry(this._videoShape, segU, segV));
                }
            }
            break;
        }

        case VideoShape.Pano180:
        {
            if (this.renderer) {
                if (this._meshPanoramic180) {
                    const mesh = utils.MeshUtils.createMesh(this.generateSphereGeometry(this._videoShape, segU, segV));
                    this._meshPanoramic180.destroy();
                    this._meshPanoramic180 = mesh;
                } else {
                    this._meshPanoramic180 = utils.MeshUtils.createMesh(this.generateSphereGeometry(this._videoShape, segU, segV));
                }
            }
            break;
        }
        default:
            break;
        }
    }

    generateQuadGeometry (): primitives.IGeometry {
        const result: primitives.IGeometry = {
            positions: [
                -0.5, -0.5, 0, // bottom-left
                -0.5, 0.5, 0, // top-left
                0.5, 0.5, 0, // top-right
                0.5, -0.5, 0, // bottom-right
            ],
            indices: [
                0, 3, 1,
                3, 2, 1,
            ],
            minPos: {
                x: -0.5, y: -0.5, z: 0,
            },
            maxPos: {
                x: 0.5, y: 0.5, z: 0,
            },
            boundingRadius: Math.sqrt(0.5 * 0.5 + 0.5 * 0.5),
        };
        result.normals = [
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ];
        result.uvs = [
            0, 1,
            0, 0,
            1, 0,
            1, 1,
        ];
        return result;
    }

    generateSphereGeometry (shape: VideoShape, uSegments = 60, vSegments = 60): primitives.IGeometry {
        const radius = 10;
        // lat === latitude
        // lon === longitude
        const positions: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        const minPos = new Vec3(-radius, -radius, -radius);
        const maxPos = new Vec3(radius, radius, radius);
        const boundingRadius = radius;

        for (let lat = 0; lat <= vSegments; ++lat) {
            const theta = lat * Math.PI / vSegments;
            const sinTheta = Math.sin(theta);
            const cosTheta = -Math.cos(theta);

            for (let lon = 0; lon <= uSegments; ++lon) {
                //-90~270 : 360 left-right-front
                let phi: number = lon * 2 * Math.PI / uSegments - Math.PI / 2.0;
                //90~270 : 180
                if (shape === VideoShape.Pano180) {
                    phi = lon * 1 * Math.PI / uSegments + Math.PI / 2.0;
                }
                const sinPhi = Math.sin(phi);
                const cosPhi = Math.cos(phi);

                const x = sinPhi * sinTheta;
                const y = cosTheta;
                const z = cosPhi * sinTheta;
                const u = 1 - lon / uSegments;
                const v = 1 - lat / vSegments;

                positions.push(x * radius, y * radius, z * radius);
                normals.push(x, y, z);
                uvs.push(u, v);

                if ((lat < vSegments) && (lon < uSegments)) {
                    const seg1 = uSegments + 1;
                    const a = seg1 * lat + lon;
                    const b = seg1 * (lat + 1) + lon;
                    const c = seg1 * (lat + 1) + lon + 1;
                    const d = seg1 * lat + lon + 1;
                    /*  b         c
                          |------|
                          |      |
                        a |------| d
                    */

                    //counterclockwise
                    //indices.push(a, d, b);
                    //indices.push(d, c, b);
                    //clockwise
                    indices.push(a, b, d);
                    indices.push(d, b, c);
                }
            }
        }

        return {
            positions,
            indices,
            normals,
            uvs,
            minPos,
            maxPos,
            boundingRadius,
        };
    }

    //#region web video player
    public createWebVideoPlayer (url: string) {
        const video = this._webVideo = ccdocument.createElement('video');
        video.className = 'cocosxrVideo';
        video.style.visibility = 'hidden';
        video.style.position = 'absolute';
        video.style.bottom = '0px';
        video.style.left = '0px';
        // video.style['object-fit'] = 'none';
        video.style['transform-origin'] = '0px 100% 0px';
        video.style['-webkit-transform-origin'] = '0px 100% 0px';
        video.setAttribute('preload', 'auto');
        video.setAttribute('webkit-playsinline', '');
        // This x5-playsinline tag must be added, otherwise the play, pause events will only fire once, in the qq browser.
        video.setAttribute('x5-playsinline', '');
        video.setAttribute('playsinline', '');
        video.crossOrigin = 'anonymous';
        video.autoplay = false;
        video.muted = true;
        this._bindDomEvent();
        const source = ccdocument.createElement('source');
        video.appendChild(source);
        source.src = url;

        const region0 = new gfx.BufferTextureCopy();
        region0.texOffset.x = 0;
        region0.texOffset.y = 0;
        region0.texExtent.width = 1;
        region0.texExtent.height = 1;
        region0.texExtent.depth = 1;
        this._videoRegions.push(region0);
    }

    public removeVideoPlayer () {
        const video = this._webVideo;
        if (video) {
            video.remove();
            this.removeAllListeners();
        }
        this._webVideoLoaded = false;
    }

    protected _bindDomEvent () {
        this.addListener('loadedmetadata', this.onLoadedMetadata.bind(this));
        this.addListener('canplay', this.onWebVideoCanPlay.bind(this));
        this.addListener('canplaythrough', this.onWebVideoCanPlay.bind(this));
        this.addListener('play', this.onWebVideoPlay.bind(this));
        this.addListener('playing', this.onPlayingWebVideo.bind(this));
        this.addListener('pause', this.onWebVideoPause.bind(this));
        this.addListener('ended', this.onWebVideoEnded.bind(this));
        this.addListener('error', this.onWebVideoError.bind(this));
        this.addListener('timeupdate', this.onWebVideoTimeUpdated.bind(this));
        this.addListener('seeked', this.onWebVideoSeeked.bind(this));
    }

    protected updateWebVideoTexture () {
        if (this._copyWebVideoTexture && this._webVideo && this._videoTexture) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            const gfxTexture = this._videoTexture.getGFXTexture() as gfx.Texture;
            gfx.deviceManager.gfxDevice.copyTexImagesToTexture([this._webVideo], gfxTexture, this._videoRegions);
        }

        if (this._webVideo) {
            this._currentTime = this._webVideo.currentTime;
        }
    }

    // video player event
    protected onLoadedMetadata (e: Event) {
        if (this._webVideo) {
            console.log(`onLoadedMetadata.${this._webVideo.videoWidth},${this._webVideo.videoHeight
            },${this._webVideo.duration},${this._webVideo.readyState}`);
            // create texture 2d
            this._videoTexture = new Texture2D();
            this._videoTexture._uuid = 'xr-video-texture';

            const aspect: number = this._webVideo.videoWidth / this._webVideo.videoHeight;
            let textureWidth: number = this._webVideo.videoWidth;
            let textureHeight: number = this._webVideo.videoHeight;

            if (this.keepAspectRatio) {
                // recalculate texture size, default we use 16:9 display aspect radio
                if (aspect > 1.77777) {
                    textureHeight = Math.ceil(textureWidth / 16 * 9);
                } else {
                    textureWidth = Math.ceil(textureHeight / 9 * 16);
                }
            }
            this._videoRegions[0].texOffset.x = (textureWidth - this._webVideo.videoWidth) / 2;
            this._videoRegions[0].texExtent.width = textureWidth;
            this._videoRegions[0].texExtent.height = textureHeight;
            const blackValueView = new Uint8Array(textureWidth * textureHeight * 3);
            const blackMemImageSource: any = {
                width: textureWidth,
                height: textureHeight,
                _data: blackValueView,
                _compressed: false,
                format: Texture2D.PixelFormat.RGB888,
            };
            const imgAsset = new ImageAsset(blackMemImageSource);
            if (this._videoTexture) {
                this._videoTexture.image = imgAsset;
            }

            this._duration = this._webVideo.duration;
        }
    }

    protected onWebVideoCanPlay (e: Event) {
        console.log(`onCanPlay.${this._webVideo?.readyState}`);
        if (!this._webVideoLoaded) {
            this._webVideoLoaded = true;
            if (this._webVideo) {
                this._webVideo.setAttribute('muted', '');
                this._webVideo.volume = this._volume;
                this._webVideo.muted = this._mute;
                this._webVideo.playbackRate = this._playbackRate;
                this._webVideo.loop = this.loop;
            }
            this.playOnAwake = false;
            this.onReadyToPlay();
        }
    }

    protected onWebVideoPlay (e: Event) {
        console.log(`onPlay.${this._webVideo?.readyState}`);
        this._isPlaying = true;
        if (this._videoTexture) {
            this.renderer?.material?.setProperty('mainTexture', this._videoTexture);
        }
    }

    protected onPlayingWebVideo (e: Event) {
        console.log(`onPlayingWebVideo`);
        this.onPlaying();
    }

    protected onWebVideoPause (e: Event) {
        console.log(`onPause`);
        this.onPaused();
    }

    public onWebVideoEnded (e: Event) {
        console.log(`onEnded`);
        this.onCompleted();
    }

    protected onClick (e: Event) {
        console.log(`onClick`);
    }

    protected onWebVideoError (e: Event) {
        const video = e.target as HTMLVideoElement;
        if (video && video.error) {
            console.error(`Error ${video.error.code}; details: ${video.error.message}`);
        }
        this.onError();
    }

    protected onWebVideoTimeUpdated (e: Event) {
        this._copyWebVideoTexture = true;
    }

    protected onWebVideoSeeked (e: Event) {
        console.log(`onSeeked`);
        if (!this._isPlaying && this._webVideo) {
            this._webVideo.pause();
        }
        this.onSeekCompleted();
    }

    protected onDurationchange (e: Event) {
        console.log(`onDurationchange`);
    }

    protected addListener (type: string, handler: (e: Event) => void) {
        if (!this._webVideo) {
            return;
        }
        this._webVideoEventList.set(type, handler);
        this._webVideo.addEventListener(type, handler);
    }

    protected removeAllListeners () {
        this._webVideoEventList.forEach((handler, type) => {
            if (!this._webVideo) {
                return;
            }
            this._webVideo.removeEventListener(type, handler);
        });
        this._webVideoEventList.clear();
    }

    //#endregion
}
