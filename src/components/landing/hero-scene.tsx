"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Sparkles } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { HeroSceneFallback } from "./hero-fallback";

function starGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? 0.8 : 0.36;
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 2,
  });
  geometry.center();
  return geometry;
}

function StudyBook() {
  const star = useRef<THREE.Mesh>(null);
  const card = useRef<THREE.Group>(null);
  const reduced = useReducedMotion();
  const geometry = useMemo(starGeometry, []);

  useFrame((state) => {
    if (reduced) return;
    const time = state.clock.elapsedTime;
    if (star.current) {
      star.current.rotation.y = Math.sin(time * 0.55) * 0.35;
      star.current.rotation.z = Math.sin(time * 0.4) * 0.08;
    }
    if (card.current) {
      card.current.rotation.y = -0.2 + Math.sin(time * 0.35) * 0.08;
    }
  });

  return (
    <group position={[0, -0.15, 0]} rotation={[0.42, -0.35, 0.04]}>
      <RoundedBox args={[3.1, 0.12, 2.2]} radius={0.07} smoothness={4} position={[0, -0.12, 0]} castShadow>
        <meshStandardMaterial color="#4E3AD8" roughness={0.4} metalness={0.12} />
      </RoundedBox>
      <RoundedBox args={[2.92, 0.17, 2.02]} radius={0.055} smoothness={4} position={[0, -0.01, 0]}>
        <meshStandardMaterial color="#FFF8E9" roughness={0.7} />
      </RoundedBox>
      <group position={[-0.74, 0.1, 0]} rotation={[0, 0, 0.055]}>
        <RoundedBox args={[1.33, 0.11, 1.94]} radius={0.035} smoothness={4}>
          <meshStandardMaterial color="#FFFCF3" roughness={0.78} />
        </RoundedBox>
        {[0.52, 0.3, 0.08, -0.14, -0.36, -0.58].map((position, index) => (
          <mesh key={position} position={[-0.02, 0.07, position]}>
            <boxGeometry args={[index % 3 === 2 ? 0.74 : 1.05, 0.012, 0.028]} />
            <meshStandardMaterial color={index === 0 ? "#6D5BF6" : "#D8D0E8"} />
          </mesh>
        ))}
        <mesh position={[0.36, 0.075, -0.38]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.22, 36]} />
          <meshBasicMaterial color="#F4C95D" transparent opacity={0.85} />
        </mesh>
      </group>
      <group position={[0.74, 0.1, 0]} rotation={[0, 0, -0.055]}>
        <RoundedBox args={[1.33, 0.11, 1.94]} radius={0.035} smoothness={4}>
          <meshStandardMaterial color="#FFFCF3" roughness={0.78} />
        </RoundedBox>
        {[0.55, 0.35, 0.15, -0.05, -0.25, -0.45, -0.65].map((position, index) => (
          <mesh key={position} position={[0, 0.07, position]}>
            <boxGeometry args={[index === 0 ? 0.82 : index === 5 ? 0.58 : 1.05, 0.012, 0.028]} />
            <meshStandardMaterial color={index === 0 ? "#F2748B" : "#D8D0E8"} />
          </mesh>
        ))}
        {[0, 1, 2].map((row) => (
          <group key={row} position={[-0.33, 0.04, -0.18 + row * 0.22]}>
            <mesh position={[0.2, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.56 - row * 0.1, 0.08]} />
              <meshStandardMaterial color={["#6D5BF6", "#2DBB8C", "#F4C95D"][row]} transparent opacity={0.75} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, 0.09, 1.01]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 2.04, 16]} />
        <meshStandardMaterial color="#3D2BB8" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.12, 1.04]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 1.86, 8]} />
        <meshStandardMaterial color="#F4C95D" metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh ref={star} geometry={geometry} position={[0.75, 0.95, -0.32]} scale={0.58} castShadow>
        <meshStandardMaterial color="#F4C95D" roughness={0.26} metalness={0.28} emissive="#7c5208" emissiveIntensity={0.16} />
      </mesh>
      <group ref={card} position={[-0.82, 1.15, 0.15]} rotation={[0.05, 0.28, -0.11]}>
        <RoundedBox args={[1.28, 0.06, 0.88]} radius={0.05} smoothness={4}>
          <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
        </RoundedBox>
        <mesh position={[-0.35, 0.045, -0.27]}>
          <boxGeometry args={[0.42, 0.012, 0.035]} />
          <meshStandardMaterial color="#6D5BF6" />
        </mesh>
        <mesh position={[-0.45, 0.045, -0.15]}>
          <boxGeometry args={[0.22, 0.012, 0.025]} />
          <meshStandardMaterial color="#D8D0E8" />
        </mesh>
        {[0, 1, 2, 3].map((index) => (
          <mesh key={index} position={[-0.49 + index * 0.12, 0.045, 0.07]}>
            <boxGeometry args={[0.06, 0.012, 0.18 + index * 0.06]} />
            <meshStandardMaterial color={index === 3 ? "#2DBB8C" : "#B9A6FF"} />
          </mesh>
        ))}
        <mesh position={[0.34, 0.04, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.16, 32]} />
          <meshBasicMaterial color="#F2748B" transparent opacity={0.7} />
        </mesh>
      </group>
      <Float speed={reduced ? 0 : 1.1} rotationIntensity={reduced ? 0 : 0.18} floatIntensity={reduced ? 0 : 0.32}>
        <mesh position={[1.5, 0.55, 0.82]} rotation={[0.2, 0.5, -0.2]}>
          <icosahedronGeometry args={[0.19, 1]} />
          <meshStandardMaterial color="#F2748B" roughness={0.35} />
        </mesh>
      </Float>
      <Float speed={reduced ? 0 : 1.4} rotationIntensity={0} floatIntensity={reduced ? 0 : 0.22}>
        <mesh position={[-1.5, 0.3, -0.75]}>
          <sphereGeometry args={[0.11, 20, 20]} />
          <meshStandardMaterial color="#2DBB8C" roughness={0.3} />
        </mesh>
      </Float>
      <mesh rotation={[Math.PI / 2.35, 0.08, 0.1]} position={[0, 0.18, 0]}>
        <torusGeometry args={[2.1, 0.008, 8, 100]} />
        <meshBasicMaterial color="#B7A8F8" transparent opacity={0.6} />
      </mesh>
      <Sparkles count={reduced ? 0 : 26} scale={[3.8, 1.9, 3.2]} size={2.2} speed={reduced ? 0 : 0.32} color="#8C79EF" opacity={0.65} />
    </group>
  );
}

export function HeroScene() {
  const reduced = useReducedMotion();
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        fallback={<HeroSceneFallback />}
        camera={{ position: [0, 2.65, 5.15], fov: 38 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true }}
        frameloop={reduced ? "demand" : "always"}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1.25} />
        <directionalLight position={[4, 7, 5]} intensity={2.7} color="#FFF6DF" />
        <directionalLight position={[-4, 3, -3]} intensity={1.1} color="#B8A7FF" />
        <pointLight position={[0, 2, 3]} intensity={0.8} color="#FFD9E2" />
        <StudyBook />
      </Canvas>
    </div>
  );
}

