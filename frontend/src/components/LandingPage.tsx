import React, { useEffect, useRef } from 'react';

// Declare global window properties for CDNs
declare global {
  interface Window {
    VANTA: {
      FOG: (config: Record<string, unknown>) => VantaEffect;
    };
    THREE: unknown;
    gsap: {
      registerPlugin: (plugin: unknown) => void;
      from: (target: string, config: Record<string, unknown>) => void;
      fromTo: (target: string, from: Record<string, unknown>, to: Record<string, unknown>) => void;
      to: (target: string | Element | Element[] | NodeListOf<Element> | (Element | NodeListOf<Element>)[], config: Record<string, unknown>) => void;
      killTweensOf: (target: Element | Element[] | NodeListOf<Element>) => void;
    };
    ScrollTrigger: unknown;
    Lenis: new (config: Record<string, unknown>) => LenisInstance;
  }
}

/** Vanta.js fog effect instance with lifecycle methods. */
interface VantaEffect {
  resize?: () => void;
  destroy: () => void;
}

/** Lenis smooth scroll instance with lifecycle methods. */
interface LenisInstance {
  raf: (time: number) => void;
  destroy: () => void;
  scrollTo: (target: string) => void;
}

interface LandingPageProps {
  onEnterApp: () => void;
}

/**
 * Cinematic landing page with Vanta.js fog background, GSAP scroll-triggered animations,
 * Lenis smooth scrolling, and a 4-section editorial narrative guiding users into the app.
 */
export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<LenisInstance | null>(null);

  // Initialize Vanta Fog
  useEffect(() => {
    let effect: VantaEffect | null = null;
    if (vantaRef.current && window.VANTA && window.THREE) {
      try {
        effect = window.VANTA.FOG({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          highlightColor: 0xbae6fd,
          mitchellColor: 0xfecdd3,
          baseColor: 0xf8fafc,
          lowlightColor: 0xe2e8f0,
          blurFactor: 0.60,
          speed: 1.20,
          zoom: 1.10
        });
        
        // Force Vanta to recalculate size once layout settles
        setTimeout(() => {
          if (effect && typeof effect.resize === 'function') {
            effect.resize();
          }
        }, 500);
      } catch (err) {
        console.error('Failed to initialize Vanta Fog:', err);
      }
    }
    return () => {
      if (effect) {
        effect.destroy();
      }
    };
  }, []);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const Lenis = window.Lenis;
    let lenisInst: LenisInstance | null = null;
    if (Lenis) {
      try {
        lenisInst = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1,
          touchMultiplier: 2,
          infinite: false,
        });

        const raf = (time: number) => {
          if (lenisInst) {
            lenisInst.raf(time);
            requestAnimationFrame(raf);
          }
        };
        requestAnimationFrame(raf);
        lenisRef.current = lenisInst;
      } catch (err) {
        console.error('Failed to initialize Lenis:', err);
      }
    }
    return () => {
      if (lenisInst) {
        lenisInst.destroy();
      }
    };
  }, []);

  // Initialize GSAP Animations
  useEffect(() => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (gsap && ScrollTrigger) {
      try {
        gsap.registerPlugin(ScrollTrigger);

        const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (isReducedMotion) return;

        // Hero title stagger reveal
        gsap.fromTo(".reveal-word", {
          opacity: 0,
          y: 35
        }, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.18,
          ease: "power4.out"
        });

        // Story 1: Definition Image reveal
        gsap.from("#showcase-img-island", {
          scrollTrigger: {
            trigger: "#story-section-1",
            start: "top 70%",
            toggleActions: "play none none reverse"
          },
          scale: 0.92,
          duration: 1.4,
          ease: "power2.out"
        });

        // Story 2: Causes Image reveal
        gsap.from("#showcase-img-sources", {
          scrollTrigger: {
            trigger: "#story-section-2",
            start: "top 70%",
            toggleActions: "play none none reverse"
          },
          scale: 0.92,
          duration: 1.4,
          ease: "power2.out"
        });

        // Story 2: Cause List Items stagger
        gsap.from(".cause-list-item", {
          scrollTrigger: {
            trigger: "#story-section-2",
            start: "top 60%"
          },
          opacity: 0,
          x: 50,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out"
        });

        // Story 3: Comparative Statistics Counters CountUp Concurrent
        gsap.fromTo("#counter-india", { innerText: "0.0" }, {
          innerText: "1.9",
          duration: 2.0,
          ease: "power2.out",
          scrollTrigger: { trigger: "#story-section-3", start: "top 60%" },
          snap: { innerText: 0.1 },
          onUpdate: function(this: any) {
            const val = parseFloat(this.targets()[0].innerText);
            this.targets()[0].innerText = val.toFixed(1);
          }
        });

        gsap.fromTo("#counter-target", { innerText: "0.0" }, {
          innerText: "2.0",
          duration: 2.0,
          ease: "power2.out",
          scrollTrigger: { trigger: "#story-section-3", start: "top 60%" },
          snap: { innerText: 0.1 },
          onUpdate: function(this: any) {
            const val = parseFloat(this.targets()[0].innerText);
            this.targets()[0].innerText = val.toFixed(1);
          }
        });

        gsap.fromTo("#counter-western", { innerText: "0.0" }, {
          innerText: "16.0",
          duration: 2.0,
          ease: "power2.out",
          scrollTrigger: { trigger: "#story-section-3", start: "top 60%" },
          snap: { innerText: 0.1 },
          onUpdate: function(this: any) {
            const val = parseFloat(this.targets()[0].innerText);
            this.targets()[0].innerText = val.toFixed(1);
          }
        });
      } catch (err) {
        console.error('Failed to initialize GSAP/ScrollTrigger:', err);
      }
    }
  }, []);

  const handleBeginJourney = () => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo('#story-section-1');
    } else {
      document.getElementById('story-section-1')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEnterApp = () => {
    const gsap = window.gsap;
    const landingEl = document.getElementById('landing-page');
    if (gsap && landingEl) {
      gsap.to(landingEl, {
        opacity: 0,
        y: -50,
        duration: 0.8,
        ease: "power3.inOut",
        onComplete: () => {
          onEnterApp();
        }
      });
    } else {
      onEnterApp();
    }
  };

  return (
    <div id="landing-page" role="document" aria-label="Storytelling Landing Page">
      {/* Hero Section */}
      <section id="hero-section" className="landing-section">
        <div id="vanta-bg-container" ref={vantaRef} aria-hidden="true"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="reveal-word">Your</span>{' '}
            <span className="reveal-word">Carbon</span>{' '}
            <span className="reveal-word">Pulse.</span>{' '}
            <span className="reveal-word">Reimagined.</span>
          </h1>
          <p className="hero-subtitle">An organic sensory experience in carbon footprint consciousness.</p>
          <button
            className="primary-btn magnetic-btn"
            id="hero-enter-btn"
            onClick={handleBeginJourney}
          >
            Begin Journey
          </button>
        </div>
        <div className="scroll-indicator" aria-hidden="true">
          <span>Scroll to explore</span>
          <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* Section 1: Definition of Carbon Footprint */}
      <section id="story-section-1" className="landing-section">
        <div className="story-showcase-split">
          <div className="showcase-text-col">
            <span className="story-tag">The Basics</span>
            <h2 className="story-headline" style={{ color: 'var(--text-primary)' }}>What is a Carbon Footprint?</h2>
            <p className="story-body">
              A <strong>carbon footprint</strong> is the total volume of greenhouse gases (including carbon dioxide and methane) generated by our collective actions. It acts as an ecological shadow—measuring how our travel, diet, and utility usage shape the atmosphere.
            </p>
            <p className="story-body">
              Measured in metric tons of carbon dioxide equivalent (t CO₂e/yr), understanding this baseline is the first step toward environmental balance.
            </p>
          </div>
          <div className="showcase-image-col">
            <div className="showcase-image-wrapper">
              <img
                src="/assets/eco_island.png"
                alt="Ecological Balance Concept"
                id="showcase-img-island"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Primary Causes Grid */}
      <section id="story-section-2" className="landing-section">
        <div className="story-showcase-split reverse">
          <div className="showcase-image-col">
            <div className="showcase-image-wrapper">
              <img
                src="/assets/carbon_sources.png"
                alt="Carbon Emission Sources"
                id="showcase-img-sources"
              />
            </div>
          </div>
          <div className="showcase-text-col">
            <span className="story-tag">The Contributors</span>
            <h2 className="story-headline" style={{ color: 'var(--text-primary)' }}>Where does it come from?</h2>
            <p className="story-body" style={{ marginBottom: '1.5rem' }}>
              Daily human activities are the direct cause of rising atmospheric carbon. Four key sectors drive our footprints:
            </p>

            <div className="cause-interactive-list">
              <div className="cause-list-item">
                <span className="cause-icon" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M18 10V6c0-1.1-.9-2-2-2H8C6.9 4 6 4.9 6 6v4c0 3.3 2.7 6 6 6h0c3.3 0 6-2.7 6-6zM12 16v4M8 2h0M16 2h0" />
                  </svg>
                </span>
                <div>
                  <strong>Energy & Utility (31%)</strong>
                  <p>Coal and natural gas burned to power home heating, cooling, and electronic devices.</p>
                </div>
              </div>
              
              <div className="cause-list-item">
                <span className="cause-icon" style={{ color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.2)' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </span>
                <div>
                  <strong>Transportation (15%)</strong>
                  <p>Single-occupancy petrol vehicles and global flights releasing raw greenhouse exhausts.</p>
                </div>
              </div>

              <div className="cause-list-item">
                <span className="cause-icon" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10c2.3 0 4.3-.8 6-2.1l-3.3-3.3a5.9 5.9 0 0 1-5.4-5.4L6 7.9C7.3 6.3 9.3 5.3 12 5.3A6.7 6.7 0 0 1 18.7 12c0 2.7-1 4.7-2.7 6L19.9 21.3A10 10 0 0 0 22 12A10 10 0 0 0 12 2z" />
                  </svg>
                </span>
                <div>
                  <strong>Diet & Food (26%)</strong>
                  <p>Mass livestock farming (emitting methane) and long-distance food transportation.</p>
                </div>
              </div>

              <div className="cause-list-item">
                <span className="cause-icon" style={{ color: '#5e6ad2', borderColor: 'rgba(94, 106, 210, 0.2)' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </span>
                <div>
                  <strong>Waste & Shopping (28%)</strong>
                  <p>Industrial manufacturing of consumer goods and landfills emitting methane from organic waste.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Comparative Statistics Counter */}
      <section id="story-section-3" className="landing-section">
        <div className="story-content">
          <span className="story-tag">The Impact Contrast</span>
          <h2 className="story-headline" style={{ color: 'var(--text-primary)' }}>Analyzing Global Averages</h2>
          <p className="story-body">
            Emissions vary widely across countries. To prevent critical warming, we must align our baselines with global limits.
          </p>

          <div className="comparative-grid">
            <div className="comparative-stat-card" role="group" aria-label="Average Indian carbon footprint stats">
              <span className="comp-label">Average Indian</span>
              <div className="big-counter-display font-mono">
                <span id="counter-india">0.0</span>
                <span className="counter-unit">Tons CO₂e/yr</span>
              </div>
              <p className="comp-description">Low intensity but growing fast with rapid modernization.</p>
            </div>

            <div className="comparative-stat-card highlighted" role="group" aria-label="Global Target carbon footprint stats">
              <span className="comp-label">Global Target</span>
              <div className="big-counter-display font-mono">
                <span id="counter-target">0.0</span>
                <span className="counter-unit">Tons CO₂e/yr</span>
              </div>
              <p className="comp-description">The carbon limit needed to prevent a 1.5°C temperature rise.</p>
            </div>

            <div className="comparative-stat-card" role="group" aria-label="US or Western Average carbon footprint stats">
              <span className="comp-label">US / Western Average</span>
              <div className="big-counter-display font-mono">
                <span id="counter-western">0.0</span>
                <span className="counter-unit">Tons CO₂e/yr</span>
              </div>
              <p className="comp-description">High energy lifestyles, extensive travel, and consumer purchases.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: CTA */}
      <section id="cta-section" className="landing-section">
        <div className="cta-content">
          <span className="story-tag">Start Your Journey</span>
          <h2 className="story-headline" style={{ color: 'var(--text-primary)' }}>Ready to shift your pulse?</h2>
          <p className="story-body" style={{ maxWidth: '600px', marginBottom: '1rem' }}>
            Initialize your score and unlock your personalized daily reduction dashboard.
          </p>
          <button
            className="primary-btn large-btn magnetic-btn"
            id="cta-enter-btn"
            onClick={handleEnterApp}
          >
            Enter App Dashboard
          </button>
        </div>
      </section>
    </div>
  );
};
export default LandingPage;
