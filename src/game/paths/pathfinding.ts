import { dist } from "../math/vec3.ts";
import type { PathGraph, Route } from "./types.ts";

/**
 * A* over an authored lane graph. Fixed-path maps are a chain; later maps can
 * add branches and this same search picks a route without replacing callers.
 */
export function findRoute(graph: PathGraph, startId: string, goalId: string): Route {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  if (!nodes.has(startId)) throw new Error(`Pathfinding: missing start node ${startId}`);
  if (!nodes.has(goalId)) throw new Error(`Pathfinding: missing goal node ${goalId}`);

  const adj = new Map<string, { id: string; cost: number }[]>();
  for (const node of graph.nodes) adj.set(node.id, []);
  for (const edge of graph.edges) {
    const from = nodes.get(edge.from);
    const to = nodes.get(edge.to);
    if (!from || !to) {
      throw new Error(`Pathfinding: edge ${edge.from}->${edge.to} references an unknown node`);
    }
    const cost = edge.cost ?? dist(from.position, to.position);
    adj.get(edge.from)?.push({ id: edge.to, cost });
    if (edge.bidirectional !== false) adj.get(edge.to)?.push({ id: edge.from, cost });
  }

  const goal = nodes.get(goalId)!;
  const heuristic = (id: string) => dist(nodes.get(id)!.position, goal.position);
  const gScore = new Map<string, number>([[startId, 0]]);
  const fScore = new Map<string, number>([[startId, heuristic(startId)]]);
  const came = new Map<string, string>();
  const open = [startId];
  const closed = new Set<string>();

  while (open.length > 0) {
    let best = 0;
    for (let i = 1; i < open.length; i++) {
      if ((fScore.get(open[i]!) ?? Infinity) < (fScore.get(open[best]!) ?? Infinity)) best = i;
    }
    const current = open.splice(best, 1)[0]!;
    if (closed.has(current)) continue;
    if (current === goalId) {
      const ids = [current];
      let cursor = current;
      while (came.has(cursor)) {
        cursor = came.get(cursor)!;
        ids.push(cursor);
      }
      ids.reverse();
      return { ids, points: ids.map((id) => nodes.get(id)!.position) };
    }
    closed.add(current);
    const soFar = gScore.get(current) ?? Infinity;
    for (const next of adj.get(current) ?? []) {
      const tentative = soFar + next.cost;
      if (tentative >= (gScore.get(next.id) ?? Infinity)) continue;
      came.set(next.id, current);
      gScore.set(next.id, tentative);
      fScore.set(next.id, tentative + heuristic(next.id));
      open.push(next.id);
    }
  }

  throw new Error(`Pathfinding: no route from ${startId} to ${goalId}`);
}
