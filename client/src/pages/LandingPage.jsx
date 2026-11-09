import React, { useEffect, useRef, useState } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import ScrollProgressIndicator from '../components/landing/ScrollProgressIndicator';
import SocialDock from '../components/landing/SocialDock';

// 3D Scene Components
import HeroScene from '../components/3d/HeroScene';

// GSAP Scroll Animation Engine
import { initScrollAnimations } from '../animations/scrollAnimations';

// 7 Storytelling Landing Sections
import HeroSection from '../components/landing/HeroSection';
import CapabilitiesSection from '../components/landing/CapabilitiesSection';
import LightTransitionSection from '../components/landing/LightTransitionSection';
import DashboardShowcaseSection from '../components/landing/DashboardShowcaseSection';
import FeatureCardsSection from '../components/landing/FeatureCardsSection';
import GeometricWorldSection from '../components/landing/GeometricWorldSection';
import FinalCTASection from '../components/landing/FinalCTASection';

export default function LandingPage() {
  const containerRef = useRef(null);
  const scrollProgressRef = useRef(0);
  const cubeRef = useRef(null);
  const fragmentsRef = useRef(null);
  const lightingRef = useRef(null);

  const [webGLSupported, setWebGLSupported] = useState(true);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const supported = Boolean(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setWebGLSupported(supported);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  // Initialize GSAP ScrollTrigger and synchronize scroll progress
  useEffect(() => {
    const handleNativeScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
      scrollProgressRef.current = progress;
    };

    window.addEventListener('scroll', handleNativeScroll, { passive: true });
    handleNativeScroll();

    // GSAP Timeline & ScrollTrigger bindings
    const ctx = initScrollAnimations({
      cubeRef,
      fragmentsRef,
      lightingRef,
      containerRef,
      onProgressUpdate: (progress) => {
        scrollProgressRef.current = progress;
      },
    });

    return () => {
      window.removeEventListener('scroll', handleNativeScroll);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#D6EBF3] dark:bg-[#152B35] text-[#243D49] dark:text-[#EAF4F7] selection:bg-[#B9D9E1]/40 selection:text-[#243D49] font-sans overflow-x-hidden transition-colors duration-300"
    >
      {/* 3D WebGL Background Scene */}
      {webGLSupported ? (
        <HeroScene
          scrollProgress={scrollProgressRef}
          cubeRef={cubeRef}
          fragmentsRef={fragmentsRef}
          lightingRef={lightingRef}
        />
      ) : (
        /* Graceful CSS Fallback for non-WebGL environments using Aqua Palette */
        <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#D6EBF3] via-[#B9D9E1] to-[#D6EBF3] dark:from-[#152B35] dark:via-[#1B3541] dark:to-[#152B35]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#B9D9E1]/25 blur-[100px]" />
          <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full bg-[#B9D9E1]/30 blur-[90px]" />
        </div>
      )}

      {/* Persistent Minimal Chrome Navigation & Indicators */}
      <LandingNavbar />
      <ScrollProgressIndicator progressRef={scrollProgressRef} />
      <SocialDock />

      {/* 7 Storytelling Landing Sections */}
      <main className="relative z-10 space-y-12 sm:space-y-24">
        {/* Section 1 – Main Hero with Glowing 3D Geometric Cube */}
        <HeroSection />

        {/* Section 2 – Geometric Explosion (Key Capabilities) */}
        <CapabilitiesSection />

        {/* Section 3 – Abstract Light Transition */}
        <LightTransitionSection />

        {/* Section 4 – Financial Dashboard Terminal Preview */}
        <DashboardShowcaseSection />

        {/* Section 5 – Feature Showcase */}
        <FeatureCardsSection />

        {/* Section 6 – Geometric World */}
        <GeometricWorldSection />

        {/* Section 7 – Final CTA with Luminous Particle Sphere & Footer */}
        <FinalCTASection />
      </main>
    </div>
  );
}
