(() => {
  const hero = document.querySelector('.hero');
  const music = document.querySelector('[data-home-music]');
  const toggle = document.querySelector('[data-home-audio-toggle]');
  const label = document.querySelector('[data-home-audio-label]');
  if (!hero || !music || !toggle || !label) return;

  const musicVolume = 0.35;
  let muted = false;
  let mode = hero.classList.contains('is-exploded') ? 'music' : 'waves';
  let context;
  let waveGain;
  let waveDepth;
  let musicFadeFrame = 0;

  const updateToggle = () => {
    const activeLabel = mode === 'music' ? '望月者的心愿' : '海浪';
    toggle.setAttribute('aria-pressed', String(!muted));
    toggle.setAttribute('aria-label', muted ? '恢复背景声音' : '关闭背景声音');
    label.textContent = muted ? 'SOUND OFF' : `${activeLabel} · 35%`;
  };

  const createOcean = () => {
    if (context) return context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();

    const duration = 9;
    const buffer = context.createBuffer(2, context.sampleRate * duration, context.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      let brown = 0;
      for (let index = 0; index < data.length; index += 1) {
        const white = Math.random() * 2 - 1;
        brown = (brown + white * .018) / 1.018;
        data[index] = Math.max(-1, Math.min(1, brown * 3.2));
      }
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const master = context.createGain();
    const swell = context.createOscillator();
    waveDepth = context.createGain();
    waveGain = context.createGain();

    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 720;
    filter.Q.value = .25;
    master.gain.value = .35;
    waveGain.gain.value = 0;
    waveDepth.gain.value = 0;
    swell.type = 'sine';
    swell.frequency.value = .075;

    source.connect(filter).connect(waveGain).connect(master).connect(context.destination);
    swell.connect(waveDepth).connect(waveGain.gain);
    source.start();
    swell.start();
    return context;
  };

  const setOceanLevel = (active) => {
    const audioContext = createOcean();
    if (!audioContext || !waveGain || !waveDepth) return;
    const now = audioContext.currentTime;
    waveGain.gain.cancelScheduledValues(now);
    waveDepth.gain.cancelScheduledValues(now);
    waveGain.gain.setValueAtTime(waveGain.gain.value, now);
    waveDepth.gain.setValueAtTime(waveDepth.gain.value, now);
    waveGain.gain.linearRampToValueAtTime(active ? .12 : 0, now + 1.25);
    waveDepth.gain.linearRampToValueAtTime(active ? .065 : 0, now + 1.25);
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

    if (mode === 'waves') {
      const audioContext = createOcean();
      if (audioContext?.state === 'suspended') await audioContext.resume().catch(() => {});
      setOceanLevel(true);
      if (!music.paused) fadeMusicTo(0, 900, true);
    } else {
      setOceanLevel(false);
      if (music.paused) playMusic();
      else fadeMusicTo(musicVolume, 1200);
    }
  };

  toggle.addEventListener('click', () => {
    muted = !muted;
    activateMode();
  });

  addEventListener('betweenwaves:recordstate', (event) => {
    mode = event.detail?.open ? 'music' : 'waves';
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
