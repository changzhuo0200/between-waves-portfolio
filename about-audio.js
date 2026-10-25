(() => {
  const audio = document.querySelector('[data-credits-audio]');
  const toggle = document.querySelector('[data-audio-toggle]');
  const state = document.querySelector('[data-audio-state]');
  if (!audio || !toggle || !state) return;

  const targetVolume = 0.12;
  let fadeFrame = 0;
  let shouldResume = false;

  const formatTime = (seconds) => {
    const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const minutes = Math.floor(value / 60);
    return `${String(minutes).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  };

  const setState = (playing) => {
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', `${playing ? '暂停' : '播放'}背景音乐《浓雾》`);
    state.textContent = playing ? `playing … ${formatTime(audio.currentTime)}` : 'paused · tap to play';
  };

  const fadeTo = (to, duration = 1200, onComplete) => {
    cancelAnimationFrame(fadeFrame);
    const from = audio.volume;
    const started = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * eased));
      if (progress < 1) fadeFrame = requestAnimationFrame(frame);
      else onComplete?.();
    };
    fadeFrame = requestAnimationFrame(frame);
  };

  const play = async () => {
    if (!audio.paused) return;
    audio.volume = 0;
    try {
      await audio.play();
      setState(true);
      fadeTo(targetVolume, 1600);
    } catch {
      setState(false);
    }
  };

  const pause = () => {
    if (audio.paused) return;
    fadeTo(0, 500, () => {
      audio.pause();
      setState(false);
    });
  };

  toggle.addEventListener('click', () => {
    if (audio.paused) play();
    else pause();
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.paused) state.textContent = `playing … ${formatTime(audio.currentTime)}`;
  });
  audio.addEventListener('play', () => setState(true));
  audio.addEventListener('pause', () => setState(false));

  const startAfterFirstInteraction = (event) => {
    if (event.target.closest?.('[data-audio-toggle]')) return;
    play();
  };
  window.addEventListener('pointerdown', startAfterFirstInteraction, { once: true, passive: true });
  window.addEventListener('keydown', startAfterFirstInteraction, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      shouldResume = !audio.paused;
      if (shouldResume) pause();
    } else if (shouldResume) {
      shouldResume = false;
      play();
    }
  });

  setState(false);
  play();
})();
