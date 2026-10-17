import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { distanceToPathXZ } from "../paths/sample.ts";
import { buildMapPath } from "../paths/resolve.ts";
import { earthCoreMap } from "./earth-core.ts";

describe("earth core map", () => {
  it("keeps scenery off the crawler lane", () => {
    const { path } = buildMapPath(earthCoreMap);
    for (const prop of earthCoreMap.props) {
      const gap = distanceToPathXZ(prop.position, path);
      assert.ok(gap >= 3.5, `${prop.kind} sits ${gap.toFixed(2)} from the lane`);
    }
    const count = (kind: string) => earthCoreMap.props.filter((prop) => prop.kind === kind).length;
    assert.ok(count("rock") >= 6, `rocks ${count("rock")}`);
    assert.ok(count("crystal") >= 4, `crystals ${count("crystal")}`);
    assert.ok(count("geyser") >= 3, `geysers ${count("geyser")}`);
    assert.ok(count("fall") >= 3, `falls ${count("fall")}`);
    assert.ok(count("isle") >= 3, `isles ${count("isle")}`);
  });
});
