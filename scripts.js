document.getElementById('imageInput').addEventListener('change', (event) => {
    const fileInput = event.target;
    const files = fileInput.files;
    const formatInfo = document.getElementById('currentFormat');
    const previewContainer = document.getElementById('previewContainer');

    if (files.length === 0) {
        formatInfo.textContent = 'Невідомий';
        return;
    }

    previewContainer.innerHTML = '';

    const file = files[0];
    const fileType = file.type || file.name.split('.').pop();
    formatInfo.textContent = fileType;

    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 600;

                let width = img.width;
                let height = img.height;

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

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const imagePreview = document.createElement('div');
                imagePreview.classList.add('image-preview');
                imagePreview.innerHTML = `
                    <h4>Зображення ${index + 1}</h4>
                    <img class="thumbnail" src="${canvas.toDataURL()}" alt="Мініатюра" />
                    <button class="remove-file-btn" data-index="${index}">Видалити</button>
                `;
                previewContainer.appendChild(imagePreview);

                const removeButton = imagePreview.querySelector('.remove-file-btn');
                removeButton.addEventListener('click', () => {
                    imagePreview.remove();
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
    const downloadLinksContainer = document.getElementById('downloadLinksContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (fileInput.files.length === 0) {
        alert('Будь ласка, виберіть зображення.');
        return;
    }

    const selectedFormat = formatSelect.value;
    const files = fileInput.files;
    const zip = new JSZip();

    progressBar.value = 0;
    progressText.textContent = '0%';

    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const mimeType = `image/${selectedFormat}`;
                const quality = document.getElementById('quality').value / 100;

                canvas.toBlob((blob) => {
                    if (!blob) {
                        alert('Не вдалося конвертувати зображення.');
                        return;
                    }

                    // Добавляем в архив только после успешной конвертации
                    zip.file(`converted_image_${index + 1}.${selectedFormat}`, blob);

                    const progress = Math.round(((index + 1) / files.length) * 100);
                    progressBar.value = progress;
                    progressText.textContent = `${progress}%`;

                    if (index === files.length - 1) {
                        zip.generateAsync({ type: 'blob' })
                            .then((content) => {
                                const downloadLink = document.createElement('a');
                                downloadLink.href = URL.createObjectURL(content);
                                downloadLink.download = 'converted_images.zip';
                                downloadLink.textContent = 'Завантажити архів зображень';
                                downloadLink.classList.add('download-link');
                                downloadLinksContainer.appendChild(downloadLink);

                                progressBar.value = 100;
                                progressText.textContent = '100%';
                            });
                    }
                }, mimeType, quality);
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
    fileInput.value = '';
    document.getElementById('previewContainer').innerHTML = '';
    document.getElementById('downloadLinksContainer').innerHTML = '';
    document.getElementById('progressBar').value = 0;
    document.getElementById('progressText').textContent = '0%';
});

document.querySelector('.format-button').addEventListener('click', () => {
    document.getElementById('imageInput').click();
});
