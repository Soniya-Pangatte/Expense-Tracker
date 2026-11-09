import React, { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import SceneLoader from './SceneLoader';
import SceneLighting from './SceneLighting';
import CameraController from './CameraController';
import GeometricCube from './GeometricCube';
import FloatingFragments from './FloatingFragments';

// ---------------------------------------------------------------------
// Background Starfield & Floating Dust with SpendWise Aqua Palette
// ---------------------------------------------------------------------
function Starfield({ count = 300 }) {
  const pointsRef = useRef();

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25 - 4;
    }
    return [pos];
  }, [count]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.016;
      pointsRef.current.rotation.x += delta * 0.008;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        color="#629BB5"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ---------------------------------------------------------------------
// Section 3 – Glowing Light Aperture / Portal Transition (Aqua Theme)
// ---------------------------------------------------------------------
function LightPortal({ scrollProgress }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const p = scrollProgress ? scrollProgress.current || 0 : 0;

    if (p >= 0.28 && p <= 0.6) {
      meshRef.current.visible = true;
      const progress = (p - 0.28) / 0.28;
      const scale = THREE.MathUtils.lerp(0.5, 12, Math.pow(progress, 2));
      meshRef.current.scale.set(scale, scale, 1);
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.15 + progress * 2;
      meshRef.current.material.opacity = Math.sin(progress * Math.PI) * 0.8;
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]} visible={false}>
      <ringGeometry args={[0.01, 2.2, 4]} />
      <meshBasicMaterial
        color="#447F98"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------
// Section 6 – Geometric World Grid of Pulsing Cubes (Aqua Palette)
// ---------------------------------------------------------------------
function GeometricWorldGrid({ scrollProgress }) {
  const countX = 11;
  const countZ = 11;
  const total = countX * countZ;
  const instancedRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!instancedRef.current) return;
    const p = scrollProgress ? scrollProgress.current || 0 : 0;

    if (p >= 0.58 && p <= 0.88) {
      instancedRef.current.visible = true;
      const enter = Math.min(1, Math.max(0, (p - 0.58) / 0.08));
      const exit = Math.min(1, Math.max(0, (0.88 - p) / 0.08));
      const overallOpacity = enter * exit;

      const t = state.clock.elapsedTime;
      let i = 0;
      const spacing = 1.15;
      const halfX = (countX * spacing) / 2;
      const halfZ = (countZ * spacing) / 2;

      for (let x = 0; x < countX; x++) {
        for (let z = 0; z < countZ; z++) {
          const posX = x * spacing - halfX;
          const posZ = z * spacing - halfZ;
          const dist = Math.sqrt(posX * posX + posZ * posZ);
          const wave = Math.sin(dist * 0.8 - t * 2.2) * 0.6 + Math.cos(posX * 0.5 + t) * 0.3;

          dummy.position.set(posX, wave, posZ);
          dummy.scale.set(0.95, 0.95 + wave * 0.5, 0.95);
          dummy.scale.multiplyScalar(overallOpacity);
          dummy.updateMatrix();
          instancedRef.current.setMatrixAt(i++, dummy.matrix);
        }
      }
      instancedRef.current.instanceMatrix.needsUpdate = true;
    } else {
      instancedRef.current.visible = false;
    }
  });

  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  return (
    <group position={[0, -1.5, -3]} rotation={[-Math.PI / 4.2, 0, Math.PI / 4.2]}>
      <instancedMesh
        ref={instancedRef}
        args={[boxGeo, null, total]}
        visible={false}
      >
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.65}
          color="#447F98"
          emissive="#629BB5"
          emissiveIntensity={0.65}
        />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------
// Section 7 – Final CTA Luminous Particle Sphere (Aqua Palette)
// ---------------------------------------------------------------------
function LuminousParticleSphere({ scrollProgress }) {
  const groupRef = useRef();
  const particleCount = 1200;

  const [positions] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const radius = 2.4;
    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;
      pos[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      pos[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return [pos];
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const p = scrollProgress ? scrollProgress.current || 0 : 0;

    if (p >= 0.8) {
      groupRef.current.visible = true;
      const enter = Math.min(1, (p - 0.8) / 0.1);
      groupRef.current.scale.setScalar(enter);
      groupRef.current.rotation.y += delta * 0.25;
      groupRef.current.rotation.x += delta * 0.1;
    } else {
      groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -1]} visible={false}>
      {/* Inner glowing aqua core */}
      <mesh>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshStandardMaterial
          color="#447F98"
          emissive="#C4DCE3"
          emissiveIntensity={0.65}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Wireframe outer shell */}
      <mesh scale={[1.04, 1.04, 1.04]}>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshBasicMaterial
          color="#C4DCE3"
          wireframe
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Surface particle dots in Soft Cyan */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color="#D6EBF3"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ---------------------------------------------------------------------
// Master HeroScene Component
// ---------------------------------------------------------------------
export default function HeroScene({
  scrollProgress,
  cubeRef,
  fragmentsRef,
  lightingRef,
}) {
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#D6EBF3] dark:bg-[#152B35] transition-colors duration-500">
      {/* Ambient Radial Aqua / Turquoise Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] sm:w-[900px] h-[650px] sm:h-[900px] rounded-full bg-gradient-radial from-[#C4DCE3]/40 dark:from-[#447F98]/50 via-[#B9D9E1]/25 dark:via-[#1B3541]/30 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-[#B9D9E1]/20 dark:bg-[#B9D9E1]/15 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#B9D9E1]/35 dark:bg-[#B9D9E1]/10 blur-[100px] pointer-events-none" />

      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={<SceneLoader />}>
          <SceneLighting ref={lightingRef} scrollProgress={scrollProgress} />
          <CameraController scrollProgress={scrollProgress} pointerRef={pointerRef} />
          <GeometricCube
            ref={cubeRef}
            scrollProgress={scrollProgress}
            pointerRef={pointerRef}
          />
          <FloatingFragments
            ref={fragmentsRef}
            scrollProgress={scrollProgress}
          />
          <LightPortal scrollProgress={scrollProgress} />
          <GeometricWorldGrid scrollProgress={scrollProgress} />
          <LuminousParticleSphere scrollProgress={scrollProgress} />
          <Starfield count={300} />
        </Suspense>
      </Canvas>
    </div>
  );
}
