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

class ImageTranslator {
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
    this.translateTabId = null;
    this.init();
  }

  init() {
    this.loadSettings();
    this.bindEvents();
    this.updateUI();
  }

  loadSettings() {
    chrome.storage.local.get([
      'sourceLang', 'targetLang', 'downloadDelay', 
      'showOverlay', 'retryOnError'
    ], (result) => {
      if (result.sourceLang !== undefined) {
        this.settings.sourceLang = result.sourceLang;
        document.getElementById('sourceLang').value = result.sourceLang;
      }
      if (result.targetLang !== undefined) {
        this.settings.targetLang = result.targetLang;
        document.getElementById('targetLang').value = result.targetLang;
      }
      if (result.downloadDelay !== undefined) {
        this.settings.downloadDelay = result.downloadDelay;
        document.getElementById('downloadDelay').value = result.downloadDelay;
      }
      if (result.showOverlay !== undefined) {
        this.settings.showOverlay = result.showOverlay;
        document.getElementById('showOverlay').checked = result.showOverlay;
      }
      if (result.retryOnError !== undefined) {
        this.settings.retryOnError = result.retryOnError;
        document.getElementById('retryOnError').checked = result.retryOnError;
      }
      this.updateSubtitle();
    });
  }

  saveSettings() {
    this.settings.sourceLang = document.getElementById('sourceLang').value;
    this.settings.targetLang = document.getElementById('targetLang').value;
    this.settings.downloadDelay = parseInt(document.getElementById('downloadDelay').value) || 3000;
    this.settings.showOverlay = document.getElementById('showOverlay').checked;
    this.settings.retryOnError = document.getElementById('retryOnError').checked;
    chrome.storage.local.set(this.settings);
    this.updateSubtitle();
  }

  updateSubtitle() {
    const sourceName = LANGUAGES[this.settings.sourceLang] || this.settings.sourceLang;
    const targetName = LANGUAGES[this.settings.targetLang] || this.settings.targetLang;
    document.getElementById('subtitleText').textContent = `${sourceName} → ${targetName}`;
  }

  bindEvents() {
    document.getElementById('selectBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files);
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      this.clearFiles();
    });

    document.getElementById('startBtn').addEventListener('click', () => {
      this.startTranslation();
    });

    document.getElementById('stopBtn').addEventListener('click', () => {
      this.stopTranslation();
    });

    document.getElementById('sourceLang').addEventListener('change', () => {
      this.saveSettings();
    });

    document.getElementById('targetLang').addEventListener('change', () => {
      this.saveSettings();
    });

    document.getElementById('downloadDelay').addEventListener('change', () => {
      this.saveSettings();
    });

    document.getElementById('showOverlay').addEventListener('change', () => {
      this.saveSettings();
    });

    document.getElementById('retryOnError').addEventListener('change', () => {
      this.saveSettings();
    });

    document.getElementById('testConnectionBtn').addEventListener('click', async () => {
      await this.testConnection();
    });

    document.getElementById('openSiteBtn').addEventListener('click', async () => {
      await this.openTranslateSite();
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  async testConnection() {
    this.log('=== 开始测试连接 ===', 'info');
    
    try {
      const tabs = await chrome.tabs.query({ url: 'https://translate.google.com/*' });
      this.log(`找到 ${tabs.length} 个Google翻译页面`, 'info');
      
      if (tabs.length === 0) {
        this.log('❌ 没有打开的Google翻译页面', 'error');
        this.log('请先打开 https://translate.google.com', 'warn');
        return;
      }
      
      const tabId = tabs[0].id;
      this.log(`测试Tab ID: ${tabId}`, 'info');
      
      try {
        const response = await chrome.tabs.sendMessage(tabId, {
          action: 'testConnection',
          data: { test: true }
        });
        
        this.log('✅ 连接成功！', 'success');
        this.log(`响应: ${JSON.stringify(response)}`, 'info');
      } catch (error) {
        this.log(`❌ 发送消息失败: ${error.message}`, 'error');
        this.log('可能的原因:', 'warn');
        this.log('1. Content script未加载', 'warn');
        this.log('2. 页面未完全加载', 'warn');
        this.log('3. 扩展需要重新加载', 'warn');
        this.log('请尝试刷新Google翻译页面', 'warn');
      }
    } catch (error) {
      this.log(`❌ 测试失败: ${error.message}`, 'error');
    }
    
    this.log('=== 测试完成 ===', 'info');
  }

  handleFileSelect(fileList) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const newFiles = Array.from(fileList).filter(file => validTypes.includes(file.type));
    
    if (newFiles.length !== fileList.length) {
      this.log('部分文件格式不支持，已跳过', 'warn');
    }

    newFiles.forEach(file => {
      this.files.push({
        file: file,
        name: file.name,
        size: file.size,
        status: 'pending',
        dataUrl: null,
        retryCount: 0
      });
    });

    this.updateUI();
    this.log(`已添加 ${newFiles.length} 个图片文件`, 'info');
  }

  clearFiles() {
    if (this.isProcessing) {
      this.log('翻译进行中，无法清空列表', 'warn');
      return;
    }
    this.files = [];
    this.updateUI();
    this.log('已清空文件列表', 'info');
  }

  updateUI() {
    const fileListSection = document.getElementById('fileListSection');
    const fileList = document.getElementById('fileList');
    const fileCount = document.getElementById('fileCount');
    const startBtn = document.getElementById('startBtn');
    const progressSection = document.getElementById('progressSection');

    if (this.files.length > 0) {
      fileListSection.style.display = 'block';
      fileCount.textContent = this.files.length;
      
      fileList.innerHTML = this.files.map((file, index) => `
        <div class="file-item ${file.status}" data-index="${index}">
          <span class="file-item-icon">${this.getStatusIcon(file.status)}</span>
          <span class="file-item-name" title="${file.name}">${file.name}</span>
          <span class="file-item-status">${this.getStatusText(file.status)}${file.retryCount > 0 ? ` (重试${file.retryCount})` : ''}</span>
        </div>
      `).join('');

      startBtn.disabled = this.isProcessing;
    } else {
      fileListSection.style.display = 'none';
      startBtn.disabled = true;
    }

    if (this.isProcessing) {
      progressSection.style.display = 'block';
      this.updateProgress();
    } else {
      progressSection.style.display = 'none';
    }
  }

  getStatusIcon(status) {
    const icons = {
      pending: '⏳',
      processing: '🔄',
      completed: '✅',
      error: '❌'
    };
    return icons[status] || '📄';
  }

  getStatusText(status) {
    const texts = {
      pending: '等待中',
      processing: '翻译中',
      completed: '已完成',
      error: '失败'
    };
    return texts[status] || '';
  }

  updateProgress() {
    const completed = this.files.filter(f => f.status === 'completed').length;
    const total = this.files.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressText').textContent = `${completed} / ${total}`;
    document.getElementById('progressPercent').textContent = `${percent}%`;

    const currentFile = this.files[this.currentIndex];
    if (currentFile && currentFile.status === 'processing') {
      document.getElementById('currentFile').textContent = `正在处理: ${currentFile.name}`;
    } else {
      document.getElementById('currentFile').textContent = '';
    }
  }

  setStatus(status, text) {
    const statusBar = document.getElementById('statusBar');
    const statusText = document.getElementById('statusText');
    
    statusBar.className = `status-bar ${status}`;
    statusText.textContent = text;
  }

  log(message, type = 'info') {
    const logSection = document.getElementById('logSection');
    const logContainer = document.getElementById('logContainer');
    
    logSection.style.display = 'block';
    
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="log-time">[${time}]</span>${message}`;
    
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  async startTranslation() {
    if (this.isProcessing || this.files.length === 0) return;

    this.isProcessing = true;
    this.currentIndex = 0;

    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-flex';
    
    this.setStatus('working', '正在翻译...');
    this.log('开始批量翻译', 'info');
    this.updateUI();

    try {
      this.log('查找已打开的Google翻译页面...', 'info');
      const tabs = await chrome.tabs.query({ url: 'https://translate.google.com/*' });
      this.log(`找到 ${tabs.length} 个翻译页面`, 'info');
      
      if (tabs.length === 0) {
        throw new Error('没有找到打开的Google翻译页面，请先点击"打开翻译网站"按钮');
      }
      
      this.translateTabId = tabs[0].id;
      this.log(`使用Tab ID: ${this.translateTabId}`, 'info');
      
      const currentUrl = tabs[0].url;
      this.log(`当前页面URL: ${currentUrl}`, 'info');
      
      const imageUrl = `https://translate.google.com/?hl=zh-cn&sl=${this.settings.sourceLang}&tl=${this.settings.targetLang}&op=images`;
      if (!currentUrl.includes('op=images')) {
        this.log('当前不在图片翻译页面，正在导航...', 'info');
        await chrome.tabs.update(this.translateTabId, { url: imageUrl });
        await this.delay(2500);
        this.log('已导航到图片翻译页面', 'info');
      }

      for (let i = 0; i < this.files.length; i++) {
        if (!this.isProcessing) break;

        this.currentIndex = i;
        this.files[i].status = 'processing';
        this.updateUI();

        let success = false;
        let maxRetries = this.settings.retryOnError ? 3 : 1;
        
        for (let retry = 0; retry < maxRetries && !success; retry++) {
          if (retry > 0) {
            this.files[i].retryCount = retry;
            this.log(`重试翻译: ${this.files[i].name} (第${retry}次)`, 'warn');
            await this.delay(1000);
          }

          try {
            this.log(`准备翻译第 ${i + 1} 个文件: ${this.files[i].name}`, 'info');
            await this.translateImage(this.files[i]);
            this.files[i].status = 'completed';
            this.log(`翻译完成: ${this.files[i].name}`, 'success');
            success = true;
          } catch (error) {
            this.log(`翻译失败: ${this.files[i].name} - ${error.message}`, 'error');
            if (retry === maxRetries - 1) {
              this.files[i].status = 'error';
            }
          }
        }

        this.updateUI();
      }

      if (this.isProcessing) {
        const completed = this.files.filter(f => f.status === 'completed').length;
        const total = this.files.length;
        this.setStatus('success', `翻译完成: ${completed}/${total}`);
        this.log(`批量翻译完成: ${completed}/${total}`, 'success');
      }
    } catch (error) {
      this.setStatus('error', `错误: ${error.message}`);
      this.log(`翻译过程出错: ${error.message}`, 'error');
    } finally {
      this.isProcessing = false;
      document.getElementById('startBtn').style.display = 'inline-flex';
      document.getElementById('stopBtn').style.display = 'none';
      this.updateUI();
    }
  }

  stopTranslation() {
    this.isProcessing = false;
    this.setStatus('error', '已停止翻译');
    this.log('用户停止了翻译', 'warn');
    
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('stopBtn').style.display = 'none';
    this.updateUI();
  }

  async openTranslateSite() {
    this.log('正在打开翻译网站...', 'info');
    const url = `https://translate.google.com/?hl=zh-cn&sl=${this.settings.sourceLang}&tl=${this.settings.targetLang}&op=images`;
    this.log(`URL: ${url}`, 'info');
    
    const tabs = await chrome.tabs.query({ url: 'https://translate.google.com/*' });
    
    if (tabs.length > 0) {
      await chrome.tabs.update(tabs[0].id, { 
        active: true,
        url: url
      });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
      this.log('已激活现有翻译页面', 'info');
    } else {
      await chrome.tabs.create({ url: url, active: true });
      this.log('已创建新的翻译页面', 'info');
    }
  }

  async translateImage(fileInfo) {
    return new Promise((resolve, reject) => {
      this.log(`开始读取文件: ${fileInfo.name}`, 'info');
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        fileInfo.dataUrl = dataUrl;
        this.log(`文件读取完成，大小: ${Math.round(dataUrl.length / 1024)} KB`, 'info');

        try {
          this.log(`准备发送消息到 Tab ${this.translateTabId}`, 'info');
          this.log(`消息内容: action=translateImage, fileName=${fileInfo.name}`, 'info');
          
          const response = await chrome.tabs.sendMessage(this.translateTabId, {
            action: 'translateImage',
            data: {
              dataUrl: dataUrl,
              fileName: fileInfo.name,
              downloadDelay: this.settings.downloadDelay,
              showOverlay: this.settings.showOverlay
            }
          });
          
          this.log('收到翻译响应:', 'info');
          this.log(`响应内容: ${JSON.stringify(response)}`, 'info');
          
          if (response && response.success) {
            this.log('翻译成功！', 'success');
            resolve();
          } else {
            const errorMsg = response?.error || '翻译失败（无响应或响应失败）';
            this.log(`翻译失败: ${errorMsg}`, 'error');
            reject(new Error(errorMsg));
          }
        } catch (error) {
          this.log(`发送消息失败: ${error.message}`, 'error');
          this.log(`错误详情: ${error.stack}`, 'error');
          reject(error);
        }
      };

      reader.onerror = () => {
        this.log('文件读取失败', 'error');
        reject(new Error('读取文件失败'));
      };

      reader.readAsDataURL(fileInfo.file);
    });
  }

  handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'translationComplete':
        this.log(`图片翻译完成并已下载: ${message.fileName}`, 'success');
        break;
      case 'translationError':
        this.log(`翻译错误: ${message.error}`, 'error');
        break;
    }
    sendResponse({ success: true });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ImageTranslator();
});
