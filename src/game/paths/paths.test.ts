import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dist } from "../math/vec3.ts";
import { findRoute } from "./pathfinding.ts";
import { buildPolyPath, samplePoly, smoothCorners } from "./sample.ts";
import type { PathGraph } from "./types.ts";

describe("pathfinding", () => {
  const graph: PathGraph = {
    nodes: [
      { id: "A", position: [0, 0, 0] },
      { id: "D", position: [0, 0, 8] },
      { id: "E", position: [0, 0, 16] },
      { id: "B", position: [2, 0, 0] },
      { id: "G", position: [6, 0, 0] },
      { id: "C", position: [4, 0, 0] },
      { id: "Z", position: [30, 0, 30] },
    ],
    edges: [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "G" },
      { from: "A", to: "D" },
      { from: "D", to: "E" },
      { from: "B", to: "D" },
    ],
  };

  it("follows the shortest route instead of node insertion order", () => {
    const route = findRoute(graph, "A", "G");
    assert.deepEqual(route.ids, ["A", "B", "C", "G"]);
  });

  it("throws when the exit cannot be reached", () => {
    assert.throws(() => findRoute(graph, "Z", "G"));
  });
});

describe("smooth lane", () => {
  it("samples a straight lane exactly", () => {
    const path = buildPolyPath([
      [0, 0, 0],
      [0, 0, 10],
    ]);
    const mid = samplePoly(path, 4);
    assert.ok(dist(mid.position, [0, 0, 4]) < 1e-6);
    assert.equal(path.totalLength, 10);
  });

  it("keeps the spawn and exit pinned when corners are rounded", () => {
    const raw = [
      [0, 0, 0],
      [4, 0, 0],
      [4, 0, 6],
    ] as const;
    const smooth = smoothCorners(raw, 1.2);
    const path = buildPolyPath(smooth);
    assert.ok(dist(path.points[0]!, raw[0]) < 1e-6);
    assert.ok(dist(path.points[path.points.length - 1]!, raw[2]) < 1e-6);
    const sample = samplePoly(path, path.totalLength * 0.5);
    assert.ok(sample.position[0] >= -0.01 && sample.position[0] <= 4.01);
    assert.ok(sample.position[2] >= -0.01 && sample.position[2] <= 6.01);
  });
});
