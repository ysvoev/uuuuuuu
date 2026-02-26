document.addEventListener('DOMContentLoaded', () => {
  // Определяем номер стиха из URL (например, /poems/poem/02.html -> 02)
  const pathname = window.location.pathname;
  const match = pathname.match(/poem\/(\d+)\.html/);
  
  if (!match) {
    return;
  }
  
  const poemNumber = match[1];
  // Путь относительно src/poems/poem/ будет ../../assets/sounds/02/
  const basePath = `../../assets/sounds/${poemNumber}/`;
  
  const spans = document.querySelectorAll('.poem span[id]');

  if (!spans.length) {
    return;
  }

  const audioCache = new Map();
  let currentAudio = null;

  spans.forEach((span) => {
    span.addEventListener('mouseenter', () => {
      const id = span.id;
      if (!id) return;

      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      let audio = audioCache.get(id);

      if (!audio) {
        audio = new Audio(`${basePath}${id}.mp3`);
        audioCache.set(id, audio);
      }

      currentAudio = audio;

      try {
        audio.currentTime = 0;
        audio.play();
      } catch (e) {
        // проигнорировать ошибки воспроизведения (например, без взаимодействия пользователя)
      }
    });

    span.addEventListener('mouseleave', () => {
      if (!currentAudio) return;

      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    });
  });
});

