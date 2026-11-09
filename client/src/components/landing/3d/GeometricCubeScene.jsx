import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ---------------------------------------------------------------------
// 1. Floating Starfield / Dust Particles
// ---------------------------------------------------------------------
function Starfield({ count = 350 }) {
  const pointsRef = useRef();

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sc = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25 - 5;
      sc[i] = Math.random() * 0.8 + 0.2;
    }
    return [pos, sc];
  }, [count]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
      pointsRef.current.rotation.x += delta * 0.01;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        color="#C4DCE3"
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ---------------------------------------------------------------------
// 2. The Hero Composite Rubik's/Matrix Geometric Cube
// ---------------------------------------------------------------------
function HeroCompositeCube({ scrollProgress, pointer }) {
  const groupRef = useRef();

  // Create 3x3x3 grid of mini-cubes (excluding center to form hollow shell)
  const miniCubes = useMemo(() => {
    const cubes = [];
    const step = 1.05;
    let id = 0;

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Keep most cubes, randomly omit 2-3 to match reference extruded aesthetic
          if (x === 0 && y === 0 && z === 0) continue;
          if (x === 1 && y === -1 && z === 1) continue; // missing corner like reference

          // Determine color type: 0: glass/dark, 1: electric blue, 2: luminous white, 3: cyan
          let type = 0;
          if (y === 1 && (x + z) % 2 === 0) type = 2; // bright top faces
          else if (z === 1 && (x + y) % 2 === 0) type = 1; // glowing front
          else if (x === -1 && y === 0) type = 3; // cyan side
          else if (Math.random() > 0.6) type = 1;

          // Outward explosion trajectory vector
          const dirX = x * 3.5 + (Math.random() - 0.5) * 2.5;
          const dirY = y * 3.5 + (Math.random() - 0.5) * 2.5;
          const dirZ = z * 3.5 + (Math.random() - 0.5) * 2.5;

          cubes.push({
            id: id++,
            basePos: [x * step, y * step, z * step],
            scatterPos: [dirX, dirY, dirZ],
            scatterRot: [
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 6,
            ],
            type,
            scale: 0.94,
          });
        }
      }
    }
    return cubes;
  }, []);

  // Shared Materials
  const materials = useMemo(() => {
    return {
      // 0: Deep blue-black semi-translucent glass
      glass: new THREE.MeshPhysicalMaterial({
        color: '#1B3541',
        roughness: 0.15,
        metalness: 0.6,
        transmission: 0.4,
        thickness: 0.5,
        reflectivity: 0.9,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      }),
      // 1: Electric Blue glowing face
      electric: new THREE.MeshStandardMaterial({
        color: '#365765',
        emissive: '#C4DCE3',
        emissiveIntensity: 0.85,
        roughness: 0.25,
        metalness: 0.8,
      }),
      // 2: Luminous White-Cyan highlight
      whiteGlow: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        emissive: '#D6EBF3',
        emissiveIntensity: 1.2,
        roughness: 0.1,
        metalness: 0.2,
      }),
      // 3: Pure Cyan Glow
      cyan: new THREE.MeshStandardMaterial({
        color: '#447F98',
        emissive: '#C4DCE3',
        emissiveIntensity: 0.95,
        roughness: 0.2,
        metalness: 0.5,
      }),
      // Wireframe edge accent
      edges: new THREE.LineBasicMaterial({
        color: '#C4DCE3',
        transparent: true,
        opacity: 0.35,
      }),
    };
  }, []);

  const cubeRefs = useRef([]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Hover mouse tilt
    const targetRotX = 0.55 + pointer.current.y * 0.25;
    const targetRotY = 0.78 + pointer.current.x * 0.35 + state.clock.elapsedTime * 0.08;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);

    // Idle levitation
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.15;

    // Scroll explosion factor (0.00 to 0.40 scroll progress)
    const p = scrollProgress.current;
    let explosionFactor = 0;
    if (p < 0.1) {
      explosionFactor = 0;
    } else if (p < 0.35) {
      explosionFactor = (p - 0.1) / 0.25; // 0 to 1
    } else {
      explosionFactor = 1;
    }

    // Apply cubic ease-out
    const easeExp = Math.pow(explosionFactor, 1.4);

    miniCubes.forEach((c, i) => {
      const mesh = cubeRefs.current[i];
      if (!mesh) return;

      mesh.position.x = THREE.MathUtils.lerp(c.basePos[0], c.scatterPos[0], easeExp);
      mesh.position.y = THREE.MathUtils.lerp(c.basePos[1], c.scatterPos[1], easeExp);
      mesh.position.z = THREE.MathUtils.lerp(c.basePos[2], c.scatterPos[2], easeExp);

      mesh.rotation.x = c.scatterRot[0] * easeExp;
      mesh.rotation.y = c.scatterRot[1] * easeExp;
      mesh.rotation.z = c.scatterRot[2] * easeExp;

      // When past section 3 (p > 0.5), scale down hero cube out of view
      if (p > 0.4) {
        const fadeOut = Math.max(0, 1 - (p - 0.4) * 4);
        mesh.scale.setScalar(c.scale * fadeOut);
      } else {
        mesh.scale.setScalar(c.scale);
      }
    });
  });

  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {miniCubes.map((c, i) => {
        let mat = materials.glass;
        if (c.type === 1) mat = materials.electric;
        else if (c.type === 2) mat = materials.whiteGlow;
        else if (c.type === 3) mat = materials.cyan;

        return (
          <mesh
            key={c.id}
            ref={(el) => (cubeRefs.current[i] = el)}
            geometry={boxGeo}
            material={mat}
            position={c.basePos}
            scale={c.scale}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------
// 3. Section 3 – Glowing Light Aperture / Portal Transition
// ---------------------------------------------------------------------
function LightPortal({ scrollProgress }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const p = scrollProgress.current;

    // Active in scroll range 0.30 to 0.55
    if (p >= 0.28 && p <= 0.6) {
      meshRef.current.visible = true;
      const progress = (p - 0.28) / 0.27; // 0 to 1
      const scale = THREE.MathUtils.lerp(0.5, 12, Math.pow(progress, 2));
      meshRef.current.scale.set(scale, scale, 1);
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.15 + progress * 2;
      meshRef.current.material.opacity = Math.sin(progress * Math.PI) * 0.85;
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]} visible={false}>
      {/* 4-point star/diamond aperture */}
      <ringGeometry args={[0.01, 2.2, 4]} />
      <meshBasicMaterial
        color="#C4DCE3"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ---------------------------------------------------------------------
// 4. Section 6 – Geometric World Grid of Pulsing Cubes
// ---------------------------------------------------------------------
function GeometricWorldGrid({ scrollProgress }) {
  const countX = 11;
  const countZ = 11;
  const total = countX * countZ;
  const instancedRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const colorArray = useMemo(() => {
    const colors = new Float32Array(total * 3);
    const cElectric = new THREE.Color('#365765');
    const cCyan = new THREE.Color('#C4DCE3');
    const cWhite = new THREE.Color('#D6EBF3');

    for (let i = 0; i < total; i++) {
      const rand = Math.random();
      let c = cElectric;
      if (rand > 0.82) c = cWhite;
      else if (rand > 0.5) c = cCyan;

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return colors;
  }, [total]);

  useFrame((state) => {
    if (!instancedRef.current) return;
    const p = scrollProgress.current;

    // Active in scroll range 0.60 to 0.86
    if (p >= 0.58 && p <= 0.88) {
      instancedRef.current.visible = true;
      const enterFactor = Math.min(1, Math.max(0, (p - 0.58) / 0.08));
      const exitFactor = Math.min(1, Math.max(0, (0.88 - p) / 0.08));
      const overallOpacity = enterFactor * exitFactor;

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
          // Ripple wave height
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
          roughness={0.25}
          metalness={0.7}
          color="#1B3541"
          emissive="#C4DCE3"
          emissiveIntensity={0.65}
        />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------
// 5. Section 7 – Final CTA Luminous Particle Sphere
// ---------------------------------------------------------------------
function LuminousParticleSphere({ scrollProgress }) {
  const groupRef = useRef();
  const innerSphereRef = useRef();
  const particleCount = 1200;

  const [positions, alphas] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const alp = new Float32Array(particleCount);
    const radius = 2.4;

    for (let i = 0; i < particleCount; i++) {
      // Fibonacci sphere distribution for latitude/longitude points
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      pos[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      pos[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      alp[i] = Math.random() * 0.6 + 0.4;
    }
    return [pos, alp];
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const p = scrollProgress.current;

    // Active in scroll range 0.82 to 1.00
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
      {/* Inner glowing core */}
      <mesh ref={innerSphereRef}>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshStandardMaterial
          color="#1B3541"
          emissive="#C4DCE3"
          emissiveIntensity={0.6}
          roughness={0.4}
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Fresnel outer glow rim */}
      <mesh scale={[1.04, 1.04, 1.04]}>
        <sphereGeometry args={[2.3, 32, 32]} />
        <meshBasicMaterial
          color="#C4DCE3"
          wireframe
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Surface particle dots */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#D6EBF3"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ---------------------------------------------------------------------
// Main Master 3D Scene Wrapper
// ---------------------------------------------------------------------
export default function GeometricCubeScene({ scrollProgress }) {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#152B35]">
      {/* Soft background radial gradient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[700px] sm:h-[950px] rounded-full bg-gradient-radial from-[#365765]/45 via-[#1B3541]/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-[#B9D9E1]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#B9D9E1]/10 blur-[100px] pointer-events-none" />

      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Lights */}
        <ambientLight color="#1B3541" intensity={1.5} />
        <directionalLight position={[6, 8, 5]} intensity={2.6} color="#FFFFFF" />
        <pointLight position={[-4, 3, 3]} intensity={4.5} color="#C4DCE3" distance={15} />
        <pointLight position={[3, -4, 2]} intensity={4.0} color="#C4DCE3" distance={15} />
        <pointLight position={[0, 0, -4]} intensity={3.0} color="#D6EBF3" distance={10} />

        {/* 1. Dust & Stars */}
        <Starfield count={300} />

        {/* 2. Hero Composite Cube */}
        <HeroCompositeCube scrollProgress={scrollProgress} pointer={pointer} />

        {/* 3. Section 3 Light Aperture Portal */}
        <LightPortal scrollProgress={scrollProgress} />

        {/* 4. Section 6 Geometric World Grid */}
        <GeometricWorldGrid scrollProgress={scrollProgress} />

        {/* 5. Section 7 Final CTA Luminous Sphere */}
        <LuminousParticleSphere scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}

