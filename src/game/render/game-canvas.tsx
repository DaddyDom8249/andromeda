import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { NoToneMapping } from "three";
import { THEME } from "../theme.ts";
import { Battlefield } from "./battlefield.tsx";

export function GameCanvas() {
  const host = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const node = host.current;
    const fit = () => {
      if (!node) return;
      const width = Math.max(window.innerWidth, document.documentElement.clientWidth, 1);
      const height = Math.max(window.innerHeight, document.documentElement.clientHeight, 1);
      node.style.width = `${width}px`;
      node.style.height = `${height}px`;
    };
    fit();
    setLive(true);
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    const timer = window.setTimeout(fit, 250);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={host} className="absolute top-0 left-0 z-0">
      {live ? (
        <Canvas
          style={{ width: "100%", height: "100%", display: "block" }}
          camera={{ position: [0, 14, 14], fov: 60, near: 0.1, far: 280 }}
          dpr={[1, 1.25]}
          gl={{
            antialias: false,
            alpha: true,
            premultipliedAlpha: false,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={({ gl, size }) => {
            gl.setClearColor(THEME.bg, 1);
            gl.toneMapping = NoToneMapping;
            gl.domElement.style.touchAction = "none";
            gl.domElement.style.backgroundColor = THEME.bg;
            if (size.width < 2 || size.height < 2) {
              gl.setSize(window.innerWidth, window.innerHeight, true);
            }
          }}
        >
          <Battlefield />
        </Canvas>
      ) : null}
    </div>
  );
}
