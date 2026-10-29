"use client";

import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Box3, Plane, Vector3, type Group, type Object3D } from "three";
import type { Vec3 } from "@/lib/types";

/*
 * 3D labels without drei <Html>: Subs register their label here, a DOM
 * overlay (outside the Canvas) renders them, and LabelProjector moves them
 * every frame. Avoids nested React roots, which break under React 19 dev mode.
 */
interface LabelEntry { id: string; text: string; obj: Object3D; offset: Vec3; visible: boolean }

export class LabelRegistry {
  entries = new Map<string, LabelEntry>();
  elements = new Map<string, HTMLDivElement>();
  private listeners = new Set<() => void>();
  private version = 0;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  getVersion = () => this.version;
  set(e: LabelEntry) {
    const prev = this.entries.get(e.id);
    this.entries.set(e.id, e);
    if (!prev || prev.visible !== e.visible || prev.text !== e.text) this.emit();
  }
  remove(id: string) { if (this.entries.delete(id)) this.emit(); }
  private emit() { this.version++; this.listeners.forEach((fn) => fn()); }
}

export const LabelCtx = createContext<LabelRegistry | null>(null);

const tmp = new Vector3();
const box = new Box3();
export function LabelProjector({ registry }: { registry: LabelRegistry }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useFrame(() => {
    registry.entries.forEach((e) => {
      const el = registry.elements.get(e.id);
      if (!el || !e.visible) return;
      box.setFromObject(e.obj);
      if (box.isEmpty()) e.obj.getWorldPosition(tmp);
      else box.getCenter(tmp);
      tmp.x += e.offset[0];
      tmp.y += e.offset[1];
      tmp.z += e.offset[2];
      tmp.project(camera);
      const behind = tmp.z > 1;
      const x = (tmp.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
      el.style.visibility = behind ? "hidden" : "visible";
    });
  });
  return null;
}

export type MatKind =
  | "steel" | "darkSteel" | "castIron" | "alu" | "rubber" | "plastic" | "caliper"
  | "copper" | "ceramic" | "pad" | "oilFilter" | "filterPaper" | "red" | "chrome";

const MATS: Record<MatKind, { color: string; metalness: number; roughness: number }> = {
  steel: { color: "#b9bdc3", metalness: 0.9, roughness: 0.35 },
  darkSteel: { color: "#4b4f55", metalness: 0.8, roughness: 0.5 },
  castIron: { color: "#5d6064", metalness: 0.6, roughness: 0.7 },
  alu: { color: "#c8ccd2", metalness: 0.85, roughness: 0.3 },
  rubber: { color: "#18191b", metalness: 0, roughness: 0.92 },
  plastic: { color: "#232529", metalness: 0.1, roughness: 0.6 },
  caliper: { color: "#3b3f45", metalness: 0.5, roughness: 0.45 },
  copper: { color: "#b87333", metalness: 0.9, roughness: 0.35 },
  ceramic: { color: "#ece7dc", metalness: 0, roughness: 0.35 },
  pad: { color: "#4b4239", metalness: 0.2, roughness: 0.95 },
  oilFilter: { color: "#1f4fa0", metalness: 0.4, roughness: 0.4 },
  filterPaper: { color: "#e6d6a2", metalness: 0, roughness: 0.95 },
  red: { color: "#b8261c", metalness: 0.2, roughness: 0.5 },
  chrome: { color: "#e8eaed", metalness: 1, roughness: 0.12 },
};

type Mode = "normal" | "selected" | "context" | "ghost";
const ModeCtx = createContext<Mode>("normal");

export function M({ k }: { k: MatKind }) {
  const mode = useContext(ModeCtx);
  const p = MATS[k];
  const opacity = mode === "ghost" ? 0.1 : mode === "context" ? 0.35 : 1;
  const transparent = opacity < 1;
  return (
    <meshStandardMaterial
      key={mode}
      color={p.color}
      metalness={p.metalness}
      roughness={p.roughness}
      transparent={transparent}
      opacity={opacity}
      depthWrite={!transparent}
      emissive={mode === "selected" ? "#22d3ee" : "#000000"}
      emissiveIntensity={mode === "selected" ? 0.35 : 0}
    />
  );
}

interface SceneState {
  selectedId: string | null;
  explode: boolean;
  /** Part keys currently taken off by the active procedure step. */
  detached: string[];
  /** Part keys the active step is about. */
  focus: string[];
  /** Free-move mode: parts can be dragged with the mouse. */
  moveMode: boolean;
  /** Changing this puts all dragged parts back. */
  resetToken: number;
  onSelect: (id: string) => void;
}
export const SceneCtx = createContext<SceneState>({
  selectedId: null, explode: false, detached: [], focus: [], moveMode: false, resetToken: 0, onSelect: () => {},
});

const dragPlane = new Plane();
const hit = new Vector3();
const camDir = new Vector3();

/**
 * A selectable/explodable sub-assembly.
 * `tags`: component ids this piece belongs to (highlighted, clickable).
 * `moves`: where the piece travels when that component's exploded view is on.
 * `part`: key used by procedure steps to detach/attach/highlight this piece.
 */
export function Sub({
  tags = [], moves = {}, part, label, labelOffset, position, rotation, children,
}: {
  tags?: string[];
  part?: string;
  moves?: Record<string, Vec3>;
  label?: string;
  labelOffset?: Vec3;
  position?: Vec3;
  rotation?: Vec3;
  children: ReactNode;
}) {
  const { selectedId, explode, detached, focus, moveMode, resetToken, onSelect } = useContext(SceneCtx);
  const [hover, setHover] = useState(false);
  const ref = useRef<Group>(null);
  const target = useMemo(() => new Vector3(), []);
  const manual = useMemo(() => new Vector3(), []);
  const drag = useRef<{ start: Vector3; base: Vector3 } | null>(null);
  const { camera, controls } = useThree() as unknown as { camera: import("three").Camera; controls: { enabled: boolean } | null };
  useEffect(() => { manual.set(0, 0, 0); }, [resetToken, manual]);

  const isTag = !!selectedId && tags.includes(selectedId);
  const isMove = !!selectedId && selectedId in moves;
  const involved = isTag || isMove;
  const isDetached = !!part && involved && detached.includes(part);
  const isFocus = !!part && involved && focus.includes(part);
  const stepMode = focus.length > 0;
  const mode: Mode = !selectedId
    ? "normal"
    : stepMode && involved
      ? isFocus ? "selected" : "context"
      : isTag ? "selected" : isMove ? "context" : "ghost";
  const offset = selectedId && (explode || isDetached) ? moves[selectedId] : undefined;

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    target.set(offset?.[0] ?? 0, offset?.[1] ?? 0, offset?.[2] ?? 0).add(manual);
    if (drag.current) g.position.copy(target);
    else g.position.lerp(target, 1 - Math.exp(-dt * 5));
  });

  // Drag in a camera-facing plane through the grab point; deltas are converted
  // to the parent's local space so mirrored/rotated assemblies move correctly.
  const toLocal = (v: Vector3) => ref.current!.parent!.worldToLocal(v.clone());
  const onDown = (e: ThreeEvent<PointerEvent>) => {
    if (!moveMode || e.button !== 0) return;
    e.stopPropagation();
    (e.target as unknown as Element).setPointerCapture(e.pointerId);
    camera.getWorldDirection(camDir);
    dragPlane.setFromNormalAndCoplanarPoint(camDir, e.point);
    drag.current = { start: toLocal(e.point), base: manual.clone() };
    if (controls) controls.enabled = false;
    document.body.style.cursor = "grabbing";
  };
  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return;
    e.stopPropagation();
    if (!e.ray.intersectPlane(dragPlane, hit)) return;
    manual.copy(drag.current.base).add(toLocal(hit).sub(drag.current.start));
  };
  const onUp = (e: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return;
    e.stopPropagation();
    (e.target as unknown as Element).releasePointerCapture(e.pointerId);
    drag.current = null;
    if (controls) controls.enabled = true;
    document.body.style.cursor = "";
  };

  const clickable = tags.length > 0 || moveMode;
  const registry = useContext(LabelCtx);
  const labelId = useId();
  const labelVisible = (involved && (stepMode ? isFocus : explode)) || (hover && !!label);
  const [ox, oy, oz] = labelOffset ?? [0, 0, 0];

  useEffect(() => {
    if (!registry || !label || !ref.current) return;
    registry.set({ id: labelId, text: label, obj: ref.current, offset: [ox, oy, oz], visible: labelVisible });
  }, [registry, label, labelId, labelVisible, ox, oy, oz]);
  useEffect(() => () => registry?.remove(labelId), [registry, labelId]);

  return (
    <group position={position} rotation={rotation}>
      <group
        ref={ref}
        onClick={tags.length && !moveMode ? (e) => { e.stopPropagation(); onSelect(tags[0]); } : undefined}
        onPointerDown={moveMode ? onDown : undefined}
        onPointerMove={moveMode ? onMove : undefined}
        onPointerUp={moveMode ? onUp : undefined}
        onPointerOver={clickable ? (e) => { e.stopPropagation(); setHover(true); if (!drag.current) document.body.style.cursor = moveMode ? "grab" : "pointer"; } : undefined}
        onPointerOut={clickable ? () => { setHover(false); if (!drag.current) document.body.style.cursor = ""; } : undefined}
      >
        <ModeCtx.Provider value={hover && mode !== "selected" ? "selected" : mode}>{children}</ModeCtx.Provider>
      </group>
    </group>
  );
}

/** DOM layer that renders registered labels; place next to the <Canvas>. */
export function LabelOverlay({ registry }: { registry: LabelRegistry }) {
  useSyncExternalStore(registry.subscribe, registry.getVersion, registry.getVersion);
  const visible = [...registry.entries.values()].filter((e) => e.visible);
  return (
    <div className="label-layer">
      {visible.map((e) => (
        <div
          key={e.id}
          className="tag"
          style={{ visibility: "hidden" }}
          ref={(el) => {
            if (el) registry.elements.set(e.id, el);
            else registry.elements.delete(e.id);
          }}
        >
          {e.text}
        </div>
      ))}
    </div>
  );
}

/**
 * Glowing marker for every component, so jobs without a detailed 3D model
 * can still be found and selected on the car.
 */
export function Hotspot({ id, name, position, active, dim }: { id: string; name: string; position: Vec3; active: boolean; dim: boolean }) {
  const { onSelect, moveMode } = useContext(SceneCtx);
  const registry = useContext(LabelCtx);
  const labelId = useId();
  const ref = useRef<Group>(null);
  const ring = useRef<import("three").Mesh>(null);
  const [hover, setHover] = useState(false);
  const show = hover;

  useEffect(() => {
    if (!registry || !ref.current) return;
    registry.set({ id: labelId, text: name, obj: ref.current, offset: [0, 0.09, 0], visible: show });
  }, [registry, labelId, name, show]);
  useEffect(() => () => registry?.remove(labelId), [registry, labelId]);

  useFrame(({ clock, camera }) => {
    if (!ring.current) return;
    const t = (clock.elapsedTime * 0.8 + position[0]) % 1;
    ring.current.scale.setScalar(1 + t * 1.6);
    (ring.current.material as import("three").MeshBasicMaterial).opacity = (1 - t) * (dim ? 0.15 : 0.6);
    ring.current.quaternion.copy(camera.quaternion);
  });

  if (moveMode) return null;
  const color = active ? "#22d3ee" : hover ? "#7dd3fc" : "#38bdf8";
  return (
    <group ref={ref} position={position}>
      <mesh
        renderOrder={10}
        onClick={(e) => { e.stopPropagation(); onSelect(id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}
      >
        <sphereGeometry args={[active ? 0.035 : 0.025, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={dim ? 0.25 : 0.95} depthTest={false} />
      </mesh>
      <mesh ref={ring} raycast={() => null} renderOrder={10}>
        <ringGeometry args={[0.035, 0.045, 32]} />
        <meshBasicMaterial color={color} transparent depthTest={false} />
      </mesh>
    </group>
  );
}
