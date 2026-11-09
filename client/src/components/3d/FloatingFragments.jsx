import React, { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FloatingFragments = forwardRef(function FloatingFragments(
  { scrollProgress, count = 28 },
  ref
) {
  const groupRef = useRef();
  const fragmentRefs = useRef([]);

  useImperativeHandle(ref, () => groupRef.current);

  // Generate varied satellite debris fragments with SpendWise Aqua Palette
  const fragments = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const radius = 2.4 + Math.random() * 2.8;
      const height = (Math.random() - 0.5) * 4.5;
      const depth = (Math.random() - 0.5) * 3.5;

      const initX = Math.cos(angle) * radius;
      const initY = height;
      const initZ = Math.sin(angle) * radius + depth;

      // Exploded scatter target
      const scatterX = initX * (1.8 + Math.random() * 1.5);
      const scatterY = initY * (1.8 + Math.random() * 1.5);
      const scatterZ = (Math.random() - 0.4) * 12;

      const scale = 0.22 + Math.random() * 0.38;

      const rotSpeed = [
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
      ];

      // Material type: 0: glass, 1: turquoise, 2: cyan, 3: deep teal
      const matType = Math.floor(Math.random() * 4);

      list.push({
        id: i,
        initPos: [initX, initY, initZ],
        scatterPos: [scatterX, scatterY, scatterZ],
        scale,
        rotSpeed,
        matType,
        floatFreq: 0.6 + Math.random() * 0.8,
        floatPhase: Math.random() * Math.PI * 2,
      });
    }
    return list;
  }, [count]);

  // SpendWise Aqua Theme Materials
  const materials = useMemo(() => {
    return {
      glass: new THREE.MeshPhysicalMaterial({
        color: '#D6EBF3',
        roughness: 0.1,
        metalness: 0.3,
        transmission: 0.6,
        thickness: 0.5,
        reflectivity: 0.95,
      }),
      turquoise: new THREE.MeshStandardMaterial({
        color: '#447F98',
        emissive: '#447F98',
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.7,
      }),
      cyan: new THREE.MeshStandardMaterial({
        color: '#629BB5',
        emissive: '#629BB5',
        emissiveIntensity: 0.9,
        roughness: 0.18,
        metalness: 0.6,
      }),
      deepTeal: new THREE.MeshStandardMaterial({
        color: '#447F98',
        emissive: '#1B3541',
        emissiveIntensity: 0.3,
        roughness: 0.22,
        metalness: 0.8,
      }),
    };
  }, []);

  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const p = scrollProgress ? scrollProgress.current || 0 : 0;

    let sepFactor = 0;
    if (p < 0.1) sepFactor = 0;
    else if (p < 0.4) sepFactor = (p - 0.1) / 0.3;
    else sepFactor = 1;

    const ease = Math.pow(sepFactor, 1.2);

    fragments.forEach((f, idx) => {
      const mesh = fragmentRefs.current[idx];
      if (!mesh) return;

      mesh.rotation.x += f.rotSpeed[0] * delta;
      mesh.rotation.y += f.rotSpeed[1] * delta;
      mesh.rotation.z += f.rotSpeed[2] * delta;

      const floatY = Math.sin(t * f.floatFreq + f.floatPhase) * 0.15;

      mesh.position.x = THREE.MathUtils.lerp(f.initPos[0], f.scatterPos[0], ease);
      mesh.position.y = THREE.MathUtils.lerp(f.initPos[1] + floatY, f.scatterPos[1] + floatY, ease);
      mesh.position.z = THREE.MathUtils.lerp(f.initPos[2], f.scatterPos[2], ease);

      if (p > 0.45) {
        const fade = Math.max(0, 1 - (p - 0.45) * 4);
        mesh.scale.setScalar(f.scale * fade);
      } else {
        mesh.scale.setScalar(f.scale);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {fragments.map((f, i) => {
        let mat = materials.glass;
        if (f.matType === 1) mat = materials.turquoise;
        else if (f.matType === 2) mat = materials.cyan;
        else if (f.matType === 3) mat = materials.deepTeal;

        return (
          <mesh
            key={f.id}
            ref={(el) => (fragmentRefs.current[i] = el)}
            geometry={boxGeo}
            material={mat}
            position={f.initPos}
            scale={f.scale}
            castShadow
          />
        );
      })}
    </group>
  );
});

export default FloatingFragments;
