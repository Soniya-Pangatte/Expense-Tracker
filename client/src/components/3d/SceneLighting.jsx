import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const SceneLighting = forwardRef(function SceneLighting({ scrollProgress }, ref) {
  const ambientRef = useRef();
  const dirRef = useRef();
  const turquoisePointRef = useRef();
  const cyanPointRef = useRef();
  const rimLightRef = useRef();

  useImperativeHandle(ref, () => ({
    setIntensity: (val) => {
      if (turquoisePointRef.current) turquoisePointRef.current.intensity = 4.5 * val;
      if (cyanPointRef.current) cyanPointRef.current.intensity = 4.0 * val;
    },
    turquoisePoint: turquoisePointRef.current,
    cyanPoint: cyanPointRef.current,
    ambient: ambientRef.current,
  }));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (turquoisePointRef.current) {
      turquoisePointRef.current.position.x = -4 + Math.sin(t * 0.8) * 0.5;
      turquoisePointRef.current.position.y = 3 + Math.cos(t * 0.7) * 0.4;
    }
    if (cyanPointRef.current) {
      cyanPointRef.current.position.x = 3 + Math.cos(t * 0.9) * 0.5;
      cyanPointRef.current.position.y = -4 + Math.sin(t * 0.6) * 0.4;
    }
  });

  return (
    <group>
      {/* Soft Aqua ambient fill */}
      <ambientLight ref={ambientRef} color="#B9D9E1" intensity={1.8} />

      {/* Main crisp specular key light from top right */}
      <directionalLight
        ref={dirRef}
        position={[6, 8, 5]}
        intensity={2.8}
        color="#FFFFFF"
      />

      {/* Turquoise accent point light (#447F98) */}
      <pointLight
        ref={turquoisePointRef}
        position={[-4, 3, 3]}
        intensity={4.8}
        color="#447F98"
        distance={18}
        decay={2}
      />

      {/* Slate Blue fill point light (#629BB5) */}
      <pointLight
        ref={cyanPointRef}
        position={[3, -4, 2]}
        intensity={4.2}
        color="#629BB5"
        distance={18}
        decay={2}
      />

      {/* Back rim light (#D6EBF3) */}
      <pointLight
        ref={rimLightRef}
        position={[0, 1, -5]}
        intensity={3.5}
        color="#D6EBF3"
        distance={12}
        decay={2}
      />
    </group>
  );
});

export default SceneLighting;
