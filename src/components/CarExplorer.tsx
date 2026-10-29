"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SYSTEMS, coverage, type Car, type Component } from "@/lib/types";
import { usePrefs } from "@/lib/prefs";
import ProcedurePanel, { type StepPos } from "./ProcedurePanel";

const CarViewer = dynamic(() => import("./CarViewer"), {
  ssr: false,
  loading: () => <div className="viewer loading">Loading 3D view…</div>,
});

/** Which 3D parts are off the car, and which are highlighted, at a given step. */
function stepState(c: Component | null, step: StepPos | null) {
  if (!c || !step) return { detached: [] as string[], focus: [] as string[] };
  const s = c[step.phase][step.index];
  const removed = c.removal.slice(0, step.phase === "removal" ? step.index + 1 : undefined).flatMap((r) => r.detach ?? []);
  const refitted = step.phase === "installation" ? c.installation.slice(0, step.index + 1).flatMap((r) => r.attach ?? []) : [];
  const detached = removed.filter((p) => !refitted.includes(p));
  const focus = s?.focus ?? s?.detach ?? s?.attach ?? [];
  return { detached, focus };
}

const SYSTEM_ICON: Record<string, string> = {
  Wheels: "◎", Brakes: "◉", Suspension: "⌇", Steering: "⊛", Engine: "⬢", Timing: "⟳", Intake: "≋", Fuel: "⛽",
  Cooling: "❄", Exhaust: "≈", Transmission: "⚙", Electrical: "ϟ", Lighting: "✦", HVAC: "✱", Body: "▭",
};

export default function CarExplorer({ car, modelUrl }: { car: Car; modelUrl: string | null }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [explode, setExplode] = useState(false);
  const [step, setStep] = useState<StepPos | null>(null);
  const [bodyOpacity, setBodyOpacity] = useState(0.45);
  const [resetKey, setResetKey] = useState(0);
  const [moveMode, setMoveMode] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [query, setQuery] = useState("");
  const [closed, setClosed] = useState<string[]>(SYSTEMS.filter((x) => !["Wheels", "Brakes", "Electrical"].includes(x)));
  const { prefs, update, show } = usePrefs();

  const selected = car.components.find((c) => c.id === selectedId) ?? null;
  const { detached, focus } = useMemo(() => stepState(selected, step), [selected, step]);
  const q = query.trim().toLowerCase();
  const list = car.components.filter((c) => !q || `${c.name} ${c.system} ${c.summary}`.toLowerCase().includes(q));
  const systems = SYSTEMS.filter((sys) => list.some((c) => c.system === sys));
  const hotspots = list.filter((c) => (selected ? c.system === selected.system : !!q || !closed.includes(c.system)));
  const totals = car.components.reduce((a, c) => { const v = coverage(c); return { s: a.s + v.sourced, t: a.t + v.total }; }, { s: 0, t: 0 });

  const select = (id: string | null) => {
    setSelectedId(id);
    setExplode(false);
    setStep(null);
  };

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("c");
    if (id && car.components.some((c) => c.id === id)) {
      setSelectedId(id);
      const sys = car.components.find((c) => c.id === id)!.system;
      setClosed((cl) => cl.filter((x) => x !== sys));
    }
  }, [car]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "Escape") select(null);
      if (e.key === "m") setMoveMode((v) => !v);
      if (e.key === "e" && selectedId) { setStep(null); setExplode((v) => !v); }
      if (e.key === "r") setResetToken((t) => t + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  return (
    <div className="explorer">
      <aside className="sidebar glass">
        <input className="search" placeholder="Search parts, systems…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="cov-total" title="Torque values and specifications that have a source">
          <span>{car.components.length} jobs</span>
          <span><b>{totals.s}</b>/{totals.t} values sourced</span>
        </div>
        {systems.map((sys) => {
          const items = list.filter((c) => c.system === sys);
          const open = !!q || !closed.includes(sys);
          return (
            <div key={sys} className="sys">
              <button className="sys-head" onClick={() => setClosed((c) => (c.includes(sys) ? c.filter((x) => x !== sys) : [...c, sys]))}>
                <span className="sys-ico">{SYSTEM_ICON[sys] ?? "•"}</span>
                {sys}
                <span className="count">{items.length}</span>
                <span className={`chev ${open ? "open" : ""}`}>›</span>
              </button>
              {open && (
                <ul>
                  {items.map((c) => {
                    const v = coverage(c);
                    const lvl = v.total === 0 ? "none" : v.sourced === v.total ? "full" : v.sourced > 0 ? "part" : "none";
                    return (
                      <li key={c.id}>
                        <button className={c.id === selectedId ? "active" : ""} onClick={() => select(c.id)}>
                          <span className="nm">{c.name}</span>
                          <span className={`cov cov-${lvl}`} title={`${v.sourced}/${v.total} values sourced`} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
        {!list.length && <p className="muted small">No match.</p>}
      </aside>
      <div className="center">
        <CarViewer
          car={car}
          modelUrl={modelUrl}
          selectedId={selectedId}
          explode={explode}
          detached={detached}
          focus={focus}
          bodyOpacity={bodyOpacity}
          resetKey={resetKey}
          moveMode={moveMode}
          resetToken={resetToken}
          hotspots={hotspots.map((c) => c.id)}
          onSelect={select}
        />
        <div className="hud hud-top">
          <button className={explode ? "on" : ""} disabled={!selectedId} onClick={() => { setStep(null); setExplode((v) => !v); }} title="Exploded view (E)">
            ⇱ Explode
          </button>
          <button className={moveMode ? "on" : ""} onClick={() => setMoveMode((v) => !v)} title="Drag parts with the mouse (M)">
            ✥ Move parts
          </button>
          <button onClick={() => setResetToken((t) => t + 1)} title="Put moved parts back (R)">↺ Reassemble</button>
          <button onClick={() => { select(null); setResetKey((k) => k + 1); }} title="Whole car (Esc)">⌂ Whole car</button>
          <label className="opacity">
            Body
            <input type="range" min={0} max={1} step={0.05} value={bodyOpacity} onChange={(e) => setBodyOpacity(Number(e.target.value))} />
          </label>
        </div>
        {step && selected && (
          <div className="hud hud-step">
            <span className="pulse" />
            {step.phase === "removal" ? "Removing" : "Refitting"} · step {step.index + 1}/{selected[step.phase].length}
          </div>
        )}
        {moveMode && <div className="hud hud-mode">Move mode: drag any part · R to reassemble</div>}
        <div className="hud hud-bottom">
          Drag to orbit · right-drag to pan · scroll to zoom · click a dot or part. Parts are simplified and placed approximately.
          {modelUrl && car.model3d && (
            <> Body: “<a href={car.model3d.url} target="_blank" rel="noreferrer">{car.model3d.title}</a>” by {car.model3d.author}, {car.model3d.license}.</>
          )}
        </div>
      </div>
      <ProcedurePanel
        car={car}
        component={selected}
        step={step}
        setStep={(s) => { setExplode(false); setStep(s); }}
        prefs={prefs}
        update={update}
        show={show}
      />
    </div>
  );
}
