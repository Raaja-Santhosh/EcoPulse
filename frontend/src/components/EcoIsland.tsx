import React, { useEffect, useRef } from 'react';
import { useEcoPulseStore } from '../store';
import gsap from 'gsap';

export const EcoIsland: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { logs, score: baseScore } = useEcoPulseStore();
  
  const logImpactTons = logs.reduce((sum, log) => sum + (log.carbon / 1000), 0);
  const score = Math.max(0.1, Math.round((baseScore + logImpactTons) * 100) / 100);
  const hasLogs = logs.length > 0;

  useEffect(() => {
    if (!containerRef.current) return;

    // Elements
    const sky = containerRef.current.querySelector('#island-sky');
    const smog = containerRef.current.querySelector('#island-smog');
    const sun = containerRef.current.querySelector('#island-sun');
    const birds = containerRef.current.querySelector('#birds-group');
    const grass = containerRef.current.querySelector('#island-grass');
    
    const t1 = containerRef.current.querySelector('#tree1-leaves');
    const t2 = containerRef.current.querySelector('#tree2-leaves');
    const t3 = containerRef.current.querySelector('#tree3-leaves');
    
    const seedlings = containerRef.current.querySelector('#dweller-seedlings');
    const bunnies = containerRef.current.querySelector('#dweller-bunnies');
    const foxes = containerRef.current.querySelector('#dweller-foxes');
    
    const flowerBuds = containerRef.current.querySelectorAll('.flower-bud');
    const bunnyParts = containerRef.current.querySelectorAll('.bunny-body, .bunny-head, .bunny-ear');
    const foxParts = containerRef.current.querySelectorAll('.fox-fur, .fox-ear');

    if (!sky || !smog || !sun || !birds || !grass || !t1 || !t2 || !t3) return;

    // Default healthy/active targets
    let targetSkyColor = '#a4c6df';
    let targetSmogOpacity = 0;
    let targetSunColor = '#fde047';
    let targetBirdsOpacity = 1;
    let targetGrassColor = '#4ade80';
    let t1Radius = 20, t1Color = '#15803d';
    let t2Radius = 28, t2Color = '#166534';
    let t3Radius = 16, t3Color = '#15803d';

    let targetDwellersOpacity = 1;
    let targetDwellersScale = 1;
    let targetBudColor = '#facc15';
    let targetBunnyColor = '#ffffff';
    let targetFoxColor = '#f97316';
    let animateDwellers = false;

    if (!hasLogs) {
      targetSkyColor = '#475569';
      targetSmogOpacity = 0.2;
      targetSunColor = '#94a3b8';
      targetBirdsOpacity = 0;
      targetGrassColor = '#57534e';
      t1Radius = 0; t1Color = '#451a03';
      t2Radius = 0; t2Color = '#451a03';
      t3Radius = 0; t3Color = '#451a03';
      
      targetDwellersOpacity = 0;
      targetDwellersScale = 0.1;
    } else if (score < 4.0) {
      targetSkyColor = '#a4c6df';
      targetSmogOpacity = 0;
      targetSunColor = '#fde047';
      targetBirdsOpacity = 1;
      targetGrassColor = '#4ade80';
      t1Radius = 20; t1Color = '#15803d';
      t2Radius = 28; t2Color = '#166534';
      t3Radius = 16; t3Color = '#15803d';
      
      targetDwellersOpacity = 1;
      targetDwellersScale = 1;
      targetBudColor = '#facc15';
      targetBunnyColor = '#ffffff';
      targetFoxColor = '#f97316';
      animateDwellers = true;
    } else if (score <= 10.0) {
      targetSkyColor = '#94a3b8';
      targetSmogOpacity = 0.35;
      targetSunColor = '#e2e8f0';
      targetBirdsOpacity = 0;
      targetGrassColor = '#f59e0b';
      t1Radius = 12; t1Color = '#d97706';
      t2Radius = 20; t2Color = '#d97706';
      t3Radius = 8; t3Color = '#b45309';

      targetDwellersOpacity = 0.45;
      targetDwellersScale = 0.85;
      targetBudColor = '#78716c';
      targetBunnyColor = '#d6d3d1';
      targetFoxColor = '#b45309';
    } else {
      targetSkyColor = '#334155';
      targetSmogOpacity = 0.75;
      targetSunColor = '#475569';
      targetBirdsOpacity = 0;
      targetGrassColor = '#7f1d1d';
      t1Radius = 2; t1Color = '#991b1b';
      t2Radius = 4; t2Color = '#991b1b';
      t3Radius = 2; t3Color = '#991b1b';

      targetDwellersOpacity = 0;
      targetDwellersScale = 0;
    }

    // Run GSAP transitions
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isReducedMotion) {
      sky.setAttribute('fill', targetSkyColor);
      smog.setAttribute('opacity', String(targetSmogOpacity));
      sun.setAttribute('fill', targetSunColor);
      birds.setAttribute('opacity', String(targetBirdsOpacity));
      grass.setAttribute('fill', targetGrassColor);
      t1.setAttribute('r', String(t1Radius)); t1.setAttribute('fill', t1Color);
      t2.setAttribute('r', String(t2Radius)); t2.setAttribute('fill', t2Color);
      t3.setAttribute('r', String(t3Radius)); t3.setAttribute('fill', t3Color);

      if (seedlings && bunnies && foxes) {
        seedlings.setAttribute('opacity', String(targetDwellersOpacity));
        bunnies.setAttribute('opacity', String(targetDwellersOpacity));
        foxes.setAttribute('opacity', String(targetDwellersOpacity));
        flowerBuds.forEach(el => el.setAttribute('fill', targetBudColor));
        bunnyParts.forEach(el => el.setAttribute('fill', targetBunnyColor));
        foxParts.forEach(el => el.setAttribute('fill', targetFoxColor));
      }
    } else {
      gsap.to(sky, { fill: targetSkyColor, duration: 1.2, ease: "power2.out" });
      gsap.to(smog, { opacity: targetSmogOpacity, duration: 1.2, ease: "power2.out" });
      gsap.to(sun, { fill: targetSunColor, duration: 1.2, ease: "power2.out" });
      gsap.to(birds, { opacity: targetBirdsOpacity, duration: 0.8 });
      gsap.to(grass, { fill: targetGrassColor, duration: 1.2 });
      gsap.to(t1, { r: t1Radius, fill: t1Color, duration: 1.2, ease: "back.out(1.5)" });
      gsap.to(t2, { r: t2Radius, fill: t2Color, duration: 1.2, ease: "back.out(1.5)" });
      gsap.to(t3, { r: t3Radius, fill: t3Color, duration: 1.2, ease: "back.out(1.5)" });

      if (seedlings && bunnies && foxes) {
        gsap.to([seedlings, bunnies, foxes], { opacity: targetDwellersOpacity, duration: 1.2, ease: "power2.out" });
        gsap.to([seedlings, bunnies, foxes], { scale: targetDwellersScale, transformOrigin: "bottom center", duration: 1.2, ease: "back.out(1.5)" });
        gsap.to(flowerBuds, { fill: targetBudColor, duration: 1.2 });
        gsap.to(bunnyParts, { fill: targetBunnyColor, duration: 1.2 });
        gsap.to(foxParts, { fill: targetFoxColor, duration: 1.2 });

        if (animateDwellers) {
          // Hop bunnies
          gsap.killTweensOf(containerRef.current.querySelectorAll('.bunny-creature'));
          gsap.to(containerRef.current.querySelectorAll('.bunny-creature'), {
            y: -4,
            duration: 0.6,
            yoyo: true,
            repeat: -1,
            ease: "power1.inOut",
            stagger: 0.2
          });
          // Sway seedlings
          gsap.killTweensOf(containerRef.current.querySelectorAll('#dweller-seedlings > g'));
          gsap.to(containerRef.current.querySelectorAll('#dweller-seedlings > g'), {
            rotation: 5,
            transformOrigin: "bottom center",
            duration: 1.5,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
            stagger: 0.3
          });
          // Breathe foxes
          gsap.killTweensOf(containerRef.current.querySelectorAll('.fox-creature'));
          gsap.to(containerRef.current.querySelectorAll('.fox-creature'), {
            scaleX: 1.05,
            duration: 0.8,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
          });
        } else {
          // Kill all active tweens and reset positions
          gsap.killTweensOf(containerRef.current.querySelectorAll('.bunny-creature'));
          gsap.killTweensOf(containerRef.current.querySelectorAll('#dweller-seedlings > g'));
          gsap.killTweensOf(containerRef.current.querySelectorAll('.fox-creature'));
          gsap.to([
            containerRef.current.querySelectorAll('.bunny-creature'),
            containerRef.current.querySelectorAll('#dweller-seedlings > g'),
            containerRef.current.querySelectorAll('.fox-creature')
          ], {
            y: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 0.5
          });
        }
      }
    }
  }, [score, hasLogs]);

  // Determine status description text
  let statusText = 'No activities logged. Start logging your daily inputs to sprout trees and clear skies!';
  let badgeText = 'Dormant';
  let badgeClass = 'rgba(255, 255, 255, 0.05)';
  let badgeTextColor = 'var(--text-secondary)';
  let badgeBorderColor = 'var(--border-color)';

  if (hasLogs) {
    if (score < 4.0) {
      statusText = 'Your atmosphere is fresh, and plants and eco-dwellers are thriving!';
      badgeText = 'Healthy';
      badgeClass = 'rgba(154, 219, 165, 0.1)';
      badgeTextColor = 'var(--color-success)';
      badgeBorderColor = 'var(--color-success)';
    } else if (score <= 10.0) {
      statusText = 'Moderate emissions. Smog is forming, and dwellers are hiding or look sick.';
      badgeText = 'Moderate';
      badgeClass = 'rgba(223, 138, 96, 0.1)';
      badgeTextColor = 'var(--color-accent-terracotta)';
      badgeBorderColor = 'var(--color-accent-terracotta)';
    } else {
      statusText = 'High emissions warning! Acid rain has withered the island and all eco-dwellers have fled.';
      badgeText = 'Severe';
      badgeClass = 'rgba(226, 124, 124, 0.1)';
      badgeTextColor = 'var(--color-danger)';
      badgeBorderColor = 'var(--color-danger)';
    }
  }

  return (
    <div className="neo-card flex flex-col items-center" ref={containerRef}>
      <div className="flex justify-between items-center w-full mb-4">
        <h3>Your Eco-Island</h3>
        <span
          className="island-badge px-3 py-1 text-xs font-bold border rounded"
          style={{
            color: badgeTextColor,
            borderColor: badgeBorderColor,
            backgroundColor: badgeClass,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {badgeText}
        </span>
      </div>
      <p className="text-sm text-secondary text-left mb-4">
        This living ecosystem visually responds to your footprint trend. Complete actions to clear skies and sprout trees!
      </p>

      <div className="island-svg-container border-2 border-primary bg-white p-2 w-full max-w-lg">
        <svg id="eco-island-svg" viewBox="0 0 400 250" width="100%" height="100%">
          {/* Sky */}
          <rect id="island-sky" x="0" y="0" width="400" height="200" fill="#a4c6df" style={{ transition: 'fill 0.8s' }}></rect>
          {/* Smog Overlay */}
          <rect id="island-smog" x="0" y="0" width="400" height="200" fill="#665b53" opacity="0" style={{ transition: 'opacity 0.8s' }}></rect>
          {/* Sun */}
          <circle id="island-sun" cx="300" cy="50" r="22" fill="#fde047" style={{ transition: 'fill 0.8s' }}></circle>
          
          {/* Cloud drifts */}
          <g id="cloud-group">
            <path className="cloud-path" d="M 50,80 A 15,15 0 0,1 80,80 A 20,20 0 0,1 110,80 A 15,15 0 0,1 120,90 L 40,90 Z" fill="#ffffff" opacity="0.85"></path>
            <path className="cloud-path" d="M 220,60 A 12,12 0 0,1 240,60 A 18,18 0 0,1 270,60 A 12,12 0 0,1 280,70 L 210,70 Z" fill="#ffffff" opacity="0.85"></path>
          </g>
          
          {/* Birds */}
          <g id="birds-group" opacity="1" style={{ transition: 'opacity 0.8s' }}>
            <path d="M 80,40 Q 85,35 90,40 Q 95,35 100,40" fill="none" stroke="#2c3327" strokeWidth="1.5"></path>
            <path d="M 140,30 Q 145,25 150,30 Q 155,25 160,30" fill="none" stroke="#2c3327" strokeWidth="1.5"></path>
          </g>
          
          {/* Soil Base */}
          <path d="M 60,180 L 340,180 Q 350,195 310,210 Q 200,230 90,210 Q 50,195 60,180 Z" fill="#78350f"></path>
          {/* Grass Layer */}
          <path id="island-grass" d="M 60,180 Q 200,165 340,180 L 345,185 Q 200,172 55,185 Z" fill="#4ade80" style={{ transition: 'fill 0.8s' }}></path>
          
          {/* Trees */}
          <g id="trees-group">
            <rect x="110" y="140" width="8" height="40" fill="#451a03"></rect>
            <circle id="tree1-leaves" cx="114" cy="130" r="20" fill="#15803d" style={{ transition: 'fill 0.8s, r 0.8s' }}></circle>
            <rect x="200" y="125" width="10" height="55" fill="#451a03"></rect>
            <circle id="tree2-leaves" cx="205" cy="110" r="28" fill="#166534" style={{ transition: 'fill 0.8s, r 0.8s' }}></circle>
            <rect x="280" y="145" width="8" height="35" fill="#451a03"></rect>
            <circle id="tree3-leaves" cx="284" cy="135" r="16" fill="#15803d" style={{ transition: 'fill 0.8s, r 0.8s' }}></circle>
          </g>

          {/* Eco-Dwellers */}
          <g id="eco-dwellers">
            {/* Seedlings / Flowers */}
            <g id="dweller-seedlings">
              <g transform="translate(80, 175)">
                <path d="M 0,0 Q 3,-5 0,-10 Q -3,-5 0,0" fill="none" stroke="#22c55e" strokeWidth="2"></path>
                <circle cx="0" cy="-10" r="3.5" fill="#facc15" className="flower-bud" style={{ transition: 'fill 0.8s' }}></circle>
              </g>
              <g transform="translate(150, 180)">
                <path d="M 0,0 Q -2,-6 1,-11 Q 4,-5 0,0" fill="none" stroke="#22c55e" strokeWidth="2"></path>
                <circle cx="1" cy="-11" r="3.5" fill="#f87171" className="flower-bud" style={{ transition: 'fill 0.8s' }}></circle>
              </g>
              <g transform="translate(310, 176)">
                <path d="M 0,0 Q 4,-4 2,-9 Q -1,-4 0,0" fill="none" stroke="#22c55e" strokeWidth="2"></path>
                <circle cx="2" cy="-9" r="3" fill="#60a5fa" className="flower-bud" style={{ transition: 'fill 0.8s' }}></circle>
              </g>
            </g>

            {/* Bunnies */}
            <g id="dweller-bunnies">
              <g transform="translate(135, 168)" className="bunny-creature">
                <ellipse cx="10" cy="8" rx="8" ry="6" fill="#ffffff" className="bunny-body" style={{ transition: 'fill 0.8s' }}></ellipse>
                <circle cx="15" cy="5" r="4" fill="#ffffff" className="bunny-head" style={{ transition: 'fill 0.8s' }}></circle>
                <ellipse cx="14" cy="0" rx="1.5" ry="3.5" fill="#ffffff" className="bunny-ear" transform="rotate(-10 14 0)" style={{ transition: 'fill 0.8s' }}></ellipse>
                <ellipse cx="16" cy="0" rx="1.5" ry="3.5" fill="#ffffff" className="bunny-ear" transform="rotate(10 16 0)" style={{ transition: 'fill 0.8s' }}></ellipse>
                <circle cx="2" cy="8" r="2" fill="#ffffff" style={{ transition: 'fill 0.8s' }}></circle>
                <circle cx="16" cy="4" r="0.7" fill="#ff80b3" className="bunny-eye"></circle>
              </g>
              <g transform="translate(250, 170)" className="bunny-creature">
                <ellipse cx="10" cy="8" rx="8" ry="6" fill="#fcfcfc" className="bunny-body" style={{ transition: 'fill 0.8s' }}></ellipse>
                <circle cx="15" cy="5" r="4" fill="#fcfcfc" className="bunny-head" style={{ transition: 'fill 0.8s' }}></circle>
                <ellipse cx="14" cy="0" rx="1.5" ry="3.5" fill="#fcfcfc" className="bunny-ear" transform="rotate(-15 14 0)" style={{ transition: 'fill 0.8s' }}></ellipse>
                <ellipse cx="16" cy="0" rx="1.5" ry="3.5" fill="#fcfcfc" className="bunny-ear" transform="rotate(5 16 0)" style={{ transition: 'fill 0.8s' }}></ellipse>
                <circle cx="2" cy="8" r="2" fill="#fcfcfc" style={{ transition: 'fill 0.8s' }}></circle>
                <circle cx="16" cy="4" r="0.7" fill="#ff80b3" className="bunny-eye"></circle>
              </g>
            </g>

            {/* Foxes */}
            <g id="dweller-foxes">
              <g transform="translate(220, 160)" className="fox-creature">
                <path d="M 0,10 Q -5,5 -2,0 Q 2,0 0,10" fill="#f97316" className="fox-fur" style={{ transition: 'fill 0.8s' }}></path>
                <ellipse cx="12" cy="10" rx="8" ry="5" fill="#f97316" className="fox-fur" style={{ transition: 'fill 0.8s' }}></ellipse>
                <polygon points="18,5 24,9 18,13" fill="#f97316" className="fox-fur" style={{ transition: 'fill 0.8s' }}></polygon>
                <circle cx="19" cy="8" r="4" fill="#f97316" className="fox-fur" style={{ transition: 'fill 0.8s' }}></circle>
                <polygon points="17,5 17,0 20,4" fill="#ea580c" className="fox-ear" style={{ transition: 'fill 0.8s' }}></polygon>
                <circle cx="20" cy="7" r="0.8" fill="#ffffff" className="fox-eye"></circle>
              </g>
            </g>
          </g>
        </svg>
      </div>

      <div className="w-full text-center mt-3 pt-3 border-t border-dashed border-primary">
        <span className="text-sm font-serif italic-highlight text-primary font-bold">{statusText}</span>
      </div>
    </div>
  );
};
