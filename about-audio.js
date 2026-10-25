(() => {
  const audio = document.querySelector('[data-credits-audio]');
  const toggle = document.querySelector('[data-audio-toggle]');
  const state = document.querySelector('[data-audio-state]');
  const title = document.querySelector('[data-audio-title]');
  const modeButtons = [...document.querySelectorAll('[data-audio-mode]')];
  if (!audio || !toggle || !state || !title || !modeButtons.length) return;

  const continuationTrack = { title: '望月者', src: 'assets/audio/ninkiggia-message.mp3' };
  const creditsTracks = [
    { title: '浓雾', src: 'assets/audio/congwu-the-ballad.m4a' },
    { title: '岁铃有歌', src: 'assets/audio/suiling-youge.mp3' },
    { title: '绮梦夏日', src: 'assets/audio/qimeng-xiari.mp3' },
  ];
  const storageKey = 'between-waves-sound-muted';
  const positionKey = 'between-waves-ninkiggia-position';
  const targetVolume = 0.35;
  let mode = 'continuation';
  let currentCreditTrack = 0;
  let fadeFrame = 0;
  let shouldResume = false;
  let userPaused = localStorage.getItem(storageKey) === 'true';
  let positionRestored = false;
  const unavailableTracks = new Set();

  const currentTrack = () => mode === 'continuation' ? continuationTrack : creditsTracks[currentCreditTrack];
  const formatTime = (seconds) => {
    const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const minutes = Math.floor(value / 60);
    return `${String(minutes).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  };

  const updateModeButtons = () => {
    modeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.audioMode === mode)));
  };

  const setState = (playing) => {
    const track = currentTrack();
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', `${playing ? '暂停' : '播放'}背景音乐《${track.title}》`);
    title.textContent = track.title;
    state.textContent = playing ? `playing … ${formatTime(audio.currentTime)}` : 'paused · tap to play';
    updateModeButtons();
  };

  const restoreContinuationPosition = () => {
    if (mode !== 'continuation' || positionRestored || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const saved = Number(sessionStorage.getItem(positionKey));
    if (Number.isFinite(saved) && saved > 0) audio.currentTime = saved % audio.duration;
    positionRestored = true;
  };

  const saveContinuationPosition = () => {
    if (mode !== 'continuation' || !positionRestored || !Number.isFinite(audio.currentTime)) return;
    sessionStorage.setItem(positionKey, String(audio.currentTime));
  };

  const waitForMetadata = () => {
    if (audio.readyState >= 1) return Promise.resolve();
    return new Promise((resolve) => {
      audio.addEventListener('loadedmetadata', resolve, { once: true });
      audio.addEventListener('error', resolve, { once: true });
    });
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

  const loadCurrentTrack = () => {
    audio.loop = mode === 'continuation';
    audio.src = currentTrack().src;
    positionRestored = false;
    audio.load();
    setState(false);
  };

  const play = async () => {
    if (!audio.paused) return;
    await waitForMetadata();
    restoreContinuationPosition();
    audio.volume = 0;
    try {
      await audio.play();
      setState(true);
      fadeTo(targetVolume, 1400);
    } catch {
      setState(false);
    }
  };

  const pause = (onComplete) => {
    if (audio.paused) {
      onComplete?.();
      return;
    }
    fadeTo(0, 400, () => {
      audio.pause();
      setState(false);
      onComplete?.();
    });
  };

  const switchMode = (nextMode) => {
    userPaused = false;
    localStorage.setItem(storageKey, 'false');
    if (nextMode === mode) {
      play();
      return;
    }
    saveContinuationPosition();
    pause(() => {
      mode = nextMode;
      if (mode === 'credits') currentCreditTrack = 0;
      loadCurrentTrack();
      play();
    });
  };

  modeButtons.forEach((button) => button.addEventListener('click', () => switchMode(button.dataset.audioMode)));
  toggle.addEventListener('click', () => {
    if (audio.paused) {
      userPaused = false;
      localStorage.setItem(storageKey, 'false');
      play();
    } else {
      userPaused = true;
      localStorage.setItem(storageKey, 'true');
      saveContinuationPosition();
      pause();
    }
  });

  audio.addEventListener('loadedmetadata', restoreContinuationPosition);
  audio.addEventListener('timeupdate', () => {
    saveContinuationPosition();
    if (!audio.paused) state.textContent = `playing … ${formatTime(audio.currentTime)}`;
  });
  audio.addEventListener('play', () => setState(true));
  audio.addEventListener('pause', () => setState(false));
  audio.addEventListener('canplay', () => {
    if (!userPaused && audio.paused) play();
  });
  audio.addEventListener('ended', () => {
    if (mode === 'continuation') return;
    const candidates = creditsTracks.map((_, index) => index).filter((index) => index !== currentCreditTrack && !unavailableTracks.has(index));
    if (!candidates.length) return;
    currentCreditTrack = candidates[Math.floor(Math.random() * candidates.length)];
    loadCurrentTrack();
    play();
  });
  audio.addEventListener('error', () => {
    if (mode === 'continuation') {
      state.textContent = 'audio unavailable';
      return;
    }
    unavailableTracks.add(currentCreditTrack);
    const candidates = creditsTracks.map((_, index) => index).filter((index) => !unavailableTracks.has(index));
    if (!candidates.length) {
      state.textContent = 'audio unavailable';
      return;
    }
    currentCreditTrack = candidates[0];
    loadCurrentTrack();
    play();
  });

  const startAfterFirstInteraction = (event) => {
    if (event.target.closest?.('[data-audio-toggle], [data-audio-mode]')) return;
    play();
  };
  addEventListener('pointerdown', startAfterFirstInteraction, { once: true, passive: true });
  addEventListener('keydown', startAfterFirstInteraction, { once: true });
  addEventListener('pagehide', saveContinuationPosition);
  addEventListener('pageshow', () => {
    if (!userPaused && audio.paused) play();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      shouldResume = !audio.paused;
      if (shouldResume) pause();
    } else if (shouldResume && !userPaused) {
      shouldResume = false;
      play();
    }
  });

  audio.autoplay = true;
  loadCurrentTrack();
  if (!userPaused) play();
})();
