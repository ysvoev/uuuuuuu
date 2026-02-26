document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[id]');
  
    links.forEach(link => {
      link.addEventListener('mouseenter', function() {
        // Показываем целевой див (убираем класс tip)
        const targetDiv = document.querySelector(`div[id="${this.id}"]`);
        if (targetDiv) {
          targetDiv.classList.remove('tip');
        }
        // Скрываем элемент с классом content (добавляем класс none)
        const contentElement = document.querySelector('.content');
        if (contentElement) {
          contentElement.classList.add('none');
        }
      });
  
      link.addEventListener('mouseleave', function() {
        // Снова скрываем целевой див
        const targetDiv = document.querySelector(`div[id="${this.id}"]`);
        if (targetDiv) {
          targetDiv.classList.add('tip');
        }
        // Показываем элемент с классом content
        const contentElement = document.querySelector('.content');
        if (contentElement) {
          contentElement.classList.remove('none');
        }
      });
    });
  });