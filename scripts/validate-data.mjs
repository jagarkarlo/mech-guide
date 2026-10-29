// Checks research JSON: every value has a source, steps reference real torques and 3D parts.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const SYSTEMS = ["Wheels", "Brakes", "Suspension", "Steering", "Engine", "Timing", "Intake", "Fuel", "Cooling", "Exhaust", "Transmission", "Electrical", "Lighting", "HVAC", "Body"];
const TIERS = ["oem", "manufacturer", "secondary", "community"];
const PARTS = ["wheel", "wheel-bolts", "disc", "caliper", "guide-pins", "pad-outer", "pad-inner", "carrier", "drain-plug", "oil-filter", "coils", "plugs", "battery", "neg-clamp", "pos-clamp", "hold-down", "airbox-base", "filter", "airbox-lid"];

const dir = path.resolve("src/data/megane3");
const errors = [];
const ids = new Set();
let sourced = 0, missing = 0;

const checkSources = (where, sources) => {
  for (const s of sources ?? []) {
    if (!TIERS.includes(s.tier)) errors.push(`${where}: bad tier ${s.tier}`);
    if (!/^https?:\/\//.test(s.url ?? "")) errors.push(`${where}: source without URL`);
  }
};

const TAXONOMY = "taxonomy.json";
let taxParts = 0;
try {
  const names = new Set();
  for (const g of JSON.parse(readFileSync(path.join(dir, TAXONOMY), "utf8"))) {
    if (!SYSTEMS.includes(g.system)) errors.push(`${TAXONOMY}: unknown system ${g.system}`);
    if (!g.subsystem) errors.push(`${TAXONOMY}: group without subsystem`);
    for (const p of g.parts ?? []) {
      taxParts++;
      const key = `${g.system}/${g.subsystem}/${p.name}`.toLowerCase();
      if (names.has(key)) errors.push(`${TAXONOMY}: duplicate part ${key}`);
      names.add(key);
      if (p.manualPage && !/^https?:\/\//.test(p.manualPage)) errors.push(`${TAXONOMY}: bad manualPage for ${p.name}`);
    }
  }
} catch (e) {
  if (e.code !== "ENOENT") errors.push(`${TAXONOMY}: ${e.message}`);
}

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json") && f !== TAXONOMY)) {
  const comps = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
  for (const c of comps) {
    const at = `${file}:${c.id}`;
    if (ids.has(c.id)) errors.push(`${at}: duplicate id`);
    ids.add(c.id);
    if (!SYSTEMS.includes(c.system)) errors.push(`${at}: unknown system ${c.system}`);
    if (!Array.isArray(c.position) || c.position.length !== 3) errors.push(`${at}: bad position`);
    for (const k of ["safety", "tools", "parts", "torques", "specs", "removal", "installation", "checks", "faults"])
      if (!Array.isArray(c[k])) errors.push(`${at}: ${k} must be an array`);
    const torqueIds = new Set();
    for (const t of c.torques ?? []) {
      torqueIds.add(t.id);
      checkSources(`${at} torque ${t.id}`, t.sources);
      const hasNum = t.stages?.some((s) => s.value !== null) || !!t.instruction;
      if (hasNum && !t.sources?.length) errors.push(`${at} torque ${t.id}: value without source`);
      if (hasNum && t.sources?.length) sourced++; else missing++;
      for (const st of t.stages ?? []) {
        if (st.value !== null && !(typeof st.value === "number" && st.value > 0)) errors.push(`${at} torque ${t.id}: bad value ${st.value}`);
        if ((st.kind === "angle") !== (st.unit === "deg")) errors.push(`${at} torque ${t.id}: unit ${st.unit} does not match ${st.kind}`);
      }
    }
    for (const s of c.specs ?? []) {
      checkSources(`${at} spec ${s.label}`, s.sources);
      if (s.value !== null && !s.sources?.length) errors.push(`${at} spec "${s.label}": value without source`);
      if (s.value !== null && s.sources?.length) sourced++; else missing++;
    }
    for (const p of c.parts ?? []) checkSources(`${at} part ${p.name}`, p.sources);
    for (const st of [...(c.removal ?? []), ...(c.installation ?? [])]) {
      if (st.torque && !torqueIds.has(st.torque)) errors.push(`${at}: step references unknown torque "${st.torque}"`);
      for (const k of [...(st.detach ?? []), ...(st.attach ?? []), ...(st.focus ?? [])])
        if (!PARTS.includes(k)) errors.push(`${at}: unknown 3D part key "${k}"`);
    }
  }
}

console.log(`${ids.size} components · ${sourced} sourced values · ${missing} not found · ${taxParts} parts in taxonomy`);
if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join("\n"));
  process.exit(1);
}
console.log("✓ data valid");
