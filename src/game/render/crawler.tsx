import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group, Mesh, Quaternion, Vector3 } from "three";
import { useHud } from "../hud-store.ts";
import { samplePoly } from "../paths/sample.ts";
import { getActivePath, getEnemy } from "../runtime.ts";
import { THEME } from "../theme.ts";

const lookTarget = new Vector3();
const savedQuat = new Quaternion();
const destQuat = new Quaternion();

const LEGS = [
  { x: 0.78, z: 0.55, phase: 0 },
  { x: -0.78, z: 0.55, phase: Math.PI },
  { x: 0.86, z: 0.02, phase: Math.PI },
  { x: -0.86, z: 0.02, phase: 0 },
  { x: 0.72, z: -0.52, phase: 0.6 },
  { x: -0.72, z: -0.52, phase: Math.PI + 0.6 },
];

export function Crawlers() {
  const roster = useHud((state) => state.roster);
  return (
    <group>
      {roster.map((id) => (
        <MagmaCrawler key={id} id={id} />
      ))}
    </group>
  );
}

function MagmaCrawler({ id }: { id: number }) {
  const path = useMemo(() => getActivePath(), []);
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const legs = useRef<(Group | null)[]>([]);
  const fill = useRef<Mesh>(null);

  useFrame((_, delta) => {
    const enemy = getEnemy(id);
    const rig = root.current;
    if (!enemy || !rig) return;
    const step = Math.min(delta, 0.1);
    const sample = samplePoly(path, enemy.distance);
    const stride = enemy.distance * 6.4;
    const bob = Math.abs(Math.sin(stride)) * 0.07;
    rig.position.set(sample.position[0], sample.position[1] + 0.22 + bob, sample.position[2]);
    lookTarget.set(
      sample.position[0] + sample.tangent[0],
      sample.position[1] + 0.22 + sample.tangent[1] * 0.35,
      sample.position[2] + sample.tangent[2],
    );
    savedQuat.copy(rig.quaternion);
    rig.lookAt(lookTarget);
    destQuat.copy(rig.quaternion);
    rig.quaternion.copy(savedQuat);
    rig.quaternion.slerp(destQuat, 1 - Math.exp(-12 * step));
    if (body.current) body.current.rotation.z = Math.sin(stride) * 0.08;
    legs.current.forEach((leg, index) => {
      if (!leg) return;
      const sign = index % 2 === 0 ? 1 : -1;
      leg.rotation.x = Math.sin(stride + LEGS[index]!.phase) * sign * 0.7;
    });
    if (fill.current) {
      const ratio = enemy.maxHealth <= 0 ? 0 : Math.max(0, enemy.health / enemy.maxHealth);
      fill.current.scale.x = Math.max(0.001, ratio);
      fill.current.position.x = (ratio - 1) * 1.15;
    }
  });

  return (
    <group ref={root}>
      <group ref={body} position={[0, 0.78, 0]}>
        <mesh scale={[1.2, 0.62, 1.55]}>
          <sphereGeometry args={[0.62, 16, 12]} />
          <meshLambertMaterial color="#4a2418" emissive={THEME.primary} emissiveIntensity={0.45} />
        </mesh>
        <mesh position={[0, 0.28, -0.1]} scale={[0.7, 0.18, 0.9]}>
          <boxGeometry args={[1, 0.4, 1.2]} />
          <meshLambertMaterial color="#2a140e" />
        </mesh>
        <mesh position={[0, 0.05, 0.15]} scale={[0.55, 0.12, 1.1]}>
          <boxGeometry args={[0.2, 0.2, 1]} />
          <meshBasicMaterial color={THEME.primary} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.12, 0.95]}>
          <sphereGeometry args={[0.34, 12, 10]} />
          <meshLambertMaterial color="#5a2a1c" emissive={THEME.primary} emissiveIntensity={0.55} />
        </mesh>
        <mesh position={[0.16, 0.2, 1.18]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color={THEME.hot} toneMapped={false} />
        </mesh>
        <mesh position={[-0.16, 0.2, 1.18]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color={THEME.hot} toneMapped={false} />
        </mesh>
        <mesh position={[0.18, -0.02, 1.15]} rotation={[0.6, 0, -0.5]}>
          <coneGeometry args={[0.06, 0.28, 5]} />
          <meshLambertMaterial color="#1a0c09" />
        </mesh>
        <mesh position={[-0.18, -0.02, 1.15]} rotation={[0.6, 0, 0.5]}>
          <coneGeometry args={[0.06, 0.28, 5]} />
          <meshLambertMaterial color="#1a0c09" />
        </mesh>
        <mesh position={[0, 0.1, -1.05]}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color={THEME.accent} toneMapped={false} />
        </mesh>
        {LEGS.map((leg, index) => (
          <group
            key={index}
            ref={(node) => {
              legs.current[index] = node;
            }}
            position={[leg.x, -0.15, leg.z]}
          >
            <mesh position={[0, -0.32, 0]}>
              <boxGeometry args={[0.12, 0.62, 0.12]} />
              <meshLambertMaterial color="#140c0a" />
            </mesh>
          </group>
        ))}
      </group>
      <Billboard position={[0, 2.15, 0]}>
        <mesh>
          <planeGeometry args={[2.5, 0.28]} />
          <meshBasicMaterial color="#140c0a" />
        </mesh>
        <mesh ref={fill} position={[0, 0, 0.02]}>
          <planeGeometry args={[2.3, 0.14]} />
          <meshBasicMaterial color={THEME.primary} toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}
