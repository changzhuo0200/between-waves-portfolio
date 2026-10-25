(() => {
  const hero = document.querySelector('.hero');
  const stage = document.querySelector('.product-stage');
  const ocean = document.querySelector('.ocean');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const enterButton = document.querySelector('.enter-button');
  const enterLabel = document.querySelector('.enter-label');
  const exploreButton = document.querySelector('.explore-link');
  const sleeve = document.querySelector('.sleeve');
  const vinyl = document.querySelector('.vinyl');
  const accessoryButtons = document.querySelectorAll('.liner-card, .poster-card, .lyrics-booklet');
  const objectButtons = document.querySelectorAll('button.object-button');
  const PAGE_TARGETS = window.BETWEEN_WAVES.routes;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let raf = 0;
  let transitionLock = false;

  hero.classList.add('is-booting');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.remove('is-booting')));

  const render = () => {
    currentX += (targetX - currentX) * .065;
    currentY += (targetY - currentY) * .065;
    document.documentElement.style.setProperty('--tilt-x', `${currentY * -3.2}deg`);
    document.documentElement.style.setProperty('--tilt-y', `${currentX * 4.2}deg`);
    if (Math.abs(targetX - currentX) > .001 || Math.abs(targetY - currentY) > .001) raf = requestAnimationFrame(render);
    else raf = 0;
  };

  hero.addEventListener('pointermove', (event) => {
    const x = event.clientX / innerWidth;
    const y = event.clientY / innerHeight;
    document.documentElement.style.setProperty('--mx', `${x * 100}%`);
    document.documentElement.style.setProperty('--my', `${y * 100}%`);
    if (reduced.matches || event.pointerType === 'touch' || innerWidth < 760) return;
    targetX = x - .5;
    targetY = y - .5;
    if (!raf) raf = requestAnimationFrame(render);
  });

  hero.addEventListener('pointerleave', () => {
    targetX = 0;
    targetY = 0;
    if (!raf) raf = requestAnimationFrame(render);
  });

  const clearFocus = () => {
    hero.classList.remove('is-focusing');
    objectButtons.forEach((button) => button.classList.remove('is-active'));
  };

  const setRecordOpen = (open, updateState = true) => {
    stage.classList.toggle('is-record-open', open);
    if (updateState) hero.dataset.state = open ? 'record-open' : (hero.classList.contains('is-exploded') ? 'exploded' : 'idle');
  };

  const setExploded = (open) => {
    clearFocus();
    hero.classList.toggle('is-exploded', open);
    enterLabel.textContent = '点击进入卓畅的作品集';
    exploreButton.textContent = open ? 'CLOSE THE RECORD' : 'EXPLORE THE RECORD';
    exploreButton.setAttribute('aria-pressed', String(open));
    setRecordOpen(open, false);
    hero.dataset.state = open ? 'exploded' : 'idle';
    dispatchEvent(new CustomEvent('betweenwaves:recordstate', { detail: { open } }));
  };

  const focusAndNavigate = (button, target, expandFirst = true) => {
    if (transitionLock || !PAGE_TARGETS[target]) return;
    transitionLock = true;
    if (expandFirst && !hero.classList.contains('is-exploded')) setExploded(true);
    clearFocus();
    hero.classList.add('is-focusing');
    button.classList.add('is-active');
    hero.dataset.state = `focusing-${target}`;

    const focusDelay = reduced.matches ? 0 : 140;
    window.setTimeout(() => {
      hero.classList.add('is-leaving');
      hero.dataset.destination = target;
      document.body.setAttribute('aria-busy', 'true');
    }, focusDelay);

    window.setTimeout(() => {
      location.href = PAGE_TARGETS[target];
    }, focusDelay + (reduced.matches ? 20 : 520));
  };

  const revealOrNavigate = (button, target) => {
    if (transitionLock) return;
    if (!hero.classList.contains('is-exploded')) {
      setExploded(true);
      return;
    }
    focusAndNavigate(button, target, false);
  };

  const toggleExploded = () => {
    if (!transitionLock) setExploded(!hero.classList.contains('is-exploded'));
  };
  enterButton.addEventListener('click', () => revealOrNavigate(sleeve, 'works'));
  exploreButton.addEventListener('click', toggleExploded);

  sleeve.addEventListener('click', () => revealOrNavigate(sleeve, 'works'));
  vinyl.addEventListener('click', () => revealOrNavigate(vinyl, 'sideA'));

  accessoryButtons.forEach((button) => button.addEventListener('click', () => {
    focusAndNavigate(button, button.dataset.target, true);
  }));

  objectButtons.forEach((button) => button.addEventListener('pointerenter', () => {
    const href = PAGE_TARGETS[button.dataset.target];
    if (!href || document.head.querySelector(`link[data-prefetch="${button.dataset.target}"]`)) return;
    const prefetch = document.createElement('link');
    prefetch.rel = 'prefetch';
    prefetch.href = href;
    prefetch.dataset.prefetch = button.dataset.target;
    document.head.append(prefetch);
  }, { once: true }));

  document.querySelectorAll('[data-page-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = link.dataset.pageLink;
      const object = document.querySelector(`[data-target="${target}"]`);
      if (!object || !PAGE_TARGETS[target]) return;
      event.preventDefault();
      focusAndNavigate(object, target, true);
    });
  });

  document.querySelector('.brand').addEventListener('click', () => setExploded(false));

  const resetHome = () => {
    transitionLock = false;
    hero.classList.remove('is-leaving', 'is-returning');
    document.body.removeAttribute('aria-busy');
    delete hero.dataset.destination;
    setExploded(false);

    const cleanUrl = new URL(location.href);
    if (cleanUrl.searchParams.has('state')) {
      cleanUrl.searchParams.delete('state');
      history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    }
  };

  resetHome();
  addEventListener('pageshow', (event) => {
    if (event.persisted) resetHome();
  });

  ocean.addEventListener('error', () => {
    hero.classList.add('has-image-error');
    document.querySelector('.image-fallback').hidden = false;
  });
})();
