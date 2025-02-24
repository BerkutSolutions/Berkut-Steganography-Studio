const crypto = require('crypto-browserify');

/**
 * Шифрует данные файла с использованием AES-256-CBC.
 * @param {Buffer} data - Данные файла.
 * @param {string} key - Ключ шифрования.
 * @returns {Buffer} - Зашифрованные данные с IV.
 */
function encryptBufferAES(data, key) {
  const hash = crypto.createHash('sha256').update(key, 'utf8').digest(); 
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', hash, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

/**
 * Шифрует данные файла выбранным методом.
 * @param {Buffer} data - Данные файла.
 * @param {string} key - Ключ шифрования.
 * @param {string} method - Метод шифрования ('aes').
 * @returns {Buffer} - Зашифрованные данные.
 */
function encryptFileBuffer(data, key, method = 'aes') {
  if (method === 'aes') {
    return encryptBufferAES(data, key);
  } else {
    throw new Error("Неизвестный метод шифрования");
  }
}

module.exports = {
  encryptFileBuffer
};