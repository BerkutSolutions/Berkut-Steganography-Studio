
function encryptText(text, key) {
  const hash = crypto.createHash('sha256').update(key, 'utf8').digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', hash, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return Buffer.from(iv).toString('hex') + ':' + encrypted;
}

function fileToBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

function binaryToText(binary) {
  const bytes = [];
  for (let i = 0; i < binary.length; i += 8) {
    const byte = binary.slice(i, i + 8);
    bytes.push(parseInt(byte, 2));
  }
  return Buffer.from(bytes).toString('utf8');
}

function embedMessage(imageData, message, fillPercentage = 100) {
  const data = imageData.data;
  const binaryMessage = textToBinary(message);
  const messageLength = binaryMessage.length;
  const maxLength = Math.floor((data.length / 4) * (fillPercentage / 100));

  if (messageLength > maxLength) {
    alert("Сообщение слишком длинное для выбранного изображения и процента заполнения.");
    return false;
  }

  const lengthBinary = messageLength.toString(2).padStart(32, '0');
  const fullBinary = lengthBinary + binaryMessage;
  let dataIndex = 0;

  for (let i = 0; i < fullBinary.length; i++) {
    data[dataIndex] = (data[dataIndex] & 0xFE) | parseInt(fullBinary[i]);
    dataIndex += 4;
  }

  return true;
}

document.getElementById('hide-button').addEventListener('click', async () => {
  console.log('Кнопка "Скрыть данные" нажата');

  const carrierInput = document.getElementById('carrier-file');
  const encryptionKey = document.getElementById('encryption-key').value;
  const fileType = document.getElementById('file-type').value;
  const inputMode = document.querySelector('input[name="input-mode"]:checked').value;
  const fillPercentage = parseInt(document.getElementById('fill-percentage').value) || 100;

  console.log('Входные данные:', { fileType, inputMode, fillPercentage, encryptionKey });

  if (!carrierInput.files[0]) {
    console.log('Файл-носитель не выбран');
    return;
  }

  let secretData;
  let secretFileName = null;
  if (inputMode === 'message') {
    secretData = document.getElementById('secret-text').value;
    console.log('Секретное сообщение:', secretData);
  } else if (inputMode === 'file') {
    const file = document.getElementById('secret-file').files[0];
    secretFileName = file.name;
    secretData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    secretData = `filename:${secretFileName}||${secretData}`;
    console.log('Секретный файл:', secretFileName, 'Данные:', secretData.slice(0, 50) + '...');
  } else if (inputMode === 'both') {
    const message = document.getElementById('secret-text').value;
    const file = document.getElementById('secret-file').files[0];
    secretFileName = file.name;
    const fileData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    secretData = `${message}||filename:${secretFileName}||${fileData}`;
    console.log('Сообщение и файл:', { message, fileData: fileData.slice(0, 50) + '...' });
  }

  if (encryptionKey) {
    secretData = await window.electronAPI.encryptText(secretData, encryptionKey);
    console.log('Зашифрованные данные:', secretData.slice(0, 50) + '...');
  }

  const originalFileName = carrierInput.files[0].name;
  const fileExt = originalFileName.split('.').pop();
  const fileNameWithoutExt = originalFileName.replace(`.${fileExt}`, '');
  
  let outputFileName;
  if (fileType === 'image') {
    outputFileName = `${fileNameWithoutExt}_hidden.png`;
  } else if (fileType === 'docx' || fileType === 'pdf') {
    outputFileName = `${fileNameWithoutExt}_hidden.${fileExt}`;
  } else if (inputMode === 'file' || inputMode === 'both') {
    outputFileName = `${fileNameWithoutExt}_hidden.${fileExt}`;
  } else {
    outputFileName = `${fileNameWithoutExt}_hidden.${fileExt}`;
  }
  const inputPath = carrierInput.files[0].path;
  console.log('Исходный путь к файлу:', inputPath);
  console.log('Имя выходного файла:', outputFileName);

  let result;
  try {
    if (fileType === 'docx') {
      result = await window.electronAPI.processDocx(inputPath, secretData);
    } else if (fileType === 'pdf') {
      result = await window.electronAPI.processPdf(inputPath, secretData);
    } else if (fileType === 'image') {
      const specificFileType = fileExt.toLowerCase() === 'jpg' || fileExt.toLowerCase() === 'jpeg' ? 'jpg' : 'png';
      console.log('Тип изображения:', specificFileType);
      result = await window.electronAPI.processImage(inputPath, secretData, specificFileType, fillPercentage);
    } else if (fileType === 'audio') {
      const { filePath: outputPath } = await window.electronAPI.showSaveDialog({
        title: 'Сохранить файл',
        defaultPath: outputFileName
      });
      if (!outputPath) {
        console.log('Пользователь отменил сохранение');
        return;
      }
      result = await window.electronAPI.processAudio(inputPath, outputPath, secretData);
      result = `file://${result}`;
    } else if (fileType === 'video') {
      const { filePath: outputPath } = await window.electronAPI.showSaveDialog({
        title: 'Сохранить файл',
        defaultPath: outputFileName
      });
      if (!outputPath) {
        console.log('Пользователь отменил сохранение');
        return;
      }
      result = await window.electronAPI.processVideo(inputPath, outputPath, secretData);
      result = `file://${result}`;
    } else {
      console.log('Тип файла не поддерживается');
      return;
    }

    console.log('Результат обработки:', result.slice(0, 50) + '...');
    const saveButton = document.getElementById('save-button');
    saveButton.textContent = `Скачать ${outputFileName}`;
    saveButton.style.display = 'block';
    saveButton.onclick = async () => {
      const { filePath } = await window.electronAPI.showSaveDialog({
        title: 'Сохранить файл',
        defaultPath: outputFileName
      });
      if (filePath) {
        await window.electronAPI.saveFile({
          filePath,
          data: result,
          isBase64: true 
        });
        console.log('Файл сохранён пользователем:', filePath);
      } else {
        console.log('Сохранение отменено пользователем');
      }
    };
  } catch (error) {
    console.error('Ошибка обработки:', error);
  }
});

document.getElementById('generate-key').addEventListener('click', async () => {
  console.log('Генерация ключа...');
  const generatedKey = await window.electronAPI.generateKey();
  document.getElementById('encryption-key').value = generatedKey;
  console.log('Сгенерированный ключ:', generatedKey);
});

function textToBinary(text) {
  return text.split('').map(char => 
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('');
}

function embedMessage(imageData, message) {
  const data = imageData.data;
  const binaryMessage = textToBinary(message);
  const messageLength = binaryMessage.length;

  if (messageLength > data.length / 4 - 32) {
    alert('Сообщение слишком длинное!');
    return false;
  }

  const lengthBinary = messageLength.toString(2).padStart(32, '0');
  const fullBinary = lengthBinary + binaryMessage;

  for (let i = 0; i < fullBinary.length; i++) {
    const byteIndex = i * 4;
    data[byteIndex] = (data[byteIndex] & 0xFE) | parseInt(fullBinary[i]);
  }

  return true;
}

function textToBinary(text) {
  return text
    .split('')
    .map((char) => {
      let bin = char.charCodeAt(0).toString(2);
      return '00000000'.slice(bin.length) + bin;
    })
    .join('');
}

/**
 * Внедряет скрытые данные в DOCX файл.
 * @param {string} filePath - Путь к исходному DOCX файлу.
 * @param {string} outputPath - Путь для сохранения нового DOCX файла.
 * @param {string} secretData - Скрытые данные для внедрения.
 */
function embedDataInDocx(filePath, outputPath, secretData) {
  try {
    const content = fs.readFileSync(filePath, 'binary');
    
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render({
      hiddenData: secretData,
    });

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, buffer);

  } catch (error) {
    throw new Error(`DOCX Error: ${error.message}`);
  }
}

/**
 * Внедряет скрытые данные в PDF файл.
 * @param {string} filePath - Путь к исходному PDF файлу.
 * @param {string} outputPath - Путь для сохранения нового PDF файла.
 * @param {string} secretData - Скрытые данные для внедрения.
 */
async function embedDataInPdf(filePath, outputPath, secretData) {
  const existingPdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const page = pdfDoc.getPages()[0];
  const annotation = page.doc.context.register(
    pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Text',
      Contents: secretData,
      Rect: [0, 0, 0, 0],
      Invisible: true
    })
  );
  page.node.set('Annots', [annotation]);
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}