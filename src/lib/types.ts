export type Vec3 = [number, number, number];

/**
 * How authoritative a source is. Lower rank = more trustworthy.
 * oem: Renault document · manufacturer: the part maker's own instructions
 * secondary: published repair data / catalogues · community: forums.
 */
export type SourceTier = "oem" | "manufacturer" | "secondary" | "community";
export const TIER_RANK: Record<SourceTier, number> = { oem: 0, manufacturer: 1, secondary: 2, community: 3 };
export const TIER_LABEL: Record<SourceTier, string> = {
  oem: "Renault",
  manufacturer: "Part maker",
  secondary: "Published data",
  community: "Community",
};

export interface SpecSource {
  tier: SourceTier;
  title: string;
  url?: string;
  /** Page, section or short quote locating the value in the source. */
  locator?: string;
  accessed: string;
}

/**
 * A safety-relevant tightening value. A stage `value` stays null unless a
 * source backs it; the UI never renders an unsourced number.
 */
export interface TorqueSpec {
  id: string;
  fastener: string;
  qty?: number;
  stages: { kind: "torque" | "angle"; value: number | null; unit: "Nm" | "deg" }[];
  /** Free-text instruction when the spec is not a torque (e.g. "hand-tight + ¾ turn"). */
  instruction?: string;
  thread?: string;
  replaceAfterUse?: boolean;
  threadLock?: boolean;
  notes?: string;
  /** Disagreement between sources, shown prominently. */
  conflict?: string;
  sources: SpecSource[];
}

export interface SpecItem {
  group: string;
  label: string;
  value: string | null;
  notes?: string;
  sources: SpecSource[];
}

export interface PartRef {
  name: string;
  qty?: string;
  oe?: string[];
  equivalents?: string[];
  replace?: "always" | "if-worn" | "optional";
  notes?: string;
  sources?: SpecSource[];
}

export interface ProcedureStep {
  text: string;
  /** TorqueSpec id used in this step. */
  torque?: string;
  warning?: string;
  tip?: string;
  /** 3D part keys taken off in this step (removal). */
  detach?: string[];
  /** 3D part keys fitted back in this step (installation). */
  attach?: string[];
  /** 3D part keys to highlight; defaults to detach/attach. */
  focus?: string[];
}

export const SYSTEMS = [
  "Wheels", "Brakes", "Suspension", "Steering", "Engine", "Timing", "Intake", "Fuel", "Cooling",
  "Exhaust", "Transmission", "Electrical", "Lighting", "HVAC", "Body",
] as const;
export type System = (typeof SYSTEMS)[number];

export interface Fault { symptom: string; causes: string }

export interface Component {
  id: string;
  name: string;
  system: System;
  /** Assembly group inside the system, e.g. "Gearbox", "Cylinder head". */
  subsystem?: string;
  /** Camera focus point, car-local metres (x: forward, y: up, z: left). */
  position: Vec3;
  difficulty: 1 | 2 | 3 | 4 | 5;
  timeMinutes: number;
  summary: string;
  interval?: string;
  safety: string[];
  tools: string[];
  parts: PartRef[];
  torques: TorqueSpec[];
  specs: SpecItem[];
  removal: ProcedureStep[];
  installation: ProcedureStep[];
  checks: string[];
  faults: Fault[];
}

/** Approximate visual dimensions in metres — not a service specification. */
export interface CarDimensions {
  length: number;
  width: number;
  wheelbase: number;
  /** Shift of the wheelbase centre from the body centre (+ = forward). */
  axleOffset: number;
  wheelRadius: number;
  /** Half track width (wheel centre to car centreline). */
  halfTrack: number;
}

export interface Model3D {
  /** Path under /public, e.g. "/models/foo.glb". */
  file: string;
  title: string;
  author: string;
  url: string;
  license: string;
  /** Extra yaw (radians) if the model faces backwards after auto-alignment. */
  rotationY?: number;
}

export interface Car {
  id: string;
  brandId: string;
  model: string;
  generation: string;
  body: string;
  trim: string;
  engine: string;
  years: string;
  dimensions: CarDimensions;
  model3d?: Model3D;
  /** Vehicle-wide data: fluids, tyres, service intervals. */
  specs: SpecItem[];
  components: Component[];
}

export interface Brand {
  id: string;
  name: string;
  country?: string;
}

/** Share of a component's torque values that have a source. */
export function coverage(c: Component): { sourced: number; total: number } {
  const total = c.torques.length + c.specs.length;
  const sourced = c.torques.filter(hasValue).length + c.specs.filter((s) => s.value !== null && s.sources.length > 0).length;
  return { sourced, total };
}

export const bestTier = (sources: SpecSource[]): SourceTier | null =>
  sources.reduce<SourceTier | null>(
    (best, s) => (best === null || TIER_RANK[s.tier] < TIER_RANK[best] ? s.tier : best),
    null,
  );

export function hasValue(spec: TorqueSpec): boolean {
  return spec.sources.length > 0 && (!!spec.instruction || spec.stages.every((s) => s.value !== null));
}
