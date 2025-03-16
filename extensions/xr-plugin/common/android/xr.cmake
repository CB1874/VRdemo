

################################# options ############################################
# default fallback options
cc_set_if_undefined(BUILD_XR_NATIVE               OFF)
cc_set_if_undefined(BUILD_SHARED_XR               OFF)
cc_set_if_undefined(BUILD_FOR_CC                  ON)
cc_set_if_undefined(BUILD_FOR_RT                  OFF)
cc_set_if_undefined(BUILD_FOR_CCRT                OFF)
cc_set_if_undefined(XR_OEM_META                   OFF)
cc_set_if_undefined(XR_OEM_HUAWEIVR               OFF)
cc_set_if_undefined(XR_OEM_PICO                   OFF)
cc_set_if_undefined(XR_OEM_ROKID                  OFF)
cc_set_if_undefined(XR_OEM_SEED                   OFF)
cc_set_if_undefined(XR_OEM_SNAPDRAGON_SPACES      OFF)
cc_set_if_undefined(XR_OEM_GSXR                   OFF)
cc_set_if_undefined(XR_OEM_YVR                    OFF)
cc_set_if_undefined(XR_USE_GRAPHICS_API_OPENGL_ES ON)
cc_set_if_undefined(XR_USE_GRAPHICS_API_VULKAN    ON)
cc_set_if_undefined(XR_USE_GRAPHICS_API_OPENGL    OFF)
cc_set_if_undefined(XR_USE_GRAPHICS_API_D3D11     OFF)
cc_set_if_undefined(XR_USE_GRAPHICS_API_D3D12     OFF)


# Several files use these compile time platform switches
if(WIN32)
    cc_set_if_undefined(XR_USE_PLATFORM_WIN32     ON)
elseif(ANDROID)
    cc_set_if_undefined(XR_USE_PLATFORM_ANDROID   ON)
elseif(PRESENTATION_BACKEND MATCHES "xlib")
    cc_set_if_undefined(XR_USE_PLATFORM_XLIB      ON)
elseif(PRESENTATION_BACKEND MATCHES "xcb")
    cc_set_if_undefined(XR_USE_PLATFORM_XCB       ON)
elseif(PRESENTATION_BACKEND MATCHES "wayland")
    cc_set_if_undefined(XR_USE_PLATFORM_WAYLAND   ON)
endif()


################################# list all option values ##############################
cc_inspect_values(
    BUILD_XR_NATIVE
    BUILD_SHARED_XR
    BUILD_FOR_CC
    BUILD_FOR_RT
    BUILD_FOR_CCRT
    XR_OEM_META
    XR_OEM_HUAWEIVR
    XR_OEM_PICO
    XR_OEM_ROKID
    XR_OEM_SEED
    XR_OEM_SNAPDRAGON_SPACES
    XR_OEM_GSXR
    XR_OEM_YVR
    XR_USE_GRAPHICS_API_OPENGL_ES
    XR_USE_GRAPHICS_API_VULKAN
    XR_USE_GRAPHICS_API_OPENGL
    XR_USE_GRAPHICS_API_D3D11
    XR_USE_GRAPHICS_API_D3D12
    XR_USE_PLATFORM_WIN32
    XR_USE_PLATFORM_ANDROID
    XR_USE_PLATFORM_XLIB
    XR_USE_PLATFORM_XCB
    XR_USE_PLATFORM_WAYLAND
)


################################# cc_xr_apply_definations ###################################
function(cc_xr_apply_definations target)
    target_compile_definitions(${target} PUBLIC
        $<IF:$<BOOL:${XR_OEM_META}>,XR_OEM_META=1,XR_OEM_META=0>
        $<IF:$<BOOL:${XR_OEM_HUAWEIVR}>,XR_OEM_HUAWEIVR=1,XR_OEM_HUAWEIVR=0>
        $<IF:$<BOOL:${XR_OEM_PICO}>,XR_OEM_PICO=1,XR_OEM_PICO=0>
        $<IF:$<BOOL:${XR_OEM_ROKID}>,XR_OEM_ROKID=1,XR_OEM_ROKID=0>
        $<IF:$<BOOL:${XR_OEM_SEED}>,XR_OEM_SEED=1,XR_OEM_SEED=0>
        $<IF:$<BOOL:${XR_OEM_SNAPDRAGON_SPACES}>,XR_OEM_SNAPDRAGON_SPACES=1,XR_OEM_SNAPDRAGON_SPACES=0>
        $<IF:$<BOOL:${XR_OEM_GSXR}>,XR_OEM_GSXR=1,XR_OEM_GSXR=0>
        $<IF:$<BOOL:${XR_OEM_YVR}>,XR_OEM_YVR=1,XR_OEM_YVR=0>
        $<$<BOOL:${XR_USE_GRAPHICS_API_OPENGL_ES}>:XR_USE_GRAPHICS_API_OPENGL_ES=1>
        $<$<BOOL:${XR_USE_GRAPHICS_API_VULKAN}>:XR_USE_GRAPHICS_API_VULKAN=1>
        $<$<BOOL:${XR_USE_GRAPHICS_API_OPENGL}>:XR_USE_GRAPHICS_API_OPENGL=1>
        $<$<BOOL:${XR_USE_GRAPHICS_API_D3D11}>:XR_USE_GRAPHICS_API_D3D11=1>
        $<$<BOOL:${XR_USE_GRAPHICS_API_D3D12}>:XR_USE_GRAPHICS_API_D3D12=1>
        $<$<BOOL:${XR_USE_PLATFORM_WIN32}>:XR_USE_PLATFORM_WIN32=1>
        $<$<BOOL:${XR_USE_PLATFORM_ANDROID}>:XR_USE_PLATFORM_ANDROID=1>
        $<$<BOOL:${XR_USE_PLATFORM_XLIB}>:XR_USE_PLATFORM_XLIB=1>
        $<$<BOOL:${XR_USE_PLATFORM_XCB}>:XR_USE_PLATFORM_XCB=1>
        $<$<BOOL:${XR_USE_PLATFORM_WAYLAND}>:XR_USE_PLATFORM_WAYLAND=1>
    )
endfunction()

set(XR_EXTERNAL_LIBS)
set(XR_EXTERNAL_INCLUDES)
set(XR_EXTERNAL_SOURCES)

list(APPEND XR_EXTERNAL_INCLUDES
        ${XR_COMMON_PATH}
        ${XR_COMMON_PATH}/include
        ${COCOS_X_PATH}/../native/cocos/platform/interfaces/modules
)

if(BUILD_FOR_CC)
    list(APPEND XR_EXTERNAL_INCLUDES ${XR_COMMON_PATH}/cocos)
endif()

set(XR_OEM_LOADER_NAME openxr_loader)
if(XR_OEM_META)
    set(XR_OEM_FOLDER meta)
    set(XR_FOLDER meta)
elseif(XR_OEM_HUAWEIVR)
    set(XR_OEM_FOLDER huaweivr)
    set(XR_OEM_LOADER_NAME xr_loader)
    set(XR_FOLDER huaweivr)
elseif(XR_OEM_PICO)
    set(XR_OEM_FOLDER pico)
    set(XR_FOLDER pico)
elseif(XR_OEM_ROKID)
    set(XR_OEM_FOLDER rokid)
    set(XR_FOLDER rokid)
elseif(XR_OEM_SEED)
    set(XR_OEM_FOLDER seed)
    set(XR_FOLDER seed)
elseif(XR_OEM_SNAPDRAGON_SPACES)
    set(XR_OEM_FOLDER spaces)
    set(XR_FOLDER spaces)
elseif(XR_OEM_GSXR)
    set(XR_OEM_FOLDER gsxr)
    set(XR_FOLDER gsxr)
    set(XR_OEM_LOADER_NAME gsxr_loader)
elseif(XR_OEM_YVR)
    set(XR_OEM_FOLDER yvr)
    set(XR_FOLDER yvr)
else()
    set(XR_OEM_FOLDER monado)
    set(XR_FOLDER monado)
endif()

if(NOT XR_OEM_SEED)
    add_library(openxr SHARED IMPORTED GLOBAL)
    set_target_properties(openxr PROPERTIES
        IMPORTED_LOCATION ${XR_LIBRARY_PATH}/xr-${XR_OEM_FOLDER}/libs/android/${ANDROID_ABI}/lib${XR_OEM_LOADER_NAME}.so
    )

    list(APPEND XR_EXTERNAL_LIBS
        openxr
    )
else()
    add_library(stereoRectifyWrapper SHARED IMPORTED)
    set_target_properties(stereoRectifyWrapper PROPERTIES
        IMPORTED_LOCATION ${XR_LIBRARY_PATH}/xr-${XR_OEM_FOLDER}/libs/android/${ANDROID_ABI}/libStereoRectifyWrapper.so
    )

    add_library(sxrApi SHARED IMPORTED)
    set_target_properties(sxrApi PROPERTIES
        IMPORTED_LOCATION ${XR_LIBRARY_PATH}/xr-${XR_OEM_FOLDER}/libs/android/${ANDROID_ABI}/libsxrapi.so
    )
    list(APPEND XR_EXTERNAL_LIBS
        stereoRectifyWrapper
        sxrApi
    )
endif()

# need to be compiled by the xr library
list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/include/Xr.h)
list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/include/XrExtension.h)

if(BUILD_XR_NATIVE)
    include(${COCOS_X_PATH}/../../CCOpenXR/internal/CMakeLists.txt)
else()
    if(BUILD_SHARED_XR)
        add_library(xr SHARED IMPORTED GLOBAL)
        set_target_properties(xr PROPERTIES
            IMPORTED_LOCATION ${XR_LIBRARY_PATH}/xr-${XR_FOLDER}/libs/android/${ANDROID_ABI}/libxr.so
        )
    else()
        add_library(xr STATIC IMPORTED GLOBAL)
        set_target_properties(xr PROPERTIES
            IMPORTED_LOCATION ${XR_LIBRARY_PATH}/xr-${XR_FOLDER}/libs/android/${ANDROID_ABI}/libxr.a
        )
    endif()

    set_property(TARGET xr APPEND PROPERTY
        INTERFACE_INCLUDE_DIRECTORIES ${XR_EXTERNAL_INCLUDES}
    )

    target_link_libraries(xr INTERFACE
        ${XR_EXTERNAL_LIBS}
    )
endif()

# need to be compiled by the cc library
list(APPEND XR_LIBS xr)
list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/cocos/bindings/auto/jsb_xr_auto.cpp)
list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/cocos/bindings/auto/jsb_xr_auto.h)
list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/cocos/bindings/auto/jsb_xr_extension_auto.cpp)
list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/cocos/bindings/auto/jsb_xr_extension_auto.h)
