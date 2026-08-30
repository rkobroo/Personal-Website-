/* ============================================================
   HIMAL PAUDEL â€” PORTFOLIO Â· interactions
   Particles Â· cursor glow Â· typing Â· reveals Â· counters
   skill bars Â· tilt Â· magnetic buttons Â· scrollspy Â· map
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
/* low-RAM phones (â‰¤4GB): skip GPU-hungry effects so scrolling stays smooth */
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
      // fewer particles on touch devices â€” the link loop is O(nÂ²)
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

      // skip the O(nÂ²) link-drawing pass entirely on touch devices
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

  /* ---- Single throttled scroll handler (replaces 4 separate listeners) ---- */
  let scrollTick = false;
  var progressBar = $('#scrollProgress');
  var toTop = $('#toTop');
  var scrollUpBtn = $('#scrollUp');
  var scrollDownBtn = $('#scrollDown');

  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      scrollTick = false;
      var sy = window.scrollY;

      /* navbar */
      navbar.classList.toggle('scrolled', sy > 40);

      /* back to top / scroll pill visibility */
      if (toTop) toTop.classList.toggle('show', sy > 620);
      if (scrollUpBtn) scrollUpBtn.classList.toggle('show', sy > 400);
      if (scrollDownBtn) {
        var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        scrollDownBtn.classList.toggle('show', sy < maxScroll - 200);
      }

      /* progress bar */
      if (progressBar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var pct = h > 0 ? sy / h : 0;
        progressBar.style.transform = 'scaleX(' + pct + ')';
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
  if (toTop) {
    toTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  }

  /* ---- Scroll pill: â†‘â†“ buttons ---- */
  if (scrollUpBtn) {
    scrollUpBtn.addEventListener('click', () => {
      window.scrollBy({ top: -window.innerHeight * 0.75, behavior: reduced ? 'auto' : 'smooth' });
    });
  }
  if (scrollDownBtn) {
    scrollDownBtn.addEventListener('click', () => {
      window.scrollBy({ top: window.innerHeight * 0.75, behavior: reduced ? 'auto' : 'smooth' });
    });
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
      label.textContent = 'Sendingâ€¦';

      const done = () => {
        btn.classList.remove('sending');
        label.textContent = 'Send Message';
      };
      const fail = () => {
        done();
        alert('Could not send right now â€” please email rkobro112@gmail.com directly.');
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

  /* ---------------- Map (Google Maps iframe) â€” lazy buttons ---------------- */
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
      locateBtn.textContent = 'â³';
      navigator.geolocation.getCurrentPosition(function (pos) {
        loadMapAt(pos.coords.latitude, pos.coords.longitude, 16);
        locateBtn.textContent = 'ðŸ“';
      }, function () {
        alert('Location access denied.');
        locateBtn.textContent = 'ðŸ“';
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
        // original bitmap â€” stays sharp) instead of transform-scaling
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
      .catch(function() { vc.textContent = 'â€”'; });
  })();

  /* ---- Scroll Progress + Back to Top handled by unified onScroll() above ---- */

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

  /* ---- Keyboard Shortcut: T toggles theme ---- */
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 't' || e.key === 'T') {
      if (themeBtn) themeBtn.click();
    }
  });

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
     FEATURE 1: Enhanced Timeline â€” line draw + dot pulse + card slide
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
     FEATURE 3: Easter Egg â€” Konami Code
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
      overlay.innerHTML = '<div style="text-align:center"><div class="ee-text">RKO BRO</div><div class="ee-sub">You found the secret! ðŸŽ‰<br><small>â†‘ â†‘ â†“ â†“ â† â†’ â† â†’ B A</small></div></div>';
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
     FEATURE 4: 3D Particle "RKO BRO" — colored floating particles
     drawn over the reliable gradient text inside .pt-title
     ============================================================ */
  (function() {
    if (reduced || lowRamDevice) return;

    var boxes = Array.prototype.slice.call(document.querySelectorAll('.pt-title'));
    if (!boxes.length) return;

    function ready(fn) {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() { setTimeout(fn, 30); });
      } else { setTimeout(fn, 200); }
    }

    ready(function() {
      boxes.forEach(function(box) {
        var canvas = box.querySelector('canvas.pt-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;

        var particles = [];
        var textCoords = [];
        var W = 0, H = 0;
        var mousePt = { x: -9999, y: -9999 };
        var running = false;
        var text = 'RKO BRO';

        function resize() {
          W = box.offsetWidth;
          H = box.offsetHeight;
          var dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = W * dpr;
          canvas.height = H * dpr;
          canvas.style.width = W + 'px';
          canvas.style.height = H + 'px';
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          generateCoords();
          initParticles();
        }

        function generateCoords() {
          textCoords = [];
          var off = document.createElement('canvas');
          off.width = W;
          off.height = H;
          var offCtx = off.getContext('2d');
          if (!offCtx) return;

          var fs = Math.floor(H * 0.8);
          offCtx.font = '800 ' + fs + 'px Sora, sans-serif';
          offCtx.textAlign = 'center';
          offCtx.textBaseline = 'middle';
          var tw = offCtx.measureText(text).width;
          if (tw > W * 0.96) fs = Math.floor(fs * (W * 0.96) / tw);
          offCtx.font = '800 ' + fs + 'px Sora, sans-serif';
          offCtx.fillStyle = '#fff';
          offCtx.fillText(text, W / 2, H / 2);

          var data = offCtx.getImageData(0, 0, W, H).data;
          var gap = 3;
          for (var y = 0; y < H; y += gap) {
            for (var x = 0; x < W; x += gap) {
              var i = (y * W + x) * 4;
              if (data[i + 3] > 128) textCoords.push({ x: x, y: y });
            }
          }
        }

        function initParticles() {
          particles = [];
          var total = textCoords.length;
          var count = Math.min(total, coarsePointer ? 220 : 440);
          var stride = Math.max(1, Math.floor(total / count));
          var k = 0;
          for (var i = 0; i < total && k < count; i += stride, k++) {
            var tc = textCoords[i];
            if (!tc) continue;
            particles.push({
              x: Math.random() * W,
              y: Math.random() * H,
              tx: tc.x, ty: tc.y,
              vx: 0, vy: 0,
              r: Math.random() * 1.8 + 1.2,
              c: ['139,92,246', '59,130,246', '6,182,212', '200,94,255', '244,63,94'][Math.floor(Math.random() * 5)],
              a: Math.random() * 0.35 + 0.65,
              ph: Math.random() * Math.PI * 2,
              spd: Math.random() * 0.06 + 0.02
            });
          }
        }

        function step() {
          if (!running) return;
          ctx.clearRect(0, 0, W, H);
          for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var dx = mousePt.x - p.x;
            var dy = mousePt.y - p.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 90 && dist > 0) {
              var force = (90 - dist) / 90 * 2;
              p.vx -= (dx / dist) * force;
              p.vy -= (dy / dist) * force;
            }
            p.ph += p.spd;
            // continuous idle float so the word always feels alive/3D
            var ox = Math.sin(p.ph) * 2.2;
            var oy = Math.cos(p.ph * 1.3) * 2.2;
            p.vx += (p.tx + ox - p.x) * 0.06;
            p.vy += (p.ty + oy - p.y) * 0.06;
            p.x += p.vx;
            p.y += p.vy;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')';
            ctx.fill();
          }
          if (!document.hidden) requestAnimationFrame(step);
        }

        if ('IntersectionObserver' in window) {
          var obs = new IntersectionObserver(function(entries) {
            entries.forEach(function(en) {
              if (en.isIntersecting && !running) {
                resize();
                running = true;
                step();
              }
            });
          }, { threshold: 0.05 });
          obs.observe(box);
        } else {
          resize();
          running = true;
          step();
        }
      });
    });
  })();

  /* ============================================================
     FEATURE 5: Page Transition â€” fade sections on scroll
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
     FEATURE 6: Chatbot Widget â€” Pre-programmed Q&A
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
      /* Direct Q&A with emojis */
      if (/\bhello\b/.test(q)) return 'Hello! ðŸ‘‹ How can I help you today? ðŸ˜Š';
      if (/\bhow to download\b|\bdownload kasari\b|\bdownload garne\b/.test(q)) return 'RKO Downloader ma download garna dherai sajilo cha! ðŸ“¥âœ¨ Visit <a href="https://rko-downloader.pages.dev" target="_blank">rko-downloader.pages.dev</a> â€” paste link, click download, done! ðŸš€';
      if (/\bsorry\b|\bmaaph gara\b|\bmaaf\b/.test(q)) return 'Ktapaxi hola! ðŸ˜Š Everything is fine! RKO BRO lai ke garna sakincha bhanera sodhnu â€” skills, projects, WhatsApp! ðŸ’œ';
      if (/\bi love you\b|\blove you\b|\bmay love you\b|\bmay lai love\b/.test(q)) return 'Ohh love you too! ðŸ’œðŸ˜ RKO BRO le dherai maya garcha timi sanga! âœ¨ðŸ’œ';
      if (/\bkiss\b|\bkiss you\b|\bmiss you\b|\bmaile kiss\b/.test(q)) return 'Awww! ðŸ’‹ðŸ˜„ RKO BRO bata dherai love! âœ¨ Maya ta chha, tara kiss ta screen bata aaundaina! ðŸ˜‚ðŸ’œ';
      if (/\bgf\b|\bgf ko ho\b|\bwho is rko gf\b|\brko gf\b|\bgf name\b|\bchat gf\b|\bwife\b/.test(q)) return 'She is ATM Machine ðŸ«¶ Her ðŸ«€ RKO BRO ko haatma cha! ðŸ’œ';
      if (/\bwhat can you do\b|\bwhat do you do\b/.test(q)) return 'I can help with downloads ðŸ“¥, website information ðŸŒ, and general questions! ðŸ’¬ Try asking about projects, skills or status!';
      if (/\bwho created you\b|\bwho made you\b|\bwho is your developer\b/.test(q)) return 'I was created by <b>RKO BRO</b> (Himal Paudel) ðŸ‘¨â€ðŸ’» I was created to assist users of the RKO Downloader platform! ðŸ’œ';
      if (/\bgood night\b|\bsubha ratri\b|\bgoodnyt\b/.test(q)) return 'Good night! ðŸŒ™âœ¨ Sleep well and take care! Sweet dreams! ðŸ˜´ðŸ’œ';
      if (/\bcanyouspeakenglish\b|\bspeak english\b|\benglish ma\b/.test(q)) return 'Yes, I can communicate in English! ðŸ‡¬ðŸ‡§ðŸ’¬ Nepali pani bolna sakchu! ðŸ‡³ðŸ‡µ';
      if (/\bcan you speak nepali\b|\bnepali ma\b|\bnepali\b/.test(q)) return 'Yes, I can communicate in Nepali as well! ðŸ‡³ðŸ‡µðŸ’¬ K help garna sakchu?';
      if (/\brko downloader\b/.test(q)) return 'RKO Downloader is a platform that helps users download videos ðŸ“¹ from TikTok, Facebook, Instagram and more! ðŸ“¥âœ¨ <a href="https://rko-downloader.pages.dev" target="_blank">Visit now</a>';
      if (/\bwhich platform\b|\bsupported platform\b|\bdownload.*platform\b/.test(q)) return 'We support popular platforms such as TikTok ðŸŽµ, Facebook ðŸ“˜, Instagram ðŸ“¸, YouTube ðŸŽ¬ and others! ðŸŒ';
      if (/\bis rko downloader free\b|\bfree download\b|\bfree ho\b/.test(q)) return 'Yes! Most features are available for free! ðŸ†“âœ¨ No hidden charges!';
      if (/\bare you human\b|\bhuman ho\b|\bbot ho\b|\breal ho\b/.test(q)) return 'No, I am an AI-powered virtual assistant ðŸ¤– built by RKO BRO to help you!';
      if (/\bhelp.*download\b|\bdownload.*video\b|\bvideo.*download\b/.test(q)) return 'Yes! ðŸ“¥ Paste the video link in RKO Downloader, and it will process it instantly! âš¡ <a href="https://rko-downloader.pages.dev" target="_blank">Try it now</a>';
      if (/\bdownload.*not working\b|\bdownload.*fail\b|\bproblem.*download\b|\bnot working\b/.test(q)) return 'Please check the link ðŸ”— and try again. If the issue continues, contact support ðŸ“§: <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a>';
      if (/\bcontact support\b|\bsupport\b|\bhelpline\b/.test(q)) return 'You can contact us through: ðŸ“§ Email: <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a><br>ðŸ“± WhatsApp: <a href="https://wa.me/9779810911473" target="_blank">+977 9810911473</a><br>ðŸ“˜ Facebook: <a href="https://www.facebook.com/profile.php?id=61581151980604" target="_blank">RKO BRO</a>';
      if (/\bbye\b|\bbye bye\b|\bgoodbye\b|\bsee you\b|\bmaile janchu\b|\balvida\b/.test(q)) return 'Goodbye! ðŸ‘‹ðŸ˜Š Have a great day and visit us again! ðŸ’œ RKO BRO loves you!';

      /* RKO TV Q&A */
      if (/\brko tv\b/.test(q) && /\bwhat is\b|\babout\b|\bho\b|\bchha\b/.test(q)) return 'RKO TV is a streaming platform ðŸ“º where you can watch live TV channels, sports âš½, news ðŸ“°, movies ðŸŽ¬, and entertainment content! <a href="https://tv-97x.pages.dev" target="_blank">Watch now</a>';
      if (/\bis rko tv free\b|\brko tv.*free\b/.test(q)) return 'Yes! ðŸ†“ RKO TV provides free access to many channels and content. No hidden charges! âœ¨';
      if (/\bwatch live tv\b|\blive tv\b|\blive channel\b/.test(q)) return 'Open RKO TV ðŸ“º, select a channel, and tap Play â–¶ï¸ to start streaming! <a href="https://tv-97x.pages.dev" target="_blank">Try it now</a>';
      if (/\bdo i need an account\b|\baccount\b|\bsign up\b|\blogin\b/.test(q)) return 'No account is required! ðŸŽ‰ Just open RKO TV and start watching. No signup, no tracking! âœ…';
      if (/\bbuffering\b|\blag\b|\bslow video\b|\bvideo lag\b/.test(q)) return 'Buffering usually occurs due to a slow or unstable internet connection ðŸ“¶. Try switching to a stronger WiFi or mobile data! ðŸ“±';
      if (/\binternet speed\b|\bhow fast\b|\bmbps\b/.test(q)) return 'A stable connection of at least <b>5 Mbps</b> âš¡ is recommended for smooth streaming on RKO TV!';
      if (/\bsport.*rko tv\b|\brko tv.*sport\b|\bcricket\b|\bfootball\b|\bipl\b|\bwwe\b/.test(q)) return 'Yes! ðŸâš½ RKO TV provides access to sports channels and live sports events â€” football, cricket, IPL, WWE and more! <a href="https://tv-97x.pages.dev" target="_blank">Watch live</a>';
      if (/\bphone\b.*\brko tv\b|\brko tv.*phone\b|\bmobile.*rko\b|\brko.*mobile\b/.test(q)) return 'Yes! ðŸ“± RKO TV works on Android phones and other supported devices! <a href="https://tv-97x.pages.dev/api/download-apk" target="_blank">Download now</a>';
      if (/\bfullscreen\b/.test(q)) return 'Yes! ðŸ–¥ï¸ You can switch to fullscreen mode while watching videos â€” just tap the fullscreen icon!'; 
      if (/\brefresh.*channel\b|\bchannel.*refresh\b|\breload\b/.test(q)) return 'Close the player and reopen the channel, or use the refresh option if available! ðŸ”„';
      if (/\bchannel.*not working\b|\bchannel.*down\b|\bnot playing\b/.test(q)) return 'Some channels may be temporarily unavailable â³. Please try again later or try a different server! ðŸ“º';
      if (/\bnews channel\b|\bnews\b/.test(q)) return 'Yes! ðŸ“° RKO TV includes various news channels depending on availability. Stay informed! ðŸ“º';
      if (/\bmovies\b|\bmovie\b|\bchalchitra\b/.test(q)) return 'Yes! ðŸŽ¬ Movie channels and entertainment content may be available on RKO TV! <a href="https://tv-97x.pages.dev" target="_blank">Check it out</a>';
      if (/\bsafe\b|\bsecurity\b|\bvirus\b|\bmalware\b/.test(q)) return 'Yes! ðŸ”’ RKO TV is designed to provide a simple and secure viewing experience. No data collection! âœ…';
      if (/\breport.*channel\b|\bbroken.*channel\b|\bproblem.*channel\b/.test(q)) return 'Please contact support ðŸ“§ and provide the channel name so we can investigate! <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a>';
      if (/\bcast\b|\bsmart tv\b|\bmiracast\b/.test(q)) return 'If your device supports casting ðŸ“¡, you may be able to stream content to your TV! Try screen mirroring!';
      if (/\bdark mode\b/.test(q)) return 'Yes! ðŸŒ™ Dark mode may be available depending on your app version. It saves battery too! ðŸ”‹';
      if (/\bwho developed rko tv\b|\bwho made rko tv\b|\brko tv.*who\b/.test(q)) return 'RKO TV was developed by <b>RKO BRO</b> (Himal Paudel) ðŸ‘¨â€ðŸ’» to provide easy access to online streaming content! ðŸ’œ';
      if (/\bupdate rko tv\b|\bhow.*update\b|\bnew version\b/.test(q)) return 'Download the latest version from the official RKO website ðŸŒ: <a href="https://tv-97x.pages.dev/api/download-apk" target="_blank">Update RKO TV</a>! ðŸ“²';
      if (/\bcontact.*rko tv\b|\brko tv.*support\b/.test(q)) return 'Visit the Contact section on the RKO website ðŸ“ž: ðŸ“§ <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a> | ðŸ“± <a href="https://wa.me/9779810911473" target="_blank">WhatsApp</a>';

      /* Floating Player Q&A */
      if (/\bfloating player\b|\bfloating video\b|\bmini player\b|\bpopup player\b|\bfloat.*play\b/.test(q)) return 'Floating Player ðŸªŸ lets you watch videos in a small window while using other apps! Just tap the floating icon and the video stays on screen! âœ¨';
      if (/\bhow.*floating\b|\bfloating.*enable\b|\bstart floating\b|\bfloating.*on\b/.test(q)) return 'To enable Floating Player ðŸªŸ: Open RKO TV or WWE Highlights â†’ play a video â†’ tap the floating/PiP icon ðŸ“º. The video pops out and floats over other apps!';
      if (/\bfloating.*download\b|\bdownload.*floating\b/.test(q)) return 'Yes! ðŸ“¥ You can download videos directly from the floating player â€” tap the download button inside the mini window! âš¡';
      if (/\bfloating.*move\b|\bmove.*floating\b|\bdrag.*floating\b/.test(q)) return 'Yes! ðŸ–ï¸ You can drag the floating player anywhere on screen! Just tap and hold the window to move it around! ðŸ“±';
      if (/\bfloating.*resize\b|\bresize.*floating\b|\bsize.*floating\b/.test(q)) return 'Yes! ðŸ“ You can resize the floating player â€” pinch to zoom or use the resize button to make it bigger or smaller! ðŸ”';
      if (/\bfloating.*close\b|\bclose.*floating\b|\bstop.*floating\b|\bremove.*floating\b/.test(q)) return 'To close Floating Player âŒ: Tap the X button on the floating window, or swipe it away! Easy! ðŸ‘‹';
      if (/\bfloating.*mute\b|\bmute.*floating\b|\bsound.*floating\b/.test(q)) return 'Yes! ðŸ”‡ You can mute/unmute audio directly from the floating player controls! Tap the speaker icon ðŸ”Š';
      if (/\bfloating.*pause\b|\bpause.*floating\b/.test(q)) return 'Yes! â¸ï¸ You can pause and play directly from the floating player â€” just tap the play/pause button!';
      if (/\bfloating.*fullscreen\b|\bfullscreen.*floating\b/.test(q)) return 'Yes! ðŸ–¥ï¸ Tap the fullscreen icon on the floating player to return to full-screen mode instantly!';
      if (/\bfloating.*speed\b|\bspeed.*floating\b|\bplayback speed\b/.test(q)) return 'Yes! â© You can change playback speed from the floating player controls! Slow or fast â€” you choose! ðŸŽšï¸';
      if (/\bwhat app.*floating\b|\bfloating.*which app\b|\bwhich.*floating\b/.test(q)) return 'Floating Player is available in: ðŸ“º <b>RKO TV</b> (live sports streaming) and ðŸ¤¼ <b>WWE Highlights</b> (wrestling clips)! Both support PiP overlay! âœ¨';
      if (/\bfloating.*not working\b|\bfloating.*problem\b|\bno floating\b/.test(q)) return 'If Floating Player is not working ðŸ› ï¸: 1) Make sure you\'re on Android 8.0+ ðŸ“± 2) Grant "Display over other apps" permission âš™ï¸ 3) Restart the app ðŸ”„';
      if (/\bfloating.*permission\b|\bpermission.*floating\b|\boverlay.*permission\b/.test(q)) return 'Floating Player needs "Display over other apps" permission âš™ï¸. Go to Settings â†’ Apps â†’ RKO TV â†’ Permissions â†’ Allow overlay! âœ…';

      /* RKO Downloader Q&A */
      if (/\brko downloader\b.*\bwhat is\b|\bwhat is\b.*\brko downloader\b/.test(q)) return 'RKO Downloader is a tool ðŸ› ï¸ that helps you download videos ðŸ“¹, photos ðŸ“¸, and audio ðŸŽµ from supported platforms! <a href="https://rko-downloader.pages.dev" target="_blank">Try it now</a>';
      if (/\bris rko downloader free\b/.test(q)) return 'Yes! ðŸ†“ RKO Downloader is completely free to use. No hidden charges! âœ¨';
      if (/\bhow.*download.*video\b|\bdownload.*video\b|\bvideo.*download\b/.test(q)) return 'Copy the video link ðŸ”—, paste it into the input box ðŸ“‹, and click Download â¬‡ï¸. That\'s it! Super easy! âš¡';
      if (/\bwhich platform.*supported\b|\bsupported platform\b|\bplatform.*support\b/.test(q)) return 'RKO Downloader supports: TikTok ðŸŽµ | Facebook ðŸ“˜ | Instagram ðŸ“¸ | YouTube ðŸŽ¬ | and many more! ðŸŒ';
      if (/\bdo i need.*account\b|\baccount.*create\b|\bsignup\b/.test(q)) return 'No account needed! ðŸŽ‰ Just paste the link and download. No signup, no login! âœ…';
      if (/\bdownload.*not working\b|\bdownload.*fail\b|\bnot working\b/.test(q)) return 'Check that the link is valid ðŸ”— and publicly accessible, then try again ðŸ”„. If still not working, email: <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a> ðŸ“§';
      if (/\bhd.*video\b|\bhd video\b|\bquality.*video\b|\bhigh quality\b|\b1080p\b|\b720p\b/.test(q)) return 'Yes! ðŸŽ¬ HD quality is available when the original video supports it â€” up to 1080p! ðŸ”¥';
      if (/\baudio.*only\b|\baudio.*download\b|\bdownload.*audio\b|\bmp3\b|\bmusic.*download\b/.test(q)) return 'Audio-only downloads may not be available for all supported content ðŸŽµ. Try the video download and extract audio from your device! ðŸ“±';
      if (/\bdownload limit\b|\blimit\b|\brestriction\b/.test(q)) return 'No limit! ðŸ†“ There is no fixed download limit for normal usage. Download as much as you want! â™¾ï¸';
      if (/\bvideo.*quality.*low\b|\blow quality\b|\bbad quality\b/.test(q)) return 'The available quality depends on the source platform ðŸ“± and the original upload. RKO Downloader fetches the best quality available! ðŸŽ¯';
      if (/\bprivate video\b|\bprivate.*download\b|\bprivate.*content\b/.test(q)) return 'No, RKO Downloader only works with publicly accessible content ðŸ”“. Private videos cannot be downloaded! ðŸš«';
      if (/\bdownload.*fast\b|\bspeed\b|\bhow fast\b|\bfast download\b/.test(q)) return 'Download speed âš¡ depends on your internet connection ðŸ“¶ and server availability. Usually very fast! ðŸš€';
      if (/\bris.*safe\b|\bsecurity\b|\bvirus\b|\bmalware\b|\bsafe to use\b/.test(q)) return 'Yes! ðŸ”’ RKO Downloader is designed to provide a safe and simple downloading experience. No data collection! âœ…';
      if (/\bmobile.*use\b|\buse.*mobile\b|\bphone.*download\b|\bdownload.*phone\b/.test(q)) return 'Yes! ðŸ“± RKO Downloader works on mobile phones, tablets ðŸ“², and desktop devices ðŸ’»! <a href="https://rko-downloader.pages.dev" target="_blank">Try it now</a>';
      if (/\binstall.*app\b|\bapp.*install\b|\bdownload.*app\b/.test(q)) return 'No app install needed! ðŸŒ You can use RKO Downloader directly through your web browser. But there\'s also an Android app! ðŸ“² <a href="https://rko-downloader.pages.dev/download.html" target="_blank">Download APK</a>';
      if (/\bdownload button.*not show\b|\bno download button\b|\bbutton.*missing\b/.test(q)) return 'Try refreshing the page ðŸ”„ and ensure the video link is correct ðŸ”—. If still not working, try a different link!';
      if (/\binstagram.*download\b|\bdownload.*instagram\b|\big reel\b|\binsta\b/.test(q)) return 'Yes! ðŸ“¸ Supported public Instagram photos, videos and reels can be downloaded! <a href="https://rko-downloader.pages.dev" target="_blank">Try it</a>';
      if (/\btiktok.*download\b|\bdownload.*tiktok\b|\btiktok video\b/.test(q)) return 'Yes! ðŸŽµ RKO Downloader supports TikTok video downloads â€” with or without watermark! ðŸ”¥ <a href="https://rko-downloader.pages.dev" target="_blank">Download now</a>';
      if (/\bfacebook.*download\b|\bdownload.*facebook\b|\bfb video\b/.test(q)) return 'Yes! ðŸ“˜ Public Facebook videos are supported! Just paste the link and download! âš¡ <a href="https://rko-downloader.pages.dev" target="_blank">Try it</a>';
      if (/\byoutube.*download\b|\bdownload.*youtube\b|\byt video\b/.test(q)) return 'Please check the supported platforms list ðŸ“‹ on the website for the latest information on YouTube downloads! ðŸŽ¬';
      if (/\bwhere.*saved\b|\bsaved.*folder\b|\bdownload.*folder\b|\bfile.*save\b/.test(q)) return 'Downloaded files ðŸ“‚ are usually saved in your device\'s Downloads folder! Check your file manager! ðŸ“';
      if (/\bphoto.*download\b|\bdownload.*photo\b|\bdownload.*image\b|\bimage.*download\b/.test(q)) return 'Yes! ðŸ“¸ Photo downloads are supported on compatible platforms â€” Facebook, Instagram and more! Just paste the link! âš¡';
      if (/\breel.*download\b|\bdownload.*reel\b|\binstagram reel\b/.test(q)) return 'Yes! ðŸŽ¬ Public reels can be downloaded from supported platforms â€” TikTok, Instagram, Facebook! ðŸ“²';
      if (/\bwho.*develop\b|\bdeveloper\b|\bwho.*made\b/.test(q)) return 'RKO Downloader was developed by <b>RKO BRO</b> (Himal Paudel) ðŸ‘¨â€ðŸ’» â€” the RKO team! ðŸ’œ';
      if (/\bwhat can you do\b/.test(q)) return 'I can help you download videos ðŸ“¹, photos ðŸ“¸, and answer questions about RKO Downloader! ðŸ’¬ Try asking about TikTok, Instagram, Facebook downloads!';

      /* Share flow / Direct download Q&A */
      if (/\bshare.*flow\b|\bshare.*download\b|\bshare.*link\b|\bshare.*to.*app\b/.test(q)) return 'Share Flow ðŸ“¤: Copy a video link from any social media app â†’ Share it to RKO Downloader â†’ The app auto-detects the link and starts downloading! No paste needed! âš¡';
      if (/\bdirect download\b|\bdownload.*directly\b|\bno paste\b/.test(q)) return 'Direct Download â¬‡ï¸: When you share a link from TikTok/Facebook/Instagram directly to RKO Downloader, it auto-processes and downloads â€” no manual paste required! ðŸš€';
      if (/\btitle.*copy\b|\bcopy.*title\b|\bvideo.*title\b|\btitle.*show\b/.test(q)) return 'Title Copy ðŸ“‹: When a video is detected, RKO Downloader shows the video title! You can tap to copy the title text for sharing or saving! âœ…';
      if (/\btitle.*filename\b|\bfilename.*title\b|\bfile.*name.*title\b|\btitle.*as.*name\b/.test(q)) return 'Title as Filename ðŸ“: RKO Downloader automatically uses the video title as the filename when saving! No more "video_123.mp4" â€” get meaningful names! ðŸŽ¯';
      if (/\bauto.*detect\b|\bauto.*link\b|\bclipboard.*detect\b|\bauto.*paste\b/.test(q)) return 'Auto Detect ðŸ”: RKO Downloader monitors your clipboard â€” when you copy a supported link and open the app, it auto-detects and starts processing! Magic! âœ¨';

      /* Screen Mirror Q&A */
      if (/\bscreen mirror\b|\bscreen.*mirror\b|\bmirror.*screen\b|\bphone.*mirror\b/.test(q)) return 'Screen Mirror ðŸ“² lets you mirror and control your phone from PC! Full control with mouse & keyboard, file transfer, and high-quality streaming! <a href="https://rko-bro-website.pages.dev/#projects" target="_blank">Coming soon</a>';
      if (/\bmirror.*control\b|\bcontrol.*phone\b|\bpc.*control\b|\bremote.*control\b/.test(q)) return 'Fully Control Mobile by PC ðŸ–±ï¸: Tap, swipe, type messages, open apps & settings â€” all with mouse & keyboard on your desktop! Exactly like using your phone on PC! ðŸ’»ðŸ“±';
      if (/\bmirror.*quality\b|\bmirror.*resolution\b|\bscreen.*quality\b|\bhigh.*quality.*mirror\b/.test(q)) return 'Better Quality Screening ðŸ–¥ï¸: Sharp high-resolution mirror with smooth low-lag streaming! Enjoy crystal clear display on your PC! âœ¨';
      if (/\bmirror.*wifi\b|\bwifi.*pair\b|\bconnect.*mirror\b|\bpair.*phone\b/.test(q)) return 'Easy Pair over Same WiFi ðŸ“¶: Connect both devices in seconds â€” no cables needed! Just make sure phone and PC are on the same WiFi network! ðŸ”—';
      if (/\bfile.*transfer\b|\bfile.*send\b|\bphoto.*transfer\b|\bvideo.*transfer\b/.test(q)) return 'File, Photo & Video Send ðŸ“‚: Transfer media between phone and PC instantly! Drag and drop files both ways! âš¡';
      if (/\bmirror.*app\b|\bmirror.*download\b|\bwhere.*get.*mirror\b/.test(q)) return 'Screen Mirror has apps for both PC ðŸ’» & Mobile ðŸ“±! Coming soon ðŸš§ â€” stay tuned for the release! ðŸ’œ';
      if (/\bmirror.*android\b|\bandroid.*mirror\b|\bmirror.*phone\b/.test(q)) return 'Yes! ðŸ“² Screen Mirror works on Android phones! Mirror your Android screen to any Windows PC over WiFi! ðŸ’»';
      if (/\bmirror.*lag\b|\blag.*mirror\b|\bslow.*mirror\b/.test(q)) return 'Screen Mirror uses optimized low-latency streaming âš¡ for smooth mirroring! Make sure both devices are on strong WiFi for best results! ðŸ“¶';
      if (/\bmirror.*keyboard\b|\bkeyboard.*mirror\b|\btype.*phone\b/.test(q)) return 'Yes! âŒ¨ï¸ You can type messages, search and use your PC keyboard directly on your mirrored phone! Super convenient! ðŸ’¬';
      if (/\bwho.*develop.*mirror\b|\bmirror.*who\b/.test(q)) return 'Screen Mirror was developed by <b>RKO BRO</b> (Himal Paudel) ðŸ‘¨â€ðŸ’» â€” full stack + Android developer! ðŸ’œ';

      /* WWE Highlights Q&A */
      if (/\bwwe highlights\b|\bwwe.*highlight\b|\bhighlight.*wwe\b/.test(q)) return 'WWE Highlights ðŸ¤¼ is an Android app to watch and download WWE wrestling video highlights! Floating player, offline downloads, and auto-fullscreen! <a href="https://wwe-web.hightlights.workers.dev" target="_blank">Visit site</a>';
      if (/\bwwe.*download\b|\bdownload.*wwe\b|\bwwe.*video.*download\b/.test(q)) return 'Yes! â¬‡ï¸ You can save any WWE highlight to your device to watch offline! Just tap the download button! ðŸ“² <a href="https://wwe.hightlights.workers.dev/api/app.apk" target="_blank">Download APK</a>';
      if (/\bwwe.*floating\b|\bfloating.*wwe\b|\bwwe.*pip\b/.test(q)) return 'Yes! ðŸªŸ WWE Highlights has a floating player â€” video floats in a mini window while you use other apps! Watch and multitask! âš¡';
      if (/\bwwe.*fullscreen\b|\bauto.*fullscreen\b|\blandscape.*wwe\b/.test(q)) return 'Yes! ðŸ”„ Auto Fullscreen â€” automatically goes fullscreen when you rotate to landscape mode! Immersive wrestling experience! ðŸ¤¼';
      if (/\bwwe.*control\b|\bwwe.*smart\b|\bplay.*pause.*wwe\b/.test(q)) return 'Smart Controls ðŸŽ›ï¸: Play â¯ï¸, Pause â¸ï¸, Mute ðŸ”‡, Speed â©, Resize ðŸ“ and Move ðŸ–ï¸ the player anywhere on screen!';
      if (/\bwwe.*fast\b|\bwwe.*light\b|\bwwe.*small\b|\bwwe.*size\b/.test(q)) return 'Fast & Light âš¡: Small APK size ðŸ“¦, quick load times ðŸš€, no ads ðŸš« and no bloat! Just pure wrestling highlights! ðŸ’ª';
      if (/\bwwe.*safe\b|\bwwe.*private\b|\bwwe.*security\b/.test(q)) return 'Secure & Private ðŸ”’: No data collection ðŸ›¡ï¸, your privacy is protected! Just enjoy wrestling! ðŸ’œ';
      if (/\bwwe.*android\b|\bandroid.*wwe\b|\bwwe.*version\b/.test(q)) return 'WWE Highlights requires Android 8.0+ ðŸ“±. Works on most modern Android devices! <a href="https://wwe.hightlights.workers.dev/api/app.apk" target="_blank">Download now</a>';
      if (/\bwwe.*website\b|\bwwe.*web\b|\bwwe.*online\b/.test(q)) return 'Yes! ðŸŒ You can also watch WWE Highlights on the web! <a href="https://wwe-web.hightlights.workers.dev" target="_blank">Visit WWE Highlights Web</a>';
      if (/\bwwe.*no ads\b|\bwwe.*ads\b|\bad.*free\b/.test(q)) return 'Yes! ðŸš« No ads! WWE Highlights is completely ad-free! Pure wrestling content without interruptions! ðŸ¤¼ðŸ’œ';
      if (/\bwho.*develop.*wwe\b|\bwwe.*who\b/.test(q)) return 'WWE Highlights was developed by <b>RKO BRO</b> (Himal Paudel) ðŸ‘¨â€ðŸ’»! Built with love for wrestling fans! ðŸ¤¼ðŸ’œ';
      if (/\bwwe.*sport\b|\bwhat.*wwe\b|\bwwe.*what\b/.test(q)) return 'WWE Highlights brings you the best wrestling moments ðŸ¤¼ â€” Raw, SmackDown, pay-per-views and more! Watch highlights anytime! ðŸ“º';

      /* Website Features Q&A */
      if (/\bdark mode\b|\blight mode\b|\btheme\b|\btheme.*toggle\b/.test(q)) return 'Dark/Light mode ðŸŒ™â˜€ï¸: Press <b>T</b> on your keyboard to toggle themes! Or click the sun/moon icon ðŸŒ“ in the navbar! Your preference is saved! ðŸ’¾';
      if (/\bcv\b|\bresume\b|\bdownload.*cv\b|\bdownload.*resume\b/.test(q)) return 'Download RKO BRO\'s CV ðŸ“„: <a href="https://rko-bro-website.pages.dev/assets/Himal-Paudel-CV.pdf" target="_blank">Click here to download CV</a> ðŸ“‹! Available in the navbar and footer! ðŸ’¼';
      if (/\bblog\b|\barticle\b|\bpost\b/.test(q) && /\bread\b|\bwhat\b|\bshow\b|\blist\b|\bcheck\b/.test(q)) return 'RKO BRO\'s Blog ðŸ“: Check out articles on Android development ðŸ“±, streaming tech ðŸ“º, and glassmorphism UI tricks âœ¨! Scroll to the Blog section! ðŸ’œ';
      if (/\bservice status\b|\bstatus.*check\b|\bis.*online\b|\bserver.*status\b|\buptime\b/.test(q)) return 'Service Status ðŸŸ¢: Check live health of all RKO services in the Status section! RKO Downloader, RKO TV, WWE Highlights â€” all monitored! ðŸ“Š';
      if (/\bvisitor.*count\b|\bhow many.*visit\b|\bvisitor\b/.test(q)) return 'Visitor Counter ðŸ‘ï¸: Check the hero section! Live visitor count powered by Cloudflare KV! See how many people visited! ðŸ“ˆ';
      if (/\bdownload.*stat\b|\bstat\b|\bhow many.*download\b/.test(q)) return 'Download Stats ðŸ“Š: Check the Download Stats section! Real-time download numbers for RKO Downloader and RKO TV! ðŸ“ˆ';
      if (/\beaster egg\b|\bsecret\b|\bkonami\b|\bhidden\b/.test(q)) return 'Easter Egg ðŸ¥š: Press <b>â†‘ â†‘ â†“ â†“ â† â†’ â† â†’ B A</b> on your keyboard! A secret animation will appear! ðŸŽ‰ Can you find it? ðŸ‘€';
      if (/\bparticle\b|\b3d.*text\b|\bfloating.*text\b/.test(q)) return '3D Particle Text âœ¨: In the hero section, "RKO BRO" is written with floating particles! Move your mouse near them and watch them scatter then reform! ðŸŽ†';
      if (/\bmap.*feature\b|\bmap.*button\b|\bmap.*control\b/.test(q)) return 'Map Controls ðŸ—ºï¸: ðŸ“ My Location â€” flies to your GPS position! ðŸ  Home â€” returns to Ghorahi! The map shows satellite view with place labels! ðŸ›°ï¸';
      if (/\bcontact.*form\b|\bmessage.*send\b|\bsend.*message\b/.test(q)) return 'Contact Form ðŸ“§: Fill in your name, email, subject and message â€” hit Send! I reply within 24 hours! Or email directly: <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a>';
      if (/\bpage.*transition\b|\banimation\b|\bscroll.*animation\b/.test(q)) return 'Page Animations ðŸŽ¬: Sections fade in smoothly as you scroll! Timeline dots pulse ðŸŸ£, skill bars animate ðŸ“Š, and cards tilt in 3D! âœ¨';

      /* Tech / General Q&A */
      if (/\btech stack\b|\bwhat.*tech\b|\bwhat.*use\b|\bwhat.*built.*with\b/.test(q)) return 'Tech Stack ðŸ› ï¸: React âš›ï¸ | Next.js | Tailwind CSS ðŸŽ¨ | Node.js ðŸŸ¢ | MongoDB ðŸƒ | Cloudflare Workers â˜ï¸ | Kotlin ðŸ“± | ExoPlayer ðŸŽ¬ | Figma ðŸŽ¯';
      if (/\bfeedback\b|\bsuggestion\b|\bimprove\b|\bfeature request\b/.test(q)) return 'Feedback ðŸ’¬: Love to hear your thoughts! Email: <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a> ðŸ“§ or WhatsApp: <a href="https://wa.me/9779810911473" target="_blank">+977 9810911473</a> ðŸ“±';
      if (/\bbug\b|\breport.*bug\b|\bproblem\b|\berror\b/.test(q)) return 'Report a Bug ðŸ›: Please describe the issue and send to: ðŸ“§ <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a> | ðŸ“± <a href="https://wa.me/9779810911473" target="_blank">WhatsApp</a>';
      if (/\blanguage\b|\bnepali\b|\benglish\b|\bho\b.*\bbolna\b/.test(q)) return 'Language ðŸ—£ï¸: I can chat in both <b>English</b> ðŸ‡¬ðŸ‡§ and <b>Nepali</b> ðŸ‡³ðŸ‡µ! Type in whatever you prefer â€” ma bujhchu! ðŸ˜Š';
      if (/\bprivacy\b|\bdata\b|\btracking\b/.test(q)) return 'Privacy ðŸ”’: RKO apps do NOT collect personal data! No tracking, no ads, no hidden analytics! Your privacy is fully protected! âœ…ðŸ’œ';
      if (/\bhimal paudel\b|\bwho.*himal\b|\bhimal.*who\b/.test(q)) return '<b>Himal Paudel</b> ðŸ‘¨â€ðŸ’» is known as RKO BRO â€” a 24 year old Full Stack Developer from Ghorahi, Dang, Nepal ðŸ‡³ðŸ‡µ. He builds web apps, Android apps and streaming platforms! ðŸ’œ';
      if (/\brko ecosystem\b|\brko.*suite\b|\brko.*app\b/.test(q)) return 'RKO Ecosystem ðŸ’œ includes: ðŸ“¥ RKO Downloader | ðŸ“º RKO TV | ðŸ“² Screen Mirror | ðŸ¤¼ WWE Highlights | ðŸŒ Portfolio Website â€” all built by RKO BRO! ðŸš€';
      if (/\bnepal\b|\bnepal.*about\b|\btell.*nepal\b/.test(q)) return 'Nepal ðŸ‡³ðŸ‡µ: Beautiful country in South Asia! Home to Mount Everest ðŸ”ï¸, diverse cultures ðŸŽ­, delicious food ðŸ› and amazing people! RKO BRO is proud to be Nepali! ðŸ’œ';
      if (/\bkeyboard.*shortcut\b|\bshortcut\b|\bhotkey\b/.test(q)) return 'Keyboard Shortcuts âŒ¨ï¸: <b>T</b> â€” Toggle dark/light mode ðŸŒ™â˜€ï¸ | <b>Esc</b> â€” Close lightbox âŒ';
      if (/\bportfolio\b|\bwebsite.*about\b|\bthis.*site\b/.test(q)) return 'This Portfolio ðŸŒ: Built with vanilla HTML/CSS/JS! Features glassmorphism UI ðŸ’Ž, RGB animations ðŸŒˆ, particles âœ¨, 3D tilt cards, chatbot ðŸ¤–, and more! Hosted on Cloudflare Pages! âš¡';

      /* Casual Nepali */
      if (/\bsanchai chu\b|\bsanchai\b|\bthik chu\b|\bustadai chu\b/.test(q)) return 'Ma pani sanchai chu! ðŸ˜Š Sabai badhiya chha. Tapai k garcha aaja? ðŸ’œ';
      if (/\bk garcha\b|\bk garchu\b|\bk gardai\b/.test(q)) return 'K garcha! ðŸ˜„ Ma ta coding gardai chu! Tapai le ke garcha? ðŸ’»';
      if (/\bbistarai\b|\bali bistarai\b/.test(q)) return 'Bistarai, bistarai! ðŸ˜„ Life janchha, code chalchha â€” sabai set chha! ðŸ’œ';
      if (/\bchiso\b|\bchiso cha\b|\btando\b|\bsardi\b/.test(q)) return 'Chiso cha! ðŸ¥¶ Dang ma chiso â€” coding garna perfect weather! Hot coffee â˜• + laptop ðŸ’» = heaven! ðŸ˜Ž';
      if (/\bkati bajyo\b|\btime\b|\bwhat time\b|\bbeluka\b/.test(q)) return 'Ma time herda sakdina ðŸ˜… â€” ma chatbot chu, mero time kunai chhaina! But keep coding! ðŸ’»â°';

      /* Casual English reactions */
      if (/\bnice\b|\bcool\b|\bawesome\b|\bamazing\b|\bgreat\b/.test(q)) return 'Thanks! ðŸ˜„ðŸ’œ RKO BRO banako chha â€” quality work, guaranteed! âœ¨';
      if (/\bwhat.*up\b|\bwhats up\b|\bwyd\b|\bkrna kya\b/.test(q)) return 'Yo! ðŸ¤™ Coding chalchha, projects baninchha, life set chha! Tapai k cha? ðŸ’œ';

      /* Nepali jokes â€” TOP priority */
      if (/\bjoke[s]?\b|\bhasauna\b|\bhaso\b|\bfunny\b|\bmazak\b|\bhasawle\b|\brofl\b|\blol\b|\blmao\b/.test(q)) {
        var jokes = [
          'Programmer le bhanya "Mero code ma bug chhaina!" Tester le bhanya "Bug hoina, yeutai extra feature ho!" ðŸ˜‚',
          'Why do programmers prefer dark mode? Because light attracts bugs! ðŸ›ðŸ˜„',
          'Ek programmer ko bihe bhayo. Khasma usle return gareko thiyo "true"! ðŸ’ðŸ˜‚',
          'WiFi nabhaye programmer: "Ma offline chu, ma sunnai sakdina!" ðŸ“µðŸ˜…',
          'Teacher: "Beta, 2+2 kitna hota hai?" Student: "Error 404: Math not found!" ðŸ˜‚',
          'Why do Java developers wear glasses? Because they cannot C#! ðŸ‘“ðŸ˜‚',
          'A programmer asked God: "Can you make the world run on JavaScript?" God: "Nah, I don\'t want to break everything." ðŸ˜‚',
          'Developer: "It works on my machine!" Manager: "Then we\'ll ship your machine!" ðŸ˜‚',
          'There are 10 types of people in the world: those who understand binary, and those who don\'t. ðŸ¤“',
          'SQL query walks into a bar, sees two tables and asks: "Can I JOIN you?" ðŸºðŸ˜‚',
          'A HTML tag walks into a bar. Bartender: "What do you want?" Tag: "Div-er please!" ðŸ˜‚',
          'Recursion: The art of solving a problem by solving the same problem until you solve the problem. ðŸ”„ðŸ˜…',
          'Why did the developer go broke? Because he used up all his cache! ðŸ’¸ðŸ˜‚',
          'A programmer\'s wife says: "Go to the store and buy a loaf of bread. If they have eggs, buy a dozen." He comes home with 12 loaves. ðŸ˜‚'
        ];
        return jokes[Math.floor(Math.random() * jokes.length)];
      }

      /* Status / Attitude / Mood */
      if (/\bstatus\b|\blife\b|\battitude\b|\bfeeling\b|\bmood\b|\bvibe\b|\benergy\b/.test(q)) {
        var statuses = [
          'Status: Coding mode ON, bugs mode OFF! Attitude: "Code hard, ship harder." ðŸš€',
          'Life motto: Dal Bhat + Clean Code = Perfect Day! ðŸ›ðŸ’»',
          'Current mood: Grind Mode â€” debugging at 2 AM like a boss! ðŸ˜Ž',
          'Attitude: I don\'t copy code, I write better code! ðŸ’ª',
          'Status: Living the developer dream â€” one commit at a time! ðŸŒŸ',
          'Aaja ko status: "Bugs mile toh maro, code chale toh paro!" ðŸ˜‚ðŸ”¥',
          'Life update: Shipped a feature, broke another â€” perfectly balanced! âš–ï¸'
        ];
        return statuses[Math.floor(Math.random() * statuses.length)];
      }

      /* Poem / Kavita */
      if (/\bpoem\b|\bkavita\b|\bpoetry\b|\bgeet\b|\bsong\b|\blyric\b/.test(q)) {
        var poems = [
          'Code ko duniya ma, RKO BRO chha rajaa, UI ramro, API strong â€” sabai ko bau! ðŸ‘‘\n(Hindi/Nepali coder poem)',
          'Ek choti code ma, Bug aayo, dimag ma darr lageyo, Debug garey, fix garey, Phir se deploy garey â€” problem solved! ðŸŽ‰',
          'Morning: Coffee â˜•, Afternoon: Code ðŸ’», Night: Debug ðŸ”, Repeat: Forever â™¾ï¸\n\nâ€” A Developer\'s Haiku ðŸŽ‹',
          'Screen ko ujyali ma, Keyboard ko dhun ma, RKO BRO le banayo, Digital sapana â€” technical gun! ðŸŒŸ'
        ];
        return poems[Math.floor(Math.random() * poems.length)];
      }

      /* Fun / Random */
      if (/\bfun\b|\brandom\b|\bbored\b|\bboring\b|\btimepass\b|\bfursad\b/.test(q)) {
        var funs = [
          'Fun fact: Bananas are berries, but strawberries are not! ðŸŒðŸ¤¯',
          'If programming was easy, everyone would do it â€” oh wait, they do! ðŸ˜‚',
          'RKO BRO fun fact: Can write 1000 lines of code but can\'t write a proper love letter! ðŸ’€ðŸ˜‚',
          'Did you know? The first computer bug was an actual bug â€” a moth found in a Harvard computer! ðŸ¦—',
          'WiFi password? Password123! Just kidding, that\'s not the real one! ðŸ“µðŸ˜„',
          'Developer\'s diet: 50% coffee, 30% pizza, 20% energy drinks! ðŸ•â˜•'
        ];
        return funs[Math.floor(Math.random() * funs.length)];
      }

      /* Greetings */
      if (/^(hi|hello|hey|namaste|hola|sup|yo)\b/.test(q)) {
        return 'Namaste! ðŸ™ Welcome to RKO BRO\'s portfolio. Ke help chha?';
      }

      /* Friendly auto-replies */
      if (/\bhow are you\b|\bkasto cha\b|\bksto cha\b|\bhow r u\b|\bhru\b|\bthik cha\b/.test(q)) {
        return 'Ma ekdam thik chu! ðŸ˜„ Sabai badhiya chha. Tapai kasto hunuhuncha?';
      }
      if (/\bare you good\b|\bare u good\b|\bramro cha\b|\bramro chau\b/.test(q)) {
        return 'Haami ekdam ramro chhau! ðŸ’ª Coding chha, projects chha, sabai set chha.';
      }
      if (/\bhow was (your )?day\b|\baaja ko din\b|\bdin kasto\b/.test(q)) {
        return 'Aaja ko din ekdam productive thiyo! ðŸ’» New features banayo, bugs fix garyo. Every day is a coding day!';
      }
      if (/\bgood morning\b|\bgood afternoon\b|\bgood evening\b|\bsubha prabhat\b|\bmorning\b|\bevening\b|\bnight\b/.test(q)) {
        return 'Good morning! â˜€ï¸ Aaja pani coding garna lai ready chu! K bhannu huncha?';
      }
      if (/\bthank\b|\bdhanyabad\b|\bthank you\b|\bthanks\b/.test(q)) {
        return 'Tapai lai dhanyabad! ðŸ™ Kati help bhayo bhane dherai khusi lagchha.';
      }

      /* Nepali casual */
      if (/\bkhana vayo\b|\bkhana khayo\b|\bbhoj\b|\bkhaana\b/.test(q)) {
        return 'Abhi khana vayo! ðŸ˜‹ Dal bhat power 24 hour! Tapai le khano bhayo?';
      }
      if (/\bumm\b|\bum\b|\bhmm\b|\bhmmmm\b|\buh\b/.test(q)) {
        return 'Umm... huncha huncha! ðŸ˜„ Ke sochdai huncha? Bhanus, ma help garchu.';
      }
      if (/\bthik xa\b|\bthik chha\b|\bthik chha\b/.test(q)) {
        return 'Thik chha! âœ… Ramro chha. Aru ke chha?';
      }
      if (/\bk garirako\b|\bk gardai\b|\bwhat doing\b|\bbusy\b/.test(q)) {
        return 'Coding gardai chu! ðŸ’» RKO Downloader ma naya feature add garna lageko. Busy life, happy life!';
      }
      if (/\byo man\b|\byooo\b|\bbro\b|\bdai\b|\bbhai\b/.test(q)) {
        return 'Yooo! ðŸ¤™ K cha bro? K kaam chha bhanus!';
      }
      if (/\bok\b|\bokay\b|\bokey\b/.test(q)) {
        return 'Thik chha! âœ… Ramro chha. Aru ke chha?';
      }
      if (/\blove\b|\bpyar\b|\bmohabbat\b/.test(q)) {
        return 'Mero pyar? ðŸ’œ Clean code, beautiful UI, ra smooth animations! Bas yo nai enough chha life ma! ðŸ˜„';
      }
      if (/\bsingle\b|\bcommitted\b|\brelationship\b/.test(q)) {
        return 'Committed chhu... coding sanga! ðŸ’» Relationship status: "In a committed relationship with JavaScript." ðŸ˜‚';
      }

      /* Age */
      if (/\bage\b|\bkati barsha\b|\bumr\b|\bold\b|\byoung\b|\bkati janko\b/.test(q)) {
        return 'RKO BRO is <b>24 years old</b> young! ðŸ”¥ Still building, still learning, still shipping!';
      }
      /* Price / website */
      if (/\bprice\b|\brate\b|\bcost\b|\bcharge\b|\bmoney\b|\bwebsite\b|\bweb.*make\b|\bpaise\b|\bpaisa\b/.test(q)) {
        return '<b>Website Development Price:</b><br>ðŸ’° Basic Website: <b>1Kâ€“2K NPR</b><br>ðŸ’° Business/Dashboard: <b>2K+ NPR</b><br>Depends on features. Email <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a> for exact quote!';
      }
      /* WhatsApp */
      if (/\bwhatsapp\b|\bnumber\b|\bphone\b|\bcall\b|\bring\b/.test(q)) {
        return '<b>WhatsApp:</b> <a href="https://wa.me/9779810911473" target="_blank">+977 9810911473</a> ðŸ“±<br>Direct message garna saknu huncha! Ma reply garchu. ðŸ˜Š';
      }
      /* Photo */
      if (/\bphoto\b|\bpic\b|\bimage\b|\bchitra\b|\btasbir\b|\bface\b|\blook\b|\blogo\b/.test(q)) {
        return '<b>RKO BRO:</b><br>ðŸ“¸ <a href="https://rko-bro-website.pages.dev/assets/portrait.jpg" target="_blank">Click here to see RKO BRO\'s photo</a> ðŸ“·<br>Yeso nai ho â€” Nepal ko kunai corner bata code garne! ðŸ˜Ž';
      }
      /* Who */
      if (/\bwho\b|\babout\b|\bintro\b|\byourself\b|\bname\b/.test(q)) {
        return 'I\'m <b>RKO BRO</b> (Himal Paudel) â€” 24, Full Stack Developer from Ghorahi, Dang, Nepal ðŸ‡³ðŸ‡µ. I build web apps, Android apps and streaming platforms. ðŸš€';
      }
      /* Skills */
      if (/\bskill\b|\btech\b|\bstack\b|\bknow\b|\blanguage\b|\btools\b/.test(q)) {
        return '<b>My Skills:</b><br>â€¢ Frontend: React, Next.js, Tailwind CSS, JavaScript<br>â€¢ Backend: Node.js, Express, MongoDB, Cloudflare Workers<br>â€¢ Mobile: Kotlin, Android, ExoPlayer, WebView<br>â€¢ Design: Figma, Prototyping, Motion Design';
      }
      /* Projects */
      if (/\bproject\b|\bwork\b|\bbuild\b|\bapp\b|\bproduct\b|\bmade\b/.test(q)) {
        return '<b>Featured Projects:</b><br>1. <a href="https://rko-downloader.pages.dev" target="_blank">RKO Downloader</a> â€” Video downloader (Android)<br>2. <a href="https://tv-97x.pages.dev" target="_blank">RKO TV</a> â€” Live sports streaming<br>3. Screen Mirror â€” Phone mirroring (coming soon)<br>4. WWE Highlights â€” Wrestling clips app';
      }
      /* Experience */
      if (/\bexperience\b|\bjob\b|\bcareer\b|\bjourney\b|\byear\b/.test(q)) {
        return '<b>My Journey:</b><br>â€¢ 2024â€“Present: Founder & Lead Developer â€” RKO Ecosystem<br>â€¢ 2023â€“2024: Full Stack Developer â€” Freelance (15+ projects)<br>â€¢ 2022â€“2023: Frontend Developer â€” Remote Contract<br>â€¢ 2021â€“2022: Self-Taught Web Development';
      }
      /* Contact */
      if (/\bcontact\b|\bemail\b|\breach\b|\bhire\b|\bmail\b|\bmessage\b/.test(q)) {
        return '<b>Contact me:</b><br>ðŸ“§ <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a><br>ðŸ“˜ <a href="https://www.facebook.com/profile.php?id=61581151980604" target="_blank">Facebook</a><br>ðŸ“¸ <a href="https://www.instagram.com/himalpaudel_18" target="_blank">Instagram: himalpaudel_18</a><br>ðŸ“± WhatsApp: <a href="https://wa.me/9779810911473" target="_blank">+977 9810911473</a>';
      }
      /* Location */
      if (/\bwhere\b|\blocation\b|\blive\b|\bfrom\b|\bghorahi\b|\bdang\b|\bnepal\b/.test(q)) {
        return 'I\'m from <b>Ghorahi, Dang, Nepal</b> ðŸ‡³ðŸ‡µ â€” a beautiful city in the mid-western region. Nepal bata nai code garchu!';
      }
      /* Education */
      if (/\beducation\b|\bstudy\b|\buniversity\b|\bcollege\b|\bschool\b|\bdegree\b/.test(q)) {
        return 'I\'m currently pursuing <b>Civil Engineering</b> while building products on the side. Self-taught in web & mobile development! Padhai pani, coding pani! ðŸ“šðŸ’»';
      }
      /* Availability */
      if (/\bavailable\b|\bhire\b|\bfreelance\b|\bopen\b|\bwork together\b/.test(q)) {
        return 'Yes! I\'m <b>open to work</b> and available for freelance projects. Let\'s build something amazing together! ðŸ’¼ Email: <a href="mailto:rkobro112@gmail.com">rkobro112@gmail.com</a>';
      }
      /* Default */
      var defaults = [
        'Interesting question! ðŸ¤” Ma bujhina ki k bhannu huncha. Try asking about skills, projects, status, contact, WhatsApp!',
        'Hmm, ma tyo bujhina! ðŸ˜… Try asking about my <b>projects</b>, <b>skills</b>, <b>status</b>, <b>contact</b>, or <b>WhatsApp</b> number!',
        'Ma chatbot ho, ma sabai bujhina! ðŸ˜„ But I know about RKO BRO â€” try asking about <b>skills</b>, <b>projects</b>, <b>status</b>!',
        'Wah! Tyo chij ma chhodna sakdina! ðŸ˜‚ Ke asked garna milchha â€” skills, projects, price, WhatsApp!'
      ];
      return defaults[Math.floor(Math.random() * defaults.length)];
    }
  })();
})();
