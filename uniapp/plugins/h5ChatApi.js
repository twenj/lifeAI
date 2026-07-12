import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import https from 'https'

const require = createRequire(import.meta.url)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../cloudfunctions/quickstartFunctions')
const modelConfigPath = path.join(root, 'modelConfig.js')
const messageFormatPath = path.join(root, 'messageFormat.js')

function loadConfig() {
  delete require.cache[require.resolve(modelConfigPath)]
  delete require.cache[require.resolve(messageFormatPath)]
  return {
    config: require(modelConfigPath),
    toModelMessages: require(messageFormatPath).toModelMessages,
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (error) {
        reject(new Error('请求体不是有效的 JSON'))
      }
    })
    req.on('error', reject)
  })
}

function requestJson(url, options, body) {
  return new Promise((resolve, reject) => {
    const request = https.request(url, options, (response) => {
      let data = ''
      response.on('data', (chunk) => (data += chunk))
      response.on('end', () => {
        let parsed
        try {
          parsed = JSON.parse(data)
        } catch (error) {
          reject(new Error('模型服务返回了非 JSON 内容'))
          return
        }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const err = new Error(parsed.error?.message || parsed.error || `模型服务请求失败（${response.statusCode}）`)
          err.statusCode = response.statusCode
          err.payload = parsed
          reject(err)
          return
        }
        resolve(parsed)
      })
    })
    request.setTimeout(60000, () => request.destroy(new Error('模型服务请求超时')))
    request.on('error', reject)
    request.write(body)
    request.end()
  })
}

function isVisionRejected(error) {
  const message = `${error?.message || ''}`
  return /allowed values:\s*\['text'\]/i.test(message) || /content\.type is invalid/i.test(message)
}

function asciiHeader(value) {
  if (!value || typeof value !== 'string') return ''
  return value.replace(/[^\x20-\x7E]/g, '').trim()
}

async function callModel({ apiUrl, apiKey, model, systemPrompt, siteUrl, appName }, messages) {
  const payload = JSON.stringify({
    model,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: 0.7,
  })
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    Authorization: `Bearer ${asciiHeader(apiKey)}`,
  }
  const referer = asciiHeader(siteUrl)
  const title = asciiHeader(appName)
  if (referer) headers['HTTP-Referer'] = referer
  if (title) headers['X-Title'] = title

  const result = await requestJson(
    apiUrl,
    {
      method: 'POST',
      headers,
    },
    payload,
  )
  const content = result.choices?.[0]?.message?.content
  if (!content) throw new Error('模型服务未返回回复内容')
  return { content }
}

async function chat(messagesInput) {
  const { config, toModelMessages } = loadConfig()
  const { apiUrl, apiKey, model, systemPrompt, supportsVision, siteUrl, appName } = config
  if (!apiKey) throw new Error('请先在 modelConfig.js 中配置 OpenRouter API Key')
  if (!Array.isArray(messagesInput) || !messagesInput.length) {
    throw new Error('缺少聊天内容')
  }

  const withVision = toModelMessages(messagesInput, { supportsVision: !!supportsVision })
  if (!withVision.length) throw new Error('缺少有效聊天内容')

  const requestConfig = { apiUrl, apiKey, model, systemPrompt, siteUrl, appName }
  try {
    return await callModel(requestConfig, withVision)
  } catch (error) {
    // 网关/模型若不支持 image_url，自动降级为纯文本，避免聊天中断。
    if (supportsVision && isVisionRejected(error)) {
      const textOnly = toModelMessages(messagesInput, { supportsVision: false })
      return callModel(requestConfig, textOnly)
    }
    throw error
  }
}

function attachChatApi(middlewares) {
  middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith('/api/chat')) return next()
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }
    if (req.method !== 'POST') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Method Not Allowed' }))
      return
    }

    try {
      const body = await readBody(req)
      const result = await chat(body.messages)
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(result))
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: error.message || '聊天失败' }))
    }
  })
}

/** H5 开发/预览时提供 /api/chat，复用云函数同一份 modelConfig。 */
export function h5ChatApi() {
  return {
    name: 'life-ai-h5-chat-api',
    configureServer(server) {
      attachChatApi(server.middlewares)
    },
    configurePreviewServer(server) {
      attachChatApi(server.middlewares)
    },
  }
}
