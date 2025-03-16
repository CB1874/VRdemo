import { _decorator, Component, Node, ccenum, Quat, Vec3 } from 'cc';
import { EDITOR } from 'cc/env';
import { XRSpacesFeatureManager } from '../xr-spaces-feature-manager';
import { XRSpacesRuntimeManager } from '../xr-spaces-runtime-manager';
import { XRHandData, XRHandJoint, XRHandType, XR_HAND_JOINT_COUNT_EXT } from './xr-hand';
import { XRHandTrackingManager } from './xr-hand-tracking-manager';
const { ccclass, menu, property } = _decorator;

@ccclass('cc.spaces.XRHandPoseDriver')
@menu('hidden:XR/Spaces/XRHandPoseDriver')
export class XRHandPoseDriver extends Component {
    @property({ type: XRHandType })
    private handType: XRHandType = XRHandType.HAND_LEFT;
    @property(Node)
    private handModel: Node | null = null;
    @property(Node)
    private rootPart: Node | null = null;
    @property(Node)
    private thumbMetacarpal: Node | null = null;
    @property(Node)
    private thumbProximal: Node | null = null;
    @property(Node)
    private thumbDistal: Node | null = null;
    @property(Node)
    private thumbTip: Node | null = null;
    @property(Node)
    private indexProximal: Node | null = null;
    @property(Node)
    private indexIntermediate: Node | null = null;
    @property(Node)
    private indexDistal: Node | null = null;
    @property(Node)
    private indexTip: Node | null = null;
    @property(Node)
    private middleProximal: Node | null = null;
    @property(Node)
    private middleIntermediate: Node | null = null;
    @property(Node)
    private middleDistal: Node | null = null;
    @property(Node)
    private middleTip: Node | null = null;
    @property(Node)
    private ringProximal: Node | null = null;
    @property(Node)
    private ringIntermediate: Node | null = null;
    @property(Node)
    private ringDistal: Node | null = null;
    @property(Node)
    private ringTip: Node | null = null;
    @property(Node)
    private pinkyMetacarpal: Node | null = null;
    @property(Node)
    private pinkyProximal: Node | null = null;
    @property(Node)
    private pinkyIntermediate: Node | null = null;
    @property(Node)
    private pinkyDistal: Node | null = null;
    @property(Node)
    private pinkyTip: Node | null = null;

    private _handTrackingManager: XRHandTrackingManager | null = null;

    private _handJointMap: Map<XRHandJoint, Node> = new Map();
    private _tempQuat: Quat = new Quat();

    start () {
        this._handTrackingManager = XRSpacesRuntimeManager.instance.getHandTrackingManager();

        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_THUMB_METACARPAL_EXT, this.thumbMetacarpal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_THUMB_PROXIMAL_EXT, this.thumbProximal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_THUMB_DISTAL_EXT, this.thumbDistal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_THUMB_TIP_EXT, this.thumbTip);

        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_INDEX_PROXIMAL_EXT, this.indexProximal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_INDEX_INTERMEDIATE_EXT, this.indexIntermediate);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_INDEX_DISTAL_EXT, this.indexDistal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_INDEX_TIP_EXT, this.indexTip);

        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_MIDDLE_PROXIMAL_EXT, this.middleProximal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_MIDDLE_INTERMEDIATE_EXT, this.middleIntermediate);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_MIDDLE_DISTAL_EXT, this.middleDistal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_MIDDLE_TIP_EXT, this.middleTip);

        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_RING_PROXIMAL_EXT, this.ringProximal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_RING_INTERMEDIATE_EXT, this.ringIntermediate);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_RING_DISTAL_EXT, this.ringDistal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_RING_TIP_EXT, this.ringTip);

        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_LITTLE_METACARPAL_EXT, this.pinkyMetacarpal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_LITTLE_PROXIMAL_EXT, this.pinkyProximal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_LITTLE_INTERMEDIATE_EXT, this.pinkyIntermediate);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_LITTLE_DISTAL_EXT, this.pinkyDistal);
        this._handJointMap.set(XRHandJoint.XR_HAND_JOINT_LITTLE_TIP_EXT, this.pinkyTip);
    }

    private printLog: boolean = true;
    private eulerYDegrees: number = 0;

    lateUpdate (deltaTime: number) {
        if (this._handTrackingManager && this._handTrackingManager.isRunning) {
            let handData: XRHandData | null = null;
            if (this.handType === XRHandType.HAND_LEFT) {
                handData = this._handTrackingManager.leftHandData;
            } else if (this.handType === XRHandType.HAND_RIGHT) {
                handData = this._handTrackingManager.rightHandData;
            }

            // this.handModel.active = handData.isTracked;
            {
                // TODO: DEBUG TEST
                if (EDITOR) {
                    handData.useTestData();
                    if (this.printLog) {
                        this.printLog = false;
                        for (let idx = 0; idx < 26; idx++) {
                            let eulerAngles: Vec3 = new Vec3();
                            Quat.toEuler(eulerAngles, handData.joints[idx].orientation);
                            console.log(idx + ',' + eulerAngles.toString());
                        }
                    }
                }

                //this.rootPart.position = handData.joints[XRHandJoint.XR_HAND_JOINT_WRIST_EXT].position;
                //this.rootPart.rotation = handData.joints[XRHandJoint.XR_HAND_JOINT_WRIST_EXT].orientation;

                // let wristQuat: Quat = handData.joints[XRHandJoint.XR_HAND_JOINT_WRIST_EXT].orientation.clone();
                // let resultQuat: Quat = new Quat();
                // // 180, 90, 0
                // Quat.multiply(resultQuat, wristQuat, new Quat(0.7071, 0, -0.7071, 1));
                // this.rootPart.rotation = resultQuat;

                this._handJointMap.forEach((value, key) => {
                    let origalQuat: Quat = handData.joints[key].orientation.clone();
                    let calQuat: Quat = origalQuat.clone();

                    //value.rotation = q;// handData.joints[key].orientation.clone();
                    if (key >= XRHandJoint.XR_HAND_JOINT_MIDDLE_METACARPAL_EXT && key <= XRHandJoint.XR_HAND_JOINT_MIDDLE_TIP_EXT) {
                        //value.rotation = q;// handData.joints[key].orientation.clone();
                    }

                    if (key >= XRHandJoint.XR_HAND_JOINT_RING_METACARPAL_EXT && key <= XRHandJoint.XR_HAND_JOINT_RING_TIP_EXT) {
                        this.eulerYDegrees += deltaTime * 2;
                        value.rotation = Quat.fromEuler(new Quat(), this.eulerYDegrees, 0, 0);


                        let resultQuat: Quat = new Quat();
                        // 180, 90, 0
                        //Quat.multiply(resultQuat, handData.joints[key].orientation.clone(), new Quat(0.7071, 0, -0.7071, 1));
                        //value.rotation = resultQuat;

                        //calQuat;// handData.joints[key].orientation.clone();
                    }
                });

            }
        }
    }
}


