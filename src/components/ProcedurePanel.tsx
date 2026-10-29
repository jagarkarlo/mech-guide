"use client";

import { useState } from "react";
import type { Car, Component, ProcedureStep, SourceTier, SpecItem, SpecSource, TorqueSpec } from "@/lib/types";
import { TIER_LABEL, TIER_RANK, bestTier, hasValue } from "@/lib/types";
import { SECTIONS, type Prefs, type Section } from "@/lib/prefs";
import AssemblyDiagram from "./AssemblyDiagram";

export type Phase = "removal" | "installation";
export interface StepPos { phase: Phase; index: number }

type Show = (s: Section) => boolean;

/* ---------- small building blocks ---------- */

function TierBadge({ tier, open, onClick }: { tier: SourceTier; open?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className={`tier tier-${tier}`} onClick={onClick} title="Show sources" aria-expanded={open}>
      {TIER_LABEL[tier]} {open ? "▴" : "▾"}
    </button>
  );
}

/** Source badge + expandable source list; always expanded when the "sources" section is on. */
function useSourceToggle(show: Show) {
  const [open, setOpen] = useState(false);
  return { open: open || show("sources"), toggle: () => setOpen((o) => !o) };
}

function Sources({ sources }: { sources: SpecSource[] }) {
  if (!sources.length) return null;
  return (
    <ul className="sources">
      {sources.map((s, i) => (
        <li key={i}>
          <span className={`dot tier-${s.tier}`} />
          {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}
          {s.locator && <span className="muted"> — {s.locator}</span>}
        </li>
      ))}
    </ul>
  );
}

const fmtTorque = (v: number, units: Prefs["units"]) =>
  units === "Nm" ? `${v} Nm` : `${(v * 0.7376).toFixed(1)} lbf·ft`;

/** Renders a sourced value, or explains why it is not shown. */
function Gated({ sources, minTier, children }: { sources: SpecSource[]; minTier: SourceTier; children: React.ReactNode }) {
  const tier = bestTier(sources);
  if (!tier) return <span className="nv">No sourced value — check Renault workshop data</span>;
  if (TIER_RANK[tier] > TIER_RANK[minTier]) return <span className="nv soft">Hidden by source filter ({TIER_LABEL[tier]} only)</span>;
  return <>{children}</>;
}

function TorqueValue({ t, prefs }: { t: TorqueSpec; prefs: Prefs }) {
  if (!hasValue(t)) return <span className="nv">No sourced value — check Renault workshop data</span>;
  return (
    <Gated sources={t.sources} minTier={prefs.minTier}>
      <span className="val">
        {t.instruction ??
          t.stages.map((s, i) => (
            <span key={i}>{i > 0 && " + "}{s.kind === "angle" ? `${s.value}°` : fmtTorque(s.value!, prefs.units)}</span>
          ))}
      </span>
    </Gated>
  );
}

function TorqueRow({ t, prefs, show }: { t: TorqueSpec; prefs: Prefs; show: Show }) {
  const tier = bestTier(t.sources);
  const src = useSourceToggle(show);
  return (
    <div className="spec-row">
      <div className="spec-head">
        <span className="spec-name">{t.fastener}{t.qty ? ` ×${t.qty}` : ""}</span>
        <TorqueValue t={t} prefs={prefs} />
      </div>
      <div className="flags">
        {tier && <TierBadge tier={tier} open={src.open} onClick={src.toggle} />}
        {t.replaceAfterUse && <span className="flag warnf">Replace after use</span>}
        {t.threadLock && <span className="flag">Thread-lock</span>}
        {t.thread && <span className="flag">{t.thread}</span>}
      </div>
      {t.conflict && <div className="conflict">⚠ Sources disagree: {t.conflict}</div>}
      {t.notes && <div className="note">{t.notes}</div>}
      {src.open && <Sources sources={t.sources} />}
    </div>
  );
}

function SpecRows({ items, prefs, show }: { items: SpecItem[]; prefs: Prefs; show: Show }) {
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <>
      {groups.map((g) => (
        <div key={g} className="group">
          <h4>{g}</h4>
          {items.filter((i) => i.group === g).map((it, k) => <SpecRow key={k} it={it} prefs={prefs} show={show} />)}
        </div>
      ))}
    </>
  );
}

function SpecRow({ it, prefs, show }: { it: SpecItem; prefs: Prefs; show: Show }) {
  const tier = bestTier(it.sources);
  const src = useSourceToggle(show);
  return (
    <div className="spec-row">
      <div className="spec-head">
        <span className="spec-name">{it.label}</span>
        {it.value ? <Gated sources={it.sources} minTier={prefs.minTier}><span className="val">{it.value}</span></Gated> : <span className="nv soft">Not found yet</span>}
        {tier && it.value && <TierBadge tier={tier} open={src.open} onClick={src.toggle} />}
      </div>
      {it.notes && <div className="note">{it.notes}</div>}
      {src.open && <Sources sources={it.sources} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="sec"><h3>{title}</h3>{children}</section>;
}

/* ---------- filter popover ---------- */

function FilterMenu({ prefs, update, onClose }: { prefs: Prefs; update: (p: Partial<Prefs>) => void; onClose: () => void }) {
  const toggle = (s: Section) =>
    update({ hidden: prefs.hidden.includes(s) ? prefs.hidden.filter((h) => h !== s) : [...prefs.hidden, s] });
  return (
    <div className="popover" role="dialog" aria-label="View options">
      <div className="pop-head"><b>View options</b><button className="icon" onClick={onClose} aria-label="Close">✕</button></div>
      <h4>Show</h4>
      <div className="chips">
        {SECTIONS.map(([id, label]) => (
          <button key={id} className={`chip ${prefs.hidden.includes(id) ? "" : "on"}`} onClick={() => toggle(id)}>{label}</button>
        ))}
      </div>
      <h4>Minimum source level for values</h4>
      <div className="seg">
        {(["oem", "manufacturer", "secondary", "community"] as SourceTier[]).map((t) => (
          <button key={t} className={prefs.minTier === t ? "on" : ""} onClick={() => update({ minTier: t })}>{TIER_LABEL[t]}</button>
        ))}
      </div>
      <p className="muted small">Values whose best source is below this level are hidden, never guessed.</p>
      <h4>Torque units</h4>
      <div className="seg">
        <button className={prefs.units === "Nm" ? "on" : ""} onClick={() => update({ units: "Nm" })}>N·m</button>
        <button className={prefs.units === "lbft" ? "on" : ""} onClick={() => update({ units: "lbft" })}>lbf·ft</button>
      </div>
    </div>
  );
}

/* ---------- guide (step player) ---------- */

function StepItem({
  s, n, active, done, onClick, onDone, torques, prefs, show,
}: {
  s: ProcedureStep; n: number; active: boolean; done: boolean;
  onClick: () => void; onDone: () => void; torques: TorqueSpec[]; prefs: Prefs; show: Show;
}) {
  const t = s.torque ? torques.find((x) => x.id === s.torque) : undefined;
  return (
    <li className={`step ${active ? "active" : ""} ${done ? "done" : ""}`} onClick={onClick}>
      <button className="check" aria-label={done ? "Mark not done" : "Mark done"} onClick={(e) => { e.stopPropagation(); onDone(); }}>
        {done ? "✓" : n}
      </button>
      <div className="step-body">
        <div>{s.text}</div>
        {t && show("torque") && (
          <div className="torque-chip">🔧 {t.fastener}: <TorqueValue t={t} prefs={prefs} /></div>
        )}
        {s.warning && show("safety") && <div className="warn">⚠ {s.warning}</div>}
        {s.tip && show("tips") && <div className="tip">💡 {s.tip}</div>}
      </div>
    </li>
  );
}

function Guide({
  c, step, setStep, prefs, show,
}: { c: Component; step: StepPos | null; setStep: (s: StepPos | null) => void; prefs: Prefs; show: Show }) {
  const [phase, setPhase] = useState<Phase>(step?.phase ?? "removal");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const steps = c[phase];
  const cur = step?.phase === phase ? step.index : -1;
  const total = c.removal.length + c.installation.length;
  const doneCount = Object.values(done).filter(Boolean).length;

  const go = (p: Phase, i: number) => { setPhase(p); setStep({ phase: p, index: i }); };
  const next = () => {
    if (cur < steps.length - 1) go(phase, cur + 1);
    else if (phase === "removal") go("installation", 0);
  };
  const prev = () => {
    if (cur > 0) go(phase, cur - 1);
    else if (phase === "installation") go("removal", c.removal.length - 1);
  };

  return (
    <div className="guide">
      <div className="seg wide">
        {(["removal", "installation"] as Phase[]).map((p) => (
          <button key={p} className={phase === p ? "on" : ""} onClick={() => { setPhase(p); setStep(null); }}>
            {p === "removal" ? `1 · Remove (${c.removal.length})` : `2 · Refit (${c.installation.length})`}
          </button>
        ))}
      </div>
      <ol className="steps">
        {steps.map((s, i) => {
          const key = `${phase}-${i}`;
          return (
            <StepItem
              key={key} s={s} n={i + 1} active={i === cur} done={!!done[key]}
              onClick={() => go(phase, i)}
              onDone={() => setDone((d) => ({ ...d, [key]: !d[key] }))}
              torques={c.torques} prefs={prefs} show={show}
            />
          );
        })}
      </ol>
      <div className="player">
        <button onClick={prev} disabled={cur <= 0 && phase === "removal"}>‹ Prev</button>
        <span className="muted small">{doneCount}/{total} done</span>
        {step ? (
          <button onClick={next} disabled={phase === "installation" && cur === steps.length - 1}>Next ›</button>
        ) : (
          <button className="primary" onClick={() => go(phase, 0)}>▶ Start</button>
        )}
      </div>
    </div>
  );
}

/* ---------- panel ---------- */

type Tab = "guide" | "diagram" | "specs" | "info";
const TAB_LABEL: Record<Tab, string> = { guide: "Guide", diagram: "Diagram", specs: "Specs", info: "Info" };

export default function ProcedurePanel({
  car, component: c, step, setStep, prefs, update, show,
}: {
  car: Car; component: Component | null;
  step: StepPos | null; setStep: (s: StepPos | null) => void;
  prefs: Prefs; update: (p: Partial<Prefs>) => void; show: Show;
}) {
  const [tab, setTab] = useState<Tab>("guide");
  const [menu, setMenu] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [big, setBig] = useState(false);

  const header = (title: string, sub: React.ReactNode) => (
    <div className="panel-head">
      <div>
        <h2>{title}</h2>
        <div className="meta">{sub}</div>
      </div>
      <button className={`icon ${menu ? "on" : ""}`} onClick={() => setMenu((m) => !m)} aria-label="View options" title="View options">⚙</button>
      {menu && <FilterMenu prefs={prefs} update={update} onClose={() => setMenu(false)} />}
    </div>
  );

  if (!c) {
    return (
      <aside className="panel">
        {header(`${car.model} ${car.generation}`, <>{car.engine} · {car.years}</>)}
        <div className="panel-body">
          <p className="muted">Pick a component on the left or click a part on the car.</p>
          {show("specs") && car.specs.length > 0 && (
            <Section title="Vehicle data"><SpecRows items={car.specs} prefs={prefs} show={show} /></Section>
          )}
        </div>
      </aside>
    );
  }

  const torques = show("torque") ? c.torques : [];
  return (
    <aside className="panel">
      {header(c.name, (
        <>
          <span>{c.system}</span>
          <span title="Difficulty">{"●".repeat(c.difficulty)}<span className="dim">{"●".repeat(5 - c.difficulty)}</span></span>
          <span>~{c.timeMinutes} min</span>
          {c.interval && <span title="Service interval">↻ {c.interval}</span>}
        </>
      ))}
      <nav className="tabs">
        {(["guide", "diagram", "specs", "info"] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>
      <div className="panel-body">
        {tab === "guide" && <Guide key={c.id} c={c} step={step} setStep={setStep} prefs={prefs} show={show} />}

        {tab === "diagram" && (
          <>
            <div className="dg-bar">
              <span className="muted small">Click a callout for details</span>
              <button className="ghost" onClick={() => setBig(true)}>⤢ Enlarge</button>
            </div>
            <AssemblyDiagram c={c} prefs={prefs} active={pick} onPick={setPick} />
            {(() => {
              const t = c.torques.find((x) => x.id === pick);
              return t ? <TorqueRow key={t.id} t={t} prefs={prefs} show={show} /> : null;
            })()}
            {big && (
              <div className="dg-modal" role="dialog" aria-label={`${c.name} diagram`} onClick={() => setBig(false)}>
                <div className="dg-sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="dg-bar">
                    <h3>{c.name} — tightening overview</h3>
                    <span>
                      <button className="ghost" onClick={() => window.print()}>Print</button>
                      <button className="ghost" onClick={() => setBig(false)} aria-label="Close">✕</button>
                    </span>
                  </div>
                  <AssemblyDiagram c={c} prefs={prefs} active={pick} onPick={setPick} />
                  <ol className="dg-key">
                    {c.torques.map((t) => <li key={t.id}><TorqueRow t={t} prefs={prefs} show={show} /></li>)}
                  </ol>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "specs" && (
          <>
            {torques.length > 0 && (
              <Section title="Tightening">{torques.map((t) => <TorqueRow key={t.id} t={t} prefs={prefs} show={show} />)}</Section>
            )}
            {show("specs") && c.specs.length > 0 && <Section title="Specifications"><SpecRows items={c.specs} prefs={prefs} show={show} /></Section>}
            {show("parts") && c.parts.length > 0 && (
              <Section title="Parts">
                {c.parts.map((p, i) => (
                  <div key={i} className="spec-row">
                    <div className="spec-head">
                      <span className="spec-name">{p.name}</span>
                      <span className="muted small">{p.qty}</span>
                    </div>
                    <div className="flags">
                      {p.replace === "always" && <span className="flag warnf">Always replace</span>}
                      {p.replace === "if-worn" && <span className="flag">Replace if worn</span>}
                      {p.oe?.map((o) => <span key={o} className="flag mono">OE {o}</span>)}
                      {p.equivalents?.map((o) => <span key={o} className="flag mono">{o}</span>)}
                    </div>
                    {p.notes && <div className="note">{p.notes}</div>}
                    {show("sources") && p.sources && <Sources sources={p.sources} />}
                  </div>
                ))}
                <p className="muted small">Always confirm part numbers against your VIN.</p>
              </Section>
            )}
          </>
        )}

        {tab === "info" && (
          <>
            <p>{c.summary}</p>
            {show("safety") && c.safety.length > 0 && (
              <Section title="Safety"><ul className="safety">{c.safety.map((s) => <li key={s}>{s}</li>)}</ul></Section>
            )}
            {show("tools") && <Section title="Tools"><ul className="tick">{c.tools.map((t) => <li key={t}>{t}</li>)}</ul></Section>}
            {show("checks") && c.checks.length > 0 && (
              <Section title="Final checks"><ul className="tick">{c.checks.map((t) => <li key={t}>{t}</li>)}</ul></Section>
            )}
            {show("faults") && c.faults.length > 0 && (
              <Section title="Troubleshooting">
                {c.faults.map((f) => (
                  <div key={f.symptom} className="fault"><b>{f.symptom}</b><span className="muted">{f.causes}</span></div>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
