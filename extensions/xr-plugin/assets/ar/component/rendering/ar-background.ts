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

import { RenderPipeline, WebGL2Device, WebGLDevice, gfx, pipeline, renderer } from 'cc';

const vsGLSL3 = `
    in vec2 a_position;
    in vec2 a_texCoord;
    layout(std140) uniform Mats {
        mat4 u_MVP;
        mat4 u_CoordMatrix;
    };
    out vec2 v_texCoord;
    void main(){
        v_texCoord = (u_CoordMatrix * vec4(a_texCoord, 0, 1)).xy;
        gl_Position = u_MVP * vec4(a_position, 0, 1);
    }`;

// ARModule Runtime
// #extension GL_OES_EGL_image_external_essl3:require
// uniform samplerExternalOES u_texture;
const fsGLSL3 = `
    precision mediump float;
    in vec2 v_texCoord;
    uniform sampler2D u_texture;
    out vec4 o_color;
    void main() {
        o_color = texture(u_texture, v_texCoord);
    }`;

const vsGLSL1 = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    uniform mat4 u_MVP;
    uniform mat4 u_CoordMatrix;
    varying vec2 v_texCoord;
    void main() {
        v_texCoord = (u_CoordMatrix * vec4(a_texCoord, 0, 1)).xy;
        gl_Position = u_MVP * vec4(a_position, 0, 1);
    }`;

// ARModule Runtime
// #extension GL_OES_EGL_image_external:require
// uniform samplerExternalOES u_texture;
const fsGLSL1 = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
    }`;

/**
 * @zh
 * AR
 */
export class ARBackground {
    private declare _pipeline: RenderPipeline;
    private _InputAssemblerInfo: gfx.InputAssemblerInfo | null = null;

    private _vertexBuffer: gfx.Buffer | null = null;
    private _vertexBuffers: gfx.Buffer[] = [];

    private _attributes: gfx.Attribute[] = [];

    private _indexBuffer: gfx.Buffer | null = null;

    private _indirectBuffer: gfx.Buffer | null = null;

    private _shader: gfx.Shader | undefined = undefined;
    private _inputAssembler: gfx.InputAssembler | null = null;
    private _descriptorSetLayout: gfx.DescriptorSetLayout | null = null;
    private _descriptorSet: gfx.DescriptorSet | null = null;
    private _uniformBuffer: gfx.Buffer | null = null;
    private _pipelineLayout: gfx.PipelineLayout | undefined = undefined;

    private _backgroundTexture: gfx.Texture | null = null;

    private _isOnRenderInit = false;

    private _htmlVideo: HTMLVideoElement | null = null;
    private _videoTexture: WebGLTexture | null = null;

    public activate (pipeline: RenderPipeline) {
        this._pipeline = pipeline;
        const device = pipeline.device;
        this.inits(device);
    }

    public inits (device: gfx.Device) {
        this._attributes = [
            new gfx.Attribute('a_position', gfx.Format.RG32F, false, 0, false, 0),
            new gfx.Attribute('a_texCoord', gfx.Format.RG32F, false, 0, false, 1),
        ];

        const vertices = new Float32Array([
            -1, -1, 0, 1,
            -1, 1, 0, 0,
            1, -1, 1, 1,
            1, 1, 1, 0,
        ]);

        let bytes = vertices.length * Float32Array.BYTES_PER_ELEMENT;
        this._vertexBuffer = device.createBuffer(new gfx.BufferInfo(
            gfx.BufferUsageBit.VERTEX, gfx.MemoryUsageBit.DEVICE, bytes, 4 * Float32Array.BYTES_PER_ELEMENT,
        ));
        this._vertexBuffer.update(vertices, bytes);
        this._vertexBuffers.length = 0;
        this._vertexBuffers.push(this._vertexBuffer);

        const indices = new Uint16Array([0, 2, 1, 1, 2, 3]);
        bytes = indices.length * Uint16Array.BYTES_PER_ELEMENT;
        this._indexBuffer = device.createBuffer(new gfx.BufferInfo(
            gfx.BufferUsageBit.INDEX, gfx.MemoryUsageBit.DEVICE, bytes, Uint16Array.BYTES_PER_ELEMENT,
        ));
        this._indexBuffer.update(indices, bytes);

        const drawInfo = new gfx.DrawInfo();
        drawInfo.indexCount = 6;
        const iaInfo = new gfx.IndirectBuffer([drawInfo]);
        this._indirectBuffer = device.createBuffer(new gfx.BufferInfo(
            gfx.BufferUsageBit.INDIRECT, gfx.MemoryUsageBit.DEVICE, gfx.DRAW_INFO_SIZE, gfx.DRAW_INFO_SIZE,
        ));
        this._indirectBuffer.update(iaInfo);

        this._InputAssemblerInfo = new gfx.InputAssemblerInfo(this._attributes,
            this._vertexBuffers, this._indexBuffer, this._indirectBuffer);
        this._inputAssembler = device.createInputAssembler(this._InputAssemblerInfo);

        // descriptor set
        const dslInfo: gfx.DescriptorSetLayoutInfo = new gfx.DescriptorSetLayoutInfo();
        dslInfo.bindings.push(
            new gfx.DescriptorSetLayoutBinding(0, gfx.DescriptorType.UNIFORM_BUFFER, 1, gfx.ShaderStageFlagBit.VERTEX),
        );
        dslInfo.bindings.push(
            new gfx.DescriptorSetLayoutBinding(1, gfx.DescriptorType.SAMPLER_TEXTURE, 1, gfx.ShaderStageFlagBit.FRAGMENT),
        );
        this._descriptorSetLayout = device.createDescriptorSetLayout(dslInfo);
        this._descriptorSet = device.createDescriptorSet(new gfx.DescriptorSetInfo(this._descriptorSetLayout));

        // uniform buffer
        const mats = new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, -1, 0,
            0, 0, -1, 1,
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
        bytes = mats.length * Float32Array.BYTES_PER_ELEMENT;
        this._uniformBuffer = device.createBuffer(new gfx.BufferInfo(
            gfx.BufferUsageBit.UNIFORM, gfx.MemoryUsageBit.DEVICE, bytes,
        ));
        this._uniformBuffer.update(mats, bytes);

        // pipeline layout
        this._pipelineLayout = device.createPipelineLayout(new gfx.PipelineLayoutInfo([
            this._pipeline.descriptorSetLayout, this._descriptorSetLayout,
        ]));

        this._descriptorSet.bindBuffer(0, this._uniformBuffer);
    }

    public setVideoSource (video: HTMLVideoElement | null) {
        this._htmlVideo = video;
    }

    public render (camera: renderer.scene.Camera, renderPass: gfx.RenderPass) {
        const webAR = globalThis.__globalXR.webAR;
        if (!webAR) {
            return;
        }

        const useWebGL2 = (!!globalThis.WebGL2RenderingContext);
        const device = this._pipeline.device;
        const cmdBuff = this._pipeline.commandBuffers[0];

        if (!this._isOnRenderInit) {
            // shader
            const stages = [
                new gfx.ShaderStage(gfx.ShaderStageFlagBit.VERTEX, useWebGL2 ? vsGLSL3 : vsGLSL1),
                new gfx.ShaderStage(gfx.ShaderStageFlagBit.FRAGMENT, useWebGL2 ? fsGLSL3 : fsGLSL1),
            ];
            const uniforms = [
                new gfx.Uniform('u_MVP', gfx.Type.MAT4, 1),
                new gfx.Uniform('u_CoordMatrix', gfx.Type.MAT4, 1),
            ];
            const blocks = [
                new gfx.UniformBlock(pipeline.SetIndex.MATERIAL, 0, 'Mats', uniforms, 2),
            ];
            const samplerTextures = [
                new gfx.UniformSamplerTexture(pipeline.SetIndex.MATERIAL, 1, 'u_texture', gfx.Type.SAMPLER2D, 1),
            ];
            const samplers = [
                new gfx.UniformSampler(pipeline.SetIndex.MATERIAL, 1, 'u_texture', 1),
            ];
            const shaderInfo = new gfx.ShaderInfo(
                'ARBackGround', stages, this._attributes, blocks, [], samplerTextures, samplers,
            );
            this._shader = device.createShader(shaderInfo);

            // background texture
            const textureInfo = new gfx.TextureInfo();
            textureInfo.usage = gfx.TextureUsageBit.SAMPLED | gfx.TextureUsageBit.TRANSFER_SRC;
            textureInfo.format = gfx.Format.RGBA8;
            textureInfo.width = camera.width;
            textureInfo.height = camera.height;
            // textureInfo.externalRes = 1;
            this._backgroundTexture = device.createTexture(textureInfo);

            // video texture
            if (this._htmlVideo) {
                const { gl } = useWebGL2 ? device as WebGL2Device : device as WebGLDevice;
                this._videoTexture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, this._videoTexture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._htmlVideo);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                (this._backgroundTexture as any).gpuTexture.glTexture = this._videoTexture;

                const glTexUnit = device.stateCache.glTexUnits[device.stateCache.texUnit];
                glTexUnit.glTexture = this._videoTexture;
            }

            this._descriptorSet?.bindSampler(1, device.getSampler(new gfx.SamplerInfo()));
            this._descriptorSet?.bindTexture(1, this._backgroundTexture);
            this._descriptorSet?.update();

            this._isOnRenderInit = true;
        } else if (this._htmlVideo) {
            const { gl } = useWebGL2 ? device as WebGL2Device : device as WebGLDevice;
            const glTexUnit = device.stateCache.glTexUnits[device.stateCache.texUnit];
            glTexUnit.glTexture = this._videoTexture;

            gl.bindTexture(gl.TEXTURE_2D, this._videoTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._htmlVideo);
        }

        const coords = webAR.getCameraTexCoords();
        if (coords && coords.length > 0) {
            const vertices = new Float32Array([
                -1, -1, coords[2], coords[3],
                -1, 1, coords[0], coords[1],
                1, -1, coords[6], coords[7],
                1, 1, coords[4], coords[5],
            ]);
            const bytes = vertices.length * Float32Array.BYTES_PER_ELEMENT;
            this._vertexBuffer?.update(vertices, bytes);
        }

        if (this._descriptorSet && this._inputAssembler) {
            const psoInfo =  new gfx.PipelineStateInfo(
                this._shader, this._pipelineLayout, renderPass,
                new gfx.InputState(this._inputAssembler?.attributes),
                new gfx.RasterizerState(false, gfx.PolygonMode.FILL, gfx.ShadeModel.GOURAND, gfx.CullMode.NONE),
                new gfx.DepthStencilState(false),
            );
            const pso = device.createPipelineState(psoInfo);
            cmdBuff.bindPipelineState(pso);
            cmdBuff.bindDescriptorSet(pipeline.SetIndex.MATERIAL, this._descriptorSet);
            cmdBuff.bindInputAssembler(this._inputAssembler);
            cmdBuff.draw(this._inputAssembler);
        }
    }
}
