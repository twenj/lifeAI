const isDataUrl = (value) => typeof value === 'string' && value.startsWith('data:image/')

const collectImages = (item) =>
  Array.isArray(item.images)
    ? item.images.filter((src) => typeof src === 'string' && (isDataUrl(src) || src.startsWith('http')))
    : []

const toTextContent = (item) => {
  const text = typeof item.content === 'string' ? item.content.trim() : ''
  const images = collectImages(item)
  if (images.length) {
    const note = `（用户发送了 ${images.length} 张图片；当前模型不支持识图，请结合文字回复。）`
    return text ? `${text}\n${note}` : note
  }
  return text
}

const toVisionContent = (item, { keepImages = false } = {}) => {
  const text = typeof item.content === 'string' ? item.content.trim() : ''
  const images = collectImages(item)

  if (!keepImages || !images.length || item.role !== 'user') {
    return toTextContent(item)
  }

  const parts = []
  parts.push({ type: 'text', text: text || '请查看图片并给出有用的回复。' })
  images.slice(0, 3).forEach((url) => {
    parts.push({
      type: 'image_url',
      image_url: { url },
    })
  })
  return parts
}

/** 将前端消息转成模型接口格式。supportsVision=false 时强制纯文本，避免 image_url 报错。 */
function toModelMessages(messagesInput, { supportsVision = false } = {}) {
  const filtered = (Array.isArray(messagesInput) ? messagesInput : [])
    .filter((item) => item && ['user', 'assistant'].includes(item.role))
    .slice(-12)

  return filtered
    .map((item, index) => {
      const keepImages = supportsVision && index === filtered.length - 1 && item.role === 'user'
      const content = supportsVision
        ? toVisionContent(item, { keepImages })
        : toTextContent(item)
      if (!content || (typeof content === 'string' && !content.trim())) return null
      return { role: item.role, content }
    })
    .filter(Boolean)
}

module.exports = {
  toModelMessages,
}
