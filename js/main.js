/* ==========================================================================
   Portfolio Cheun Perret · animations
   GSAP + ScrollTrigger pour les animations, Lenis pour le défilement fluide.
   Si la personne a demandé à réduire les animations (réglage du système),
   tout s'affiche directement et seules les interactions utiles restent.
   ========================================================================== */
(() => {
  'use strict';
  window.__cpReady = true;

  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const libsOK = !!(window.gsap && window.ScrollTrigger && window.Lenis);
  const motion = !reduce && libsOK;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Sans les bibliothèques ou avec « réduire les animations » : on montre tout tout de suite.
  if (!motion) root.classList.add('reduce-motion');

  /* ------------------------------------------------------------------
     Interactions qui marchent dans tous les cas
     ------------------------------------------------------------------ */

  // Navigation : fond opaque dès qu'on a défilé
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  // Zombie Factory : bascule jour / nuit (et alternance automatique tant qu'on n'a pas cliqué)
  const zf = $('#zf');
  let zfAuto = true;
  const setZf = (mode) => {
    $$('.zf__img', zf).forEach((img) => img.classList.toggle('is-on', img.dataset.mode === mode));
    $$('.zf__btn', zf).forEach((b) => {
      const on = b.dataset.mode === mode;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  };
  $$('.zf__btn', zf).forEach((b) => b.addEventListener('click', () => { zfAuto = false; setZf(b.dataset.mode); }));

  /* ------------------------------------------------------------------
     Easter egg : le mode nuit (code Konami, ou 5 clics sur « INSERT COIN »)
     ------------------------------------------------------------------ */
  const night = $('#night');
  const horde = $('#horde');
  const live = $('#nightLive');
  let nightOn = false;
  let kills = 0;
  const HORDE = 9;

  const moveLamp = (x, y) => { night.style.setProperty('--x', x + 'px'); night.style.setProperty('--y', y + 'px'); };
  window.addEventListener('pointermove', (e) => { if (nightOn) moveLamp(e.clientX, e.clientY); }, { passive: true });

  function spawnZombie(i) {
    const z = document.createElement('img');
    z.src = 'assets/pixel/zombie-a.svg';
    z.alt = '';
    z.width = 48; z.height = 64;
    const fromLeft = i % 2 === 0;
    // Zone d'apparition : sous le message et le bouton « Revenir au jour », au-dessus du bas de l'écran
    const top = $('.night__msg').getBoundingClientRect().bottom + 28;
    const bottom = window.innerHeight - 64 - 24;
    const y = top + Math.random() * Math.max(0, bottom - top);
    z.style.top = y + 'px';
    z.style.left = fromLeft ? '-60px' : (window.innerWidth + 12) + 'px';
    if (!fromLeft) z.style.scale = '-1 1';
    horde.appendChild(z);
    z.addEventListener('pointerdown', (e) => { e.stopPropagation(); squash(z); });
    if (motion) {
      const dist = window.innerWidth * (0.45 + Math.random() * 0.35);
      z._walk = gsap.to(z, { x: fromLeft ? dist : -dist, duration: 7 + Math.random() * 5, ease: 'none', delay: i * 0.35 });
      z._bob = gsap.to(z, { y: -6, duration: 0.28, repeat: -1, yoyo: true, ease: 'steps(2)' });
    } else {
      z.style.left = (fromLeft ? 10 + Math.random() * 35 : 55 + Math.random() * 35) + 'vw';
    }
  }

  function squash(z) {
    if (z._dead) return;
    z._dead = true;
    kills += 1;
    if (z._walk) z._walk.kill();
    if (z._bob) z._bob.kill();
    if (motion) gsap.to(z, { scaleY: 0.1, scaleX: 1.4, autoAlpha: 0, duration: 0.25, ease: 'power2.in', onComplete: () => z.remove() });
    else z.remove();
    $('#nightScore').textContent = kills + ' / ' + HORDE;
    if (kills >= HORDE) {
      $('#nightTitle').textContent = "L'AUBE SE LEVE · TU AS SURVECU !";
      live.textContent = 'Tu as survécu à la nuit.';
      setTimeout(() => toggleNight(false), 1600);
    }
  }

  function toggleNight(on) {
    nightOn = on;
    night.classList.toggle('is-on', on);
    horde.innerHTML = '';
    if (on) {
      kills = 0;
      $('#nightTitle').textContent = 'LA NUIT TOMBE · LA HORDE ARRIVE';
      $('#nightScore').textContent = '0 / ' + HORDE;
      moveLamp(window.innerWidth / 2, window.innerHeight / 2);
      for (let i = 0; i < HORDE; i++) spawnZombie(i);
      live.textContent = 'Mode nuit activé. Clique sur les zombies, ou Échap pour revenir.';
      $('#nightClose').focus({ preventScroll: true });
    } else {
      live.textContent = 'Retour au jour.';
    }
  }
  $('#nightClose').addEventListener('click', () => toggleNight(false));

  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kIdx = 0;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nightOn) { toggleNight(false); return; }
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kIdx = key === KONAMI[kIdx] ? kIdx + 1 : (key === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length) { kIdx = 0; toggleNight(!nightOn); }
  });
  // INSERT COIN : chaque clic ajoute un crédit, à 5 la nuit tombe
  let credits = 0, coinTimer;
  const coinCredits = $('#coinCredits');
  const coinPiece = $('#coinPiece');
  const showCredits = () => {
    coinCredits.textContent = 'CREDITS ' + credits + '/5';
    coinCredits.classList.remove('is-bump');
    void coinCredits.offsetWidth;
    coinCredits.classList.add('is-bump');
  };
  // La pièce tombe du haut de la fente, se met de profil et disparaît pile au centre de la fente
  const coinSlot = $('.coin__slot');
  let coinTl = null;
  function dropCoin() {
    if (coinTl) coinTl.kill();
    const slotBox = coinSlot.getBoundingClientRect();
    const pieceBox = coinPiece.getBoundingClientRect();
    gsap.set(coinPiece, { y: 0, scaleX: 1, scaleY: 1, autoAlpha: 1 });
    // distance entre le centre de la pièce et le centre de la fente
    const toCenter = (slotBox.top + slotBox.height / 2) - (pieceBox.top + pieceBox.height / 2);
    coinTl = gsap.timeline({ onComplete: () => gsap.set(coinPiece, { y: 0, scaleX: 1, scaleY: 1, autoAlpha: 0 }) })
      .to(coinPiece, { y: toCenter, scaleX: 0.3, duration: 0.3, ease: 'power2.in' })
      .to(coinPiece, { scaleX: 0, scaleY: 0.5, autoAlpha: 0, duration: 0.06, ease: 'none' })
      .add(() => { coinSlot.classList.remove('is-fed'); void coinSlot.offsetWidth; coinSlot.classList.add('is-fed'); }, '<');
  }
  $('#coinBtn').addEventListener('click', () => {
    credits += 1;
    showCredits();
    if (window.gsap && !reduce) dropCoin();
    clearTimeout(coinTimer);
    coinTimer = setTimeout(() => { credits = 0; showCredits(); }, 4000);
    if (credits >= 5) {
      clearTimeout(coinTimer);
      setTimeout(() => { credits = 0; showCredits(); toggleNight(true); }, 350);
    }
  });

  // Galaxy : les étapes du workflow s'allument l'une après l'autre (si les animations sont autorisées)
  const flowSteps = $$('#flow li');
  let flowTimer = null, flowI = 0;
  const flowTick = () => {
    flowSteps.forEach((li, i) => li.classList.toggle('is-lit', i === flowI));
    flowI = (flowI + 1) % (flowSteps.length + 1);
  };

  if (!motion) {
    // Version sans animation : tout est déjà visible, on s'arrête là.
    return;
  }

  /* ------------------------------------------------------------------
     À partir d'ici : animations
     ------------------------------------------------------------------ */
  gsap.registerPlugin(ScrollTrigger);

  // Défilement fluide
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Liens internes : glissade jusqu'à la section
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: id === '#top' ? 0 : -70, duration: 1.4 });
      if (id !== '#top' && id !== '#contenu') history.replaceState(null, '', id);
    });
  });

  // Découpe un texte en lettres (en gardant les mots entiers et les balises comme <em>)
  function splitChars(el) {
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    const chars = [];
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const word = document.createElement('span');
            word.style.display = 'inline-block';
            word.style.whiteSpace = 'nowrap';
            [...part].forEach((c) => {
              const s = document.createElement('span');
              s.className = 'char';
              s.textContent = c;
              word.appendChild(s);
              chars.push(s);
            });
            frag.appendChild(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    el.setAttribute('aria-label', label);
    [...el.children].forEach((c) => c.setAttribute('aria-hidden', 'true'));
    return chars;
  }

  /* ---------- Écran PRESS START ---------- */
  const intro = $('#intro');
  let seen = false;
  try { seen = sessionStorage.getItem('cp-intro') === '1'; } catch (e) { /* stockage indisponible */ }

  function playHero() {
    const title = $('#heroTitle');
    const chars = splitChars(title);
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.hero [data-anim="pop"]', { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2.5)' })
      .fromTo(chars, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.01, stagger: 0.022 }, '-=0.15')
      .fromTo('.hero [data-anim="up"]', { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12 }, '-=0.35')
      .fromTo('.shot', { autoAlpha: 0, y: 120, scale: 0.7, rotation: (i) => [-18, 16, -12][i] },
        { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 0.9, stagger: 0.12, ease: 'back.out(1.5)' }, 0.25)
      .add(startFloat);
    title.style.visibility = 'visible';
  }

  function dismissIntro() {
    if (!intro.classList.contains('is-on') || intro._leaving) return;
    intro._leaving = true;
    try { sessionStorage.setItem('cp-intro', '1'); } catch (e) { /* rien */ }
    gsap.timeline()
      .to('.intro__press', { autoAlpha: 0, duration: 0.06, repeat: 5, yoyo: true })
      .to(intro, { yPercent: -100, duration: 0.7, ease: 'power4.inOut' })
      .add(() => { intro.classList.remove('is-on'); intro.remove(); lenis.start(); playHero(); }, '-=0.25');
  }

  if (!seen) {
    intro.classList.add('is-on');
    lenis.stop();
    gsap.from('.intro__title', { y: 40, autoAlpha: 0, duration: 0.6, ease: 'back.out(2)' });
    intro.addEventListener('click', dismissIntro);
    window.addEventListener('keydown', dismissIntro, { once: true });
    window.addEventListener('wheel', dismissIntro, { once: true, passive: true });
    window.addEventListener('touchstart', dismissIntro, { once: true, passive: true });
    setTimeout(dismissIntro, 1800);
  } else {
    intro.remove();
    playHero();
  }

  /* ---------- Hero : captures qui flottent et suivent la souris ---------- */
  const shots = $$('.shot');
  function startFloat() {
    shots.forEach((s, i) => {
      gsap.to(s, { y: '+=' + (8 + i * 3), duration: 2.4 + i * 0.5, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });
  }
  if (finePointer) {
    const hero = $('.hero');
    const movers = shots.map((s) => ({ x: gsap.quickTo(s, 'x', { duration: 0.8, ease: 'power3.out' }), rot: gsap.quickTo(s, 'rotation', { duration: 0.8, ease: 'power3.out' }) }));
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      movers.forEach((m, i) => { m.x(dx * (18 + i * 14)); m.rot(dx * (2 + i)); });
    });
    hero.addEventListener('pointerleave', () => movers.forEach((m) => { m.x(0); m.rot(0); }));
  }
  // en défilant, les captures se séparent à des vitesses différentes
  gsap.utils.toArray('.shot').forEach((s, i) => {
    gsap.to(s, { yPercent: [-18, -38, -8][i], ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  /* ---------- Barre d'XP et zombie qui marche ---------- */
  const xpFill = $('#xpFill');
  const walker = $('#walker');
  let lastY = 0, stepAcc = 0;
  lenis.on('scroll', ({ scroll, limit, direction }) => {
    const p = limit > 0 ? scroll / limit : 0;
    xpFill.style.transform = 'scaleX(' + p + ')';
    const w = walker.offsetWidth;
    walker.style.transform = 'translateX(' + (10 + p * (window.innerWidth - w - 20)) + 'px)';
    walker.classList.toggle('is-left', direction < 0);
    stepAcc += Math.abs(scroll - lastY);
    lastY = scroll;
    if (stepAcc > 36) { stepAcc = 0; walker.classList.toggle('is-step'); }
    walker.classList.add('is-moving');
    clearTimeout(walker._t);
    walker._t = setTimeout(() => walker.classList.remove('is-moving'), 700);
  });
  walker.style.transform = 'translateX(10px)';

  /* ---------- Lien actif dans la navigation ---------- */
  ['chess', 'projets', 'parcours', 'contact'].forEach((id) => {
    const link = $('.nav__links a[href="#' + id + '"]');
    ScrollTrigger.create({ trigger: '#' + id, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => link.classList.toggle('is-active', st.isActive) });
  });

  /* ---------- Apparitions au défilement ---------- */
  const reveal = (selector, from, to, opts = {}) => {
    ScrollTrigger.batch(selector, {
      start: opts.start || 'top 88%',
      once: true,
      onEnter: (els) => gsap.fromTo(els, from, Object.assign({ autoAlpha: 1, stagger: 0.12, overwrite: true }, to)),
    });
  };
  reveal('main [data-anim="up"]:not(.hero *), .contact [data-anim="up"]', { autoAlpha: 0, y: 34 }, { y: 0, duration: 0.8, ease: 'power3.out' });
  reveal('main [data-anim="pop"]:not(.hero *)', { autoAlpha: 0, scale: 0.5, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.7, ease: 'back.out(2.2)' });
  reveal('[data-anim="card"]', { autoAlpha: 0, y: 90, scale: 0.92, rotation: () => gsap.utils.random(-4, 4) }, { y: 0, scale: 1, rotation: 0, duration: 0.9, ease: 'back.out(1.4)', stagger: 0.14 });
  reveal('[data-anim="save"]', { autoAlpha: 0, x: -50 }, { x: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 }, { start: 'top 90%' });

  // Les grands titres : les lettres tombent et rebondissent
  $$('[data-anim="title"]').forEach((t) => {
    const chars = splitChars(t);
    gsap.set(t, { autoAlpha: 1 });
    gsap.fromTo(chars, { autoAlpha: 0, y: -70, rotation: () => gsap.utils.random(-25, 25) },
      { autoAlpha: 1, y: 0, rotation: 0, duration: 0.8, ease: 'bounce.out', stagger: 0.035, scrollTrigger: { trigger: t, start: 'top 85%', once: true } });
  });

  /* ---------- Chess : bande jaune, niveaux, compteurs ---------- */
  gsap.fromTo('.quest', { clipPath: 'polygon(0 12%, 100% 0, 100% 88%, 0 100%)' },
    { clipPath: 'polygon(0 0%, 100% 0, 100% 100%, 0 100%)', ease: 'none', scrollTrigger: { trigger: '.quest', start: 'top bottom', end: 'top 35%', scrub: true } });

  const lvls = $$('.lvl');
  const xpDone = $('#xpDone');
  ScrollTrigger.create({
    trigger: '#levels', start: 'top 85%', once: true,
    onEnter: () => {
      let done = 0;
      gsap.fromTo(lvls, { autoAlpha: 0, rotationY: 90, scale: 0.7 }, {
        autoAlpha: 1, rotationY: 0, scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.09,
      });
      lvls.forEach((l, i) => {
        if (l.classList.contains('lvl--done')) gsap.delayedCall(0.25 + i * 0.09, () => { done += 1; xpDone.textContent = done; gsap.fromTo(xpDone, { scale: 1.6 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }); });
      });
    },
  });

  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const obj = { v: 0 };
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(obj, { v: end, duration: end > 50 ? 1.6 : 0.9, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(obj.v); } }),
    });
  });

  // Parallaxe douce sur certaines captures
  $$('[data-parallax]').forEach((el) => {
    gsap.fromTo(el, { yPercent: -Number(el.dataset.parallax) }, { yPercent: Number(el.dataset.parallax), ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- Zombie Factory : alternance jour / nuit quand la carte est visible ---------- */
  let zfTimer = null;
  ScrollTrigger.create({
    trigger: zf, start: 'top 80%', end: 'bottom 20%',
    onToggle: (st) => {
      clearInterval(zfTimer);
      if (st.isActive && zfAuto) {
        zfTimer = setInterval(() => {
          if (!zfAuto) return clearInterval(zfTimer);
          const cur = $('.zf__btn.is-on', zf).dataset.mode;
          setZf(cur === 'jour' ? 'nuit' : 'jour');
        }, 3800);
      }
    },
  });

  /* ---------- Galaxy : le workflow s'allume quand il est visible ---------- */
  ScrollTrigger.create({
    trigger: '#flow', start: 'top 85%', end: 'bottom 15%',
    onToggle: (st) => { clearInterval(flowTimer); if (st.isActive) { flowI = 0; flowTick(); flowTimer = setInterval(flowTick, 650); } else { flowSteps.forEach((li) => li.classList.remove('is-lit')); } },
  });

  /* ---------- Parcours : la ligne de vie se dessine ---------- */
  gsap.fromTo('#saves', { '--line': 0 }, { '--line': 1, ease: 'none', scrollTrigger: { trigger: '#saves', start: 'top 75%', end: 'bottom 60%', scrub: true } });

  /* ---------- Cartes : légère inclinaison 3D qui suit la souris ---------- */
  if (finePointer) {
    $$('.card').forEach((card) => {
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      gsap.set(card, { transformPerspective: 1200 });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 5);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 5);
      });
      card.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }

  /* ---------- Pixel art : la marmite fume, le sablier se retourne ---------- */
  gsap.to('.illus__px:not(.illus__px--spin)', { y: -8, duration: 0.9, repeat: -1, yoyo: true, ease: 'steps(3)' });
  gsap.to('.illus__px--spin', { rotation: 180, duration: 0.6, repeat: -1, repeatDelay: 1.6, ease: 'back.inOut(2)' });

  // Recalcule les positions une fois les images chargées
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
