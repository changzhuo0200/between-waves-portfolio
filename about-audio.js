(() => {
  const audio = document.querySelector('[data-credits-audio]');
  const toggle = document.querySelector('[data-audio-toggle]');
  const state = document.querySelector('[data-audio-state]');
  const title = document.querySelector('[data-audio-title]');
  if (!audio || !toggle || !state || !title) return;

  const tracks = [
    { title: '浓雾', src: 'assets/audio/congwu-the-ballad.m4a' },
    { title: '岁铃有歌', src: 'assets/audio/suiling-youge.mp3' },
    { title: '绮梦夏日', src: 'assets/audio/qimeng-xiari.mp3' },
  ];
  const storageKey = 'between-waves-sound-muted';
  const targetVolume = 0.35;
  let fadeFrame = 0;
  let shouldResume = false;
  let userPaused = localStorage.getItem(storageKey) === 'true';
  let currentTrack = Math.floor(Math.random() * tracks.length);
  const unavailableTracks = new Set();

  const formatTime = (seconds) => {
    const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const minutes = Math.floor(value / 60);
    return `${String(minutes).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  };

  const setState = (playing) => {
    const track = tracks[currentTrack];
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', `${playing ? '暂停' : '播放'}背景音乐《${track.title}》`);
    title.textContent = track.title;
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

  const chooseNextTrack = () => {
    const candidates = tracks
      .map((_, index) => index)
      .filter((index) => index !== currentTrack && !unavailableTracks.has(index));
    if (!candidates.length) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
  };

  const loadTrack = (index) => {
    currentTrack = index;
    audio.src = tracks[index].src;
    audio.load();
    setState(false);
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
    if (audio.paused) {
      userPaused = false;
      localStorage.setItem(storageKey, 'false');
      play();
    } else {
      userPaused = true;
      localStorage.setItem(storageKey, 'true');
      pause();
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (!audio.paused) state.textContent = `playing … ${formatTime(audio.currentTime)}`;
  });
  audio.addEventListener('play', () => setState(true));
  audio.addEventListener('pause', () => setState(false));
  audio.addEventListener('canplay', () => {
    if (!userPaused && audio.paused) play();
  });
  audio.addEventListener('ended', () => {
    const nextTrack = chooseNextTrack();
    if (nextTrack === null) return;
    loadTrack(nextTrack);
    play();
  });
  audio.addEventListener('error', () => {
    unavailableTracks.add(currentTrack);
    const nextTrack = chooseNextTrack();
    if (nextTrack === null) {
      state.textContent = 'audio unavailable';
      return;
    }
    loadTrack(nextTrack);
    play();
  });

  const startAfterFirstInteraction = (event) => {
    if (event.target.closest?.('[data-audio-toggle]')) return;
    play();
  };
  window.addEventListener('pointerdown', startAfterFirstInteraction, { once: true, passive: true });
  window.addEventListener('keydown', startAfterFirstInteraction, { once: true });
  window.addEventListener('pageshow', () => {
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
  loadTrack(currentTrack);
  if (!userPaused) play();
})();
