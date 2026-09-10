/* Reality Mining — script.js */
'use strict';

// ─── UTILS ────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (a, b) => a + Math.random() * (b - a);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function sectionProgress(el) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return clamp((-r.top) / (r.height - vh), 0, 1);
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const navbar = $('navbar');
const hamburger = $('hamburger');
const mobileMenu = $('mobile-menu');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
  mobileMenu.classList.toggle('open', open);
  mobileMenu.setAttribute('aria-hidden', !open);
});

mobileMenu.querySelectorAll('.mobile-link').forEach(l => {
  l.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// ─── CANVAS HELPER ────────────────────────────────────────────────────────────
function initCanvas(canvas) {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width = r.width * devicePixelRatio;
    canvas.height = r.height * devicePixelRatio;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  return { ctx, canvas, w: () => canvas.width / devicePixelRatio, h: () => canvas.height / devicePixelRatio };
}

// ─── HERO CANVAS ─────────────────────────────────────────────────────────────
(function heroCanvas() {
  const c = initCanvas($('hero-canvas'));
  if (!c) return;
  const countEl = $('viz-node-count');

  const MAX = 28;
  const nodes = [];
  for (let i = 0; i < MAX; i++) {
    nodes.push({
      x: rand(0.1, 0.9), y: rand(0.1, 0.9),
      vx: rand(-0.04, 0.04), vy: rand(-0.04, 0.04),
      r: rand(2, 5), born: i / MAX, connected: false
    });
  }

  let visible = 2, connections = [];
  const heroSection = document.querySelector('.section-hero');

  function draw(t) {
    const W = c.w(), H = c.h();
    c.ctx.clearRect(0, 0, W, H);

    const prog = clamp(window.scrollY / (window.innerHeight * 0.9), 0, 1);
    visible = Math.round(2 + prog * (MAX - 2));
    if (countEl) countEl.textContent = visible;

    // draw connections
    connections = [];
    for (let i = 0; i < visible; i++) {
      for (let j = i + 1; j < visible; j++) {
        const dx = (nodes[i].x - nodes[j].x) * W;
        const dy = (nodes[i].y - nodes[j].y) * H;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 140) connections.push([i, j, 1 - d / 140]);
      }
    }

    connections.forEach(([i, j, str]) => {
      c.ctx.beginPath();
      c.ctx.moveTo(nodes[i].x * W, nodes[i].y * H);
      c.ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
      c.ctx.strokeStyle = `rgba(120,180,220,${str * 0.35})`;
      c.ctx.lineWidth = str * 1.2;
      c.ctx.stroke();
    });

    // draw nodes
    for (let i = 0; i < visible; i++) {
      const n = nodes[i];
      n.x += n.vx * 0.003;
      n.y += n.vy * 0.003;
      if (n.x < 0.05 || n.x > 0.95) n.vx *= -1;
      if (n.y < 0.05 || n.y > 0.95) n.vy *= -1;

      const hasConn = connections.some(([a, b]) => a === i || b === i);
      c.ctx.beginPath();
      c.ctx.arc(n.x * W, n.y * H, hasConn ? n.r + 1 : n.r, 0, Math.PI * 2);
      c.ctx.fillStyle = hasConn ? 'rgba(160,200,240,0.9)' : 'rgba(120,160,200,0.55)';
      c.ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

// ─── STORY CANVAS ─────────────────────────────────────────────────────────────
(function storyCanvas() {
  const c = initCanvas($('story-canvas'));
  if (!c) return;
  const section = document.getElementById('story');
  const sentences = document.querySelectorAll('.story-sentence');

  const locs = [
    { x: 0.22, y: 0.15, name: 'Library' },
    { x: 0.65, y: 0.38, name: 'Classrooms' },
    { x: 0.65, y: 0.68, name: 'Cafeteria' },
    { x: 0.28, y: 0.80, name: 'Student Center' },
  ];

  const dots = [];
  for (let i = 0; i < 12; i++) {
    const from = locs[Math.floor(rand(0, locs.length))];
    const to = locs[Math.floor(rand(0, locs.length))];
    dots.push({ from, to, t: rand(0, 1), speed: rand(0.0015, 0.004), active: false });
  }

  let raf;
  function draw() {
    const W = c.w(), H = c.h();
    const prog = section ? sectionProgress(section) : 0;
    const step = Math.floor(prog * 5);

    c.ctx.clearRect(0, 0, W, H);

    // campus grid
    c.ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    c.ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 60) { c.ctx.beginPath(); c.ctx.moveTo(x, 0); c.ctx.lineTo(x, H); c.ctx.stroke(); }
    for (let y = 0; y <= H; y += 60) { c.ctx.beginPath(); c.ctx.moveTo(0, y); c.ctx.lineTo(W, y); c.ctx.stroke(); }

    // location nodes
    locs.forEach((loc, li) => {
      const lx = loc.x * W, ly = loc.y * H;
      c.ctx.beginPath();
      c.ctx.arc(lx, ly, 18, 0, Math.PI * 2);
      c.ctx.strokeStyle = 'rgba(120,180,220,0.25)';
      c.ctx.lineWidth = 1;
      c.ctx.stroke();
      c.ctx.beginPath();
      c.ctx.arc(lx, ly, 5, 0, Math.PI * 2);
      c.ctx.fillStyle = 'rgba(160,200,240,0.5)';
      c.ctx.fill();
    });

    // moving dots
    const activeDots = Math.min(dots.length, step + 2);
    for (let i = 0; i < activeDots; i++) {
      const d = dots[i];
      d.t = (d.t + d.speed) % 1;
      const px = lerp(d.from.x, d.to.x, d.t) * W;
      const py = lerp(d.from.y, d.to.y, d.t) * H;
      c.ctx.beginPath();
      c.ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      c.ctx.fillStyle = 'rgba(200,220,255,0.85)';
      c.ctx.fill();
    }

    // update sentences
    sentences.forEach((s, i) => {
      s.classList.toggle('active', i === step);
      s.classList.toggle('past', i < step);
    });

    raf = requestAnimationFrame(draw);
  }
  draw();
})();

// ─── TRANSFORM SECTION ────────────────────────────────────────────────────────
(function transformSection() {
  const section = document.getElementById('transform');
  if (!section) return;
  const stages = section.querySelectorAll('.transform-stage');
  const c = initCanvas($('transform-canvas'));

  const particles = [];
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: rand(0.1, 0.9), y: rand(0.1, 0.9),
      vx: rand(-1, 1), vy: rand(-1, 1),
      r: rand(1.5, 4), alpha: rand(0.3, 0.8)
    });
  }

  const chars = ['0','1','A','X','+','-','/','>','<','∑','∆','∞','01'];

  function draw() {
    const prog = sectionProgress(section);
    const step = clamp(Math.floor(prog * 4), 0, 3);
    stages.forEach((s, i) => s.classList.toggle('active', i === step));

    if (c) {
      const W = c.w(), H = c.h();
      c.ctx.clearRect(0, 0, W, H);

      particles.forEach((p, i) => {
        p.x += p.vx * 0.001;
        p.y += p.vy * 0.001;
        if (p.x < 0.05 || p.x > 0.95) p.vx *= -1;
        if (p.y < 0.05 || p.y > 0.95) p.vy *= -1;

        // morph: higher prog → structured grid
        let px = p.x, py = p.y;
        if (prog > 0.5) {
          const t = (prog - 0.5) * 2;
          const gx = ((i % 7) / 6) * 0.8 + 0.1;
          const gy = (Math.floor(i / 7) / 5) * 0.8 + 0.1;
          px = lerp(p.x, gx, t);
          py = lerp(p.y, gy, t);
        }

        const col = step >= 3 ? '120,220,180' : step >= 2 ? '160,200,240' : '200,210,230';
        c.ctx.fillStyle = `rgba(${col},${p.alpha})`;

        if (prog < 0.3) {
          c.ctx.beginPath();
          c.ctx.arc(px * W, py * H, p.r, 0, Math.PI * 2);
          c.ctx.fill();
        } else {
          // Dots change into creative symbols & alphanumeric data
          const charProg = clamp((prog - 0.3) * 2.5, 0, 1);
          const char = chars[(i + Math.floor(Date.now() / (300 - charProg * 200))) % chars.length];
          c.ctx.font = `${Math.max(12, p.r * 5)}px Space Mono, monospace`;
          c.ctx.textAlign = 'center';
          c.ctx.textBaseline = 'middle';
          c.ctx.globalAlpha = Math.min(1, charProg * 2);
          c.ctx.fillText(char, px * W, py * H);
          c.ctx.globalAlpha = 1;
        }

        if (step >= 2 && i < 20) {
          const j = (i + 1) % 20;
          const dx = (px - particles[j].x) * W;
          const dy = (py - particles[j].y) * H;
          if (Math.sqrt(dx * dx + dy * dy) < 100) {
            c.ctx.beginPath();
            c.ctx.moveTo(px * W, py * H);
            c.ctx.lineTo(particles[j].x * W, particles[j].y * H);
            c.ctx.strokeStyle = `rgba(120,180,220,${0.18 * (prog < 0.3 ? 1 : 0.4)})`;
            c.ctx.lineWidth = 0.8;
            c.ctx.stroke();
          }
        }
      });
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ─── INVISIBLE LAYER ─────────────────────────────────────────────────────────
(function invisibleLayer() {
  const section = document.getElementById('method');
  if (!section) return;
  const steps = section.querySelectorAll('.inv-step');
  const c = initCanvas($('invisible-canvas'));

  const pts = [];
  for (let i = 0; i < 20; i++) pts.push({ x: rand(0.1, 0.9), y: rand(0.1, 0.9) });

  const paths = [];
  for (let i = 0; i < 8; i++) {
    const a = pts[Math.floor(rand(0, pts.length))];
    const b = pts[Math.floor(rand(0, pts.length))];
    paths.push({ a, b, alpha: 0, width: rand(0.5, 2) });
  }

  function draw() {
    const prog = sectionProgress(section);
    const step = clamp(Math.floor(prog * 6), 0, 5);

    steps.forEach((s, i) => {
      s.classList.toggle('active', i === step);
      s.classList.toggle('past', i < step);
    });

    if (!c) { requestAnimationFrame(draw); return; }
    const W = c.w(), H = c.h();
    c.ctx.clearRect(0, 0, W, H);

    // step 0+: show dots
    if (prog >= 0) {
      const visCount = Math.min(pts.length, 2 + step * 3);
      for (let i = 0; i < visCount; i++) {
        c.ctx.beginPath();
        c.ctx.arc(pts[i].x * W, pts[i].y * H, 4, 0, Math.PI * 2);
        c.ctx.fillStyle = 'rgba(160,200,240,0.8)';
        c.ctx.fill();
      }
    }

    // step 1+: paths
    if (step >= 1) {
      const pathCount = Math.min(paths.length, (step - 1) * 2 + 2);
      for (let i = 0; i < pathCount; i++) {
        const pw = step >= 2 ? paths[i].width * 2 : paths[i].width;
        c.ctx.beginPath();
        c.ctx.moveTo(paths[i].a.x * W, paths[i].a.y * H);
        c.ctx.lineTo(paths[i].b.x * W, paths[i].b.y * H);
        c.ctx.strokeStyle = `rgba(100,160,220,${0.15 + step * 0.08})`;
        c.ctx.lineWidth = pw;
        c.ctx.stroke();
      }
    }

    // step 3+: interaction flares
    if (step >= 3) {
      pts.slice(0, 8).forEach((p, i) => {
        const next = pts[(i + 1) % 8];
        const dx = (p.x - next.x) * W, dy = (p.y - next.y) * H;
        if (Math.sqrt(dx * dx + dy * dy) < 120) {
          const mx = (p.x + next.x) / 2 * W, my = (p.y + next.y) / 2 * H;
          c.ctx.beginPath();
          c.ctx.arc(mx, my, 7, 0, Math.PI * 2);
          c.ctx.fillStyle = 'rgba(180,220,255,0.35)';
          c.ctx.fill();
        }
      });
    }

    // step 4-5: connections + clusters
    if (step >= 4) {
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = (pts[i].x - pts[j].x) * W, dy = (pts[i].y - pts[j].y) * H;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            c.ctx.beginPath();
            c.ctx.moveTo(pts[i].x * W, pts[i].y * H);
            c.ctx.lineTo(pts[j].x * W, pts[j].y * H);
            c.ctx.strokeStyle = `rgba(120,190,240,${0.4 * (1 - d / 100)})`;
            c.ctx.lineWidth = 1;
            c.ctx.stroke();
          }
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

// ─── NETWORK CANVAS ──────────────────────────────────────────────────────────
(function networkCanvas() {
  const c = initCanvas($('network-canvas'));
  if (!c) return;
  const section = document.getElementById('network');

  const NODE_COUNT = 45;
  const nodes = [];
  const clusters = [
    { cx: 0.25, cy: 0.35, color: '140,190,240' },
    { cx: 0.65, cy: 0.25, color: '160,210,200' },
    { cx: 0.55, cy: 0.70, color: '200,170,220' },
    { cx: 0.20, cy: 0.72, color: '240,190,140' },
  ];

  clusters.forEach((cl, ci) => {
    for (let i = 0; i < NODE_COUNT / clusters.length; i++) {
      nodes.push({
        x: cl.cx + rand(-0.13, 0.13),
        y: cl.cy + rand(-0.13, 0.13),
        vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3),
        r: rand(2.5, 5.5), cluster: ci, color: cl.color
      });
    }
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) loop(); });
  }, { threshold: 0.1 });
  obs.observe(section);

  let running = false;
  function loop() {
    if (running) return;
    running = true;
    draw();
  }

  function draw() {
    const W = c.w(), H = c.h();
    const prog = sectionProgress(section);
    c.ctx.clearRect(0, 0, W, H);

    const visCount = Math.round(lerp(4, nodes.length, Math.min(prog * 2.5, 1)));

    // edges
    for (let i = 0; i < visCount; i++) {
      for (let j = i + 1; j < visCount; j++) {
        if (nodes[i].cluster !== nodes[j].cluster) continue;
        const dx = (nodes[i].x - nodes[j].x) * W, dy = (nodes[i].y - nodes[j].y) * H;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110 && prog > 0.2) {
          c.ctx.beginPath();
          c.ctx.moveTo(nodes[i].x * W, nodes[i].y * H);
          c.ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
          c.ctx.strokeStyle = `rgba(${nodes[i].color},${0.25 * (1 - d / 110)})`;
          c.ctx.lineWidth = 0.8;
          c.ctx.stroke();
        }
      }
    }

    // nodes
    for (let i = 0; i < visCount; i++) {
      const n = nodes[i];
      n.x += n.vx * 0.0006;
      n.y += n.vy * 0.0006;
      n.x = clamp(n.x, 0.03, 0.97);
      n.y = clamp(n.y, 0.03, 0.97);
      if (n.x <= 0.03 || n.x >= 0.97) n.vx *= -1;
      if (n.y <= 0.03 || n.y >= 0.97) n.vy *= -1;

      c.ctx.beginPath();
      c.ctx.arc(n.x * W, n.y * H, n.r, 0, Math.PI * 2);
      c.ctx.fillStyle = `rgba(${n.color},0.75)`;
      c.ctx.fill();
    }

    requestAnimationFrame(draw);
  }
})();

// ─── PATTERN CANVASES ─────────────────────────────────────────────────────────
function patternClusters(canvas) {
  const c = initCanvas(canvas);
  if (!c) return;
  const groups = [[0.28, 0.38], [0.62, 0.28], [0.55, 0.68]];
  const pts = [];
  groups.forEach(([gx, gy]) => {
    for (let i = 0; i < 8; i++) pts.push({ x: gx + rand(-0.12, 0.12), y: gy + rand(-0.12, 0.12), gx, gy });
  });
  function draw() {
    const W = c.w(), H = c.h();
    c.ctx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      p.x += (p.gx - p.x) * 0.004 + rand(-0.002, 0.002);
      p.y += (p.gy - p.y) * 0.004 + rand(-0.002, 0.002);
    });
    pts.forEach((a, i) => pts.forEach((b, j) => {
      if (j <= i || a.gx !== b.gx) return;
      const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 90) {
        c.ctx.beginPath(); c.ctx.moveTo(a.x * W, a.y * H); c.ctx.lineTo(b.x * W, b.y * H);
        c.ctx.strokeStyle = `rgba(140,190,240,${0.3 * (1 - d / 90)})`; c.ctx.lineWidth = 1; c.ctx.stroke();
      }
    }));
    pts.forEach(p => {
      c.ctx.beginPath(); c.ctx.arc(p.x * W, p.y * H, 4, 0, Math.PI * 2);
      c.ctx.fillStyle = 'rgba(160,205,245,0.85)'; c.ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

function patternCorridors(canvas) {
  const c = initCanvas(canvas);
  if (!c) return;
  const routes = [
    [[0.15, 0.20], [0.45, 0.35], [0.78, 0.22]],
    [[0.12, 0.55], [0.40, 0.50], [0.70, 0.65]],
    [[0.22, 0.80], [0.50, 0.70], [0.82, 0.78]],
  ];
  const dots = routes.flatMap(r => [{ route: r, t: rand(0, 1) }, { route: r, t: rand(0, 1) }]);
  function ptOnRoute(route, t) {
    const seg = Math.min(Math.floor(t * (route.length - 1)), route.length - 2);
    const lt = t * (route.length - 1) - seg;
    return [lerp(route[seg][0], route[seg + 1][0], lt), lerp(route[seg][1], route[seg + 1][1], lt)];
  }
  function draw() {
    const W = c.w(), H = c.h();
    c.ctx.clearRect(0, 0, W, H);
    routes.forEach(r => {
      c.ctx.beginPath(); c.ctx.moveTo(r[0][0] * W, r[0][1] * H);
      r.slice(1).forEach(p => c.ctx.lineTo(p[0] * W, p[1] * H));
      c.ctx.strokeStyle = 'rgba(100,160,220,0.2)'; c.ctx.lineWidth = 8; c.ctx.stroke();
      c.ctx.strokeStyle = 'rgba(140,190,240,0.5)'; c.ctx.lineWidth = 1.5; c.ctx.stroke();
    });
    dots.forEach(d => {
      d.t = (d.t + 0.002) % 1;
      const [px, py] = ptOnRoute(d.route, d.t);
      c.ctx.beginPath(); c.ctx.arc(px * W, py * H, 3.5, 0, Math.PI * 2);
      c.ctx.fillStyle = 'rgba(200,225,255,0.9)'; c.ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

function patternDensity(canvas) {
  const c = initCanvas(canvas);
  if (!c) return;
  const hotspots = [[0.30, 0.35, 0.12], [0.65, 0.60, 0.10], [0.20, 0.70, 0.08]];
  const pts = [];
  for (let i = 0; i < 50; i++) {
    const hs = hotspots[Math.floor(rand(0, hotspots.length))];
    pts.push({ x: hs[0] + rand(-hs[2], hs[2]) * 3, y: hs[1] + rand(-hs[2], hs[2]) * 3, tx: hs[0] + rand(-hs[2], hs[2]), ty: hs[1] + rand(-hs[2], hs[2]) });
  }
  let frame = 0;
  function draw() {
    frame++;
    const W = c.w(), H = c.h();
    c.ctx.clearRect(0, 0, W, H);
    hotspots.forEach(([hx, hy, hr]) => {
      const grd = c.ctx.createRadialGradient(hx * W, hy * H, 0, hx * W, hy * H, hr * W * 2.5);
      grd.addColorStop(0, 'rgba(100,170,240,0.22)');
      grd.addColorStop(1, 'rgba(100,170,240,0)');
      c.ctx.beginPath(); c.ctx.arc(hx * W, hy * H, hr * W * 2.5, 0, Math.PI * 2);
      c.ctx.fillStyle = grd; c.ctx.fill();
    });
    pts.forEach(p => {
      p.x += (p.tx - p.x) * 0.008;
      p.y += (p.ty - p.y) * 0.008;
      c.ctx.beginPath(); c.ctx.arc(p.x * W, p.y * H, 2.5, 0, Math.PI * 2);
      c.ctx.fillStyle = 'rgba(180,215,255,0.7)'; c.ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// Observe patterns and init
['pattern-01', 'pattern-02', 'pattern-03'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) el.classList.add('revealed');
    });
  }, { threshold: 0.15 });
  obs.observe(el);
});

patternClusters($('pattern-01-canvas'));
patternCorridors($('pattern-02-canvas'));
patternDensity($('pattern-03-canvas'));

// ─── CAMPUS SVG HEATMAP ───────────────────────────────────────────────────────
(function campusHeatmap() {
  const svg = $('campus-map');
  if (!svg) return;

  const W = 800, H = 500;
  const zones = [
    { id: 'library', x: 60, y: 40, w: 180, h: 130, label: 'Library', heat: 0 },
    { id: 'cafeteria', x: 500, y: 300, w: 220, h: 150, label: 'Cafeteria', heat: 0 },
    { id: 'classrooms', x: 280, y: 100, w: 240, h: 200, label: 'Classrooms', heat: 0 },
    { id: 'studentcenter', x: 60, y: 300, w: 190, h: 160, label: 'Student Center', heat: 0 },
    { id: 'common', x: 340, y: 340, w: 140, h: 130, label: 'Common Space', heat: 0 },
  ];

  // paths between zones
  const corridors = [
    [230, 105, 290, 140], [150, 170, 150, 300], [260, 200, 340, 280],
    [520, 200, 520, 300], [490, 200, 400, 180], [350, 340, 340, 300]
  ];

  // build SVG
  let inner = `<defs>
    ${zones.map(z => `<radialGradient id="heat-${z.id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4a90c0" stop-opacity="0"/>
      <stop offset="100%" stop-color="#4a90c0" stop-opacity="0"/>
    </radialGradient>`).join('')}
  </defs>`;

  // corridor lines
  corridors.forEach(([x1, y1, x2, y2], i) => {
    inner += `<line class="corridor-line" data-idx="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      stroke="rgba(100,160,220,0.12)" stroke-width="6" stroke-linecap="round"/>`;
  });

  // zone rects
  zones.forEach(z => {
    inner += `<rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}"
      rx="6" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}"
      rx="6" fill="url(#heat-${z.id})" class="heat-overlay" data-zone="${z.id}"/>
    <text x="${z.x + z.w / 2}" y="${z.y + z.h / 2}" text-anchor="middle"
      font-family="Space Mono,monospace" font-size="9" fill="rgba(255,255,255,0.3)"
      letter-spacing="1.5" text-transform="uppercase">${z.label.toUpperCase()}</text>`;
  });

  // dot container
  inner += `<g id="heatmap-dots"></g>`;
  svg.innerHTML = inner;

  const section = document.getElementById('heatmap');
  if (!section) return;

  const dotsG = $('heatmap-dots');
  const heatOverlays = svg.querySelectorAll('.heat-overlay');
  const corridorLines = svg.querySelectorAll('.corridor-line');
  let lastProg = -1;

  function update() {
    const prog = sectionProgress(section);
    if (Math.abs(prog - lastProg) < 0.005) { requestAnimationFrame(update); return; }
    lastProg = prog;

    // fade corridors
    corridorLines.forEach((l, i) => {
      const a = clamp((prog - i * 0.04) * 4, 0, 1);
      l.setAttribute('stroke', `rgba(100,160,220,${a * 0.35})`);
      l.setAttribute('stroke-width', 4 + a * 6);
    });

    // heat overlays
    zones.forEach((z, zi) => {
      const heat = clamp((prog - zi * 0.08) * 2.5, 0, 1);
      const stop0 = svg.querySelector(`#heat-${z.id} stop:first-child`);
      const stop1 = svg.querySelector(`#heat-${z.id} stop:last-child`);
      if (stop0) stop0.setAttribute('stop-opacity', heat * 0.4);
      if (stop1) stop1.setAttribute('stop-opacity', '0');
    });

    // dots
    const dotCount = Math.round(prog * 30);
    while (dotsG.childElementCount < dotCount) {
      const z = zones[Math.floor(rand(0, zones.length))];
      const cx = z.x + rand(10, z.w - 10), cy = z.y + rand(10, z.h - 10);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
      circle.setAttribute('r', rand(2, 4));
      circle.setAttribute('fill', 'rgba(180,220,255,0.7)');
      dotsG.appendChild(circle);
    }

    requestAnimationFrame(update);
  }
  update();
})();

// ─── CONNECTION CANVAS ───────────────────────────────────────────────────────
(function connectionSection() {
  const section = document.getElementById('connection');
  if (!section) return;
  const c = initCanvas($('connection-canvas'));
  const msgs = section.querySelectorAll('.conn-msg');

  const nodes = [];
  let activeNodes = 2;

  // seed 2 nodes
  for (let i = 0; i < 30; i++) {
    nodes.push({
      x: rand(0.1, 0.9), y: rand(0.1, 0.9),
      vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4),
      r: rand(3, 6), visible: i < 2
    });
  }

  function draw() {
    const prog = sectionProgress(section);
    const step = clamp(Math.floor(prog * 4), 0, 3);

    msgs.forEach((m, i) => m.classList.toggle('active', i === step));

    const target = step === 0 ? 2 : step === 1 ? 6 : step === 2 ? 14 : 28;
    activeNodes = Math.min(target, nodes.length);

    if (c) {
      const W = c.w(), H = c.h();
      c.ctx.clearRect(0, 0, W, H);

      // edges
      for (let i = 0; i < activeNodes; i++) {
        for (let j = i + 1; j < activeNodes; j++) {
          const dx = (nodes[i].x - nodes[j].x) * W, dy = (nodes[i].y - nodes[j].y) * H;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) {
            c.ctx.beginPath();
            c.ctx.moveTo(nodes[i].x * W, nodes[i].y * H);
            c.ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
            c.ctx.strokeStyle = `rgba(120,180,240,${0.35 * (1 - d / 160)})`;
            c.ctx.lineWidth = 1;
            c.ctx.stroke();
          }
        }
      }

      // nodes
      for (let i = 0; i < activeNodes; i++) {
        const n = nodes[i];
        n.x = clamp(n.x + n.vx * 0.001, 0.05, 0.95);
        n.y = clamp(n.y + n.vy * 0.001, 0.05, 0.95);
        if (n.x <= 0.05 || n.x >= 0.95) n.vx *= -1;
        if (n.y <= 0.05 || n.y >= 0.95) n.vy *= -1;

        c.ctx.beginPath();
        c.ctx.arc(n.x * W, n.y * H, n.r, 0, Math.PI * 2);
        c.ctx.fillStyle = 'rgba(160,205,245,0.85)';
        c.ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
})();

// ─── PIPELINE REVEAL ─────────────────────────────────────────────────────────
(function pipelineReveal() {
  const stages = document.querySelectorAll('.pipeline-stage');
  const arrows = document.querySelectorAll('.pipeline-arrow');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const i = +e.target.dataset.pipelineStage;
        setTimeout(() => e.target.classList.add('revealed'), i * 180);
        arrows.forEach((a, ai) => setTimeout(() => a.classList.add('revealed'), 180 + ai * 180));
      }
    });
  }, { threshold: 0.2 });

  stages.forEach(s => obs.observe(s));

  // mini pipe canvases
  function drawDots(canvas, mode) {
    const c = initCanvas(canvas);
    if (!c) return;
    const pts = [];
    for (let i = 0; i < 20; i++) pts.push({ x: rand(0.05, 0.95), y: rand(0.05, 0.95), vx: rand(-0.5, 0.5), vy: rand(-0.5, 0.5) });
    function draw() {
      const W = c.w(), H = c.h();
      c.ctx.clearRect(0, 0, W, H);
      if (mode === 1) { // pattern lines
        for (let i = 0; i < pts.length; i++) {
          const j = (i + 1) % pts.length;
          const dx = (pts[i].x - pts[j].x) * W, dy = (pts[i].y - pts[j].y) * H;
          if (Math.sqrt(dx * dx + dy * dy) < 80) {
            c.ctx.beginPath(); c.ctx.moveTo(pts[i].x * W, pts[i].y * H); c.ctx.lineTo(pts[j].x * W, pts[j].y * H);
            c.ctx.strokeStyle = 'rgba(120,180,220,0.3)'; c.ctx.lineWidth = 1; c.ctx.stroke();
          }
        }
      }
      if (mode === 2) { // insight clusters glow
        c.ctx.beginPath(); c.ctx.arc(W * 0.5, H * 0.5, Math.min(W, H) * 0.3, 0, Math.PI * 2);
        c.ctx.fillStyle = 'rgba(80,150,220,0.08)'; c.ctx.fill();
      }
      pts.forEach(p => {
        p.x = clamp(p.x + p.vx * 0.001, 0.05, 0.95); p.y = clamp(p.y + p.vy * 0.001, 0.05, 0.95);
        if (p.x <= 0.05 || p.x >= 0.95) p.vx *= -1;
        if (p.y <= 0.05 || p.y >= 0.95) p.vy *= -1;
        c.ctx.beginPath(); c.ctx.arc(p.x * W, p.y * H, 2.5, 0, Math.PI * 2);
        c.ctx.fillStyle = mode === 2 ? 'rgba(180,220,255,0.9)' : 'rgba(160,200,240,0.7)'; c.ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  drawDots($('pipe-canvas-0'), 0);
  drawDots($('pipe-canvas-1'), 1);
  drawDots($('pipe-canvas-2'), 2);
})();

// ─── INSIGHTS REVEAL ─────────────────────────────────────────────────────────
(function insightsReveal() {
  const cards = document.querySelectorAll('.insight-card');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const i = +e.target.dataset.insight;
        setTimeout(() => e.target.classList.add('revealed'), i * 120);
      }
    });
  }, { threshold: 0.15 });
  cards.forEach(c => obs.observe(c));
})();

// ─── FINAL CANVAS ─────────────────────────────────────────────────────────────
(function finalCanvas() {
  const c = initCanvas($('final-canvas'));
  if (!c) return;
  const N = 50;
  const nodes = [];
  for (let i = 0; i < N; i++) {
    nodes.push({ x: rand(0.1, 0.9), y: rand(0.1, 0.9), vx: rand(-0.3, 0.3), vy: rand(-0.3, 0.3), r: rand(2, 5) });
  }
  function draw() {
    const W = c.w(), H = c.h();
    c.ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = (nodes[i].x - nodes[j].x) * W, dy = (nodes[i].y - nodes[j].y) * H;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          c.ctx.beginPath(); c.ctx.moveTo(nodes[i].x * W, nodes[i].y * H); c.ctx.lineTo(nodes[j].x * W, nodes[j].y * H);
          c.ctx.strokeStyle = `rgba(100,160,220,${0.2 * (1 - d / 130)})`; c.ctx.lineWidth = 0.8; c.ctx.stroke();
        }
      }
    }
    nodes.forEach(n => {
      n.x = clamp(n.x + n.vx * 0.0007, 0.03, 0.97); n.y = clamp(n.y + n.vy * 0.0007, 0.03, 0.97);
      if (n.x <= 0.03 || n.x >= 0.97) n.vx *= -1;
      if (n.y <= 0.03 || n.y >= 0.97) n.vy *= -1;
      c.ctx.beginPath(); c.ctx.arc(n.x * W, n.y * H, n.r, 0, Math.PI * 2);
      c.ctx.fillStyle = 'rgba(140,190,235,0.6)'; c.ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ─── REDUCED MOTION FALLBACK ──────────────────────────────────────────────────
if (reduced) {
  document.querySelectorAll('.transform-stage').forEach(s => {
    s.classList.add('active');
    s.style.opacity = '1';
    s.style.transform = 'none';
  });
  document.querySelectorAll('.story-sentence').forEach(s => { s.style.opacity = '1'; s.style.transform = 'none'; });
  document.querySelectorAll('.inv-step').forEach(s => { s.classList.add('active'); });
  document.querySelectorAll('.pattern-block, .pipeline-stage, .insight-card').forEach(el => {
    el.classList.add('revealed');
  });
}
