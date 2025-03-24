# Berkut Steganography Studio 🦅

![prog](https://github.com/user-attachments/assets/9e559848-613d-44a6-9ce3-f76d674dc167)

**Berkut Steganography Studio** — это мощное и интуитивно понятное приложение для стеганографии и работы с метаданными, разработанное на Electron. Оно позволяет скрывать данные в различных типах файлов (изображения, аудио, видео, документы) и управлять метаданными, обеспечивая конфиденциальность и удобство.

---

## 🚀 Основные функции

### 🔒 Стеганография
- Скрытие данных в изображениях (PNG, JPG, BMP, TIFF), аудио (MP3, WAV), видео (MP4, AVI), документах (DOCX, PDF).
- Поддержка шифрования секретных данных с помощью ключа.
- Настраиваемый процент заполнения для изображений.

### 🧹 Управление метаданными
- Просмотр метаданных изображений и видео.
- Полное удаление метаданных из файлов (EXIF, GPS и др.).
- Сохранение очищенных файлов в удобном формате.

### 🔑 Шифрование
- Генерация случайных ключей для защиты данных.
- Шифрование текста с использованием алгоритма AES-256.

### 💾 Экспорт и импорт
- Сохранение обработанных файлов с интуитивным диалогом выбора пути.
- Поддержка извлечения скрытых данных из носителей.

### 🎨 Интерфейс
- Удобная вкладочная структура: "Скрыть данные", "Извлечь данные", "Метаданные".
- Адаптивный дизайн с поддержкой светлой темы.

### 🔄 Автоматическая проверка обновлений
- Функция автоматической проверки обновлений через GitHub.
- Уведомления о новых версиях с возможностью перехода к загрузке.

---

## 🛠 Установка и запуск

### Требования
- [Node.js](https://nodejs.org/) (версия 16 или выше)
- [Git](https://git-scm.com/) (для клонирования репозитория)

### Шаги для запуска
1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/BerkutSolutions/Berkut-Steganography-Studio.git
   ```

2. Перейдите в папку проекта:
   ```bash
   cd Berkut-Steganography-Studio
   ```

3. Установите зависимости:
   ```bash
   npm install
   ```

4. Запустите приложение:
   ```bash
   npm start
   ```

### 📦 Сборка исполняемого файла
1. Установите electron-builder:
   ```bash
   npm install --save-dev electron-builder
   ```

2. Выполните сборку для Windows:
   ```bash
   npm run build
   ```

Исполняемый файл `.exe` будет сохранён в указанную в `package.json` папку.

### 📂 Структура проекта
```plaintext
Berkut-Steganography-Studio/
├── main.js               # Основной процесс Electron
├── preload.js            # Предзагрузочный скрипт
├── renderer.js           # Логика интерфейса
├── hideRenderer.js       # Обработка вкладки "Скрыть данные"
├── encryptionEngine.js   # Логика шифрования
├── extractRenderer.js    # Обработка вкладки "Извлечь данные"
├── metadata.js           # Обработка вкладки "Метаданные"
├── index.html            # Главный HTML-файл
├── styles.css            # Стили приложения
└── package.json          # Зависимости и настройки проекта
```

---

## 📄 Лицензия
Этот проект распространяется под лицензией Apache-2.0. Подробности см. в `package.json`.

---

## 🤝 Как внести вклад
Если вы хотите улучшить проект:

1. Форкните репозиторий.
2. Создайте новую ветку:
   ```bash
   git checkout -b feature/ваша-фича
   ```
3. Внесите изменения и создайте коммит:
   ```bash
   git commit -m "Добавлена новая фича: ..."
   ```
4. Отправьте изменения в ваш форк:
   ```bash
   git push origin feature/ваша-фича
   ```
5. Создайте Pull Request в основном репозитории.

---

## 📞 Контакты
Если у вас есть вопросы или предложения, свяжитесь со мной:

**Автор**: Келиберда Александр Дмитриевич  
**GitHub**: [BerkutSolutions](https://github.com/BerkutSolutions)  
**E-Mail**: [aleksandr@keliberda.ru](mailto:aleksandr@keliberda.ru)
