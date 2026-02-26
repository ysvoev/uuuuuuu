(function() {
    // ========== НАСТРОЙКИ ==========
    const config = {
      // Прозрачность: var(--opacity) * 3 (не больше 1)
      opacity: (function() {
        const cssVar = getComputedStyle(document.documentElement)
          .getPropertyValue('--opacity').trim();
        const base = cssVar ? parseFloat(cssVar) : 0.33;
        return Math.min(base * 3, 1);
      })(),
  
      // Доля линий, полностью случайных (не зависят от курсора)
      randomDirectionProbability: 0.5, // 30%
  
      // Доля «прямых» линий (идут к курсору), остальные — зеркальные (от курсора)
      positiveMirrorProbability: 0.5, // 50%
  
      // Ручные смещения углов для каждого автора (в радианах)
      angleOffsets: [],
  
      // Множитель длины (уменьшите, если линии уходят за экран)
      lengthFactor: 1,
  
      // Минимальная длина (пиксели)
      minLength: 50,
  
      // Обрезать ли линии по границам экрана?
      clampToScreen: true,
  
      // ===== НОВЫЕ ПАРАМЕТРЫ =====
      // Множитель расстояния от центра до стартовой точки (0..1)
      // 1 = полная зеркальная точка, 0.5 = половина расстояния до зеркальной точки
      radiusFactor: 1, // линии будут ближе к центру
  
      // Случайное смещение стартовой точки для каждого автора (пиксели)
      // Значение фиксируется при загрузке и не меняется со временем
      startJitter: 500,
    };
    // ================================
  
    function init() {
      const authorsBlock = document.getElementById('authors');
      if (!authorsBlock) return;
  
      const rows = Array.from(authorsBlock.querySelectorAll('.row'));
      if (rows.length === 0) return;
  
      // Базовые длины из описаний (число в скобках * 100)
      const baseLengths = rows.map(row => {
        const desc = row.querySelector('.description');
        if (!desc) return 100;
        const match = desc.textContent.trim().match(/\((\d+)\)/);
        return match ? parseInt(match[1], 10) * 200 : 100;
      });
  
      const lengths = baseLengths.map(len => 
        Math.max(len * config.lengthFactor, config.minLength)
      );
  
      const authorCount = lengths.length;
  
      // Предопределяем для каждого автора:
      const randomDir = Array.from({ length: authorCount }, () => Math.random() < config.randomDirectionProbability);
      const isPositive = Array.from({ length: authorCount }, () => Math.random() < config.positiveMirrorProbability);
      const fixedRandomAngles = randomDir.map(isRand => isRand ? Math.random() * 2 * Math.PI : 0);
  
      // Фиксированные случайные смещения стартовой точки для каждого автора
      const jitterX = Array.from({ length: authorCount }, () => (Math.random() * 2 - 1) * config.startJitter);
      const jitterY = Array.from({ length: authorCount }, () => (Math.random() * 2 - 1) * config.startJitter);
  
      // Угловые смещения
      let angleOffsets = config.angleOffsets;
      if (angleOffsets.length === 0) {
        angleOffsets = Array.from({ length: authorCount }, (_, i) => i * 2 * Math.PI / authorCount);
      } else if (angleOffsets.length < authorCount) {
        while (angleOffsets.length < authorCount) angleOffsets.push(0);
      }
  
      // Создаём SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('style', `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 10000;
      `);
      document.body.appendChild(svg);
  
      const computedStyle = getComputedStyle(document.documentElement);
      const strokeColor = computedStyle.getPropertyValue('--color-white').trim() || '#ffffff';
  
      const paths = [];
      for (let i = 0; i < authorCount; i++) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', strokeColor);
        path.setAttribute('stroke-width', '1');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-opacity', config.opacity);
        svg.appendChild(path);
        paths.push(path);
      }
  
      // Точки для каждого автора (концы лучей)
      const trails = Array.from({ length: authorCount }, () => []);
      const MIN_DIST = 5;
  
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
  
      // Обрезка луча по экрану
      function clampLine(startX, startY, angle, length) {
        if (!config.clampToScreen) {
          return {
            x: startX + length * Math.cos(angle),
            y: startY + length * Math.sin(angle)
          };
        }
  
        const endX = startX + length * Math.cos(angle);
        const endY = startY + length * Math.sin(angle);
  
        if (endX >= 0 && endX <= window.innerWidth && endY >= 0 && endY <= window.innerHeight) {
          return { x: endX, y: endY };
        }
  
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        let tMin = Infinity;
  
        if (dirX < 0) { const t = (0 - startX) / dirX; if (t > 0 && t < tMin) tMin = t; }
        if (dirX > 0) { const t = (window.innerWidth - startX) / dirX; if (t > 0 && t < tMin) tMin = t; }
        if (dirY < 0) { const t = (0 - startY) / dirY; if (t > 0 && t < tMin) tMin = t; }
        if (dirY > 0) { const t = (window.innerHeight - startY) / dirY; if (t > 0 && t < tMin) tMin = t; }
  
        if (tMin !== Infinity && tMin < length) {
          return { x: startX + tMin * dirX, y: startY + tMin * dirY };
        }
        return { x: endX, y: endY };
      }
  
      function trimTrail(i) {
        const trail = trails[i];
        const maxLen = lengths[i];
        if (trail.length < 2) return;
  
        let totalLength = 0;
        for (let j = trail.length - 1; j > 0; j--) {
          const p1 = trail[j];
          const p2 = trail[j - 1];
          const segLen = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          totalLength += segLen;
          if (totalLength > maxLen) {
            trails[i] = trail.slice(j);
            return;
          }
        }
      }
  
      function addPointToTrail(i, point) {
        const trail = trails[i];
        if (trail.length === 0) {
          trail.push(point);
          return;
        }
  
        const last = trail[trail.length - 1];
        const dx = point.x - last.x;
        const dy = point.y - last.y;
        if (Math.hypot(dx, dy) < MIN_DIST) return;
  
        trail.push(point);
        trimTrail(i);
      }
  
      function updatePaths() {
        for (let i = 0; i < authorCount; i++) {
          const trail = trails[i];
          if (trail.length < 2) {
            paths[i].setAttribute('d', '');
            continue;
          }
  
          let d = `M ${trail[0].x} ${trail[0].y}`;
          for (let j = 1; j < trail.length; j++) {
            d += ` L ${trail[j].x} ${trail[j].y}`;
          }
          paths[i].setAttribute('d', d);
        }
      }
  
      function clearAllTrails() {
        for (let i = 0; i < authorCount; i++) trails[i] = [];
        updatePaths();
      }
  
      function onMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
  
        const rect = authorsBlock.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
  
        // Зеркальная точка
        const mirrorX = 2 * centerX - mouseX;
        const mirrorY = 2 * centerY - mouseY;
  
        // Базовая стартовая точка с учётом radiusFactor
        const baseStartX = centerX + (mirrorX - centerX) * config.radiusFactor;
        const baseStartY = centerY + (mirrorY - centerY) * config.radiusFactor;
  
        // Угол от зеркальной точки к курсору (используем для направления лучей)
        let baseAngle = 0;
        const dx = mouseX - mirrorX;
        const dy = mouseY - mirrorY;
        if (!(dx === 0 && dy === 0)) {
          baseAngle = Math.atan2(dy, dx);
        }
  
        for (let i = 0; i < authorCount; i++) {
          // Стартовая точка для этого автора = базовая + фиксированный jitter
          const startX = baseStartX + jitterX[i];
          const startY = baseStartY + jitterY[i];
  
          let angle;
          if (randomDir[i]) {
            angle = fixedRandomAngles[i];
          } else {
            angle = baseAngle + angleOffsets[i];
            if (!isPositive[i]) angle += Math.PI;
          }
  
          const len = lengths[i];
          const endPoint = clampLine(startX, startY, angle, len);
          addPointToTrail(i, endPoint);
        }
  
        updatePaths();
      }
  
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('click', clearAllTrails);
      window.addEventListener('resize', () => onMouseMove({ clientX: mouseX, clientY: mouseY }));
  
      onMouseMove({ clientX: mouseX, clientY: mouseY });
  
      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(() => {
          onMouseMove({ clientX: mouseX, clientY: mouseY });
        });
        resizeObserver.observe(authorsBlock);
      }
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();