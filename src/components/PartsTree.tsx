"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SYSTEMS, type Car } from "@/lib/types";

export interface TaxonomyGroup {
  system: string;
  subsystem: string;
  parts: { name: string; fr?: string; manualPage?: string; note?: string }[];
}

type Status = "guide" | "manual" | "none";
const STATUS_LABEL: Record<Status, string> = { guide: "Guide + specs", manual: "Manual page only", none: "Needs licensed data" };

const norm = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/** Every replaceable part, with how far the app's data reaches for each. */
export default function PartsTree({ car, taxonomy }: { car: Car; taxonomy: TaxonomyGroup[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<Status | "all">("all");

  const jobByUrl = useMemo(() => {
    const m = new Map<string, { id: string; name: string }>();
    for (const c of car.components)
      for (const s of [...c.torques.flatMap((t) => t.sources), ...c.specs.flatMap((x) => x.sources)])
        if (s.url && !m.has(norm(s.url))) m.set(norm(s.url), { id: c.id, name: c.name });
    return m;
  }, [car]);

  const rows = taxonomy.flatMap((g) =>
    g.parts.map((p) => {
      const job = p.manualPage ? jobByUrl.get(norm(p.manualPage)) : undefined;
      const st: Status = job ? "guide" : p.manualPage ? "manual" : "none";
      return { g, p, job, st };
    }),
  );
  const counts = { guide: 0, manual: 0, none: 0 } as Record<Status, number>;
  rows.forEach((r) => counts[r.st]++);
  const needle = q.trim().toLowerCase();
  const shown = rows.filter((r) => (status === "all" || r.st === status) &&
    (!needle || `${r.p.name} ${r.p.fr ?? ""} ${r.g.subsystem} ${r.g.system}`.toLowerCase().includes(needle)));

  return (
    <div className="tt">
      <div className="tt-bar">
        <input className="search" placeholder="Search any part (English or French)…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="seg">
          <button className={status === "all" ? "on" : ""} onClick={() => setStatus("all")}>All {rows.length}</button>
          {(["guide", "manual", "none"] as Status[]).map((s) => (
            <button key={s} className={status === s ? "on" : ""} onClick={() => setStatus(s)}>{STATUS_LABEL[s]} {counts[s]}</button>
          ))}
        </div>
      </div>
      {SYSTEMS.map((sys) => {
        const inSys = shown.filter((r) => r.g.system === sys);
        if (!inSys.length) return null;
        const subs = [...new Set(inSys.map((r) => r.g.subsystem))];
        return (
          <section key={sys} className="tt-sys">
            <h2>{sys}</h2>
            <div className="pt-grid">
              {subs.map((sub) => (
                <div key={sub} className="pt-sub">
                  <h3>{sub}</h3>
                  <ul>
                    {inSys.filter((r) => r.g.subsystem === sub).map((r) => (
                      <li key={r.p.name} className={`st-${r.st}`} title={STATUS_LABEL[r.st]}>
                        <i />
                        {r.job ? <Link href={`/cars/${car.id}?c=${r.job.id}`}>{r.p.name}</Link> : <span>{r.p.name}</span>}
                        {r.st === "manual" && <a className="muted small" href={r.p.manualPage} target="_blank" rel="noreferrer"> manual ↗</a>}
                        {r.p.fr && <span className="muted small"> · {r.p.fr}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
