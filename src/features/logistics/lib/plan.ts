import type { PlannedRoute, Stop } from '../model/logistics';

import { fromMinutes, toMinutes } from './format';
import { canvasKm } from './geo';

/** Average urban speed used for ETAs (km/h). */
const CITY_SPEED = 26;

export type PlannedStop = Stop & {
  /** Arrival (minutes since midnight). */
  arrival: number;
  /** Minutes waited for the window to open. */
  wait: number;
  late: boolean;
  legKm: number;
};

export type RoutePlan = {
  stops: PlannedStop[];
  distanceKm: number;
  driveMinutes: number;
  finish: string;
  lateCount: number;
  parcels: number;
};

/**
 * Simulates the route in the given stop order: travel at city speed, wait
 * for each delivery window to open, add service time, return to the depot.
 */
export function planRoute(route: PlannedRoute, order: Stop[]): RoutePlan {
  let clock = toMinutes(route.departure);
  let at = { x: route.depotX, y: route.depotY };
  let distance = 0;
  let drive = 0;

  const stops = order.map((stop) => {
    const legKm = canvasKm(at, stop);
    const legMinutes = (legKm / CITY_SPEED) * 60;
    distance += legKm;
    drive += legMinutes;
    clock += legMinutes;
    const opens = toMinutes(stop.windowStart);
    const wait = Math.max(0, opens - clock);
    const arrival = clock + wait;
    const late = arrival > toMinutes(stop.windowEnd);
    clock = arrival + stop.serviceMinutes;
    at = stop;
    return { ...stop, arrival, wait, late, legKm };
  });

  const back = canvasKm(at, { x: route.depotX, y: route.depotY });
  distance += back;
  drive += (back / CITY_SPEED) * 60;
  clock += (back / CITY_SPEED) * 60;

  return {
    stops,
    distanceKm: Math.round(distance * 10) / 10,
    driveMinutes: Math.round(drive),
    finish: fromMinutes(clock),
    lateCount: stops.filter((s) => s.late).length,
    parcels: stops.reduce((sum, s) => sum + s.parcels, 0),
  };
}

/** Greedy "earliest window, then nearest" ordering: a quick, explainable optimisation. */
export function optimise(route: PlannedRoute, stops: Stop[]): Stop[] {
  const remaining = [...stops];
  const result: Stop[] = [];
  let at = { x: route.depotX, y: route.depotY };
  while (remaining.length) {
    remaining.sort((a, b) => {
      const window = toMinutes(a.windowEnd) - toMinutes(b.windowEnd);
      if (Math.abs(window) >= 60) return window;
      return canvasKm(at, a) - canvasKm(at, b);
    });
    const next = remaining.shift()!;
    result.push(next);
    at = next;
  }
  return result;
}
