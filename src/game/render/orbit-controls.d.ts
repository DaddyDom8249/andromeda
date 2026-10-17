declare module "three/examples/jsm/controls/OrbitControls.js" {
  import { Camera, Vector3 } from "three";

  export class OrbitControls {
    constructor(camera: Camera, domElement?: HTMLElement);
    enabled: boolean;
    target: Vector3;
    enableDamping: boolean;
    dampingFactor: number;
    enablePan: boolean;
    enableZoom: boolean;
    enableRotate: boolean;
    screenSpacePanning: boolean;
    zoomSpeed: number;
    rotateSpeed: number;
    panSpeed: number;
    minDistance: number;
    maxDistance: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    touches: { ONE: number; TWO: number };
    mouseButtons: { LEFT: number; MIDDLE: number; RIGHT: number };
    update(delta?: number | null): boolean;
    dispose(): void;
    domElement: HTMLElement | null;
  }
}
