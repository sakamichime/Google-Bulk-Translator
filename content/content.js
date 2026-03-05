/**
 * Google图片批量翻译插件 - Content Script
 * 
 * 功能说明：
 * 1. 在Google翻译页面注入控制面板
 * 2. 支持批量上传图片进行翻译
 * 3. 自动下载翻译结果
 * 4. 支持多语言界面（中文、英文、日文）
 * 
 * @author Google图片批量翻译插件
 * @version 1.0.0
 */

console.log('[Google翻译自动化] Content script 开始加载...');

/**
 * 多语言翻译配置
 * 支持中文、英文、日文三种语言
 */
const I18N = {
  'zh-CN': {
    title: 'Google图片批量翻译',
    selectImages: '选择图片',
    clickOrDrag: '点击或拖拽图片到此处',
    supportedFormats: '支持 JPG、PNG、WebP、GIF',
    languageSettings: '语言设置',
    sourceLang: '源语言',
    targetLang: '目标语言',
    switchToImage: '切换到图片翻译',
    startTranslation: '开始翻译',
    stop: '停止',
    pleaseSwitchToImage: '请先切换到图片翻译页面',
    readyToTranslate: '已就绪，可以开始翻译',
    translationDelay: '翻译等待时间 (ms)',
    showOverlay: '显示翻译进度遮罩',
    retryOnError: '失败时自动重试',
    clearList: '清空列表',
    pending: '等待中',
    processing: '翻译中',
    completed: '已完成',
    error: '失败',
    retry: '重试',
    openImagePage: '打开图片翻译页面',
    testConnection: '测试连接',
    connectionSuccess: '连接成功',
    connectionFailed: '连接失败',
    remove: '移除',
    notice: '提示：请打开图片翻译页面而不是文本翻译页面',
    interfaceLang: '界面语言',
    order: '顺序'
  },
  'en': {
    title: 'Google Image Batch Translation',
    selectImages: 'Select Images',
    clickOrDrag: 'Click or drag images here',
    supportedFormats: 'Supports JPG, PNG, WebP, GIF',
    languageSettings: 'Language Settings',
    sourceLang: 'Source Language',
    targetLang: 'Target Language',
    switchToImage: 'Switch to Image Translation',
    startTranslation: 'Start Translation',
    stop: 'Stop',
    pleaseSwitchToImage: 'Please switch to image translation page first',
    readyToTranslate: 'Ready to translate',
    translationDelay: 'Translation Delay (ms)',
    showOverlay: 'Show translation progress overlay',
    retryOnError: 'Auto retry on error',
    clearList: 'Clear List',
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    error: 'Error',
    retry: 'Retry',
    openImagePage: 'Open Image Translation Page',
    testConnection: 'Test Connection',
    connectionSuccess: 'Connection Successful',
    connectionFailed: 'Connection Failed',
    remove: 'Remove',
    notice: 'Notice: Please open the image translation page, not the text translation page',
    interfaceLang: 'Interface Language',
    order: 'Order'
  },
  'ja': {
    title: 'Google画像一括翻訳',
    selectImages: '画像を選択',
    clickOrDrag: 'クリックまたはドラッグで画像を追加',
    supportedFormats: 'JPG、PNG、WebP、GIF対応',
    languageSettings: '言語設定',
    sourceLang: 'ソース言語',
    targetLang: 'ターゲット言語',
    switchToImage: '画像翻訳に切り替え',
    startTranslation: '翻訳開始',
    stop: '停止',
    pleaseSwitchToImage: '画像翻訳ページに切り替えてください',
    readyToTranslate: '翻訳準備完了',
    translationDelay: '翻訳待機時間 (ms)',
    showOverlay: '翻訳進捗オーバーレイを表示',
    retryOnError: 'エラー時に自動再試行',
    clearList: 'リストをクリア',
    pending: '待機中',
    processing: '翻訳中',
    completed: '完了',
    error: 'エラー',
    retry: '再試行',
    openImagePage: '画像翻訳ページを開く',
    testConnection: '接続テスト',
    connectionSuccess: '接続成功',
    connectionFailed: '接続失敗',
    remove: '削除',
    notice: '注意：テキスト翻訳ではなく、画像翻訳ページを開いてください',
    interfaceLang: 'インターフェース言語',
    order: '順序'
  }
};

/**
 * 支持的翻译语言列表
 */
const LANGUAGES = {
  'ja': '日语',
  'en': '英语',
  'ko': '韩语',
  'zh-CN': '中文（简体）',
  'zh-TW': '繁体中文',
  'fr': '法语',
  'de': '德语',
  'es': '西班牙语',
  'ru': '俄语',
  'auto': '自动检测'
};

/**
 * Google翻译自动化主类
 * 负责管理整个翻译流程
 */
class GoogleTranslateAutomation {
  constructor() {
    this.files = [];
    this.currentIndex = 0;
    this.isProcessing = false;
    this.settings = {
      sourceLang: 'ja',
      targetLang: 'zh-CN',
      downloadDelay: 3000,
      showOverlay: true,
      retryOnError: true
    };
    this.panelVisible = false;
    this.currentLang = 'zh-CN';
    this.init();
  }

  /**
   * 检测浏览器语言设置
   * @returns {string} 语言代码
   */
  detectLanguage() {
    const urlParams = new URLSearchParams(window.location.search);
    const hl = urlParams.get('hl') || '';
    const browserLang = navigator.language || navigator.userLanguage || '';
    
    if (hl.startsWith('zh') || browserLang.startsWith('zh')) {
      return 'zh-CN';
    } else if (hl.startsWith('ja') || browserLang.startsWith('ja')) {
      return 'ja';
    } else if (hl.startsWith('en') || browserLang.startsWith('en')) {
      return 'en';
    }
    return 'zh-CN';
  }

  /**
   * 获取翻译文本
   * @param {string} key - 翻译键
   * @returns {string} 翻译后的文本
   */
  t(key) {
    return I18N[this.currentLang]?.[key] || I18N['zh-CN'][key] || key;
  }

  /**
   * 应用多语言到界面
   */
  applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
  }

  /**
   * 初始化插件
   */
  init() {
    this.currentLang = this.detectLanguage();
    this.loadSettings();
    this.createToggleBtn();
    this.createPanel();
    this.createStatusOverlay();
    this.bindMessageListener();
    console.log('[Google翻译自动化] Content script 已加载, 语言:', this.currentLang);
  }

  /**
   * 加载保存的设置
   */
  loadSettings() {
    chrome.storage.local.get([
      'sourceLang', 'targetLang', 'downloadDelay', 
      'showOverlay', 'retryOnError'
    ], (result) => {
      if (result.sourceLang !== undefined) this.settings.sourceLang = result.sourceLang;
      if (result.targetLang !== undefined) this.settings.targetLang = result.targetLang;
      if (result.downloadDelay !== undefined) this.settings.downloadDelay = result.downloadDelay;
      if (result.showOverlay !== undefined) this.settings.showOverlay = result.showOverlay;
      if (result.retryOnError !== undefined) this.settings.retryOnError = result.retryOnError;
      this.updateLangSelects();
    });
  }

  /**
   * 保存设置到本地存储
   */
  saveSettings() {
    this.settings.downloadDelay = parseInt(document.getElementById('gtDownloadDelay').value) || 3000;
    this.settings.showOverlay = document.getElementById('gtShowOverlay').checked;
    this.settings.retryOnError = document.getElementById('gtRetryOnError').checked;
    chrome.storage.local.set(this.settings);
  }

  /**
   * 更新语言选择器
   */
  updateLangSelects() {
    const downloadDelay = document.getElementById('gtDownloadDelay');
    const showOverlay = document.getElementById('gtShowOverlay');
    const retryOnError = document.getElementById('gtRetryOnError');
    if (downloadDelay) downloadDelay.value = this.settings.downloadDelay;
    if (showOverlay) showOverlay.checked = this.settings.showOverlay;
    if (retryOnError) retryOnError.checked = this.settings.retryOnError;
  }

  /**
   * 创建切换按钮
   */
  createToggleBtn() {
    const btn = document.createElement('button');
    btn.className = 'gt-auto-toggle-btn';
    btn.id = 'gtAutoToggleBtn';
    btn.innerHTML = '🖼️';
    btn.title = 'Google图片批量翻译';
    btn.addEventListener('click', () => this.togglePanel());
    document.body.appendChild(btn);
  }

  /**
   * 切换面板显示状态
   */
  togglePanel() {
    this.panelVisible = !this.panelVisible;
    const panel = document.getElementById('gtAutoPanel');
    const btn = document.getElementById('gtAutoToggleBtn');
    if (this.panelVisible) {
      panel.style.display = 'flex';
      btn.style.display = 'none';
    } else {
      panel.style.display = 'none';
      btn.style.display = 'flex';
    }
  }

  /**
   * 创建控制面板
   */
  createPanel() {
    const panel = document.createElement('div');
    panel.className = 'gt-auto-panel';
    panel.id = 'gtAutoPanel';
    panel.style.display = 'none';
    
    panel.innerHTML = `
      <div class="gt-auto-panel-header" id="gtPanelHeader">
        <div class="gt-auto-panel-title">
          <span>🖼️</span>
          <span data-i18n="title">${this.t('title')}</span>
        </div>
        <div class="gt-auto-header-actions">
          <select id="gtInterfaceLang" class="gt-auto-lang-select">
            <option value="zh-CN">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
          <button class="gt-auto-panel-close" id="gtPanelClose">×</button>
        </div>
      </div>
      
      <div class="gt-auto-notice" id="gtNotice">
        <span>📢</span>
        <span data-i18n="notice">${this.t('notice')}</span>
      </div>
      
      <div class="gt-auto-panel-body">
        <div class="gt-auto-section">
          <div class="gt-auto-section-title">📁 <span data-i18n="selectImages">${this.t('selectImages')}</span></div>
          <div class="gt-auto-file-area" id="gtFileArea">
            <div class="gt-auto-file-icon">📤</div>
            <div class="gt-auto-file-text" data-i18n="clickOrDrag">${this.t('clickOrDrag')}</div>
            <div class="gt-auto-file-hint" data-i18n="supportedFormats">${this.t('supportedFormats')}</div>
            <input type="file" class="gt-auto-file-input" id="gtFileInput" accept="image/jpeg,image/png,image/webp,image/gif" multiple>
          </div>
          <div class="gt-auto-file-list" id="gtFileList" style="display: none;"></div>
          <div class="gt-auto-progress" id="gtProgress" style="display: none;">
            <div class="gt-auto-progress-bar">
              <div class="gt-auto-progress-fill" id="gtProgressFill"></div>
            </div>
            <div class="gt-auto-progress-text">
              <span id="gtProgressText">0 / 0</span>
              <span id="gtProgressPercent">0%</span>
            </div>
          </div>
        </div>

        <div class="gt-auto-buttons">
          <button class="gt-auto-btn gt-auto-btn-secondary" id="gtOpenImageBtn">
            <span>🔗</span>
            <span data-i18n="openImagePage">${this.t('openImagePage')}</span>
          </button>
          <button class="gt-auto-btn gt-auto-btn-success" id="gtStartBtn" disabled>
            <span>▶️</span>
            <span data-i18n="startTranslation">${this.t('startTranslation')}</span>
          </button>
          <button class="gt-auto-btn gt-auto-btn-danger" id="gtStopBtn" style="display: none;">
            <span>⏹️</span>
            <span data-i18n="stop">${this.t('stop')}</span>
          </button>
        </div>
        
        <div class="gt-auto-status-bar" id="gtStatusBar">
          <span id="gtStatusIcon">⚠️</span>
          <span id="gtStatusText" data-i18n="pleaseSwitchToImage">${this.t('pleaseSwitchToImage')}</span>
          <button class="gt-auto-btn gt-auto-btn-small" id="gtTestConnBtn">
            <span>🔍</span>
            <span data-i18n="testConnection">${this.t('testConnection')}</span>
          </button>
        </div>

        <div class="gt-auto-settings">
          <div class="gt-auto-setting-item">
            <label data-i18n="translationDelay">${this.t('translationDelay')}</label>
            <input type="number" id="gtDownloadDelay" value="3000" min="1000" max="30000" step="500">
          </div>
          <div class="gt-auto-setting-item">
            <label>
              <input type="checkbox" id="gtShowOverlay" checked>
              <span data-i18n="showOverlay">${this.t('showOverlay')}</span>
            </label>
          </div>
          <div class="gt-auto-setting-item">
            <label>
              <input type="checkbox" id="gtRetryOnError" checked>
              <span data-i18n="retryOnError">${this.t('retryOnError')}</span>
            </label>
          </div>
        </div>

        <div class="gt-auto-log" id="gtLog" style="display: none;"></div>
      </div>
    `;

    document.body.appendChild(panel);
    this.bindPanelEvents();
    this.updateLangSelects();
    
    document.getElementById('gtInterfaceLang').value = this.currentLang;
  }

  /**
   * 绑定面板事件
   */
  bindPanelEvents() {
    document.getElementById('gtPanelClose').addEventListener('click', () => this.togglePanel());
    
    this.makeDraggable();

    const fileArea = document.getElementById('gtFileArea');
    const fileInput = document.getElementById('gtFileInput');

    fileArea.addEventListener('click', () => fileInput.click());
    
    fileArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileArea.classList.add('dragover');
    });
    
    fileArea.addEventListener('dragleave', () => {
      fileArea.classList.remove('dragover');
    });
    
    fileArea.addEventListener('drop', (e) => {
      e.preventDefault();
      fileArea.classList.remove('dragover');
      this.handleFileSelect(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.isTrusted && e.target === fileInput && fileInput.files.length > 0) {
        this.handleFileSelect(e.target.files);
      }
    });

    document.getElementById('gtInterfaceLang').addEventListener('change', (e) => {
      this.currentLang = e.target.value;
      this.applyI18n();
      chrome.storage.local.set({ interfaceLang: this.currentLang });
    });

    document.getElementById('gtOpenImageBtn').addEventListener('click', () => this.openImageTranslationPage());
    document.getElementById('gtStartBtn').addEventListener('click', () => this.startTranslation());
    document.getElementById('gtStopBtn').addEventListener('click', () => this.stopTranslation());
    document.getElementById('gtTestConnBtn').addEventListener('click', () => this.testConnection());

    document.getElementById('gtDownloadDelay').addEventListener('change', () => this.saveSettings());
    document.getElementById('gtShowOverlay').addEventListener('change', () => this.saveSettings());
    document.getElementById('gtRetryOnError').addEventListener('change', () => this.saveSettings());
    
    this.updatePageStatus();
  }

  /**
   * 打开图片翻译页面
   */
  openImageTranslationPage() {
    const url = `https://translate.google.com/?op=images`;
    window.open(url, '_blank');
    this.log('已打开图片翻译页面', 'info');
  }

  /**
   * 测试网络连接
   */
  async testConnection() {
    const btn = document.getElementById('gtTestConnBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Testing...';
    
    try {
      const response = await fetch('https://translate.google.com/', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      this.log(this.t('connectionSuccess'), 'success');
      btn.innerHTML = '<span>✅</span> ' + this.t('connectionSuccess');
    } catch (error) {
      this.log(this.t('connectionFailed') + ': ' + error.message, 'error');
      btn.innerHTML = '<span>❌</span> ' + this.t('connectionFailed');
    }
    
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }, 3000);
  }

  /**
   * 更新页面状态
   */
  updatePageStatus() {
    const currentUrl = window.location.href;
    const isImageMode = currentUrl.includes('op=images');
    const hasImageInput = document.querySelector('input[type="file"][accept*="image"]') !== null;
    
    const statusIcon = document.getElementById('gtStatusIcon');
    const statusText = document.getElementById('gtStatusText');
    const startBtn = document.getElementById('gtStartBtn');
    const fileArea = document.getElementById('gtFileArea');
    
    const canTranslate = isImageMode || hasImageInput;
    
    if (canTranslate) {
      statusIcon.textContent = '✅';
      statusText.textContent = this.t('readyToTranslate');
      startBtn.disabled = this.files.length === 0;
      fileArea.style.opacity = '1';
      fileArea.style.pointerEvents = 'auto';
    } else {
      statusIcon.textContent = '⚠️';
      statusText.textContent = this.t('pleaseSwitchToImage');
      startBtn.disabled = true;
      fileArea.style.opacity = '0.5';
      fileArea.style.pointerEvents = 'none';
    }
  }

  /**
   * 使面板可拖动
   */
  makeDraggable() {
    const header = document.getElementById('gtPanelHeader');
    const panel = document.getElementById('gtAutoPanel');
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
      if (e.target.id === 'gtPanelClose') return;
      isDragging = true;
      offsetX = e.clientX - panel.offsetLeft;
      offsetY = e.clientY - panel.offsetTop;
      panel.style.right = 'auto';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panel.style.left = (e.clientX - offsetX) + 'px';
      panel.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  /**
   * 处理文件选择
   * @param {FileList} fileList - 选择的文件列表
   */
  handleFileSelect(fileList) {
    if (this.isProcessing) {
      return;
    }
    
    const currentUrl = window.location.href;
    const isImageMode = currentUrl.includes('op=images');
    const hasImageInput = document.querySelector('input[type="file"][accept*="image"]') !== null;
    
    this.log(`当前URL: ${currentUrl}`, 'info');
    this.log(`图片模式: ${isImageMode}, 有图片输入框: ${hasImageInput}`, 'info');
    
    if (!isImageMode && !hasImageInput) {
      this.log('⚠️ 请在图片翻译页面添加图片', 'warn');
      this.log('💡 点击"打开图片翻译页面"按钮', 'info');
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const newFiles = Array.from(fileList).filter(file => validTypes.includes(file.type));
    
    if (newFiles.length !== fileList.length) {
      this.log('部分文件格式不支持，已跳过', 'warn');
    }

    newFiles.forEach(async (file) => {
      const dataUrl = await this.readFileAsDataUrl(file);
      this.files.push({
        file: file,
        name: file.name,
        size: file.size,
        status: 'pending',
        dataUrl: dataUrl,
        retryCount: 0
      });
      this.updateFileList();
      this.updatePageStatus();
    });

    this.log(`已添加 ${newFiles.length} 个图片文件`, 'info');
  }

  /**
   * 更新文件列表显示
   */
  updateFileList() {
    const fileList = document.getElementById('gtFileList');
    const startBtn = document.getElementById('gtStartBtn');

    if (this.files.length > 0) {
      fileList.style.display = 'block';
      fileList.innerHTML = this.files.map((file, index) => `
        <div class="gt-auto-file-item ${file.status}" data-index="${index}" draggable="true">
          <span class="gt-auto-file-item-order">${index + 1}</span>
          <span class="gt-auto-file-item-icon">${this.getStatusIcon(file.status)}</span>
          <span class="gt-auto-file-item-name" title="${file.name}">${file.name}</span>
          <span class="gt-auto-file-item-status">${this.getStatusText(file.status)}</span>
          <button class="gt-auto-file-item-remove" data-index="${index}" title="${this.t('remove')}">✕</button>
        </div>
      `).join('');
      
      fileList.querySelectorAll('.gt-auto-file-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          this.removeFile(idx);
        });
      });
      
      this.setupDragAndDrop(fileList);
      
      startBtn.disabled = this.isProcessing;
    } else {
      fileList.style.display = 'none';
      startBtn.disabled = true;
    }
  }

  /**
   * 移除文件
   * @param {number} index - 文件索引
   */
  removeFile(index) {
    this.files.splice(index, 1);
    this.updateFileList();
    this.updatePageStatus();
    this.log(`已移除图片`, 'info');
  }

  /**
   * 设置拖拽排序
   * @param {HTMLElement} fileList - 文件列表元素
   */
  setupDragAndDrop(fileList) {
    let draggedItem = null;
    
    fileList.querySelectorAll('.gt-auto-file-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedItem = null;
      });
      
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem && draggedItem !== item) {
          const fromIndex = parseInt(draggedItem.dataset.index);
          const toIndex = parseInt(item.dataset.index);
          this.reorderFiles(fromIndex, toIndex);
        }
      });
    });
  }

  /**
   * 重新排序文件
   * @param {number} fromIndex - 原索引
   * @param {number} toIndex - 目标索引
   */
  reorderFiles(fromIndex, toIndex) {
    const [movedFile] = this.files.splice(fromIndex, 1);
    this.files.splice(toIndex, 0, movedFile);
    this.updateFileList();
    this.log(`已调整图片顺序`, 'info');
  }

  /**
   * 获取状态图标
   * @param {string} status - 状态
   * @returns {string} 图标
   */
  getStatusIcon(status) {
    const icons = { pending: '⏳', processing: '🔄', completed: '✅', error: '❌' };
    return icons[status] || '📄';
  }

  /**
   * 获取状态文本
   * @param {string} status - 状态
   * @returns {string} 文本
   */
  getStatusText(status) {
    const texts = { pending: '等待', processing: '翻译中', completed: '完成', error: '失败' };
    return texts[status] || '';
  }

  /**
   * 更新进度条
   */
  updateProgress() {
    const completed = this.files.filter(f => f.status === 'completed').length;
    const total = this.files.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('gtProgress').style.display = 'block';
    document.getElementById('gtProgressFill').style.width = `${percent}%`;
    document.getElementById('gtProgressText').textContent = `${completed} / ${total}`;
    document.getElementById('gtProgressPercent').textContent = `${percent}%`;
  }

  /**
   * 记录日志
   * @param {string} message - 日志消息
   * @param {string} type - 日志类型
   */
  log(message, type = 'info') {
    const logEl = document.getElementById('gtLog');
    logEl.style.display = 'block';
    
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `gt-auto-log-entry ${type}`;
    entry.innerHTML = `<span class="gt-auto-log-time">[${time}]</span>${message}`;
    
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
    console.log(`[Google翻译自动化] ${message}`);
  }

  /**
   * 创建状态遮罩层
   */
  createStatusOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'gt-auto-overlay';
    overlay.id = 'gtAutoOverlay';
    overlay.innerHTML = `
      <div class="gt-auto-modal">
        <div class="gt-auto-spinner"></div>
        <div class="gt-auto-modal-title">正在翻译图片</div>
        <div class="gt-auto-modal-status" id="gtAutoStatus">处理中...</div>
        <div class="gt-auto-modal-filename" id="gtAutoFilename"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  /**
   * 显示遮罩层
   * @param {string} fileName - 文件名
   */
  showOverlay(fileName) {
    document.getElementById('gtAutoFilename').textContent = fileName;
    document.getElementById('gtAutoOverlay').classList.add('active');
  }

  /**
   * 隐藏遮罩层
   */
  hideOverlay() {
    document.getElementById('gtAutoOverlay').classList.remove('active');
  }

  /**
   * 更新状态文本
   * @param {string} status - 状态文本
   */
  updateStatus(status) {
    document.getElementById('gtAutoStatus').textContent = status;
  }

  /**
   * 开始批量翻译
   */
  async startTranslation() {
    if (this.isProcessing || this.files.length === 0) return;

    const currentUrl = window.location.href;
    const isImageMode = currentUrl.includes('op=images');
    const hasImageInput = document.querySelector('input[type="file"][accept*="image"]') !== null;
    
    if (!isImageMode && !hasImageInput) {
      this.log('⚠️ 请在图片翻译页面使用此功能', 'warn');
      return;
    }

    this.isProcessing = true;
    this.currentIndex = 0;

    document.getElementById('gtStartBtn').style.display = 'none';
    document.getElementById('gtStopBtn').style.display = 'flex';
    
    this.log('开始批量翻译', 'info');
    this.updateProgress();

    try {
      for (let i = 0; i < this.files.length; i++) {
        if (!this.isProcessing) break;

        this.currentIndex = i;
        this.files[i].status = 'processing';
        this.updateFileList();
        this.updateProgress();

        let success = false;
        let maxRetries = this.settings.retryOnError ? 3 : 1;
        
        for (let retry = 0; retry < maxRetries && !success; retry++) {
          if (retry > 0) {
            this.files[i].retryCount = retry;
            this.log(`重试: ${this.files[i].name} (${retry})`, 'warn');
            await this.delay(1000);
          }

          try {
            await this.processImage(this.files[i]);
            this.files[i].status = 'completed';
            this.log(`完成: ${this.files[i].name}`, 'success');
            success = true;
          } catch (error) {
            this.log(`失败: ${this.files[i].name} - ${error.message}`, 'error');
            if (retry === maxRetries - 1) {
              this.files[i].status = 'error';
            }
          }
        }

        this.updateFileList();
        this.updateProgress();
      }

      if (this.isProcessing) {
        const completed = this.files.filter(f => f.status === 'completed').length;
        this.log(`翻译完成: ${completed}/${this.files.length}`, 'success');
      }
    } catch (error) {
      this.log(`错误: ${error.message}`, 'error');
    } finally {
      this.isProcessing = false;
      document.getElementById('gtStartBtn').style.display = 'flex';
      document.getElementById('gtStopBtn').style.display = 'none';
    }
  }

  /**
   * 停止翻译
   */
  stopTranslation() {
    this.isProcessing = false;
    this.log('已停止翻译', 'warn');
    document.getElementById('gtStartBtn').style.display = 'flex';
    document.getElementById('gtStopBtn').style.display = 'none';
  }

  /**
   * 处理单张图片
   * @param {Object} fileInfo - 文件信息
   */
  async processImage(fileInfo) {
    if (this.settings.showOverlay) {
      this.showOverlay(fileInfo.name);
    }

    try {
      this.updateStatus('正在上传图片...');
      this.log(`上传图片: ${fileInfo.name}`, 'info');
      await this.uploadImageSimple(fileInfo.dataUrl, fileInfo.name);

      this.updateStatus('等待翻译完成...');
      await this.waitForDownloadButton();
      
      this.updateStatus('正在下载翻译结果...');
      await this.clickDownloadButton(fileInfo.name);

      this.updateStatus('正在清除当前图片...');
      await this.waitForClearButton();

      this.updateStatus('完成！');
    } catch (error) {
      await this.delay(2000);
      throw error;
    } finally {
      this.hideOverlay();
    }
  }

  /**
   * 等待下载按钮出现
   */
  async waitForDownloadButton() {
    this.log('等待下载按钮出现...', 'info');
    
    this.log('等待旧下载按钮消失...', 'info');
    const disappearStart = Date.now();
    while (Date.now() - disappearStart < 5000) {
      const oldBtn = this.findDownloadButton();
      if (!oldBtn) {
        this.log('旧下载按钮已消失', 'info');
        break;
      }
      await this.delay(500);
    }
    
    await this.delay(2000);
    
    const maxWait = 30000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const downloadBtn = this.findDownloadButton();
      if (downloadBtn) {
        this.log('新下载按钮已出现', 'info');
        return downloadBtn;
      }
      await this.delay(1000);
    }
    
    throw new Error('等待下载按钮超时');
  }

  /**
   * 点击下载按钮并下载翻译结果
   * @param {string} fileName - 文件名
   */
  async clickDownloadButton(fileName) {
    this.log('正在查找翻译结果图片...', 'info');
    
    await this.delay(2000);
    
    const allImages = document.querySelectorAll('img');
    let largestImg = null;
    let largestSize = 0;
    
    for (const img of allImages) {
      const width = img.naturalWidth || img.width || 0;
      const height = img.naturalHeight || img.height || 0;
      const size = width * height;
      
      if (size > largestSize && width > 100 && height > 100) {
        largestSize = size;
        largestImg = img;
      }
    }
    
    if (largestImg && largestImg.src) {
      this.log(`找到最大图片: ${largestImg.naturalWidth}x${largestImg.naturalHeight}`, 'info');
      
      try {
        const imgSrc = largestImg.src;
        let blob;
        
        if (imgSrc.startsWith('blob:')) {
          this.log('获取blob图片...', 'info');
          const response = await fetch(imgSrc);
          blob = await response.blob();
        } else {
          this.log('使用canvas转换图片...', 'info');
          const canvas = document.createElement('canvas');
          canvas.width = largestImg.naturalWidth;
          canvas.height = largestImg.naturalHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(largestImg, 0, 0);
          
          blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
          });
        }
        
        if (!blob) {
          throw new Error('无法获取图片数据');
        }
        
        const objectUrl = URL.createObjectURL(blob);
        
        const pngFileName = fileName.replace(/\.[^.]+$/, '') + '.png';
        
        this.log('正在下载图片...', 'info');
        await this.downloadWithApi(objectUrl, pngFileName);
        this.log(`下载完成: ${pngFileName}`, 'success');
        
        URL.revokeObjectURL(objectUrl);
        
        await this.delay(1000);
        return;
      } catch (error) {
        this.log(`下载失败: ${error.message}`, 'error');
      }
    } else {
      this.log('未找到翻译结果图片', 'warn');
    }
    
    const downloadBtn = this.findDownloadButton();
    if (downloadBtn) {
      this.log('点击下载按钮', 'info');
      downloadBtn.click();
      this.log(`已触发下载: ${fileName}`, 'success');
    }
    
    await this.delay(3000);
  }

  /**
   * 使用插件API下载文件
   * @param {string} url - 下载URL
   * @param {string} fileName - 文件名
   */
  async downloadWithApi(url, fileName) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'downloadImage',
        url: url,
        fileName: fileName
      }, (response) => {
        if (response && response.success) {
          resolve(response);
        } else {
          reject(new Error(response?.error || '下载失败'));
        }
      });
    });
  }

  /**
   * 等待清除按钮出现并点击
   */
  async waitForClearButton() {
    this.log('等待清除按钮出现...', 'info');
    
    const maxWait = 10000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const clearBtn = this.findClearButton();
      if (clearBtn) {
        this.log('清除按钮已出现，点击清除', 'info');
        clearBtn.click();
        await this.delay(1500);
        this.log('页面已清除', 'info');
        return;
      }
      await this.delay(500);
    }
    
    this.log('未找到清除按钮，继续下一张', 'warn');
  }

  /**
   * 查找清除按钮
   * @returns {HTMLElement|null} 清除按钮元素
   */
  findClearButton() {
    const clearSelectors = [
      'button[aria-label="清除图片"]',
      'button[aria-label*="清除图片"]',
      'button[aria-label*="清除"]',
      'button[aria-label*="Clear"]',
      'button[aria-label*="clear"]',
      'button[jsname="X5DuWc"]',
      '[data-tooltip*="清除"]',
      '[data-tooltip*="Clear"]'
    ];
    
    for (const selector of clearSelectors) {
      const btn = document.querySelector(selector);
      if (btn) {
        this.log(`找到清除按钮: ${selector}`, 'info');
        return btn;
      }
    }
    
    const allButtons = document.querySelectorAll('button');
    for (const btn of allButtons) {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      
      if (ariaLabel.includes('清除') || ariaLabel.toLowerCase().includes('clear')) {
        this.log(`找到清除按钮(遍历): aria-label="${ariaLabel}"`, 'info');
        return btn;
      }
    }
    
    return null;
  }

  /**
   * 读取文件为DataURL
   * @param {File} file - 文件对象
   * @returns {Promise<string>} DataURL
   */
  readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * 上传图片到页面
   * @param {string} dataUrl - 图片DataURL
   * @param {string} fileName - 文件名
   */
  async uploadImageSimple(dataUrl, fileName) {
    const blob = await this.dataUrlToBlob(dataUrl);
    const ext = blob.type.split('/')[1] || 'jpg';
    const safeName = `image_${Date.now()}.${ext}`;
    const file = new File([blob], safeName, { type: blob.type });

    const fileInputs = document.querySelectorAll('input[type="file"]');
    this.log(`找到 ${fileInputs.length} 个 file input`);
    
    if (fileInputs.length === 0) {
      throw new Error('找不到文件上传输入框');
    }

    let imageInput = null;
    for (let i = 0; i < fileInputs.length; i++) {
      const input = fileInputs[i];
      const accept = input.getAttribute('accept') || '';
      this.log(`File input ${i}: accept="${accept}"`);
      
      if (accept.includes('image') || accept.includes('image/*') || accept.includes('.png') || accept.includes('.jpg') || accept.includes('.jpeg')) {
        this.log(`找到图片上传输入框 (index ${i})`);
        imageInput = input;
        break;
      }
    }

    if (!imageInput) {
      this.log('未找到专门的图片输入框，使用最后一个file input');
      imageInput = fileInputs[fileInputs.length - 1];
    }

    this.log(`使用 file input: ${imageInput.getAttribute('accept')}`);

    imageInput.value = '';
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    imageInput.files = dataTransfer.files;

    this.log('触发 change 和 input 事件');
    imageInput.dispatchEvent(new Event('change', { bubbles: true }));
    imageInput.dispatchEvent(new Event('input', { bubbles: true }));

    await this.delay(5000);
    
    const errorElements = document.querySelectorAll('[class*="error"], [role="alert"]');
    for (const el of errorElements) {
      if (el.offsetParent !== null && el.textContent.length > 0) {
        throw new Error(`上传失败: ${el.textContent}`);
      }
    }
  }

  /**
   * 查找下载按钮
   * @returns {HTMLElement|null} 下载按钮元素
   */
  findDownloadButton() {
    const selectors = [
      'button[aria-label*="下载"]',
      'button[aria-label*="Download"]',
      'button[data-tooltip*="下载"]',
      'button[data-tooltip*="Download"]',
      '[jsname*="download"]',
      'button[jsname*="download"]',
      'button[download]',
      'a[download]',
      '[data-download]',
      'button[data-test*="download"]'
    ];

    for (const selector of selectors) {
      const btn = document.querySelector(selector);
      if (btn) {
        this.log(`通过选择器找到下载按钮: ${selector}`, 'info');
        return btn;
      }
    }

    const buttons = document.querySelectorAll('button, a');
    this.log(`检查 ${buttons.length} 个按钮/链接...`, 'info');
    
    for (const button of buttons) {
      const text = button.textContent?.trim().toLowerCase() || '';
      const ariaLabel = (button.getAttribute('aria-label') || '').toLowerCase();
      const tooltip = (button.getAttribute('data-tooltip') || '').toLowerCase();
      
      if (text.length < 20 && (text.includes('下载') || text.includes('download'))) {
        this.log(`通过文本找到下载按钮: text="${text}"`, 'info');
        return button;
      }
      
      if (ariaLabel.includes('下载') || ariaLabel.includes('download')) {
        this.log(`通过aria-label找到下载按钮: aria-label="${ariaLabel}"`, 'info');
        return button;
      }
      
      if (tooltip.includes('下载') || tooltip.includes('download')) {
        this.log(`通过tooltip找到下载按钮: tooltip="${tooltip}"`, 'info');
        return button;
      }
    }

    this.log('未找到下载按钮', 'warn');
    return null;
  }

  /**
   * DataURL转Blob
   * @param {string} dataUrl - DataURL
   * @returns {Promise<Blob>} Blob对象
   */
  dataUrlToBlob(dataUrl) {
    return fetch(dataUrl).then(r => r.blob());
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} Promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 绑定消息监听器
   */
  bindMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'testConnection') {
        sendResponse({ success: true, message: 'Content script已连接' });
        return true;
      }
      
      if (message.action === 'togglePanel') {
        this.togglePanel();
        sendResponse({ success: true });
        return true;
      }
      
      sendResponse({ success: false, error: '未知消息类型' });
      return true;
    });
  }
}

// 初始化插件
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new GoogleTranslateAutomation();
  });
} else {
  new GoogleTranslateAutomation();
}
