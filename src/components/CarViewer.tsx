"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Grid, Lightformer, OrbitControls } from "@react-three/drei";
import { Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { Car, Vec3 } from "@/lib/types";
import { Hotspot, LabelCtx, LabelOverlay, LabelProjector, LabelRegistry, SceneCtx } from "./three/scene";
import { AirBox, Battery, Chassis, Corner, Engine } from "./three/parts";
import { GltfBody, ProceduralBody } from "./three/CarBody";

const HOME_TARGET: Vec3 = [0.2, 0.6, 0];
const HOME_CAM: Vec3 = [5.2, 3.0, 5.2];

function CameraRig({ focus, resetKey }: { focus: Vec3 | null; resetKey: number }) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const remaining = useRef(0);
  const goalTarget = useMemo(() => new Vector3(), []);
  const goalCam = useMemo(() => new Vector3(), []);
  const key = focus ? focus.join(",") : "home";

  useEffect(() => {
    const f = key === "home" ? null : (key.split(",").map(Number) as Vec3);
    if (f) {
      const side = f[2] >= 0 ? 1 : -1;
      goalTarget.set(...f);
      goalCam.set(f[0] + 1.5, f[1] + 0.9, f[2] + side * 2.1);
    } else {
      goalTarget.set(...HOME_TARGET);
      goalCam.set(...HOME_CAM);
    }
    remaining.current = 1.4;
  }, [key, resetKey, goalTarget, goalCam]);

  useFrame((_, dt) => {
    if (remaining.current <= 0 || !controls) return;
    remaining.current -= dt;
    const k = 1 - Math.exp(-dt * 4);
    controls.target.lerp(goalTarget, k);
    camera.position.lerp(goalCam, k);
    controls.update();
  });
  return null;
}

export default function CarViewer({
  car, modelUrl, selectedId, explode, detached, focus, bodyOpacity, resetKey, moveMode, resetToken, hotspots, onSelect,
}: {
  car: Car;
  modelUrl: string | null;
  selectedId: string | null;
  explode: boolean;
  detached: string[];
  focus: string[];
  bodyOpacity: number;
  resetKey: number;
  moveMode: boolean;
  resetToken: number;
  hotspots: string[];
  onSelect: (id: string) => void;
}) {
  const d = car.dimensions;
  const fx = d.wheelbase / 2 + d.axleOffset;
  const rx = -d.wheelbase / 2 + d.axleOffset;
  const y = d.wheelRadius;
  const t = d.halfTrack;
  const camFocus = car.components.find((c) => c.id === selectedId)?.position ?? null;
  const opacity = selectedId ? Math.min(bodyOpacity, 0.12) : bodyOpacity;
  const labels = useMemo(() => new LabelRegistry(), []);

  return (
    <div className="viewer">
      <LabelOverlay registry={labels} />
      <Canvas camera={{ position: HOME_CAM, fov: 40, near: 0.05, far: 100 }} dpr={[1, 2]} gl={{ preserveDrawingBuffer: true }}>
        <color attach="background" args={["#05080d"]} />
        <fog attach="fog" args={["#05080d", 9, 22]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 8, 4]} intensity={1.4} />
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
          <Lightformer intensity={1} position={[-5, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
          <Lightformer intensity={1} position={[5, 2, 0]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
          <Lightformer intensity={0.6} position={[0, 2, 6]} scale={[10, 3, 1]} />
        </Environment>

        <LabelCtx.Provider value={labels}>
        <SceneCtx.Provider value={{ selectedId, explode, detached, focus, moveMode, resetToken, onSelect }}>
          {car.components.filter((c) => hotspots.includes(c.id)).map((c) => (
            <Hotspot key={c.id} id={c.id} name={c.name} position={c.position} active={c.id === selectedId} dim={!!selectedId && c.id !== selectedId} />
          ))}
          <Corner position={[fx, y, t]} side={1} front tagged />
          <Corner position={[fx, y, -t]} side={-1} front tagged={false} />
          <Corner position={[rx, y, t]} side={1} front={false} tagged={false} />
          <Corner position={[rx, y, -t]} side={-1} front={false} tagged={false} />
          <Engine position={[1.3, -0.03, -0.05]} />
          <Battery position={[1.52, 0.76, 0.5]} />
          <AirBox position={[1.64, 0.76, -0.32]} />
          <Chassis frontX={fx} rearX={rx} />
        </SceneCtx.Provider>
        </LabelCtx.Provider>
        <LabelProjector registry={labels} />

        <Suspense fallback={<ProceduralBody dims={d} opacity={opacity} />}>
          {modelUrl ? (
            <GltfBody url={modelUrl} dims={d} opacity={opacity} rotationY={car.model3d?.rotationY} />
          ) : (
            <ProceduralBody dims={d} opacity={opacity} />
          )}
        </Suspense>

        <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={8} blur={2.2} far={2} />
        <Grid
          position={[0, 0, 0]}
          args={[30, 30]}
          cellSize={0.25}
          cellThickness={0.6}
          cellColor="#0e2a3a"
          sectionSize={1}
          sectionThickness={1}
          sectionColor="#0f5f7a"
          fadeDistance={16}
          fadeStrength={1.5}
          infiniteGrid
        />

        <OrbitControls makeDefault target={HOME_TARGET} maxPolarAngle={Math.PI / 2.02} minDistance={0.5} maxDistance={12} />
        <CameraRig focus={camFocus} resetKey={resetKey} />
      </Canvas>
    </div>
  );
}
