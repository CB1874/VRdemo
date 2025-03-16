import { _decorator, ccenum } from 'cc';

export enum CxrLayerType {
    Underlay,
    Overlay
}
ccenum(CxrLayerType);

export enum CxrShapeType {
    Quad,
    Cylinder,
    /*Equirect,
    Cubemap*/
}
ccenum(CxrShapeType);

export enum CxrLockType {
    WorldLock,
    HeadLock
}
ccenum(CxrLockType);

export enum CxrTextureType {
    Static,
    Dynamic
}
ccenum(CxrTextureType);
