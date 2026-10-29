"use client";

import Link from "next/link";
import { useState } from "react";
import { SYSTEMS, bestTier, TIER_LABEL, type Car } from "@/lib/types";
import { usePrefs } from "@/lib/prefs";
import { torqueText } from "./AssemblyDiagram";

/** Every fastener on the car in one searchable table. */
export default function TorqueTable({ car }: { car: Car }) {
  const { prefs, update } = usePrefs();
  const [q, setQ] = useState("");
  const [onlySourced, setOnlySourced] = useState(false);
  const needle = q.trim().toLowerCase();
  const rows = car.components.flatMap((c) =>
    c.torques.map((t) => ({ c, t, val: torqueText(t, prefs.units) })),
  ).filter(({ c, t, val }) =>
    (!onlySourced || val) && (!needle || `${c.name} ${c.subsystem ?? ""} ${c.system} ${t.fastener}`.toLowerCase().includes(needle)));
  const total = car.components.reduce((n, c) => n + c.torques.length, 0);
  const sourced = car.components.reduce((n, c) => n + c.torques.filter((t) => torqueText(t, "Nm")).length, 0);

  return (
    <div className="tt">
      <div className="tt-bar">
        <input className="search" placeholder="Search fastener or job…" value={q} onChange={(e) => setQ(e.target.value)} />
        <label><input type="checkbox" checked={onlySourced} onChange={(e) => setOnlySourced(e.target.checked)} /> Only sourced</label>
        <div className="seg">
          {(["Nm", "lbft"] as const).map((u) => (
            <button key={u} className={prefs.units === u ? "on" : ""} onClick={() => update({ units: u })}>{u === "Nm" ? "Nm" : "lbf·ft"}</button>
          ))}
        </div>
        <span className="muted small"><b className="acc">{sourced}</b> / {total} values sourced</span>
      </div>
      {SYSTEMS.map((sys) => {
        const rs = rows.filter((r) => r.c.system === sys);
        if (!rs.length) return null;
        return (
          <section key={sys} className="tt-sys">
            <h2>{sys}</h2>
            <table>
              <thead><tr><th>Job</th><th>Fastener</th><th>Tightening</th><th>Flags</th><th>Source</th></tr></thead>
              <tbody>
                {rs.map(({ c, t, val }) => {
                  const tier = bestTier(t.sources);
                  return (
                    <tr key={`${c.id}-${t.id}`}>
                      <td><Link href={`/cars/${car.id}?c=${c.id}`}>{c.name}</Link>{c.subsystem && <div className="muted small">{c.subsystem}</div>}</td>
                      <td>{t.fastener}{t.qty ? ` ×${t.qty}` : ""}{t.thread && <div className="muted small mono">{t.thread}</div>}</td>
                      <td className={val ? "val" : "nv"}>{val ?? "No sourced value"}</td>
                      <td>
                        {t.replaceAfterUse && <span className="flag warnf">Renew</span>}
                        {t.threadLock && <span className="flag">Thread-lock</span>}
                        {t.conflict && <span className="flag warnf" title={t.conflict}>⚠ Conflict</span>}
                      </td>
                      <td>{tier ? (t.sources[0].url ? <a href={t.sources[0].url} target="_blank" rel="noreferrer">{TIER_LABEL[tier]}</a> : TIER_LABEL[tier]) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
