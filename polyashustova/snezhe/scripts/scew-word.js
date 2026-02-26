// Скрипт для эффекта искажения ссылок при наведении
document.addEventListener('DOMContentLoaded', function() {
    const colors = [
        'var(--color-white)'
    ];
    
    // Определяем цвет текста в зависимости от текущего фона
    function getCurrentTextColor() {
        const bg = getComputedStyle(document.body).backgroundColor;
        const matches = bg && bg.match(/\d+/g);
        if (!matches) {
            return 'var(--color-white)';
        }
        const [r, g, b] = matches.map(Number);
        const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
        return lum > 0.5 ? 'var(--color-white)' : 'var(--color-white)';
    }
    
    // Функция для инициализации эффектов ссылок
    function initLinkEffects() {
        const links = document.querySelectorAll('a');
        
        links.forEach(link => {
            // Пропускаем ссылки внутри .contacts
            if (link.closest('.contacts')) {
                return;
            }
            // Обрабатываем ссылки .pages особым образом
            if (link.classList.contains('pages')) {
                // Удаляем старые обработчики
                link.removeEventListener('mouseenter', link._mouseenterHandler);
                link.removeEventListener('mouseleave', link._mouseleaveHandler);
                
                link._mouseenterHandler = function() {
                    // Применяем эффект scew-link к параграфам при наведении на блок
                    const paragraphs = this.querySelectorAll('p');
                    paragraphs.forEach(p => {
                        const scaleY = ((Math.random() * 3 + 1) / 2).toFixed(2);
                        const skewX = (Math.random() * 40 - 20).toFixed(0);
                        const textColor = getCurrentTextColor();
                        
                        p.style.setProperty('transform', `scaleY(${scaleY}) skewX(${skewX}deg)`, 'important');
                        p.style.setProperty('color', textColor, 'important');
                        p.style.setProperty('transition', 'transform 0.2s ease, color 0.2s ease', 'important');
                        p.style.setProperty('display', 'inline-block', 'important');
                        p.style.setProperty('transform-origin', 'center', 'important');
                    });
                };
                
                link._mouseleaveHandler = function() {
                    // Плавно убираем эффект с параграфов
                    const paragraphs = this.querySelectorAll('p');
                    paragraphs.forEach(p => {
                        // Восстанавливаем правильный цвет текста
                        const textColor = getCurrentTextColor();
                        
                        // Устанавливаем плавный переход для восстановления
                        p.style.setProperty('transition', 'transform var(--animation-duration) var(--animation-cubic), color var(--animation-duration) var(--animation-cubic)', 'important');
                        p.style.color = textColor;
                        p.style.setProperty('transform', 'scaleY(1) skewX(0deg)', 'important');
                        
                        // Через время анимации убираем все стили
                        setTimeout(() => {
                            p.style.removeProperty('transform');
                            p.style.removeProperty('transition');
                            p.style.removeProperty('display');
                            p.style.removeProperty('transform-origin');
                        }, 400); // Длительность анимации из CSS переменной
                    });
                };
                
                link.addEventListener('mouseenter', link._mouseenterHandler);
                link.addEventListener('mouseleave', link._mouseleaveHandler);
                return;
            }
            
            // Удаляем старые обработчики, если они есть
            link.removeEventListener('mouseenter', link._mouseenterHandler);
            link.removeEventListener('mouseleave', link._mouseleaveHandler);
            
            // Создаем новые обработчики
            link._mouseenterHandler = function() {
                // Сохраняем исходное состояние ДО первого наведения (только один раз)
                if (!this.hasAttribute('data-original-saved')) {
                    const spans = this.querySelectorAll('span[style*="transform"]');
                    spans.forEach((span, index) => {
                        // Сохраняем трансформацию от scew.js
                        span.setAttribute('data-scew-original', span.style.transform || '');
                    });
                    this.setAttribute('data-original-saved', 'true');
                }
                
                // Генерируем случайные значения трансформации
                const scaleY = (Math.random() * 3 + 1).toFixed(2);
                const skewX = (Math.random() * 40 - 20).toFixed(0);
                
                // Цвет такой же, как у основного текста
                const textColor = getCurrentTextColor();
                
                // Применяем цвет и переход
                this.style.setProperty('color', textColor, 'important');
                this.style.setProperty('transition', 'transform var(--animation-duration) var(--animation-cubic), color var(--animation-duration) var(--animation-cubic)', 'important');
                
                // Применяем новую трансформацию к сохраненному исходному состоянию
                const spans = this.querySelectorAll('span[data-scew-original]');
                if (spans.length > 0) {
                    // Для ссылок со span элементами - применяем только к самой ссылке
                    this.style.setProperty('transform', `scaleY(${scaleY}) skewX(${skewX}deg)`, 'important');
                    this.style.setProperty('display', 'inline-block', 'important');
                } else {
                    // Для обычных ссылок
                    this.style.setProperty('display', 'inline-block', 'important');
                    this.style.setProperty('transform', `scaleY(${scaleY}) skewX(${skewX}deg)`, 'important');
                }
                
                this.style.setProperty('transform-origin', 'center', 'important');
                
                // Добавляем класс для отладки
                this.classList.add('scew-active');
            };
            
            link._mouseleaveHandler = function() {
                // НЕ возвращаем исходные трансформации - оставляем текущие
                // Восстанавливаем правильный цвет текста
                const textColor = getCurrentTextColor();
                this.style.color = textColor;
                
                this.style.removeProperty('transition');
                
                // Убираем класс отладки
                this.classList.remove('scew-active');
                
                // Трансформация остается! Это создает эффект накопления
            };
            
            // Добавляем обработчики
            link.addEventListener('mouseenter', link._mouseenterHandler);
            link.addEventListener('mouseleave', link._mouseleaveHandler);
        });
    }

    // Функция для инициализации эффектов на span с числовыми id 0–100
    function initSpanEffects() {
        // Находим только те span, у которых id — число в диапазоне 0–100
        const spans = document.querySelectorAll('span[id]');
        spans.forEach(span => {
            const idNum = parseInt(span.id, 10);
            if (isNaN(idNum) || idNum < 0 || idNum > 100) return;

            // Очищаем возможные старые обработчики
            span.removeEventListener('mouseenter', span._mouseenterHandler);
            span.removeEventListener('mouseleave', span._mouseleaveHandler);
            // Очищаем обработчики дополнительного смещения (если были)
            span.removeEventListener('mouseenter', span._mouseenterShiftEnterHandler);
            span.removeEventListener('mouseleave', span._mouseenterShiftLeaveHandler);
            // Очищаем обработчики заливки по клику (если были)
            span.removeEventListener('click', span._clickFillHandler);

            // Наведение: даём такое же искажение, как ссылкам
            span._mouseenterHandler = function() {
                const scaleY = ((Math.random() * 3 + 1) / 2).toFixed(2);
                const skewX = (Math.random() * 40 - 20).toFixed(0);
                const textColor = getCurrentTextColor();

                this.style.setProperty('color', textColor, 'important');
                this.style.setProperty('transition', 'transform var(--animation-duration) var(--animation-cubic), color var(--animation-duration) var(--animation-cubic)', 'important');
                this.style.setProperty('display', 'inline-block', 'important');
                this.style.setProperty('transform-origin', 'center', 'important');
                this.style.setProperty('transform', `scaleY(${scaleY}) skewX(${skewX}deg)`, 'important');
            };

            // Уход курсора: ведём себя как ссылки — искажение не сбрасываем
            span._mouseleaveHandler = function() {
                const textColor = getCurrentTextColor();

                // Только возвращаем цвет и убираем переход, трансформацию не трогаем
                this.style.color = textColor;
                this.style.removeProperty('transition');
            };

            // === БЛОК СЛУЧАЙНОГО СМЕЩЕНИЯ ПРИ НАВЕДЕНИИ НА id (можно отключить, закомментировав весь блок) ===
            // При наведении добавляем небольшое случайное смещение ±8px по X и Y,
            // при этом сохраняем уже выставленные трансформации (scale/skew и т.п.).
            span._mouseenterShiftEnterHandler = function() {
                const maxShift = 8;
                const shiftX = (Math.random() * maxShift * 2 - maxShift).toFixed(0);
                const shiftY = (Math.random() * maxShift * 2 - maxShift).toFixed(0);

                const currentTransform = this.style.transform || '';
                const translate = `translate(${shiftX}px, ${shiftY}px)`;

                this.style.setProperty(
                    'transform',
                    `${currentTransform} ${translate}`.trim(),
                    'important'
                );
                this.style.setProperty('display', 'inline-block', 'important');
                this.style.setProperty('transform-origin', 'center', 'important');
            };

            // На уходе курсора ничего не сбрасываем, чтобы сохранялся эффект накопления,
            // как и для основных искажений.
            span._mouseenterShiftLeaveHandler = function() {
                // оставляем текущее смещение
            };
            // === КОНЕЦ БЛОКА СЛУЧАЙНОГО СМЕЩЕНИЯ ===

            // === БЛОК ЗАЛИВКИ ПРИ КЛИКЕ ПО id (можно отключить, закомментировав весь блок) ===
            // При клике заливаем span фоном тем же цветом, что и текущий цвет текста.
            // Повторный клик убирает заливку.
            // Если у span есть атрибут black="on", заливка применяется по умолчанию.
            span._clickFillHandler = function() {
                const currentBg = getComputedStyle(this).backgroundColor;

                // Если фон уже установлен (не "прозрачный" / "rgba(0, 0, 0, 0)"), то убираем заливку
                if (currentBg && currentBg !== 'rgba(0, 0, 0, 0)' && currentBg !== 'transparent') {
                    this.style.removeProperty('background-color');
                    return;
                }

                // Берём реальный текущий цвет текста span и заливаем им фон
                const currentColor = getComputedStyle(this).color;
                this.style.setProperty('background-color', currentColor, 'important');
                this.style.setProperty('display', 'inline-block', 'important');
            };
            
            // Проверяем флаг black="on" и применяем заливку по умолчанию
            if (span.getAttribute('black') === 'on') {
                const textColor = getCurrentTextColor();
                span.style.setProperty('background-color', textColor, 'important');
                span.style.setProperty('display', 'inline-block', 'important');
            }
            // === КОНЕЦ БЛОКА ЗАЛИВКИ ПРИ КЛИКЕ ===

            span.addEventListener('mouseenter', span._mouseenterHandler);
            span.addEventListener('mouseleave', span._mouseleaveHandler);
            span.addEventListener('mouseenter', span._mouseenterShiftEnterHandler);
            span.addEventListener('mouseleave', span._mouseenterShiftLeaveHandler);
            span.addEventListener('click', span._clickFillHandler);
        });
    }

    // Инициализируем эффекты после загрузки
    initLinkEffects();
    initSpanEffects();

    // Переинициализируем эффекты после завершения работы scew.js
    document.addEventListener('scewProcessingComplete', function() {
        initLinkEffects();
        initSpanEffects();
    });
});

