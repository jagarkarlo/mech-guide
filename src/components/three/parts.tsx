"use client";

import { useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
import { M, Sub } from "./scene";
import type { Vec3 } from "@/lib/types";

const PI = Math.PI;
const AXLE_Z: Vec3 = [PI / 2, 0, 0];

/* ---------- Wheels & brakes ---------- */

/** 225/45 R17-style wheel, 5×114.3 bolt pattern. `side` = +1 left, -1 right. */
function WheelGeometry({ side }: { side: 1 | -1 }) {
  const spokes = [0, 1, 2, 3, 4];
  return (
    <group>
      <mesh rotation={[0, 0, 0]} scale={[1, 1, 1.32]}>
        <torusGeometry args={[0.236, 0.082, 24, 64]} />
        <M k="rubber" />
      </mesh>
      <mesh rotation={AXLE_Z}>
        <cylinderGeometry args={[0.216, 0.216, 0.2, 48, 1, true]} />
        <M k="alu" />
      </mesh>
      <mesh rotation={AXLE_Z} position={[0, 0, side * 0.085]}>
        <torusGeometry args={[0.212, 0.012, 12, 48]} />
        <M k="alu" />
      </mesh>
      {spokes.map((i) => (
        <mesh key={i} rotation={[0, 0, (i * 2 * PI) / 5]} position={[0, 0, side * 0.07]}>
          <boxGeometry args={[0.05, 0.4, 0.025]} />
          <M k="alu" />
        </mesh>
      ))}
      <mesh rotation={AXLE_Z} position={[0, 0, side * 0.07]}>
        <cylinderGeometry args={[0.085, 0.085, 0.03, 32]} />
        <M k="alu" />
      </mesh>
      <mesh rotation={AXLE_Z} position={[0, 0, side * 0.087]}>
        <cylinderGeometry args={[0.03, 0.03, 0.01, 24]} />
        <M k="chrome" />
      </mesh>
    </group>
  );
}

function WheelBolts({ side }: { side: 1 | -1 }) {
  const pcd = 0.05715;
  return (
    <group position={[0, 0, side * 0.09]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i * 2 * PI) / 5 + PI / 10;
        return (
          <group key={i} position={[Math.cos(a) * pcd, Math.sin(a) * pcd, 0]}>
            <mesh rotation={AXLE_Z}>
              <cylinderGeometry args={[0.0105, 0.0105, 0.016, 6]} />
              <M k="chrome" />
            </mesh>
            <mesh rotation={AXLE_Z} position={[0, 0, -side * 0.03]}>
              <cylinderGeometry args={[0.0065, 0.0065, 0.045, 12]} />
              <M k="steel" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Ventilated disc + floating caliper, viewed from outboard side. */
function BrakeGeometry({ side, tagged }: { side: 1 | -1; tagged: boolean }) {
  const t = tagged ? ["front-brake-pads"] : [];
  const out = (v: number): Vec3 => [0, 0, side * v];
  const vanes = Array.from({ length: 36 }, (_, i) => i);
  return (
    <group>
      {/* disc: two friction faces + vanes + hat */}
      <Sub part="disc" tags={tagged ? ["front-brake-disc"] : []} moves={tagged ? { "front-brake-pads": [0, 0, 0], "front-brake-disc": [0, 0, side * 0.5] } : {}} label={tagged ? "Brake disc" : undefined}>
        {[-0.009, 0.009].map((z) => (
          <mesh key={z} rotation={AXLE_Z} position={[0, 0, z]}>
            <cylinderGeometry args={[0.14, 0.14, 0.007, 64]} />
            <M k="castIron" />
          </mesh>
        ))}
        {vanes.map((i) => (
          <mesh key={i} rotation={[0, 0, (i * 2 * PI) / 36]} position={[Math.cos((i * 2 * PI) / 36) * 0.11, Math.sin((i * 2 * PI) / 36) * 0.11, 0]}>
            <boxGeometry args={[0.055, 0.004, 0.012]} />
            <M k="darkSteel" />
          </mesh>
        ))}
        <mesh rotation={AXLE_Z} position={out(0.02)}>
          <cylinderGeometry args={[0.078, 0.078, 0.04, 48]} />
          <M k="castIron" />
        </mesh>
      </Sub>

      {/* hub / knuckle */}
      <mesh rotation={AXLE_Z} position={out(-0.04)}>
        <cylinderGeometry args={[0.07, 0.07, 0.06, 32]} />
        <M k="castIron" />
      </mesh>

      {/* caliper sits behind the axle (towards -x) */}
      <group position={[-0.112, 0.03, 0]} rotation={[0, 0, -0.25]}>
        <Sub part="caliper" tags={t} moves={tagged ? { "front-brake-pads": [0, 0.2, side * 0.3], "front-brake-disc": [-0.15, 0.25, side * 0.22] } : {}} label={tagged ? "Caliper" : undefined}>
          <mesh position={out(-0.028)}>
            <boxGeometry args={[0.07, 0.13, 0.04]} />
            <M k="caliper" />
          </mesh>
          <mesh position={out(0.022)}>
            <boxGeometry args={[0.055, 0.12, 0.018]} />
            <M k="caliper" />
          </mesh>
          <mesh position={[-0.03, 0, 0]}>
            <boxGeometry args={[0.022, 0.12, 0.07]} />
            <M k="caliper" />
          </mesh>
          <mesh rotation={AXLE_Z} position={out(-0.05)}>
            <cylinderGeometry args={[0.027, 0.027, 0.012, 24]} />
            <M k="caliper" />
          </mesh>
        </Sub>

        <Sub part="guide-pins" tags={t} moves={tagged ? { "front-brake-pads": [0.0, 0.38, side * 0.42], "front-brake-disc": [-0.15, 0.42, side * 0.34] } : {}} label={tagged ? "Guide pin bolts ×2" : undefined}>
          {[0.075, -0.075].map((y) => (
            <mesh key={y} rotation={AXLE_Z} position={[-0.01, y, side * -0.03]}>
              <cylinderGeometry args={[0.007, 0.007, 0.06, 12]} />
              <M k="steel" />
            </mesh>
          ))}
        </Sub>

        <Sub part="pad-outer" tags={t} moves={tagged ? { "front-brake-pads": [0.0, -0.12, side * 0.2], "front-brake-disc": [-0.15, 0.06, side * 0.3] } : {}} label={tagged ? "Outer pad" : undefined}>
          <mesh position={out(0.0135)}>
            <boxGeometry args={[0.045, 0.11, 0.004]} />
            <M k="steel" />
          </mesh>
          <mesh position={out(0.0095)}>
            <boxGeometry args={[0.042, 0.105, 0.008]} />
            <M k="pad" />
          </mesh>
        </Sub>

        <Sub part="pad-inner" tags={t} moves={tagged ? { "front-brake-pads": [0.0, -0.26, side * 0.1], "front-brake-disc": [-0.15, 0.06, side * 0.14] } : {}} label={tagged ? "Inner pad" : undefined}>
          <mesh position={out(-0.0135)}>
            <boxGeometry args={[0.045, 0.11, 0.004]} />
            <M k="steel" />
          </mesh>
          <mesh position={out(-0.0095)}>
            <boxGeometry args={[0.042, 0.105, 0.008]} />
            <M k="pad" />
          </mesh>
        </Sub>

        <Sub part="carrier" moves={tagged ? { "front-brake-pads": [0, 0, 0], "front-brake-disc": [-0.22, -0.1, side * 0.2] } : {}} label={tagged ? "Caliper carrier" : undefined}>
          {[0.07, -0.07].map((y) => (
            <mesh key={y} position={[0.0, y, 0]}>
              <boxGeometry args={[0.03, 0.02, 0.06]} />
              <M k="castIron" />
            </mesh>
          ))}
        </Sub>
      </group>
    </group>
  );
}

function CoilSpring({ radius, height, turns }: { radius: number; height: number; turns: number }) {
  const curve = useMemo(() => {
    const pts: Vector3[] = [];
    const n = turns * 24;
    for (let i = 0; i <= n; i++) {
      const a = (i / 24) * 2 * PI;
      pts.push(new Vector3(Math.cos(a) * radius, (i / n) * height - height / 2, Math.sin(a) * radius));
    }
    return new CatmullRomCurve3(pts);
  }, [radius, height, turns]);
  return (
    <mesh>
      <tubeGeometry args={[curve, turns * 24, 0.009, 8, false]} />
      <M k="red" />
    </mesh>
  );
}

function Strut() {
  return (
    <group>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 16]} />
        <M k="darkSteel" />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.2, 12]} />
        <M k="chrome" />
      </mesh>
      <group position={[0, 0.13, 0]}>
        <CoilSpring radius={0.06} height={0.24} turns={6} />
      </group>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.075, 0.07, 0.02, 24]} />
        <M k="darkSteel" />
      </mesh>
    </group>
  );
}

export function Corner({
  position, side, front, tagged,
}: { position: Vec3; side: 1 | -1; front: boolean; tagged: boolean }) {
  const wheelTags = tagged ? ["front-wheel"] : [];
  const wheelMoves: Record<string, Vec3> = tagged
    ? { "front-wheel": [0, 0, side * 0.45], "front-brake-pads": [0, 0, side * 0.75], "front-brake-disc": [0, 0, side * 0.95] }
    : {};
  const boltMoves: Record<string, Vec3> = tagged
    ? { "front-wheel": [0, 0, side * 0.75], "front-brake-pads": [0, 0, side * 1.0], "front-brake-disc": [0, 0, side * 1.2] }
    : {};
  return (
    <group position={position}>
      <Sub part="wheel" tags={wheelTags} moves={wheelMoves} label={tagged ? "Wheel" : undefined}>
        <WheelGeometry side={side} />
      </Sub>
      <Sub part="wheel-bolts" tags={wheelTags} moves={boltMoves} label={tagged ? "Wheel bolts ×5" : undefined} labelOffset={[0, -0.12, 0]}>
        <WheelBolts side={side} />
      </Sub>
      <group position={[0, 0, -side * 0.13]}>
        {front ? (
          <BrakeGeometry side={side} tagged={tagged} />
        ) : (
          <mesh rotation={AXLE_Z}>
            <cylinderGeometry args={[0.125, 0.125, 0.06, 40]} />
            <M k="castIron" />
          </mesh>
        )}
      </group>
      {front && (
        <Sub>
          <group position={[0.0, 0.33, -side * 0.18]} rotation={[side * 0.12, 0, 0]}>
            <Strut />
          </group>
        </Sub>
      )}
    </group>
  );
}

/* ---------- Engine bay ---------- */

function SparkPlug() {
  return (
    <group>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.0075, 0.0085, 0.05, 16]} />
        <M k="ceramic" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.0105, 0.0105, 0.018, 6]} />
        <M k="steel" />
      </mesh>
      <mesh position={[0, -0.022, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.026, 16]} />
        <M k="steel" />
      </mesh>
      <mesh position={[0, -0.037, 0]}>
        <boxGeometry args={[0.002, 0.004, 0.006]} />
        <M k="copper" />
      </mesh>
    </group>
  );
}

function Coil() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.016, 0.016, 0.1, 16]} />
        <M k="plastic" />
      </mesh>
      <mesh position={[0, 0.06, 0.0]}>
        <boxGeometry args={[0.07, 0.03, 0.045]} />
        <M k="plastic" />
      </mesh>
      <mesh position={[0.03, 0.06, 0]}>
        <boxGeometry args={[0.025, 0.02, 0.025]} />
        <M k="red" />
      </mesh>
    </group>
  );
}

const CYL_Z = [-0.165, -0.055, 0.055, 0.165];

/** K4M-style transverse inline-4, gearbox on the left (+z). */
export function Engine({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <Sub>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.3, 0.32, 0.5]} />
          <M k="castIron" />
        </mesh>
        <mesh position={[0, 0.725, 0]}>
          <boxGeometry args={[0.28, 0.13, 0.5]} />
          <M k="alu" />
        </mesh>
        <mesh position={[0, 0.81, 0]}>
          <boxGeometry args={[0.22, 0.04, 0.46]} />
          <M k="plastic" />
        </mesh>
        {/* timing cover + crank pulley on the right side */}
        <mesh position={[0, 0.58, -0.27]}>
          <boxGeometry args={[0.26, 0.42, 0.04]} />
          <M k="plastic" />
        </mesh>
        <mesh rotation={AXLE_Z} position={[0.02, 0.4, -0.3]}>
          <cylinderGeometry args={[0.07, 0.07, 0.03, 32]} />
          <M k="darkSteel" />
        </mesh>
        {/* alternator */}
        <mesh rotation={AXLE_Z} position={[0.19, 0.6, -0.17]}>
          <cylinderGeometry args={[0.065, 0.065, 0.13, 24]} />
          <M k="alu" />
        </mesh>
        {/* intake plenum + runners (rear of engine) */}
        <mesh rotation={AXLE_Z} position={[-0.26, 0.74, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.44, 24]} />
          <M k="plastic" />
        </mesh>
        {CYL_Z.map((z) => (
          <mesh key={z} position={[-0.18, 0.72, z]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.022, 0.022, 0.13, 12]} />
            <M k="plastic" />
          </mesh>
        ))}
        {/* exhaust manifold (front) */}
        {CYL_Z.map((z) => (
          <mesh key={z} position={[0.18, 0.64, z * 0.8]} rotation={[0, 0, -0.9]}>
            <cylinderGeometry args={[0.018, 0.018, 0.14, 12]} />
            <M k="darkSteel" />
          </mesh>
        ))}
        <mesh position={[0.22, 0.5, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 16]} />
          <M k="darkSteel" />
        </mesh>
        {/* gearbox */}
        <mesh position={[-0.02, 0.48, 0.38]}>
          <boxGeometry args={[0.3, 0.3, 0.24]} />
          <M k="alu" />
        </mesh>
        <mesh rotation={AXLE_Z} position={[-0.02, 0.45, 0.28]}>
          <cylinderGeometry args={[0.16, 0.13, 0.08, 32]} />
          <M k="alu" />
        </mesh>
      </Sub>

      {/* sump */}
      <Sub>
        <mesh position={[0, 0.29, 0]}>
          <boxGeometry args={[0.28, 0.1, 0.46]} />
          <M k="alu" />
        </mesh>
      </Sub>

      <Sub part="drain-plug" tags={["oil-filter"]} moves={{ "oil-filter": [0, -0.14, 0] }} label="Drain plug + seal">
        <mesh position={[-0.05, 0.232, 0.1]}>
          <cylinderGeometry args={[0.012, 0.012, 0.016, 6]} />
          <M k="steel" />
        </mesh>
        <mesh position={[-0.05, 0.242, 0.1]}>
          <cylinderGeometry args={[0.014, 0.014, 0.003, 16]} />
          <M k="copper" />
        </mesh>
      </Sub>

      <Sub part="oil-filter" tags={["oil-filter"]} moves={{ "oil-filter": [0.2, -0.06, 0] }} label="Oil filter">
        <group position={[0.2, 0.42, 0.12]} rotation={[0, 0, -PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.038, 0.038, 0.085, 32]} />
            <M k="oilFilter" />
          </mesh>
          <mesh position={[0, -0.045, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.006, 32]} />
            <M k="rubber" />
          </mesh>
        </group>
      </Sub>

      {CYL_Z.map((z, i) => (
        <Sub key={`coil-${z}`} part="coils" tags={["spark-plugs"]} moves={{ "spark-plugs": [0, 0.26, 0] }} label={i === 0 ? "Ignition coils ×4" : undefined}>
          <group position={[0, 0.86, z]}>
            <Coil />
          </group>
        </Sub>
      ))}
      {CYL_Z.map((z, i) => (
        <Sub key={`plug-${z}`} part="plugs" tags={["spark-plugs"]} moves={{ "spark-plugs": [0, 0.15, 0] }} label={i === 0 ? "Spark plugs ×4" : undefined}>
          <group position={[0, 0.76, z]}>
            <SparkPlug />
          </group>
        </Sub>
      ))}
    </group>
  );
}

export function Battery({ position }: { position: Vec3 }) {
  const id = "battery";
  return (
    <group position={position}>
      <Sub>
        <mesh position={[0, -0.105, 0]}>
          <boxGeometry args={[0.28, 0.02, 0.2]} />
          <M k="plastic" />
        </mesh>
      </Sub>
      <Sub part="battery" tags={[id]} moves={{ [id]: [0, 0.42, 0] }} label="Battery">
        <mesh>
          <boxGeometry args={[0.24, 0.19, 0.17]} />
          <M k="plastic" />
        </mesh>
        <mesh position={[0, 0.098, 0]}>
          <boxGeometry args={[0.23, 0.006, 0.16]} />
          <M k="darkSteel" />
        </mesh>
        {[-0.085, 0.085].map((x) => (
          <mesh key={x} position={[x, 0.11, 0.055]}>
            <cylinderGeometry args={[0.009, 0.01, 0.02, 16]} />
            <M k="steel" />
          </mesh>
        ))}
      </Sub>
      <Sub part="neg-clamp" tags={[id]} moves={{ [id]: [0, 0.2, 0.05] }} label="Negative (−) clamp">
        <mesh position={[0.085, 0.12, 0.055]}>
          <boxGeometry args={[0.03, 0.02, 0.03]} />
          <M k="darkSteel" />
        </mesh>
      </Sub>
      <Sub part="pos-clamp" tags={[id]} moves={{ [id]: [0, 0.27, 0.05] }} label="Positive (+) clamp">
        <mesh position={[-0.085, 0.12, 0.055]}>
          <boxGeometry args={[0.035, 0.022, 0.035]} />
          <M k="red" />
        </mesh>
      </Sub>
      <Sub part="hold-down" tags={[id]} moves={{ [id]: [0, 0, -0.22] }} label="Hold-down clamp">
        <mesh position={[0, -0.085, -0.095]}>
          <boxGeometry args={[0.2, 0.02, 0.025]} />
          <M k="darkSteel" />
        </mesh>
      </Sub>
    </group>
  );
}

export function AirBox({ position }: { position: Vec3 }) {
  const id = "air-filter";
  const pleats = Array.from({ length: 14 }, (_, i) => i);
  return (
    <group position={position}>
      <Sub part="airbox-base" tags={[id]} moves={{ [id]: [0, 0, 0] }} label="Airbox base">
        <mesh position={[0, -0.03, 0]}>
          <boxGeometry args={[0.24, 0.06, 0.3]} />
          <M k="plastic" />
        </mesh>
        <mesh rotation={[0, 0, PI / 2]} position={[-0.18, -0.02, 0.0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.14, 16]} />
          <M k="rubber" />
        </mesh>
      </Sub>
      <Sub part="filter" tags={[id]} moves={{ [id]: [0, 0.16, 0] }} label="Filter element">
        {pleats.map((i) => (
          <mesh key={i} position={[-0.1 + i * 0.0154, 0.01, 0]}>
            <boxGeometry args={[0.007, 0.03, 0.27]} />
            <M k="filterPaper" />
          </mesh>
        ))}
      </Sub>
      <Sub part="airbox-lid" tags={[id]} moves={{ [id]: [0, 0.32, 0] }} label="Airbox lid">
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[0.24, 0.04, 0.3]} />
          <M k="plastic" />
        </mesh>
      </Sub>
    </group>
  );
}

/* ---------- Chassis scenery ---------- */

export function Chassis({ frontX, rearX }: { frontX: number; rearX: number }) {
  return (
    <Sub>
      {/* radiator */}
      <mesh position={[1.98, 0.5, 0]}>
        <boxGeometry args={[0.04, 0.38, 0.68]} />
        <M k="alu" />
      </mesh>
      {/* front subframe */}
      <mesh position={[frontX, 0.2, 0]}>
        <boxGeometry args={[0.5, 0.05, 1.0]} />
        <M k="darkSteel" />
      </mesh>
      {/* driveshafts */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[frontX, 0.32, s * 0.38]} rotation={AXLE_Z}>
          <cylinderGeometry args={[0.014, 0.014, 0.5, 12]} />
          <M k="darkSteel" />
        </mesh>
      ))}
      {/* rear torsion beam + trailing arms */}
      <mesh position={[rearX + 0.18, 0.28, 0]} rotation={AXLE_Z}>
        <cylinderGeometry args={[0.035, 0.035, 1.3, 16]} />
        <M k="darkSteel" />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[rearX + 0.1, 0.3, s * 0.62]} rotation={[0, 0, PI / 2]}>
          <boxGeometry args={[0.06, 0.4, 0.05]} />
          <M k="darkSteel" />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <group key={s} position={[rearX - 0.05, 0.48, s * 0.55]}>
          <CoilSpring radius={0.055} height={0.2} turns={5} />
        </group>
      ))}
      {/* exhaust line */}
      <mesh position={[0.1, 0.18, -0.12]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, 2.4, 12]} />
        <M k="darkSteel" />
      </mesh>
      <mesh position={[-1.85, 0.25, -0.35]} rotation={AXLE_Z}>
        <cylinderGeometry args={[0.11, 0.11, 0.45, 24]} />
        <M k="darkSteel" />
      </mesh>
      <mesh position={[-2.12, 0.22, -0.5]} rotation={[0, 0, PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 16]} />
        <M k="chrome" />
      </mesh>
      {/* fuel tank */}
      <mesh position={[-0.75, 0.3, 0.1]}>
        <boxGeometry args={[0.55, 0.2, 0.9]} />
        <M k="plastic" />
      </mesh>
    </Sub>
  );
}
