const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { PDFDocument } = require('pdf-lib');
const { createCanvas, loadImage } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const exifr = require('exifr');
const sharp = require('sharp');
const fetch = require('node-fetch');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

let mainWindow;
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const currentVersion = '1.0.1';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    transparent: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenu(null);
  mainWindow.setBackgroundColor('#00000000');

  mainWindow.loadFile('index.html');

  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  mainWindow.on('minimize', () => {
    console.log('Window minimized');
    mainWindow.setBackgroundColor('#00000000');
  });

  mainWindow.on('restore', () => {
    console.log('Window restored');
    mainWindow.setBackgroundColor('#00000000');
    mainWindow.webContents.send('window-restored');
  });

  mainWindow.on('maximize', () => {
    console.log('Window maximized');
    mainWindow.setBackgroundColor('#00000000');
    mainWindow.webContents.send('window-maximized');
  });

  mainWindow.on('unmaximize', () => {
    console.log('Window unmaximized');
    mainWindow.setBackgroundColor('#00000000');
    mainWindow.webContents.send('window-unmaximized');
  });

  ipcMain.handle('minimize-window', () => {
    mainWindow.minimize();
  });

  ipcMain.handle('maximize-window', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('close-window', () => {
    mainWindow.close();
  });

  ipcMain.handle('get-settings', () => {
    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, JSON.stringify({ autoUpdate: false }, null, 2));
      mainWindow.webContents.send('show-update-prompt');
      return { autoUpdate: false };
    }
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    return settings;
  });

  ipcMain.handle('save-settings', (event, settings) => {
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
  });

  ipcMain.on('set-initial-update-setting', (event, value) => {
    const settings = { autoUpdate: value };
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
  });

  ipcMain.handle('check-for-updates', async () => {
    try {
      const response = await fetch('https://api.github.com/repos/BerkutSolutions/Berkut-Steganography-Studio/releases/latest');
      const data = await response.json();
      const latestVersion = data.tag_name.replace(/^v\.?/, '');
      return { currentVersion, latestVersion, downloadUrl: data.html_url };
    } catch (error) {
      console.error('Error checking updates:', error);
      return { currentVersion, latestVersion: null };
    }
  });

  ipcMain.on('open-external-link', (event, url) => {
    shell.openExternal(url);
  });
}

ipcMain.handle('createHash', (_, algorithm, data, encoding = 'hex') => {
  return crypto.createHash(algorithm).update(data).digest(encoding);
});

ipcMain.handle('encrypt-text', (_, text, key) => {
  const hash = crypto.createHash('sha256').update(key, 'utf8').digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', hash, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
});

ipcMain.handle('process-docx', (_, inputPath, secretData) => {
  const content = fs.readFileSync(inputPath);
  const zip = new PizZip(content);
  const customXmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties">
      <property fmtid="{D5CDD505-2E9C-101B-9397-08002B2CF9AE}" pid="2" name="StegoData">
        <vt:lpwstr xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">${secretData}</vt:lpwstr>
      </property>
    </Properties>`;
  zip.file('docProps/custom.xml', customXmlContent);
  const buffer = zip.generate({ type: 'nodebuffer' });
  return buffer.toString('base64');
});

ipcMain.handle('process-pdf', async (_, inputPath, secretData) => {
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.setTitle(`StegoData:${secretData}`);
  const pdfBytesModified = await pdfDoc.save();
  return Buffer.from(pdfBytesModified).toString('base64');
});

ipcMain.handle('process-image', async (_, inputPath, secretData, fileType, fillPercentage = 100) => {
  const normalizedPath = path.normalize(inputPath);
  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`No such file or directory`);
  }
  const tempDir = path.join(app.getPath('temp'), 'stego');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  const tempFileName = `image_${Date.now()}.${fileType}`;
  const tempPath = path.join(tempDir, tempFileName);
  fs.copyFileSync(normalizedPath, tempPath);
  try {
    const img = await loadImage(tempPath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const binaryMessage = [...secretData].map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
    const messageLength = binaryMessage.length;
    const lengthBinary = messageLength.toString(2).padStart(32, '0');
    const fullBinary = lengthBinary + binaryMessage;
    const maxCapacityBits = Math.floor((imageData.data.length / 4) * (fillPercentage / 100));
    if (fullBinary.length > maxCapacityBits) {
      throw new Error(`Сообщение слишком длинное для выбранного процента заполнения (${fillPercentage}%)`);
    }
    let dataIndex = 0;
    for (let i = 0; i < fullBinary.length; i++) {
      imageData.data[dataIndex] = (imageData.data[dataIndex] & 0xFE) | parseInt(fullBinary[i], 10);
      dataIndex += 4;
    }
    ctx.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    fs.unlinkSync(tempPath);
    return dataUrl;
  } catch (error) {
    console.error('Ошибка в process-image:', error.message);
    throw error;
  }
});

ipcMain.handle('process-audio', async (_, inputPath, outputPath, secretData) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([`-metadata comment="StegoData:${secretData}"`, '-c:a copy', '-c:v copy'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`Ошибка обработки аудио: ${err.message}`)));
  });
});

ipcMain.handle('process-video', async (_, inputPath, outputPath, secretData) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([`-metadata comment=StegoData:${secretData}`, '-c:a copy', '-c:v copy'])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(new Error(`Ошибка обработки видео: ${err.message}`)));
  });
});

ipcMain.handle('saveFile', async (_, { filePath, data, isBase64 }) => {
  try {
    if (isBase64) {
      const base64Data = data.startsWith('data:') ? data.split(',')[1] : data;
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    } else {
      fs.copyFileSync(data.replace('file://', ''), filePath);
    }
    return true;
  } catch (error) {
    console.error('Ошибка в saveFile:', error.message);
    throw error;
  }
});

ipcMain.handle('generate-key', () => {
  return crypto.randomBytes(32).toString('hex');
});

ipcMain.handle('show-save-dialog', async (_, options) => {
  const { dialog } = require('electron');
  return await dialog.showSaveDialog(options);
});

ipcMain.handle('extract-data-from-docx', (_, filePath) => {
  const content = fs.readFileSync(filePath, 'binary');
  const zip = new PizZip(content);
  const customXml = zip.file('docProps/custom.xml');
  if (customXml) {
    const xmlContent = customXml.asText();
    const match = xmlContent.match(/<vt:lpwstr[^>]*>([\s\S]*?)<\/vt:lpwstr>/i);
    return match ? match[1] : null;
  }
  return null;
});

ipcMain.handle('extract-data-from-pdf', async (_, filePath) => {
  const existingPdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const title = pdfDoc.getTitle();
  return title && title.startsWith('StegoData:') ? title.split('StegoData:')[1] : null;
});

ipcMain.handle('extract-data-from-audio', async (_, filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Ошибка извлечения метаданных аудио: ${err.message}`));
        return;
      }
      const comment = metadata.format.tags?.comment;
      const result = comment && comment.startsWith('StegoData:') ? comment.split('StegoData:')[1] : null;
      resolve(result);
    });
  });
});

ipcMain.handle('extract-data-from-video', async (_, filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Ошибка извлечения метаданных видео: ${err.message}`));
        return;
      }
      const comment = metadata.format.tags?.comment;
      let result = null;
      if (comment) {
        const cleanedComment = comment.replace(/^"|"$/g, '');
        result = cleanedComment.startsWith('StegoData:') ? cleanedComment.split('StegoData:')[1] : null;
      }
      resolve(result);
    });
  });
});

ipcMain.handle('readImageMetadata', async (_, filePath) => {
  try {
    const metadata = await exifr.parse(filePath, { gps: true, exif: true, iptc: true, xmp: true });
    let formattedMetadata = "Метаданные изображения:\n";
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        formattedMetadata += `${key}: ${value}\n`;
      }
    } else {
      formattedMetadata += "Метаданные отсутствуют.\n";
    }
    return formattedMetadata;
  } catch (error) {
    console.error('Ошибка в readImageMetadata:', error.message);
    return "Ошибка при чтении метаданных.";
  }
});

ipcMain.handle('readVideoMetadata', (_, filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('Ошибка в readVideoMetadata:', err.message);
        reject("Ошибка при чтении метаданных.");
        return;
      }
      let formattedMetadata = "Метаданные видео:\n";
      if (metadata && metadata.format) {
        formattedMetadata += `Формат: ${metadata.format.format_name}\n`;
        formattedMetadata += `Продолжительность: ${metadata.format.duration} секунд\n`;
        formattedMetadata += `Размер файла: ${metadata.format.size} байт\n`;
        formattedMetadata += `Битрейт: ${metadata.format.bit_rate} бит/сек\n`;
        if (metadata.format.tags) {
          formattedMetadata += "\nТеги:\n";
          for (const [key, value] of Object.entries(metadata.format.tags)) {
            formattedMetadata += `  ${key}: ${value}\n`;
          }
        }
      }
      if (metadata && metadata.streams) {
        metadata.streams.forEach((stream, index) => {
          formattedMetadata += `\nПоток ${index + 1}:\n`;
          formattedMetadata += `  Кодек: ${stream.codec_name}\n`;
          formattedMetadata += `  Тип: ${stream.codec_type}\n`;
          if (stream.width && stream.height) {
            formattedMetadata += `  Разрешение: ${stream.width}x${stream.height}\n`;
          }
          if (stream.bit_rate) {
            formattedMetadata += `  Битрейт: ${stream.bit_rate} бит/сек\n`;
          }
          if (stream.tags) {
            formattedMetadata += "  Метаданные потока:\n";
            for (const [key, value] of Object.entries(stream.tags)) {
              formattedMetadata += `    ${key}: ${value}\n`;
            }
          }
        });
      }
      resolve(formattedMetadata);
    });
  });
});

ipcMain.handle('removeImageMetadata', async (_, filePath) => {
  try {
    const image = sharp(filePath);
    const cleanedBuffer = await image
      .rotate()
      .withMetadata(false) 
      .png({ quality: 100 })
      .toBuffer();

    const metadata = await exifr.parse(cleanedBuffer);
    if (metadata && Object.keys(metadata).length > 0) {
      console.warn('Метаданные не были полностью удалены:', metadata);
    } else {
      console.log('Метаданные успешно удалены');
    }

    return cleanedBuffer.toString('base64');
  } catch (error) {
    console.error('Ошибка в removeImageMetadata:', error.message);
    throw new Error("Не удалось удалить метаданные изображения.");
  }
});

ipcMain.handle('removeVideoMetadata', (_, filePath) => {
  return new Promise((resolve, reject) => {
    const outputFilePath = path.join(app.getPath('temp'), 'clean_video' + path.extname(filePath));
    ffmpeg(filePath)
      .outputOptions('-map_metadata -1')
      .save(outputFilePath)
      .on('end', () => {
        const buffer = fs.readFileSync(outputFilePath);
        fs.unlinkSync(outputFilePath);
        resolve(buffer.toString('base64'));
      })
      .on('error', (err) => {
        console.error('Ошибка в removeVideoMetadata:', err.message);
        reject("Не удалось удалить метаданные.");
      });
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const settings = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, 'utf8')) : {};
  if (settings.autoUpdate) {
    checkForUpdates();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

async function checkForUpdates() {
  try {
    const response = await fetch('https://api.github.com/repos/BerkutSolutions/Berkut-Steganography-Studio/releases/latest');
    const data = await response.json();
    const latestVersion = data.tag_name.replace(/^v\.?/, '');
    console.log(`Current version: ${currentVersion}, Latest version: ${latestVersion}`);
    if (latestVersion && compareVersions(latestVersion, currentVersion) > 0) {
      console.log(`Update available: ${latestVersion}`);
      mainWindow.webContents.send('update-available', { version: latestVersion, downloadUrl: data.html_url });
    } else {
      console.log('No update available.');
    }
  } catch (error) {
    console.error('Error checking updates in checkForUpdates:', error);
  }
}

function compareVersions(v1, v2) {
  const parseVersion = (version) => {
    const [mainPart, suffix = ''] = version.split('-');
    const parts = mainPart.split('.').map(Number);
    return { parts, suffix };
  };

  const version1 = parseVersion(v1);
  const version2 = parseVersion(v2);

  const maxLength = Math.max(version1.parts.length, version2.parts.length);
  for (let i = 0; i < maxLength; i++) {
    const part1 = version1.parts[i] || 0;
    const part2 = version2.parts[i] || 0;
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  if (version1.suffix && !version2.suffix) return 1;
  if (!version1.suffix && version2.suffix) return -1;
  if (version1.suffix && version2.suffix) {
    return version1.suffix.localeCompare(version2.suffix);
  }
  return 0;
}
