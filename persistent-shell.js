(() => {
  window.__BW_PERSISTENT_AUDIO__ = true;

  if (window.top !== window.self) {
    const passiveAudio = document.querySelector('[data-home-music], [data-credits-audio]');
    if (passiveAudio) {
      passiveAudio.pause();
      passiveAudio.removeAttribute('src');
      passiveAudio.load();
    }
    return;
  }

  const assetBase = new URL('.', location.href);
  const continuationTrack = { title: '望月者', src: new URL('assets/audio/ninkiggia-message.mp3', assetBase).href };
  const creditsTracks = [
    { title: '浓雾', src: new URL('assets/audio/congwu-the-ballad.m4a', assetBase).href },
    { title: '岁铃有歌', src: new URL('assets/audio/suiling-youge.mp3', assetBase).href },
    { title: '绮梦夏日', src: new URL('assets/audio/qimeng-xiari.mp3', assetBase).href },
  ];
  const storageKey = 'between-waves-sound-muted';
  const positionKey = 'between-waves-ninkiggia-position';
  const musicVolume = 0.35;
  let muted = localStorage.getItem(storageKey) === 'true';
  let mode = 'continuation';
  let creditIndex = 0;
  let continuationTime = 0;
  let videoActive = false;
  let resumeAfterVideo = false;
  let musicFadeFrame = 0;
  let started = false;
  let activeDocument = document;
  let activeFrame = null;
  let frameSerial = 0;
  let context;
  let waveGain;
  let waveDepth;
  let shoreGain;
  let shoreDepth;

  const audio = document.querySelector('[data-home-music], [data-credits-audio]') || document.createElement('audio');
  audio.hidden = true;
  audio.preload = 'auto';
  audio.playsInline = true;
  audio.setAttribute('playsinline', '');
  if (!audio.isConnected) document.body.append(audio);

  const readSavedPosition = () => {
    try {
      const value = JSON.parse(sessionStorage.getItem(positionKey));
      if (value && Number.isFinite(Number(value.time))) return Number(value.time);
      if (Number.isFinite(Number(value))) return Number(value);
    } catch {
      const value = Number(sessionStorage.getItem(positionKey));
      if (Number.isFinite(value)) return value;
    }
    return 0;
  };

  continuationTime = readSavedPosition();

  const currentTrack = () => mode === 'continuation' ? continuationTrack : creditsTracks[creditIndex];
  const isPlaying = () => !audio.paused && !muted && !videoActive;
  const formatTime = (seconds) => {
    const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  };

  const createOcean = () => {
    if (context) return context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
    const duration = 14;
    const buffer = context.createBuffer(2, context.sampleRate * duration, context.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      let brown = 0;
      for (let index = 0; index < data.length; index += 1) {
        brown = (brown + (Math.random() * 2 - 1) * .012) / 1.012;
        data[index] = Math.max(-1, Math.min(1, brown * 2.1));
      }
    }
    const source = context.createBufferSource();
    const shoreSource = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const shoreFilter = context.createBiquadFilter();
    const master = context.createGain();
    const swell = context.createOscillator();
    const shoreSwell = context.createOscillator();
    waveGain = context.createGain();
    waveDepth = context.createGain();
    shoreGain = context.createGain();
    shoreDepth = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    shoreSource.buffer = buffer;
    shoreSource.loop = true;
    shoreSource.playbackRate.value = .97;
    filter.type = 'lowpass';
    filter.frequency.value = 430;
    filter.Q.value = .18;
    shoreFilter.type = 'bandpass';
    shoreFilter.frequency.value = 880;
    shoreFilter.Q.value = .6;
    master.gain.value = .15;
    waveGain.gain.value = 0;
    waveDepth.gain.value = 0;
    shoreGain.gain.value = 0;
    shoreDepth.gain.value = 0;
    swell.frequency.value = .052;
    shoreSwell.frequency.value = .14;
    source.connect(filter).connect(waveGain).connect(master).connect(context.destination);
    shoreSource.connect(shoreFilter).connect(shoreGain).connect(master);
    swell.connect(waveDepth).connect(waveGain.gain);
    shoreSwell.connect(shoreDepth).connect(shoreGain.gain);
    source.start();
    shoreSource.start(0, 3.4);
    swell.start();
    shoreSwell.start();
    return context;
  };

  const setOcean = async (active) => {
    const audioContext = createOcean();
    if (!audioContext) return;
    if (active && audioContext.state === 'suspended') await audioContext.resume().catch(() => {});
    const now = audioContext.currentTime;
    [[waveGain.gain, active ? .045 : 0], [waveDepth.gain, active ? .015 : 0], [shoreGain.gain, active ? .018 : 0], [shoreDepth.gain, active ? .012 : 0]].forEach(([parameter, target]) => {
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(parameter.value, now);
      parameter.linearRampToValueAtTime(target, now + .45);
    });
  };

  const fadeMusic = (targetVolume, duration = 420, pauseWhenSilent = false) => {
    cancelAnimationFrame(musicFadeFrame);
    const target = Math.max(0, Math.min(1, targetVolume));
    const initial = Number.isFinite(audio.volume) ? audio.volume : musicVolume;
    const startedAt = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / Math.max(1, duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      audio.volume = initial + (target - initial) * eased;
      if (progress < 1) {
        musicFadeFrame = requestAnimationFrame(step);
      } else if (pauseWhenSilent && target === 0) {
        audio.pause();
      }
    };
    musicFadeFrame = requestAnimationFrame(step);
  };

  const pauseOtherVideos = (doc, activeVideo) => {
    doc.querySelectorAll('video').forEach((video) => {
      if (video !== activeVideo && !video.paused) video.pause();
    });
  };

  const updateUI = () => {
    const doc = activeDocument;
    if (!doc) return;
    const playing = isPlaying();
    const homeToggle = doc.querySelector('[data-home-audio-toggle]');
    const homeLabel = doc.querySelector('[data-home-audio-label]');
    if (homeToggle) {
      homeToggle.setAttribute('aria-pressed', String(!muted));
      homeToggle.setAttribute('aria-label', muted ? '恢复背景声音' : '关闭背景声音');
      if (homeLabel) homeLabel.textContent = muted ? 'SOUND OFF' : '望月者 + 轻浪 · 35% / 15%';
    }
    const ambientToggle = doc.querySelector('[data-ambient-audio-toggle]');
    if (ambientToggle) {
      ambientToggle.setAttribute('aria-pressed', String(!muted));
      ambientToggle.setAttribute('aria-label', muted ? '恢复背景声音' : '关闭背景声音');
      const label = ambientToggle.querySelector('[data-ambient-audio-label]');
      if (label) label.textContent = muted ? 'SOUND OFF' : '望月者 + 轻浪 · 35% / 15%';
    }
    const creditsToggle = doc.querySelector('[data-audio-toggle]');
    if (creditsToggle) {
      const track = currentTrack();
      creditsToggle.setAttribute('aria-pressed', String(playing));
      creditsToggle.setAttribute('aria-label', `${playing ? '暂停' : '播放'}背景音乐《${track.title}》`);
      const title = doc.querySelector('[data-audio-title]');
      const state = doc.querySelector('[data-audio-state]');
      if (title) title.textContent = track.title;
      if (state) state.textContent = playing ? `playing … ${formatTime(audio.currentTime)}` : 'paused · tap to play';
      doc.querySelectorAll('[data-audio-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.audioMode === mode)));
    }
  };

  const ensureSource = () => {
    const track = currentTrack();
    if (audio.dataset.trackSrc === track.src) return;
    if (audio.dataset.trackSrc === continuationTrack.src) continuationTime = Number(audio.currentTime) || continuationTime;
    audio.dataset.trackSrc = track.src;
    audio.loop = mode === 'continuation';
    audio.src = track.src;
    audio.load();
    if (mode === 'continuation') {
      const restore = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = continuationTime % audio.duration;
      };
      if (audio.readyState >= 1) restore();
      else audio.addEventListener('loadedmetadata', restore, { once: true });
    }
  };

  const play = async () => {
    ensureSource();
    if (muted || videoActive) {
      audio.pause();
      setOcean(false);
      updateUI();
      return;
    }
    audio.volume = Math.min(audio.volume, musicVolume);
    try {
      await audio.play();
      started = true;
      fadeMusic(musicVolume);
    } catch {
      // Playback starts on the next user gesture when autoplay is restricted.
    }
    setOcean(mode === 'continuation');
    updateUI();
  };

  const pause = () => {
    cancelAnimationFrame(musicFadeFrame);
    if (mode === 'continuation') continuationTime = Number(audio.currentTime) || continuationTime;
    audio.pause();
    setOcean(false);
    updateUI();
  };

  const setMuted = (nextMuted) => {
    muted = nextMuted;
    localStorage.setItem(storageKey, String(muted));
    if (muted) {
      resumeAfterVideo = false;
      pause();
    } else if (videoActive) {
      resumeAfterVideo = true;
      updateUI();
    } else {
      play();
    }
  };

  const switchMode = (nextMode) => {
    if (nextMode === mode) {
      if (muted) setMuted(false);
      else play();
      return;
    }
    if (mode === 'continuation') continuationTime = Number(audio.currentTime) || continuationTime;
    mode = nextMode;
    if (mode === 'credits') creditIndex = 0;
    audio.pause();
    audio.removeAttribute('src');
    audio.removeAttribute('data-track-src');
    play();
  };

  const createAmbientToggle = (doc) => {
    if (doc.querySelector('[data-home-audio-toggle], [data-audio-toggle], [data-ambient-audio-toggle]')) return;
    const toggle = doc.createElement('button');
    toggle.type = 'button';
    toggle.className = 'ambient-sound-toggle';
    toggle.dataset.ambientAudioToggle = '';
    toggle.innerHTML = '<span class="ambient-sound-toggle__bars" aria-hidden="true"><i></i><i></i><i></i></span><span data-ambient-audio-label></span>';
    doc.body.append(toggle);
  };

  const isInternalPage = (url) => {
    if (url.origin !== location.origin) return false;
    const path = url.pathname.toLowerCase();
    return path.endsWith('.html') || path.endsWith('/') || !path.split('/').pop().includes('.');
  };

  const releasePageMedia = (doc) => {
    if (!doc) return;
    doc.querySelectorAll('video').forEach((video) => {
      video.pause();
      video.removeAttribute('src');
      video.querySelectorAll('source').forEach((source) => source.removeAttribute('src'));
      video.load();
    });
  };

  const navigate = (url, push = true) => {
    const target = new URL(url, location.href);
    if (!isInternalPage(target)) {
      location.href = target.href;
      return;
    }
    if (!target.pathname.endsWith('about.html') && mode !== 'continuation') switchMode('continuation');
    if (push) history.pushState({ betweenWavesShell: true }, '', `${target.pathname}${target.search}${target.hash}`);
    const previousFrame = activeFrame;
    releasePageMedia(activeDocument);
    const frame = document.createElement('iframe');
    const serial = ++frameSerial;
    frame.title = 'BETWEEN WAVES 页面内容';
    frame.src = target.href;
    Object.assign(frame.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100dvh', border: '0', margin: '0',
      background: '#03101c', opacity: '0', zIndex: String(2147483000 + serial), transition: 'opacity 360ms ease',
    });
    document.body.append(frame);
    document.body.style.overflow = 'hidden';
    let revealed = false;
    let boundDocument = null;
    const bindFrameContent = () => {
      let childDocument;
      let childURL;
      try {
        childDocument = frame.contentDocument;
        childURL = new URL(frame.contentWindow.location.href);
      } catch {
        return;
      }
      if (!childDocument?.body || childURL.protocol === 'about:' || childURL.origin !== location.origin) return;
      activeFrame = frame;
      activeDocument = childDocument;
      document.title = childDocument.title || document.title;
      bindDocument(childDocument, childURL);
      boundDocument = childDocument;
      const visible = `${childURL.pathname}${childURL.search}${childURL.hash}`;
      const current = `${location.pathname}${location.search}${location.hash}`;
      if (visible !== current) history.pushState({ betweenWavesShell: true }, '', visible);
    };
    const revealFrame = () => {
      if (revealed || !frame.isConnected) return;
      let ready = false;
      try {
        ready = frame.contentDocument?.readyState === 'interactive' || frame.contentDocument?.readyState === 'complete';
      } catch {
        return;
      }
      if (!ready) return;
      bindFrameContent();
      revealed = true;
      requestAnimationFrame(() => { frame.style.opacity = '1'; });
      if (previousFrame && previousFrame !== frame) setTimeout(() => previousFrame.remove(), 260);
      frame.contentWindow.focus();
    };
    const monitor = setInterval(() => {
      if (!frame.isConnected) {
        clearInterval(monitor);
        return;
      }
      try {
        if (frame.contentDocument !== boundDocument) bindFrameContent();
        revealFrame();
      } catch {
        clearInterval(monitor);
      }
    }, 50);
    frame.addEventListener('load', () => {
      bindFrameContent();
      revealFrame();
    });
  };

  const bindDocument = (doc, pageURL = new URL(location.href)) => {
    activeDocument = doc;
    createAmbientToggle(doc);
    const homeToggle = doc.querySelector('[data-home-audio-toggle]');
    const ambientToggle = doc.querySelector('[data-ambient-audio-toggle]');
    const creditsToggle = doc.querySelector('[data-audio-toggle]');
    [homeToggle, ambientToggle].filter(Boolean).forEach((toggle) => {
      if (toggle.dataset.persistentBound) return;
      toggle.dataset.persistentBound = 'true';
      toggle.addEventListener('click', () => setMuted(!muted));
    });
    if (creditsToggle && !creditsToggle.dataset.persistentBound) {
      creditsToggle.dataset.persistentBound = 'true';
      creditsToggle.addEventListener('click', () => setMuted(!audio.paused ? true : false));
    }
    doc.querySelectorAll('[data-audio-mode]').forEach((button) => {
      if (button.dataset.persistentBound) return;
      button.dataset.persistentBound = 'true';
      button.addEventListener('click', () => {
        if (muted) muted = false;
        localStorage.setItem(storageKey, 'false');
        switchMode(button.dataset.audioMode);
      });
    });
    if (!doc.documentElement.dataset.persistentNavigationBound) {
      doc.documentElement.dataset.persistentNavigationBound = 'true';
      doc.addEventListener('play', (event) => {
        if (!(event.target instanceof doc.defaultView.HTMLVideoElement)) return;
        pauseOtherVideos(doc, event.target);
        resumeAfterVideo = resumeAfterVideo || (!muted && !audio.paused);
        videoActive = true;
        setOcean(false);
        fadeMusic(0, 320, true);
        updateUI();
      }, true);
      const releaseVideo = (event) => {
        if (!(event.target instanceof doc.defaultView.HTMLVideoElement)) return;
        window.setTimeout(() => {
          videoActive = [...doc.querySelectorAll('video')].some((item) => (!item.paused && !item.ended) || item.dataset.chainPending === 'true');
          if (!videoActive && !muted && resumeAfterVideo) {
            resumeAfterVideo = false;
            play();
          }
          updateUI();
        }, 120);
      };
      doc.addEventListener('pause', releaseVideo, true);
      doc.addEventListener('ended', releaseVideo, true);
      doc.addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const anchor = event.target.closest?.('a[href]');
        if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
        const url = new URL(anchor.getAttribute('href'), pageURL);
        if (!isInternalPage(url)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (url.pathname === pageURL.pathname && url.search === pageURL.search && url.hash) {
          const target = doc.getElementById(decodeURIComponent(url.hash.slice(1)));
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState({ betweenWavesShell: true }, '', `${url.pathname}${url.search}${url.hash}`);
          return;
        }
        navigate(url, true);
      }, true);
      const activate = () => { if (!muted && !videoActive) play(); };
      doc.addEventListener('pointerdown', activate, { once: true, passive: true });
      doc.addEventListener('keydown', activate, { once: true });
    }
    updateUI();
  };

  audio.addEventListener('timeupdate', () => {
    if (mode === 'continuation') {
      continuationTime = Number(audio.currentTime) || continuationTime;
      sessionStorage.setItem(positionKey, JSON.stringify({ time: continuationTime, at: Date.now(), active: !audio.paused }));
    }
    updateUI();
  });
  audio.addEventListener('play', updateUI);
  audio.addEventListener('pause', updateUI);
  audio.addEventListener('ended', () => {
    if (mode === 'continuation') return;
    creditIndex = (creditIndex + 1 + Math.floor(Math.random() * Math.max(1, creditsTracks.length - 1))) % creditsTracks.length;
    audio.removeAttribute('data-track-src');
    play();
  });
  addEventListener('popstate', () => navigate(location.href, false));
  addEventListener('pagehide', () => {
    if (mode === 'continuation') sessionStorage.setItem(positionKey, JSON.stringify({ time: audio.currentTime, at: Date.now(), active: !audio.paused }));
  });

  ensureSource();
  bindDocument(document);
  if (!muted) play();
})();
