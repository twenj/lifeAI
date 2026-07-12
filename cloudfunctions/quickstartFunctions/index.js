const https = require("https");
const { toModelMessages } = require("./messageFormat");

function loadConfig() {
  delete require.cache[require.resolve("./modelConfig.js")];
  return require("./modelConfig.js");
}

const requestJson = (url, options, body) =>
  new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      let data = "";
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (error) {
          reject(new Error("模型服务返回了非 JSON 内容"));
          return;
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(parsed.error?.message || parsed.error || `模型服务请求失败（${response.statusCode}）`));
          return;
        }
        resolve(parsed);
      });
    });
    request.setTimeout(60000, () => request.destroy(new Error("模型服务请求超时")));
    request.on("error", reject);
    request.write(body);
    request.end();
  });

function isVisionRejected(error) {
  const message = `${error?.message || ""}`;
  return /allowed values:\s*\['text'\]/i.test(message) || /content\.type is invalid/i.test(message);
}

function asciiHeader(value) {
  if (!value || typeof value !== "string") return "";
  return value.replace(/[^\x20-\x7E]/g, "").trim();
}

async function callModel({ apiUrl, apiKey, model, systemPrompt, siteUrl, appName }, messages) {
  const payload = JSON.stringify({
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.7,
  });
  const headers = {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    Authorization: `Bearer ${asciiHeader(apiKey)}`,
  };
  const referer = asciiHeader(siteUrl);
  const title = asciiHeader(appName);
  if (referer) headers["HTTP-Referer"] = referer;
  if (title) headers["X-Title"] = title;

  const result = await requestJson(
    apiUrl,
    {
      method: "POST",
      headers,
    },
    payload,
  );
  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error("模型服务未返回回复内容");
  return { content };
}

const chat = async (event) => {
  const { apiUrl, apiKey, model, systemPrompt, supportsVision, siteUrl, appName } = loadConfig();
  if (!apiKey) {
    throw new Error("请先在 modelConfig.js 中配置 OpenRouter API Key");
  }
  if (!Array.isArray(event.messages) || !event.messages.length) {
    throw new Error("缺少聊天内容");
  }

  const withVision = toModelMessages(event.messages, { supportsVision: !!supportsVision });
  if (!withVision.length) {
    throw new Error("缺少有效聊天内容");
  }

  const requestConfig = { apiUrl, apiKey, model, systemPrompt, siteUrl, appName };
  try {
    return await callModel(requestConfig, withVision);
  } catch (error) {
    if (supportsVision && isVisionRejected(error)) {
      const textOnly = toModelMessages(event.messages, { supportsVision: false });
      return callModel(requestConfig, textOnly);
    }
    throw error;
  }
};

exports.main = async (event) => {
  if (event.type !== "chat") {
    throw new Error("不支持的云函数类型");
  }
  return chat(event);
};
