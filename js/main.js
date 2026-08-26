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
/* low-RAM phones (≤4GB): skip GPU-hungry effects so scrolling stays smooth */
const lowRamDevice = (navigator.deviceMemory || 8) <= 4;

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
if (canvas && !reduced && !lowRamDevice && typeof canvas.getContext === 'function') {
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
      const n = lowRamDevice ? 14 : coarsePointer
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

  /* ---------------- Map (Google Maps iframe) — lazy buttons ---------------- */
  const mapFrame = document.getElementById('map-frame');

  /* Map buttons for Google Maps iframe */
  function loadMapAt(lat, lng, zoom) {
    var frame = document.getElementById('map-frame');
    if (!frame) return;
    frame.src = 'https://maps.google.com/maps?q=' + lat + ',' + lng + '&t=&z=' + (zoom || 15) + '&ie=UTF8&iwloc=&output=embed';
  }

  var locateBtn = document.getElementById('locate-btn');
  if (locateBtn) {
    locateBtn.addEventListener('click', function () {
      if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
      locateBtn.textContent = '⏳';
      navigator.geolocation.getCurrentPosition(function (pos) {
        loadMapAt(pos.coords.latitude, pos.coords.longitude, 16);
        locateBtn.textContent = '📍';
      }, function () {
        alert('Location access denied.');
        locateBtn.textContent = '📍';
      }, { enableHighAccuracy: true, timeout: 8000 });
    });
  }

  var homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', function () {
      loadMapAt(28.0553, 82.4947, 15);
    });
  }

  /* ---------------- Fullscreen screenshot viewer ---------------- */
  const lb = document.getElementById('lightbox');
  if (lb) {
    const lbImg = $('.lb-img', lb);
    let lbOpen = false;

    function openLb(src, alt) {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lbImg.style.width = '';
      lbImg.style.maxWidth = '';
      lbImg.style.maxHeight = '';
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
      const zoomed = lb.classList.toggle('zoomed');
      if (zoomed && lbImg.naturalWidth) {
        // size the element at real pixels (browser resamples from the
        // original bitmap — stays sharp) instead of transform-scaling
        const s = 1.9;
        lbImg.style.maxWidth = 'none';
        lbImg.style.maxHeight = 'none';
        lbImg.style.width = Math.round(lbImg.naturalWidth * s) + 'px';
      } else {
        lbImg.style.width = '';
        lbImg.style.maxWidth = '';
        lbImg.style.maxHeight = '';
        lb.scrollTo(0, 0);
      }
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  }

  /* ---- Visitor Counter (Cloudflare KV-backed) ---- */
  (function() {
    var vc = $('#vcCount');
    if (!vc) return;
    fetch('/api/counter')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.count > 0) {
          vc.textContent = d.count.toLocaleString();
        } else {
          vc.textContent = '1';
        }
      })
      .catch(function() { vc.textContent = '—'; });
  })();

  /* ---- Scroll Progress Bar ---- */
  var progressBar = $('#scrollProgress');
  if (progressBar) {
    window.addEventListener('scroll', function() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var pct = h > 0 ? (window.scrollY / h) * 100 : 0;
      progressBar.style.width = pct + '%';
    }, { passive: true });
  }

  /* ---- Back to Top ---- */
  var btt = $('#backToTop');
  if (btt) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 400) btt.classList.add('visible');
      else btt.classList.remove('visible');
    }, { passive: true });
    btt.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Keyboard Shortcut: T toggles theme ---- */
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 't' || e.key === 'T') {
      if (themeBtn) themeBtn.click();
    }
  });

  /* ---- Dark / Light Mode ---- */
  var savedTheme = localStorage.getItem('theme') || 'dark';
  if (savedTheme === 'light') document.body.classList.add('light');
  var themeBtn = $('#themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function() {
      document.body.classList.toggle('light');
      localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
    });
  }

  /* ---- 3D Tilt on Project Cards ---- */
  if (window.matchMedia('(pointer: fine)').matches) {
    var tiltCards = $$('.project-card');
    tiltCards.forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          'perspective(800px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) scale(1.02)';
        card.style.boxShadow =
          (-x * 20) + 'px ' + (y * 20) + 'px 40px rgba(139,92,246,0.15)';
      });
      card.addEventListener('mouseleave', function() {
        card.style.transform = '';
        card.style.boxShadow = '';
      });
    });
  }

  /* ---- Download Stats ---- */
  function loadDownloadStats() {
    var dlEl = $('#dlDownloads');
    var tvEl = $('#tvDownloads');
    if (dlEl) dlEl.textContent = '10';
    if (tvEl) tvEl.textContent = '5';
  }
  var dlSection = $('#dlGrid');
  if (dlSection) {
    if ('IntersectionObserver' in window) {
      var dlObs = new IntersectionObserver(function(entries) {
        if (entries.some(function(e) { return e.isIntersecting; })) {
          dlObs.disconnect();
          loadDownloadStats();
        }
      }, { rootMargin: '400px 0px' });
      dlObs.observe(dlSection);
    } else {
      loadDownloadStats();
    }
  }

  /* ---- Live Service Status ---- */
  var SERVICES = [
    { name: 'RKO Downloader', url: 'https://rko-downloader.pages.dev/' },
    { name: 'RKO TV', url: 'https://tv-97x.pages.dev/' },
    { name: 'WWE Highlights', url: 'https://wwe-web.hightlights.workers.dev/' },
    { name: 'WWE Highlights API', url: 'https://wwe.hightlights.workers.dev/' }
  ];

  function loadServiceStatus() {
    var grid = $('#statusGrid');
    if (!grid) return;

    grid.innerHTML = SERVICES.map(function(s) {
      return '<div class="status-card glass">' +
        '<span class="status-dot checking" id="dot-' + s.name.replace(/\s/g,'') + '"></span>' +
        '<span class="status-name">' + s.name + '</span>' +
        '<span class="status-label checking" id="lbl-' + s.name.replace(/\s/g,'') + '">Checking...</span>' +
        '</div>';
    }).join('');

    SERVICES.forEach(function(s) {
      var id = s.name.replace(/\s/g,'');
      var dot = $('#dot-' + id);
      var lbl = $('#lbl-' + id);
      var ctrl = 'no-cors';
      fetch(s.url, { method: 'HEAD', mode: ctrl, cache: 'no-store' })
        .then(function() {
          if (dot) { dot.className = 'status-dot up'; }
          if (lbl) { lbl.className = 'status-label up'; lbl.textContent = 'Online'; }
        })
        .catch(function() {
          if (dot) { dot.className = 'status-dot down'; }
          if (lbl) { lbl.className = 'status-label down'; lbl.textContent = 'Offline'; }
        });
    });
  }

  var statusGrid = $('#statusGrid');
  if (statusGrid) {
    if ('IntersectionObserver' in window) {
      var sObs = new IntersectionObserver(function(entries) {
        if (entries.some(function(e) { return e.isIntersecting; })) {
          sObs.disconnect();
          loadServiceStatus();
        }
      }, { rootMargin: '400px 0px' });
      sObs.observe(statusGrid);
    } else {
      loadServiceStatus();
    }
  }

  /* ============================================================
     FEATURE 1: Enhanced Timeline — line draw + dot pulse + card slide
     ============================================================ */
  if ('IntersectionObserver' in window) {
    var timeline = document.querySelector('.timeline');
    if (timeline) {
      var tlObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(en) {
          if (en.isIntersecting) {
            en.target.classList.add('in-view');
            tlObs.unobserve(en.target);
          }
        });
      }, { threshold: 0.15 });
      tlObs.observe(timeline);
    }
  }

  /* ============================================================
     FEATURE 2: Skills enhanced counters (already works via skill bars)
     ============================================================ */
  /* Skill bars already animate on scroll via existing code above.
     Adding glow class to active skill categories. */
  $$('.skill-cat').forEach(function(cat) {
    if ('IntersectionObserver' in window) {
      var skObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(en) {
          if (en.isIntersecting) {
            en.target.classList.add('in-view');
            skObs.unobserve(en.target);
          }
        });
      }, { threshold: 0.35 });
      skObs.observe(cat);
    }
  });

  /* ============================================================
     FEATURE 3: Easter Egg — Konami Code
     ============================================================ */
  (function() {
    var konamiCode = [38,38,40,40,37,39,37,39,66,65];
    var konamiIndex = 0;
    var eeActive = false;

    document.addEventListener('keydown', function(e) {
      if (eeActive) return;
      if (e.keyCode === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          konamiIndex = 0;
          showEasterEgg();
        }
      } else {
        konamiIndex = 0;
      }
    });

    function showEasterEgg() {
      eeActive = true;
      var overlay = document.createElement('div');
      overlay.className = 'easter-egg-overlay';
      overlay.innerHTML = '<div style="text-align:center"><div class="ee-text">RKO BRO</div><div class="ee-sub">You found the secret! 🎉<br><small>↑ ↑ ↓ ↓ ← → ← → B A</small></div></div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function() {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.4s ease';
        setTimeout(function() { overlay.remove(); eeActive = false; }, 400);
      });
      setTimeout(function() {
        if (overlay.parentNode) {
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 0.4s ease';
          setTimeout(function() { overlay.remove(); eeActive = false; }, 400);
        }
      }, 6000);
    }
  })();

  /* ============================================================
     FEATURE 4: 3D Particle Text — "RKO BRO" floating particles
     ============================================================ */
  (function() {
    var ptCanvas = document.getElementById('particleText');
    if (!ptCanvas || reduced || lowRamDevice) return;
    var ctx = ptCanvas.getContext('2d');
    if (!ctx) return;

    var particles = [];
    var textCoords = [];
    var W, H;
    var mousePt = { x: -9999, y: -9999 };

    function resizePT() {
      var hero = document.getElementById('home');
      if (!hero) return;
      W = hero.offsetWidth;
      H = hero.offsetHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      ptCanvas.width = W * dpr;
      ptCanvas.height = H * dpr;
      ptCanvas.style.width = W + 'px';
      ptCanvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      generateTextCoords();
      initParticles();
    }

    function generateTextCoords() {
      textCoords = [];
      var offCanvas = document.createElement('canvas');
      offCanvas.width = W;
      offCanvas.height = H;
      var offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      var fontSize = Math.min(Math.floor(W / 7), 120);
      offCtx.font = '800 ' + fontSize + 'px Sora, sans-serif';
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillStyle = '#fff';
      offCtx.fillText('RKO BRO', W / 2, H / 2);

      var data = offCtx.getImageData(0, 0, W, H).data;
      var gap = Math.max(3, Math.floor(fontSize / 18));
      for (var y = 0; y < H; y += gap) {
        for (var x = 0; x < W; x += gap) {
          var i = (y * W + x) * 4;
          if (data[i + 3] > 128) {
            textCoords.push({ x: x, y: y });
          }
        }
      }
    }

    function initParticles() {
      particles = [];
      var count = Math.min(textCoords.length, coarsePointer ? 300 : 600);
      for (var i = 0; i < count; i++) {
        var tc = textCoords[i];
        if (!tc) continue;
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          tx: tc.x,
          ty: tc.y,
          vx: 0,
          vy: 0,
          r: Math.random() * 1.5 + 0.8,
          c: ['139,92,246', '59,130,246', '6,182,212', '200,94,255'][Math.floor(Math.random() * 4)],
          a: Math.random() * 0.5 + 0.4
        });
      }
    }

    function stepPT() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var dx = mousePt.x - p.x;
        var dy = mousePt.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var mouseR = 100;
        if (dist < mouseR && dist > 0) {
          var force = (mouseR - dist) / mouseR * 2;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
        }
        p.vx += (p.tx - p.x) * 0.04;
        p.vy += (p.ty - p.y) * 0.04;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')';
        ctx.fill();
      }
      if (!document.hidden) requestAnimationFrame(stepPT);
    }

    if ('IntersectionObserver' in window) {
      var heroObs = new IntersectionObserver(function(entries) {
        if (entries[0] && entries[0].isIntersecting) {
          resizePT();
          stepPT();
        }
      }, { threshold: 0.1 });
      var heroEl = document.getElementById('home');
      if (heroEl) heroObs.observe(heroEl);
    } else {
      resizePT();
      stepPT();
    }

    window.addEventListener('resize', function() { resizePT(); });
    document.addEventListener('mousemove', function(e) {
      var heroEl = document.getElementById('home');
      if (!heroEl) return;
      var r = heroEl.getBoundingClientRect();
      mousePt.x = e.clientX - r.left;
      mousePt.y = e.clientY - r.top;
    });
  })();

  /* ============================================================
     FEATURE 5: Page Transition — fade sections on scroll
     ============================================================ */
  if ('IntersectionObserver' in window && !reduced) {
    var fadeSections = $$('main section[id]');
    var fadeObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(en) {
        if (en.isIntersecting) {
          en.target.classList.add('fade-in');
          en.target.classList.remove('fade-out');
        } else {
          if (en.target.classList.contains('fade-in')) {
            en.target.classList.add('fade-out');
            en.target.classList.remove('fade-in');
          }
        }
      });
    }, { threshold: 0.05, rootMargin: '-10% 0px' });
    fadeSections.forEach(function(s) { fadeObs.observe(s); });
  }

  /* ============================================================
     FEATURE 6: Chatbot Widget — Pre-programmed Q&A
     ============================================================ */
  (function() {
    var wrap = document.getElementById('chatbotWrap');
    var toggle = document.getElementById('chatbotToggle');
    var panel = document.getElementById('chatbotPanel');
    var close = document.getElementById('chatbotClose');
    var messages = document.getElementById('chatMessages');
    var form = document.getElementById('chatForm');
    var input = document.getElementById('chatInput');
    var suggestions = document.getElementById('chatSuggestions');
    if (!wrap || !toggle || !panel) return;

    toggle.addEventListener('click', function() {
      wrap.classList.toggle('open');
      if (wrap.classList.contains('open') && input) {
        setTimeout(function() { input.focus(); }, 350);
      }
    });
    close.addEventListener('click', function() { wrap.classList.remove('open'); });

    /* Suggestion buttons */
    suggestions.addEventListener('click', function(e) {
      var btn = e.target.closest('.chat-sug');
      if (!btn) return;
      var q = btn.getAttribute('data-q');
      if (q) { handleChat(q); input.value = ''; }
    });

    /* Form submit */
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      handleChat(q);
      input.value = '';
    });

    function addMsg(text, isUser) {
      var div = document.createElement('div');
      div.className = 'chat-msg ' + (isUser ? 'user' : 'bot');
      div.innerHTML = '<p>' + text + '</p>';
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function handleChat(q) {
      addMsg(q, true);
      var lower = q.toLowerCase();
      var reply = getReply(lower);
      setTimeout(function() { addMsg(reply, false); }, 400 + Math.random() * 400);
    }

    function getReply(q) {
      /* Nepali jokes — TOP priority */
      if (/\bjoke[s]?\b|\bhasauna\b|\bhaso\b|\bfunny\b|\bmazak\b|\bhasawle\b|\brofl\b|\blol\b|\blmao\b/.test(q)) {
        var jokes = [
          'Programmer le bhanya "Mero code ma bug chhaina!" Tester le bhanya "Bug hoina, yeutai extra feature ho!" 😂',
          'Why do programmers prefer dark mode? Because light attracts bugs! 🐛😄',
          'Ek programmer ko bihe bhayo. Khasma usle return gareko thiyo "true"! 💍😂',
          'WiFi nabhaye programmer: "Ma offline chu, ma sunnai sakdina!" 📵😅',
          'Teacher: "Beta, 2+2 kitna hota hai?" Student: "Error 404: Math not found!" 😂',
          'Why do Java developers wear glasses? Because they cannot C#! 👓😂',
          'A programmer asked God: "Can you make the world run on JavaScript?" God: "Nah, I don\'t want to break everything." 😂',
          'Developer: "It works on my machine!" Manager: "Then we\'ll ship your machine!" 😂',
          'There are 10 types of people in the world: those who understand binary, and those who don\'t. 🤓',
          'SQL query walks into a bar, sees two tables and asks: "Can I JOIN you?" 🍺😂',
          'A HTML tag walks into a bar. Bartender: "What do you want?" Tag: "Div-er please!" 😂',
          'Recursion: The art of solving a problem by solving the same problem until you solve the problem. 🔄😅',
          'Why did the developer go broke? Because he used up all his cache! 💸😂',
          'A programmer\'s wife says: "Go to the store and buy a loaf of bread. If they have eggs, buy a dozen." He comes home with 12 loaves. 😂'
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
      }

      /* Status / Attitude / Mood */
      if (/\bstatus\b|\blife\b|\battitude\b|\bfeeling\b|\bmood\b|\bvibe\b|\benergy\b/.test(q)) {
        var statuses = [
          'Status: Coding mode ON, bugs mode OFF! Attitude: "Code hard, ship harder." 🚀',
          'Life motto: Dal Bhat + Clean Code = Perfect Day! 🍛💻',
          'Current mood: Grind Mode — debugging at 2 AM like a boss! 😎',
          'Attitude: I don\'t copy code, I write better code! 💪',
          'Status: Living the developer dream — one commit at a time! 🌟',
          'Aaja ko status: "Bugs mile toh maro, code chale toh paro!" 😂🔥',
          'Life update: Shipped a feature, broke another — perfectly balanced! ⚖️'
        ];
        return statuses[Math.floor(Math.random() * statuses.length)];
      }

      /* Poem / Kavita */
      if (/\bpoem\b|\bkavita\b|\bpoetry\b|\bgeet\b|\bsong\b|\blyric\b/.test(q)) {
        var poems = [
          'Code ko duniya ma, RKO BRO chha rajaa, UI ramro, API strong — sabai ko bau! 👑\n(Hindi/Nepali coder poem)',
          'Ek choti code ma, Bug aayo, dimag ma darr lageyo, Debug garey, fix garey, Phir se deploy garey — problem solved! 🎉',
          'Morning: Coffee ☕, Afternoon: Code 💻, Night: Debug 🔍, Repeat: Forever ♾️\n\n— A Developer\'s Haiku 🎋',
          'Screen ko ujyali ma, Keyboard ko dhun ma, RKO BRO le banayo, Digital sapana — technical gun! 🌟'
        ];
        return poems[Math.floor(Math.random() * poems.length)];
      }

      /* Fun / Random */
      if (/\bfun\b|\brandom\b|\bbored\b|\bboring\b|\btimepass\b|\bfursad\b/.test(q)) {
        var funs = [
          'Fun fact: Bananas are berries, but strawberries are not! 🍌🤯',
          'If programming was easy, everyone would do it — oh wait, they do! 😂',
          'RKO BRO fun fact: Can write 1000 lines of code but can\'t write a proper love letter! 💀😂',
          'Did you know? The first computer bug was an actual bug — a moth found in a Harvard computer! 🦗',
          'WiFi password? Password123! Just kidding, that\'s not the real one! 📵😄',
          'Developer\'s diet: 50% coffee, 30% pizza, 20% energy drinks! 🍕☕'
        ];
        return funs[Math.floor(Math.random() * funs.length)];
      }

      /* Greetings */
      if (/^(hi|hello|hey|namaste|hola|sup|yo)\b/.test(q)) {
        return 'Namaste! 🙏 Welcome to RKO BRO\'s portfolio. Ke help chha?';
      }

      /* Friendly auto-replies */
      if (/\bhow are you\b|\bkasto cha\b|\bksto cha\b|\bhow r u\b|\bhru\b|\bthik cha\b/.test(q)) {
        return 'Ma ekdam thik chu! 😄 Sabai badhiya chha. Tapai kasto hunuhuncha?';
      }
      if (/\bare you good\b|\bare u good\b|\bramro cha\b|\bramro chau\b/.test(q)) {
        return 'Haami ekdam ramro chhau! 💪 Coding chha, projects chha, sabai set chha.';
      }
      if (/\bhow was (your )?day\b|\baaja ko din\b|\bdin kasto\b/.test(q)) {
        return 'Aaja ko din ekdam productive thiyo! 💻 New features banayo, bugs fix garyo. Every day is a coding day!';
      }
      if (/\bgood morning\b|\bgood afternoon\b|\bgood evening\b|\bsubha prabhat\b/.test(q)) {
        return 'Good morning! ☀️ Aaja pani coding garna lai ready chu! K bhannu huncha?';
      }
      if (/\bthank\b|\bdhanyabad\b|\bthank you\b|\bthanks\b/.test(q)) {
        return 'Tapai lai dhanyabad! 🙏 Kati help bhayo bhane dherai khusi lagchha.';
      }

      /* Nepali casual */
      if (/\bkhana vayo\b|\bkhana khayo\b|\bbhoj\b|\bkhaana\b/.test(q)) {
        return 'Abhi khana vayo! 😋 Dal bhat power 24 hour! Tapai le khano bhayo?';
      }
      if (/\bumm\b|\bum\b|\bhmm\b|\bhmmmm\b|\buh\b/.test(q)) {
        return 'Umm... huncha huncha! 😄 Ke sochdai huncha? Bhanus, ma help garchu.';
      }
      if (/\bthik xa\b|\bthik chha\b|\bthik chha\b/.test(q)) {
        return 'Thik chha! ✅ Ramro chha. Aru ke chha?';
      }
      if (/\bk garirako\b|\bk gardai\b|\bwhat doing\b|\bbusy\b/.test(q)) {
        return 'Coding gardai chu! 💻 RKO Downloader ma naya feature add garna lageko. Busy life, happy life!';
      }
      if (/\byo man\b|\byooo\b|\bbro\b|\bdai\b|\bbhai\b/.test(q)) {
        return 'Yooo! 🤙 K cha bro? K kaam chha bhanus!';
      }
      if (/\bok\b|\bokay\b|\bokey\b/.test(q)) {
        return 'Thik chha! ✅ Ramro chha. Aru ke chha?';
      }
      if (/\blove\b|\bpyar\b|\bmohabbat\b/.test(q)) {
        return 'Mero pyar? 💜 Clean code, beautiful UI, ra smooth animations! Bas yo nai enough chha life ma! 😄';
      }
      if (/\bsingle\b|\bcommitted\b|\brelationship\b/.test(q)) {
        return 'Committed chhu... coding sanga! 💻 Relationship status: "In a committed relationship with JavaScript." 😂';
      }

      /* Age */
      if (/\bage\b|\bkati barsha\b|\bumr\b|\bold\b|\byoung\b|\bkati janko\b/.test(q)) {
        return 'RKO BRO is <b>24 years old</b> young! 🔥 Still building, still learning, still shipping!';
      }
      /* Price / website */
      if (/\bprice\b|\brate\b|\bcost\b|\bcharge\b|\bmoney\b|\bwebsite\b|\bweb.*make\b|\bpaise\b|\bpaisa\b/.test(q)) {
        return '<b>Website Development Price:</b><br>💰 Basic Website: <b>1K–2K NPR</b><br>💰 Business/Dashboard: <b>2K+ NPR</b><br>Depends on features. Email <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a> for exact quote!';
      }
      /* WhatsApp */
      if (/\bwhatsapp\b|\bnumber\b|\bphone\b|\bcall\b|\bring\b/.test(q)) {
        return '<b>WhatsApp:</b> <a href="https://wa.me/9779810911473" target="_blank">+977 9810911473</a> 📱<br>Direct message garna saknu huncha! Ma reply garchu. 😊';
      }
      /* Photo */
      if (/\bphoto\b|\bpic\b|\bimage\b|\bchitra\b|\btasbir\b|\bface\b|\blook\b|\blogo\b/.test(q)) {
        return '<b>RKO BRO:</b><br>📸 <a href="https://rko-bro-website.pages.dev/assets/portrait.jpg" target="_blank">Click here to see RKO BRO\'s photo</a> 📷<br>Yeso nai ho — Nepal ko kunai corner bata code garne! 😎';
      }
      /* Who */
      if (/\bwho\b|\babout\b|\bintro\b|\byourself\b|\bname\b/.test(q)) {
        return 'I\'m <b>RKO BRO</b> (Himal Paudel) — 24, Full Stack Developer from Ghorahi, Dang, Nepal 🇳🇵. I build web apps, Android apps and streaming platforms. 🚀';
      }
      /* Skills */
      if (/\bskill\b|\btech\b|\bstack\b|\bknow\b|\blanguage\b|\btools\b/.test(q)) {
        return '<b>My Skills:</b><br>• Frontend: React, Next.js, Tailwind CSS, JavaScript<br>• Backend: Node.js, Express, MongoDB, Cloudflare Workers<br>• Mobile: Kotlin, Android, ExoPlayer, WebView<br>• Design: Figma, Prototyping, Motion Design';
      }
      /* Projects */
      if (/\bproject\b|\bwork\b|\bbuild\b|\bapp\b|\bproduct\b|\bmade\b/.test(q)) {
        return '<b>Featured Projects:</b><br>1. <a href="https://rko-downloader.pages.dev" target="_blank">RKO Downloader</a> — Video downloader (Android)<br>2. <a href="https://tv-97x.pages.dev" target="_blank">RKO TV</a> — Live sports streaming<br>3. Screen Mirror — Phone mirroring (coming soon)<br>4. WWE Highlights — Wrestling clips app';
      }
      /* Experience */
      if (/\bexperience\b|\bjob\b|\bcareer\b|\bjourney\b|\byear\b/.test(q)) {
        return '<b>My Journey:</b><br>• 2024–Present: Founder & Lead Developer — RKO Ecosystem<br>• 2023–2024: Full Stack Developer — Freelance (15+ projects)<br>• 2022–2023: Frontend Developer — Remote Contract<br>• 2021–2022: Self-Taught Web Development';
      }
      /* Contact */
      if (/\bcontact\b|\bemail\b|\breach\b|\bhire\b|\bmail\b|\bmessage\b/.test(q)) {
        return '<b>Contact me:</b><br>📧 <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a><br>📘 <a href="https://www.facebook.com/profile.php?id=61581151980604" target="_blank">Facebook</a><br>📸 <a href="https://www.instagram.com/himalpaudel_18" target="_blank">Instagram: himalpaudel_18</a><br>📱 WhatsApp: <a href="https://wa.me/9779810911473" target="_blank">+977 9810911473</a>';
      }
      /* Location */
      if (/\bwhere\b|\blocation\b|\blive\b|\bfrom\b|\bghorahi\b|\bdang\b|\bnepal\b/.test(q)) {
        return 'I\'m from <b>Ghorahi, Dang, Nepal</b> 🇳🇵 — a beautiful city in the mid-western region. Nepal bata nai code garchu!';
      }
      /* Education */
      if (/\beducation\b|\bstudy\b|\buniversity\b|\bcollege\b|\bschool\b|\bdegree\b/.test(q)) {
        return 'I\'m currently pursuing <b>Civil Engineering</b> while building products on the side. Self-taught in web & mobile development! Padhai pani, coding pani! 📚💻';
      }
      /* Availability */
      if (/\bavailable\b|\bhire\b|\bfreelance\b|\bopen\b|\bwork together\b/.test(q)) {
        return 'Yes! I\'m <b>open to work</b> and available for freelance projects. Let\'s build something amazing together! 💼 Email: <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a>';
      }
      /* Default */
      var defaults = [
        'Interesting question! 🤔 Ma bujhina ki k bhannu huncha. Try asking about skills, projects, jokes, status, poem, fun, contact, WhatsApp!',
        'Hmm, ma tyo bujhina! 😅 Try asking about my <b>projects</b>, <b>skills</b>, <b>jokes</b>, <b>status</b>, <b>poem</b>, or <b>WhatsApp</b> number!',
        'Ma chatbot ho, ma sabai bujhina! 😄 But I know about RKO BRO — try asking about <b>jokes</b>, <b>poem</b>, <b>status</b>, <b>fun</b>!',
        'Wah! Tyo chij ma chhodna sakdina! 😂 Ke asked garna milchha — skills, projects, price, WhatsApp, jokes, poem, fun!'
      ];
      return defaults[Math.floor(Math.random() * defaults.length)];
    }
  })();
})();
