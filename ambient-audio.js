(() => {
  if (window.__BW_PERSISTENT_AUDIO__) return;
  if (document.querySelector('[data-ambient-audio-toggle]')) return;

  const storageKey = 'between-waves-sound-muted';
  const positionKey = 'between-waves-ninkiggia-position';
  const musicVolume = 0.35;
  let muted = localStorage.getItem(storageKey) === 'true';
  let videoActive = false;
  let context;
  let waveGain;
  let waveDepth;
  let shoreGain;
  let shoreDepth;
  let musicFadeFrame = 0;
  let positionRestored = false;
  let resumedFromPreviousPage = false;

  const music = document.createElement('audio');
  music.src = 'assets/audio/ninkiggia-message.mp3';
  music.loop = true;
  music.preload = 'auto';
  music.playsInline = true;
  music.hidden = true;
  document.body.append(music);

  const readSavedPosition = () => {
    const raw = sessionStorage.getItem(positionKey);
    if (!raw) return null;
    try {
      const saved = JSON.parse(raw);
      if (saved && typeof saved === 'object' && Number.isFinite(Number(saved.time))) return saved;
      if (Number.isFinite(Number(saved))) return { time: Number(saved), at: 0, active: false };
    } catch {
      const legacyTime = Number(raw);
      if (Number.isFinite(legacyTime)) return { time: legacyTime, at: 0, active: false };
    }
    return null;
  };

  const restoreMusicPosition = () => {
    if (positionRestored || !Number.isFinite(music.duration) || music.duration <= 0) return;
    const saved = readSavedPosition();
    if (saved && Number(saved.time) > 0) {
      const elapsed = saved.active && Number(saved.at) > 0 ? Math.min(10, Math.max(0, (Date.now() - Number(saved.at)) / 1000)) : 0;
      music.currentTime = (Number(saved.time) + elapsed) % music.duration;
      resumedFromPreviousPage = true;
    }
    positionRestored = true;
  };

  const waitForMetadata = () => {
    if (music.readyState >= 1) return Promise.resolve();
    return new Promise((resolve) => {
      music.addEventListener('loadedmetadata', resolve, { once: true });
      music.addEventListener('error', resolve, { once: true });
    });
  };

  const saveMusicPosition = (active = !music.paused && !muted && !videoActive) => {
    if (!positionRestored || !Number.isFinite(music.currentTime)) return;
    sessionStorage.setItem(positionKey, JSON.stringify({ time: music.currentTime, at: Date.now(), active: Boolean(active) }));
  };

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'ambient-sound-toggle';
  toggle.dataset.ambientAudioToggle = '';
  toggle.innerHTML = '<span class="ambient-sound-toggle__bars" aria-hidden="true"><i></i><i></i><i></i></span><span data-ambient-audio-label></span>';
  document.body.append(toggle);
  const label = toggle.querySelector('[data-ambient-audio-label]');

  const updateToggle = () => {
    toggle.setAttribute('aria-pressed', String(!muted));
    toggle.setAttribute('aria-label', muted ? '恢复岸边轻浪环境音' : '关闭岸边轻浪环境音');
    label.textContent = muted ? 'SOUND OFF' : '望月者 + 轻浪 · 35% / 15%';
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
    const compressor = context.createDynamicsCompressor();
    const swell = context.createOscillator();
    const shoreSwell = context.createOscillator();
    waveDepth = context.createGain();
    waveGain = context.createGain();
    shoreDepth = context.createGain();
    shoreGain = context.createGain();

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
    compressor.threshold.value = -28;
    compressor.knee.value = 24;
    compressor.ratio.value = 4;
    compressor.attack.value = .04;
    compressor.release.value = .55;
    waveGain.gain.value = 0;
    waveDepth.gain.value = 0;
    shoreGain.gain.value = 0;
    shoreDepth.gain.value = 0;
    swell.type = 'sine';
    swell.frequency.value = .052;
    shoreSwell.type = 'sine';
    shoreSwell.frequency.value = .14;

    source.connect(filter).connect(waveGain).connect(master);
    shoreSource.connect(shoreFilter).connect(shoreGain).connect(master);
    master.connect(compressor).connect(context.destination);
    swell.connect(waveDepth).connect(waveGain.gain);
    shoreSwell.connect(shoreDepth).connect(shoreGain.gain);
    source.start();
    shoreSource.start(0, 3.4);
    swell.start();
    shoreSwell.start();
    return context;
  };

  const fadeMusicTo = (volume, duration = 1200, pauseAfter = false) => {
    cancelAnimationFrame(musicFadeFrame);
    const from = music.volume;
    const started = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      music.volume = Math.max(0, Math.min(1, from + (volume - from) * eased));
      if (progress < 1) musicFadeFrame = requestAnimationFrame(frame);
      else if (pauseAfter) music.pause();
    };
    musicFadeFrame = requestAnimationFrame(frame);
  };

  const playMusic = async () => {
    if (!music.paused) {
      fadeMusicTo(musicVolume, 1000);
      return;
    }
    await waitForMetadata();
    restoreMusicPosition();
    music.volume = resumedFromPreviousPage ? musicVolume : 0;
    try {
      await music.play();
      if (!resumedFromPreviousPage) fadeMusicTo(musicVolume, 1100);
    } catch {
      // Browsers may wait for the first user gesture; the shared listeners retry.
    }
  };

  const setOceanLevel = async (active) => {
    const audioContext = createOcean();
    if (!audioContext || !waveGain || !waveDepth || !shoreGain || !shoreDepth) return;
    if (active && audioContext.state === 'suspended') await audioContext.resume().catch(() => {});
    const now = audioContext.currentTime;
    const targets = [
      [waveGain.gain, active ? .045 : 0],
      [waveDepth.gain, active ? .015 : 0],
      [shoreGain.gain, active ? .018 : 0],
      [shoreDepth.gain, active ? .012 : 0],
    ];
    targets.forEach(([parameter, value]) => {
      parameter.cancelScheduledValues(now);
      parameter.setValueAtTime(parameter.value, now);
      parameter.linearRampToValueAtTime(value, now + (active ? .55 : .45));
    });
  };

  const activate = () => {
    updateToggle();
    const active = !muted && !videoActive;
    setOceanLevel(active);
    if (active) playMusic();
    else fadeMusicTo(0, 450, true);
  };

  toggle.addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem(storageKey, String(muted));
    if (muted) saveMusicPosition(false);
    activate();
  });

  const startAfterFirstInteraction = () => activate();
  addEventListener('pointerdown', startAfterFirstInteraction, { once: true, passive: true });
  addEventListener('keydown', startAfterFirstInteraction, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      setOceanLevel(false);
      fadeMusicTo(0, 350, true);
    }
    else if (!muted) activate();
  });
  music.addEventListener('loadedmetadata', restoreMusicPosition, { once: true });
  music.addEventListener('timeupdate', () => saveMusicPosition(!music.paused && !muted && !videoActive));
  document.addEventListener('pointerdown', (event) => {
    if (event.target.closest?.('a[href]')) saveMusicPosition(!muted && !videoActive);
  }, { capture: true, passive: true });
  addEventListener('pagehide', () => saveMusicPosition(!muted && !videoActive));

  document.addEventListener('play', (event) => {
    if (event.target instanceof HTMLVideoElement) {
      videoActive = true;
      saveMusicPosition(false);
      activate();
    }
  }, true);
  const releaseVideoAudio = () => {
    videoActive = Array.from(document.querySelectorAll('video')).some((video) => !video.paused && !video.ended);
    if (!videoActive) activate();
  };
  document.addEventListener('pause', (event) => {
    if (event.target instanceof HTMLVideoElement) releaseVideoAudio();
  }, true);
  document.addEventListener('ended', (event) => {
    if (event.target instanceof HTMLVideoElement) releaseVideoAudio();
  }, true);

  updateToggle();
  if (!muted) activate();
})();
