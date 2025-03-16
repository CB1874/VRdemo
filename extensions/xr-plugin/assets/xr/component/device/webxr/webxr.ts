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

import { Camera, Vec3, find } from 'cc';
import { ARAPI, FeatureType } from '../../../../ar/component/framework/utils/ar-defines';
import { arEvent } from '../../../../ar/component/framework/utils/ar-event';
import { TrackingOrigin, TrackingOriginMode_Type } from '../tracking-origin';

const _xr: XRSystem | undefined = navigator.xr;
let xrSession: XRSession | null = null;
export class WebXR {
    private _mode: XRSessionMode = 'inline';
    private _checkMode: XRSessionMode = 'inline';
    private _featureMask = 0;
    private _xrSessionInit: XRSessionInit = {
        requiredFeatures: ['viewer', 'local', 'local-floor'],
        optionalFeatures: [],
    };
    private _session: XRSession | null = null;
    private _immersiveRefSpace: XRReferenceSpace | null = null;
    private _cameraPose: XRViewerPose | undefined = undefined;
    private _framebuffer: WebGLFramebuffer | undefined = undefined;
    private _baseLayer: XRWebGLLayer | undefined  = undefined;
    private _viewport: XRViewport | undefined = undefined;
    private _gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    public _inputSource: XRInputSource | null = null;
    public _targetRayPose: XRPose | undefined = undefined;
    private _onXRFrame: XRFrameRequestCallback | null = null;
    private _endSessionFlag = false;

    private _camera: Camera | null = null;
    get Camera (): Camera | null {
        return this._camera;
    }
    set Camera (val: Camera | null) {
        this._camera = val;
    }
    public getSessionMode () {
        return this._mode;
    }
    public getCheckSessionMode () {
        return this._checkMode;
    }
    public setSessionMode (mode: XRSessionMode) {
        this._mode = mode;
        console.log('mode:', this._mode);
    }

    public isVRMode () {
        return this._mode === 'immersive-vr';
    }

    public setXRSessionInit (v: XRSessionInit) {
        this._xrSessionInit = v;
    }
    public isWebXRSupportedAsync (): Promise<boolean> {
        if ('xr' in navigator) {
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }
    public isSessionSupportedAsync (mode: XRSessionMode): Promise<boolean> {
        if (!_xr) {
            return Promise.resolve(false);
        }
        this._checkMode = mode;
        return _xr.isSessionSupported(mode)
            .then((result: boolean) => {
                const returnValue = typeof result === 'undefined' ? true : result;
                return Promise.resolve(returnValue);
            })
            .catch((e: any) => {
                console.warn(e);
                return Promise.resolve(false);
            });
    }

    private _handleHMD (frame: XRFrame) {
        if (!this._cameraPose) {
            return;
        }

        globalThis.__globalXR.webxrHmdPoseInfos = [];
        const webxrHmdPoseInfos = globalThis.__globalXR.webxrHmdPoseInfos;
        let leftPos: (Vec3 | null) = null;
        let rightPos: (Vec3 | null) = null;
        for (const view of this._cameraPose.views) {
            const poseInfo = {} as any;
            poseInfo.position = view.transform.position;
            poseInfo.orientation = view.transform.orientation;
            switch (view.eye) {
            case 'left':
                poseInfo.code = 0;
                leftPos = new Vec3(poseInfo.position.x, poseInfo.position.y, poseInfo.position.z);
                break;
            case 'right':
                poseInfo.code = 3;
                rightPos = new Vec3(poseInfo.position.x, poseInfo.position.y, poseInfo.position.z);
                break;
            case 'none':
                poseInfo.code = 6;
                break;
            default:
                break;
            }
            webxrHmdPoseInfos.push(poseInfo);
        }

        if (this._cameraPose.views.length === 2 && leftPos && rightPos) {
            const middlePos = Vec3.add(new Vec3(), leftPos, rightPos).multiplyScalar(0.5);
            const poseInfo = {} as any;
            poseInfo.code = 6;
            poseInfo.position = new DOMPointReadOnly(middlePos.x, middlePos.y, middlePos.z);
            poseInfo.orientation = webxrHmdPoseInfos[0].orientation;
            webxrHmdPoseInfos.push(poseInfo);
        }
    }

    private _handleHand (frame: XRFrame) {
        if (!this._immersiveRefSpace) {
            return;
        }

        globalThis.__globalXR.webxrHandlePoseInfos = [];
        const webxrHandlePoseInfos = globalThis.__globalXR.webxrHandlePoseInfos;
        for (const inputSource of frame.session.inputSources) {
            if (inputSource.targetRaySpace) {
                const targetRaySpace = frame.getPose(inputSource.targetRaySpace, this._immersiveRefSpace);
                if (targetRaySpace) {
                    const poseInfo = {} as any;
                    poseInfo.position = targetRaySpace.transform.position;
                    poseInfo.orientation = targetRaySpace.transform.orientation;
                    switch (inputSource.handedness) {
                    case 'left':
                        poseInfo.code = 2;
                        break;
                    case 'right':
                        poseInfo.code = 5;
                        break;
                    case 'none':
                    default:
                        break;
                    }
                    webxrHandlePoseInfos.push(poseInfo);
                }
            }

            if (inputSource.gripSpace) {
                const gripSpace = frame.getPose(inputSource.gripSpace, this._immersiveRefSpace);
                if (gripSpace) {
                    const poseInfo = {} as any;
                    poseInfo.position = gripSpace.transform.position;
                    poseInfo.orientation = gripSpace.transform.orientation;
                    switch (inputSource.handedness) {
                    case 'left':
                        poseInfo.code = 1;
                        break;
                    case 'right':
                        poseInfo.code = 4;
                        break;
                    case 'none':
                    default:
                        break;
                    }
                    webxrHandlePoseInfos.push(poseInfo);
                }
            }
        }
    }

    private _handControl (frame: XRFrame) {
        const gamepadMap: Map<string, Gamepad> = new Map<string, Gamepad>();
        globalThis.__globalXR.webxrGamepadMap = gamepadMap;
        for (const inputSource of frame.session.inputSources) {
            if (!inputSource.gripSpace) {
                continue;
            }
            const gamepad = inputSource.gamepad;
            if (gamepad) {
                gamepadMap.set(inputSource.handedness, gamepad);
            }
        }
    }

    public frameLoop (frameCb: XRFrameRequestCallback) {
        this._onXRFrame = (t, frame) => {
            const session = frame.session;
            this._baseLayer = session.renderState.baseLayer;

            if (this._onXRFrame) {
                session.requestAnimationFrame(this._onXRFrame);
            }

            this._framebuffer = frame.session.renderState.baseLayer?.framebuffer;
            globalThis.__globalXR.webxrHmdPoseInfos = undefined;
            globalThis.__globalXR.webxrHandlePoseInfos = undefined;
            globalThis.__globalXR.webxrGamepadMap = undefined;

            if (this._immersiveRefSpace) {
                this._cameraPose = frame.getViewerPose(this._immersiveRefSpace);
                if (this._mode === 'immersive-vr') {
                    this._handleHMD(frame);
                    this._handleHand(frame);
                    this._handControl(frame);
                } else if (this._mode === 'immersive-ar') {
                    if (this._inputSource) {
                        const targetRayPose = frame.getPose(this._inputSource.targetRaySpace, this._immersiveRefSpace);
                        if (targetRayPose) {
                            this._targetRayPose = targetRayPose;
                            const eventInitDict = this.getTouchInit(targetRayPose?.transform.position);
                            this._gl?.canvas.dispatchEvent(new TouchEvent('touchmove', eventInitDict));
                        }
                    }
                }
            }

            frameCb(t, frame);
        };
    }

    public getSupportMask () {
        return this._featureMask;
    }

    public initializeSession (featureMask: number): Promise<boolean> {
        this._featureMask = featureMask;
        const checkPromise: Promise<void>[] = [];
        const promise = this.initializeSessionAsync().then((supported) => {
            if (!supported) {
                if ((featureMask & FeatureType.PlaneDetection) !== 0) {
                    this._featureMask &= ~FeatureType.PlaneDetection;
                }
                if ((featureMask & FeatureType.ImageTracking) !== 0) {
                    this._featureMask &= ~FeatureType.ImageTracking;
                }
            }
        });
        checkPromise.push(promise);

        return Promise.all(checkPromise).then(() => Promise.resolve(true)).catch(() => Promise.resolve(false));
    }

    private initializeSessionAsync (): Promise<boolean> {
        if (xrSession && this._mode === 'immersive-vr') {
            this._session = xrSession;
            this.setReferenceSpaceTypeAsync();
            return new Promise<boolean>((resolve, reject) => {
                resolve(true);
            });
        }

        if (this._mode === 'inline') {
            this._xrSessionInit.requiredFeatures = ['viewer'];
        } else if (this._mode === 'immersive-vr') {
            const trackingOrigin = find('XR Agent')?.getComponent(TrackingOrigin);
            if (trackingOrigin?.trackingOriginMode === TrackingOriginMode_Type.Floor) {
                this._xrSessionInit.requiredFeatures = ['local-floor'];
            } else {
                this._xrSessionInit.requiredFeatures = ['local'];
            }
        } else {
            this._xrSessionInit.requiredFeatures = ['local'];
        }

        return new Promise<boolean>((resolve, reject) => {
            console.log(this._xrSessionInit);
            _xr?.requestSession(this._mode, this._xrSessionInit).then((session: XRSession) => {
                xrSession = this._session = session;
                this.setReferenceSpaceTypeAsync();
                console.log('session request success !');
                resolve(true);
            }).catch((err: DOMException) => {
                console.warn('requestSession err:', err);
                reject(err);
            });
        });
    }

    private setReferenceSpaceTypeAsync () {
        let space: XRReferenceSpaceType = 'local';
        if (this._mode === 'immersive-vr') {
            const trackingOrigin = find('XR Agent')?.getComponent(TrackingOrigin);
            if (trackingOrigin?.trackingOriginMode === TrackingOriginMode_Type.Floor) {
                space = 'local-floor';
            }
        } else if (this._mode === 'inline') {
            space = 'viewer';
        }

        this._session?.requestReferenceSpace(space).then((refSpace) => {
            this._immersiveRefSpace = refSpace;

            if (this._onXRFrame) {
                this._session?.requestAnimationFrame(this._onXRFrame);
            }
            this.attachController();
        });
    }

    public endSession () {
        this._endSessionFlag = true;
        if (this._mode === 'immersive-vr') {
            this._onXRFrame = (t, frame) => {};
            return;
        }
        this.stopSession();
    }

    public stopSession () {
        if (this._session) {
            this._session?.end();
            this._session = null;
            xrSession = null;
        }
    }

    public getImmersiveRefSpace () {
        return this._immersiveRefSpace;
    }

    private attachController () {
        const onSessionEvent = (event: XRInputSourceEvent) => {
            if (this._mode !== 'inline') {
                switch (event.inputSource.targetRayMode) {
                case 'tracked-pointer':
                    this.attachTrackedPointerRayMode(event);
                    break;
                case 'gaze':
                    this.attachGazeMode(event);
                    break;
                case 'screen':
                    this.attachScreenRayMode(event);
                    break;
                default:
                    break;
                }
            }
        };

        const onInputSourcesChange = (event: XRInputSourceChangeEvent) => {};

        const onSessionEnd = (event: XRSessionEvent) => {
            this._session?.removeEventListener('select', onSessionEvent);
            this._session?.removeEventListener('selectstart', onSessionEvent);
            this._session?.removeEventListener('selectend', onSessionEvent);
            this._session?.removeEventListener('squeeze', onSessionEvent);
            this._session?.removeEventListener('squeezestart', onSessionEvent);
            this._session?.removeEventListener('squeezeend', onSessionEvent);
            this._session?.removeEventListener('end', onSessionEnd);
            this._session?.removeEventListener('inputsourceschange', onInputSourcesChange);

            if (!this._endSessionFlag) {
                arEvent.dispatchSessionUnexpectedEnded();
                this._session = null;
                xrSession = null;
            }
            this._endSessionFlag = false;
        };

        this._session?.addEventListener('select', onSessionEvent);
        this._session?.addEventListener('selectstart', onSessionEvent);
        this._session?.addEventListener('selectend', onSessionEvent);
        this._session?.addEventListener('squeeze', onSessionEvent);
        this._session?.addEventListener('squeezestart', onSessionEvent);
        this._session?.addEventListener('squeezeend', onSessionEvent);
        this._session?.addEventListener('end', onSessionEnd);
        this._session?.addEventListener('inputsourceschange', onInputSourcesChange);
    }

    private getTouchInit (worldPosition) {
        const outPos = new Vec3();
        this._camera?.worldToScreen(worldPosition, outPos);

        const touchInitDict: TouchInit = {
            identifier: 0,
            target: this._gl?.canvas as EventTarget,
            clientX: outPos.x,
            clientY: outPos.y,
            pageX: outPos.x,
            pageY: outPos.y,
            screenX: outPos.x,
            screenY: outPos.y,
            force: 1,
            radiusX: 1,
            radiusY: 1,
        };

        const touch = new Touch(touchInitDict);
        const touches: Touch[] = [touch];
        const eventInitDict: TouchEventInit = {
            touches,
            targetTouches: touches,
            changedTouches: touches,
        };
        return eventInitDict;
    }

    private attachScreenRayMode (event: XRInputSourceEvent) {
        const source = event.inputSource;
        if (!this._immersiveRefSpace) {
            return;
        }
        const targetRayPose = event.frame.getPose(source.targetRaySpace, this._immersiveRefSpace);
        if (!targetRayPose) {
            return;
        }
        this._inputSource = source;
        this._targetRayPose = targetRayPose;
        const eventInitDict = this.getTouchInit(targetRayPose.transform.position);
        switch (event.type) {
        case 'selectstart':
            this._gl?.canvas.dispatchEvent(new TouchEvent('touchstart', eventInitDict));
            break;
        case 'selectend':
            this._gl?.canvas.dispatchEvent(new TouchEvent('touchend', eventInitDict));
            this._inputSource = null;
            break;
        default:
            break;
        }
    }

    private attachGazeMode (event: XRInputSourceEvent) {

    }

    private attachTrackedPointerRayMode (event: XRInputSourceEvent) {

    }

    public getAPIState () {
        return this._session ? ARAPI.WebXR : -1;
    }

    // camera & background
    public getCameraPose () {
        let poseArray = [
            0, 0, 0,
            0, 0, 0, 1,
        ];
        if (this._cameraPose) {
            const pos = this._cameraPose.transform.position;
            const rot = this._cameraPose.transform.orientation;
            poseArray = [
                pos.x, pos.y, pos.z,
                rot.x, rot.y, rot.z, rot.w,
            ];
        }
        return poseArray;
    }
    public getCameraViewMatrix () {}
    public getCameraProjectionMatrix () {
        if (this._cameraPose) {
            return this._cameraPose.views[0].projectionMatrix;
        }
        return null;
    }
    public getViewport () {
        if (this._cameraPose && this._baseLayer) {
            this._viewport = this._baseLayer.getViewport(this._cameraPose.views[0]);
        }
        return this._viewport;
    }

    public getViewports () {
        if (this._cameraPose && this._baseLayer) {
            return this._cameraPose.views;
        }
        return null;
    }

    public getViewportLength () {
        if (this._cameraPose && this._baseLayer) {
            return this._cameraPose.views.length;
        }
        return 0;
    }

    public getViewportbyIndex (index: number) {
        if (this._cameraPose && this._baseLayer) {
            return this._baseLayer.getViewport(this._cameraPose.views[index]);
        }
        return null;
    }

    public getView (type: string) {
        if (this._cameraPose) {
            for (const view of this._cameraPose.views) {
                if (view.eye === type) {
                    return view;
                }
            }
        }
        return null;
    }

    public getXRLayerFrameBuffer () {
        return this._framebuffer;
    }
    public updateRenderState (gl: WebGLRenderingContext | WebGL2RenderingContext) {
        this._gl = gl;
        if (this._session) {
            const layer = new XRWebGLLayer(this._session, gl, {
                alpha: true,
                antialias: false,
                depth: true,
                framebufferScaleFactor: 1,
                ignoreDepthValues: false,
                stencil: true,
            });

            if (layer.fixedFoveation !== undefined) {
                layer.fixedFoveation = 1;
            }
            this._session?.updateRenderState({ baseLayer: layer });
        }
    }
}
