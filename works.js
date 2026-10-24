(() => {
  const { tracks } = window.BETWEEN_WAVES;
  const list = document.querySelector('#track-list');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const preview = {
    disc: document.querySelector('.preview-disc'), code: document.querySelector('[data-preview-code]'),
    title: document.querySelector('[data-preview-title]'), copy: document.querySelector('[data-preview-copy]'),
    link: document.querySelector('[data-preview-link]'),
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const discLabel = preview.disc.querySelector('[data-disc-label]');
  let activeSide = 'a';

  const applyDiscSide = (side) => {
    activeSide = ['a', 'b', 'bonus'].includes(side) ? side : 'a';
    preview.disc.dataset.side = activeSide;
    discLabel.textContent = activeSide === 'bonus' ? 'BONUS' : `SIDE ${activeSide.toUpperCase()}`;
  };

  const transitionDisc = (side) => {
    const next = ['a', 'b', 'bonus'].includes(side) ? side : 'a';
    if (next === activeSide || reduced.matches || next === 'bonus' || activeSide === 'bonus') {
      applyDiscSide(next);
      return;
    }
    preview.disc.classList.add('is-flipping');
    window.setTimeout(() => {
      applyDiscSide(next);
      preview.disc.classList.remove('is-flipping');
    }, 180);
  };

  const setPreview = (track) => {
    transitionDisc(track.side);
    preview.code.textContent = track.ongoing ? `${track.code} · ONGOING` : track.code;
    preview.title.textContent = track.title;
    preview.copy.textContent = track.preview;
    preview.link.href = track.href;
  };

  const render = (filter) => {
    const visible = filter === 'all' ? tracks : tracks.filter((track) => track.side === filter);
    list.replaceChildren(...visible.map((track) => {
      const item = document.createElement('li');
      item.className = 'track-row';
      item.innerHTML = `<a href="${track.href}" data-track="${track.id}"><span>${track.code}</span><strong>${track.title}</strong>${track.subtitle ? `<small>${track.subtitle}</small>` : ''}<em>${track.year} · ${track.medium}</em></a>`;
      const link = item.querySelector('a');
      link.addEventListener('mouseenter', () => setPreview(track));
      link.addEventListener('focus', () => setPreview(track));
      return item;
    }));
    if (visible[0]) setPreview(visible[0]);
  };

  filters.forEach((button) => button.addEventListener('click', () => {
    filters.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    history.replaceState(null, '', button.dataset.filter === 'all' ? 'works.html' : `works.html?side=${button.dataset.filter}`);
    render(button.dataset.filter);
  }));

  const requested = new URLSearchParams(location.search).get('side');
  const initial = ['a', 'b', 'bonus'].includes(requested) ? requested : 'all';
  filters.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.filter === initial)));
  render(initial);
})();
