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

import { Vec3, Quat } from 'cc';
import { ARMesh } from '../../../../../ar/component/framework/utils/ar-defines';
import { ARHandlerSceneMesh } from '../../ar-base/ar-handler-base';
import { ARMobileDevice } from '../ar-mobile-device';

export class ARMobileHandlerSceneMesh extends ARHandlerSceneMesh {
    private static readonly MESH_INFO_SIZE = 8;

    public enableSceneMesh (enable: boolean) {
        const device = this._device as ARMobileDevice;
        // this would leads error if set feature enable false at device init, would fix in 3.7.2
        device.NativeObj.enableSceneMesh(enable);
    }

    public update () {
        if (!this._feature || !this._feature.config?.enable) {
            return;
        }
        const device = this._device as ARMobileDevice;

        const meshes: ARMesh[] = [];
        let meshInfos: number[];
        meshInfos = device.NativeObj.getRemovedSceneMesh();

        if (meshInfos.length > 0) {
            meshes.length = 0;
            this.assembleInfos(meshInfos, meshes);
            if (meshes.length > 0) {
                this._feature.onRemoveTracking(meshes);
            }
        }

        meshInfos = device.NativeObj.getAddedSceneMesh();
        if (meshInfos.length > 0) {
            meshes.length = 0;
            this.assembleInfos(meshInfos, meshes);
            if (meshes.length > 0) {
                this._feature.onAddTracking(meshes);
            }
        }

        meshInfos = device.NativeObj.getUpdatedSceneMesh();
        if (meshInfos.length > 0) {
            meshes.length = 0;
            this.assembleInfos(meshInfos, meshes);
            if (meshes.length > 0) {
                this._feature.onUpdateTracking(meshes);
            }
        }
    }

    private assembleInfos (src: number[], dst: ARMesh[]) {
        if (src) {
            const device = this._device as ARMobileDevice;
            const count = src.length / ARMobileHandlerSceneMesh.MESH_INFO_SIZE;
            let offset = 0;
            for (let i = 0; i < count; i++) {
                offset = i * ARMobileHandlerSceneMesh.MESH_INFO_SIZE;

                const meshRef = src[offset];

                const vertices = device.NativeObj.getSceneMeshVertices(meshRef);
                const indices = device.NativeObj.getSceneMeshTriangleIndices(meshRef);
                device.NativeObj.endRequireSceneMesh();

                const pos = new Vec3(
                    src[offset + 1],
                    src[offset + 2],
                    src[offset + 3],
                );
                const rot = new Quat(
                    src[offset + 4],
                    src[offset + 5],
                    src[offset + 6],
                    src[offset + 7],
                );

                const mesh: ARMesh = {
                    id: meshRef,
                    pose: {
                        position: pos,
                        rotation: rot,
                    },
                    vertices,
                    indices,
                };
                dst.push(mesh);
            }
        }
    }
}
