import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Mesh } from "three";
import { useHud } from "../hud-store.ts";
import { samplePoly } from "../paths/sample.ts";
import { getActivePath, getEnemies, tryPlace } from "../runtime.ts";
import { THEME } from "../theme.ts";
import { buildPads, SPIRE, type BuildPad } from "../towers/spire.ts";

export function Towers() {
  const path = useMemo(() => getActivePath(), []);
  const pads = useMemo(() => buildPads(path), [path]);
  const built = useHud((state) => state.built);
  return (
    <group>
      {pads.map((pad, index) =>
        built.includes(index) ? (
          <Spire key={index} pad={pad} />
        ) : (
          <mesh
            key={index}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[pad.x, pad.y + 0.2, pad.z]}
            onClick={(event) => {
              event.stopPropagation();
              tryPlace(index);
            }}
          >
            <circleGeometry args={[1.7, 24]} />
            <meshBasicMaterial color={THEME.accent} transparent opacity={0.45} depthWrite={false} />
          </mesh>
        ),
      )}
    </group>
  );
}

function Spire({ pad }: { pad: BuildPad }) {
  const path = useMemo(() => getActivePath(), []);
  const beam = useRef<Mesh>(null);
  useFrame(() => {
    const mesh = beam.current;
    if (!mesh) return;
    let aimX = 0;
    let aimY = 0;
    let aimZ = 0;
    let lead = -1;
    for (const enemy of getEnemies()) {
      const at = samplePoly(path, enemy.distance).position;
      if (Math.hypot(at[0] - pad.x, at[2] - pad.z) > SPIRE.range) continue;
      if (enemy.distance <= lead) continue;
      lead = enemy.distance;
      aimX = at[0];
      aimY = at[1];
      aimZ = at[2];
    }
    if (lead < 0) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    mesh.position.set((pad.x + aimX) / 2, (pad.y + aimY) / 2 + 0.7, (pad.z + aimZ) / 2);
    mesh.lookAt(aimX, aimY + 0.6, aimZ);
    mesh.scale.z = Math.max(0.2, Math.hypot(pad.x - aimX, pad.z - aimZ));
  });
  return (
    <group position={[pad.x, pad.y, pad.z]}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.55, 0.8, 0.7, 8]} />
        <meshBasicMaterial color="#3a221c" />
      </mesh>
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.22, 0.34, 1.5, 8]} />
        <meshBasicMaterial color={THEME.primary} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshBasicMaterial color={THEME.hot} />
      </mesh>
      <mesh ref={beam}>
        <boxGeometry args={[0.08, 0.08, 1]} />
        <meshBasicMaterial color={THEME.hot} />
      </mesh>
    </group>
  );
}
