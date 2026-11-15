/**
 * Mission Architect - Main Entry Point
 */

import { state, subscribe, notify, setScreen, importDesignHash } from './state.js';
window.__STATE__ = state;
import { showToast } from './ui.js';
import { renderUI, setupEventListeners } from './ui.js';

// 1. Starfield Canvas (Max 80 stars, <=30fps, pauses on hidden or reduced-motion)
function initStarfield() {
  const canvas = document.getElementById('starfield-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animationFrameId = null;
  let lastTime = 0;
  const targetFPS = 30;
  const frameInterval = 1000 / targetFPS;

  let mouseX = 0, mouseY = 0;
  let targetOffsetX = 0, targetOffsetY = 0;
  let currentOffsetX = 0, currentOffsetY = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Generate 120 stars across 3 depth layers
  const stars = [];
  const starCount = 120;
  for (let i = 0; i < starCount; i++) {
    // 60% small, 30% medium, 10% large
    const layer = i < 72 ? 0 : (i < 108 ? 1 : 2);
    const radius = layer === 0 ? 0.65 : (layer === 1 ? 1.1 : 1.6);
    const baseAlpha = layer === 0 ? 0.35 : (layer === 1 ? 0.65 : 0.9);
    const parallaxFactor = (layer + 1) * 0.015;
    const isTwinkler = i < 10; // Exactly 10 stars twinkle

    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius,
      baseAlpha,
      layer,
      parallaxFactor,
      isTwinkler,
      twinkleSpeed: Math.random() * 0.04 + 0.02,
      twinklePhase: Math.random() * Math.PI * 2
    });
  }

  // Parallax mouse listener (desktop only)
  if (!prefersReduced && window.innerWidth > 900) {
    window.addEventListener('mousemove', (e) => {
      targetOffsetX = (e.clientX - window.innerWidth / 2);
      targetOffsetY = (e.clientY - window.innerHeight / 2);
    }, { passive: true });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Smooth parallax lerp
    currentOffsetX += (targetOffsetX - currentOffsetX) * 0.04;
    currentOffsetY += (targetOffsetY - currentOffsetY) * 0.04;

    for (const s of stars) {
      let drawAlpha = s.baseAlpha;
      if (s.isTwinkler) {
        s.twinklePhase += s.twinkleSpeed;
        drawAlpha = s.baseAlpha * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.twinklePhase)));
      }

      const px = (s.x - currentOffsetX * s.parallaxFactor + canvas.width) % canvas.width;
      const py = (s.y - currentOffsetY * s.parallaxFactor + canvas.height) % canvas.height;

      ctx.beginPath();
      ctx.arc(px, py, s.radius, 0, Math.PI * 2);

      if (s.layer === 2) {
        ctx.fillStyle = `rgba(180, 220, 255, ${drawAlpha})`;
      } else if (s.layer === 1) {
        ctx.fillStyle = `rgba(230, 240, 255, ${drawAlpha})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${drawAlpha})`;
      }
      ctx.fill();
    }
  }

  // Draw static starfield once for reduced motion
  if (prefersReduced) {
    draw();
    return;
  }

  function loop(now) {
    if (document.hidden) {
      animationFrameId = requestAnimationFrame(loop);
      return;
    }

    const elapsed = now - lastTime;
    if (elapsed > frameInterval) {
      lastTime = now - (elapsed % frameInterval);
      draw();
    }

    animationFrameId = requestAnimationFrame(loop);
  }

  animationFrameId = requestAnimationFrame(loop);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    } else if (!document.hidden && !animationFrameId) {
      lastTime = performance.now();
      animationFrameId = requestAnimationFrame(loop);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  setupEventListeners();

  // Logo home button
  const brand = document.getElementById('brand-home-btn');
  if (brand) {
    brand.addEventListener('click', () => setScreen('landing'));
  }

  // Reactive UI update subscriber
  subscribe(() => {
    renderUI();
  });

  function checkHashAndLoad() {
    if (window.location.hash && window.location.hash.length > 2) {
      try {
        const hashStr = window.location.hash.substring(1);
        const success = importDesignHash(hashStr);
        if (success) {
          setScreen('build');
          showToast('Shared spacecraft design loaded successfully!', 'ok');
        } else {
          showToast('Could not load shared link. Starting fresh mission.', 'warn');
          setScreen('landing');
        }
      } catch (e) {
        showToast('Corrupted share link. Starting on landing page.', 'warn');
        setScreen('landing');
      }
    }
  }

  window.addEventListener('hashchange', checkHashAndLoad);
  checkHashAndLoad();

  // Initial calculation and view trigger
  notify();
});
