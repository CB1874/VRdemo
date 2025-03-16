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

// Definitions by sites:
//  https://www.w3.org/TR/webxr/
//  https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
//  https://www.w3.org/immersive-web/
//  https://github.com/immersive-web
//  https://github.com/DefinitelyTyped/DefinitelyTyped

interface Navigator {
    readonly xr?: XRSystem | undefined;
}

type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar';

type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';

type XREnvironmentBlendMode = 'opaque' | 'additive' | 'alpha-blend';

type XRVisibilityState = 'visible' | 'visible-blurred' | 'hidden';

type XRHandedness = 'none' | 'left' | 'right';

type XRTargetRayMode = 'gaze' | 'tracked-pointer' | 'screen';

type XREye = 'none' | 'left' | 'right';

type XRDOMOverlayType = 'screen' | 'floating' | 'head-locked';
type XRDOMOverlayState = {
    type: XRDOMOverlayType | null;
};

type XRReflectionFormat = 'srgba8' | 'rgba16f';

type XRLightProbeInit = {
    reflectionFormat: XRReflectionFormat;
};
type XREventHandler = (callback: any) => void;
interface XRLightProbe extends EventTarget {
    readonly probeSpace: XRSpace;
    onreflectionchange: XREventHandler;
}

type XRDOMOverlayInit = {
    root: Element;
};

type XRFrameRequestCallback = (time: DOMHighResTimeStamp, frame: XRFrame) => void;

interface XRSystemDeviceChangeEvent extends Event {
    type: 'devicechange';
}

interface XRSystemDeviceChangeEventHandler {
    (event: XRSystemDeviceChangeEvent): any;
}

interface XRSessionGrant {
    mode: XRSessionMode;
}

interface XRSystemSessionGrantedEvent extends Event {
    type: 'sessiongranted';
    session: XRSessionGrant;
}

interface XRSystemSessionGrantedEventHandler {
    (event: XRSystemSessionGrantedEvent): any;
}

interface XRSystemEventMap {
    devicechange: XRSystemDeviceChangeEvent;
    // Session Grant events are an Meta Oculus Browser extension
    sessiongranted: XRSystemSessionGrantedEvent;
}

interface XRSystem extends EventTarget {
    requestSession(mode: XRSessionMode, options?: XRSessionInit): Promise<XRSession>;

    isSessionSupported(mode: XRSessionMode): Promise<boolean>;

    ondevicechange: XRSystemDeviceChangeEventHandler | null;
    onsessiongranted: XRSystemSessionGrantedEventHandler | null;

    addEventListener<K extends keyof XRSystemEventMap>(
        type: K,
        listener: (this: XRSystem, ev: XRSystemEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof XRSystemEventMap>(
        type: K,
        listener: (this: XRSystem, ev: XRSystemEventMap[K]) => any,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
}

interface XRViewport {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface XRSpace extends EventTarget {}

interface XRRenderStateInit {
    baseLayer?: XRWebGLLayer | undefined;
    depthFar?: number | undefined;
    depthNear?: number | undefined;
    inlineVerticalFieldOfView?: number | undefined;
    layers?: XRLayer[] | undefined;
}

interface XRRenderState {
    readonly baseLayer?: XRWebGLLayer | undefined;
    readonly depthFar: number;
    readonly depthNear: number;
    readonly inlineVerticalFieldOfView?: number | undefined;
    readonly layers?: XRLayer[] | undefined;
}

interface XRReferenceSpaceEventInit extends EventInit {
    referenceSpace?: XRReferenceSpace | undefined;
    transform?: XRRigidTransform | undefined;
}

interface XRReferenceSpaceEvent extends Event {
    readonly type: 'reset';
    readonly referenceSpace: XRReferenceSpace;
    readonly transform?: XRRigidTransform | undefined;
}

declare class XRReferenceSpaceEvent implements XRReferenceSpaceEvent {
    constructor(type: 'reset', eventInitDict?: XRReferenceSpaceEventInit);
}

interface XRReferenceSpaceEventHandler {
    (event: XRReferenceSpaceEvent): any;
}

interface XRReferenceSpaceEventMap {
    reset: XRReferenceSpaceEvent;
}

interface XRReferenceSpace extends XRSpace {
    getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace;
    onreset: XRReferenceSpaceEventHandler;

    addEventListener<K extends keyof XRReferenceSpaceEventMap>(
        type: K,
        listener: (this: XRReferenceSpace, ev: XRReferenceSpaceEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof XRReferenceSpaceEventMap>(
        type: K,
        listener: (this: XRReferenceSpace, ev: XRReferenceSpaceEventMap[K]) => any,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
}

interface XRBoundedReferenceSpace extends XRReferenceSpace {
    readonly boundsGeometry: DOMPointReadOnly[];
}
interface XRInputSource {
    readonly handedness: XRHandedness;
    readonly targetRayMode: XRTargetRayMode;
    readonly targetRaySpace: XRSpace;
    readonly gripSpace?: XRSpace | undefined;
    readonly gamepad?: Gamepad | undefined;
    readonly profiles: string[];
    readonly hand?: XRHand | undefined;
}

interface XRInputSourceArray {
    [Symbol.iterator](): IterableIterator<XRInputSource>;
    [n: number]: XRInputSource;

    length: number;

    entries(): IterableIterator<[number, XRInputSource]>;
    keys(): IterableIterator<number>;
    values(): IterableIterator<XRInputSource>;

    forEach(callbackfn: (value: XRInputSource, index: number, array: XRInputSource[]) => void, thisArg?: any): void;
}

interface XRPose {
    readonly transform: XRRigidTransform;
    readonly emulatedPosition: boolean;
    readonly linearVelocity?: DOMPointReadOnly;
    readonly angularVelocity?: DOMPointReadOnly;
}

interface XRWorldInformation {
    detectedPlanes?: XRPlaneSet;
}

interface XRFrame {
    readonly session: XRSession;
    readonly predictedDisplayTime: DOMHighResTimeStamp;

    fillPoses?(spaces: XRSpace[], baseSpace: XRSpace, transforms: Float32Array): boolean;

    getPose(space: XRSpace, baseSpace: XRSpace): XRPose | undefined;

    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | undefined;

    getHitTestResults(hitTestSource: XRHitTestSource): XRHitTestResult[];
    getHitTestResultsForTransientInput(hitTestSource: XRTransientInputHitTestSource): XRTransientInputHitTestResult[];

    // Anchors
    trackedAnchors?: XRAnchorSet | undefined;
    createAnchor?: (pose: XRRigidTransform, space: XRSpace) => Promise<XRAnchor> | undefined;

    // World geometries. DEPRECATED
    worldInformation?: XRWorldInformation;
    detectedPlanes?: XRPlaneSet;

    // Hand tracking
    getJointPose?(joint: XRJointSpace, baseSpace: XRSpace): XRJointPose;
    fillJointRadii?(jointSpaces: XRJointSpace[], radii: Float32Array): boolean;
    // Image tracking
    getImageTrackingResults?(): Array<XRImageTrackingResult>;
    getLightEstimate(xrLightProbe: XRLightProbe): XRLightEstimate;

}

type XRInputSourceEventType = 'select' | 'selectend' | 'selectstart' | 'squeeze' | 'squeezeend' | 'squeezestart';

interface XRInputSourceEventInit extends EventInit {
    frame?: XRFrame | undefined;
    inputSource?: XRInputSource | undefined;
}

declare class XRInputSourceEvent extends Event {
    readonly type: XRInputSourceEventType;
    readonly frame: XRFrame;
    readonly inputSource: XRInputSource;

    constructor(type: XRInputSourceEventType, eventInitDict?: XRInputSourceEventInit);
}

interface XRInputSourceEventHandler {
    (evt: XRInputSourceEvent): any;
}

type XRSessionEventType = 'end' | 'visibilitychange' | 'frameratechange';

interface XRSessionEventInit extends EventInit {
    session: XRSession;
}

declare class XRSessionEvent extends Event {
    readonly session: XRSession;
    constructor(type: XRSessionEventType, eventInitDict?: XRSessionEventInit);
}

interface XRSessionEventHandler {
    (evt: XRSessionEvent): any;
}

interface XRSessionInit {
    optionalFeatures?: string[];
    requiredFeatures?: string[];
    trackedImages?: XRTrackedImageInit[];
    domOverlay?: XRDOMOverlayInit;
}

interface XRSessionEventMap {
    inputsourceschange: XRInputSourceChangeEvent;
    end: XRSessionEvent;
    visibilitychange: XRSessionEvent;
    frameratechange: XRSessionEvent;
    select: XRInputSourceEvent;
    selectstart: XRInputSourceEvent;
    selectend: XRInputSourceEvent;
    squeeze: XRInputSourceEvent;
    squeezestart: XRInputSourceEvent;
    squeezeend: XRInputSourceEvent;
}

interface XRSession extends EventTarget {
    readonly inputSources: XRInputSourceArray;
    readonly renderState: XRRenderState;
    readonly environmentBlendMode: XREnvironmentBlendMode;
    readonly visibilityState: XRVisibilityState;
    readonly frameRate?: number | undefined;
    readonly supportedFrameRates?: Float32Array | undefined;
    mode?: XRSessionMode;
    isImmersive?: boolean;

    readonly preferredReflectionFormat?: XRReflectionFormat;
    readonly domOverlayState?: XRDOMOverlayState;
    cancelAnimationFrame(id: number): void;
    end(): Promise<void>;

    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace | XRBoundedReferenceSpace>;
    requestLightProbe(options?: XRLightProbeInit): Promise<XRLightProbe>;

    updateRenderState(renderStateInit?: XRRenderStateInit): Promise<void>;

    updateTargetFrameRate(rate: number): Promise<void>;

    requestHitTestSource?: (options: XRHitTestOptionsInit) => Promise<XRHitTestSource> | undefined;
    requestHitTestSourceForTransientInput?: (options: XRTransientInputHitTestOptionsInit) => Promise<XRTransientInputHitTestSource> | undefined;

    // Legacy
    requestHitTest?: (ray: XRRay, referenceSpace: XRReferenceSpace) => Promise<XRHitResult[]> | undefined;

    updateWorldTrackingState?: (options: {planeDetectionState?: { enabled: boolean } | undefined;}) => void | undefined;

    // image tracking
    getTrackedImageScores?(): Promise<XRImageTrackingScore[]>;

    onend: XRSessionEventHandler;
    oninputsourceschange: XRInputSourceChangeEventHandler;
    onselect: XRInputSourceEventHandler;
    onselectstart: XRInputSourceEventHandler;
    onselectend: XRInputSourceEventHandler;
    onsqueeze: XRInputSourceEventHandler;
    onsqueezestart: XRInputSourceEventHandler;
    onsqueezeend: XRInputSourceEventHandler;
    onvisibilitychange: XRSessionEventHandler;
    onframeratechange: XRSessionEventHandler;

    addEventListener<K extends keyof XRSessionEventMap>(
        type: K,
        listener: (this: XRSession, ev: XRSessionEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions,
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions,
    ): void;
    removeEventListener<K extends keyof XRSessionEventMap>(
        type: K,
        listener: (this: XRSession, ev: XRSessionEventMap[K]) => any,
        options?: boolean | EventListenerOptions,
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions,
    ): void;
}

interface XRViewerPose extends XRPose {
    readonly views: ReadonlyArray<XRView>;
}

declare class XRRigidTransform {
    readonly position: DOMPointReadOnly;
    readonly orientation: DOMPointReadOnly;
    readonly matrix: Float32Array;
    readonly inverse: XRRigidTransform;

    constructor(position?: DOMPointInit, direction?: DOMPointInit);
}

interface XRView {
    readonly eye: XREye;
    readonly projectionMatrix: Float32Array;
    readonly transform: XRRigidTransform;
    readonly recommendedViewportScale?: number | undefined;
    requestViewportScale(scale: number): void;
}

interface XRInputSourceChangeEvent extends XRSessionEvent {
    readonly removed: ReadonlyArray<XRInputSource>;
    readonly added: ReadonlyArray<XRInputSource>;
}

interface XRInputSourceChangeEventHandler {
    (evt: XRInputSourceChangeEvent): any;
}

// WebXR Anchors
type XRAnchorSet = Set<XRAnchor>;

interface XRAnchor {
    anchorSpace: XRSpace;
    delete(): void;
}

// WebXR HitTest
declare class XRRay {
    readonly origin: DOMPointReadOnly;
    readonly direction: DOMPointReadOnly;
    readonly matrix: Float32Array;

    constructor(transformOrOrigin?: XRRigidTransform | DOMPointInit, direction?: DOMPointInit);
}

type XRHitTestTrackableType = 'point' | 'plane' | 'mesh';

interface XRTransientInputHitTestResult {
    readonly inputSource: XRInputSource;
    readonly results: ReadonlyArray<XRHitTestResult>;
}

interface XRHitTestResult {
    getPose(baseSpace: XRSpace): XRPose | undefined;
    // When anchor system is enabled
    createAnchor?: (pose: XRRigidTransform) => Promise<XRAnchor> | undefined;
}

interface XRHitTestSource {
    cancel(): void;
}

interface XRTransientInputHitTestSource {
    cancel(): void;
}

interface XRHitTestOptionsInit {
    space: XRSpace;
    entityTypes?: XRHitTestTrackableType[] | undefined;
    offsetRay?: XRRay | undefined;
}

interface XRTransientInputHitTestOptionsInit {
    profile: string;
    entityTypes?: XRHitTestTrackableType[] | undefined;
    offsetRay?: XRRay | undefined;
}

// Legacy
interface XRHitResult {
    hitMatrix: Float32Array;
}

// WebXR Plane detection
type XRPlaneSet = Set<XRPlane>;

type XRPlaneOrientation = 'Horizontal' | 'Vertical';

interface XRPlane {
    orientation: XRPlaneOrientation;
    planeSpace: XRSpace;
    polygon: DOMPointReadOnly[];
    lastChangedTime: number;
}

// WebXR Image
type XRImageTrackingState = 'tracked' | 'emulated';

type XRImageTrackingScore = 'untrackable' | 'trackable';

interface XRTrackedImageInit {
    image: ImageBitmap;
    widthInMeters: number;
}

interface XRImageTrackingResult {
    readonly imageSpace: XRSpace;
    readonly index: number;
    readonly trackingState: XRImageTrackingState;
    readonly measuredWidthInMeters: number;
}

// WebXR Light Estimate
interface XRLightEstimate {
    readonly sphericalHarmonicsCoefficients: Float32Array;
    readonly primaryLightDirection: DOMPointReadOnly;
    readonly primaryLightIntensity: DOMPointReadOnly;
}

// WebXR Hand Tracking
type XRHandJoint =
    | 'wrist'
    | 'thumb-metacarpal'
    | 'thumb-phalanx-proximal'
    | 'thumb-phalanx-distal'
    | 'thumb-tip'
    | 'index-finger-metacarpal'
    | 'index-finger-phalanx-proximal'
    | 'index-finger-phalanx-intermediate'
    | 'index-finger-phalanx-distal'
    | 'index-finger-tip'
    | 'middle-finger-metacarpal'
    | 'middle-finger-phalanx-proximal'
    | 'middle-finger-phalanx-intermediate'
    | 'middle-finger-phalanx-distal'
    | 'middle-finger-tip'
    | 'ring-finger-metacarpal'
    | 'ring-finger-phalanx-proximal'
    | 'ring-finger-phalanx-intermediate'
    | 'ring-finger-phalanx-distal'
    | 'ring-finger-tip'
    | 'pinky-finger-metacarpal'
    | 'pinky-finger-phalanx-proximal'
    | 'pinky-finger-phalanx-intermediate'
    | 'pinky-finger-phalanx-distal'
    | 'pinky-finger-tip';

interface XRJointSpace extends XRSpace {
    readonly jointName: XRHandJoint;
}

interface XRJointPose extends XRPose {
    readonly radius: number | undefined;
}

interface XRHand extends Map<number, XRJointSpace> {
    readonly WRIST: number;

    readonly THUMB_METACARPAL: number;
    readonly THUMB_PHALANX_PROXIMAL: number;
    readonly THUMB_PHALANX_DISTAL: number;
    readonly THUMB_PHALANX_TIP: number;

    readonly INDEX_METACARPAL: number;
    readonly INDEX_PHALANX_PROXIMAL: number;
    readonly INDEX_PHALANX_INTERMEDIATE: number;
    readonly INDEX_PHALANX_DISTAL: number;
    readonly INDEX_PHALANX_TIP: number;

    readonly MIDDLE_METACARPAL: number;
    readonly MIDDLE_PHALANX_PROXIMAL: number;
    readonly MIDDLE_PHALANX_INTERMEDIATE: number;
    readonly MIDDLE_PHALANX_DISTAL: number;
    readonly MIDDLE_PHALANX_TIP: number;

    readonly RING_METACARPAL: number;
    readonly RING_PHALANX_PROXIMAL: number;
    readonly RING_PHALANX_INTERMEDIATE: number;
    readonly RING_PHALANX_DISTAL: number;
    readonly RING_PHALANX_TIP: number;

    readonly LITTLE_METACARPAL: number;
    readonly LITTLE_PHALANX_PROXIMAL: number;
    readonly LITTLE_PHALANX_INTERMEDIATE: number;
    readonly LITTLE_PHALANX_DISTAL: number;
    readonly LITTLE_PHALANX_TIP: number;
}

// WebXR Layers
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface XRLayer extends EventTarget {}

declare abstract class XRLayer implements XRLayer {}

interface XRWebGLLayerInit {
    antialias?: boolean | undefined;
    depth?: boolean | undefined;
    stencil?: boolean | undefined;
    alpha?: boolean | undefined;
    ignoreDepthValues?: boolean | undefined;
    framebufferScaleFactor?: number | undefined;
}

declare class XRWebGLLayer extends XRLayer {
    static getNativeFramebufferScaleFactor(session: XRSession): number;

    constructor(
        session: XRSession,
        context: WebGLRenderingContext | WebGL2RenderingContext,
        layerInit?: XRWebGLLayerInit,
    );

    readonly antialias: boolean;
    readonly ignoreDepthValues: boolean;
    readonly framebuffer: WebGLFramebuffer;
    readonly framebufferWidth: number;
    readonly framebufferHeight: number;
    fixedFoveation?: number | undefined;

    getViewport(view: XRView): XRViewport | undefined;
}
