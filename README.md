<p align="center">
  <img src="icons/icon128.png" alt="Google图片批量翻译" width="128" height="128">
</p>

<h1 align="center">Google图片批量翻译</h1>

<p align="center">
  <a href="README_EN.md">English</a> |
  <a href="README.md">中文</a> |
  <a href="README_JA.md">日本語</a>
</p>

<p align="center">
  一个用于批量翻译图片的Chrome浏览器扩展程序，基于Google翻译图片功能实现。
</p>

## 功能特点

- **批量上传**：支持一次选择多张图片进行翻译
- **自动下载**：翻译完成后自动下载翻译后的图片
- **多语言界面**：支持中文、英文、日文三种界面语言
- **图片管理**：支持移除已添加的图片、拖拽调整翻译顺序
- **连接测试**：内置连接测试功能，检测Google翻译服务是否可用
- **进度显示**：实时显示翻译进度和状态

## 安装方法

### 从源码安装

1. 下载或克隆本仓库到本地
2. 打开Chrome浏览器，进入扩展程序管理页面
   - 在地址栏输入 `chrome://extensions/`
   - 或通过菜单：更多工具 → 扩展程序
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择本项目所在的文件夹

## 使用说明

### 基本使用

1. **打开翻译页面**
   - 点击浏览器工具栏中的扩展图标
   - 或手动访问 [Google翻译图片页面](https://translate.google.com/?op=images)

2. **添加图片**
   - 点击「选择图片」按钮选择要翻译的图片
   - 或直接将图片拖拽到上传区域

3. **管理图片**
   - 点击图片列表中的「×」按钮可移除单张图片
   - 拖拽图片可调整翻译顺序

4. **开始翻译**
   - 点击「开始翻译」按钮
   - 等待翻译完成，翻译后的图片会自动下载

### 界面说明

- **语言切换**：在面板标题栏右侧可选择界面语言（中文/英文/日文）
- **打开翻译页面**：快速打开Google翻译图片页面
- **连接测试**：检测当前网络是否能正常访问Google翻译服务
- **状态指示**：显示当前是否在正确的翻译页面上

## 注意事项

1. 请确保在 **Google翻译图片页面** 使用本插件，而不是文本翻译页面
2. 翻译后的图片会保存到浏览器的下载目录中的「Google翻译」文件夹
3. 如果翻译失败，请检查网络连接或尝试使用连接测试功能

## 支持的图片格式

- PNG
- JPG/JPEG

## 技术栈

- Chrome Extension Manifest V3
- Vanilla JavaScript
- CSS3

## 目录结构

```
├── manifest.json        # 扩展配置文件
├── background/          # 后台服务脚本
│   └── background.js
├── content/             # 内容脚本
│   ├── content.js       # 主要逻辑
│   └── content.css      # 样式文件
├── icons/               # 扩展图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── popup/               # 弹出页面（备用）
    ├── popup.html
    ├── popup.js
    └── popup.css
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
