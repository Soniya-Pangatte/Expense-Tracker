import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

// Register GSAP plugins safely
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/**
 * Initializes the comprehensive scroll-driven 3D and UI animations
 * @param {Object} targets - References to 3D objects and DOM sections
 * @returns {Object} GSAP context instance with revert() cleanup
 */
export function initScrollAnimations({
  cubeRef,
  fragmentsRef,
  lightingRef,
  containerRef,
  onProgressUpdate,
}) {
  const ctx = gsap.context(() => {
    // 1. Master ScrollTrigger tracking total scroll progress
    ScrollTrigger.create({
      trigger: containerRef?.current || document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        if (onProgressUpdate) {
          onProgressUpdate(self.progress);
        }
      },
    });

    // 2. Section 1 to Section 2: Cube rotation acceleration & fragment scatter
    if (cubeRef?.current) {
      gsap.to(cubeRef.current.rotation, {
        y: '+=' + Math.PI * 1.5,
        x: '+=' + Math.PI * 0.5,
        ease: 'none',
        scrollTrigger: {
          trigger: '#capabilities',
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }

    // 3. Staggered reveal for capability cards in Section 2
    gsap.from('#capabilities .grid > div', {
      y: 60,
      opacity: 0,
      stagger: 0.15,
      duration: 0.9,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#capabilities',
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });

    // 4. Section 4 Terminal preview entrance
    gsap.from('#dashboard-preview .rounded-3xl', {
      scale: 0.92,
      opacity: 0,
      y: 50,
      duration: 1.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#dashboard-preview',
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      },
    });

    // 5. Section 5 Feature cards staggered entrance
    gsap.from('#features .grid > div', {
      y: 50,
      opacity: 0,
      stagger: 0.18,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#features',
        start: 'top 75%',
        toggleActions: 'play none none reverse',
      },
    });
  }, containerRef);

  return ctx;
}

export { gsap, ScrollTrigger, useGSAP };

