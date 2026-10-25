(() => {
  const PAGES = Object.freeze({
    research: {
      code: 'A / SOFT SYSTEMS · RESEARCH', title: 'Research', zh: '研究',
      copy: '从声音、叙事和系统出发，记录作品形成以前的观察、试验与方法。唱片从封套中抽出，代表尚未被固定的想法进入可听见、可讨论的状态。',
      image: 'assets/home/vinyl-label-fast.jpg', alt: 'BETWEEN WAVES 唱片标签', visual: 'disc',
    },
    content: {
      code: 'B / READ ME CORRECTLY · CONTENT', title: 'Contents', zh: '内容',
      copy: '文章、项目与叙事被整理为可以翻阅的档案卡。每一张卡片是一段被截取的潮汐，也是一种重新进入作品语境的方式。',
      image: 'assets/home/poster-card-fast.jpg', alt: '内容档案海报卡', visual: 'paper',
    },
    multimedia: {
      code: '+ / OPEN TABS · MULTIMEDIA', title: 'Posters', zh: '多媒体',
      copy: '动态图像、声音与海报像唱片套装中的赠品一样从封套后方展开。它们不是装饰，而是同一主题在不同媒介中的折射。',
      image: 'assets/home/poster-card-fast.jpg', alt: 'BETWEEN WAVES 多媒体海报', visual: 'paper',
    },
    lyrics: {
      code: 'LN / LINER NOTES · LYRICS', title: 'Liner Notes', zh: '歌词本',
      copy: '歌词本从套装右下方展开，对应文字、笔记与创作过程。这里保留作品没有在封面上说完的部分。',
      image: 'assets/home/lyrics-booklet-fast.jpg', alt: '打开的歌词本内页', visual: 'booklet',
    },
    about: {
      code: 'CR / CREDITS · ABOUT', title: 'Credits', zh: '关于',
      copy: 'A personal archive in sound, image and word. BETWEEN WAVES 将个人经历整理成一套可以被展开、触摸与继续播放的视觉唱片。',
      image: 'assets/home/sleeve-fast.jpg', alt: 'BETWEEN WAVES 封面档案', visual: 'sleeve',
    },
  });

  const body = document.body;
  const key = body.dataset.page;
  const page = PAGES[key];
  if (!page) return;

  document.title = `${page.title} — BETWEEN WAVES`;
  document.querySelector('[data-bind="code"]').textContent = page.code;
  document.querySelector('[data-bind="title"]').textContent = page.title;
  document.querySelector('[data-bind="zh"]').textContent = page.zh;
  document.querySelector('[data-bind="copy"]').textContent = page.copy;
  const image = document.querySelector('[data-bind="image"]');
  image.src = page.image;
  image.alt = page.alt;
  image.decoding = 'async';
  image.fetchPriority = 'high';
  document.querySelector('.archive-visual').dataset.visual = page.visual;
  document.querySelector(`[data-nav="${key}"]`)?.setAttribute('aria-current', 'page');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const returnLink = document.querySelector('.back-link');
  returnLink.addEventListener('click', (event) => {
    if (reduced.matches) return;
    event.preventDefault();
    body.classList.add('is-returning-home');
    body.setAttribute('aria-busy', 'true');
    window.setTimeout(() => { location.href = returnLink.href; }, 520);
  });

  addEventListener('pageshow', () => {
    body.classList.remove('is-returning-home');
    body.removeAttribute('aria-busy');
    requestAnimationFrame(() => body.classList.add('is-ready'));
  });
})();
