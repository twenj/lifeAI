# Architecture

## 请求链路

```
微信小程序 ──► Node API（127.0.0.1:8787）
H5 ──────────► Vite /backend 代理 ──► Node API
                                      │
                                      ├── JWT 匿名登录 / 共享码
                                      ├── Fastify REST
                                      ├── Prisma → MySQL（lifeai）
                                      └── OpenRouter → openai/gpt-4o-mini
```

聊天成功后异步 `classifyAndPersist`；失败不影响聊天主流程。

## 目录
| 路径 | 说明 |
|------|------|
| `uniapp/src/pages/index` | 聊天主页 |
| `uniapp/src/pages/modules` | 「我的生活」及各模块页（含饮食历史） |
| `uniapp/src/components/PageNavbar.vue` | 返回 + 主页 |
| `uniapp/src/lib/api.js` | API 客户端、JWT、超时约 180s |
| `../lifeAI-backend/src/server.ts` | Fastify 路由与鉴权 |
| `../lifeAI-backend/src/classify.ts` | 关键词门禁 + 规则/LLM 分类入库 |
| `../lifeAI-backend/src/foodLabel.ts` | 营养成分表识图 |
| `../lifeAI-backend/src/journal.ts` | 每日日记自动生成 |
| `../lifeAI-backend/prisma/schema.prisma` | MySQL 数据模型 |
| `docs/` | 用户可读项目文档 |
| `cloudfunctions/` / `miniprogram/` | 旧备份 |

## 数据实体
User、Conversation、Message、AiExtraction、Note、WeightRecord、FoodRecord、FoodItem、Schedule、Journal、LedgerRecord、ShoppingItem

## 安全与约定
- API Key 只放 `lifeAI-backend/.env`，不进前端、不提交仓库
- OpenRouter 请求头须 ASCII（`X-Title` / `HTTP-Referer`）
- 删除资源必须校验 `userId` 所有权
- 生产小程序需 HTTPS API 域名白名单
