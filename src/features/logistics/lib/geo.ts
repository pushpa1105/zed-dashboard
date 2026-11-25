/**
 * Geometry for the stylised network map. The canvas is 1040×600 and uses the
 * same projection as the mock API: x = (lon + 10) * 24, y = (61 - lat) * 24.
 * Land is drawn as a dot matrix clipped to rough coastline polygons: it reads
 * as "Europe" at a glance without shipping a map library or tiles.
 */

export const MAP_WIDTH = 1040;
export const MAP_HEIGHT = 600;

const proj = ([lon, lat]: [number, number]): [number, number] => [(lon + 10) * 24, (61 - lat) * 24];

type LonLat = [number, number];

const MAINLAND: LonLat[] = [
  [-9, 37],
  [-5.6, 36],
  [-2, 36.7],
  [0, 38.7],
  [0.3, 39.5],
  [3, 41.9],
  [5, 43.2],
  [7.5, 43.7],
  [9, 44.4],
  [10.5, 43],
  [12.5, 41.9],
  [15, 40.5],
  [15.6, 38],
  [16.5, 38.5],
  [17, 39.8],
  [18.5, 40.2],
  [17, 41],
  [13.5, 43.6],
  [12.3, 45.3],
  [13.7, 45.6],
  [15.5, 44],
  [18, 42.6],
  [19.5, 41],
  [20.3, 39.5],
  [21.7, 37],
  [23, 36.5],
  [24, 38],
  [23, 40.6],
  [26, 40.8],
  [29, 41.2],
  [28, 43],
  [29, 45],
  [30.7, 46.5],
  [32, 47],
  [33, 50],
  [33, 56.5],
  [28, 59.8],
  [24, 59.4],
  [23.5, 58.2],
  [24.2, 57.2],
  [21.1, 56.9],
  [21, 55.3],
  [20, 54.7],
  [18.6, 54.4],
  [16, 54.3],
  [14, 53.9],
  [12, 54.2],
  [10.9, 54],
  [10.3, 54.5],
  [10.6, 57.3],
  [9.5, 57.1],
  [8.1, 56.8],
  [8.6, 55.5],
  [8.6, 53.9],
  [7, 53.6],
  [4.8, 52.9],
  [3.6, 51.4],
  [1.8, 51],
  [1.5, 50.2],
  [0.1, 49.6],
  [-1.4, 49.7],
  [-1.6, 48.6],
  [-4.7, 48.4],
  [-2.5, 47.3],
  [-1.2, 46],
  [-1.5, 43.5],
  [-4, 43.5],
  [-8.1, 43.7],
  [-9.2, 43],
  [-8.8, 42],
  [-8.9, 40.5],
  [-9.4, 38.7],
  [-8.9, 37.9],
];
const BRITAIN: LonLat[] = [
  [-5.7, 50],
  [1.4, 51.2],
  [1.7, 52.6],
  [0.2, 53.5],
  [-0.1, 54.5],
  [-1.6, 55.6],
  [-2, 57.6],
  [-3.1, 58.6],
  [-5, 58.6],
  [-6.2, 57.5],
  [-5.6, 56],
  [-4.9, 55],
  [-3, 54.9],
  [-3.2, 53.4],
  [-4.6, 53.3],
  [-4.2, 52.3],
  [-5.2, 51.7],
  [-3, 51.4],
  [-4.5, 51.1],
];
const IRELAND: LonLat[] = [
  [-6, 52.2],
  [-6.2, 53.5],
  [-5.6, 54.6],
  [-7.4, 55.3],
  [-8.5, 54.5],
  [-10, 54.2],
  [-9.5, 53],
  [-10.3, 51.8],
  [-8.5, 51.6],
];
const SCANDINAVIA: LonLat[] = [
  [5, 59],
  [5, 61.5],
  [17.5, 61.5],
  [18.2, 59.6],
  [16.5, 57.2],
  [16, 56.2],
  [14.2, 55.4],
  [12.8, 55.6],
  [12.4, 56.6],
  [11.1, 58.9],
  [10, 59],
  [8, 58.1],
  [6.3, 58.2],
];
const FINLAND: LonLat[] = [
  [21.5, 61.5],
  [30, 61.5],
  [28, 60.5],
  [23, 59.9],
  [21.3, 60.6],
];
const SICILY: LonLat[] = [
  [12.4, 38.1],
  [15.6, 38.3],
  [15.1, 36.7],
];
const CORSICA_SARDINIA: LonLat[] = [
  [8.6, 43],
  [9.5, 42.8],
  [9.8, 39.2],
  [8.4, 38.9],
  [8.2, 40.8],
];

const LAND = [MAINLAND, BRITAIN, IRELAND, SCANDINAVIA, FINLAND, SICILY, CORSICA_SARDINIA].map(
  (poly) => poly.map(proj),
);

function inside([x, y]: [number, number], poly: Array<[number, number]>) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

let cache: Array<[number, number]> | null = null;

/** Dot positions covering the land masses (computed once, ~2k points). */
export function landDots(spacing = 13): Array<[number, number]> {
  if (cache) return cache;
  const dots: Array<[number, number]> = [];
  for (let y = spacing / 2; y < MAP_HEIGHT; y += spacing) {
    for (let x = spacing / 2; x < MAP_WIDTH; x += spacing) {
      if (LAND.some((poly) => inside([x, y], poly))) dots.push([x, y]);
    }
  }
  cache = dots;
  return dots;
}

/** A gentle arc between two points (quadratic Bézier bowed to one side). */
export function arcPath(a: { x: number; y: number }, b: { x: number; y: number }, bend = 0.18) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  return `M ${a.x} ${a.y} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${b.x} ${b.y}`;
}

/** Straight-line distance on a local route canvas, as kilometres (1 unit = 25 m). */
export const canvasKm = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y) * 0.025;
