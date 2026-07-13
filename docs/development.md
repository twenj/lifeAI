# 本地开发

## 前置

1. MySQL，库名示例：`lifeai`
2. Node.js / pnpm
3. OpenRouter API Key

## 启动后端

```bash
cd lifeAI-backend
cp .env.example .env   # 填写 DATABASE_URL、JWT_SECRET、OPENROUTER_*
pnpm install
pnpm prisma migrate dev
pnpm dev               # 默认 127.0.0.1:8787
```

## 启动前端

```bash
cd lifeAI/uniapp
pnpm install
```

### H5

```bash
pnpm run dev:h5
# 浏览器打开 http://localhost:4000
# 需先启动后端；请求走 /backend 代理
```

### 微信小程序

```bash
pnpm run dev:mp-weixin
# 微信开发者工具打开 lifeAI 根目录
# 编译产物：uniapp/dist/dev/mp-weixin
# 开发态直连 http://127.0.0.1:8787（需勾选不校验合法域名）
```

## 环境变量（后端）

见 `lifeAI-backend/.env`，主要字段：

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`（默认 8787）
- `OPENROUTER_API_URL` / `OPENROUTER_API_KEY` / `OPENROUTER_MODEL`
- `OPENROUTER_SITE_URL` / `OPENROUTER_APP_NAME`

## 生产注意

- 小程序正式版需 HTTPS API 域名，并修改 `uniapp/src/lib/api.js` 中的 baseUrl
- 图片目前多为 data URL，上线前建议改为对象存储
- 不要将 `.env` 与 API Key 提交到仓库

## 相关路径速查

| 用途 | 路径 |
|------|------|
| 前端源码 | `lifeAI/uniapp/src` |
| 后端源码 | `lifeAI-backend/src` |
| Prisma | `lifeAI-backend/prisma` |
| 旧云函数备份 | `lifeAI/cloudfunctions` |
