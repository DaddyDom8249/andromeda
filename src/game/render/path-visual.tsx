import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Object3D,
} from "three";
import { dist, lerp } from "../math/vec3.ts";
import { samplePoly, type PolyPath } from "../paths/sample.ts";
import { THEME } from "../theme.ts";

export function PathVisual({ path }: { path: PolyPath }) {
  const segments = Math.max(1, path.points.length - 1);
  const stoneRef = useRef<InstancedMesh>(null);
  const stripRef = useRef<InstancedMesh>(null);
  const jointRef = useRef<InstancedMesh>(null);
  const pillarRef = useRef<InstancedMesh>(null);
  const chevronRef = useRef<InstancedMesh>(null);

  const stoneGeo = useMemo(() => new BoxGeometry(3.15, 0.38, 1), []);
  const stripGeo = useMemo(() => new BoxGeometry(0.28, 0.08, 1), []);
  const jointGeo = useMemo(() => new CylinderGeometry(1.55, 1.55, 0.38, 10), []);
  const pillarGeo = useMemo(() => new CylinderGeometry(0.42, 0.55, 1, 7), []);
  const chevronGeo = useMemo(() => {
    const geo = new ConeGeometry(0.26, 0.62, 5);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);
  const deckMat = useMemo(
    () => new MeshLambertMaterial({ color: "#3a221c" }),
    [],
  );
  const stripMat = useMemo(
    () => new MeshBasicMaterial({ color: THEME.accent, toneMapped: false }),
    [],
  );
  const jointMat = useMemo(
    () => new MeshLambertMaterial({ color: "#4a2c22", emissive: THEME.primary, emissiveIntensity: 0.18 }),
    [],
  );
  const pillarMat = useMemo(
    () => new MeshLambertMaterial({ color: "#1a100c" }),
    [],
  );
  const chevronMat = useMemo(
    () => new MeshBasicMaterial({ color: THEME.primary, toneMapped: false }),
    [],
  );

  const chevrons = useMemo(() => {
    const marks = [];
    for (let d = 2.8; d < path.totalLength - 2.8; d += 3.5) {
      const sample = samplePoly(path, d);
      marks.push(sample);
    }
    return marks;
  }, [path]);
  const pillars = useMemo(() => path.points.filter((_, index) => index % 3 === 0), [path]);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const stones = stoneRef.current;
    const strips = stripRef.current;
    const joints = jointRef.current;
    const pillarMesh = pillarRef.current;
    const chevronMesh = chevronRef.current;
    if (!stones || !strips || !joints || !pillarMesh || !chevronMesh) return;

    for (let i = 0; i < path.points.length - 1; i++) {
      const a = path.points[i]!;
      const b = path.points[i + 1]!;
      const length = Math.max(0.05, dist(a, b));
      const mid = lerp(a, b, 0.5);
      dummy.position.set(mid[0], mid[1], mid[2]);
      dummy.scale.set(1, 1, length);
      dummy.lookAt(b[0], b[1], b[2]);
      dummy.updateMatrix();
      stones.setMatrixAt(i, dummy.matrix);
      dummy.position.y += 0.24;
      dummy.updateMatrix();
      strips.setMatrixAt(i, dummy.matrix);
    }
    stones.instanceMatrix.needsUpdate = true;
    strips.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < path.points.length; i++) {
      const point = path.points[i]!;
      dummy.position.set(point[0], point[1], point[2]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      joints.setMatrixAt(i, dummy.matrix);
    }
    joints.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < pillars.length; i++) {
      const point = pillars[i]!;
      const height = Math.max(0.25, point[1]);
      dummy.position.set(point[0], height * 0.5, point[2]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      pillarMesh.setMatrixAt(i, dummy.matrix);
    }
    pillarMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < chevrons.length; i++) {
      const mark = chevrons[i]!;
      dummy.position.set(mark.position[0], mark.position[1] + 0.5, mark.position[2]);
      dummy.scale.set(1.15, 1.15, 1.15);
      dummy.lookAt(
        mark.position[0] + mark.tangent[0],
        mark.position[1] + 0.5 + mark.tangent[1],
        mark.position[2] + mark.tangent[2],
      );
      dummy.updateMatrix();
      chevronMesh.setMatrixAt(i, dummy.matrix);
    }
    chevronMesh.instanceMatrix.needsUpdate = true;
  }, [chevrons, path, pillars]);

  return (
    <group>
      <instancedMesh ref={pillarRef} args={[pillarGeo, pillarMat, pillars.length]} frustumCulled={false} />
      <instancedMesh ref={stoneRef} args={[stoneGeo, deckMat, segments]} frustumCulled={false} />
      <instancedMesh ref={jointRef} args={[jointGeo, jointMat, path.points.length]} frustumCulled={false} />
      <instancedMesh ref={stripRef} args={[stripGeo, stripMat, segments]} frustumCulled={false} />
      <instancedMesh
        ref={chevronRef}
        args={[chevronGeo, chevronMat, Math.max(1, chevrons.length)]}
        frustumCulled={false}
      />
    </group>
  );
}
