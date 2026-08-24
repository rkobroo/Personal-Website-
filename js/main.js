/* ============================================================
   HIMAL PAUDEL — PORTFOLIO · interactions
   Particles · cursor glow · typing · reveals · counters
   skill bars · tilt · magnetic buttons · scrollspy · map
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  /* ---------------- Preloader ---------------- */
  const preloader = $('#preloader');
  if (preloader) {
    const barFill = $('.pre-bar i', preloader);
    const countEl = $('.pre-count', preloader);
    const DURATION = reduced ? 200 : 1100;
    let start = null;

    document.body.classList.add('loading');

    requestAnimationFrame(function tick(ts) {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / DURATION);
      const pct = Math.round(p * 100);
      if (barFill) barFill.style.width = pct + '%';
      if (countEl) countEl.textContent = pct + '%';
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          preloader.classList.add('done');
          document.body.classList.remove('loading');
        }, 220);
      }
    });
  }

  /* ---------------- Typing effect ---------------- */
  const typedEl = $('#typed');
  if (typedEl) {
    const roles = [
      'Full Stack Developer',
      'Problem Solver',
      'UI/UX Enthusiast',
      'Open Source Builder'
    ];
    if (reduced) {
      typedEl.textContent = roles[0];
    } else {
      let ri = 0, ci = 0, deleting = false;
      (function type() {
        const word = roles[ri];
        ci += deleting ? -1 : 1;
        typedEl.textContent = word.slice(0, ci);

        let delay = deleting ? 42 : 88;
        if (!deleting && ci === word.length) { delay = 1900; deleting = true; }
        else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 380; }
        setTimeout(type, delay);
      })();
    }
  }

  /* ---------------- Particle field ---------------- */
  const canvas = $('#particles');
  if (canvas && !reduced && typeof canvas.getContext === 'function') {
    const ctx = canvas.getContext('2d');
    const COLORS = ['139,92,246', '59,130,246', '6,182,212'];
    const LINK_DIST = 130;
    const MOUSE_R = 170;

    let W = 0, H = 0, parts = [], running = true, rafId = null;
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.5 : 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      // fewer particles on touch devices — the link loop is O(n²)
      const n = coarsePointer
        ? Math.max(22, Math.min(40, Math.floor(W / 30)))
        : Math.max(34, Math.min(85, Math.floor(W / 17)));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.7,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        a: Math.random() * 0.4 + 0.25
      }));
    }

    function step() {
      ctx.clearRect(0, 0, W, H);

      for (const p of parts) {
        // gentle repel from cursor
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_R * MOUSE_R && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = ((MOUSE_R - d) / MOUSE_R) * 0.35;
          p.vx += (dx / d) * f * 0.08;
          p.vy += (dy / d) * f * 0.08;
        }
        p.vx *= 0.985; p.vy *= 0.985;
        // keep minimum drift
        if (Math.abs(p.vx) < 0.05) p.vx += (Math.random() - 0.5) * 0.02;
        if (Math.abs(p.vy) < 0.05) p.vy += (Math.random() - 0.5) * 0.02;

        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')';
        ctx.fill();
      }

      // skip the O(n²) link-drawing pass entirely on touch devices
      if (!coarsePointer) {
        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) {
            const a = parts[i], b = parts[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const d = Math.hypot(dx, dy);
            if (d < LINK_DIST) {
              const alpha = (1 - d / LINK_DIST) * 0.14;
              ctx.strokeStyle = 'rgba(' + a.c + ',' + alpha.toFixed(3) + ')';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }
      if (running) rafId = requestAnimationFrame(step);
    }

    resize();
    rafId = requestAnimationFrame(step);
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    function setRunning(on) {
      running = on;
      if (on && !rafId) rafId = requestAnimationFrame(step);
      if (!on && rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    document.addEventListener('visibilitychange', () =>
      setRunning(!document.hidden));

    // pause the whole field while the hero is off-screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        const en = entries[0];
        if (!en) return;
        setRunning(en.isIntersecting && !document.hidden);
      }, { threshold: 0 }).observe(canvas);
    }
  }

  /* ---------------- Cursor glow ---------------- */
  const glow = document.querySelector('.cursor-glow');
  if (glow && finePointer && !reduced) {
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const target = { x: pos.x, y: pos.y };
    let shown = false;

    window.addEventListener('mousemove', e => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!shown) { shown = true; glow.classList.add('on'); }
    });

    (function follow() {
      pos.x += (target.x - pos.x) * 0.11;
      pos.y += (target.y - pos.y) * 0.11;
      glow.style.transform = 'translate3d(' + (pos.x - 210) + 'px,' + (pos.y - 210) + 'px,0)';
      requestAnimationFrame(follow);
    })();
  }

  /* ---------------- Navbar ---------------- */
  const navbar = $('#navbar');
  const navLinksBox = $('#navLinks');
  const hamburger = $('#hamburger');
  const navAnchors = $$('#navLinks a:not(.btn)');
  const sections = $$('main section[id]');

  function onScrollNav() {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const open = navLinksBox.classList.toggle('open');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', String(open));
      hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    navAnchors.forEach(a => a.addEventListener('click', () => {
      navLinksBox.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }));
  }

  // Scrollspy
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const id = '#' + en.target.id;
        navAnchors.forEach(a =>
          a.classList.toggle('active', a.getAttribute('href') === id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  /* ---------------- Reveal on scroll ---------------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          ro.unobserve(en.target);
        }
      });
      // positive bottom margin pre-triggers below the viewport so fast
      // scrolling never shows blank text waiting to animate in
    }, { threshold: 0.05, rootMargin: '0px 0px 18% 0px' });
    revealEls.forEach(el => ro.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* ---------------- Counters ---------------- */
  const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

  function animateCount(el) {
    const end = parseFloat(el.dataset.count || '0');
    const dur = 1800;
    let t0 = null;
    function frame(ts) {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / dur);
      el.textContent = String(Math.round(easeOutQuart(p) * end));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const counters = $$('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const co = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          animateCount(en.target);
          co.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(c => co.observe(c));
  } else {
    counters.forEach(c => { c.textContent = c.dataset.count; });
  }

  /* ---------------- Skill bars ---------------- */
  $$('.skill-cat').forEach(cat => {
    const bars = $$('.bar i', cat);
    const pcts = $$('.skill-pct', cat);

    function fill() {
      bars.forEach(bar => { bar.style.width = (bar.dataset.w || 70) + '%'; });
      pcts.forEach(p => {
        const end = parseInt(p.dataset.val || '0', 10);
        let t0 = null;
        function frame(ts) {
          if (!t0) t0 = ts;
          const k = Math.min(1, (ts - t0) / 1300);
          p.textContent = Math.round(easeOutQuart(k) * end) + '%';
          if (k < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }

    if ('IntersectionObserver' in window) {
      const so = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) { fill(); so.disconnect(); }
        });
      }, { threshold: 0.35 });
      so.observe(cat);
    } else {
      fill();
    }
  });


  /* ---------------- 3D tilt cards ---------------- */
  if (finePointer && !reduced) {
    $$('[data-tilt]').forEach(el => {
      const MAX = 6;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transition = 'transform .12s ease';
        el.style.transform =
          'perspective(950px) rotateX(' + ((0.5 - py) * MAX).toFixed(2) + 'deg)' +
          ' rotateY(' + ((px - 0.5) * MAX).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transition = 'transform .5s cubic-bezier(0.22,1,0.36,1)';
        el.style.transform = '';
      });
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (finePointer && !reduced) {
    $$('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate(' + (x * 0.16).toFixed(1) + 'px,' + (y * 0.22).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------------- Back to top ---------------- */
  const toTop = $('#toTop');
  if (toTop) {
    window.addEventListener('scroll', () => {
      toTop.classList.toggle('show', window.scrollY > 620);
    }, { passive: true });
    toTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  }

  /* ---------------- Footer year ---------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------- Contact form ---------------- */
  const form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      let valid = true;

      $$('input, textarea', form).forEach(f => {
        const ok = f.checkValidity();
        f.classList.toggle('invalid', !ok);
        if (!ok && valid) { f.focus(); valid = false; }
      });

      const btn = $('#cf-submit');
      if (!valid || !btn || btn.classList.contains('sending')) return;

      // Real delivery via FormSubmit (AJAX endpoint, stays on page)
      const payload = Object.fromEntries(new FormData(form).entries());
      delete payload._honey; // honeypot: silently drop bots

      const label = $('.btn-label', btn);
      btn.classList.add('sending');
      label.textContent = 'Sending…';

      const done = () => {
        btn.classList.remove('sending');
        label.textContent = 'Send Message';
      };
      const fail = () => {
        done();
        alert('Could not send right now — please email rkobro112@gmail.com directly.');
      };

      fetch('https://formsubmit.co/ajax/rkobro112@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(r => r.json())
        .then(res => {
          if (res && res.success === 'true') {
            form.reset();
            const okMsg = $('#formSuccess');
            if (okMsg) {
              okMsg.classList.add('show');
              setTimeout(() => okMsg.classList.remove('show'), 6000);
            }
            done();
          } else {
            fail();
          }
        })
        .catch(fail);
    });

    $$('input, textarea', form).forEach(f =>
      f.addEventListener('input', () => f.classList.remove('invalid')));
  }

  /* ---------------- Leaflet map (Nepal) — lazy init ---------------- */
  const mapEl = document.getElementById('map');

  function initMap() {
    if (!mapEl || typeof window.L === 'undefined') return;
    try {
      const map = window.L.map(mapEl, {
        center: [28.08, 82.50],
        zoom: 10,
        scrollWheelZoom: false,
        attributionControl: true
      });

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      }).addTo(map);

      const icon = window.L.divIcon({
        className: 'map-pin',
        html: '<span class="pin-core"></span>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      window.L.marker([27.8697, 82.4897], { icon })
        .addTo(map)
        .bindPopup('<b>Dang, Nepal</b><br>RKO BRO — building from here.')
        .openPopup();

      map.on('click', () => map.scrollWheelZoom.enable());
      map.on('mouseout', () => map.scrollWheelZoom.disable());
    } catch (err) { /* map is decorative — fail silently */ }
  }

  /* ---------------- Fullscreen screenshot viewer ---------------- */
  const lb = document.getElementById('lightbox');
  if (lb) {
    const lbImg = $('.lb-img', lb);
    let lbOpen = false;

    function openLb(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lb.classList.add('open');
      lb.classList.remove('zoomed');
      lbOpen = true;
      document.body.style.overflow = 'hidden';
    }
    function closeLb() {
      if (!lbOpen) return;
      lb.classList.remove('open', 'zoomed');
      lbOpen = false;
      document.body.style.overflow = '';
    }

    $$('.project-shot').forEach(img =>
      img.addEventListener('click', () => openLb(img.src, img.alt)));

    $('.lb-close', lb).addEventListener('click', closeLb);
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    lbImg.addEventListener('click', () => {
      lb.classList.toggle('zoomed');
      if (!lb.classList.contains('zoomed')) lb.scrollTo(0, 0);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  }

  if (mapEl) {
    if ('IntersectionObserver' in window) {
      // don't pay the tile/JS cost until the contact section is near
      const mio = new IntersectionObserver(entries => {
        if (entries.some(en => en.isIntersecting)) {
          mio.disconnect();
          initMap();
        }
      }, { rootMargin: '400px 0px' });
      mio.observe(mapEl);
    } else {
      initMap();
    }
  }
})();
