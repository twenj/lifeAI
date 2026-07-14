# 小日子AI

一个基于 uni-app（Vue 3 + Vite）的 AI 聊天应用，支持 App、微信小程序与 H5。聊天、会话和模块数据通过同级目录的 Node.js + MySQL 后端持久化。

## 配置并运行

1. 在 `lifeAI-backend/.env` 中填写 MySQL 连接串和 OpenRouter API Key。
2. 在 `uniapp` 目录执行 `pnpm install`。

### 微信小程序

1. 先启动 `lifeAI-backend`。
2. 执行 `pnpm run dev:mp-weixin`。
3. 使用微信开发者工具打开项目根目录，编译小程序并发送消息。

微信开发者工具会读取 `uniapp/dist/dev/mp-weixin`（由 `pnpm run dev:mp-weixin` 生成）。

### H5

1. 先启动 `lifeAI-backend`。
2. 执行 `pnpm run dev:h5`，浏览器打开终端提示的本地地址（默认 `http://localhost:4000`）。
3. H5 开发态通过 Vite `/backend` 代理请求 Node.js API，API Key 不会打进前端包。
3. 生产构建：`pnpm run build:h5`，产物在 `uniapp/dist/build/h5`。静态托管时需要自行部署等价的 `/api/chat` 后端；本地可用 `vite preview`（同样挂载了该接口）验证。

### App / Android / iOS

1. 在 `uniapp/src/manifest.json` 的 `app-plus.distribute.apple.appid` 中替换为自己的 iOS Bundle ID；Android 包名可在 HBuilderX 的 manifest 可视化配置中设置。
2. 执行 `pnpm run build:android`（或通用命令 `pnpm run build:app`），生成 App-Plus 资源到 `uniapp/dist/build/app`。
3. 使用 HBuilderX 打开项目，选择“发行 → 原生 App-云打包 → Android”，配置 Android 证书后生成 `.apk` 或 `.aab`；也可以选择本地打包导出 Android 工程后用 Android Studio 签名。

Android 云打包需要配置 Android 证书；测试阶段可以使用 HBuilderX 的公共测试证书，正式发布建议使用自己的签名证书。

`build:app` 只负责生成 App 端资源，不能绕过 Apple 签名直接生成可上架的 `.ipa`。日程本地提醒仅在 App-Plus 真机包中生效。

`apiKey` 只应保存在云函数 / 服务端配置中，不能放在前端目录。当前实现使用非流式回复，并在每次请求中附带最近 12 条对话消息。

前端源代码位于 `uniapp/src`；`miniprogram` 是迁移前的原生小程序备份。

---

这是云开发的快速启动指引，其中演示了如何上手使用云开发的三大基础能力：

- 数据库：一个既可在小程序前端操作，也能在云函数中读写的 JSON 文档型数据库
- 文件存储：在小程序前端直接上传/下载云端文件，在云开发控制台可视化管理
- 云函数：在云端运行的代码，微信私有协议天然鉴权，开发者只需编写业务逻辑代码

## 参考文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
