import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function CameraController({ scrollProgress, pointerRef }) {
  const { camera } = useThree();
  const baseTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    const p = scrollProgress ? scrollProgress.current || 0 : 0;
    const px = pointerRef?.current ? pointerRef.current.x : state.pointer.x;
    const py = pointerRef?.current ? pointerRef.current.y : state.pointer.y;

    // Cinematic scroll camera choreography matching reference video
    let targetX = px * 0.45;
    let targetY = py * 0.35;
    let targetZ = 6.2;

    if (p < 0.2) {
      // Hero: centered, slight mouse tilt
      targetZ = 6.2;
    } else if (p < 0.45) {
      // Section 2: Dolly through exploding fragments
      const subP = (p - 0.2) / 0.25;
      targetZ = THREE.MathUtils.lerp(6.2, 4.8, subP);
      targetY += subP * 0.3;
    } else if (p < 0.65) {
      // Section 3 & 4: Move towards aperture & terminal frame
      const subP = (p - 0.45) / 0.2;
      targetZ = THREE.MathUtils.lerp(4.8, 5.5, subP);
      targetY = py * 0.25 - 0.2;
    } else if (p < 0.85) {
      // Section 6: Isometric view over the 3D cube world grid
      targetZ = 5.2;
      targetY = 1.0;
    } else {
      // Section 7: Final CTA Luminous Sphere
      const subP = (p - 0.85) / 0.15;
      targetZ = THREE.MathUtils.lerp(5.2, 5.8, subP);
      targetY = 0;
    }

    // Smooth lerp camera position
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.06);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.06);

    // Look at target with gentle damping
    baseTarget.current.x = THREE.MathUtils.lerp(baseTarget.current.x, px * 0.2, 0.05);
    baseTarget.current.y = THREE.MathUtils.lerp(baseTarget.current.y, py * 0.2, 0.05);
    camera.lookAt(baseTarget.current);
  });

  return null;
}

