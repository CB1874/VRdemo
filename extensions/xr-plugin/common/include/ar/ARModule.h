/****************************************************************************
 Xiamen Yaji Software Co., Ltd., (the “Licensor”) grants the user (the “Licensee”) non-exclusive and non-transferable rights to use the software according to the following conditions:
 a.  The Licensee shall pay royalties to the Licensor, and the amount of those royalties and the payment method are subject to separate negotiations between the parties.
 b.  The software is licensed for use rather than sold, and the Licensor reserves all rights over the software that are not expressly granted (whether by implication, reservation or prohibition).
 c.  The open source codes contained in the software are subject to the MIT Open Source Licensing Agreement (see the attached for the details);
 d.  The Licensee acknowledges and consents to the possibility that errors may occur during the operation of the software for one or more technical reasons, and the Licensee shall take precautions and prepare remedies for such events. In such circumstance, the Licensor shall provide software patches or updates according to the agreement between the two parties. The    Licensor will not assume any liability beyond the explicit wording of this  Licensing Agreement.
 e.  Where the Licensor must assume liability for the software according to relevant laws, the Licensor’s entire liability is limited to the annual royalty payable by the Licensee.
 f.  The Licensor owns the portions listed in the root directory and subdirectory (if any) in the software and enjoys the intellectual property rights over those portions. As for the portions owned by the Licensor, the Licensee shall not:
     i.  Bypass or avoid any relevant technical protection measures in the products or services;
     ii. Release the source codes to any other parties;
     iii.Disassemble, decompile, decipher, attack, emulate, exploit or reverse-engineer these portion of code;
     iv. Apply it to any third-party products or services without Licensor’s permission;
     v.  Publish, copy, rent, lease, sell, export, import, distribute or lend any products containing these portions of code;
     vi. Allow others to use any services relevant to the technology of these codes; and
     vii.Conduct any other act beyond the scope of this Licensing Agreement.
 g.  This Licensing Agreement terminates immediately if the Licensee breaches this Agreement. The Licensor may claim compensation from the Licensee where the Licensee’s breach causes any damage to the Licensor.
 h.  The laws of the People's Republic of China apply to this Licensing Agreement.
 i.  This Agreement is made in both Chinese and English, and the Chinese version shall prevail the event of conflict.
****************************************************************************/

#pragma once

#include <array>
#include <string>

namespace cc {
namespace ar {

using Pose      = std::array<float, 7>;
using Matrix    = std::array<float, 16>;
using TexCoords = std::array<float, 8>;
using LightVal  = std::array<float, 3>;
using LightColorVal  = std::array<float, 4>;
using LightHarmonicsVal  = std::array<float, 27>;

class ARModule {
public:
    static ARModule* createARModule();
    static ARModule* get();

    ~ARModule() = default;

    void config(uint32_t featureMask);
    uint32_t getSupportMask() const;
    void start();
    void start(void *env, void *context);
    void stop();
    void resume();
    void resume(void *env, void *context);
    void pause();
    void update();
    int getAPIState();

    void setCameraId(const std::string& id);
    const std::string& getCameraId() const;
    Pose getCameraPose();
    Matrix getCameraViewMatrix();
    Matrix getCameraProjectionMatrix();
    TexCoords getCameraTexCoords();

    void enableCameraAutoFocus(bool enable) const;
    void enableCameraDepth(bool enable) const;
    void setDisplayGeometry(uint32_t rotation, uint32_t width, uint32_t height) const;
    void setCameraClip(float near, float far) const;
    void setCameraTextureName(int id) const;
    void* getCameraTextureRef() const;
    uint8_t* getCameraDepthBuffer();
    bool getTexInitFlag() const;
    void resetTexInitFlag();

    void enableLightEstimate(bool enable) const;
    LightVal getMainLightDirection() const;
    LightVal getMainLightIntensity() const;

    int tryHitAttachAnchor(int id) const;
    Pose getAnchorPose(int id);

    bool tryHitTest(float xPx, float yPx, uint32_t trackableTypeMask) const;
    Pose getHitResult();
    int getHitId() const;
    int getHitType() const;

    // for jsb array
    int getInfoLength() const;

    // plane detection
    void enablePlane(bool enable) const;
    void setPlaneDetectionMode(int mode) const;
    float* getAddedPlanesInfo();
    float* getUpdatedPlanesInfo();
    float* getRemovedPlanesInfo();
    float* getPlanePolygon(int id);

    // scene mesh reconstruction
    void enableSceneMesh(bool enable) const;
    float* getAddedSceneMesh();
    float* getUpdatedSceneMesh();
    float* getRemovedSceneMesh();
    int* requireSceneMesh();
    float* getSceneMeshVertices(int id);
    int* getSceneMeshTriangleIndices(int id);
    void endRequireSceneMesh() const;

    // image recognition & tracking
    void enableImageTracking(bool enable) const;
    void addImageToLibWithSize(const std::string& name, float widthInMeters) const;
    void setImageMaxTrackingNumber(int number) const;
    float* getAddedImagesInfo();
    float* getUpdatedImagesInfo();
    float* getRemovedImagesInfo();

    // object recognition & tracking
    void enableObjectTracking(bool enable) const;
    void addObjectToLib(const std::string& name) const;
    float* getAddedObjectsInfo();
    float* getUpdatedObjectsInfo();
    float* getRemovedObjectsInfo();

    // face detection & tracking
    void enableFaceTracking(bool enable) const;
    float* getAddedFacesInfo();
    float* getUpdatedFacesInfo();
    float* getRemovedFacesInfo();
    float* getFaceBlendShapes(int id);

	void setLightingMode(uint32_t lightingMode) const;
    float getAmbientColorTemperature() const;
    float getAmbientIntensity() const;
    LightColorVal getAmbientColor() const;
    LightHarmonicsVal getSphericalHarmonics() const;
};

} // namespace ar
} // namespace cc
