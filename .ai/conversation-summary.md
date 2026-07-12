# Conversation Summary

## 2026-07-12（MCP 配置）
- Project Memory 已在 lifeAI 工作区连通
- `${workspaceFolder}` / `~/` 曾导致错误根路径 `lifeAI/~/.../.ai`
- 已改为绝对路径 `PROJECT_MEMORY_ROOT=/Users/tangwenjing/WeChatProjects/lifeAI`
- `get_effective_project_root` 确认 Memory 根为 `lifeAI/.ai`

## 2026-07-12（文档）
- 用户文档写入 `docs/`：总览、架构、模块、AI 入库、API、开发

## 2026-07-12（后端接线）
- 同级 `lifeAI-backend`：Fastify + Prisma + MySQL + JWT + OpenRouter
- 模块 CRUD 与聊天会话已接入；日记每日自动生成

## 2026-07-11
- 首轮前端：双端聊天、识图、模块入口、牛油果绿主题

功能冲刺细节见 `.ai/archive/summary-2026-07.md`。
