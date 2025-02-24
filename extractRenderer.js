function decryptText(data, key) {
  console.log('decryptText вызван:', { data, key });
  const [ivHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const hash = crypto.createHash('sha256').update(key).digest();
  const decipher = crypto.createDecipheriv('aes-256-cbc', hash, iv);
  const result = decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
  console.log('Расшифрованные данные:', result);
  return result;
}

function processExtractedData(data) {
  console.log('processExtractedData вызван:', data);
  const outputText = document.getElementById('extracted-text');
  const saveButton = document.getElementById('save-extracted-button');

  let fileName = 'downloaded_file';
  let fileData = data;

  if (data.includes('filename:')) {
    const parts = data.split('||');
    for (const part of parts) {
      if (part.startsWith('filename:')) {
        fileName = part.replace('filename:', '');
      } else if (part.startsWith('data:')) {
        fileData = part;
      } else {
        outputText.value = part;
      }
    }
    console.log('Извлечённое имя файла:', fileName, 'Данные:', fileData.slice(0, 50) + '...');
    saveButton.style.display = 'block';
    saveButton.onclick = async () => {
      const { filePath } = await window.electronAPI.showSaveDialog({
        title: 'Сохранить извлечённый файл',
        defaultPath: fileName
      });
      if (filePath) {
        await window.electronAPI.saveFile({
          filePath,
          data: fileData,
          isBase64: true
        });
        console.log('Извлечённый файл сохранён:', filePath);
      } else {
        console.log('Сохранение отменено пользователем');
      }
    };
  } else if (data.includes('||')) {
    const [text, filePart] = data.split('||');
    outputText.value = text;
    saveButton.style.display = 'block';
    saveButton.onclick = async () => {
      const { filePath } = await window.electronAPI.showSaveDialog({
        title: 'Сохранить извлечённый файл',
        defaultPath: fileName
      });
      if (filePath) {
        await window.electronAPI.saveFile({
          filePath,
          data: filePart,
          isBase64: true
        });
        console.log('Извлечённый файл сохранён:', filePath);
      }
    };
  } else if (data.startsWith('data:')) {
    console.log('Обнаружен файл в формате Base64');
    saveButton.style.display = 'block';
    saveButton.onclick = async () => {
      const { filePath } = await window.electronAPI.showSaveDialog({
        title: 'Сохранить извлечённый файл',
        defaultPath: fileName
      });
      if (filePath) {
        await window.electronAPI.saveFile({
          filePath,
          data: data,
          isBase64: true
        });
        console.log('Извлечённый файл сохранён:', filePath);
      }
    };
  } else {
    console.log('Простой текст:', data);
    outputText.value = data;
  }
}

function binaryToText(binary) {
  console.log('binaryToText вызван, двоичные данные:', binary);
  const bytes = binary.match(/.{8}/g) || [];
  const text = bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
  console.log('Преобразованный текст:', text);
  return text;
}

function extractMessage(imageData) {
  console.log('extractMessage вызван, размер данных:', imageData.data.length);
  const data = imageData.data;
  let binary = '';
  
  for (let i = 0; i < 32; i++) {
    binary += (data[i * 4] & 1).toString();
  }
  const length = parseInt(binary, 2);
  console.log('Длина сообщения (в битах):', length);

  const maxLength = Math.floor(imageData.data.length / 4) - 32;
  if (length > maxLength * 8 || length < 0) {
    console.error('Некорректная длина сообщения, возможно, данные повреждены:', length);
    return '';
  }

  binary = '';
  for (let i = 32; i < 32 + length; i++) {
    binary += (data[i * 4] & 1).toString();
  }
  console.log('Извлечённые двоичные данные:', binary);

  let text = '';
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    text += String.fromCharCode(parseInt(byte, 2));
  }
  console.log('Преобразованный текст:', text);
  return text;
}

document.getElementById('extract-button').addEventListener('click', async () => {
  console.log('Кнопка "Извлечь данные" нажата');
  const stegoInput = document.getElementById('stego-file');
  const decryptionKey = document.getElementById('decryption-key').value;

  if (!stegoInput.files[0]) {
    console.log('Файл со скрытыми данными не выбран');
    return;
  }

  try {
    const file = stegoInput.files[0];
    console.log('Выбранный файл:', { name: file.name, type: file.type, path: file.path });

    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/bmp', 'image/tiff',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac',
      'video/mp4', 'video/avi', 'video/x-matroska', 'video/quicktime',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      console.log('Неподдерживаемый формат файла');
      return;
    }

    let extractedData;

    if (file.type.startsWith('image')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('Файл прочитан как DataURL');
        const img = new Image();
        img.onload = () => {
          console.log('Изображение загружено:', { width: img.width, height: img.height });
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          extractedData = extractMessage(imageData);

          if (decryptionKey) {
            try {
              extractedData = decryptText(extractedData, decryptionKey);
            } catch (err) {
              console.error('Ошибка расшифровки:', err);
              return;
            }
          }

          processExtractedData(extractedData);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractedData = await window.electronAPI.extractDataFromDocx(file.path);
      console.log('Данные из DOCX:', extractedData);
    } else if (file.type === 'application/pdf') {
      extractedData = await window.electronAPI.extractDataFromPdf(file.path);
      console.log('Данные из PDF:', extractedData);
    } else if (file.type.startsWith('audio')) {
      extractedData = await window.electronAPI.extractDataFromAudio(file.path);
      console.log('Данные из аудио:', extractedData);
    } else if (file.type.startsWith('video')) {
      extractedData = await window.electronAPI.extractDataFromVideo(file.path);
      console.log('Данные из видео:', extractedData);
    }

    if (extractedData && file.type.startsWith('image') === false) {
      processExtractedData(extractedData);
    }
  } catch (error) {
    console.error('Ошибка извлечения:', error);
  }
});

function base64ToBlob(dataUrl) {
  console.log('base64ToBlob вызван:', dataUrl.slice(0, 50) + '...');
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  
  for (let i = 0; i < bytes.length; i++) {
    buffer[i] = bytes.charCodeAt(i);
  }
  
  const blob = new Blob([buffer], { type: mime });
  console.log('Blob создан:', { size: blob.size, type: blob.type });
  return blob;
}