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

import { director, game, geometry, RenderPipeline, sys, Vec2, WebGL2Device, gfx, Vec3, Mat4, view } from 'cc';
import { WebXR } from './webxr';
import { ARDevice } from '../ar-base/ar-device-base';
import * as features from '../ar-base/ar-features';
import * as handlers from './ar-handler';
import { ARWebXRHandlerAnchor, ARWebXRHandlerPlaneDetection } from './ar-handler';
import { ARAnchor, ARAPI, ARFeatureData, ARRayCastMode, ARTrackingState, FeatureType } from '../../../../ar/component/framework/utils/ar-defines';
import { ARFeature } from '../ar-base/ar-feature-base';
import { XRSessionModeControllerType } from '../../../../ar/component/framework/utils/ar-enum';
import { HMDCtrl } from '../hmd-ctrl';
import { arEvent, AREventType } from '../../../../ar/component/framework/utils/ar-event';

export class WebXREngineData {
    public static mainWindowViewport: Vec2 | null = null;
    public static initFramebuffer: WebGLFramebuffer | undefined = undefined;
}

export class WebXRDevice extends ARDevice {
    private _webXR: WebXR | null = null;
    get WebXRObj () {
        return this._webXR;
    }

    get HandlerPrefix (): string {
        return 'ARWebXRHandler';
    }

    private _lastTime = 0;
    private _xrWindowSetFlag = false;
    private _projectionMatrixSetFlag = false;
    private _oldCameraFlag = -1;
    private _oldInlinePosition: Vec3 | null = null;
    private _oldInlineRotation: Vec3 | null = null;

    public create () {
        if (!this._webXR) {
            this._webXR = new WebXR();
            arEvent.on(AREventType.SESSION_UNEXPECTED_ENDED, this._onUnexpectedEnd);

            const root = director?.root;
            if (!WebXREngineData.mainWindowViewport && root?.mainWindow) {
                WebXREngineData.mainWindowViewport = new Vec2(root.mainWindow.width, root.mainWindow.height);
            }
            if (WebXREngineData.initFramebuffer === undefined) {
                const webGL2FBO = root?.mainWindow?.framebuffer as any;
                WebXREngineData.initFramebuffer = webGL2FBO?.gpuFramebuffer.glFramebuffer;
            }

            view.on('canvas-resize', this._windowChange);
        }
    }

    private _onUnexpectedEnd () {
        const root = director?.root;
        const webGL2FBO = root?.mainWindow?.framebuffer as any;
        if (webGL2FBO) {
            webGL2FBO.gpuFramebuffer.glFramebuffer = WebXREngineData.initFramebuffer;
        }
        if (WebXREngineData.mainWindowViewport) {
            root?.mainWindow?.resize(WebXREngineData.mainWindowViewport.x, WebXREngineData.mainWindowViewport.y);
        }
        game.resume();
        const promise = game.restart();
    }

    private _windowChange () {
        const root = director?.root;
        if (root?.mainWindow) {
            WebXREngineData.mainWindowViewport = new Vec2(root.mainWindow.width, root.mainWindow.height);
        }
    }

    public checkSupported (mode: XRSessionModeControllerType): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._webXR?.isWebXRSupportedAsync().then((isSupported) => {
                if (isSupported) {
                    resolve(true);
                } else {
                    console.warn('sorry, your browser does not support WebXR.');
                    reject(new Error('sorry, your browser does not support WebXR.'));
                }
            });
        }).then((v) => {
            let m: XRSessionMode = 'inline';
            if ((mode & XRSessionModeControllerType.IMMERSIVE_AR) === XRSessionModeControllerType.IMMERSIVE_AR) {
                m = 'immersive-ar';
            } else if ((mode & XRSessionModeControllerType.IMMERSIVE_VR) === XRSessionModeControllerType.IMMERSIVE_VR) {
                m = 'immersive-vr';
            } else if ((mode & XRSessionModeControllerType.AUTO) === XRSessionModeControllerType.AUTO) {
                m = 'inline';
                if (sys.isMobile) {
                    m = 'immersive-ar';
                } else if (sys.isBrowser) {
                    m = 'immersive-vr';
                }
            }
            return this._webXR?.isSessionSupportedAsync(m);
        }).then((v) => {
            if (!v) {
                if ((mode & XRSessionModeControllerType.AUTO) === XRSessionModeControllerType.AUTO) {
                    return this._webXR?.isSessionSupportedAsync('inline');
                } else {
                    throw new Error(`not support ${this.getSessionMode()} mode`);
                }
            }
            return true;
        }).then((v) => {
            if (!v) {
                throw new Error('not support inline mode !');
            }
            return true;
        })
            .catch(() => false);
    }

    public init (mode: XRSessionMode, featuresDataset: ARFeatureData[]): Promise<boolean> {
        this._xrWindowSetFlag = false;
        this._featuresDataset = featuresDataset;
        this._webXR?.setSessionMode(mode);
        globalThis.__globalXR.isWebXR = true;
        globalThis.__globalXR.isWebXRInline = mode === 'inline';
        return new Promise<boolean>((resolve, reject) => {
            if (this._webXR?.getSessionMode() === 'immersive-ar') {
                this.createFeatures(featuresDataset);
                this.createHandlers();
                this.initFeatures(featuresDataset);
            }
            resolve(true);
        })
            .then((v) => this.attachFeatureSessionInit())
            .then((v) => {
                if (!v) {
                    throw new Error('webxr attach feature session init failed !');
                }
                this._webXR?.frameLoop((t: number, frame) => {
                    const dt = t - this._lastTime;
                    this.initXRWindow();
                    game.pause();
                    director.tick(dt / 1000);
                    this._updateProjectionMatrix();

                    this._featuresMap.forEach((feature) => {
                        const handler = feature.getHandler();
                        if (this._webXR && handler) {
                            handler.process(frame, this._webXR.getImmersiveRefSpace());
                        }
                    });
                    this._lastTime = t;
                });

                return this._webXR?.initializeSession(this._featureConfigMask);
            })
            .then((v) => {
                if (!v) {
                    throw new Error('webxr init session failed !');
                }

                if (this._webXR?.getSessionMode() === 'immersive-ar') {
                    this.checkFeaturesSupport(this._webXR.getSupportMask());
                    globalThis.__globalXR.ar = this;
                } else {
                    globalThis.__globalXR.ar = null;
                }
                this.initRenderState();
                return true;
            })
            .catch(() => false);
    }

    private attachFeatureSessionInit (): Promise<boolean> {
        const promises: Promise<XRSessionInit>[] = [];
        this._featuresMap.forEach((feature) => {
            const handler = feature.getHandler();
            if (handler) {
                promises.push((handler as any).attachFeatureSessionInit());
            }
        });
        return Promise.all(promises).then((sessionInits) => {
            const xrSessionInit: XRSessionInit = {
                requiredFeatures: [],
                optionalFeatures: [],
            };
            for (let index = 0; index < sessionInits.length; index++) {
                const element = sessionInits[index];
                if (element.optionalFeatures && element.optionalFeatures.length > 0) {
                    xrSessionInit.optionalFeatures = xrSessionInit.optionalFeatures?.concat([...element.optionalFeatures]);
                }
                if (element.trackedImages && element.trackedImages.length > 0) {
                    if (!xrSessionInit.trackedImages) {
                        xrSessionInit.trackedImages = [];
                    }
                    xrSessionInit.trackedImages = xrSessionInit.trackedImages.concat([...element.trackedImages]);
                }
            }
            xrSessionInit.requiredFeatures = ['local'];
            this._webXR?.setXRSessionInit(xrSessionInit);
            return true;
        }).catch(() => Promise.resolve(false));
    }

    private initRenderState () {
        const root = director?.root;
        const pipeline = root?.pipeline as RenderPipeline;
        const device = pipeline.device;
        const { gl } = device as WebGL2Device;
        this._webXR?.updateRenderState(gl);
    }

    private initXRWindow () {
        if (this._xrWindowSetFlag) return;

        const root = director?.root;
        if (this._webXR?.getSessionMode() === 'inline') {
            if (WebXREngineData.mainWindowViewport) {
                root?.mainWindow?.resize(WebXREngineData.mainWindowViewport.x, WebXREngineData.mainWindowViewport.y);
            }
            const cameraList = root?.cameraList;
            cameraList?.forEach((camera) => {
                camera.changeTargetWindow(root?.mainWindow);
            });
        } else {
            const xrgpuframebuffer = this._webXR?.getXRLayerFrameBuffer();
            const length = this._webXR?.getViewportLength();
            if (!xrgpuframebuffer || !length) {
                return;
            }

            let width = 0;
            let height = 0;
            for (let i = 0; length && i < length; i++) {
                const viewport = this._webXR?.getViewportbyIndex(i);
                if (!viewport) {
                    return;
                }
                width += viewport?.width;
                height = viewport?.height;
            }

            root?.mainWindow?.resize(width, height);
            const webGL2FBO = root?.mainWindow?.framebuffer as any;
            if (webGL2FBO) {
                webGL2FBO.gpuFramebuffer.glFramebuffer = xrgpuframebuffer;
            }

            if (this._webXR?.getSessionMode() === 'immersive-ar') {
                if (this._webXR && this._webXR.Camera) {
                    const arCamera = this._webXR.Camera.camera;
                    this._oldCameraFlag = arCamera.clearFlag;
                    arCamera.clearFlag = gfx.ClearFlagBit.NONE;
                }
            } else if (this._webXR?.getSessionMode() === 'immersive-vr') {
                const hmd = director.getScene()?.getComponentInChildren(HMDCtrl);
                if (hmd) {
                    globalThis.__globalXR.isWebXRPerEyeCamera = hmd.perEyeCamera;
                }
            }
        }

        this._xrWindowSetFlag = true;
    }

    private _updateProjectionMatrix () {
        if (globalThis.__globalXR.updateViewport) {
            if (globalThis.__globalXR.webXRMatProjs && globalThis.__globalXR.webXRMatProjs.length === 1) {
                globalThis.__globalXR.updateViewport = false;
            }
        }
        if (this._projectionMatrixSetFlag) {
            return;
        }

        const viewports = this._webXR?.getViewports();
        if (viewports) {
            const views = new Array<Mat4>(viewports.length);
            for (let i = 0; i < viewports.length; i++) {
                const matrix = viewports[i].projectionMatrix;
                const view = new Mat4();
                view.set(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5], matrix[6], matrix[7],
                    matrix[8], matrix[9], matrix[10], matrix[11], matrix[12], matrix[13], matrix[14], matrix[15]);
                views[i] = view;
            }
            globalThis.__globalXR.webXRMatProjs = views;
        } else {
            globalThis.__globalXR.webXRMatProjs = null;
        }
        globalThis.__globalXR.updateViewport = true;

        this._projectionMatrixSetFlag = true;
    }

    public start () {
        this._featuresMap.forEach((feature) => {
            feature.start();
        });
    }

    public stop () {
        this._featuresMap.forEach((feature) => {
            feature.stop();
        });
        this._xrWindowSetFlag = false;
        this._projectionMatrixSetFlag = false;
        this._webXR?.endSession();
        game.resume();
        globalThis.__globalXR.isWebXR = false;
        globalThis.__globalXR.webxrHmdPoseInfos = undefined;
        globalThis.__globalXR.webxrHandlePoseInfos = undefined;
        globalThis.__globalXR.webxrGamepadMap = undefined;
    }

    public update () {
        if (!this._webXR) {
            return;
        }
        this.updateHandlers();
    }

    get CameraId () {
        return this._webXR?.Camera?.node.uuid;
    }

    public getAPIState (): number {
        if (this._webXR) {
            return this._webXR.getAPIState();
        }
        return -1;
    }

    public checkSessionMode (mode: XRSessionMode): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._webXR?.isWebXRSupportedAsync().then((isSupported) => {
                if (isSupported) {
                    resolve(true);
                } else {
                    console.warn('sorry, your browser does not support WebXR.');
                    reject(new Error('sorry, your browser does not support WebXR.'));
                }
            });
        }).then((v) => {
            if (this._webXR) {
                return this._webXR?.isSessionSupportedAsync(mode);
            }
            return false;
        })
            .catch(() => false);
    }

    public setSessionMode (mode: XRSessionMode): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._webXR?.isWebXRSupportedAsync().then((isSupported) => {
                if (isSupported) {
                    resolve(true);
                } else {
                    console.warn('sorry, your browser does not support WebXR.');
                    reject(new Error('sorry, your browser does not support WebXR.'));
                }
            });
        }).then((v) => {
            if (this._webXR) {
                this.stop();
                if (this._webXR?.getSessionMode() === 'immersive-vr' && mode !== 'immersive-vr') {
                    this._webXR.stopSession();
                }

                if (this._webXR?.getSessionMode() === 'inline') {
                    // inline模式下,对于要切换为vr模式的,需保存inline下的坐标
                    const hmdNode = director.getScene()?.getComponentInChildren(HMDCtrl)?.node;
                    if (hmdNode) {
                        this._oldInlinePosition = hmdNode.position.clone();
                        this._oldInlineRotation = hmdNode.eulerAngles.clone();
                    }
                }

                if (mode === 'inline') {
                    if (this._webXR.Camera) {
                        // ar切回camera,重置为0
                        if (this._oldCameraFlag !== -1) {
                            this._webXR.Camera.camera.clearFlag = this._oldCameraFlag;
                        }
                        this._webXR.Camera.node.position = Vec3.ZERO;
                        this._webXR.Camera.node.eulerAngles = Vec3.ZERO;
                    } else {
                        // vr切回camera,置回原来的
                        // inline模式下,对于要切换为vr模式的,需保存inline下的坐标
                        const hmdNode = director.getScene()?.getComponentInChildren(HMDCtrl)?.node;
                        if (hmdNode) {
                            if (this._oldInlinePosition) {
                                hmdNode.position = this._oldInlinePosition;
                            }
                            if (this._oldInlineRotation) {
                                hmdNode.eulerAngles = this._oldInlineRotation;
                            }
                        }
                    }
                }
                this.clearHandlers();
                return this.init(mode, this._featuresDataset);
            }
            return false;
        }).then((v) => {
            this.start();
            return true;
        })
            .catch(() => false);
    }

    public getSessionMode (): XRSessionMode {
        if (this._webXR) {
            return this._webXR.getSessionMode();
        }
        return 'inline';
    }
    public getCheckSessionMode (): XRSessionMode {
        if (this._webXR) {
            return this._webXR.getCheckSessionMode();
        }
        return 'inline';
    }
    protected checkFeatureAvailable (featureClassName: string): boolean {
        return !!(features as any)[featureClassName];
    }

    protected createFeature (featureClassName: string): any {
        const featureInstance = new (features as any)[featureClassName](this);
        return featureInstance;
    }

    protected checkHandlerAvailable (handlerClassName: string): boolean {
        return !!(handlers as any)[handlerClassName];
    }

    protected createHandler (feature: ARFeature): any {
        const handlerClass = this.HandlerPrefix + FeatureType[feature.featureId];
        if (this.checkHandlerAvailable(handlerClass)) {
            const handler = new (handlers as any)[handlerClass](this, feature);
            return handler;
        }
        return null;
    }

    public isWebXR (): boolean {
        return this.getAPIState() === ARAPI.WebXR;
    }

    public screenHitTest (mode: ARRayCastMode, touchPoint?: Vec2): Promise<ARAnchor | null> {
        if ((mode & ARRayCastMode.RAYCAST_ANCHOR) === ARRayCastMode.RAYCAST_ANCHOR) {
            const feature = this.tryGetFeatureByType(FeatureType.Anchor);
            if (feature && this._webXR) {
                return (feature.getHandler() as ARWebXRHandlerAnchor).tryHitTest(this._webXR?._targetRayPose?.transform);
            }
        }
        if ((mode & ARRayCastMode.RAYCAST_PLANE_EXTENT) === ARRayCastMode.RAYCAST_PLANE_EXTENT
            || (mode & ARRayCastMode.RAYCAST_PLANE_POLYGON) === ARRayCastMode.RAYCAST_PLANE_POLYGON) {
            const feature = this.tryGetFeatureByType(FeatureType.PlaneDetection);
            if (feature && this._webXR) {
                return (feature.getHandler() as ARWebXRHandlerPlaneDetection).tryHitTest(this._webXR?._targetRayPose?.transform);
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Promise.resolve(null);
    }

    public worldHitTest (mode: ARRayCastMode, ray: geometry.Ray): Promise<ARAnchor | ARTrackingState> {
        return Promise.reject(new Error('webxr device Ray hit test is not supported '));
    }
}
