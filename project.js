(() => {
  const tracks = window.BETWEEN_WAVES.tracks;
  const id = new URLSearchParams(location.search).get('track');
  const index = tracks.findIndex((track) => track.id === id);
  const track = tracks[index];
  const project = window.BETWEEN_WAVES_PROJECTS[id];
  if (!track || !project || track.id === 'b01') { location.replace(track?.href ?? 'works.html'); return; }
  document.body.dataset.project = id;

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const createCaption = (text) => element('figcaption', '', text || '');
  const createSpread = (type, block) => {
    const section = element('section', `booklet-spread booklet-spread--${type}`);
    const copy = element('div', 'booklet-spread__copy');
    copy.append(element('span', 'booklet-spread__eyebrow', block.eyebrow), element('h2', '', block.title));
    const media = element('div', 'booklet-spread__media');
    section.append(copy, media);
    return section;
  };
  const addBody = (container, body) => {
    const paragraphs = Array.isArray(body) ? body : [body];
    paragraphs.filter(Boolean).forEach((text) => container.append(element('p', '', text)));
  };
  const addSourceLink = (container, link) => {
    if (!link?.href) return;
    const anchor = element('a', 'project-source-link', `${link.label || '查看项目'} ↗`);
    anchor.href = link.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    container.append(anchor);
  };
  const imageFigure = (block) => {
    const figure = element('figure', 'booklet-figure');
    const image = element('img');
    image.src = block.src;
    image.alt = block.alt || '';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => { figure.classList.add('has-media-error'); image.hidden = true; });
    figure.append(image, element('p', 'media-fallback', '图像暂时无法载入。'), createCaption(block.caption));
    return figure;
  };
  const renderTextSpread = (block) => {
    const section = createSpread('text', block);
    addBody(section.querySelector('.booklet-spread__media'), block.body);
    return section;
  };
  const renderVideoSpread = (block) => {
    const section = createSpread('video', block);
    const figure = element('figure', 'booklet-figure booklet-video');
    const video = element('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.poster = block.poster;
    video.setAttribute('aria-label', block.title);
    const source = element('source');
    source.src = block.src;
    source.type = 'video/mp4';
    source.addEventListener('error', () => figure.classList.add('has-media-error'));
    video.append(source);
    figure.append(video, element('p', 'media-fallback', '视频暂时无法载入，请稍后重试。'), createCaption(block.caption));
    const media = section.querySelector('.booklet-spread__media');
    media.append(figure);
    if (block.bilibili) {
      const fallback = element('a', 'video-fallback-link', 'B 站备用观看 ↗');
      fallback.href = block.bilibili;
      fallback.target = '_blank';
      fallback.rel = 'noopener noreferrer';
      fallback.setAttribute('aria-label', `在 B 站观看：${block.title}`);
      media.append(fallback);
    }
    return section;
  };
  const renderImageSpread = (block) => {
    const section = createSpread('image', block);
    const media = section.querySelector('.booklet-spread__media');
    addBody(media, block.body);
    media.append(imageFigure(block));
    addSourceLink(media, block.link);
    return section;
  };
  const renderGallerySpread = (block) => {
    const section = createSpread('gallery', block);
    const media = section.querySelector('.booklet-spread__media');
    addBody(media, block.body);
    const gallery = element('div', 'booklet-gallery');
    block.items.forEach((item) => gallery.append(imageFigure(item)));
    media.append(gallery);
    addSourceLink(media, block.link);
    return section;
  };
  const renderProcessSpread = (block) => {
    const section = createSpread('process', block);
    const media = section.querySelector('.booklet-spread__media');
    addBody(media, block.body);
    const list = element('ol', 'process-list');
    block.steps.forEach((step, stepIndex) => {
      const item = element('li');
      const content = element('div', 'process-list__content');
      if (typeof step === 'string') {
        content.append(element('p', '', step));
      } else {
        content.append(element('h3', '', step.title), element('p', '', step.body));
      }
      item.append(element('b', '', String(stepIndex + 1).padStart(2, '0')), content);
      list.append(item);
    });
    media.append(list);
    return section;
  };
  const renderReflectionSpread = (block) => {
    const section = createSpread('reflection', block);
    addBody(section.querySelector('.booklet-spread__media'), block.body);
    return section;
  };
  const renderers = { text: renderTextSpread, video: renderVideoSpread, image: renderImageSpread, gallery: renderGallerySpread, process: renderProcessSpread, reflection: renderReflectionSpread };

  document.title = `${track.title} — BETWEEN WAVES`;
  document.querySelector('[data-project-code]').textContent = `${track.code} · ${track.side === 'bonus' ? 'BONUS TRACK' : `SIDE ${track.side.toUpperCase()}`}`;
  document.querySelector('[data-project-title]').textContent = track.title;
  document.querySelector('[data-project-intro]').textContent = project.intro;
  document.querySelector('[data-project-year]').textContent = track.year;
  document.querySelector('[data-project-medium]').textContent = track.medium;
  document.querySelector('[data-project-role]').textContent = project.role;
  const spreads = document.querySelector('#project-spreads');
  project.blocks.forEach((block) => spreads.append((renderers[block.type] || renderTextSpread)(block)));

  const previous = tracks[(index - 1 + tracks.length) % tracks.length];
  const next = tracks[(index + 1) % tracks.length];
  const previousLink = document.querySelector('[data-project-previous]');
  const nextLink = document.querySelector('[data-project-next]');
  previousLink.href = previous.href;
  previousLink.textContent = `PREVIOUS · ${previous.code}`;
  nextLink.href = next.href;
  nextLink.textContent = `NEXT · ${next.code}`;
})();
