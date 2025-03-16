
if(USE_XR)
    if(ANDROID)
        include(${XR_COMMON_PATH}/android/xr.cmake)
    endif()
endif()

if(USE_AR_MODULE)
    if(ANDROID)
        add_library(libAR STATIC IMPORTED GLOBAL)
        set_target_properties(libAR PROPERTIES
            IMPORTED_LOCATION ${XR_COMMON_PATH}/android/${ANDROID_ABI}/ar/libar.a
        )
    elseif(APPLE AND IOS)
        add_library(libAR STATIC IMPORTED GLOBAL)
        set_target_properties(libAR PROPERTIES
            IMPORTED_LOCATION ${XR_COMMON_PATH}/ios/ar/libar.a
        )
    endif()

    if(ANDROID OR (APPLE AND IOS))
        set(AR_INCLUDES)
        list(APPEND AR_INCLUDES
            ${XR_COMMON_PATH}
            ${XR_COMMON_PATH}/cocos
            ${XR_COMMON_PATH}/include
        )
        set_property(TARGET libAR APPEND PROPERTY
            INTERFACE_INCLUDE_DIRECTORIES ${AR_INCLUDES}
        )

        list(APPEND XR_LIBS libAR)
        list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/include/ar/ARModule.h)
        list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/cocos/bindings/auto/jsb_ar_auto.cpp)
        list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/cocos/bindings/auto/jsb_ar_auto.h)
        list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/cocos/bindings/manual/jsb_ar_manual.cpp)
        list(APPEND XR_COMMON_SOURCES ${XR_COMMON_PATH}/cocos/bindings/manual/jsb_ar_manual.h)
    endif()
endif()
