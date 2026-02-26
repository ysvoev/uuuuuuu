(function() {
  'use strict';

  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const poemDiv = document.querySelector('.poem');
    if (!poemDiv) return;

    // Получаем все текстовые узлы внутри poem
    const textNodes = getTextNodes(poemDiv);
    
    // Обертываем каждую букву в span для анимации
    const letterSpans = wrapLetters(textNodes);

    // Запускаем анимацию поезда
    startTrainAnimation(letterSpans);
  }

  // Получаем все текстовые узлы рекурсивно
  function getTextNodes(node) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let textNode;
    while (textNode = walker.nextNode()) {
      if (textNode.textContent.trim()) {
        textNodes.push(textNode);
      }
    }
    return textNodes;
  }

  // Обертываем каждую букву в span
  function wrapLetters(textNodes) {
    const letterSpans = [];

    textNodes.forEach(textNode => {
      const parent = textNode.parentNode;
      const text = textNode.textContent;
      const fragment = document.createDocumentFragment();

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Пробелы оставляем как текстовые узлы
        if (char === ' ' || char === '\n' || char === '\t') {
          fragment.appendChild(document.createTextNode(char));
        } else {
          const span = document.createElement('span');
          span.textContent = char;
          span.style.display = 'inline-block';
          span.style.transition = 'transform 0.1s ease-out';
          fragment.appendChild(span);
          letterSpans.push(span);
        }
      }

      parent.replaceChild(fragment, textNode);
    });

    return letterSpans;
  }

  // Анимация тряски поезда
  function shakeLetter(span) {
    const shakeCount = 4; // чух-чух-чух-чух
    const shakeDuration = 400; // общая длительность в мс
    const shakeInterval = shakeDuration / shakeCount;
    let currentShake = 0;

    const shake = () => {
      if (currentShake >= shakeCount) {
        span.style.transform = 'translateY(0)';
        return;
      }

      const isUp = currentShake % 2 === 0;
      span.style.transform = isUp ? 'translateY(-4px)' : 'translateY(0)';
      currentShake++;

      if (currentShake < shakeCount) {
        setTimeout(shake, shakeInterval);
      } else {
        setTimeout(() => {
          span.style.transform = 'translateY(0)';
        }, shakeInterval);
      }
    };

    shake();
  }

  // Запуск анимации поезда
  function startTrainAnimation(letterSpans) {
    if (letterSpans.length === 0) return;

    // Базовая пауза между анимациями (2 секунды)
    const basePause = 2000;
    // Случайное отклонение паузы (±500мс)
    const pauseVariation = 500;

    function animateRandomLetters() {
      // Выбираем случайное количество букв (4-20)
      const count = Math.floor(Math.random() * 17) + 4;
      const selectedLetters = [];

      // Выбираем случайные буквы
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * letterSpans.length);
        selectedLetters.push(letterSpans[randomIndex]);
      }

      // Анимируем выбранные буквы
      selectedLetters.forEach(span => {
        shakeLetter(span);
      });

      // Вычисляем следующую паузу с небольшим изменением
      const pause = basePause + (Math.random() * pauseVariation * 2 - pauseVariation);
      
      // Планируем следующую анимацию
      setTimeout(animateRandomLetters, pause);
    }

    // Запускаем первую анимацию после небольшой задержки
    setTimeout(animateRandomLetters, basePause);
  }
})();
