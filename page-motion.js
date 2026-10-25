(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const selector = [
    'main h1', 'main h2', 'main h3', 'main p:not(.image-fallback)',
    'main li', 'main dt', 'main dd', 'main figcaption',
    'body > header .brand', 'body > header nav', 'body > header > p',
    'body > footer > *'
  ].join(',');

  root.classList.add('has-page-motion');

  const reveal = (node) => {
    node.classList.add('is-page-revealed');
    observer?.unobserve(node);
  };

  const observer = !reduced.matches && 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target);
        });
      }, { threshold: .08, rootMargin: '0px 0px -7% 0px' })
    : null;

  const register = (scope = document) => {
    const nodes = scope.matches?.(selector) ? [scope] : [...scope.querySelectorAll?.(selector) ?? []];
    nodes.forEach((node, index) => {
      if (node.dataset.pageReveal !== undefined || node.closest('.reveal')) return;
      node.dataset.pageReveal = '';
      node.style.setProperty('--page-reveal-delay', `${Math.min(index % 5, 4) * 55}ms`);
      if (observer) observer.observe(node);
      else reveal(node);
    });
  };

  register();
  const mutations = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) register(node);
    }));
  });
  mutations.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download') || link.dataset.pageLink !== undefined || link.classList.contains('back-link')) return;
    const next = new URL(link.href, location.href);
    if (next.origin !== location.origin || (next.pathname === location.pathname && next.search === location.search && next.hash)) return;
    event.preventDefault();
    document.body.classList.add('is-page-leaving');
    document.body.setAttribute('aria-busy', 'true');
    window.setTimeout(() => { location.href = next.href; }, reduced.matches ? 0 : 260);
  });

  addEventListener('pageshow', () => {
    document.body.classList.remove('is-page-leaving');
    document.body.removeAttribute('aria-busy');
  });
})();
