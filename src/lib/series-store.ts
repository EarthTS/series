import type { Series } from "./types";
import { SEED_SERIES } from "./seed-data";

const KEY = "winter_series_db";

function readCustom(): Series[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Series[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getAllSeries(): Series[] {
  const custom = readCustom();
  const byId = new Map<string, Series>();
  for (const s of SEED_SERIES) byId.set(s.id, s);
  for (const s of custom) byId.set(s.id, s);
  return [...byId.values()];
}

export function getSeriesById(id: string): Series | undefined {
  return getAllSeries().find((s) => s.id === id);
}

export function saveSeriesList(list: Series[]): void {
  if (typeof window === "undefined") return;
  const seedIds = new Set(SEED_SERIES.map((s) => s.id));
  const onlyCustom = list.filter((s) => !seedIds.has(s.id));
  localStorage.setItem(KEY, JSON.stringify(onlyCustom));
}

const seedIdSet = () => new Set(SEED_SERIES.map((s) => s.id));

export function upsertSeries(series: Series): void {
  if (typeof window === "undefined") return;
  if (seedIdSet().has(series.id)) return;
  const custom = readCustom().filter((s) => s.id !== series.id);
  custom.push(series);
  localStorage.setItem(KEY, JSON.stringify(custom));
}

export function deleteSeries(id: string): void {
  if (seedIdSet().has(id)) return;
  const custom = readCustom().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(custom));
}
