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
        // Intro: karta synlig, inga rutter ännu
        setRoutes(false, false);
        straitRing.classList.remove('is-active');
        closureMark.classList.remove('is-visible');
        closureStamp.classList.remove('is-visible');
        counters.classList.remove('is-revealed');
        break;
      case '2':
        // Qatar/UAE-volymerna: rutter ritas i grönt
        setRoutes(true, false);
        straitRing.classList.remove('is-active');
        closureMark.classList.remove('is-visible');
        closureStamp.classList.remove('is-visible');
        break;
      case '3':
        // 4 mars-stängningen: rutter blir röda, kryss + stämpel
        setRoutes(true, true);
        straitRing.classList.add('is-active');
        closureMark.classList.add('is-visible');
        closureStamp.classList.add('is-visible');
        break;
      case '4':
        // IEA "största störningen": counters animeras
        counters.classList.add('is-revealed');
        animateCounters();
        break;
      case '5':
        // Asien drabbas först: extra pulse på Asien-rutt
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
  // AKT 5 — Pris-konvergens-graf
  // ------------------------------------------------------------
  function handleAkt5(num, phase) {
    if (phase !== 'enter') return;
    const chart = document.querySelector('.price-chart');
    if (chart && num === '1') chart.classList.add('is-active');
  }

  // ============================================================
  // GSAP: skona användare med reduced-motion
  // ============================================================
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (window.gsap) gsap.globalTimeline.timeScale(100);
  }

})();
