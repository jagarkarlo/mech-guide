"use client";

import { useEffect, useMemo } from "react";
import { useGLTF, Edges } from "@react-three/drei";
import { Box3, ExtrudeGeometry, Mesh, Shape, Vector3, type Material, type Object3D } from "three";
import type { CarDimensions } from "@/lib/types";

/** Code-built 3-door coupé shell used when no licensed glTF model is installed. */
export function ProceduralBody({ dims, opacity }: { dims: CarDimensions; opacity: number }) {
  const geometry = useMemo(() => {
    const L = dims.length / 2;
    const fx = dims.wheelbase / 2 + dims.axleOffset;
    const rx = -dims.wheelbase / 2 + dims.axleOffset;
    const ar = dims.wheelRadius + 0.05;
    const wy = dims.wheelRadius;
    const s = new Shape();
    s.moveTo(L - 0.03, 0.22);
    s.lineTo(L, 0.45);
    s.quadraticCurveTo(L + 0.01, 0.7, L - 0.13, 0.76);
    s.lineTo(1.0, 1.0);
    s.quadraticCurveTo(0.45, 1.33, 0.05, 1.4);
    s.quadraticCurveTo(-0.6, 1.43, -1.0, 1.32);
    s.quadraticCurveTo(-1.65, 1.12, -L + 0.1, 1.0);
    s.quadraticCurveTo(-L, 0.95, -L + 0.01, 0.7);
    s.lineTo(-L + 0.03, 0.25);
    s.lineTo(rx - ar, 0.22);
    s.lineTo(rx - ar, wy);
    s.absarc(rx, wy, ar, Math.PI, 0, true);
    s.lineTo(rx + ar, 0.2);
    s.lineTo(fx - ar, 0.2);
    s.lineTo(fx - ar, wy);
    s.absarc(fx, wy, ar, Math.PI, 0, true);
    s.lineTo(fx + ar, 0.22);
    s.closePath();
    const bevel = 0.08;
    const g = new ExtrudeGeometry(s, {
      depth: dims.width - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: 0.06,
      bevelSegments: 5,
      curveSegments: 32,
    });
    g.translate(0, 0, -(dims.width - bevel * 2) / 2);
    return g;
  }, [dims]);

  return (
    <mesh geometry={geometry} raycast={() => null}>
      <meshPhysicalMaterial
        color="#6f7a86"
        metalness={0.6}
        roughness={0.28}
        clearcoat={1}
        transparent
        opacity={opacity}
        depthWrite={opacity > 0.95}
      />
      <Edges threshold={25} color="#9fb2c6" />
    </mesh>
  );
}

/**
 * Loads a licensed glTF/GLB body, rotates it so its longest axis is +x,
 * scales it to the real car length and sits it on the ground.
 */
export function GltfBody({
  url, dims, opacity, rotationY = 0,
}: { url: string; dims: CarDimensions; opacity: number; rotationY?: number }) {
  const { scene } = useGLTF(url);

  const object = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((o: Object3D) => {
      if (o instanceof Mesh) {
        o.material = Array.isArray(o.material)
          ? o.material.map((m: Material) => m.clone())
          : (o.material as Material).clone();
        o.raycast = () => null;
      }
    });
    const size = new Box3().setFromObject(root).getSize(new Vector3());
    if (size.z > size.x) root.rotation.y = -Math.PI / 2;
    root.rotation.y += rotationY;
    root.updateMatrixWorld(true);
    const box = new Box3().setFromObject(root);
    const s = dims.length / box.getSize(new Vector3()).x;
    root.scale.setScalar(s);
    root.updateMatrixWorld(true);
    const b2 = new Box3().setFromObject(root);
    const c = b2.getCenter(new Vector3());
    root.position.set(-c.x, -b2.min.y, -c.z);
    return root;
  }, [scene, dims, rotationY]);

  useEffect(() => {
    object.traverse((o: Object3D) => {
      if (!(o instanceof Mesh)) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats as Material[]) {
        if (m.userData.baseOpacity === undefined) {
          m.userData.baseOpacity = m.opacity;
          m.userData.baseTransparent = m.transparent;
        }
        const base = m.userData.baseOpacity as number;
        const xray = opacity < 0.999;
        m.opacity = base * opacity;
        m.transparent = xray || (m.userData.baseTransparent as boolean);
        m.depthWrite = !m.transparent;
        m.needsUpdate = true;
      }
    });
  }, [object, opacity]);

  return <primitive object={object} />;
}
