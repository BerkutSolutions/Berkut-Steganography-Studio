document.getElementById('view-metadata').addEventListener('click', async () => {
  const metaInput = document.getElementById('meta-file');
  if (metaInput.files.length === 0) {
    alert("Выберите файл для просмотра метаданных.");
    return;
  }
  const file = metaInput.files[0];
  const filePath = file.path;
  let metadataOutput = '';
  try {
    if (file.type.startsWith('image')) {
      metadataOutput = await window.electronAPI.readImageMetadata(filePath);
    } else if (file.type.startsWith('video')) {
      metadataOutput = await window.electronAPI.readVideoMetadata(filePath);
    } else {
      metadataOutput = "Поддержка метаданных для данного типа файла отсутствует.";
    }
    document.getElementById('metadata-output').value = metadataOutput;
  } catch (error) {
    document.getElementById('metadata-output').value = "Ошибка при чтении метаданных.";
  }
});

document.getElementById('metadata-button').addEventListener('click', async () => {
  const metaInput = document.getElementById('meta-file');
  if (metaInput.files.length === 0) {
    alert("Выберите файл для удаления метаданных.");
    return;
  }
  const file = metaInput.files[0];
  const filePath = file.path;
  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  const fileExt = file.name.split('.').pop();
  const outputFileName = `${fileNameWithoutExt}_cleaned.${fileExt}`;
  try {
    let cleanedData;
    if (file.type.startsWith('image')) {
      cleanedData = await window.electronAPI.removeImageMetadata(filePath);
    } else if (file.type.startsWith('video')) {
      cleanedData = await window.electronAPI.removeVideoMetadata(filePath);
    } else {
      alert("Поддержка удаления метаданных для данного типа файла отсутствует.");
      return;
    }
    const saveButton = document.getElementById('save-meta-button');
    saveButton.textContent = `Скачать ${outputFileName}`;
    saveButton.style.display = 'block';
    saveButton.onclick = async () => {
      const savePath = await window.electronAPI.showSaveDialog({
        title: "Сохранить очищенный файл",
        defaultPath: outputFileName,
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'tiff', 'heic'] },
          { name: 'Videos', extensions: ['mp4', 'avi', 'mkv'] }
        ]
      });
      if (!savePath.canceled && savePath.filePath) {
        await window.electronAPI.saveFile({
          filePath: savePath.filePath,
          data: cleanedData,
          isBase64: true
        });
      }
    };
  } catch (error) {
    alert(error.message);
  }
});