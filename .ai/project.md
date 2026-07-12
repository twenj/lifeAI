# Project

小日子 AI（Life AI）：uni-app（Vue 3 + Vite）生活助手，支持微信小程序与 H5；后端为同级目录的 Node.js 服务。

## 目标
- AI 对话（文字 + 图片）+ 关键词触发自动入库
- 「我的生活」模块：健康 / 日常 / 消费 / 设置
- 后续：正式账号登录与数据合并、图片对象存储、生产部署

## 现状
- OpenRouter `openai/gpt-4o-mini`（识图）
- Node.js + Fastify + Prisma + MySQL；聊天/会话/各模块 CRUD 已接入
- H5：Vite `/backend` → `lifeAI-backend:8787`；小程序开发直连 `127.0.0.1:8787`
- 聊天成功后异步分类入库（关键词门禁）；日记为每日定时自动生成
- 牛油果绿主题；App-Plus / H5 统一应用图标
- 用户文档：`docs/`（架构、模块、AI 入库、API、开发）
- Project Memory MCP：`.cursor/mcp.json`，`PROJECT_MEMORY_ROOT` 绝对路径指向本仓库

## 模块一览
| 分类 | 模块 |
|------|------|
| 健康 | 体重记录、饮食记录、食物库 |
| 日常 | 记事本、日程、日记 |
| 消费 | 记账、待购买 |
| 设置 | 数据共享 |

## 入口
- 前端：`uniapp/src`
- 后端：`../lifeAI-backend`
- 文档：`docs/`
- 协作记忆：`.ai/`（MCP：`project-0-lifeAI-project-memory`）
- MCP 配置：`.cursor/mcp.json`
- 旧云函数备份：`cloudfunctions/quickstartFunctions`
- H5 代理：`uniapp/vite.config.js`
- 运行：`cd uniapp && pnpm run dev:h5` 或 `pnpm run dev:mp-weixin`
