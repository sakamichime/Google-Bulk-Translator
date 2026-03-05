/**
 * Google图片批量翻译 - 后台服务脚本
 * 
 * 功能说明：
 * 1. 处理来自内容脚本的消息请求
 * 2. 使用Chrome Downloads API下载翻译后的图片
 * 3. 管理扩展图标点击事件
 * 
 * @author Google图片批量翻译插件
 * @version 1.0.0
 */

/**
 * 后台服务类
 * 负责处理下载请求和消息通信
 */
class BackgroundService {
  constructor() {
    this.init();
  }

  /**
   * 初始化后台服务
   * 绑定各种事件监听器
   */
  init() {
    this.bindMessageListener();
    this.bindDownloadListener();
    this.bindActionListener();
    this.log('Background service 已启动');
  }

  /**
   * 绑定扩展图标点击事件
   * - 如果当前在Google翻译页面，切换面板显示
   * - 否则，打开Google翻译图片页面
   */
  bindActionListener() {
    chrome.action.onClicked.addListener(async (tab) => {
      if (tab.url && tab.url.includes('translate.google.com')) {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'togglePanel' });
        } catch (error) {
          this.log('发送消息失败: ' + error.message);
        }
      } else {
        const url = 'https://translate.google.com/?hl=zh-cn&sl=ja&tl=zh-CN&op=images';
        chrome.tabs.create({ url: url });
      }
    });
  }

  /**
   * 绑定消息监听器
   * 接收来自内容脚本的消息
   */
  bindMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  /**
   * 绑定下载事件监听器
   * 监听下载开始和完成事件
   */
  bindDownloadListener() {
    chrome.downloads.onCreated.addListener((downloadItem) => {
      this.log(`下载开始: ${downloadItem.url}`);
      
      if (downloadItem.tabId) {
        chrome.tabs.sendMessage(downloadItem.tabId, {
          action: 'downloadStarted',
          url: downloadItem.url,
          filename: downloadItem.filename
        }).catch(() => {});
      } else {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'downloadStarted',
              url: downloadItem.url,
              filename: downloadItem.filename
            }).catch(() => {});
          }
        });
      }
    });

    chrome.downloads.onChanged.addListener((delta) => {
      if (delta.state) {
        if (delta.state.current === 'complete') {
          this.log(`下载完成: ID=${delta.id}`);
        } else if (delta.state.current === 'interrupted') {
          this.log(`下载中断: ID=${delta.id}`);
        }
      }
    });
  }

  /**
   * 处理接收到的消息
   * @param {Object} message - 消息对象
   * @param {Object} sender - 发送者信息
   * @param {Function} sendResponse - 响应回调函数
   */
  async handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'downloadImage':
        try {
          const downloadId = await this.downloadImage(message.url, message.fileName);
          sendResponse({ success: true, downloadId: downloadId });
        } catch (error) {
          this.log(`下载错误: ${error.message}`);
          sendResponse({ success: false, error: error.message });
        }
        break;

      case 'translationComplete':
        this.log(`翻译完成: ${message.fileName}`);
        sendResponse({ success: true });
        break;

      case 'translationError':
        this.log(`翻译错误: ${message.error}`);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: '未知消息类型' });
    }
  }

  /**
   * 下载图片
   * @param {string} url - 图片URL（支持blob和data URL）
   * @param {string} fileName - 保存的文件名
   * @returns {Promise<number>} 下载ID
   */
  async downloadImage(url, fileName) {
    this.log(`开始下载: ${fileName}`);
    
    const safeFileName = this.sanitizeFileName(fileName);
    
    let downloadUrl = url;
    
    if (url.startsWith('blob:')) {
      try {
        this.log('获取blob数据...', 'info');
        const response = await fetch(url);
        const blob = await response.blob();
        
        const base64 = await this.blobToBase64(blob);
        downloadUrl = base64;
        this.log('blob转换为base64成功', 'info');
      } catch (error) {
        this.log(`blob转换失败: ${error.message}`, 'error');
      }
    }
    
    const downloadOptions = {
      url: downloadUrl,
      filename: `Google翻译/${safeFileName}`,
      saveAs: false,
      conflictAction: 'uniquify'
    };
    
    const downloadId = await chrome.downloads.download(downloadOptions);
    this.log(`下载已启动: ID=${downloadId}, 文件名=${safeFileName}`);
    
    return downloadId;
  }

  /**
   * 将Blob转换为Base64编码
   * @param {Blob} blob - Blob对象
   * @returns {Promise<string>} Base64编码的Data URL
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 清理文件名，移除非法字符
   * @param {string} fileName - 原始文件名
   * @returns {string} 安全的文件名
   */
  sanitizeFileName(fileName) {
    let safeName = fileName.replace(/[<>:"/\\|?*]/g, '_');
    safeName = safeName.replace(/\s+/g, '_');
    safeName = safeName.substring(0, 200);
    
    const hasPng = safeName.toLowerCase().endsWith('.png');
    const hasJpg = safeName.toLowerCase().endsWith('.jpg');
    const hasJpeg = safeName.toLowerCase().endsWith('.jpeg');
    const hasWebp = safeName.toLowerCase().endsWith('.webp');
    const hasGif = safeName.toLowerCase().endsWith('.gif');
    
    if (!hasPng && !hasJpg && !hasJpeg && !hasWebp && !hasGif) {
      safeName = safeName.replace(/\.[^.]+$/, '') + '.png';
    }
    
    return safeName;
  }

  /**
   * 日志输出
   * @param {string} message - 日志消息
   */
  log(message) {
    console.log(`[Background] ${message}`);
  }
}

new BackgroundService();
