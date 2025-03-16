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

import { _decorator, ccenum } from 'cc';

export enum ARPropType {
    None = 0,
    Factor,
    Action,
}
ccenum(ARPropType);

export enum XRSessionModeControllerType {
    AUTO = 1,
    INLINE = 1 << 1,
    IMMERSIVE_AR = 1 << 2,
    IMMERSIVE_VR  = 1 << 3,
}
ccenum(XRSessionModeControllerType);

export enum ARTrackingType {
    None = 0,
    Camera = 1 << 0,
    Lighting = 1 << 1,
    Plane = 1 << 3,
    WorldMesh = 1 << 4,
    Image = 1 << 5,
    Object = 1 << 6,
    Face = 1 << 7,
}
ccenum(ARTrackingType);

export enum ActionType {
    NONE = 0,
    SURFACE_OVERLAY,
    DISPLAY_CHILDREN,
    TRACK_EVENT,
    ALIGNMENT,
    ADAPTIVE_SCALE,
    FALLBACK,
    FACE_LANDMARK,
    FACE_BLEND_SHAPES,
    FACE_EXPRESSION_EVENTS,
}
ccenum(ActionType);

export enum FactorType {
    NONE = 0,
    PLANE_DIRECTION,
    PLANE_SIZE,
    PLANE_SEMANTIC,
    IMAGE_SOURCE,
    FACE_CONTENT,
}
ccenum(FactorType);

export enum FaceLandMarkType {
    None = 0,
    Chin,
    ForeHead,
    Left_Top_Eyelid,
    Left_Bottom_Eyelid,
    Left_EyeBrow,
    Left_Pupil,
    Lower_Face,
    Lower_Lip,
    Mouth,
    Nose_Bridge,
    Nose_Tip,
    Right_Top_Eyelid,
    Right_Bottom_Eyelid,
    Right_EyeBrow,
    Right_Pupil,
    Upper_Lip,
    Max
}
ccenum(FaceLandMarkType);

export enum ARFaceBlendShapeType {
    None,

    BrowsDownLeft,          //左眉向下
    BrowsDownRight,         //右眉向下
    BrowsUpCenter,          //眉间向上
    BrowsUpLeft,            //左眉向上
    BrowsUpRight,           //右眉向上

    CheekSquintLeft,        //左脸颊上抬
    CheekSquintRight,       //右脸颊上抬

    EyeBlinkLeft,           //左眼闭合
    EyeBlinkRight,          //右眼闭合
    EyeDownLeft,            //左上眼皮微下垂
    EyeDownRight,           //右上眼皮微下垂
    EyeInLeft,              //左眼内部眼皮向左扩
    EyeInRight,             //右眼内部眼皮向右扩
    EyeOpenLeft,            //左眼打开
    EyeOpenRight,           //右眼打开
    EyeOutLeft,             //左眼睑向左扩
    EyeOutRight,            //右眼睑向右扩
    EyeSquintLeft,          //左下眼睑上抬
    EyeSquintRight,         //右下眼睑上抬
    EyeUpLeft,              //左眼上眼皮微上抬
    EyeUpRight,             //右眼上眼皮微上抬

    JawLeft,                //下巴朝左
    JawRight,               //下巴朝右
    JawOpen,                //张嘴

    LipsFunnel,             //嘴唇呈O型
    LipsPucker,             //嘴唇紧闭
    LowerLipClose,          //下唇向上唇方向且向后移动
    LowerLipDownLeft,       //左下嘴唇向下
    LowerLipDownRight,      //右下嘴唇向下
    LowerLipRaise,          //下唇向上
    UpperLipClose,          //上唇向下唇方向且向后移动
    UpperLipRaise,          //上唇向上
    UpperLipUpLeft,         //左上唇向上
    UpperLipUpRight,        //右上唇向上

    MouthClose,             //嘴唇闭合状态下一起运动
    MouthDimpleLeft,        //左嘴角向后向左
    MouthDimpleRight,       //右嘴角向后向右
    MouthFrownLeft,         //左嘴角下拉
    MouthFrownRight,        //右嘴角下拉
    MouthLeft,              //双唇向左
    MouthRight,             //双唇向右
    MouthSmileLeft,         //左嘴角向上
    MouthSmileRight,        //右嘴角向上
    MouthStretchLeft,       //嘴部左侧向左
    MouthStretchRight,      //嘴部右侧向右
    MouthUpLeft,            //嘴部左侧向上
    MouthUpRight,           //嘴部右侧向上

    Puff,                   //两侧面颊鼓起(嘟嘴)
    SneerLeft,              //左鼻孔抬起
    SneerRight,             //右鼻孔抬起

    Max,
}
ccenum(ARFaceBlendShapeType);

export enum BlendShapeAssetName {

}
ccenum(BlendShapeAssetName);
