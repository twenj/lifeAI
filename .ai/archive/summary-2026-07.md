## 2026-07-12（文档 + 记忆）
- 用户文档写入 `docs/`：总览、架构、模块、AI 入库、API、开发
- 同步刷新 `lifeAI/.ai`（此前 MCP 可能指向家目录 `~/.ai`，以项目内为准）

## 2026-07-12（功能冲刺摘要）
- 待购买模块（短期/长期、消费分组）；「我的生活」分组：健康/日常/消费/设置
- AI 关键词门禁：体重/饮食/记事/日程/购买/收入|支出；食物库=图+「食物」
- 饮食：今日 + 历史列表/日详情；可改重量与日期
- 体重：一天多条 + 日期时间；规则提取补强
- 食物库：成功识图自动入库、同名跳过；手动表单精简
- 共享：H5 隐藏扫码；发送按钮绑定修复；超时约 180s；composer UI 对齐

## 2026-07-12（MCP 配置）
- Project Memory 已在 lifeAI 工作区连通
- `${workspaceFolder}` / `~/` 曾导致错误根路径 `lifeAI/~/.../.ai`
- 已改为绝对路径 `PROJECT_MEMORY_ROOT=/Users/tangwenjing/WeChatProjects/lifeAI`
- `get_effective_project_root` 确认 Memory 根为 `lifeAI/.ai`

## 2026-07-12（文档）
- 用户文档写入 `docs/`：总览、架构、模块、AI 入库、API、开发
