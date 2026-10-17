import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Points,
  ShaderMaterial,
  type Mesh,
} from "three";
import type { SceneryProp } from "../maps/types.ts";
import { useHud } from "../hud-store.ts";
import { tryCollectCrystal } from "../runtime.ts";
import { THEME } from "../theme.ts";
import { fallFragment, fallVertex, lavaFragment, lavaVertex } from "./shaders.ts";

function mulberry(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Lava() {
  const material = useRef<ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime!.value = clock.elapsedTime;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[260, 260, 1, 1]} />
        <meshBasicMaterial color={THEME.primary} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[260, 260, 36, 36]} />
        <shaderMaterial
          ref={material}
          vertexShader={lavaVertex}
          fragmentShader={lavaFragment}
          uniforms={{ uTime: { value: 0 } }}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function Cavern() {
  const teeth = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * Math.PI * 2 + 0.25;
        const radius = 28 + (i % 3) * 2.2;
        return {
          position: [Math.cos(angle) * radius, 18, Math.sin(angle) * radius] as const,
          scale: 0.75 + (i % 4) * 0.22,
        };
      }),
    [],
  );
  return (
    <group>
      <mesh>
        <sphereGeometry args={[180, 28, 16]} />
        <meshBasicMaterial color="#100705" side={BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[36, 90, 72]} />
        <meshBasicMaterial color="#1c100c" side={DoubleSide} />
      </mesh>
      {teeth.map((tooth, index) => (
        <mesh key={index} position={tooth.position} rotation={[Math.PI, 0, 0]} scale={tooth.scale}>
          <coneGeometry args={[0.9, 6.2, 5]} />
          <meshBasicMaterial color="#241410" />
        </mesh>
      ))}
    </group>
  );
}

export function Embers() {
  const count = 90;
  const points = useRef<Points>(null);
  const speeds = useMemo(() => {
    const rand = mulberry(11);
    return Float32Array.from({ length: count }, () => 0.7 + rand() * 1.6);
  }, []);
  const geometry = useMemo(() => {
    const rand = mulberry(5);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 64;
      positions[i * 3 + 1] = rand() * 11;
      positions[i * 3 + 2] = (rand() - 0.5) * 64;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(positions, 3));
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    const cloud = points.current;
    if (!cloud) return;
    const step = Math.min(delta, 0.1);
    const attr = cloud.geometry.getAttribute("position") as BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = attr.getY(i) + speeds[i]! * step;
      if (y > 13) {
        y = 0.2;
        attr.setX(i, (Math.random() - 0.5) * 64);
        attr.setZ(i, (Math.random() - 0.5) * 64);
      }
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color={THEME.accent}
        size={2.6}
        sizeAttenuation={false}
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}

function FloatRock({ prop }: { prop: SceneryProp }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    mesh.position.y = prop.position[1] + Math.sin(t * 0.42 + prop.phase) * 0.5;
    mesh.rotation.y = t * 0.1 + prop.phase;
  });
  return (
    <mesh
      ref={ref}
      position={[prop.position[0], prop.position[1], prop.position[2]]}
      scale={prop.scale}
    >
      <dodecahedronGeometry args={[1.05, 0]} />
      <meshLambertMaterial color="#5a3a2e" emissive="#3a140c" emissiveIntensity={0.25} flatShading />
    </mesh>
  );
}

function Crystal({ prop, index }: { prop: SceneryProp; index: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.rotation.y = clock.elapsedTime * 0.25 + prop.phase;
  });
  return (
    <group
      position={[prop.position[0], prop.position[1], prop.position[2]]}
      onClick={(event) => {
        event.stopPropagation();
        tryCollectCrystal(index);
      }}
    >
      <mesh>
        <sphereGeometry args={[1.6 * prop.scale, 12, 8]} />
        <meshBasicMaterial color={THEME.accent} transparent opacity={0.08} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -prop.position[1] + 0.18, 0]}>
        <ringGeometry args={[0.95, 1.2, 24]} />
        <meshBasicMaterial color={THEME.accent} transparent opacity={0.85} depthWrite={false} side={DoubleSide} />
      </mesh>
      <mesh ref={ref} scale={prop.scale}>
        <octahedronGeometry args={[0.85, 0]} />
        <meshBasicMaterial color={THEME.accent} />
      </mesh>
      <mesh rotation={[0.4, 0.8, 0.2]} scale={prop.scale * 0.55} position={[0.4, -0.2, 0.2]}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial color={THEME.hot} />
      </mesh>
    </group>
  );
}

function Geyser({ prop }: { prop: SceneryProp }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const surge = Math.pow(Math.max(0, Math.sin(clock.elapsedTime * 0.9 + prop.phase)), 2);
    const height = 0.4 + surge * 3.6 * prop.scale;
    mesh.scale.y = height;
    mesh.position.y = height * 0.5;
  });
  return (
    <mesh ref={ref} position={[prop.position[0], 0.2, prop.position[2]]}>
      <cylinderGeometry args={[0.14 * prop.scale, 0.4 * prop.scale, 1, 8]} />
      <meshBasicMaterial color={THEME.primary} toneMapped={false} />
    </mesh>
  );
}

function LavaFall({ prop }: { prop: SceneryProp }) {
  const material = useRef<ShaderMaterial>(null);
  const mesh = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime!.value = clock.elapsedTime + prop.phase;
    mesh.current?.lookAt(0, prop.position[1], 0);
  });
  return (
    <mesh ref={mesh} position={[prop.position[0], prop.position[1], prop.position[2]]}>
      <planeGeometry args={[3.2 * prop.scale, 9, 1, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={fallVertex}
        fragmentShader={fallFragment}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        side={DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function Isle({ prop }: { prop: SceneryProp }) {
  return (
    <mesh
      position={[prop.position[0], 0.18, prop.position[2]]}
      scale={[prop.scale, 0.32, prop.scale]}
    >
      <cylinderGeometry args={[1.15, 1.55, 1, 7]} />
      <meshBasicMaterial color="#2a1812" />
    </mesh>
  );
}

export function Scenery({ props }: { props: SceneryProp[] }) {
  const harvested = useHud((state) => state.crystalIds);
  return (
    <group>
      {props.map((prop, index) => {
        if (prop.kind === "rock") return <FloatRock key={index} prop={prop} />;
        if (prop.kind === "crystal") {
          return harvested.includes(index) ? null : <Crystal key={index} prop={prop} index={index} />;
        }
        if (prop.kind === "geyser") return <Geyser key={index} prop={prop} />;
        if (prop.kind === "fall") return <LavaFall key={index} prop={prop} />;
        return <Isle key={index} prop={prop} />;
      })}
    </group>
  );
}

export function CoreLights() {
  return (
    <group>
      <ambientLight color="#ffb080" intensity={0.9} />
      <directionalLight position={[18, 36, 12]} color="#ffe0c2" intensity={1.6} />
      <hemisphereLight args={["#ffb07a", "#2a0a06", 0.45]} />
    </group>
  );
}
