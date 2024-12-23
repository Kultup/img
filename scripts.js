document.getElementById('imageInput').addEventListener('change', (event) => {
    const fileInput = event.target;
    const files = fileInput.files;
    const formatInfo = document.getElementById('currentFormat');
    const previewContainer = document.getElementById('previewContainer');

    if (files.length === 0) {
        formatInfo.textContent = 'невідомий';
        return;
    }

    // Очищаємо контейнер попереднього перегляду перед додаванням нових мініатюр
    previewContainer.innerHTML = '';

    // Автоматично визначаємо формат першого файлу
    const file = files[0];
    const fileType = file.type || file.name.split('.').pop();
    formatInfo.textContent = fileType;

    // Показуємо мініатюри для кожного вибраного файлу
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;

            img.onload = () => {
                // Створюємо canvas для зміни розміру
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Встановлюємо розміри canvas до 800x600
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 600;

                let width = img.width;
                let height = img.height;

                // Зберігаємо пропорції зображення
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                // Встановлюємо розміри canvas і малюємо зображення
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Створюємо мініатюру з відформатованим зображенням
                const imagePreview = document.createElement('div');
                imagePreview.classList.add('image-preview');
                imagePreview.innerHTML = `
                    <h4>Зображення ${index + 1}</h4>
                    <img class="thumbnail" src="${canvas.toDataURL()}" alt="Мініатюра" />
                    <button class="remove-file-btn" data-index="${index}">Видалити</button>
                `;
                previewContainer.appendChild(imagePreview);

                // Додаємо функціонал для кнопки "Видалити"
                const removeButton = imagePreview.querySelector('.remove-file-btn');
                removeButton.addEventListener('click', () => {
                    // Видаляємо елемент з попереднім переглядом
                    imagePreview.remove();
                    // Видаляємо файл з input
                    const updatedFiles = Array.from(fileInput.files).filter((_, i) => i !== index);
                    const dataTransfer = new DataTransfer();
                    updatedFiles.forEach(file => dataTransfer.items.add(file));
                    fileInput.files = dataTransfer.files;
                });
            };
        };

        reader.onerror = () => {
            console.error('Помилка при читанні файлу.');
            alert('Виникла помилка при читанні файлу.');
        };

        reader.readAsDataURL(file);
    });
});

document.getElementById('convertButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('imageInput');
    const formatSelect = document.getElementById('formatSelect');
    const previewContainer = document.getElementById('previewContainer');
    const downloadLinksContainer = document.getElementById('downloadLinksContainer');
    const quality = document.getElementById('quality').value;
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (fileInput.files.length === 0) {
        alert('Будь ласка, виберіть зображення.');
        return;
    }

    const selectedFormat = formatSelect.value;
    const files = fileInput.files;

    previewContainer.innerHTML = ''; // Очищаємо контейнер для попереднього перегляду
    downloadLinksContainer.innerHTML = ''; // Очищаємо контейнер для посилань на завантаження

    const zip = new JSZip(); // Створюємо новий ZIP архів

    // Оновлюємо прогрес-бар
    progressBar.value = 0;
    progressText.textContent = '0%';

    // Обробка кожного файлу
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;

            img.onload = () => {
                // Створюємо canvas для конвертації
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Визначаємо MIME тип для збереження файлу в потрібному форматі
                let mimeType = '';
                switch (selectedFormat) {
                    case 'tiff':
                        mimeType = 'image/tiff';
                        break;
                    case 'ico':
                        mimeType = 'image/x-icon';
                        break;
                    case 'svg':
                        mimeType = 'image/svg+xml';
                        break;
                    case 'pdf':
                        mimeType = 'application/pdf';
                        break;
                    case 'heic':
                        mimeType = 'image/heic';
                        break;
                    default:
                        mimeType = `image/${selectedFormat}`;
                }

                // Конвертуємо зображення і додаємо в ZIP
                canvas.toBlob((blob) => {
                    zip.file(`converted_image_${index + 1}.${selectedFormat}`, blob);

                    // Оновлюємо прогрес-бар після обробки кожного файлу
                    const progress = Math.round(((index + 1) / files.length) * 100);
                    progressBar.value = progress;
                    progressText.textContent = `${progress}%`;

                    // Після обробки всіх файлів створюємо архів
                    if (index === files.length - 1) {
                        // Генеруємо архів та даємо посилання для скачування
                        zip.generateAsync({ type: 'blob' })
                            .then((content) => {
                                const downloadLink = document.createElement('a');
                                downloadLink.href = URL.createObjectURL(content);
                                downloadLink.download = 'converted_images.zip';
                                downloadLink.textContent = 'Завантажити архів зображень';
                                downloadLink.classList.add('download-link');
                                downloadLinksContainer.appendChild(downloadLink);

                                // Завершення обробки
                                progressBar.value = 100;
                                progressText.textContent = '100%';
                            });
                    }
                }, mimeType);
            };
        };

        reader.onerror = () => {
            console.error('Помилка при читанні файлу.');
            alert('Виникла помилка при читанні файлу.');
        };

        reader.readAsDataURL(file);
    });
});

document.getElementById('clearButton').addEventListener('click', () => {
    const fileInput = document.getElementById('imageInput');
    fileInput.value = ''; // Очищаємо вибір файлів
    document.getElementById('previewContainer').innerHTML = ''; // Очищаємо попередній перегляд
    document.getElementById('downloadLinksContainer').innerHTML = ''; // Очищаємо посилання на завантаження
    document.getElementById('progressBar').value = 0; // Очищаємо прогрес-бар
    document.getElementById('progressText').textContent = '0%'; // Очищаємо текст прогресу
});

// Додаємо функціональність для кнопки "Завантажити зображення"
document.querySelector('.format-button').addEventListener('click', () => {
    document.getElementById('imageInput').click();
});
