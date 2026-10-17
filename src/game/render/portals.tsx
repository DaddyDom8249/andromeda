import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  SRGBColorSpace,
} from "three";
import { samplePoly, type PolyPath } from "../paths/sample.ts";
import { THEME } from "../theme.ts";

function useLabel(text: string, color: string) {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    return { canvas, map };
  }, []);

  useEffect(() => {
    if (!texture) return;
    let dead = false;
    const draw = () => {
      const ctx = texture.canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, texture.canvas.width, texture.canvas.height);
      ctx.font = "700 72px Cinzel, Palatino, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(text, 256, 68);
      texture.map.needsUpdate = true;
    };
    draw();
    void document.fonts?.ready.then(() => {
      if (!dead) draw();
    });
    return () => {
      dead = true;
    };
  }, [color, text, texture]);

  useEffect(() => () => texture?.map.dispose(), [texture]);
  return texture?.map ?? null;
}

function Portal({
  position,
  tangent,
  label,
  color,
  spin,
}: {
  position: readonly [number, number, number];
  tangent: readonly [number, number, number];
  label: string;
  color: string;
  spin: number;
}) {
  const group = useRef<Group>(null);
  const outer = useRef<Mesh>(null);
  const inner = useRef<Mesh>(null);
  const labelMap = useLabel(label, color);

  useEffect(() => {
    const root = group.current;
    if (!root) return;
    root.position.set(position[0], position[1] + 1.35, position[2]);
    root.lookAt(position[0] + tangent[0], position[1] + 1.35, position[2] + tangent[2]);
  }, [position, tangent]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * spin;
    if (outer.current) outer.current.rotation.z = t;
    if (inner.current) inner.current.rotation.z = -t * 1.4;
  });

  return (
    <group ref={group}>
      <mesh ref={outer}>
        <torusGeometry args={[1.85, 0.13, 12, 32]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={inner}>
        <torusGeometry args={[1.2, 0.055, 10, 28]} />
        <meshBasicMaterial color={THEME.hot} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[1.05, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.22}
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.22, 0.9, 4.8, 16, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.3}
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {labelMap ? (
        <sprite position={[0, 2.7, 0]} scale={[4.6, 1.15, 1]}>
          <spriteMaterial map={labelMap} transparent depthWrite={false} toneMapped={false} />
        </sprite>
      ) : null}
    </group>
  );
}

export function Portals({ path }: { path: PolyPath }) {
  const spawn = samplePoly(path, 0);
  const exit = samplePoly(path, path.totalLength);
  return (
    <group>
      <Portal
        position={spawn.position}
        tangent={spawn.tangent}
        label="SPAWN"
        color={THEME.accent}
        spin={0.7}
      />
      <Portal
        position={exit.position}
        tangent={exit.tangent}
        label="EXIT"
        color={THEME.primary}
        spin={-0.55}
      />
    </group>
  );
}
