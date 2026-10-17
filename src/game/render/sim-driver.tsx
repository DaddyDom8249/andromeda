import { useFrame } from "@react-three/fiber";
import { useEffect } from "react";
import { ensureMatch, installDebug, markReady, publish, tick } from "../runtime.ts";

export function SimDriver() {
  useEffect(() => {
    publish(ensureMatch());
    installDebug();
  }, []);
  useFrame((_, delta) => {
    tick(delta);
    markReady();
  });
  return null;
}
