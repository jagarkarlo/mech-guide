"use client";

import type { Component, TorqueSpec } from "@/lib/types";
import { hasValue } from "@/lib/types";
import type { Prefs } from "@/lib/prefs";

const ROW = 54;
const W = 600;
const BOX = { x: 245, w: 110 };

export function torqueText(t: TorqueSpec, units: Prefs["units"]): string | null {
  if (!hasValue(t)) return null;
  if (t.instruction) return t.instruction;
  return t.stages
    .map((s) => (s.kind === "angle" ? `${s.value}°` : units === "Nm" ? `${s.value} Nm` : `${(s.value! * 0.7376).toFixed(1)} lbf·ft`))
    .join(" + ");
}

/**
 * Exploded-sheet style overview: every fastener of the job is called out
 * around the assembly with its tightening value and renew / thread-lock flags.
 * A schematic, not a scale drawing.
 */
export default function AssemblyDiagram({
  c, prefs, active, onPick,
}: { c: Component; prefs: Prefs; active?: string | null; onPick?: (id: string) => void }) {
  const ts = c.torques;
  if (!ts.length) return <p className="muted small">No fasteners documented for this job.</p>;
  const left = ts.filter((_, i) => i % 2 === 0);
  const right = ts.filter((_, i) => i % 2 === 1);
  const rows = Math.max(left.length, right.length);
  const H = rows * ROW + 70;
  const boxY = 30, boxH = H - 60;

  const callout = (t: TorqueSpec, side: "l" | "r", row: number) => {
    const n = ts.indexOf(t) + 1;
    const y = 30 + row * ROW + ROW / 2;
    const ax = side === "l" ? BOX.x : BOX.x + BOX.w;
    const ay = Math.min(boxY + boxH - 12, Math.max(boxY + 12, boxY + ((n - 0.5) / ts.length) * boxH));
    const bx = side === "l" ? 212 : W - 212;
    const tx = side === "l" ? 8 : W - 8;
    const anchor = side === "l" ? "start" : "end";
    const val = torqueText(t, prefs.units);
    const on = active === t.id;
    return (
      <g key={t.id} className={`co ${on ? "on" : ""} ${val ? "" : "nv"}`} onClick={() => onPick?.(t.id)} style={{ cursor: onPick ? "pointer" : undefined }}>
        <title>{t.fastener}{t.notes ? ` — ${t.notes}` : ""}</title>
        <polyline points={`${ax},${ay} ${bx},${y} ${side === "l" ? bx - 6 : bx + 6},${y}`} className="lead" />
        <circle cx={ax} cy={ay} r={3} className="pin" />
        {/* bolt glyph */}
        <g transform={`translate(${bx},${y})`}>
          <polygon points="-7,-4 0,-8 7,-4 7,4 0,8 -7,4" className="hex" />
          {t.replaceAfterUse && <rect x={side === "l" ? -18 : 11} y={-4} width={8} height={8} className="renew" />}
        </g>
        <text x={tx} y={y - 6} textAnchor={anchor} className="co-val">{val ?? "no sourced value"}</text>
        <text x={tx} y={y + 10} textAnchor={anchor} className="co-name">
          {n}. {t.fastener.length > 30 ? `${t.fastener.slice(0, 29)}…` : t.fastener}{t.qty ? ` ×${t.qty}` : ""}
          {t.threadLock ? " · TL" : ""}{t.conflict ? " · ⚠" : ""}
        </text>
      </g>
    );
  };

  return (
    <figure className="diagram">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Fastener diagram for ${c.name}`}>
        <defs>
          <pattern id="dg-grid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M12 0H0V12" fill="none" className="grid" />
          </pattern>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#dg-grid)" />
        <rect x={BOX.x} y={boxY} width={BOX.w} height={boxH} rx={14} className="body" />
        <text x={BOX.x + BOX.w / 2} y={boxY + boxH / 2 - 4} textAnchor="middle" className="body-t">{c.subsystem ?? c.system}</text>
        <text x={BOX.x + BOX.w / 2} y={boxY + boxH / 2 + 12} textAnchor="middle" className="body-s">{ts.length} fasteners</text>
        {left.map((t, i) => callout(t, "l", i))}
        {right.map((t, i) => callout(t, "r", i))}
      </svg>
      <figcaption>
        <span><i className="lg renew" /> renew bolt/nut</span>
        <span><b>TL</b> thread-lock</span>
        <span><b>⚠</b> sources disagree</span>
        <span className="nvk">red = no sourced value</span>
      </figcaption>
    </figure>
  );
}
