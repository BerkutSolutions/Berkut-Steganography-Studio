const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  createHash: (algorithm, data, encoding) => ipcRenderer.invoke('createHash', algorithm, data, encoding),
  encryptText: (text, key) => ipcRenderer.invoke('encrypt-text', text, key),
  generateKey: () => ipcRenderer.invoke('generate-key'),
  processDocx: (inputPath, secretData) => ipcRenderer.invoke('process-docx', inputPath, secretData),
  processPdf: (inputPath, secretData) => ipcRenderer.invoke('process-pdf', inputPath, secretData),
  processImage: (inputPath, secretData, fileType, fillPercentage) => ipcRenderer.invoke('process-image', inputPath, secretData, fileType, fillPercentage),
  processAudio: (inputPath, outputPath, secretData) => ipcRenderer.invoke('process-audio', inputPath, outputPath, secretData),
  processVideo: (inputPath, outputPath, secretData) => ipcRenderer.invoke('process-video', inputPath, outputPath, secretData),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  saveFile: (options) => ipcRenderer.invoke('saveFile', options),
  extractDataFromDocx: (filePath) => ipcRenderer.invoke('extract-data-from-docx', filePath),
  extractDataFromPdf: (filePath) => ipcRenderer.invoke('extract-data-from-pdf', filePath),
  extractDataFromAudio: (filePath) => ipcRenderer.invoke('extract-data-from-audio', filePath),
  extractDataFromVideo: (filePath) => ipcRenderer.invoke('extract-data-from-video', filePath),
  readImageMetadata: (filePath) => ipcRenderer.invoke('readImageMetadata', filePath),
  readVideoMetadata: (filePath) => ipcRenderer.invoke('readVideoMetadata', filePath),
  removeImageMetadata: (filePath) => ipcRenderer.invoke('removeImageMetadata', filePath),
  removeVideoMetadata: (filePath) => ipcRenderer.invoke('removeVideoMetadata', filePath)
});