import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Fog, MOUSE, TOUCH, Vector3, type PerspectiveCamera } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { setCameraSnap } from "../runtime.ts";
import { THEME } from "../theme.ts";

export function CameraRig() {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const size = useThree((state) => state.size);
  const controlsRef = useRef<OrbitControls | null>(null);
  const framedAspect = useRef(0);

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controlsRef.current = controls;
    gl.domElement.style.touchAction = "none";
    return () => {
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  useEffect(() => {
    const controls = controlsRef.current;
    const cam = camera as PerspectiveCamera;
    if (!controls || size.width < 2 || size.height < 2) return;
    const aspect = size.width / size.height;
    if (framedAspect.current && Math.abs(framedAspect.current - aspect) < 0.08) return;
    framedAspect.current = aspect;
    const vFov = (cam.fov * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const span = 44;
    const dist = Math.max(span / 2 / Math.tan(vFov / 2), span / 2 / Math.tan(hFov / 2));
    const phi = 0.84;
    const theta = 0.58;
    const target = new Vector3(0, 1.3, 0);
    cam.position.set(
      target.x + dist * Math.sin(phi) * Math.sin(theta),
      target.y + dist * Math.cos(phi),
      target.z + dist * Math.sin(phi) * Math.cos(theta),
    );
    cam.near = 0.1;
    cam.far = Math.max(480, dist * 6);
    cam.updateProjectionMatrix();
    controls.target.copy(target);
    controls.minDistance = dist * 0.36;
    controls.maxDistance = dist * 1.18;
    controls.minPolarAngle = 0.32;
    controls.maxPolarAngle = 1.16;
    controls.enableDamping = true;
    controls.dampingFactor = 0.09;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.enableRotate = true;
    controls.screenSpacePanning = true;
    controls.zoomSpeed = 0.85;
    controls.rotateSpeed = 0.7;
    controls.panSpeed = 0.75;
    controls.touches.ONE = TOUCH.ROTATE;
    controls.touches.TWO = TOUCH.DOLLY_PAN;
    controls.mouseButtons.LEFT = MOUSE.ROTATE;
    controls.mouseButtons.MIDDLE = MOUSE.DOLLY;
    controls.mouseButtons.RIGHT = MOUSE.PAN;
    controls.update();
    scene.fog = new Fog(THEME.fog, dist * 0.85, dist * 3.8);
  }, [camera, scene, size.height, size.width]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.update(Math.min(delta, 0.1));
    setCameraSnap({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      tx: controls.target.x,
      ty: controls.target.y,
      tz: controls.target.z,
      touchOne: controls.touches.ONE,
      touchTwo: controls.touches.TWO,
      mouseLeft: controls.mouseButtons.LEFT,
      mouseRight: controls.mouseButtons.RIGHT,
      mouseMiddle: controls.mouseButtons.MIDDLE,
    });
  });

  return null;
}
