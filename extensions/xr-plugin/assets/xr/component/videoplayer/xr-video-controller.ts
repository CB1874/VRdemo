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

import { _decorator, Component, VideoPlayer, Node, Sprite, Button, ProgressBar, EventHandler, Slider, Label, XrUIPressEventType, XrUIPressEvent, Vec3,
    RichText, Input, PhysicsSystem, PhysicsRayResult, PhysicsGroup, find } from 'cc';
import { HMDCtrl } from '../device/hmd-ctrl';
import { TargetEye, TargetEye_Type } from '../device/target-eye';
import { XRController, XrEventActionType, XrEventTypeLeft, XrEventTypeRight, XrInputAction, XrInputDeviceType } from '../device/xr-controller';
import { RayInteractor } from '../interaction/ray-interactor';
import { XRGazeInteractor } from '../interaction/xr-gaze-interactor';
import { VideoShape, XRVideoPlayer } from './xr-video-player';

const { ccclass, property, menu } = _decorator;

@ccclass('cc.XRVideoController')
@menu('XR/Extra/XRVideoController')
export class XRVideoController extends Component {
    @property({type: XRVideoPlayer, tooltip: 'i18n:xr-plugin.XRVideoController.videoPlayer'})
    public videoPlayer: XRVideoPlayer | null = null

    @property({type: HMDCtrl, tooltip: 'i18n:xr-plugin.XRVideoController.hmdControl'})
    public hmdControl: HMDCtrl | null = null;

    @property({type: XRController, tooltip: 'i18n:xr-plugin.XRVideoController.leftHandController'})
    public leftHandController: XRController | null = null;

    @property({type: XRController, tooltip: 'i18n:xr-plugin.XRVideoController.rightHandController'})
    public rightHandController: XRController | null = null;

    @property({type: Button, tooltip: 'i18n:xr-plugin.XRVideoController.playPause'})
    public playPause: Button | null = null;

    @property({type: ProgressBar, tooltip: 'i18n:xr-plugin.XRVideoController.progressBar'})
    public progressBar: ProgressBar | null = null;

    @property({type: Button, tooltip: 'i18n:xr-plugin.XRVideoController.fastForward'})
    public fastForward: Button | null = null;

    @property({type: Button, tooltip: 'i18n:xr-plugin.XRVideoController.rewind'})
    public rewind: Button | null = null;

    @property({type: Button, tooltip: 'i18n:xr-plugin.XRVideoController.videoShapeUI'})
    public videoShapeUI: Button | null = null;

    @property({type: Button, tooltip: 'i18n:xr-plugin.XRVideoController.playerBackRateBar'})
    public playerBackRateBar: Button | null = null;

    @property({type: Button, tooltip: 'i18n:xr-plugin.XRVideoController.volumeUI'})
    public volumeUI: Button | null = null;

    @property({ serializable: true })
    public autoHideWhenNoOperation = true;

    //-
    private PANEL_SHOW_TIME = 3;
    private _pauseButton: Button | null | undefined= null;
    private _seekToSlider: Slider | null | undefined = null;
    private _volumeSlider: Slider | null | undefined = null;
    private _volumeValueLabel: Label | null | undefined = null;
    private _playedTimeLabel: Label | null | undefined = null;
    private _totalTimeLabel: Label | null | undefined = null;
    private _volumeControlPanel: Node | null | undefined = null;

    private _subtitleEnableButton: Button | null | undefined = null;
    private _subtitleDisableButton: Button | null | undefined = null;
    private _exitButton: Button | null | undefined = null;

    private _playSpeedControlPanel: Node | null = null;
    private _playShapeControlPanel: Node | null = null;

    private _volumePanelLifeTime = 0;
    private _playSpeedPanelLifeTime: number = this.PANEL_SHOW_TIME;
    private _playShapePanelLifeTime: number = this.PANEL_SHOW_TIME;

    private _subtitlePanoRichText: RichText | null | undefined = null;
    private _subtitlePlaneRichText: RichText | null | undefined = null;
    private _videoFileName: Label | null | undefined = null;

    // 5s
    private _controllerPanelLifeTime = 5;
    private _leftControllerRayInteractor: RayInteractor | null = null;
    private _rightControllerRayInteractor: RayInteractor | null = null;
    private _gazeControllerRayInteractor: XRGazeInteractor | null = null;

    onLoad () {
        if (!this.hmdControl) {
            const xrAgent = find('XR Agent');
            const hmdCtrlComps = xrAgent?.getComponentsInChildren(HMDCtrl);
            if (hmdCtrlComps) {
                this.hmdControl = hmdCtrlComps[0];
            }

            const handCtrlComps = xrAgent?.getComponentsInChildren(XRController);
            if (handCtrlComps) {
                for (const controller of handCtrlComps) {
                    if (controller.inputDevice === XrInputDeviceType.Left_Hand) {
                        this.leftHandController = controller;
                    } else if (controller.inputDevice === XrInputDeviceType.Right_Hand) {
                        this.rightHandController = controller;
                    }
                }
            }
        }
    }

    start () {
        // get component
        this._pauseButton = this.node.getChildByName('Pause')?.getComponent(Button);
        this._seekToSlider = this.node.getChildByName('SeekSlider')?.getComponent(Slider);
        this._playedTimeLabel = this.node.getChildByName('PlayedTime')?.getComponent(Label);
        this._totalTimeLabel = this.node.getChildByName('TotalTime')?.getComponent(Label);
        this._volumeControlPanel = this.node.getChildByName('VolumeControlPanel');
        this._volumeSlider = this._volumeControlPanel?.getChildByName('VolumeSlider')?.getComponent(Slider);
        this._volumeValueLabel = this._volumeControlPanel?.getChildByName('VolumeValue')?.getComponent(Label);
        this._subtitleEnableButton = this.node.getChildByName('SubtitleDisabled')?.getComponent(Button);
        this._subtitleDisableButton = this.node.getChildByName('SubtitleEnabled')?.getComponent(Button);
        this._exitButton = this.node.getChildByName('Exit')?.getComponent(Button);
        this._playSpeedControlPanel = this.node.getChildByName('PlaySpeedControlPanel');
        if (this.videoPlayer && this.videoPlayer.isSupport3DMode()) {
            this._playShapeControlPanel = this.node.getChildByName('PlayShapeControlPanel-3D');
            if (!this._playShapeControlPanel) {
                // compatible with old scene
                this._playShapeControlPanel = this.node.getChildByName('PlayShapeControlPanel');
            }
        } else {
            this._playShapeControlPanel = this.node.getChildByName('PlayShapeControlPanel');
        }
        this._subtitlePanoRichText = this.node.getChildByName('SubtitleDisplayPano')?.getComponent(RichText);
        if (this._subtitlePanoRichText) {
            this._subtitlePanoRichText.string = '';
        } else {
            console.warn('Not find SubtitleDisplayPano node !!!');
        }

        if (this.videoPlayer) {
            const contentNode = this.videoPlayer.content();
            this._subtitlePlaneRichText = contentNode?.getChildByName('SubtitleDisplayPlane')?.getComponent(RichText);
            if (this._subtitlePlaneRichText) {
                this._subtitlePlaneRichText.string = '';
            } else {
                console.warn('Not find SubtitleDisplayPlane node !!!');
            }
        }

        this._videoFileName = this.node.getChildByName('VideoClipName')?.getComponent(Label);
        if (this._videoFileName) {
            this._videoFileName.string = '';
        }

        const clickEventHandler = new EventHandler();
        clickEventHandler.target = this.node;
        clickEventHandler.component = 'cc.XRVideoController';
        clickEventHandler.handler = 'onVideoPlayerCallback';
        clickEventHandler.customEventData = '';
        this.videoPlayer?.videoPlayerEvent.push(clickEventHandler);

        this.fastForward?.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        this.playPause?.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        this.rewind?.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        this.volumeUI?.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        this.videoShapeUI?.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        this.playerBackRateBar?.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        this._pauseButton?.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        this._exitButton?.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        this._subtitleEnableButton?.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        this._subtitleDisableButton?.node.on(Button.EventType.CLICK, this.onButtonClick, this);

        this._seekToSlider?.node.on('slide', this.sliderSeekToCallback, this);
        this._volumeSlider?.node.on('slide', this.sliderVolumeCallback, this);

        this._volumeSlider?.node.on(XrUIPressEventType.XRUI_HOVER_ENTERED, this.onHoverEnter, this);
        this._volumeSlider?.node.on(XrUIPressEventType.XRUI_HOVER_EXITED, this.onHoverExit, this);

        // play speed
        if (this._playSpeedControlPanel) {
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_05')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED, this.onHoverEnter, this);
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_05')?.on(XrUIPressEventType.XRUI_HOVER_EXITED, this.onHoverExit, this);
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_05')?.on(Button.EventType.CLICK, this.onButtonClick, this);

            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_10')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED, this.onHoverEnter, this);
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_10')?.on(XrUIPressEventType.XRUI_HOVER_EXITED, this.onHoverExit, this);
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_10')?.on(Button.EventType.CLICK, this.onButtonClick, this);

            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_15')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED, this.onHoverEnter, this);
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_15')?.on(XrUIPressEventType.XRUI_HOVER_EXITED, this.onHoverExit, this);
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_15')?.on(Button.EventType.CLICK, this.onButtonClick, this);

            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_20')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED, this.onHoverEnter, this);
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_20')?.on(XrUIPressEventType.XRUI_HOVER_EXITED, this.onHoverExit, this);
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_20')?.on(Button.EventType.CLICK, this.onButtonClick, this);

            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_25')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED, this.onHoverEnter, this);
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_25')?.on(XrUIPressEventType.XRUI_HOVER_EXITED, this.onHoverExit, this);
            this._playSpeedControlPanel.getChildByPath('Container/PlaySpeed_25')?.on(Button.EventType.CLICK, this.onButtonClick, this);
        }

        // play shape
        if (this._playShapeControlPanel) {
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_2D')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED, this.onHoverEnter, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_2D')?.on(XrUIPressEventType.XRUI_HOVER_EXITED, this.onHoverExit, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_2D')?.on(Button.EventType.CLICK, this.onButtonClick, this);

            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano180')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED,
                this.onHoverEnter, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano180')?.on(XrUIPressEventType.XRUI_HOVER_EXITED,
                this.onHoverExit, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano180')?.on(Button.EventType.CLICK, this.onButtonClick, this);

            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano360')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED,
                this.onHoverEnter, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano360')?.on(XrUIPressEventType.XRUI_HOVER_EXITED,
                this.onHoverExit, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano360')?.on(Button.EventType.CLICK, this.onButtonClick, this);

            this._playShapeControlPanel.getChildByPath('Container/PlayShape_3DLR')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED,
                this.onHoverEnter, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_3DLR')?.on(XrUIPressEventType.XRUI_HOVER_EXITED,
                this.onHoverExit, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_3DLR')?.on(Button.EventType.CLICK, this.onButtonClick, this);

            this._playShapeControlPanel.getChildByPath('Container/PlayShape_3DTB')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED,
                this.onHoverEnter, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_3DTB')?.on(XrUIPressEventType.XRUI_HOVER_EXITED,
                this.onHoverExit, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_3DTB')?.on(Button.EventType.CLICK, this.onButtonClick, this);

            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano3603DLR')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED,
                this.onHoverEnter, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano3603DLR')?.on(XrUIPressEventType.XRUI_HOVER_EXITED,
                this.onHoverExit, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano3603DLR')?.on(Button.EventType.CLICK, this.onButtonClick, this);

            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano3603DTB')?.on(XrUIPressEventType.XRUI_HOVER_ENTERED,
                this.onHoverEnter, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano3603DTB')?.on(XrUIPressEventType.XRUI_HOVER_EXITED,
                this.onHoverExit, this);
            this._playShapeControlPanel.getChildByPath('Container/PlayShape_Pano3603DTB')?.on(Button.EventType.CLICK, this.onButtonClick, this);
        }

        this.refreshPanelUIStatus();

        if (this.leftHandController) {
            this.leftHandController.node.on(Input.EventType.HANDLE_INPUT, this.onControllerEventCallback, this);
            this._leftControllerRayInteractor = this.leftHandController.node.getComponent(RayInteractor);
        }

        if (this.rightHandController) {
            this.rightHandController.node.on(Input.EventType.HANDLE_INPUT, this.onControllerEventCallback, this);
            this._rightControllerRayInteractor = this.rightHandController.node.getComponent(RayInteractor);
        }

        const gazeNode = find('Gaze Pointer Interactor');
        if (gazeNode) {
            this._gazeControllerRayInteractor = gazeNode.getComponent(XRGazeInteractor);
        }
    }

    onControllerEventCallback (xrInputAction: XrInputAction) {
        const inputDeviceType = xrInputAction.inputSourceType;
        const eventType = xrInputAction.eventType;
        const touchEventType = xrInputAction.touchEventActionType;
        const keyEventType = xrInputAction.keyEventActionType;
        switch (eventType) {
        case XrEventTypeRight.BUTTON_A:
            break;
        case XrEventTypeRight.BUTTON_B:
            break;
        case XrEventTypeLeft.BUTTON_X:
            break;
        case XrEventTypeLeft.BUTTON_Y:
            break;
        case XrEventTypeLeft.TRIGGER_LEFT:
            break;
        case XrEventTypeRight.TRIGGER_RIGHT:
            break;
        case XrEventTypeLeft.GRIP_LEFT:
            break;
        case XrEventTypeRight.GRIP_RIGHT:
            break;
        case XrEventTypeLeft.THUMBSTICK_LEFT:
            break;
        case XrEventTypeRight.THUMBSTICK_RIGHT:
            break;
        case XrEventTypeLeft.TRIGGER_BTN_LEFT:
        case XrEventTypeRight.TRIGGER_BTN_RIGHT:
            if (keyEventType === XrEventActionType.KEY_UP && !this.node.active) {
                if (this.hmdControl) {
                    const pos: Vec3 = this.hmdControl.node.worldPosition;
                    const forward: Vec3 = this.hmdControl.node.forward.normalize();
                    this.node.worldPosition = pos.clone().add(forward.clone().multiplyScalar(3.5)).add3f(0, 0.618, 0);
                    this.node.lookAt(pos.clone().add(forward.clone().multiplyScalar(10)));
                }

                this.node.active = true;
                this.changeButtonState(true);
                this._controllerPanelLifeTime = 5;
            }
            break;
        default:
            break;
        }
    }

    onHoverEnter (event: XrUIPressEvent): void {
        const node: Node = event.currentTarget as Node;

        if (node && node === this._volumeSlider?.node) {
            this._volumePanelLifeTime = 0;
        }

        if (node && node.name.startsWith('PlaySpeed_')) {
            this._playSpeedPanelLifeTime -= this.PANEL_SHOW_TIME;
        }

        if (node && node.name.startsWith('PlayShape_')) {
            this._playShapePanelLifeTime -= this.PANEL_SHOW_TIME;
        }
    }

    onHoverExit (event: XrUIPressEvent): void {
        const node: Node = event.currentTarget as Node;
        if (node && node === this._volumeSlider?.node) {
            this._volumePanelLifeTime = this.PANEL_SHOW_TIME;
            this._controllerPanelLifeTime = 5;
        }

        if (node && node.name.startsWith('PlaySpeed_')) {
            this._playSpeedPanelLifeTime += this.PANEL_SHOW_TIME;
            this._controllerPanelLifeTime = 5;
        }

        if (node && node.name.startsWith('PlayShape_')) {
            this._playShapePanelLifeTime += this.PANEL_SHOW_TIME;
            this._controllerPanelLifeTime = 5;
        }
    }

    closePlaySpeedControlPanel (): void {
        if (this._playSpeedControlPanel) {
            this._playSpeedControlPanel.active = false;
        }
    }

    closePlayShapeControlPanel (): void {
        if (this._playShapeControlPanel) {
            this._playShapeControlPanel.active = false;
        }
    }

    closeVolumeControlPanel (): void {
        if (this._volumeControlPanel) {
            this._volumeControlPanel.active = false;
        }
    }

    sliderSeekToCallback (slider: Slider): void {
        if (this.videoPlayer) {
            this.videoPlayer.currentTime = slider.progress * this.videoPlayer.duration + 0.001;

            if (this._playedTimeLabel) {
                this._playedTimeLabel.string = this.formatSeconds(this.videoPlayer.currentTime);
            }
            if (this._totalTimeLabel) {
                this._totalTimeLabel.string = this.formatSeconds(this.videoPlayer.duration);
            }
        }

        if (this.progressBar) {
            this.progressBar.progress = slider.progress;
        }

        const sprite = slider.node.getComponent(Sprite);
        if (sprite) {
            sprite.fillRange = slider.progress;
        }
    }

    sliderVolumeCallback (slider: Slider): void {
        if (this.videoPlayer) {
            if (this.videoPlayer.mute && slider.progress !== 0) {
                this.videoPlayer.mute = false;
            }
            this.videoPlayer.volume = slider.progress;
        }
        if (this._volumeValueLabel && this.videoPlayer) {
            this._volumeValueLabel.string = (this.videoPlayer.volume * 100).toFixed();
        }
        const sprite = slider.node.getComponent(Sprite);
        if (sprite) {
            sprite.fillRange = slider.progress;
        }
    }

    onButtonClick (button: Button): void {
        if (button.uuid === this.playPause?.uuid) {
            // can pause
            this.videoPlayer?.play();
        }

        if (button.uuid === this._pauseButton?.uuid) {
            // can play
            this.videoPlayer?.pause();
        }

        if (button.uuid === this.fastForward?.uuid) {
            if (this.videoPlayer) {
                this.videoPlayer.currentTime += 5;
                this.syncPlayProgress();
            }
        }

        if (button.uuid === this.rewind?.uuid) {
            if (this.videoPlayer) {
                this.videoPlayer.currentTime -= 5;
                this.syncPlayProgress();
            }
        }

        if (button.uuid === this.volumeUI?.uuid) {
            if (this._volumeControlPanel) {
                this._volumeControlPanel.active = !this._volumeControlPanel.active;
            }
            if (this._volumeControlPanel?.active) {
                this._volumePanelLifeTime = this.PANEL_SHOW_TIME;
                // sync
                if (this._volumeSlider) {
                    if (this.videoPlayer) {
                        this._volumeSlider.progress = this.videoPlayer.volume;
                        if (this._volumeValueLabel) {
                            this._volumeValueLabel.string = (this.videoPlayer.volume * 100).toFixed();
                        }
                    }
                    const sprite = this._volumeSlider.node.getComponent(Sprite);
                    if (sprite) {
                        sprite.fillRange = this._volumeSlider.progress;
                    }
                }
            }
        }

        if (button.uuid === this._exitButton?.uuid) {
            this.videoPlayer?.pause();
            if (this.node.parent) {
                this.node.parent.active = false;
            }
        }

        if (button.uuid === this.playerBackRateBar?.uuid) {
            if (this._playSpeedControlPanel) {
                this._playSpeedControlPanel.active = !this._playSpeedControlPanel.active;
                if (this._playSpeedControlPanel.active) {
                    this._playSpeedPanelLifeTime = this.PANEL_SHOW_TIME;
                    this.closePlayShapeControlPanel();
                }
            }
        }

        if (button.uuid === this.videoShapeUI?.uuid) {
            if (this._playShapeControlPanel) {
                this._playShapeControlPanel.active = !this._playShapeControlPanel.active;
                if (this._playShapeControlPanel.active) {
                    this._playShapePanelLifeTime = this.PANEL_SHOW_TIME;
                    this.closePlaySpeedControlPanel();
                }
            }
        }

        if (button.node.name.startsWith('PlaySpeed_')) {
            const playbackRate: number = parseInt(button.node.name.split('_')[1]);
            if (this.videoPlayer) {
                this.videoPlayer.playbackRate = playbackRate * 0.1;
            }
            // sync playrate
            const label = this.playerBackRateBar?.node.getChildByName('Label')?.getComponent(Label);
            if (label) {
                label.string = `${this.videoPlayer?.playbackRate}X`;
            }
        }

        if (button.node.name.startsWith('PlayShape_')) {
            const videoShape: string = button.node.name.split('_')[1];
            const panelPosition: Vec3 = new Vec3();
            if (videoShape === '2D') {
                if (this.videoPlayer) {
                    this.videoPlayer.shape = VideoShape.Quad;
                }
            } else if (videoShape === 'Pano180') {
                panelPosition.y = 0.618;
                if (this.videoPlayer) {
                    this.videoPlayer.shape = VideoShape.Pano180;
                }
            } else if (videoShape === 'Pano360') {
                panelPosition.y = 0.618;
                if (this.videoPlayer) {
                    this.videoPlayer.shape = VideoShape.Pano360;
                }
            }  else if (videoShape === '3DLR') {
                if (this.videoPlayer) {
                    this.videoPlayer.shape = VideoShape.Quad_3D_LR;
                }
            } else if (videoShape === '3DTB') {
                if (this.videoPlayer) {
                    this.videoPlayer.shape = VideoShape.Quad_3D_TB;
                }
            } else if (videoShape === 'Pano3603DLR') {
                panelPosition.y = 0.618;
                if (this.videoPlayer) {
                    this.videoPlayer.shape = VideoShape.Pano360_3D_LR;
                }
            } else if (videoShape === 'Pano3603DTB') {
                panelPosition.y = 0.618;
                if (this.videoPlayer) {
                    this.videoPlayer.shape = VideoShape.Pano360_3D_TB;
                }
            }
            // change panel position y
            this.node.setPosition(panelPosition);
            // sync shape
            const label = this.videoShapeUI?.node.getChildByName('Label')?.getComponent(Label);
            if (label && this.videoPlayer) {
                label.string = this.getVideoShapeText(this.videoPlayer.shape);
            }
        }

        if (button.uuid === this._subtitleEnableButton?.uuid) {
            this.changeSubtitleActiveStatus(true);
            this._subtitleEnableButton.node.active = false;
            if (this._subtitleDisableButton) {
                this._subtitleDisableButton.node.active = true;
            }
        }

        if (button.uuid === this._subtitleDisableButton?.uuid) {
            this.changeSubtitleActiveStatus(false);
            if (this._subtitleEnableButton) {
                this._subtitleEnableButton.node.active = true;
            }
            this._subtitleDisableButton.node.active = false;
        }
    }

    syncPlayProgress () {
        if (this.videoPlayer) {
            if (this._playedTimeLabel) {
                this._playedTimeLabel.string = this.formatSeconds(this.videoPlayer.currentTime);
            }
            if (this._totalTimeLabel) {
                this._totalTimeLabel.string = this.formatSeconds(this.videoPlayer.duration);
            }

            const playProgress: number = this.videoPlayer.currentTime / this.videoPlayer.duration;
            if (this._seekToSlider) {
                this._seekToSlider.progress = playProgress;
            }
            const sprite = this._seekToSlider?.node.getComponent(Sprite);
            if (sprite) {
                sprite.fillRange = playProgress;
            }
        }
    }

    update (deltaTime: number) {
        if (this.videoPlayer && this.videoPlayer.isPlaying) {
            this.syncPlayProgress();

            this.updateSubtitle();
        } else {
            // can play
            if (this._pauseButton && this._pauseButton.node.active) {
                this._pauseButton.node.active = false;
            }
            if (this.playPause && !this.playPause.node.active) {
                this.playPause.node.active = true;
            }
        }

        if (this.videoPlayer && this._videoFileName && this._videoFileName.string.length === 0) {
            this._videoFileName.string = this.videoPlayer.getVideoName();
        }

        let isChildPanelShowing = false;
        if (this._playShapePanelLifeTime > 0) {
            this._playShapePanelLifeTime -= deltaTime;
            if (this._playShapePanelLifeTime <= 0) {
                this.closePlayShapeControlPanel();
            } else {
                isChildPanelShowing = true;
            }
        }

        if (this._playSpeedPanelLifeTime > 0) {
            this._playSpeedPanelLifeTime -= deltaTime;
            if (this._playSpeedPanelLifeTime <= 0) {
                this.closePlaySpeedControlPanel();
            } else {
                isChildPanelShowing = true;
            }
        }

        if (this._volumePanelLifeTime > 0) {
            this._volumePanelLifeTime -= deltaTime;
            if (this._volumePanelLifeTime <= 0) {
                this.closeVolumeControlPanel();
            } else {
                isChildPanelShowing = true;
            }
        }

        if (this._leftControllerRayInteractor) {
            this.checkControllerRaycast(this._leftControllerRayInteractor);
        }

        if (this._rightControllerRayInteractor) {
            this.checkControllerRaycast(this._rightControllerRayInteractor);
        }

        if (this._gazeControllerRayInteractor && this._gazeControllerRayInteractor.node.active && this._controllerPanelLifeTime <= 1) {
            const hit = PhysicsSystem.instance.raycast(this._gazeControllerRayInteractor.getRay(), 0xffffffff, 100, true);
            if (hit) {
                const raycastResults: PhysicsRayResult[] = PhysicsSystem.instance.raycastResults;
                if (raycastResults) {
                    for (const raycastResult of raycastResults) {
                        if (raycastResult.collider.node.name === 'VideoControllerBackground') {
                            this._controllerPanelLifeTime = 5;
                        }
                    }
                }
            }
        }

        if (!isChildPanelShowing && this._controllerPanelLifeTime > 0 && this.autoHideWhenNoOperation) {
            this._controllerPanelLifeTime -= deltaTime;
        }

        if (this._controllerPanelLifeTime <= 0 && this.node.active) {
            // close all panels
            this.node.active = false;

            if (this._volumeControlPanel) {
                this._volumeControlPanel.active = false;
            }

            if (this._playSpeedControlPanel) {
                this._playSpeedControlPanel.active = false;
            }

            if (this._playShapeControlPanel) {
                this._playShapeControlPanel.active = false;
            }

            this.changeButtonState(false);
        }
    }

    changeButtonState (interactable: boolean) {
        if (this._pauseButton) {
            this._pauseButton.interactable = interactable;
        }
        if (this._subtitleEnableButton) {
            this._subtitleEnableButton.interactable = interactable;
        }
        if (this._subtitleDisableButton) {
            this._subtitleDisableButton.interactable = interactable;
        }
        if (this.playPause) {
            this.playPause.interactable = interactable;
        }
        if (this._exitButton) {
            this._exitButton.interactable = interactable;
        }
        if (this.fastForward) {
            this.fastForward.interactable = interactable;
        }
        if (this.rewind) {
            this.rewind.interactable = interactable;
        }
        if (this.videoShapeUI) {
            this.videoShapeUI.interactable = interactable;
        }
        if (this.playerBackRateBar) {
            this.playerBackRateBar.interactable = interactable;
        }
        if (this.volumeUI) {
            this.volumeUI.interactable = interactable;
        }
    }

    checkControllerRaycast (rayInteractor: RayInteractor | null = null): void {
        if (rayInteractor) {
            const hit: boolean = PhysicsSystem.instance.lineStripCast(rayInteractor.getLineWorldPositions(), PhysicsGroup.DEFAULT, 100, true);
            if (hit) {
                const raycastResults: PhysicsRayResult[] = PhysicsSystem.instance.lineStripCastResults;
                if (raycastResults) {
                    for (const raycastResult of raycastResults) {
                        if (raycastResult.collider.node.name === 'VideoControllerBackground') {
                            this._controllerPanelLifeTime = 5;
                        }
                    }
                }
            }
        }
    }

    onVideoPlayerCallback (videoplayer: XRVideoPlayer, eventType: string) {
        switch (eventType) {
        case VideoPlayer.EventType.READY_TO_PLAY:
        {
            // can play
            if (this.playPause) {
                this.playPause.node.active = true;
                this.playPause.interactable = true;
            }
            if (this._pauseButton) {
                this._pauseButton.node.active = false;
            }
            break;
        }
        case VideoPlayer.EventType.PLAYING:
        {
            // can pause
            if (this.playPause) {
                this.playPause.node.active = false;
            }
            if (this._pauseButton) {
                this._pauseButton.node.active = true;
                this._pauseButton.interactable = true;
            }
            break;
        }
        case VideoPlayer.EventType.PAUSED:
        {
            // can play
            if (this.playPause) {
                this.playPause.node.active = true;
                this.playPause.interactable = true;
            }
            if (this._pauseButton) {
                this._pauseButton.node.active = false;
            }
            break;
        }
        case VideoPlayer.EventType.STOPPED:
        {
            // can play
            if (this.playPause) {
                this.playPause.node.active = true;
                this.playPause.interactable = true;
            }
            if (this._pauseButton) {
                this._pauseButton.node.active = false;
            }
            break;
        }
        case VideoPlayer.EventType.COMPLETED:
        {
            // can play
            if (this.playPause) {
                this.playPause.node.active = true;
                this.playPause.interactable = true;
            }
            if (this._pauseButton) {
                this._pauseButton.node.active = false;
            }
            break;
        }
        case VideoPlayer.EventType.ERROR:
        {
            console.log('onVideoPlayerCallback error !!!');
            break;
        }

        case 'shapetype-changed':
        {
            this.changeSubtitleActiveStatus(true);
            break;
        }
        default:
            break;
        }
    }

    private refreshPanelUIStatus (): void {
        // volume
        if (this._volumeControlPanel?.active) {
            if (this._volumeSlider) {
                if (this.videoPlayer) {
                    this._volumeSlider.progress = this.videoPlayer.volume;
                }
                const sprite = this._volumeSlider.node.getComponent(Sprite);
                if (sprite) {
                    sprite.fillRange = this._volumeSlider.progress;
                }
            }

            if (this._volumeValueLabel && this.videoPlayer) {
                this._volumeValueLabel.string = (this.videoPlayer.volume * 100).toFixed();
            }
        }
        // play/pause
        if (this.videoPlayer?.isPlaying) {
            // can pause
            if (this._pauseButton) {
                this._pauseButton.node.active = true;
            }
            if (this.playPause) {
                this.playPause.node.active = false;
            }
        } else {
            // can play
            if (this._pauseButton) {
                this._pauseButton.node.active = false;
            }
            if (this.playPause) {
                this.playPause.node.active = true;
            }
        }
        // video progress
        let playProgress = 0;
        if (this.videoPlayer && this.videoPlayer.duration > 0) {
            playProgress = this.videoPlayer.currentTime / this.videoPlayer.duration;
        }
        if (this._seekToSlider) {
            this._seekToSlider.progress = playProgress;
        }
        if (this.progressBar) {
            this.progressBar.progress = playProgress;
        }
        // play time
        if (this.videoPlayer) {
            if (this._playedTimeLabel) {
                this._playedTimeLabel.string = this.formatSeconds(this.videoPlayer.currentTime);
            }
            if (this._totalTimeLabel) {
                this._totalTimeLabel.string = this.formatSeconds(this.videoPlayer.duration);
            }
        }

        // playrate
        const playerBackRateBarLabel = this.playerBackRateBar?.node.getChildByName('Label')?.getComponent(Label);
        if (playerBackRateBarLabel) {
            playerBackRateBarLabel.string = `${this.videoPlayer?.playbackRate}X`;
        }
        // shape
        const videoShapeUILabel = this.videoShapeUI?.node.getChildByName('Label')?.getComponent(Label);
        if (videoShapeUILabel && this.videoPlayer) {
            videoShapeUILabel.string = this.getVideoShapeText(this.videoPlayer.shape);
        }
    }

    getVideoShapeText (type: VideoShape): string {
        let str = '';
        switch (type) {
        case VideoShape.Quad:
            str = '2D';
            break;
        case VideoShape.Pano360:
            str = '360° Pano';
            break;
        case VideoShape.Pano180:
            str = '180° Pano';
            break;
        case VideoShape.Quad_3D_LR:
            str = '3D LR';
            break;
        case VideoShape.Quad_3D_TB:
            str = '3D TB';
            break;
        case VideoShape.Pano360_3D_LR:
            str = '360° Pano\n3D LR';
            break;
        case VideoShape.Pano360_3D_TB:
            str = '360° Pano\n3D TB';
            break;
        default:
            break;
        }
        return str;
    }

    formatSeconds (value: number): string {
        value = Math.floor(value);
        if (value > 60) {
            let minute: number = Math.floor(value / 60);
            if (minute > 60) {
                const hour: number = Math.floor(minute / 60);
                minute -= 60 * hour;
                const seconds = value - hour * 60 * 60;
                return `00:${
                    minute < 10 ? (`0${minute.toFixed()}`) : minute.toFixed()}:${
                    seconds < 10 ? (`0${seconds.toFixed()}`) : seconds.toFixed()}`;
            } else {
                const seconds = value - minute * 60;
                return `00:${
                    minute < 10 ? (`0${minute.toFixed()}`) : minute.toFixed()}:${
                    seconds < 10 ? (`0${seconds.toFixed()}`) : seconds.toFixed()}`;
            }
        } else {
            return `00:00:${value < 10 ? (`0${value.toFixed()}`) : value.toFixed()}`;
        }
    }

    private changeSubtitleActiveStatus (active: boolean) {
        if (this.videoPlayer) {
            const videoShape = this.videoPlayer.shape;
            switch (videoShape) {
            case VideoShape.Quad:
            case VideoShape.Quad_3D_LR:
            case VideoShape.Quad_3D_TB:
            {
                if (this._subtitlePlaneRichText) {
                    this._subtitlePlaneRichText.node.active = active;
                }

                if (this._subtitlePanoRichText && active) {
                    this._subtitlePanoRichText.node.active = !active;
                }
                break;
            }
            case VideoShape.Pano360_3D_LR:
            case VideoShape.Pano360_3D_TB:
            case VideoShape.Pano360:
            case VideoShape.Pano180:
            {
                if (this._subtitlePanoRichText) {
                    this._subtitlePanoRichText.node.active = active;
                }

                if (this._subtitlePlaneRichText && active) {
                    this._subtitlePlaneRichText.node.active = !active;
                }
                break;
            }
            default:
                break;
            }
        }
    }

    private updateSubtitle () {
        if (this.videoPlayer) {
            let _curSubtitleText: RichText | null | undefined = null;
            const videoShape = this.videoPlayer.shape;
            switch (videoShape) {
            case VideoShape.Quad:
            case VideoShape.Quad_3D_LR:
            case VideoShape.Quad_3D_TB:
            {
                _curSubtitleText = this._subtitlePlaneRichText;
                break;
            }
            case VideoShape.Pano360_3D_LR:
            case VideoShape.Pano360_3D_TB:
            case VideoShape.Pano360:
            case VideoShape.Pano180:
            {
                _curSubtitleText = this._subtitlePanoRichText;
                break;
            }
            default:
                break;
            }

            const isSubtitleExist = this.videoPlayer.subtitleData.length > 0;

            if (_curSubtitleText?.node.active) {
                if (isSubtitleExist) {
                    const subtitleContent = this.videoPlayer.getSubtitleContent(this.videoPlayer.currentTime);
                    _curSubtitleText.string = subtitleContent;
                } else {
                    _curSubtitleText.string = '';
                }
            }
        }
    }
}
