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
    const useMobilePreview = window.matchMedia('(max-width: 700px)').matches && block.mobileSrc;
    const selectedSource = useMobilePreview ? block.mobileSrc : block.src;
    const fallback = element('div', 'media-fallback');
    const fallbackText = element('p', '', '本地预览暂时无法载入，可重新加载或前往 B 站观看 1080P 版本。');
    const retryButton = element('button', 'video-retry', '重新加载视频');
    let automaticRetryUsed = false;

    video.controls = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    // Keep the poster visible without fetching a 25–40 MB clip during page entry.
    // The selected clip is requested only when the visitor explicitly presses play.
    video.preload = 'none';
    video.poster = block.poster;
    video.setAttribute('aria-label', block.title);
    video.src = selectedSource;

    const clearMediaError = () => figure.classList.remove('has-media-error');
    const reloadVideo = () => {
      clearMediaError();
      video.src = selectedSource;
      video.load();
    };
    video.addEventListener('loadedmetadata', clearMediaError);
    video.addEventListener('canplay', clearMediaError);
    video.addEventListener('playing', clearMediaError);
    video.addEventListener('error', () => {
      if (!automaticRetryUsed) {
        automaticRetryUsed = true;
        window.setTimeout(reloadVideo, 700);
        return;
      }
      figure.classList.add('has-media-error');
    });
    retryButton.type = 'button';
    retryButton.addEventListener('click', () => {
      automaticRetryUsed = false;
      reloadVideo();
    });
    fallback.append(fallbackText, retryButton);
    figure.append(video, fallback, createCaption(block.caption));
    const media = section.querySelector('.booklet-spread__media');
    media.append(figure);
    if (block.bilibili) {
      media.append(element('p', 'video-quality-note', '电脑端保留高清本地视频；手机端为保证流畅播放使用轻量预览。可点击 B 站链接观看 1080P 版本。'));
      const fallback = element('a', 'video-fallback-link', '前往 B 站观看 1080P ↗');
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
  const renderInstagramSpread = (block) => {
    const section = createSpread('instagram', block);
    const media = section.querySelector('.booklet-spread__media');
    addBody(media, block.body);

    const experience = element('div', 'instagram-experience');
    const player = element('figure', 'instagram-player');
    const video = element('video');
    video.controls = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    // Posters are enough for browsing; defer each large mobile clip until play.
    video.preload = 'none';
    video.dataset.instagramPlayer = '';

    const details = element('figcaption', 'instagram-player__details');
    const counter = element('span', 'instagram-player__counter');
    const title = element('strong', 'instagram-player__title');
    const song = element('span', 'instagram-player__song');
    const caption = element('p', 'instagram-player__caption');
    details.append(counter, title, song, caption);
    player.append(video, details);

    const controls = element('div', 'instagram-playback-options');
    const continuous = element('input');
    continuous.type = 'checkbox';
    continuous.id = `instagram-continuous-${id}`;
    continuous.dataset.instagramContinuous = '';
    const continuousLabel = element('label', '', '连续播放下一帖');
    continuousLabel.htmlFor = continuous.id;
    controls.append(continuous, continuousLabel, element('span', '', '默认关闭'));

    const selectorList = element('ol', 'instagram-selector-list');
    selectorList.setAttribute('aria-label', '选择手机摄影帖子');
    const buttons = [];
    let currentIndex = 0;

    const selectPost = (nextIndex, shouldPlay = false) => {
      const post = block.posts[nextIndex];
      if (!post) return;
      currentIndex = nextIndex;
      video.pause();
      video.src = post.src;
      video.poster = post.poster;
      video.setAttribute('aria-label', `${post.title}，音乐：${post.song}`);
      if (shouldPlay) video.load();
      counter.textContent = `${String(nextIndex + 1).padStart(2, '0')} / ${String(block.posts.length).padStart(2, '0')}`;
      title.textContent = post.title;
      song.textContent = `♫ ${post.song}`;
      caption.textContent = post.caption || '';
      buttons.forEach((button, index) => {
        const active = index === nextIndex;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
        if (active) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
      if (shouldPlay) {
        video.dataset.chainPending = 'true';
        video.play().then(() => { delete video.dataset.chainPending; }).catch(() => { delete video.dataset.chainPending; });
      }
    };

    block.posts.forEach((post, postIndex) => {
      const item = element('li');
      const button = element('button', 'instagram-selector');
      button.type = 'button';
      button.dataset.instagramSelector = String(postIndex);
      button.setAttribute('aria-label', `播放第 ${postIndex + 1} 帖：${post.title}`);
      const image = element('img');
      image.src = post.poster;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      button.append(image, element('span', 'instagram-selector__number', String(postIndex + 1).padStart(2, '0')), element('strong', '', post.title), element('small', '', post.song));
      button.addEventListener('click', () => selectPost(postIndex, !video.paused && !video.ended));
      buttons.push(button);
      item.append(button);
      selectorList.append(item);
    });

    video.addEventListener('ended', () => {
      if (continuous.checked && currentIndex < block.posts.length - 1) selectPost(currentIndex + 1, true);
    });
    experience.append(player, controls, selectorList);
    media.append(experience);
    selectPost(0);
    return section;
  };
  const renderers = { text: renderTextSpread, video: renderVideoSpread, image: renderImageSpread, gallery: renderGallerySpread, process: renderProcessSpread, reflection: renderReflectionSpread, instagram: renderInstagramSpread };

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
