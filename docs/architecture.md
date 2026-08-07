# 架构

## 请求链路

```
微信小程序 ──► https://lifeai-shiguang.com:8787（开发态）
H5 ──────────► Vite /backend 代理 ──► Node API :8787
                                         │
                                         ├── JWT 匿名登录 / 共享码
                                         ├── Fastify REST
                                         ├── Prisma → MySQL（lifeai）
                                         └── OpenRouter → gpt-4o-mini
```

聊天成功后异步执行分类入库（`classifyAndPersist`），失败不影响聊天主流程。

## 前端目录

| 路径 | 说明 |
|------|------|
| `uniapp/src/pages/index` | 聊天主页 |
| `uniapp/src/pages/modules` | 「我的生活」及各模块页 |
| `uniapp/src/components/PageNavbar.vue` | 自定义导航（返回 / 主页） |
| `uniapp/src/lib/api.js` | API 客户端、Token、超时 |
| `uniapp/vite.config.js` | H5 `/backend` 代理（超时 180s） |

## 后端目录

| 路径 | 说明 |
|------|------|
| `lifeAI-backend/src/server.ts` | 路由与鉴权 |
| `lifeAI-backend/src/model.ts` | 聊天模型调用 |
| `lifeAI-backend/src/classify.ts` | 聊天关键词门禁 + 规则/LLM 分类入库 |
| `lifeAI-backend/src/foodLabel.ts` | 营养成分表识图 |
| `lifeAI-backend/src/journal.ts` | 每日日记自动生成 |
| `lifeAI-backend/prisma/schema.prisma` | 数据模型 |

## 主要数据实体

- User（匿名用户、共享码）
- Conversation / Message
- AiExtraction（分类结果审计）
- Note、WeightRecord、FoodRecord、FoodItem
- Schedule、Journal、LedgerRecord、ShoppingItem

## 安全约定

- OpenRouter API Key 只放 `lifeAI-backend/.env`，不进前端
- OpenRouter 请求头须为 ASCII（`X-Title` / `HTTP-Referer`）
- 生产小程序需配置 HTTPS API 域名白名单
