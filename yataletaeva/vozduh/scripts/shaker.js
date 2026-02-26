// shaker.js — финальная версия с поддержкой касаний на телефоне
// При тапе (touchstart) — затухание, при отпускании (touchend/touchcancel) — возврат
// Все остальные параметры без изменений

(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // ========== НАСТРОЙКИ (изменяйте здесь) ==========
    const CONFIG = {
      normal: {
        radius: 16,           // амплитуда смещения (px)
        speed: 200,           // базовая длительность до смены цели (мс)
        speedVariation: 50,  // случайная вариация (± мс)
        flag: {
          skew: 2,           // макс. наклон по Y (deg)
          rotate: 0.5        // макс. поворот (deg)
        }
      },
      fade: {
        radius: 0.2,         // амплитуда во время затухания
        speed: 400,
        speedVariation: 50,
        flag: {
          skew: 0.3,
          rotate: 0.2
        }
      },
      fadeOutDuration: 800,  // длительность перехода в режим fade при нажатии (мс)
      fadeInDuration: 400,   // длительность возврата в normal при отпускании (мс)
      smoothness: 0.05,      // коэффициент плавности (0..1) — меньше = плавнее
      logFade: true          // выводить информацию в консоль
    };
    // =================================================

    const container = document.getElementById('shaker');
    if (!container) {
      console.error('❌ Элемент с id="shaker" не найден!');
      return;
    }

    // Функция разбиения параграфов на span'ы (строки) внутри того же <p> с сохранением пустых строк
    function splitParagraphsIntoSpans(container) {
      const paragraphs = container.querySelectorAll('p');
      paragraphs.forEach(p => {
        const html = p.innerHTML;
        // Проверяем, есть ли <br> в содержимом
        if (!/<br\s*\/?>/i.test(html)) return;

        // Разбиваем по <br>, сохраняем все фрагменты (включая пустые)
        const fragments = html.split(/<br\s*\/?>/i);

        // Очищаем параграф
        p.innerHTML = '';

        // Для каждого фрагмента создаём span
        fragments.forEach(text => {
          const span = document.createElement('span');
          if (text.trim() === '') {
            // Пустая строка: вставляем неразрывный пробел для сохранения высоты строки
            span.innerHTML = '&nbsp;';
            span.classList.add('shaker-empty-line'); // опционально для стилизации
          } else {
            span.innerHTML = text; // сохраняем возможные внутренние теги
          }
          span.style.display = 'block';   // чтобы каждый span был с новой строки
          span.style.willChange = 'transform'; // для оптимизации анимации
          p.appendChild(span);
        });
      });
    }

    // Применяем разбиение
    splitParagraphsIntoSpans(container);

    // Теперь собираем все элементы для анимации:
    // - каждый span внутри p (если p был разбит)
    // - каждый p, который не содержит span (т.е. остался цельным)
    const spans = Array.from(container.querySelectorAll('p > span'));
    const plainParagraphs = Array.from(container.querySelectorAll('p')).filter(p => p.querySelector('span') === null);

    let elements = [...spans, ...plainParagraphs];

    if (elements.length === 0) {
      console.warn('⚠️ Нет элементов для анимации. Применяем эффект ко всему контейнеру.');
      elements = [container];
    } else {
      console.log(`✅ Найдено элементов для анимации: ${elements.length} (span: ${spans.length}, p: ${plainParagraphs.length})`);
    }

    // Убедимся, что will-change установлен для всех элементов
    elements.forEach(el => {
      el.style.willChange = 'transform';
    });

    // Текущий режим и параметры
    let currentMode = 'normal';
    let currentRadius = CONFIG.normal.radius;
    let currentSpeedBase = CONFIG.normal.speed;
    let currentSpeedVar = CONFIG.normal.speedVariation;

    // Переход радиуса между режимами
    let radiusTransition = null; // { startTime, startRadius, targetRadius, duration }

    // Состояние каждого элемента
    const items = elements.map(el => ({
      el,
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      targetSkew: 0,
      targetRotate: 0,
      currentSkew: 0,
      currentRotate: 0,
      nextChangeTime: 0
    }));

    // Генерация новой цели для элемента
    function generateTarget(item, radius, flagParams) {
      // Случайное смещение в пределах круга радиуса radius
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.random() * radius;
      item.targetX = Math.cos(angle) * r;
      item.targetY = Math.sin(angle) * r;

      // Случайный наклон и поворот
      item.targetSkew = (Math.random() * 2 - 1) * flagParams.skew;
      item.targetRotate = (Math.random() * 2 - 1) * flagParams.rotate;

      // Время до следующей смены (с вариацией)
      const variation = (Math.random() * 2 - 1) * currentSpeedVar;
      const delay = Math.max(20, currentSpeedBase + variation);
      item.nextChangeTime = performance.now() + delay;
    }

    // Обновление текущего радиуса (плавный переход)
    function updateRadius(now) {
      if (radiusTransition) {
        const elapsed = now - radiusTransition.startTime;
        let progress = Math.min(elapsed / radiusTransition.duration, 1);
        currentRadius = radiusTransition.startRadius + (radiusTransition.targetRadius - radiusTransition.startRadius) * progress;

        if (progress >= 1) {
          currentRadius = radiusTransition.targetRadius;
          radiusTransition = null;
          if (CONFIG.logFade) console.log(`✅ Режим ${currentMode}, радиус ${currentRadius.toFixed(2)}px`);
        }
      }
    }

    // Анимационный цикл
    let animFrame;
    function animate(now) {
      // Обновляем радиус, если идёт переход
      updateRadius(now);

      // Определяем текущие параметры флага в зависимости от режима
      const flagParams = (currentMode === 'normal') ? CONFIG.normal.flag : CONFIG.fade.flag;

      items.forEach(item => {
        // Если пришло время сменить цель — генерируем новую
        if (now >= item.nextChangeTime) {
          generateTarget(item, currentRadius, flagParams);
        }

        // Плавно двигаемся к целевым значениям
        const k = CONFIG.smoothness;
        item.currentX += (item.targetX - item.currentX) * k;
        item.currentY += (item.targetY - item.currentY) * k;
        item.currentSkew += (item.targetSkew - item.currentSkew) * k;
        item.currentRotate += (item.targetRotate - item.currentRotate) * k;

        // Если близко к цели — фиксируем (для предотвращения накопления ошибки)
        if (Math.abs(item.currentX - item.targetX) < 0.01) item.currentX = item.targetX;
        if (Math.abs(item.currentY - item.targetY) < 0.01) item.currentY = item.targetY;
        if (Math.abs(item.currentSkew - item.targetSkew) < 0.01) item.currentSkew = item.targetSkew;
        if (Math.abs(item.currentRotate - item.targetRotate) < 0.01) item.currentRotate = item.targetRotate;

        // Применяем трансформацию
        item.el.style.transform = `translate(${item.currentX}px, ${item.currentY}px) skewY(${item.currentSkew}deg) rotate(${item.currentRotate}deg)`;
      });

      animFrame = requestAnimationFrame(animate);
    }

    // Запуск анимации
    animFrame = requestAnimationFrame(animate);

    // Инициализация первых целей
    items.forEach(item => {
      generateTarget(item, currentRadius, CONFIG.normal.flag);
    });

    // Функция переключения режима
    function setMode(mode, duration) {
      if (mode === currentMode && radiusTransition === null) return;

      const targetRadius = CONFIG[mode].radius;
      const targetSpeedBase = CONFIG[mode].speed;
      const targetSpeedVar = CONFIG[mode].speedVariation;

      // Начинаем переход радиуса
      radiusTransition = {
        startTime: performance.now(),
        startRadius: currentRadius,
        targetRadius: targetRadius,
        duration: duration
      };

      // Меняем параметры скорости (применяются при генерации новых целей)
      currentSpeedBase = targetSpeedBase;
      currentSpeedVar = targetSpeedVar;
      currentMode = mode;

      if (CONFIG.logFade) {
        console.log(`🔁 Переход в режим ${mode}: радиус ${currentRadius.toFixed(2)}px → ${targetRadius}px за ${duration}мс`);
      }
    }

    // ----- Обработчики событий -----
    function handleKeyDown(e) {
      setMode('fade', CONFIG.fadeOutDuration);
    }
    function handleKeyUp(e) {
      setMode('normal', CONFIG.fadeInDuration);
    }
    function handleMouseDown(e) {
      setMode('fade', CONFIG.fadeOutDuration);
    }
    function handleMouseUp(e) {
      setMode('normal', CONFIG.fadeInDuration);
    }
    // Добавляем обработчики касаний для мобильных устройств
    function handleTouchStart(e) {
      setMode('fade', CONFIG.fadeOutDuration);
    }
    function handleTouchEnd(e) {
      setMode('normal', CONFIG.fadeInDuration);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd); // отмена тоже считается окончанием

    // Двойной клик по контейнеру — принудительный сброс в normal (без анимации)
    container.addEventListener('dblclick', () => {
      radiusTransition = null;
      currentMode = 'normal';
      currentRadius = CONFIG.normal.radius;
      currentSpeedBase = CONFIG.normal.speed;
      currentSpeedVar = CONFIG.normal.speedVariation;
      // Сбрасываем все элементы в нулевое положение
      items.forEach(item => {
        item.targetX = 0;
        item.targetY = 0;
        item.targetSkew = 0;
        item.targetRotate = 0;
        item.currentX = 0;
        item.currentY = 0;
        item.currentSkew = 0;
        item.currentRotate = 0;
        item.el.style.transform = 'translate(0px, 0px) skewY(0deg) rotate(0deg)';
      });
      if (CONFIG.logFade) console.log('🔁 Принудительный сброс в normal');
    });

    // Отладочные функции (опционально)
    window.shakerDebug = {
      setNormalRadius: (r) => { CONFIG.normal.radius = r; },
      setFadeRadius: (r) => { CONFIG.fade.radius = r; },
      getStatus: () => ({ mode: currentMode, radius: currentRadius, speedBase: currentSpeedBase })
    };
  }
})();