# Coding Style

- Vue 3 `<script setup>`；条件编译 `#ifdef MP-WEIXIN` / `#ifdef H5`
- 主题用 `App.vue` 的 `--life-*` CSS 变量（牛油果绿）
- 图标优先 CSS data-URI SVG；子页导航用 `PageNavbar`
- 前端 API 集中在 `uniapp/src/lib/api.js`；勿把密钥放进前端
- 后端 TypeScript ESM；路由输入 Zod 校验；数据访问 Prisma；删改校验 `userId`
- 后端密钥只放 `lifeAI-backend/.env`；OpenRouter 头字段须 ASCII
- AI 入库关键词门禁在 `classify.ts`；食物识图在 `foodLabel.ts` + 前端触发条件
- 用户文档写 `docs/`；协作记忆写 `.ai/`（项目根下，非 `~/.ai`）
- Project Memory：项目级 `.cursor/mcp.json`；`PROJECT_MEMORY_ROOT` 用本仓库绝对路径，避免 `~/` 或未展开变量
