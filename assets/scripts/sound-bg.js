// sound-bg.js
document.addEventListener('DOMContentLoaded', function() {
  const audio = document.createElement('audio');
  audio.src = 'sounds/01.mp3';
  audio.loop = true;
  audio.preload = 'auto';
  document.body.appendChild(audio);
  console.log('Фоновый звук добавлен в DOM');
});