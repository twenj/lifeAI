// 仅在云函数 / H5 代理中使用。不要把 API Key 写入前端目录。
// 去 https://openrouter.ai/keys 创建 key，填到 apiKey。
module.exports = {
  apiUrl: "https://openrouter.ai/api/v1/chat/completions",
  apiKey:
    "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", // 例如 sk-or-v1-xxxx
  // OpenRouter 上支持识图；也可换成 google/gemini-2.0-flash-001
  model: "openai/gpt-4o-mini",
  supportsVision: true,
  // OpenRouter 可选请求头必须是 ASCII，不能写中文
  siteUrl: "https://life-ai.local",
  appName: "XiaoRiZi AI",
  systemPrompt: "你是拾光AI，一个友好、实用的生活助手。请用简洁的中文回答。",
};
