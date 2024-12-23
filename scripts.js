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
            const imagePreview = document.createElement('div');
            imagePreview.classList.add('image-preview');
            imagePreview.innerHTML = `
                <h4>Зображення ${index + 1}</h4>
                <img class="thumbnail" src="${e.target.result}" alt="Мініатюра" />
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
                // Тут будет ошибка, потому что FileList не поддерживает обновление напрямую
                // Чтобы решить это, нужно создать новый FileList и присвоить его обратно
                const dataTransfer = new DataTransfer();
                updatedFiles.forEach(file => dataTransfer.items.add(file));
                fileInput.files = dataTransfer.files;
            });
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

    if (fileInput.files.length === 0) {
        alert('Будь ласка, виберіть зображення.');
        return;
    }

    const selectedFormat = formatSelect.value;
    const files = fileInput.files;

    previewContainer.innerHTML = ''; // Очищаємо контейнер для попереднього перегляду
    downloadLinksContainer.innerHTML = ''; // Очищаємо контейнер для посилань на завантаження

    const zip = new JSZip(); // Створюємо новий ZIP архів

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
                const mimeType = selectedFormat === 'tiff' ? 'image/tiff' : `image/${selectedFormat}`;
                canvas.toBlob((blob) => {
                    // Додаємо оброблене зображення до архіву
                    zip.file(`converted_image_${index + 1}.${selectedFormat}`, blob);

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
