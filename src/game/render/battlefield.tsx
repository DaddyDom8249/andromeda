import { useMemo } from "react";
import { getMap } from "../maps/registry.ts";
import { getActivePath } from "../runtime.ts";
import { RULES } from "../theme.ts";
import { CameraRig } from "./camera-rig.tsx";
import { Crawlers } from "./crawler.tsx";
import { Cavern, CoreLights, Embers, Lava, Scenery } from "./environment.tsx";
import { PathVisual } from "./path-visual.tsx";
import { Portals } from "./portals.tsx";
import { SimDriver } from "./sim-driver.tsx";
import { Towers } from "./towers.tsx";

export function Battlefield() {
  const path = useMemo(() => getActivePath(), []);
  const props = useMemo(() => getMap(RULES.mapId).props, []);
  return (
    <>
      <SimDriver />
      <CameraRig />
      <CoreLights />
      <Lava />
      <Cavern />
      <Embers />
      <Scenery props={props} />
      <PathVisual path={path} />
      <Portals path={path} />
      <Crawlers />
      <Towers />
    </>
  );
}
