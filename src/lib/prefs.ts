"use client";

import { useCallback, useEffect, useState } from "react";
import type { SourceTier } from "./types";

export const SECTIONS = [
  ["safety", "Safety notes"],
  ["torque", "Torque values"],
  ["specs", "Specifications"],
  ["parts", "Parts & numbers"],
  ["tools", "Tools"],
  ["tips", "Tips"],
  ["checks", "Final checks"],
  ["faults", "Troubleshooting"],
  ["sources", "Source links (always)"],
] as const;
export type Section = (typeof SECTIONS)[number][0];

export interface Prefs {
  hidden: Section[];
  minTier: SourceTier;
  units: "Nm" | "lbft";
}

const DEFAULTS: Prefs = { hidden: ["sources"], minTier: "secondary", units: "Nm" };
const KEY = "mechguide.prefs.v1";

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore corrupt prefs */ }
  }, []);
  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  const show = useCallback((s: Section) => !prefs.hidden.includes(s), [prefs.hidden]);
  return { prefs, update, show };
}
