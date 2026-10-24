(() => {
  const routes = window.BETWEEN_WAVES?.routes ?? {
    home: 'index.html', works: 'works.html', sideA: 'works.html?side=a',
    sideB: 'works.html?side=b', bonus: 'bonus.html', about: 'about.html',
  };
  const items = [
    ['01', '首页', routes.home],
    ['02', '作品', routes.works],
    ['03', 'SIDE A', routes.sideA],
    ['04', 'SIDE B', routes.sideB],
    ['05', '附加曲目', routes.bonus],
    ['06', '关于', routes.about],
  ];
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'menu-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'mobile-menu');
  trigger.textContent = 'MENU';

  const shell = document.createElement('div');
  shell.className = 'mobile-menu-shell';
  shell.hidden = true;
  shell.innerHTML = `<div class="mobile-menu-backdrop" data-menu-close></div>
    <section id="mobile-menu" class="mobile-menu" role="dialog" aria-modal="true" aria-label="主要导航">
      <button class="mobile-menu__close" type="button" data-menu-close>CLOSE ×</button>
      <p>BETWEEN WAVES · EDITION 01</p>
      <nav>${items.map(([code, label, href]) => `<a href="${href}"><small>${code}</small><span>${label}</span></a>`).join('')}</nav>
      <footer>BV — 1837 — 01</footer>
    </section>`;

  document.body.append(trigger, shell);
  let previouslyFocused = null;
  const focusable = () => [...shell.querySelectorAll('a,button:not([disabled])')];
  const open = () => {
    previouslyFocused = document.activeElement;
    shell.hidden = false;
    document.body.classList.add('menu-open');
    trigger.setAttribute('aria-expanded', 'true');
    focusable()[0]?.focus();
  };
  const close = () => {
    shell.hidden = true;
    document.body.classList.remove('menu-open');
    trigger.setAttribute('aria-expanded', 'false');
    previouslyFocused?.focus();
  };
  trigger.addEventListener('click', open);
  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-menu-close]') || event.target.closest('a')) close();
  });
  document.addEventListener('keydown', (event) => {
    if (shell.hidden) return;
    if (event.key === 'Escape') { close(); return; }
    if (event.key !== 'Tab') return;
    const nodes = focusable();
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
})();
