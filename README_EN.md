<p align="center">
  <img src="icons/icon128.png" alt="Google Image Batch Translator" width="128" height="128">
</p>

<h1 align="center">Google Image Batch Translator</h1>

<p align="center">
  <a href="README_EN.md">English</a> |
  <a href="README.md">中文</a> |
  <a href="README_JA.md">日本語</a>
</p>

<p align="center">
  A Chrome browser extension for batch translating images, implemented based on Google's image translation functionality.
</p>

## Features

- **Batch Upload**: Support selecting multiple images for translation at once
- **Auto Download**: Automatically download translated images after completion
- **Multi-language Interface**: Support for Chinese, English, and Japanese interface languages
- **Image Management**: Support removing added images and drag-and-drop to adjust translation order
- **Connection Test**: Built-in connection test feature to check if Google Translate service is available
- **Progress Display**: Real-time display of translation progress and status

## Installation

### Install from Source

1. Download or clone this repository to your local machine
2. Open Chrome browser and go to the extensions management page
   - Type `chrome://extensions/` in the address bar
   - Or via menu: More tools → Extensions
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked"
5. Select the folder where this project is located

## Usage

### Basic Usage

1. **Open Translation Page**
   - Click the extension icon in the browser toolbar
   - Or manually visit [Google Translate Images page](https://translate.google.com/?op=images)

2. **Add Images**
   - Click the "Select Images" button to choose images to translate
   - Or directly drag and drop images into the upload area

3. **Manage Images**
   - Click the "×" button in the image list to remove a single image
   - Drag and drop images to adjust translation order

4. **Start Translation**
   - Click the "Start Translation" button
   - Wait for translation to complete, translated images will be automatically downloaded

### Interface Description

- **Language Switch**: Select interface language (Chinese/English/Japanese) on the right side of the panel header
- **Open Translation Page**: Quickly open Google Translate Images page
- **Connection Test**: Check if the current network can access Google Translate service normally
- **Status Indicator**: Show whether currently on the correct translation page

## Notes

1. Please make sure to use this extension on the **Google Translate Images page**, not the text translation page
2. Translated images will be saved to the "Google Translate" folder in the browser's download directory
3. If translation fails, please check network connection or try using the connection test feature

## Supported Image Formats

- PNG
- JPG/JPEG

## Tech Stack

- Chrome Extension Manifest V3
- Vanilla JavaScript
- CSS3

## Directory Structure

```
├── manifest.json        # Extension configuration file
├── background/          # Background service scripts
│   └── background.js
├── content/             # Content scripts
│   ├── content.js       # Main logic
│   └── content.css      # Style file
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── popup/               # Popup page (backup)
    ├── popup.html
    ├── popup.js
    └── popup.css
```

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!
