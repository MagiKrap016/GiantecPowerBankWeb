# Pwr Bank Demo (Web) 开发者手册

<p><small><span style="color:#6b7280">最后修改：2026-02-05 · 文档版本：v1.0</span></small></p>

## 修订记录

| 日期       | 版本 | 修订内容        |
| :--------- | ---- | :-------------- |
| 2026-02-05 | v1.0 | Initial Version |

## 简介

本项目主要在Web端实现新国标充电宝”碰一碰“读取电量等信息的功能；本项目仅作为演示工具，不代表最终to C成品。



## 1. 开发指南

### 1.1 开发环境

- **操作系统**：支持 Windows、macOS、Linux
- **浏览器**：推荐使用 Chrome 浏览器（支持 Web NFC API）
- **Node.js**：v14.0 或更高版本
- **包管理器**：npm
- **安卓/IOS/鸿蒙手机**：有NFC功能，安装Chromium内核版本89+的浏览器

### 1.2 技术栈

| 技术/工具   | 版本    | 用途         |
| ----------- | ------- | ------------ |
| Vue.js      | ^3.5.13 | 前端框架     |
| Vite        | ^6.0.5  | 构建工具     |
| JavaScript  | ES6+    | 开发语言     |
| CSS3        | -       | 样式设计     |
| Web NFC API | -       | NFC 标签读取 |

### 1.3 项目结构

```
GiantecPwrBank/
├── .github/            # GitHub 配置文件
├── .idea/              # IDE 配置文件
├── certs/              # HTTPS 证书文件
├── dist/               # 构建输出目录
├── src/                # 源代码目录
│   ├── components/     # 组件目录
│   │   └── nfc.js      # NFC 处理模块
│   ├── utils/          # 工具函数目录
│   │   └── praser.js   # 数据解析模块
│   ├── App.vue         # 主应用组件
│   ├── main.js         # 应用入口
│   └── style.css       # 全局样式
├── index.html          # HTML 模板
├── package-lock.json   # npm 依赖锁定文件
├── package.json        # 项目配置和依赖
└── vite.config.js      # Vite 配置文件
```

### 1.4 前端代码简介

#### 1.4.1 主应用组件 (App.vue)

- **功能**：作为应用的主容器，负责数据展示和用户交互
- **核心逻辑**：
  - 初始化 NFC 读取功能
  - 从 URL 参数加载数据
  - 处理原始数据并更新电池信息

#### 1.4.2 NFC 处理模块 (components/nfc.js)

- **功能**：处理与 NFC 相关的所有操作
- **核心函数**：
  - `readNFCContinuous`：持续读取 NFC 标签数据
  - `parseNDEFMessageForBattery`：从 NDEF 消息中解析充电宝数据
  - `isNFCSupported`：检查设备是否支持 NFC

#### 1.4.3 数据解析模块 (utils/praser.js)

- **功能**：解析 NFC 标签中的 16 进制字符串数据
- **核心函数**：
  - `parseBatteryData`：将 16 进制字符串解析为充电宝参数对象
  - `parseStatus`：解析设备状态
  - `parseTemperature`：解析温度数据
  - `generateMockData`：生成模拟数据（用于测试）

### 1.5 后端代码简介

本项目为纯前端应用，不包含后端代码。

### 1.6 运行逻辑

#### 1.6.1 页面初始化流程

1. **应用加载**：浏览器加载 `index.html` 并初始化 Vue 应用
2. **组件挂载**：`App.vue` 组件挂载到 DOM 中
3. **数据初始化**：初始化电池信息状态和 UI 组件

#### 1.6.2 数据加载逻辑

1. **URL 参数检测**：
   - 检查 URL 中是否包含 `pwrbkdata` 参数
   - 如果存在，则直接解析该参数中的 16 进制字符串获取充电宝数据
   - 如果不存在，则启动 NFC 读取功能

2. **NFC 功能检测**：
   - 检查浏览器是否支持 Web NFC API（通过 `isNFCSupported` 函数）
   - 如果支持，则启动持续读取模式
   - 如果不支持，则显示错误提示

#### 1.6.3. NFC 读取流程

1. **扫描启动**：创建 `NDEFReader` 实例并启动扫描
2. **标签检测**：
   - 首先获取 NFC 标签的 ID（`event.serialNumber`）
3. **消息读取**：
   - 读取 NDEF 消息内容
   - 解析消息中的充电宝数据（第二条消息，第一条消息为网站Url）
4. **持续读取**：
   - 每 1ms 重复一次读取过程
   - 保持对标签状态的实时监控

#### 1.6.4 数据解析与展示流程

1. **数据解析**：
   - 从 NDEF 消息中提取 16 进制字符串
   - 通过 `parseBatteryData` 函数解析为结构化数据
   - 提取电压、电流、温度、电量等关键参数

2. **UI 更新**：
   - 更新电池电量环显示
   - 更新基本信息卡片（状态、容量、循环次数、健康）
   - 更新电池参数卡片（电压、电流、温度）
   - 更新更多信息卡片（阈值、极值等）

### 1.7 部署与访问流程

1. **开发环境**：
   - 克隆项目：`git clone <repository-url>`
   - 安装依赖：`npm install`
   - 启动开发服务器：`npm run dev`

2. **生产环境**：
   - 构建生产版本：`npm run build`
   - 部署 `dist` 目录到服务器
   - 确保服务器支持 HTTPS（Web NFC API 要求）

3. **访问方式**：
   - Android 设备：通过 NFC 标签直接读取
   - iOS/鸿蒙设备：通过 URL 参数加载数据

### 1.8 注意事项

- **NFC 支持**：Web NFC API 仅在 Chrome 浏览器中支持，且需要 HTTPS 环境
- **权限要求**：首次使用时，浏览器会请求 NFC 访问权限，请允许
- **数据格式**：NFC 标签中的数据需要按照特定格式存储，详情参考充电宝协议说明文档
- **测试数据**：可以使用 `generateMockData` 函数生成的模拟数据进行测试



## 2. 联系方式

如有问题或建议，请联系项目维护人员。

------
<table align="right">
  <tr>
    <td align="center" halign="middle"><img src="./mdres/logo.png" width="30" height="30" alt="logo"></td>
    <td valign="middle">Giantec Software External Doc · author: cjli, AE Team</td>
  </tr>
</table>