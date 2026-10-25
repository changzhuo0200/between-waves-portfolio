(() => {
  const hero = document.querySelector('.hero');
  const music = document.querySelector('[data-home-music]');
  const toggle = document.querySelector('[data-home-audio-toggle]');
  const label = document.querySelector('[data-home-audio-label]');
  if (!hero || !music || !toggle || !label) return;

  const musicVolume = 0.35;
  const storageKey = 'between-waves-sound-muted';
  let muted = localStorage.getItem(storageKey) === 'true';
  let context;
  let waveGain;
  let waveDepth;
  let shoreGain;
  let shoreDepth;
  let musicFadeFrame = 0;

  const updateToggle = () => {
    toggle.setAttribute('aria-pressed', String(!muted));
    toggle.setAttribute('aria-label', muted ? '恢复背景声音' : '关闭背景声音');
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
        const white = Math.random() * 2 - 1;
        brown = (brown + white * .012) / 1.012;
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

  const setOceanLevel = (active) => {
    const audioContext = createOcean();
    if (!audioContext || !waveGain || !waveDepth || !shoreGain || !shoreDepth) return;
    const now = audioContext.currentTime;
    waveGain.gain.cancelScheduledValues(now);
    waveDepth.gain.cancelScheduledValues(now);
    shoreGain.gain.cancelScheduledValues(now);
    shoreDepth.gain.cancelScheduledValues(now);
    waveGain.gain.setValueAtTime(waveGain.gain.value, now);
    waveDepth.gain.setValueAtTime(waveDepth.gain.value, now);
    shoreGain.gain.setValueAtTime(shoreGain.gain.value, now);
    shoreDepth.gain.setValueAtTime(shoreDepth.gain.value, now);
    waveGain.gain.linearRampToValueAtTime(active ? .045 : 0, now + 1.6);
    waveDepth.gain.linearRampToValueAtTime(active ? .015 : 0, now + 1.6);
    shoreGain.gain.linearRampToValueAtTime(active ? .018 : 0, now + 1.6);
    shoreDepth.gain.linearRampToValueAtTime(active ? .012 : 0, now + 1.6);
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
    music.volume = 0;
    try {
      await music.play();
      fadeMusicTo(musicVolume, 1500);
    } catch {
      updateToggle();
    }
  };

  const activateMode = async () => {
    updateToggle();
    if (muted) {
      setOceanLevel(false);
      fadeMusicTo(0, 450, true);
      return;
    }

    const audioContext = createOcean();
    if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
    setOceanLevel(true);
    if (music.paused) playMusic();
    else fadeMusicTo(musicVolume, 1200);
  };

  toggle.addEventListener('click', () => {
    muted = !muted;
    localStorage.setItem(storageKey, String(muted));
    activateMode();
  });

  addEventListener('betweenwaves:recordstate', (event) => {
    activateMode();
  });

  const startAfterFirstInteraction = (event) => {
    if (event.target.closest?.('[data-home-audio-toggle]')) return;
    activateMode();
  };
  addEventListener('pointerdown', startAfterFirstInteraction, { once: true, passive: true });
  addEventListener('keydown', startAfterFirstInteraction, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      setOceanLevel(false);
      if (!music.paused) fadeMusicTo(0, 350, true);
    } else if (!muted) {
      activateMode();
    }
  });

  updateToggle();
  activateMode();
})();
