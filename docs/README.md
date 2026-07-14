# 小日子AI 文档

生活助手应用：**AI 对话 + 生活模块**，支持微信小程序与 H5。

| 文档 | 说明 |
|------|------|
| [architecture.md](./architecture.md) | 整体架构与目录 |
| [modules.md](./modules.md) | 「我的生活」功能模块 |
| [ai-classification.md](./ai-classification.md) | 聊天自动入库规则 |
| [api.md](./api.md) | 后端 API 概览 |
| [development.md](./development.md) | 本地开发与运行 |

## 一句话介绍

用户在聊天里说话（可带图），AI 回复的同时，若文案带对应关键词，会把数据写入体重、饮食、记事本等模块；也可在「我的生活」里手动管理。

## 仓库结构

| 路径 | 说明 |
|------|------|
| `lifeAI/uniapp` | 前端（uni-app Vue 3 + Vite） |
| `lifeAI-backend` | 后端（同级目录，Fastify + Prisma + MySQL） |
| `lifeAI/docs` | 本项目文档 |
| `lifeAI/.ai` | AI 协作记忆（非用户文档） |

## 技术栈

- **前端**：uni-app、Vue 3、Vite；主题牛油果绿
- **后端**：Node.js、Fastify、TypeScript、Prisma、MySQL
- **模型**：OpenRouter `openai/gpt-4o-mini`（含识图）
- **鉴权**：匿名 JWT；可用共享码跨设备同步同一用户数据
