# 后端 API 概览

Base URL（开发）：`http://113.44.188.18:8787`  
H5 开发：`/backend` → 同上  
鉴权：`Authorization: Bearer <token>`（除匿名登录与加入共享）

## 认证与共享

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/auth/anonymous` | 匿名登录，返回 JWT |
| POST | `/v1/auth/share-code` | 生成/获取共享码 |
| POST | `/v1/auth/share-code/join` | 用共享码加入（换 Token） |

## 聊天与会话

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/v1/conversations` | 会话列表 |
| POST | `/v1/conversations` | 创建会话 |
| GET | `/v1/conversations/:id/messages` | 消息列表 |
| DELETE | `/v1/conversations/:id` | 删除会话 |
| POST | `/v1/chat` | 发送聊天（成功后异步分类入库） |

## 生活模块 CRUD

| 资源 | 路径前缀 | 备注 |
|------|----------|------|
| 记事本 | `/v1/notes` | GET/POST/PATCH/DELETE |
| 日记 | `/v1/journals` | GET/PATCH |
| 体重 | `/v1/weight-records` | GET/POST/DELETE；一天可多条 |
| 饮食记录 | `/v1/food-records` | GET/POST/PATCH/DELETE；PATCH 可改日期/重量 |
| 食物库 | `/v1/food-items` | GET/POST/PATCH/DELETE；同名不重复创建 |
| 营养表识别 | `/v1/food-label/recognize` | POST `{ images }` |
| 日程 | `/v1/schedules` | GET/POST/PATCH/DELETE |
| 记账 | `/v1/ledger` | GET/POST/DELETE |
| 待购买 | `/v1/shopping-items` | GET/POST/PATCH/DELETE；`DELETE .../purchased` 清空已购 |

## 超时

- 前端 `uni.request` 默认约 180s
- 后端模型 / 营养识别约 180s
- H5 Vite 代理 `timeout` / `proxyTimeout` 180s
