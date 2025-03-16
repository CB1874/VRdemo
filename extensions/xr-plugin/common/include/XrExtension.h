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
#include "Xr.h"

namespace cc {
namespace xr {
enum class XRBufferOperationType {
  BOT_SET,
  BOT_GET = 1
};

/**
 * @en Mainly provides TS and C++ big data transmission interface, convenient xr related interface expansion
 * @zh 主要提供TS与C++大数据传输接口，方便xr相关接口扩展
 */
class XrExtension {
 public:
  XR_EXPORT XrExtension();
  XR_EXPORT ~XrExtension();
  XR_EXPORT static XrExtension* getInstance();
  XR_EXPORT static void destroyInstance();

  /**
   * @en Gets int8 array
   * @zh 获取int8数组
   * @param key
   * @return
   */
  XR_EXPORT std::vector<int8_t> getInt8Data(int key);
  /**
   * @en Gets uint8 array
   * @zh 获取uint8数组
   * @param key
   * @return
   */
  XR_EXPORT std::vector<uint8_t> getUInt8Data(int key);
  /**
   * @en Gets int32 array
   * @zh 获取int32数组
   * @param key
   * @return
   */
  XR_EXPORT std::vector<int32_t> getInt32Data(int key);
  /**
   * @en Gets uint32 array
   * @zh 获取int32数组
   * @param key
   * @return
   */
  XR_EXPORT std::vector<uint32_t> getUInt32Data(int key);
  /**
   * @en Gets float array
   * @zh 获取float数组
   * @param key
   * @return
   */
  XR_EXPORT std::vector<float> getFloat32Data(int key);
  /**
   * @en Gets string array
   * @zh 获取字符串数组
   * @param key
   * @return
   */
  XR_EXPORT std::vector<std::string> getStringData(int key);
  /**
   * @en Gets shared buffer length
   * @zh 查询共享缓冲区数据长度
   * @param key
   * @return
   */
  XR_EXPORT uint32_t querySharedBufferLength(int key);
  /**
   * @en set xr event callback
   * @zh 设置事件回调函数
   * @param eventType
   * @param callback
   * @return
   */
  XR_EXPORT void setXrEventCallback(const std::function<void(int eventType, int eventCode)>& callback);
  /**
   * @en notify xr event from ts to c++
   * @zh 触发事件
   * @param key
   * @return
   */
  XR_EXPORT void notifyXrEvent(int eventType, int eventCode, int arg1, int arg2);
  /**
   * @en ts synchronizes int8 data with c++, and supports setting and obtaining
   * @zh ts与c++进行int8格式数据同步，支持设置和获取两种方式
   * @param key
   * @param operationType
   * @param buffer
   * @param length
   * @return
   */
  XR_EXPORT uint32_t syncSharedBufferWithNative_INT8(int key, int operationType, int8_t* buffer, uint32_t length);
  /**
   * @en ts synchronizes int32 data with c++, and supports setting and obtaining
   * @zh ts与c++进行int32格式数据同步，支持设置和获取两种方式
   * @param key
   * @param operationType
   * @param buffer
   * @param length
   * @return
   */
  XR_EXPORT uint32_t syncSharedBufferWithNative_INT32(int key, int operationType, int32_t* buffer, uint32_t length);
  /**
   * @en ts synchronizes uint8 data with c++, and supports setting and obtaining
   * @zh ts与c++进行uint8格式数据同步，支持设置和获取两种方式
   * @param key
   * @param operationType
   * @param buffer
   * @param length
   * @return
   */
  XR_EXPORT uint32_t syncSharedBufferWithNative_UINT8(int key, int operationType, uint8_t* buffer, uint32_t length);
  /**
   * @en ts synchronizes uint32 data with c++, and supports setting and obtaining
   * @zh ts与c++进行uint32格式数据同步，支持设置和获取两种方式
   * @param key
   * @param operationType
   * @param buffer
   * @param length
   * @return
   */
  XR_EXPORT uint32_t syncSharedBufferWithNative_UINT32(int key, int operationType, uint32_t* buffer, uint32_t length);
  /**
   * @en ts synchronizes float data with c++, and supports setting and obtaining
   * @zh ts与c++进行float格式数据同步，支持设置和获取两种方式
   * @param key
   * @param operationType
   * @param buffer
   * @param length
   * @return
   */
  XR_EXPORT uint32_t syncSharedBufferWithNative_Float32(int key, int operationType, float* buffer, uint32_t length);

 private:
  class XrExtensionImpl;
  XrExtensionImpl* pImpl{nullptr};
};

} // namespace xr
} // namespace cc
