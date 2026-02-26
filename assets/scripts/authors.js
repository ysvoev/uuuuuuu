/**
 * Конфигурация вращения и чувствительности к мыши
 */
const CONFIG = {
  baseRotationTime: 80000,       // время полного оборота в секундах (при неподвижной мыши)
  mouseSensitivity: 0.0005,    // множитель: скорость вращения (рад/мс) += скорость мыши (px/мс) * sensitivity
  radius: 60,                 // расстояние от центра до начала текста (px)
  mouseDecayTime: 100,        // время (мс) без движения мыши, после которого скорость сбрасывается в 0
};

// Глобальные переменные состояния
let container, items, count;
let centerX = 0, centerY = 0, radius = CONFIG.radius;
let initialAngles = [];       // исходные углы для каждого элемента (отсчёт от вертикали? нет, равномерно по кругу)
let rotationOffset = 0;       // текущее смещение вращения (рад), по часовой стрелке
let animationFrameId = null;
let lastTimestamp = null;
let baseAngularSpeed = (2 * Math.PI) / CONFIG.baseRotationTime; // рад/с -> рад/мс (делим на 1000)

// Переменные для отслеживания скорости мыши
let mouseSpeed = 0;           // текущая скорость мыши (px/мс)
let lastMouseX = 0, lastMouseY = 0, lastMouseTime = 0;
let mouseDecayTimer = null;

/**
 * Преобразует скорость в рад/мс с учётом движения мыши
 */
function getCurrentAngularSpeed() {
  return baseAngularSpeed + mouseSpeed * CONFIG.mouseSensitivity;
}

/**
 * Обновляет позиции всех элементов на основе текущего rotationOffset
 */
function updatePositions() {
  if (!container || !items.length) return;

  // Центр контейнера (актуальные размеры)
  centerX = container.clientWidth / 2;
  centerY = container.clientHeight / 2;

  items.forEach((item, i) => {
    // Текущий угол с учётом вращения по часовой стрелке
    const angle = initialAngles[i] + rotationOffset;

    // Координаты точки на окружности (начало луча)
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    // Применяем трансформацию: левый центр элемента в точке (x, y)
    // Поворот на угол луча (текст направлен от центра)
    item.style.position = 'absolute';
    item.style.left = x + 'px';
    item.style.top = y + 'px';
    item.style.transform = `translate(0, -50%) rotate(${angle}rad)`;
    item.style.transformOrigin = 'left center';
    item.style.whiteSpace = 'nowrap';
  });
}

/**
 * Анимация вращения
 */
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    animationFrameId = requestAnimationFrame(animate);
    return;
  }

  const delta = timestamp - lastTimestamp; // мс
  lastTimestamp = timestamp;

  // Приращение угла с учётом текущей скорости мыши
  rotationOffset += getCurrentAngularSpeed() * delta;

  // Нормализация (опционально, чтобы избежать переполнения)
  rotationOffset %= (2 * Math.PI);

  updatePositions();

  animationFrameId = requestAnimationFrame(animate);
}

/**
 * Обработчик движения мыши внутри контейнера
 */
function onMouseMove(e) {
  const currentTime = performance.now(); // мс
  const currentX = e.clientX;
  const currentY = e.clientY;

  if (lastMouseTime !== 0) {
    const deltaTime = currentTime - lastMouseTime; // мс
    if (deltaTime > 0) {
      // Расстояние между текущим и предыдущим положением мыши
      const distance = Math.hypot(currentX - lastMouseX, currentY - lastMouseY);
      // Скорость (px/мс)
      const newSpeed = distance / deltaTime;
      // Простое экспоненциальное сглаживание, чтобы избежать резких скачков
      mouseSpeed = mouseSpeed * 0.7 + newSpeed * 0.3;
    }
  }

  // Обновляем последние координаты и время
  lastMouseX = currentX;
  lastMouseY = currentY;
  lastMouseTime = currentTime;

  // Сбрасываем предыдущий таймер обнуления и ставим новый
  if (mouseDecayTimer) clearTimeout(mouseDecayTimer);
  mouseDecayTimer = setTimeout(() => {
    mouseSpeed = 0;
    mouseDecayTimer = null;
  }, CONFIG.mouseDecayTime);
}

/**
 * Сброс скорости мыши при выходе за пределы контейнера
 */
function onMouseLeave() {
  // При выходе мыши из контейнера мгновенно сбрасываем скорость
  mouseSpeed = 0;
  if (mouseDecayTimer) {
    clearTimeout(mouseDecayTimer);
    mouseDecayTimer = null;
  }
  // Также сбрасываем lastMouseTime, чтобы при повторном входе не было ложного скачка
  lastMouseTime = 0;
}

/**
 * Инициализация: начальные углы, запуск анимации, подписка на события
 */
function initAuthorRays() {
  container = document.getElementById('authors');
  if (!container) return;

  // Делаем контейнер точкой отсчёта для абсолютного позиционирования
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  items = container.querySelectorAll('.list .row');
  count = items.length;
  if (count === 0) return;

  // Запоминаем начальные углы (равномерное распределение по окружности)
  initialAngles = [];
  const angleStep = (2 * Math.PI) / count;
  for (let i = 0; i < count; i++) {
    initialAngles.push(i * angleStep);
  }

  // Центр и радиус
  centerX = container.clientWidth / 2;
  centerY = container.clientHeight / 2;
  radius = CONFIG.radius;

  // Сброс вращения (если нужно начать с исходного положения)
  rotationOffset = 0;

  // Первоначальная отрисовка
  updatePositions();

  // Запуск анимации
  if (!animationFrameId) {
    lastTimestamp = null;
    animationFrameId = requestAnimationFrame(animate);
  }

  // Подписка на события мыши внутри контейнера
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('mouseleave', onMouseLeave);
}

/**
 * Обработчик изменения размера окна
 */
function onResize() {
  if (!container || !items.length) return;
  updatePositions();
}

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', initAuthorRays);

// При изменении размеров окна пересчитываем центр
window.addEventListener('resize', onResize);

// Остановка анимации при уходе со страницы (чистота)
window.addEventListener('beforeunload', () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
});