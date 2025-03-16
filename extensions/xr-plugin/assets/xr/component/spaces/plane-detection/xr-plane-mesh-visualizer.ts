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

import { _decorator, Component, MeshRenderer, Line, Vec3, primitives, utils, Quat, sys } from 'cc';
import { XRPlane } from './xr-plane';

const { ccclass, menu, property } = _decorator;

@ccclass('cc.spaces.XRPlaneMeshVisualizer')
@menu('hidden:XR/Spaces/XRPlaneMeshVisualizer')
export class XRPlaneMeshVisualizer extends Component {
    private _plane: XRPlane | null = null;
    private _line: Line | null = null;
    private _renderer: MeshRenderer | null = null;
    @property
    private enableDebugVertexs = false;
    @property
    private debugRotation: Vec3 = new Vec3();
    @property
    private debugPosition: Vec3 = new Vec3();

    onLoad () {
        this._line = this.node.getComponent(Line);
        this._plane = this.node.getComponent(XRPlane);
        this._renderer = this.node.getComponent(MeshRenderer);
        if (this.enableDebugVertexs) {
            const vertexs = [
                new Vec3(-0.95, -0.04, 0.92),
                new Vec3(-0.54, -0.04, 0.98),
                new Vec3(0.08, -0.04, 0.43),
                new Vec3(0.50, -0.04, -0.64),
                new Vec3(0.50, -0.04, -1.00),
                new Vec3(0.39, -0.04, -1.06),
            ];
            this.updatePolygonMesh(vertexs);
        }
    }

    update (deltaTime: number) {
        if (this._plane && this._plane.isTracking) {
            this.updatePolygonMesh(this._plane.vertexs);
        } else if (sys.isXR && this._renderer) {
            this._renderer.mesh = null;
        }
    }

    private updatePolygonMesh (vers: Array<Vec3>) {
        if (vers.length < 3) return;

        const meshPositions: number[] = [];
        const verticesWithPose: Vec3[] = [];
        let pointsStr = '[\n';
        for (let index = 0; index < vers.length; index++) {
            const point3d: Vec3 = vers[index];
            // meshVertices.push(point3d.x, point3d.y, point3d.z);

            const result: Vec3 = new Vec3();
            if (this.enableDebugVertexs) {
                const rotation: Quat = new Quat();
                Quat.fromEuler(rotation, this.debugRotation.x, this.debugRotation.y, this.debugRotation.z);
                Vec3.transformRTS(result, point3d, rotation, this.debugPosition, Vec3.ONE);
            } else if (this._plane) {
                Vec3.transformRTS(result, point3d, this._plane.planeData.poseOrientation, this._plane.planeData.posePosition, Vec3.ONE);
            }

            verticesWithPose.push(result);

            // meshVertices.push(result.x, result.y, result.z);
            meshPositions.push(point3d.x, point3d.y, point3d.z);

            pointsStr +=  `new Vec3${point3d.toString()},\n`;
        }

        //let euler:Vec3 = new Vec3();
        //Quat.toEuler(euler, this._plane.planeData.poseOrientation);

        const points: any = verticesWithPose.slice(0);
        points.push(verticesWithPose[0]);
        if (this._line) {
            this._line.positions = points;
        }

        const triangles = this.generateIndices(vers);

        const geo: primitives.IGeometry = {
            positions: meshPositions,
            indices: triangles,
        };
        const mesh = utils.MeshUtils.createMesh(geo);
        if (mesh && this._renderer) {
            this._renderer.mesh = mesh;
        }
    }

    public generateIndices (vers: Vec3[]) {
        let numBoundaryVertices = vers.length - 1;
        if (numBoundaryVertices > 1 && Vec3.equals(vers[0], vers[vers.length - 1])) {
            numBoundaryVertices--;
        }
        const centerIndex = numBoundaryVertices;
        const triangles: number[] = [];
        for (let i = 0; i < numBoundaryVertices; ++i) {
            const j = (i + 1) % numBoundaryVertices;
            triangles.push(centerIndex);
            triangles.push(i);
            triangles.push(j);
        }
        return triangles;
    }
}
