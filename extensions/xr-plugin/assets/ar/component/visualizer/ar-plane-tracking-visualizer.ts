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

import { _decorator, Component, utils, primitives, MeshRenderer, Vec3, Vec2, Line, MeshCollider, Mesh } from 'cc';
import { EDITOR } from 'cc/env';
import { TrackingQuality } from '../framework/utils/ar-defines';

const { ccclass, help, menu, executeInEditMode } = _decorator;

/**
 * @en
 * Flat trace visual component, hidden
 * @zh
 * 平面追踪可视化组件，已隐藏
 */
@ccclass('cc.PlaneTrackingVisualizer')
@help('i18n:cc.PlaneTrackingVisualizer')
@menu('hidden:XR/AR Tracking/PlaneTrackingVisualizer')
@executeInEditMode
export class PlaneTrackingVisualizer extends Component {
    private _usePlaneShape = true;
    public set usePlaneShape (val: boolean) {
        this._usePlaneShape = val;
    }

    private _trackingQualityCondition: TrackingQuality = TrackingQuality.Poor_Quality;
    public set trackingQualityCondition (val: TrackingQuality) {
        this._trackingQualityCondition = val;
    }

    private _circle_positions: any = null;
    private _originMesh: Mesh | null = null;
    private _originPoints: any = [
        new Vec3(-0.5, 0, -0.5),
        new Vec3(-0.5, 0, 0.5),
        new Vec3(0.5, 0, 0.5),
        new Vec3(0.5, 0, -0.5),
        new Vec3(-0.5, 0, -0.5),
    ];
    private _trackingPlaneId = 0;
    set trackingPlaneId (id: number) {
        this._trackingPlaneId = id;
    }
    get trackingPlaneId () {
        return this._trackingPlaneId;
    }

    private _polygon: Vec2[] = [];
    set polygon (val: Vec2[]) {
        this._polygon = val;
    }
    get polygon () {
        return this._polygon;
    }

    private _hasMeshCollider = false;
    protected onLoad () {
        const renderer: MeshRenderer = this.node.getComponent(MeshRenderer)!;
        if (renderer) {
            this._originMesh = renderer.mesh;
        }

        const line: Line = this.node.getComponent(Line)!;
        if (line) {
            line.positions = this._originPoints;
        }

        const collider: MeshCollider = this.node.getComponent(MeshCollider)!;
        if (collider) {
            this._hasMeshCollider = true;
        }
    }

    public drawSceneEffect (bCylinder: boolean) {
        if (!EDITOR) {
            return;
        }
        const renderer: MeshRenderer = this.node.getComponent(MeshRenderer)!;
        if (bCylinder) {
            const primitive = primitives.cylinder(0.5, 0, 0.01, { radialSegments: 32, heightSegments: 1 });
            renderer.mesh = utils.createMesh(primitive);

            if (!this._circle_positions) {
                const primitive1 = primitives.circle();
                const points: any = [];
                for (let i = 3; i < primitive1.positions.length; i += 3) {
                    const vec3 = new Vec3(primitive1.positions[i] / 2, primitive1.positions[i + 2] / 2, primitive1.positions[i + 1] / 2);
                    points.push(vec3);
                }
                points.push(points[0]);
                this._circle_positions = points;
            }
            const line: Line = this.node.getComponent(Line)!;
            line.positions = this._circle_positions;
        } else {
            const renderer: MeshRenderer = this.node.getComponent(MeshRenderer)!;
            if (renderer && this._originMesh &&  renderer.mesh !== this._originMesh) {
                renderer.mesh = this._originMesh;

                const line: Line = this.node.getComponent(Line)!;
                line.positions = this._originPoints;
            }
        }
    }

    protected update (dt) {
        if (EDITOR) {
            return;
        }
        if (this._usePlaneShape) {
            if (this.polygon && this.polygon.length > 0) {
                this.updatePolygonMesh(this.polygon);
            }
        } else {
            const renderer: MeshRenderer = this.node.getComponent(MeshRenderer)!;
            if (renderer && renderer.mesh !== this._originMesh) {
                renderer.mesh = this._originMesh;

                const line: Line = this.node.getComponent(Line)!;
                line.positions = this._originPoints;
            }
            if (this._hasMeshCollider) {
                const collider: MeshCollider = this.node.getComponent(MeshCollider)!;
                if (collider && collider.mesh !== this._originMesh) {
                    collider.mesh = this._originMesh;
                }
            }
        }
    }

    private updatePolygonMesh (vers: Array<Vec2>) {
        const meshVertices: any = [];
        const point3d = new Array<Vec3>();
        for (let index = 0; index < vers.length; index++) {
            const point2d = vers[index];
            meshVertices.push(point2d.x, 0, point2d.y);
            point3d.push(new Vec3(point2d.x, 0, point2d.y));
        }

        const points: any = point3d.slice(0);
        points.push(point3d[0]);
        const line: Line = this.node.getComponent(Line)!;
        if (line) {
            line.positions = points;
        }

        const triangles = this.generateIndices(point3d);

        const geo: primitives.IGeometry = {
            positions: meshVertices,
            indices: triangles,
        };
        const mesh = utils.MeshUtils.createMesh(geo);
        const renderer: MeshRenderer = this.node.getComponent(MeshRenderer)!;
        if (mesh && renderer) {
            renderer.mesh = mesh;
        }

        if (this._hasMeshCollider) {
            let collider: MeshCollider = this.node.getComponent(MeshCollider)!;
            if (collider) {
                this.node.removeComponent(MeshCollider);
            }
            collider = this.node.addComponent(MeshCollider);
            collider.mesh = mesh;
        }
    }

    private generateIndices (vers: Vec3[]) {
        let numBoundaryVertices = vers.length - 1;
        //若是闭环去除最后一点
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
