/* ============================================================
   NPK — Scrollytelling controller
   ============================================================ */

(function () {
  'use strict';

  if (typeof scrollama === 'undefined') {
    console.error('Scrollama saknas — kontrollera CDN-länken.');
    return;
  }

  // Set build date in footer
  const buildDateEl = document.getElementById('build-date');
  if (buildDateEl) {
    buildDateEl.textContent = new Date().toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long'
    });
  }

  // ============================================================
  // Scroll progress bar
  // ============================================================
  const progressEl = document.getElementById('scroll-progress');
  if (progressEl) {
    let scrollTicking = false;
    const updateProgress = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      progressEl.style.width = pct + '%';
      scrollTicking = false;
    };
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(updateProgress);
        scrollTicking = true;
      }
    }, { passive: true });
    updateProgress();
  }

  // ============================================================
  // Cinematic interstitials — IntersectionObserver triggers
  // reveal + count-up av jätte-statistiken
  // ============================================================
  const formatStat = (val, decimals, prefix, suffix) => {
    let str;
    if (decimals > 0) {
      str = val.toFixed(decimals).replace('.', ',');
    } else {
      str = Math.round(val).toString();
    }
    return (prefix || '') + str + (suffix || '');
  };

  const animateStat = (el) => {
    const target = parseFloat(el.dataset.target);
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const startDelay = 400;
    const start = performance.now() + startDelay;
    const tick = (now) => {
      const elapsed = now - start;
      if (elapsed < 0) {
        requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.innerHTML = formatStat(target * eased, decimals, prefix, suffix);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const interObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('is-visible')) {
        entry.target.classList.add('is-visible');
        const stat = entry.target.querySelector('.interstitial-stat[data-target]');
        if (stat) animateStat(stat);
      }
    });
  }, { threshold: 0.45 });

  document.querySelectorAll('.interstitial').forEach(el => interObserver.observe(el));

  // ============================================================
  // Generisk step-tracker: lägger till .is-active på aktivt steg
  // och dispatchar custom-event för per-akt-logik
  // ============================================================
  const scroller = scrollama();

  scroller
    .setup({
      step: '.step',
      offset: 0.5,
      debug: false
    })
    .onStepEnter((response) => {
      const { element, direction } = response;
      element.classList.add('is-active');
      const stepId = element.dataset.step;
      if (stepId) handleStep(stepId, 'enter', direction);
    })
    .onStepExit((response) => {
      const { element, direction } = response;
      // Behåll opacity om man scrollat förbi nedåt — annars dimma
      if (direction === 'up') element.classList.remove('is-active');
      const stepId = element.dataset.step;
      if (stepId) handleStep(stepId, 'exit', direction);
    });

  window.addEventListener('resize', () => scroller.resize());

  // ============================================================
  // Step handlers per akt
  // ============================================================
  function handleStep(stepId, phase, direction) {
    const [act, num] = stepId.split('-');
    if (act === '1') handleAkt1(num, phase, direction);
    if (act === '2') handleAkt2(num, phase, direction);
    if (act === '3') handleAkt3(num, phase, direction);
    if (act === '4') handleAkt4(num, phase, direction);
    if (act === '5') handleAkt5(num, phase, direction);
  }

  // ------------------------------------------------------------
  // AKT 1 — NPK letters highlight
  // ------------------------------------------------------------
  function handleAkt1(num, phase) {
    if (phase !== 'enter') return;
    const letters = document.querySelectorAll('#graphic-1 .npk-letter');
    letters.forEach(l => l.classList.remove('is-highlighted'));
    if (num === '1') letters.forEach(l => l.classList.add('is-highlighted'));
    if (num === '2') document.querySelector('#graphic-1 .npk-letter[data-letter="N"]')?.classList.add('is-highlighted');
    if (num === '3') document.querySelector('#graphic-1 .npk-letter[data-letter="P"]')?.classList.add('is-highlighted');
    if (num === '4') document.querySelector('#graphic-1 .npk-letter[data-letter="K"]')?.classList.add('is-highlighted');
    if (num === '5') letters.forEach(l => l.classList.add('is-highlighted'));
  }

  // ------------------------------------------------------------
  // AKT 2 — Trade flows: animera staplar
  // ------------------------------------------------------------
  let akt2Drawn = { before: false, now: false };
  function handleAkt2(num, phase) {
    if (phase !== 'enter') return;
    // Step 2-1: rita "före 2022"-raden
    if (num === '1' && !akt2Drawn.before) {
      animateBarRow('.bar-row-before');
      akt2Drawn.before = true;
    }
    // Step 2-3: rita "2026"-raden
    if ((num === '3' || num === '4') && !akt2Drawn.now) {
      animateBarRow('.bar-row-now');
      akt2Drawn.now = true;
    }
  }
  function animateBarRow(selector) {
    document.querySelectorAll(`${selector} .seg`).forEach((seg, i) => {
      const w = seg.dataset.targetWidth;
      const x = seg.dataset.targetX;
      setTimeout(() => {
        if (w) seg.setAttribute('width', w);
        if (x) seg.setAttribute('x', x);
      }, i * 150);
    });
  }

  // ------------------------------------------------------------
  // AKT 3 — Tanker-animationer (initieras en gång)
  // ------------------------------------------------------------
  const tankerMap = document.querySelector('.hormuz-map');
  const tankers = [];
  let tankerLastTs = performance.now();

  if (tankerMap) {
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const makeTanker = () => {
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'tanker');
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', '-5');
      rect.setAttribute('y', '-1.5');
      rect.setAttribute('width', '10');
      rect.setAttribute('height', '3');
      rect.setAttribute('rx', '0.5');
      rect.setAttribute('class', 'tanker-body');
      g.appendChild(rect);
      return g;
    };

    // 3 på Asien-rutten, 4 på Europa-rutten (Europa-rutten är längre)
    const tankerConfig = [
      { selector: '.route-asia',   count: 3, speed: 0.00009 },
      { selector: '.route-europe', count: 4, speed: 0.00007 }
    ];

    // Insert tankers FÖRE closure-marker så att kryss + stämpel ritas över dem
    const closureMarker = tankerMap.querySelector('.closure-marker');

    tankerConfig.forEach(cfg => {
      const path = tankerMap.querySelector(cfg.selector);
      if (!path) return;
      const len = path.getTotalLength();
      for (let i = 0; i < cfg.count; i++) {
        const el = makeTanker();
        if (closureMarker) tankerMap.insertBefore(el, closureMarker);
        else tankerMap.appendChild(el);
        tankers.push({
          el, path, len,
          progress: i / cfg.count,
          speed: cfg.speed,
          blocked: false,
          visible: false
        });
      }
    });

    // Skona reduced-motion-användare: tankers står still
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tankerTick = (ts) => {
      const dt = ts - tankerLastTs;
      tankerLastTs = ts;
      tankers.forEach(t => {
        if (!t.blocked && t.visible && !reducedMotion) {
          t.progress += t.speed * dt;
          if (t.progress > 1) t.progress -= 1;
        }
        if (t.visible) {
          const pt = t.path.getPointAtLength(t.progress * t.len);
          t.el.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)})`);
        }
      });
      requestAnimationFrame(tankerTick);
    };
    requestAnimationFrame(tankerTick);
  }

  const setTankerState = (visible, blocked) => {
    tankers.forEach(t => {
      t.visible = visible;
      t.blocked = blocked;
      t.el.classList.toggle('is-visible', visible);
      t.el.classList.toggle('is-blocked', blocked);
    });
  };

  // ------------------------------------------------------------
  // AKT 3 — Hormuz-karta + counters
  // ------------------------------------------------------------
  function handleAkt3(num, phase, direction) {
    if (phase !== 'enter') return;
    const map = document.querySelector('.hormuz-map');
    if (!map) return;

    const routeAsia = map.querySelector('.route-asia');
    const routeEurope = map.querySelector('.route-europe');
    const labelAsia = map.querySelector('.route-label-asia');
    const labelEurope = map.querySelector('.route-label-europe');
    const straitRing = map.querySelector('.strait-ring');
    const closureMark = map.querySelector('.closure-marker');
    const closureStamp = map.querySelector('.closure-stamp');
    const counters = document.getElementById('hormuz-counters');

    // Helper för att sätta state
    const setRoutes = (drawn, blocked) => {
      [routeAsia, routeEurope].forEach(r => {
        r.classList.toggle('is-drawn', drawn);
        r.classList.toggle('is-blocked', blocked);
      });
      [labelAsia, labelEurope].forEach(l => l.classList.toggle('is-visible', drawn || blocked));
    };

    switch (num) {
      case '1':
        // Intro: karta synlig, inga rutter eller tankers ännu
        setRoutes(false, false);
        setTankerState(false, false);
        straitRing.classList.remove('is-active');
        closureMark.classList.remove('is-visible');
        closureStamp.classList.remove('is-visible');
        counters.classList.remove('is-revealed');
        break;
      case '2':
        // Qatar/UAE-volymerna: rutter ritas, tankers börjar röra sig
        setRoutes(true, false);
        setTankerState(true, false);
        straitRing.classList.remove('is-active');
        closureMark.classList.remove('is-visible');
        closureStamp.classList.remove('is-visible');
        break;
      case '3':
        // 4 mars-stängningen: rutter blir röda, tankers fryser, kryss + stämpel
        setRoutes(true, true);
        setTankerState(true, true);
        straitRing.classList.add('is-active');
        closureMark.classList.add('is-visible');
        closureStamp.classList.add('is-visible');
        break;
      case '4':
        // IEA "största störningen": counters animeras
        setTankerState(true, true);
        counters.classList.add('is-revealed');
        animateCounters();
        break;
      case '5':
        // Asien drabbas först: extra pulse på Asien-rutt
        setTankerState(true, true);
        if (routeAsia) {
          routeAsia.classList.add('is-pulsing');
          setTimeout(() => routeAsia.classList.remove('is-pulsing'), 2400);
        }
        break;
    }
  }

  let countersAnimated = false;
  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;
    document.querySelectorAll('.counter .num').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // ------------------------------------------------------------
  // AKT 4 — Gaslager-graf
  // ------------------------------------------------------------
  function handleAkt4(num, phase) {
    if (phase !== 'enter') return;
    const chart = document.querySelector('.storage-chart');
    if (chart && num === '1') chart.classList.add('is-active');
  }

  // ------------------------------------------------------------
  // AKT 5 — Per-kategori-grid
  // ------------------------------------------------------------
  function handleAkt5(num, phase) {
    if (phase !== 'enter') return;
    const grid = document.querySelector('.price-grid');
    if (!grid) return;
    if (num === '1') grid.classList.add('is-active');

    // Vilka kategorier som ska lyftas fram per step
    const focus = {
      '1': null,                                        // intro — inget specifikt
      '2': ['spannmal', 'mejeri', 'friland'],          // ekos styrkeområden
      '3': null,                                        // nyans-läge
      '4': ['spannmal', 'mejeri', 'friland'],          // gapet krymper
      '5': ['vaxthus', 'import'],                       // gapet vidgas
      '6': null,                                        // sammanfattning
      '7': null                                         // tre kanaler — vi släpper kategorierna
    };
    const cells = grid.querySelectorAll('.cell');
    const focused = focus[num];
    cells.forEach(cell => {
      cell.classList.remove('is-highlighted', 'is-dimmed');
      if (!focused) return;
      const cat = (cell.classList.value.match(/cell-(\w+)/) || [])[1];
      if (focused.includes(cat)) cell.classList.add('is-highlighted');
      else cell.classList.add('is-dimmed');
    });
  }

  // ============================================================
  // GSAP: skona användare med reduced-motion
  // ============================================================
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (window.gsap) gsap.globalTimeline.timeScale(100);
  }

})();
