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

import { _decorator, Component, MeshRenderer, Node, primitives, utils, Vec3, RenderTexture, Camera, director, sys, assetManager } from 'cc';
import { EDITOR } from 'cc/env';
import { DistortionMode, globalInteractiveManager } from './xr-interactive-simulator';

const { ccclass, property, menu } = _decorator;

@ccclass('cc.XRLensDistortionCorrection')
@menu('XR/Device/XRLensDistortionCorrection')
export class XRLensDistortionCorrection extends Component {
    @property({
        step: 0.01, visible: (function (this: XRLensDistortionCorrection) {
            return this._curDistortionMode === DistortionMode.BARREL;
            })
        })
    get lensPolyK0 () {
        return this._gLensPolyK0;
    }
    set lensPolyK0 (value) {
        this._gLensPolyK0 = value;
        this._reloadDistortionMesh = true;
    }

    @property({
        step: 0.01, visible: (function (this: XRLensDistortionCorrection) {
            return this._curDistortionMode === DistortionMode.BARREL;
            })
        })
    get lensPolyK1 () {
        return this._gLensPolyK1;
    }
    set lensPolyK1 (value) {
        this._gLensPolyK1 = value;
        this._reloadDistortionMesh = true;
    }

    // 0 ~ 1
    private _gLensPolyK0 = 1.0;
    // -1 ~ 0
    private _gLensPolyK1 = -0.0193;
    private _gLensPolyK2 = 0.2073;
    private _gLensPolyK3 = 0.1755;
    private _gLensPolyK4 = 0.0239;
    private _gLensPolyK5 = -0.6065;
    private _gLensPolyK6 = 0.6264;
    private _leftEyeMeshNode: Node | null = null;
    private _rightEyeMeshNode: Node | null = null;
    private _distortionCamera: Camera | null | undefined = null;
    private _reloadDistortionMesh = false;
    private _dualEyeCameraRenderTexture: RenderTexture | null = null;
    private _singleEyeCameraRenderTexture_L: RenderTexture | null = null;
    private _singleEyeCameraRenderTexture_R: RenderTexture | null = null;
    private _camerAspect = 0.0;
    private _curDistortionMode: DistortionMode = DistortionMode.NONE;
    start () {
        if (sys.isBrowser && !sys.isNative) {
            this._leftEyeMeshNode = this.node.getChildByName('LeftEyeMesh');
            this._rightEyeMeshNode = this.node.getChildByName('RightEyeMesh');
            this._distortionCamera = this.node.getChildByName('DistortionCamera')?.getComponent(Camera);
            if (this._distortionCamera) {
                this._distortionCamera.priority = 4;
            }

            this._curDistortionMode = globalInteractiveManager.distortionMode;
            assetManager.loadAny({ uuid: '303d6a3a-d09c-485f-a751-05a4c61b6d73', type: RenderTexture }, (err, rt) => {
                if (err) {
                    console.log(`XRLensDistortionCorrection load rt error.${err}`);
                    return;
                }
                this._dualEyeCameraRenderTexture = rt;
            });

            assetManager.loadAny({ uuid: 'd4332383-07f6-4eb3-9026-2a872245ab8d', type: RenderTexture }, (err, rt) => {
                if (err) {
                    console.log(`XRInteractiveSimulator load left rt error.${err}`);
                    return;
                }
                this._singleEyeCameraRenderTexture_L = rt;
            });

            assetManager.loadAny({ uuid: '52d33d78-2b86-410a-997d-ffc9a2a9dadc', type: RenderTexture }, (err, rt) => {
                if (err) {
                    console.log(`XRInteractiveSimulator load right rt error.${err}`);
                    return;
                }
                this._singleEyeCameraRenderTexture_R = rt;
            });
        }
    }

    update (deltaTime: number) {
        if (sys.isBrowser && !sys.isNative) {
            if (globalInteractiveManager.distortionMode !== this._curDistortionMode) {
                this._curDistortionMode = globalInteractiveManager.distortionMode;

                if (this._curDistortionMode === DistortionMode.NONE) {
                    if (this._leftEyeMeshNode) {
                        this._leftEyeMeshNode.active = false;
                    }
                    if (this._rightEyeMeshNode) {
                        this._rightEyeMeshNode.active = false;
                    }
                    if (this._distortionCamera) {
                        this._distortionCamera.node.active = false;
                    }
                } else {
                    if (this._leftEyeMeshNode) {
                        this._leftEyeMeshNode.active = true;
                    }
                    if (this._rightEyeMeshNode) {
                        this._rightEyeMeshNode.active = true;
                    }
                    if (this._distortionCamera) {
                        this._distortionCamera.node.active = true;
                    }
                    this._reloadDistortionMesh = true;
                }
            }

            if (globalInteractiveManager.isDistortionParameterChanged) {
                globalInteractiveManager.isDistortionParameterChanged = false;
                if (globalInteractiveManager.distortionParameterK0 !== this._gLensPolyK0) {
                    this.lensPolyK0 = globalInteractiveManager.distortionParameterK0;
                }

                if (globalInteractiveManager.distortionParameterK1 !== this._gLensPolyK1) {
                    this.lensPolyK1 = globalInteractiveManager.distortionParameterK1;
                }
            }

            if (this._curDistortionMode !== DistortionMode.NONE) {
                if (this._distortionCamera?.camera && this._distortionCamera.camera.aspect !== this._camerAspect) {
                    if (EDITOR) {
                        this._distortionCamera.camera.changeTargetWindow(
                            director.root?.mainWindow,
                        );
                    }
                    // resolution changed
                    this._camerAspect = this._distortionCamera.camera.aspect;
                    // this._distortionCamera.camera.aspect);

                    if (this._leftEyeMeshNode) {
                        this._leftEyeMeshNode.setWorldScale(new Vec3(
                            this._leftEyeMeshNode.worldScale.y * this._camerAspect * 0.5,
                            this._leftEyeMeshNode.worldScale.y,
                            this._leftEyeMeshNode.worldScale.z,
                        ));
                        this._leftEyeMeshNode.setWorldPosition(new Vec3(
                            -1 * this._leftEyeMeshNode.worldScale.x,
                            this._leftEyeMeshNode.worldPosition.y,
                            this._leftEyeMeshNode.worldPosition.z,
                        ));
                    }

                    if (this._rightEyeMeshNode) {
                        this._rightEyeMeshNode.setWorldScale(new Vec3(
                            this._rightEyeMeshNode.worldScale.y * this._camerAspect * 0.5,
                            this._rightEyeMeshNode.worldScale.y,
                            this._rightEyeMeshNode.worldScale.z,
                        ));
                        this._rightEyeMeshNode.setWorldPosition(new Vec3(
                            this._rightEyeMeshNode.worldScale.x,
                            this._rightEyeMeshNode.worldPosition.y,
                            this._rightEyeMeshNode.worldPosition.z,
                        ));
                    }
                }

                if (this._reloadDistortionMesh) {
                    this._reloadDistortionMesh = false;
                    this.updateEyeDistortionMesh();
                }
            }
        }
    }

    updateEyeDistortionMesh (): void {
        const uSegments: number = this._curDistortionMode === DistortionMode.CIRCULAR ? 240 : 50;
        const vSegments: number = this._curDistortionMode === DistortionMode.CIRCULAR ? 240 : 50;
        const mesh: primitives.IGeometry = this.generateGeometry(uSegments, vSegments);
        {
            // left
            const renderer = this._leftEyeMeshNode?.getComponent(MeshRenderer);
            if (renderer) {
                renderer.mesh = utils.MeshUtils.createMesh(mesh);
                if (this._singleEyeCameraRenderTexture_L) {
                    renderer.material?.setProperty('mainTexture', this._singleEyeCameraRenderTexture_L.getGFXTexture());
                }
                renderer.material?.setProperty('eye', 2.0);
            }
        }

        {
            // right
            const renderer = this._rightEyeMeshNode?.getComponent(MeshRenderer);
            if (renderer) {
                renderer.mesh = utils.MeshUtils.createMesh(mesh);
                if (this._singleEyeCameraRenderTexture_R) {
                    renderer.material?.setProperty('mainTexture', this._singleEyeCameraRenderTexture_R.getGFXTexture());
                }
                renderer.material?.setProperty('eye', 2.0);
            }
        }
    }

    generateGeometry (uSegments = 50, vSegments = 50): primitives.IGeometry {
        const width = 2.0;
        const height = 2.0;

        const positions: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        const minPos = new Vec3(-width / 2, -height / 2, 0);
        const maxPos = new Vec3(width / 2, height / 2, 0);
        const boundingRadius = Math.sqrt(width * width / 4 + height * height / 4);

        for (let y = 0; y <= vSegments; y++) {
            for (let x = 0; x <= uSegments; x++) {
                let u = width * x / uSegments;
                let v = height * y / vSegments;

                const px = minPos.x + u;
                const py = minPos.y + v;

                positions.push(px, py, 0);

                // ******************************************
                // Calculate distortion coordinates
                // ******************************************
                // [0, 1] => [-1, 1]
                const DistCoordX = px;
                const DistCoordY = py;

                // Need the radius for the distortion polynomial
                const DistSqrd = (DistCoordX * DistCoordX) + (DistCoordY * DistCoordY);
                const Radius1 = Math.sqrt(DistSqrd);

                const Radius2 = Radius1 * Radius1;
                const Radius3 = Radius2 * Radius1;
                const Radius4 = Radius3 * Radius1;
                const Radius5 = Radius4 * Radius1;
                const Radius6 = Radius5 * Radius1;

                // ******************************************
                // Calculate distortion scale
                // ******************************************
                // Lens Distortion Polynomial: K0 + K1*r + K2*r^2 + K3*r^3 + K4*r^4 + K5*r^5 + K6*r^6
                let DistortionScale = 0.0;
                DistortionScale += this._gLensPolyK0;
                DistortionScale += this._gLensPolyK1 * Radius1;
                DistortionScale += this._gLensPolyK2 * Radius2;
                DistortionScale += this._gLensPolyK3 * Radius3;
                DistortionScale += this._gLensPolyK4 * Radius4;
                DistortionScale += this._gLensPolyK5 * Radius5;
                DistortionScale += this._gLensPolyK6 * Radius6;
                //
                u = (DistCoordX * DistortionScale + 1) / 2;
                v = (DistCoordY * DistortionScale + 1) / 2;

                if (this._curDistortionMode === DistortionMode.CIRCULAR) {
                    if (Math.sqrt(px * px + py * py) > 0.8) {
                        u = -1;
                        v = 2;
                    }
                }

                uvs.push(u, 1 - v);

                if ((x < uSegments) && (y < vSegments)) {
                    const useg1 = uSegments + 1;
                    const a = x + y * useg1;
                    const b = x + (y + 1) * useg1;
                    const c = (x + 1) + (y + 1) * useg1;
                    const d = (x + 1) + y * useg1;

                    indices.push(a, d, b);
                    indices.push(d, c, b);
                }
            }
        }

        const result: primitives.IGeometry = {
            positions,
            indices,
            minPos,
            maxPos,
            boundingRadius,
        };

        const nVertex = (vSegments + 1) * (uSegments + 1);
        const normals = new Array<number>(3 * nVertex);
        result.normals = normals;
        for (let i = 0; i < nVertex; ++i) {
            normals[i * 3 + 0] = 0;
            normals[i * 3 + 1] = 1;
            normals[i * 3 + 2] = 0;
        }

        result.uvs = uvs;

        return result;
    }
}
