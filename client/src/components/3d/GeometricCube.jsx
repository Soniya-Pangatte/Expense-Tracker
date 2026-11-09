import React, { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const GeometricCube = forwardRef(function GeometricCube(
  { scrollProgress, pointerRef, isExploded = false },
  ref
) {
  const groupRef = useRef();
  const cubeMeshRefs = useRef([]);

  // Expose group reference for external GSAP animations
  useImperativeHandle(ref, () => groupRef.current);

  // Generate 26 sub-cubes forming the intricate 3x3x3 matrix composite cube
  const blocks = useMemo(() => {
    const list = [];
    const step = 1.04;
    let id = 0;

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // Omit center core and two corner facets to create dynamic extrusion
          if (x === 0 && y === 0 && z === 0) continue;
          if (x === 1 && y === -1 && z === 1) continue;

          // Material type assignment matching SpendWise Aqua / Turquoise theme:
          // 0: Crystalline Aqua Translucent Glass (#D6EBF3 / #B9D9E1)
          // 1: Turquoise Glowing Surface (#C4DCE3)
          // 2: Luminous Soft Cyan Highlight (#B9D9E1 / #FFFFFF)
          // 3: Aqua Blue Reflective (#C4DCE3)
          // 4: Deep Teal Contrast Block (#447F98)
          let matType = 0;
          if (y === 1 && (x + z) % 2 === 0) {
            matType = 2; // Bright top faces
          } else if (z === 1 && (x + y) % 2 === 0) {
            matType = 1; // Glowing Turquoise front
          } else if (x === -1 && y === 0) {
            matType = 3; // Aqua Blue side
          } else if (Math.random() > 0.7) {
            matType = 4; // Contrast Deep Teal
          } else if (Math.random() > 0.4) {
            matType = 1;
          }

          // Individual sub-oscillation speed & phase
          const phase = Math.random() * Math.PI * 2;
          const floatSpeed = 0.8 + Math.random() * 0.6;

          // Outward explosion trajectory vector
          const scatterX = x * 3.8 + (Math.random() - 0.5) * 2.2;
          const scatterY = y * 3.8 + (Math.random() - 0.5) * 2.2;
          const scatterZ = z * 3.8 + (Math.random() - 0.5) * 2.2;

          list.push({
            id: id++,
            basePos: [x * step, y * step, z * step],
            scatterPos: [scatterX, scatterY, scatterZ],
            scatterRot: [
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5,
              (Math.random() - 0.5) * 5,
            ],
            matType,
            phase,
            floatSpeed,
            scale: 0.94,
          });
        }
      }
    }
    return list;
  }, []);

  // Shared Materials using SpendWise Aqua / Turquoise Theme
  const materials = useMemo(() => {
    return {
      // 0: Crystalline Aqua Glass
      glass: new THREE.MeshPhysicalMaterial({
        color: '#D6EBF3',
        roughness: 0.08,
        metalness: 0.3,
        transmission: 0.65,
        thickness: 0.6,
        reflectivity: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      }),
      // 1: Turquoise Glowing Face (#447F98)
      turquoise: new THREE.MeshStandardMaterial({
        color: '#447F98',
        emissive: '#447F98',
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0.75,
      }),
      // 2: Luminous Soft Cyan Highlight (#B9D9E1 / #FFFFFF)
      luminousCyan: new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        emissive: '#B9D9E1',
        emissiveIntensity: 1.2,
        roughness: 0.1,
        metalness: 0.25,
      }),
      // 3: Slate Blue (#629BB5)
      aquaBlue: new THREE.MeshStandardMaterial({
        color: '#629BB5',
        emissive: '#629BB5',
        emissiveIntensity: 0.85,
        roughness: 0.18,
        metalness: 0.6,
      }),
      // 4: Deep Teal Contrast Block (#447F98)
      deepTeal: new THREE.MeshStandardMaterial({
        color: '#447F98',
        emissive: '#1B3541',
        emissiveIntensity: 0.3,
        roughness: 0.25,
        metalness: 0.85,
      }),
    };
  }, []);

  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const t = state.clock.elapsedTime;
    const px = pointerRef?.current ? pointerRef.current.x : state.pointer.x;
    const py = pointerRef?.current ? pointerRef.current.y : state.pointer.y;

    // 1. Natural idle floating oscillation
    group.position.y = Math.sin(t * 1.2) * 0.12;

    // 2. Parallax mouse tilt lerped smoothly
    const targetTiltX = 0.55 + py * 0.22;
    const targetTiltY = 0.78 + px * 0.3 + t * 0.08;
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetTiltX, 0.05);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetTiltY, 0.05);

    // 3. Scroll-driven explosion factor
    const p = scrollProgress ? scrollProgress.current || 0 : 0;
    let explosionFactor = 0;
    if (p < 0.12) {
      explosionFactor = 0;
    } else if (p < 0.38) {
      explosionFactor = (p - 0.12) / 0.26;
    } else {
      explosionFactor = 1;
    }

    const ease = Math.pow(explosionFactor, 1.4);

    // 4. Animate each sub-cube position & micro-floating
    blocks.forEach((b, idx) => {
      const mesh = cubeMeshRefs.current[idx];
      if (!mesh) return;

      const subFloat = Math.sin(t * b.floatSpeed + b.phase) * 0.02 * (1 - ease);

      mesh.position.x = THREE.MathUtils.lerp(b.basePos[0], b.scatterPos[0], ease);
      mesh.position.y = THREE.MathUtils.lerp(b.basePos[1] + subFloat, b.scatterPos[1], ease);
      mesh.position.z = THREE.MathUtils.lerp(b.basePos[2], b.scatterPos[2], ease);

      mesh.rotation.x = b.scatterRot[0] * ease;
      mesh.rotation.y = b.scatterRot[1] * ease;
      mesh.rotation.z = b.scatterRot[2] * ease;

      // Scale down when passing into later sections (p > 0.45)
      if (p > 0.42) {
        const fade = Math.max(0, 1 - (p - 0.42) * 4);
        mesh.scale.setScalar(b.scale * fade);
      } else {
        mesh.scale.setScalar(b.scale);
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {blocks.map((b, i) => {
        let mat = materials.glass;
        if (b.matType === 1) mat = materials.turquoise;
        else if (b.matType === 2) mat = materials.luminousCyan;
        else if (b.matType === 3) mat = materials.aquaBlue;
        else if (b.matType === 4) mat = materials.deepTeal;

        return (
          <mesh
            key={b.id}
            ref={(el) => (cubeMeshRefs.current[i] = el)}
            geometry={boxGeo}
            material={mat}
            position={b.basePos}
            scale={b.scale}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
});

export default GeometricCube;
