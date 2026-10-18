import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import { useHud } from "../hud-store.ts";
import { getDrops, tryCollectDrop } from "../runtime.ts";
import { THEME } from "../theme.ts";

/** Click/tap the glowing core left where a crawler died to claim its reward. */
export function Loot() {
  const ids = useHud((state) => state.dropIds);
  return (
    <group>
      {ids.map((id) => <LootOrb key={id} id={id} />)}
    </group>
  );
}

function LootOrb({ id }: { id: number }) {
  const root = useRef<Group>(null);
  const drop = getDrops().find((item) => item.id === id);
  useFrame(({ clock }) => {
    if (!root.current) return;
    root.current.rotation.y += 0.014;
    root.current.position.y = (drop?.y ?? 0) + Math.sin(clock.elapsedTime * 2 + id) * 0.14;
  });
  if (!drop) return null;
  return (
    <group
      ref={root}
      position={[drop.x, drop.y, drop.z]}
      onClick={(event) => {
        event.stopPropagation();
        tryCollectDrop(id);
      }}
    >
      <mesh>
        <sphereGeometry args={[1.1, 14, 10]} />
        <meshBasicMaterial color={THEME.hot} transparent opacity={0.1} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.25, 0.35, 0.15]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial color={THEME.accent} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.75, 0.08, 8, 24]} />
        <meshBasicMaterial color={THEME.hot} toneMapped={false} />
      </mesh>
    </group>
  );
}
