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
import { ARMesh, ARTrackingState } from '../../../../../ar/component/framework/utils/ar-defines';
import { XrBufferOperationType, xrExtension, XrExtensionKey } from '../../../interface/xr-extension';
import { XRConfigKey, xrInterface } from '../../../interface/xr-interface';
import { ARHandlerSceneMesh } from '../../ar-base/ar-handler-base';

class MeshInfo {
    public meshId = 0;
    public vertexCount = 0;
    public indexCount = 0;

    public print (tag: string): void {
        console.log(`${tag} | MeshInfo: id.${this.meshId},V.${this.vertexCount},I.${this.indexCount}`);
    }
}

export class SpacesXRHandlerSceneMesh extends ARHandlerSceneMesh {
    public enableSceneMesh (enable: boolean) {
        console.log(`SpacesXRHandlerSceneMesh.enableSceneMesh.${enable}`);
        xrInterface.setIntConfig(XRConfigKey.SPATIAL_MESHING, enable ? 1 : 0);
    }

    public update () {
        if (!this._feature || !this._feature.config?.enable) {
            console.error('SpacesXRHandlerSceneMesh.update failed, feature disabled !!!');
            return;
        }

        const meshInfoData: number[] = xrExtension.getUInt32Data(XrExtensionKey.XEK_SPACES_MESH_INFO);

        // added mesh id
        let fromIndex = 0;
        const addMeshCount = meshInfoData[fromIndex];
        fromIndex++;
        const meshes: ARMesh[] = [];
        meshes.length = 0;
        for (let idx = 0; idx < addMeshCount; idx++) {
            const meshInfo = new MeshInfo();
            meshInfo.meshId = meshInfoData[fromIndex + idx * 3];
            meshInfo.vertexCount = meshInfoData[fromIndex + idx * 3 + 1];
            meshInfo.indexCount = meshInfoData[fromIndex + idx * 3 + 2];

            const vertexDataArray: Float32Array = new Float32Array(meshInfo.vertexCount * 3);
            const indexDataArray: Uint32Array = new Uint32Array(meshInfo.indexCount);
            xrExtension.syncSharedBufferWithNative_Float32(XrExtensionKey.XEK_SPACES_MESH_VERTICES, XrBufferOperationType.XBOT_GET, vertexDataArray,
                meshInfo.meshId);
            xrExtension.syncSharedBufferWithNative_UINT32(XrExtensionKey.XEK_SPACES_MESH_INDICES, XrBufferOperationType.XBOT_GET, indexDataArray,
                meshInfo.meshId);

            const mesh: ARMesh = {
                id: meshInfo.meshId,
                pose: {
                    position: Vec3.ZERO,
                    rotation: Quat.IDENTITY,
                },
                vertices: [],
                indices: [],
                verticesArray: vertexDataArray,
                indicesArray: indexDataArray,
            };
            mesh.trackingState = ARTrackingState.TRACKING;
            meshes.push(mesh);
        }
        if (meshes.length > 0) {
            console.log('onAddTracking');
            this._feature.onAddTracking(meshes);
        }

        fromIndex = addMeshCount * 3 + 1;
        const updateMeshCount = meshInfoData[fromIndex];
        fromIndex++;
        meshes.length = 0;
        for (let idx = 0; idx < updateMeshCount; idx++) {
            const meshInfo = new MeshInfo();
            meshInfo.meshId = meshInfoData[fromIndex + idx * 3];
            meshInfo.vertexCount = meshInfoData[fromIndex + idx * 3 + 1];
            meshInfo.indexCount = meshInfoData[fromIndex + idx * 3 + 2];

            const vertexDataArray: Float32Array = new Float32Array(meshInfo.vertexCount * 3);
            const indexDataArray: Uint32Array = new Uint32Array(meshInfo.indexCount);

            xrExtension.syncSharedBufferWithNative_Float32(XrExtensionKey.XEK_SPACES_MESH_VERTICES, XrBufferOperationType.XBOT_GET, vertexDataArray,
                meshInfo.meshId);
            xrExtension.syncSharedBufferWithNative_UINT32(XrExtensionKey.XEK_SPACES_MESH_INDICES, XrBufferOperationType.XBOT_GET, indexDataArray,
                meshInfo.meshId);

            const mesh: ARMesh = {
                id: meshInfo.meshId,
                pose: {
                    position: new Vec3(0, 0, 0),
                    rotation: new Quat(0, 0, 0, 1),
                },
                vertices: [],
                indices: [],
                verticesArray: vertexDataArray,
                indicesArray: indexDataArray,
            };
            mesh.trackingState = ARTrackingState.TRACKING;
            meshes.push(mesh);
        }

        if (meshes.length > 0) {
            this._feature.onUpdateTracking(meshes);
        }

        fromIndex = 1 + addMeshCount * 3 + 1 + updateMeshCount * 3;
        const removeMeshCount = meshInfoData[fromIndex];
        fromIndex++;
        meshes.length = 0;
        for (let idx = 0; idx < removeMeshCount; idx++) {
            const meshInfo = new MeshInfo();
            meshInfo.meshId = meshInfoData[fromIndex + idx * 3];
            meshInfo.vertexCount = meshInfoData[fromIndex + idx * 3 + 1];
            meshInfo.indexCount = meshInfoData[fromIndex + idx * 3 + 2];

            const mesh: ARMesh = {
                id: meshInfo.meshId,
                pose: {
                    position: new Vec3(0, 0, 0),
                    rotation: new Quat(0, 0, 0, 1),
                },
                vertices: [],
                indices: [],
            };
            mesh.trackingState = ARTrackingState.STOPPED;
            meshes.push(mesh);
        }
        if (meshes.length > 0) {
            this._feature.onRemoveTracking(meshes);
        }
    }
}
