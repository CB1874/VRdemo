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

import { _decorator, ccenum, math, Camera, Node, Prefab, ImageAsset, Size, Vec3, DirectionalLight } from 'cc';
import { ARTrackingBase } from '../../tracking/ar-tracking-base';
import { ARFaceBlendShapeType, ARTrackingType } from './ar-enum';
import { ARCameraMgr } from '../../ar-camera';

const { ccclass, property } = _decorator;

export enum ARAPI {
    ARKit,
    ARCore,
    AREngine,
    WebXR,
    SpacesXR,
    AROpenCV,
    MindAR
}

export enum ARTrackingState {
    TRACKING,
    PAUSED,
    STOPPED,
    STARTING,
    STARTED
}

export enum ARRayCastMode {
    RAYCAST_ANCHOR = 1,
    RAYCAST_PLANE_EXTENT = 1 << 1,
    RAYCAST_PLANE_POLYGON = 1 << 2,
    RAYCAST_MESH = 1 << 3,
}

export enum FeatureType {
    None = 0,
    CameraDevice = 1 << 0,
    LightingEstimation = 1 << 1,
    Anchor = 1 << 2,
    PlaneDetection = 1 << 3,
    SceneMesh = 1 << 4,
    ImageTracking = 1 << 5,
    ObjectTracking = 1 << 6,
    FaceTracking = 1 << 7,
    EnableDemotion = 1 << 8,
}

export enum ARLightingMode {
    NO_HDR = 1,
    HDR = 2
}

export interface ARPose {
    position: math.Vec3;
    rotation: math.Quat;
}

export interface ARAnchor {
    id: number;
    pose: ARPose;
    trackingState?: ARTrackingState;
}

export interface ARFeatureData {
    type: FeatureType;
    enable: boolean;
    enableNativeFallBack?: boolean;
    enableWebFallBack?: boolean;
}

export interface ARLibImageData {
    name: string;
    assetPath: string;
    widthInMeters: number;
    heightInMeters: number;
}

export interface ImageTrackingConfig extends ARFeatureData {
    arLibImages: ARLibImageData[];
    maxTrackingNumber: number;
}

export interface PlaneDetectionConfig extends ARFeatureData {
    direction: ARPlaneDetectionMode;
    planePrefab: Prefab | null;
    trackingQualityCondition: TrackingQuality;
    usePlaneShape: boolean;
}

export interface WorldMeshConfig extends ARFeatureData {
    normals: boolean,
    visualizer: Prefab | null,
}

export interface CameraConfig extends ARFeatureData {
    autoFocus: boolean;
    camera: Camera | null;
    visibility: number | null;
}

export interface LightingEstimationConfig extends ARFeatureData {
    mainLight: DirectionalLight | null;
    lightingMode: ARLightingMode;
}

export interface ARFaceBlendShape {
    type: ARFaceBlendShapeType;
    value: number;
}

export interface FaceTrackingConfig extends ARFeatureData {
    trackingMode: number;
    maxFaceNumber: number;
    trackingNodeList: any[];
}

export enum ARPlaneDetectionMode {
    Horizontal_Upward = 1 << 0,
    Horizontal_Downward = 1 << 1,
    Vertical = 1 << 2,
    All = Horizontal_Upward | Horizontal_Downward | Vertical
}
ccenum(ARPlaneDetectionMode);

export enum TrackingQuality {
    No_Tracking = 0,
    Poor_Quality,
    Tracking_Normal,
}
ccenum(TrackingQuality);

export interface ARPlane extends ARAnchor {
    type: ARPlaneDetectionMode;
    extent: Size | undefined;
}
export interface ARImage extends ARAnchor {
    libIndex: number;
    extent: Size | undefined;
}

export interface ARMesh extends ARAnchor {
    vertices: number[];
    indices: number[];
    verticesArray?: Float32Array;
    indicesArray?: Uint32Array;
}

export interface ARObject extends ARAnchor {
    libIndex: number;
    extent: Vec3;
    scale: Vec3;
}

export interface ARFace extends ARAnchor {
    blendShapes: ARFaceBlendShape[];
}

export interface FaceBlendShapeEventParam {
    faceId?: number;
    pose?: ARPose;
    shapeIndex: number;
    scale: number;
    weight: number;
}

export interface FeatureEventParam{
    ft: ARTrackingType;
    uuid: string;
    canUse: boolean;
    tracking?: ARTrackingBase;
    enableNativeFallBack?: boolean;
    enableWebFallBack?: boolean;
}

export interface CameraFeatureEventParam extends FeatureEventParam {
    camera: ARCameraMgr;
    visibility: number | null;
}

export interface LightingFeatureEventParam extends FeatureEventParam {
    mainLight: DirectionalLight | null;
    lightingMode: ARLightingMode;
}

export interface PlaneFeatureEventParam extends FeatureEventParam {
    direction: ARPlaneDetectionMode;
}

export interface ARImageAsset {
    imageAsset: ImageAsset;
    widthInMeters: number;
    heightInMeters: number;
}

export interface ImageFeatureEventParam extends FeatureEventParam {
    images: Array<ARImageAsset>;
}

export interface MeshFeatureEventParam extends FeatureEventParam {
    visualizer: Prefab | null;
}

export interface ARMatchData {
    data: ARActionData;
    uuid: string;
}

export interface ARActionData extends ARAnchor {
    trackingNode?: Node;
    trackableRootNode?: Node;
    trackableNode?: Node;
    trackablePose?: ARPose;
    trackableChildNode?: Node;
    closeTracking?: boolean;
    resetWhenLoss?: boolean;
    replaceVisualizer?: Prefab | null;
    replicator?: boolean;
    extent?: Size;
}

export interface ARPlaneActionData extends ARActionData {
    type: ARPlaneDetectionMode;
}

export interface ARImageActionData extends ARActionData {
    libIndex: number;
}

export interface ARMeshActionData extends ARActionData {
    vertices: number[];
    indices: number[];
}
export interface ActionBlendShapesData extends ARActionData {
    blendShapes: ARFaceBlendShape[];
}

export class TrackEvent extends Event {
    id?: number;
    pose?: ARPose;
    trackingState?: ARTrackingState;
}

export class PlaneTrackEvent extends TrackEvent {
    extent?: Size;
    anchorType?: ARPlaneDetectionMode;
}

export class ImageTrackEvent extends TrackEvent {
    extent?: Size;
    libIndex?: number;
}

export class MeshTrackEvent extends TrackEvent {
    vertices?: number[];
    indices?: number[];
}
