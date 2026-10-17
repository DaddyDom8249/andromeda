import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, Vector3, type Group, type Mesh, type PointLight } from "three";
import { THEME } from "../theme.ts";
import { installInput } from "../world/input.ts";
import {
  BRIDGES,
  DEPOSITS,
  GROUND_Y,
  ISLANDS,
  PICKUP_RADIUS,
  ROCKS,
  VENTS,
  type DepositKind,
} from "../world/layout.ts";
import {
  getDeposits,
  getFlash,
  getPlayer,
  getView,
  installProbe,
  stepWorld,
} from "../world/sim.ts";
import { Cavern, CoreLights, Embers, Lava } from "./environment.tsx";

const KIND_COLOR: Record<DepositKind, string> = {
  crystal: THEME.accent,
  ore: THEME.hot,
  ember: THEME.primary,
};

export function WorldDriver() {
  useEffect(() => {
    installInput();
    installProbe();
  }, []);
  useFrame((_, delta) => {
    stepWorld(delta);
  }, -20);
  return null;
}

export function ChaseCamera() {
  const camera = useThree((state) => state.camera);
  const desired = useRef(new Vector3());
  const look = useRef(new Vector3());
  useFrame((_, delta) => {
    const player = getPlayer();
    const view = getView();
    const dist = 12;
    const horiz = Math.cos(view.pitch) * dist;
    desired.current.set(
      player.x + Math.sin(view.yaw) * horiz,
      GROUND_Y + 1.35 + Math.sin(view.pitch) * dist,
      player.z + Math.cos(view.yaw) * horiz,
    );
    const blend = 1 - Math.exp(-8 * delta);
    camera.position.lerp(desired.current, blend);
    look.current.set(player.x, GROUND_Y + 1.15, player.z);
    camera.lookAt(look.current);
  });
  return null;
}

export function Crust() {
  return (
    <group>
      {ISLANDS.map((isle) => (
        <mesh
          key={`${isle.x}-${isle.z}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[isle.x, GROUND_Y, isle.z]}
        >
          <circleGeometry args={[isle.r, 40]} />
          <meshBasicMaterial color={THEME.muted} side={DoubleSide} />
        </mesh>
      ))}
      {BRIDGES.map((bridge) => (
        <mesh key={`${bridge.x}-${bridge.z}`} position={[bridge.x, GROUND_Y, bridge.z]}>
          <boxGeometry args={[bridge.hx * 2, 0.18, bridge.hz * 2]} />
          <meshBasicMaterial color={THEME.muted} side={DoubleSide} />
        </mesh>
      ))}
      {ROCKS.map((rock) => (
        <mesh key={`${rock.x}-${rock.z}`} position={[rock.x, GROUND_Y + rock.r * 0.55, rock.z]}>
          <dodecahedronGeometry args={[rock.r, 0]} />
          <meshBasicMaterial color={THEME.rock} />
        </mesh>
      ))}
      {VENTS.map((vent) => (
        <Vent key={`${vent.x}-${vent.z}`} x={vent.x} z={vent.z} r={vent.r} />
      ))}
    </group>
  );
}

function Vent({ x, z, r }: { x: number; z: number; r: number }) {
  const jet = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = jet.current;
    if (!mesh) return;
    const surge = 0.35 + Math.pow(Math.max(0, Math.sin(clock.elapsedTime * 1.3 + x)), 2) * r * 2.4;
    mesh.scale.y = surge;
    mesh.position.y = GROUND_Y + surge * 0.5;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x, GROUND_Y + 0.04, z]}>
        <ringGeometry args={[r * 0.72, r, 20]} />
        <meshBasicMaterial color={THEME.primary} side={DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh ref={jet} position={[x, GROUND_Y, z]}>
        <cylinderGeometry args={[0.12, r * 0.45, 1, 8]} />
        <meshBasicMaterial color={THEME.primary} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export function Deposits() {
  const spots = useMemo(() => DEPOSITS, []);
  return (
    <group>
      {spots.map((spot) => (
        <Deposit key={spot.id} id={spot.id} />
      ))}
      <PickupFlash />
    </group>
  );
}

function Deposit({ id }: { id: number }) {
  const group = useRef<Group>(null);
  const spin = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const root = group.current;
    const mesh = spin.current;
    if (!root || !mesh) return;
    const deposit = getDeposits().find((item) => item.id === id);
    if (!deposit) return;
    root.visible = !deposit.taken;
    const bob = Math.sin(clock.elapsedTime * 2.1 + id) * 0.12;
    root.position.y = GROUND_Y + 1.15 + bob;
    mesh.rotation.y = clock.elapsedTime * 0.7 + id;
  });
  const spot = DEPOSITS.find((item) => item.id === id)!;
  return (
    <group ref={group} position={[spot.x, GROUND_Y + 1.15, spot.z]}>
      <mesh ref={spin} scale={spot.kind === "ore" ? 0.72 : 0.86}>
        <octahedronGeometry args={[0.62, 0]} />
        <meshBasicMaterial color={KIND_COLOR[spot.kind]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]}>
        <ringGeometry args={[0.55, 0.78, 20]} />
        <meshBasicMaterial color={KIND_COLOR[spot.kind]} side={DoubleSide} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function PickupFlash() {
  const mesh = useRef<Mesh>(null);
  useFrame(() => {
    const flash = getFlash();
    const node = mesh.current;
    if (!node) return;
    if (!flash) {
      node.visible = false;
      return;
    }
    node.visible = true;
    const grow = 1 - flash.life / 0.38;
    node.position.set(flash.x, GROUND_Y + 0.8 + grow * 1.4, flash.z);
    node.scale.setScalar(0.4 + grow * 1.6);
    const material = node.material;
    if (!Array.isArray(material)) material.opacity = Math.max(0, flash.life / 0.38);
  });
  return (
    <mesh ref={mesh} visible={false}>
      <sphereGeometry args={[0.45, 12, 10]} />
      <meshBasicMaterial color={THEME.hot} transparent opacity={0.8} />
    </mesh>
  );
}

export function Explorer() {
  const group = useRef<Group>(null);
  const lamp = useRef<PointLight>(null);
  useFrame(({ clock }) => {
    const root = group.current;
    if (!root) return;
    const player = getPlayer();
    const stride = player.speed > 0.4 ? Math.sin(clock.elapsedTime * 11) * 0.07 : 0;
    root.position.set(player.x, GROUND_Y + stride, player.z);
    root.rotation.y = player.yaw + Math.PI;
    lamp.current?.position.set(player.x, GROUND_Y + 1.6, player.z);
  });
  return (
    <group>
      <pointLight ref={lamp} color={THEME.accent} intensity={8} distance={9} decay={2} />
      <group ref={group}>
        <mesh position={[0, 0.42, 0]}>
          <capsuleGeometry args={[0.28, 0.46, 4, 8]} />
          <meshBasicMaterial color={THEME.fg} />
        </mesh>
        <mesh position={[0, 0.92, 0]}>
          <sphereGeometry args={[0.26, 12, 10]} />
          <meshBasicMaterial color={THEME.hot} />
        </mesh>
        <mesh position={[0, 0.9, 0.2]}>
          <boxGeometry args={[0.28, 0.1, 0.06]} />
          <meshBasicMaterial color={THEME.accent} />
        </mesh>
        <mesh position={[0, 0.55, -0.22]}>
          <boxGeometry args={[0.22, 0.28, 0.16]} />
          <meshBasicMaterial color={THEME.primary} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[PICKUP_RADIUS - 0.08, PICKUP_RADIUS, 40]} />
          <meshBasicMaterial color={THEME.accent} side={DoubleSide} transparent opacity={0.28} />
        </mesh>
      </group>
    </group>
  );
}

export function Reach() {
  return (
    <>
      <color attach="background" args={[THEME.bg]} />
      <fog attach="fog" args={[THEME.fog, 20, 72]} />
      <WorldDriver />
      <ChaseCamera />
      <CoreLights />
      <Cavern />
      <Lava />
      <Embers />
      <Crust />
      <Deposits />
      <Explorer />
    </>
  );
}
