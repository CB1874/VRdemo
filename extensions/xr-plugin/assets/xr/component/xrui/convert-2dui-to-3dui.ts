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

import { _decorator, Component, Node, Layers, UIRenderer, assetManager, Material, Button, EditBox, Slider, ScrollView, Collider, BoxCollider, UITransform, RenderRoot2D, Widget, Canvas, ProgressBar } from 'cc';
import { RaycastChecker } from './raycast-checker';

const { ccclass, property, executeInEditMode, menu } = _decorator;

@ccclass('cc.Convert2DUITo3DUI')
@menu('hidden:XR/XRUI/Convert2DUITo3DUI')
@executeInEditMode
export class Convert2DUITo3DUI extends Component {
    private _material: Material | null = null;

    onLoad () {
        assetManager.loadAny({ uuid: 'fa235423-e2f5-491b-8972-ec0e98225f5b' }, (err, assets) => {
            this._material = assets;
            // convert
            this._2dTo3d(this.node);
        });

        // Determine whether it is Canvas or not
        const canvas = this.node.getComponent(Canvas);
        if (canvas) {
            this.scheduleOnce(() => {
                this._addRenderRoot2D();
            });
        } else {
            this._addRenderRoot2D();
        }
    }

    private _addRenderRoot2D () {
        // Add RenderRoot2D
        const renderRoot2D = this.node.getComponent(RenderRoot2D);
        if (!renderRoot2D) {
            this.node.addComponent(RenderRoot2D);
        }

        this.destroy();
    }

    private _2dTo3d (node: Node) {
        // Layer transformation
        node.layer = Layers.Enum.UI_3D;
        // Alternate material
        const uiRenderer = node.getComponent(UIRenderer);
        if (uiRenderer) {
            uiRenderer.customMaterial = this._material;
        }

        // Delete the node's Widget and the camera to which it points
        const canvas = node.getComponent(Canvas);
        if (canvas) {
            const camera = canvas.cameraComponent;
            if (camera) {
                camera.destroy();
            }
            canvas.destroy();
        }

        // Delete the Widget of the node
        const widget = node.getComponent(Widget);
        if (widget) {
            widget.destroy();
        }

        // Adding RaycastChecker will automatically add BoxCollider to the lit nod
        let isInteraction = false;
        let raycastChecker = node.getComponent(RaycastChecker);
        if (!raycastChecker) {
            // Button add RaycastChecker
            const button = node.getComponent(Button);
            if (button) {
                raycastChecker = node.addComponent(RaycastChecker);
                isInteraction = true;
            }
        }
        if (!raycastChecker) {
            // EditBox add RaycastChecker
            const editBox = node.getComponent(EditBox);
            if (editBox) {
                raycastChecker = node.addComponent(RaycastChecker);
                isInteraction = true;
            }
        }
        if (!raycastChecker) {
            // Slider add RaycastChecker
            const slider = node.getComponent(Slider);
            if (slider) {
                raycastChecker = node.addComponent(RaycastChecker);
                isInteraction = true;
            }
        }
        if (!raycastChecker) {
            // ScrollView add RaycastChecker
            const scrollView = node.getComponent(ScrollView);
            if (scrollView) {
                raycastChecker = node.addComponent(RaycastChecker);
                isInteraction = true;
            }
        }
        if (!raycastChecker) {
            // ProgressBar add RaycastChecker
            const progressBar = node.getComponent(ProgressBar);
            if (progressBar) {
                raycastChecker = node.addComponent(RaycastChecker);
                isInteraction = true;
            }
        }

        // Check for missing colliders, unlit nodes that need to be added manually
        if (!node.getComponent(Collider) && isInteraction) {
            const collider = node.addComponent(BoxCollider);
            const uiTransform = node.getComponent(UITransform);
            if (uiTransform) {
                collider.center.set(0, 0, 0);
                collider.size.set(uiTransform.width, uiTransform.height, 0.01);
            }
        }

        const children = node.children;
        for (let i = 0; i < children.length; i++) {
            this._2dTo3d(children[i]);
        }
    }
}
