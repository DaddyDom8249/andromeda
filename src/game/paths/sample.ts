import { add, dist, len, normalize, scale, sub, type Vec3 } from "../math/vec3.ts";

export interface PolyPath {
  points: Vec3[];
  cumulative: number[];
  totalLength: number;
}

export interface PathSample {
  position: Vec3;
  tangent: Vec3;
}

/** Round corners with quadratic fillets so travel stays on one continuous lane. */
export function smoothCorners(points: readonly Vec3[], radius: number, segments = 5): Vec3[] {
  if (points.length < 2) return points.map(copy);
  if (points.length < 3 || radius <= 0) return points.map(copy);
  const out: Vec3[] = [copy(points[0]!)];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const next = points[i + 1]!;
    const toCurr = sub(curr, prev);
    const toNext = sub(next, curr);
    const inLen = len(toCurr);
    const outLen = len(toNext);
    if (inLen < 1e-5 || outLen < 1e-5) {
      out.push(copy(curr));
      continue;
    }
    const r = Math.min(radius, inLen * 0.45, outLen * 0.45);
    const inDir = scale(toCurr, 1 / inLen);
    const outDir = scale(toNext, 1 / outLen);
    const a = sub(curr, scale(inDir, r));
    const b = add(curr, scale(outDir, r));
    out.push(a);
    for (let s = 1; s < segments; s++) {
      const t = s / segments;
      const u = 1 - t;
      out.push(add(add(scale(a, u * u), scale(curr, 2 * u * t)), scale(b, t * t)));
    }
    out.push(b);
  }
  out.push(copy(points[points.length - 1]!));
  return out;
}

export function buildPolyPath(points: readonly Vec3[]): PolyPath {
  if (points.length < 2) throw new Error("A path needs at least two points");
  const cleaned: Vec3[] = [copy(points[0]!)];
  for (let i = 1; i < points.length; i++) {
    if (dist(points[i]!, cleaned[cleaned.length - 1]!) > 1e-4) cleaned.push(copy(points[i]!));
  }
  if (cleaned.length < 2) throw new Error("A path collapsed to a single point");
  const cumulative = [0];
  for (let i = 1; i < cleaned.length; i++) {
    cumulative.push(cumulative[i - 1]! + dist(cleaned[i - 1]!, cleaned[i]!));
  }
  return { points: cleaned, cumulative, totalLength: cumulative[cumulative.length - 1]! };
}

/** Arc-length sample. Position is always on the designated polyline. */
export function samplePoly(path: PolyPath, distance: number): PathSample {
  const last = path.points.length - 1;
  if (distance <= 0) {
    return {
      position: path.points[0]!,
      tangent: normalize(sub(path.points[1]!, path.points[0]!)),
    };
  }
  if (distance >= path.totalLength) {
    return {
      position: path.points[last]!,
      tangent: normalize(sub(path.points[last]!, path.points[last - 1]!)),
    };
  }
  let i = 1;
  while (i < path.cumulative.length - 1 && path.cumulative[i]! < distance) i++;
  const span = path.cumulative[i]! - path.cumulative[i - 1]!;
  const t = span <= 1e-8 ? 0 : (distance - path.cumulative[i - 1]!) / span;
  const a = path.points[i - 1]!;
  const b = path.points[i]!;
  return { position: lerpPoint(a, b, t), tangent: normalize(sub(b, a)) };
}

export function distanceToPathXZ(point: Vec3, path: PolyPath): number {
  let best = Infinity;
  for (let i = 1; i < path.points.length; i++) {
    best = Math.min(best, pointSegmentXZ(point, path.points[i - 1]!, path.points[i]!));
  }
  return best;
}

function pointSegmentXZ(p: Vec3, a: Vec3, b: Vec3): number {
  const abx = b[0] - a[0];
  const abz = b[2] - a[2];
  const denom = abx * abx + abz * abz;
  const t =
    denom <= 1e-8 ? 0 : Math.min(1, Math.max(0, ((p[0] - a[0]) * abx + (p[2] - a[2]) * abz) / denom));
  return Math.hypot(a[0] + abx * t - p[0], a[2] + abz * t - p[2]);
}

function copy(p: Vec3): Vec3 {
  return [p[0], p[1], p[2]];
}

function lerpPoint(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
