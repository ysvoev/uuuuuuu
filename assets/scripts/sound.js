// Ждём полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
// Находим элементы
const soundMessage = document.getElementById('sound');
const block = document.querySelector('.block');

// Если элементы не найдены — ничего не делаем
if (!soundMessage || !block) return;

// При загрузке: показываем сообщение, скрываем основной блок
soundMessage.classList.remove('none');
block.classList.add('none');

// Функция для включения звука и возврата интерфейса
function enableSoundAndRestore() {
    // Пытаемся найти и включить аудио на странице
    // Предполагаем, что аудио-элемент имеет тег <audio> или video с аудиодорожкой
    const audioElements = document.querySelectorAll('audio, video');
    if (audioElements.length > 0) {
    // Включаем все найденные аудио/видео
    audioElements.forEach(media => {
        media.play().catch(e => console.log('Не удалось включить звук:', e));
    });
    } else {
    // Если аудио нет, можно создать тестовый звук (опционально)
    console.warn('На странице не найдено аудио-элементов');
    }

    // Возвращаем исходное состояние: скрываем сообщение, показываем блок
    soundMessage.classList.add('none');
    block.classList.remove('none');

    // Удаляем обработчик клика, чтобы случайно не сработал повторно
    document.removeEventListener('click', enableSoundAndRestore);
}

// Добавляем обработчик клика на весь документ
// Можно ограничить только нажатием по сообщению, но по ТЗ — "кликни на экран"
document.addEventListener('click', enableSoundAndRestore);
});