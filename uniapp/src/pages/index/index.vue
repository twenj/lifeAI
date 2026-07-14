<template>
  <view class="chat-page" :style="pageInsets">
    <view class="chat-header">
      <view>
        <view class="chat-title">小日子 AI</view>
        <view class="chat-subtitle">你的随身智能助手</view>
      </view>
      <view class="header-actions">
        <view class="icon-button" @tap="startNewConversation" aria-label="新对话">
          <view class="icon-glyph icon-new" />
        </view>
        <view class="icon-button" @tap="openHistory" aria-label="历史对话">
          <view class="icon-glyph icon-history" />
        </view>
        <view class="icon-button" @tap="openModules" aria-label="我的生活">
          <view class="icon-glyph icon-modules" />
        </view>
      </view>
    </view>

    <scroll-view class="message-list" scroll-y scroll-with-animation :scroll-into-view="scrollIntoView">
      <view v-for="item in messages" :id="`message-${item.id}`" :key="item.id" class="message-row" :class="item.role">
        <view class="avatar">{{ item.role === 'user' ? '我' : 'AI' }}</view>
          <view class="message-bubble">
          <view v-if="item.images?.length" class="bubble-images">
            <image
              v-for="(src, index) in item.images"
              :key="`${item.id}-${index}`"
              class="bubble-image"
              :src="imageSource(src)"
              mode="aspectFill"
              @tap="previewImages(item.images, index, item.previewImages)"
            />
          </view>
            <template v-if="item.content">
              <template v-for="(segment, segmentIndex) in messageSegments(item.content)" :key="`${item.id}-segment-${segmentIndex}`">
                <view v-if="segment.type === 'table'" class="markdown-table-wrap">
                  <scroll-view class="markdown-table-scroll" scroll-x>
                    <view class="markdown-table">
                      <view class="markdown-table-row header">
                        <view v-for="(cell, cellIndex) in segment.rows[0]" :key="`head-${cellIndex}`" class="markdown-table-cell"><text selectable>{{ cell }}</text></view>
                      </view>
                      <view v-for="(row, rowIndex) in segment.rows.slice(1)" :key="`row-${rowIndex}`" class="markdown-table-row">
                        <view v-for="(cell, cellIndex) in row" :key="`cell-${cellIndex}`" class="markdown-table-cell"><text selectable>{{ cell }}</text></view>
                      </view>
                    </view>
                  </scroll-view>
                </view>
                <view v-else-if="segment.type === 'heading'" class="markdown-heading" :class="`heading-${segment.level}`"><text selectable v-for="(part, partIndex) in inlineParts(segment.content)" :key="partIndex" :class="`inline-${part.type}`">{{ part.text }}</text></view>
                <view v-else-if="segment.type === 'list'" class="markdown-list-item"><text selectable class="markdown-list-marker">{{ segment.marker }}</text><text selectable v-for="(part, partIndex) in inlineParts(segment.content)" :key="partIndex" :class="`inline-${part.type}`">{{ part.text }}</text></view>
                <view v-else-if="segment.type === 'quote'" class="markdown-quote"><text selectable v-for="(part, partIndex) in inlineParts(segment.content)" :key="partIndex" :class="`inline-${part.type}`">{{ part.text }}</text></view>
                <text selectable v-else-if="segment.type === 'code'" class="markdown-code">{{ segment.content }}</text>
                <view v-else-if="segment.type === 'hr'" class="markdown-hr" />
                <text selectable v-else class="bubble-text"><text selectable v-for="(part, partIndex) in inlineParts(segment.content)" :key="partIndex" :class="`inline-${part.type}`">{{ part.text }}</text></text>
              </template>
              <view class="copy-message" @tap.stop="copyMessage(item.content)"><text class="copy-icon">⧉</text>复制</view>
            </template>
            <view v-if="item.foodLabel" class="food-label-result">
              <view class="food-label-line">每100g：{{ item.foodLabel.nutritionPer100g.calories ?? '—' }} kcal</view>
              <view class="food-label-line">蛋白质 {{ item.foodLabel.nutritionPer100g.proteinG ?? '—' }}g · 脂肪 {{ item.foodLabel.nutritionPer100g.fatG ?? '—' }}g</view>
              <view class="food-label-line">碳水 {{ item.foodLabel.nutritionPer100g.carbsG ?? '—' }}g · 钠 {{ item.foodLabel.nutritionPer100g.sodiumMg ?? '—' }}mg</view>
              <view v-if="!item.foodLabelSaved" class="food-label-save" @tap.stop="saveFoodLabel(item)">加入食物库</view>
              <view v-else class="food-label-saved">已加入食物库</view>
            </view>
            <view v-if="item.ledgerBatch" class="ledger-batch-result">
              <view class="ledger-batch-title">解析出 {{ item.ledgerBatch.length }} 条记账</view>
              <view v-for="(entry, index) in item.ledgerBatch" :key="`${item.id}-ledger-${index}`" class="ledger-batch-row">
                <text>{{ entry.type === 'income' ? '收入' : '支出' }} · {{ entry.description || entry.category }}<text v-if="entry.quantity > 1"> ×{{ entry.quantity }}</text></text>
                <text>{{ entry.amount }} 元</text>
              </view>
              <view v-if="!item.ledgerBatchSaved" class="ledger-batch-confirm" @tap.stop="confirmLedgerBatch(item)">确认批量入账</view>
              <view v-else class="food-label-saved">已批量入账</view>
            </view>
          </view>
      </view>
      <view v-if="isLoading" id="message-loading" class="message-row assistant">
        <view class="avatar">AI</view>
        <view class="message-bubble loading">正在思考…</view>
      </view>
    </scroll-view>

    <view class="composer-wrap">
      <view v-if="pendingImages.length" class="image-preview-row">
        <view v-for="(src, index) in pendingImages" :key="`pending-${index}`" class="image-preview-item">
          <image class="image-preview" :src="src" mode="aspectFill" @tap="previewImages(pendingImages, index, pendingImagePaths)" />
          <view class="image-remove" @tap.stop="removePendingImage(index)">×</view>
        </view>
      </view>
      <picker v-if="pendingImages.length" :range="imagePurposeOptions" @change="imagePurpose = imagePurposeValues[$event.detail.value]">
        <view class="receipt-source">图片用途：{{ imagePurposeLabel }}</view>
      </picker>
      <picker v-if="pendingImages.length && imagePurpose === 'receipt'" :range="receiptSourceOptions" @change="receiptSource = receiptSourceValues[$event.detail.value]">
        <view class="receipt-source">明细来源：{{ receiptSourceLabel }}</view>
      </picker>
      <view class="composer">
        <view class="composer-shell">
          <view class="composer-action" :class="{ disabled: isLoading || pendingImages.length >= 3 }" @tap="pickImages" aria-label="上传图片">
            <view class="icon-glyph icon-image" />
          </view>
          <textarea
            v-model="inputValue"
            class="message-input"
            placeholder="跟小日子说点什么…"
            :maxlength="2000"
            :auto-height="false"
            confirm-type="send"
            :adjust-position="true"
            @confirm="sendMessage"
          />
        </view>
        <view
          class="send-button"
          :class="{ active: canSend, stopping: isLoading }"
          @tap="onComposerPrimary"
        >
          <view v-if="isLoading" class="send-label">停止</view>
          <view v-else class="icon-glyph icon-send" />
        </view>
      </view>
    </view>

    <view v-if="historyVisible" class="history-mask" @tap="closeHistory" />
    <view v-if="historyVisible" class="history-panel">
      <view class="history-header">
        <view class="history-title">历史对话</view>
        <view class="icon-button" @tap="closeHistory" aria-label="关闭">
          <view class="icon-glyph icon-close" />
        </view>
      </view>
      <scroll-view class="history-list" scroll-y>
        <view v-if="historyLoading" class="history-loading">
          <view class="history-spinner" />
          <view>正在加载对话…</view>
        </view>
        <view v-else-if="!conversations.length" class="history-empty">暂无历史对话</view>
        <view
          v-for="item in conversations"
          :key="item.id"
          class="history-item"
          :class="{ active: item.id === currentId, disabled: historyLoading }"
          @tap="openConversation(item.id)"
        >
          <view class="history-item-main">
            <view class="history-item-title">{{ item.title }}</view>
            <view class="history-item-time">{{ formatTime(item.updatedAt) }}</view>
          </view>
          <view class="history-delete" @tap.stop="removeConversation(item.id)" aria-label="删除">
            <view class="icon-glyph icon-trash small" />
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="previewVisible" class="image-preview-mask" @tap="closeImagePreview">
      <view class="image-preview-dialog" @tap.stop>
        <image class="image-preview-large" :src="previewUrl" mode="aspectFit" />
        <view class="image-preview-actions">
          <view class="image-preview-close" @tap="closeImagePreview">关闭</view>
          <view class="image-preview-download" @tap="downloadPreviewImage">下载图片</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { backendApi, backendAssetUrl } from '../../lib/api.js'

const STORAGE_KEY = 'lifeai-conversations'
const MAX_IMAGES = 3
const welcome = (content) => ({ id: 'welcome', role: 'assistant', content })
const createId = () => `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const loadConversations = () => {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    return Array.isArray(raw) ? raw : []
  } catch (error) {
    return []
  }
}

const conversations = ref(loadConversations())
const systemInfo = uni.getSystemInfoSync?.() || {}
const pageInsets = {
  '--status-bar-height': `${Number(systemInfo.statusBarHeight || 0)}px`,
  '--bottom-safe-height': `${Number(systemInfo.safeAreaInsets?.bottom || 0)}px`,
}
const currentId = ref('')
const messages = ref([welcome('今天过得怎么样？')])
const inputValue = ref('')
const pendingImages = ref([])
const pendingImagePaths = ref([])
const receiptSource = ref('other')
const receiptSourceValues = ['other', 'jd', 'taobao']
const receiptSourceOptions = ['其他来源（按小票行金额）', '京东（单价 × 数量）', '淘宝（单价 × 数量）']
const receiptSourceLabel = computed(() => receiptSourceOptions[receiptSourceValues.indexOf(receiptSource.value)] || receiptSourceOptions[0])
const imagePurpose = ref('normal')
const imagePurposeValues = ['normal', 'receipt']
const imagePurposeOptions = ['普通图片', '购物小票']
const imagePurposeLabel = computed(() => imagePurposeOptions[imagePurposeValues.indexOf(imagePurpose.value)] || imagePurposeOptions[0])
const isLoading = ref(false)
const cancelRequested = ref(false)
const scrollIntoView = ref('message-welcome')
const historyVisible = ref(false)
const historyLoading = ref(false)
const previewVisible = ref(false)
const previewUrl = ref('')
const previewDownloadUrl = ref('')
const canSend = computed(() => !isLoading.value && (!!inputValue.value.trim() || pendingImages.value.length > 0))

const ensureBackendLogin = async () => {
  await backendApi.login()
  const remoteConversations = await backendApi.conversations()
  if (Array.isArray(remoteConversations)) conversations.value = remoteConversations
}

ensureBackendLogin().catch((error) => console.error('backend login failed', error))

const hasUserMessages = (list) => list.some((item) => item.role === 'user')

const conversationTitle = (list) => {
  const firstUser = list.find((item) => item.role === 'user')
  if (!firstUser) return '新对话'
  if (firstUser.content?.trim()) return firstUser.content.replace(/\s+/g, ' ').slice(0, 28)
  if (firstUser.images?.length) return '图片消息'
  return '新对话'
}

const tableSeparator = (line) => {
  const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

const tableRow = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())

const inlineParts = (content) => {
  const source = String(content || '')
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*|_[^_]+_)/g
  const parts = []
  let cursor = 0
  let match
  while ((match = pattern.exec(source))) {
    if (match.index > cursor) parts.push({ type: 'plain', text: source.slice(cursor, match.index) })
    const value = match[0]
    const strong = value.startsWith('**') || value.startsWith('__')
    const code = value.startsWith('`')
    parts.push({ type: strong ? 'strong' : code ? 'code' : 'em', text: value.slice(strong ? 2 : 1, strong ? -2 : -1) })
    cursor = match.index + value.length
  }
  if (cursor < source.length) parts.push({ type: 'plain', text: source.slice(cursor) })
  return parts.length ? parts : [{ type: 'plain', text: source }]
}

const messageSegments = (content) => {
  const lines = String(content || '').split('\n')
  const segments = []
  let textLines = []
  const flushText = () => {
    if (textLines.length) {
      segments.push({ type: 'text', content: textLines.join('\n') })
      textLines = []
    }
  }
  let index = 0
  while (index < lines.length) {
    if (lines[index].includes('|') && index + 1 < lines.length && tableSeparator(lines[index + 1])) {
      flushText()
      const rows = [tableRow(lines[index])]
      index += 2
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(tableRow(lines[index]))
        index += 1
      }
      if (rows[0].length > 0) segments.push({ type: 'table', rows })
      continue
    }
    const codeStart = lines[index].match(/^\s*```(?:\w+)?\s*$/)
    if (codeStart) {
      const codeLines = []
      index += 1
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) codeLines.push(lines[index++])
      if (index < lines.length) index += 1
      segments.push({ type: 'code', content: codeLines.join('\n') })
      continue
    }
    const heading = lines[index].match(/^\s*(#{1,6})\s+(.+)$/)
    if (heading) {
      segments.push({ type: 'heading', level: heading[1].length, content: heading[2] })
      index += 1
      continue
    }
    const list = lines[index].match(/^\s*(?:([-*+])|(\d+\.))\s+(.+)$/)
    if (list) {
      segments.push({ type: 'list', marker: list[1] || list[2], content: list[3] })
      index += 1
      continue
    }
    const quote = lines[index].match(/^\s*>\s?(.*)$/)
    if (quote) {
      segments.push({ type: 'quote', content: quote[1] })
      index += 1
      continue
    }
    if (/^\s*(?:\*\s*){3,}$/.test(lines[index]) || /^\s*[-_]{3,}\s*$/.test(lines[index])) {
      segments.push({ type: 'hr', content: '' })
      index += 1
      continue
    }
    textLines.push(lines[index])
    index += 1
  }
  flushText()
  return segments.length ? segments : [{ type: 'text', content: String(content || '') }]
}

const copyMessage = (content) => {
  const value = String(content || '').trim()
  if (!value) return
  uni.setClipboardData({
    data: value,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败', icon: 'none' }),
  })
}

const persistConversations = () => {
  uni.setStorageSync(STORAGE_KEY, conversations.value)
}

const serializeMessagesForStorage = (list) =>
  list.map(({ id, role, content, images }) => ({
    id,
    role,
    content: content || (images?.length ? '[图片]' : ''),
  }))

const upsertCurrentConversation = () => {
  if (!hasUserMessages(messages.value)) return
  const title = conversationTitle(messages.value)
  const payload = {
    id: currentId.value || createId(),
    title,
    updatedAt: Date.now(),
    messages: serializeMessagesForStorage(messages.value),
  }
  currentId.value = payload.id
  const index = conversations.value.findIndex((item) => item.id === payload.id)
  if (index >= 0) {
    conversations.value.splice(index, 1, payload)
  } else {
    conversations.value.unshift(payload)
  }
  conversations.value = conversations.value
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 50)
  persistConversations()
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const pad = (n) => `${n}`.padStart(2, '0')
  return `${date.getMonth() + 1}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const pathToDataUrl = (filePath) =>
  new Promise((resolve, reject) => {
    // #ifdef H5
    if (filePath.startsWith('blob:') || filePath.startsWith('http') || filePath.startsWith('data:')) {
      if (filePath.startsWith('data:')) {
        resolve(filePath)
        return
      }
      fetch(filePath)
        .then((response) => response.blob())
        .then(
          (blob) =>
            new Promise((innerResolve, innerReject) => {
              const reader = new FileReader()
              reader.onload = () => innerResolve(reader.result)
              reader.onerror = () => innerReject(new Error('读取图片失败'))
              reader.readAsDataURL(blob)
            }),
        )
        .then(resolve)
        .catch(reject)
      return
    }
    // #endif

    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (result) => {
        const lower = filePath.toLowerCase()
        const mime = lower.endsWith('.png')
          ? 'image/png'
          : lower.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg'
        resolve(`data:${mime};base64,${result.data}`)
      },
      fail: (error) => reject(error),
    })
  })

const pickImages = () => {
  if (isLoading.value) return
  const remain = MAX_IMAGES - pendingImages.value.length
  if (remain <= 0) {
    uni.showToast({ title: `最多上传${MAX_IMAGES}张图片`, icon: 'none' })
    return
  }

  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (result) => {
      try {
        const paths = result.tempFilePaths || []
        const dataUrls = []
        for (const filePath of paths) {
          dataUrls.push(await pathToDataUrl(filePath))
        }
        pendingImages.value = [...pendingImages.value, ...dataUrls].slice(0, MAX_IMAGES)
        pendingImagePaths.value = [...pendingImagePaths.value, ...paths].slice(0, MAX_IMAGES)
      } catch (error) {
        console.error('pick image failed', error)
        uni.showToast({ title: '图片读取失败', icon: 'none' })
      }
    },
  })
}

const removePendingImage = (index) => {
  pendingImages.value = pendingImages.value.filter((_, i) => i !== index)
  pendingImagePaths.value = pendingImagePaths.value.filter((_, i) => i !== index)
}

const previewImages = async (urls, current = 0, localUrls = []) => {
  if (!urls?.length) return
  const previewUrls = urls.map((url, index) => localUrls?.[index] || originalImageSource(url))
  if (typeof plus !== 'undefined' && uni.getFileSystemManager) {
    const fs = uni.getFileSystemManager()
    await Promise.all(previewUrls.map(async (url, index) => {
      const match = String(url).match(/^data:image\/([^;]+);base64,(.*)$/)
      if (!match) return
      const extension = match[1] === 'jpeg' ? 'jpg' : match[1]
      const privateDoc = typeof plus.io?.PRIVATE_DOC === 'string' ? plus.io.PRIVATE_DOC : '_doc'
      const filePath = `${privateDoc}/lifeai-preview-${Date.now()}-${index}.${extension}`
      await new Promise((resolve) => fs.writeFile({
        filePath,
        encoding: 'base64',
        data: match[2],
        success: () => { previewUrls[index] = filePath; resolve() },
        fail: (error) => { console.warn('preview image write failed', error); resolve() },
      }))
    }))
  }
  if (typeof plus !== 'undefined' && !previewUrls.some((url) => url && !String(url).startsWith('data:image/'))) {
    uni.showToast({ title: '图片预览失败，请重新上传', icon: 'none' })
    return
  }
  previewUrl.value = previewUrls[current] || previewUrls[0]
  previewDownloadUrl.value = previewUrl.value
  previewVisible.value = true
}

const imageSource = (src) => String(src || '').startsWith('/v1/uploads/') ? backendAssetUrl(src) : src
const originalImageSource = (src) => {
  const value = String(src || '')
  return imageSource(value.replace('/v1/uploads/thumbs/', '/v1/uploads/originals/'))
}
const closeImagePreview = () => { previewVisible.value = false }
const downloadPreviewImage = async () => {
  const url = previewDownloadUrl.value
  if (!url) return
  // H5：使用浏览器下载；App-Plus：下载后保存到系统相册。
  if (typeof document !== 'undefined' && !url.startsWith('file://')) {
    const link = document.createElement('a')
    link.href = url
    link.download = `小日子AI-${Date.now()}.jpg`
    link.click()
    uni.showToast({ title: '开始下载', icon: 'success' })
    return
  }
  const save = (filePath) => uni.saveImageToPhotosAlbum({
    filePath,
    success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
    fail: () => uni.showToast({ title: '保存失败，请授予相册权限', icon: 'none' }),
  })
  if (/^https?:\/\//.test(url)) {
    uni.downloadFile({ url, success: ({ tempFilePath }) => save(tempFilePath), fail: () => uni.showToast({ title: '图片下载失败', icon: 'none' }) })
  } else {
    save(url)
  }
}
const isStoredImage = (src) => String(src || '').startsWith('/v1/uploads/')

const handleClipboardPaste = async (event) => {
  const items = Array.from(event?.clipboardData?.items || [])
  const files = items.filter((item) => item.type.startsWith('image/')).map((item) => item.getAsFile()).filter(Boolean)
  if (!files.length) return
  event.preventDefault()
  const dataUrls = await Promise.all(files.map((file) => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })))
  pendingImages.value = [...pendingImages.value, ...dataUrls.filter(Boolean)].slice(0, MAX_IMAGES)
  imagePurpose.value = 'normal'
  uni.showToast({ title: '图片已粘贴', icon: 'success' })
}

onMounted(() => {
  if (typeof document !== 'undefined') document.addEventListener('paste', handleClipboardPaste)
})
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('paste', handleClipboardPaste)
})

const buildHistoryPayload = (list) =>
  list.slice(-12).map(({ role, content, images }) => ({
    role,
    content: content || '',
    images: images || [],
  }))

const formatFoodLabel = (label, alreadyExists = false) => {
  const n = label.nutritionPer100g || {}
  const footer = alreadyExists ? '该食物已在食物库中，未重复添加。' : '已自动加入食物库。'
  return `识别到：${label.name}\n每100g：${n.calories ?? '—'} kcal\n蛋白质 ${n.proteinG ?? '—'}g · 脂肪 ${n.fatG ?? '—'}g\n碳水 ${n.carbsG ?? '—'}g · 钠 ${n.sodiumMg ?? '—'}mg\n\n${footer}`
}

const isValidFoodLabel = (label) => {
  if (!label || Number(label.confidence) < 0.7) return false
  const n = label.nutritionPer100g || {}
  return [n.calories, n.proteinG, n.fatG, n.carbsG].some((value) => value != null && Number.isFinite(Number(value)))
}

const shouldTryFoodLabel = (content, images) => {
  // 必须带图，且文案含「食物」，才进入食物库识别入库
  if (!images.length) return false
  return String(content || '').includes('食物')
}
const foodNameFromContent = (content) => String(content || '')
  .replace(/识别|分析|查看|营养成分表|营养标签|食物|食品|名称/g, ' ')
  .replace(/[：:，,。]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
const shouldTryReceipt = (content, images) => images.length > 0 && imagePurpose.value === 'receipt'

const saveFoodLabel = async (message) => {
  try {
    const result = await backendApi.createFoodItem({ name: message.foodLabel.name, servingSizeG: message.foodLabel.servingSizeG, nutritionPer100g: message.foodLabel.nutritionPer100g })
    messages.value = messages.value.map((item) => item.id === message.id ? { ...item, foodLabelSaved: true } : item)
    uni.showToast({ title: result.alreadyExists ? '已在食物库中' : '已加入食物库', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  }
}

const confirmLedgerBatch = async (message) => {
  try {
    const now = new Date()
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const date = /^\d{4}-\d{2}-\d{2}$/.test(message.ledgerDate || '') ? message.ledgerDate : localDate
    const items = message.ledgerBatch.map((entry) => ({ ...entry, description: `${entry.description || entry.category}${Number(entry.quantity) > 1 ? ` ×${entry.quantity}` : ''}`, date }))
    await backendApi.createLedgerBatch(items)
    messages.value = messages.value.map((item) => item.id === message.id ? { ...item, ledgerBatchSaved: true } : item)
    uni.showToast({ title: `已批量记账 ${items.length} 条`, icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '批量入账失败', icon: 'none' })
  }
}

const sendMessage = async () => {
  const content = inputValue.value.trim()
  const images = [...pendingImages.value]
  const previewImagesForMessage = [...pendingImagePaths.value]
  if ((!content && !images.length) || isLoading.value) return

  const userMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    images,
    previewImages: previewImagesForMessage,
  }
  const allMessages = [...messages.value, userMessage]
  messages.value = allMessages
  inputValue.value = ''
  pendingImages.value = []
  pendingImagePaths.value = []
  imagePurpose.value = 'normal'
  isLoading.value = true
  cancelRequested.value = false
  scrollIntoView.value = `message-${userMessage.id}`
  upsertCurrentConversation()

  try {
    const history = buildHistoryPayload(allMessages)
    let answer = ''

    if (shouldTryReceipt(content, images)) {
      try {
        const receipt = await backendApi.parseReceipt(images, receiptSource.value)
        const ledgerBatch = receipt.items.map((entry) => ({ type: 'expense', amount: entry.amount, category: entry.category || '购物', description: entry.description, quantity: entry.quantity || 1 }))
        const assistantMessage = { id: `assistant-${Date.now()}`, role: 'assistant', content: `识别到购物明细，共 ${ledgerBatch.length} 项${receipt.totalAmount != null ? `，合计 ${receipt.totalAmount} 元` : ''}。请确认后加入记账列表。`, ledgerBatch, ledgerDate: receipt.date || null }
        messages.value = [...allMessages, assistantMessage]
        scrollIntoView.value = `message-${assistantMessage.id}`
        upsertCurrentConversation()
        isLoading.value = false
        return
      } catch (error) {
        console.warn('receipt parse skipped', error)
        uni.showToast({ title: error.message || '小票识别失败', icon: 'none' })
      }
    }

    if (shouldTryFoodLabel(content, images)) {
      try {
        const userFoodName = foodNameFromContent(content)
        const result = await backendApi.recognizeAndSaveFoodLabel(images, userFoodName)
        if (result.processing) {
          const assistantMessage = { id: `assistant-${Date.now()}`, role: 'assistant', content: result.content }
          messages.value = [...allMessages, assistantMessage]
          scrollIntoView.value = `message-${assistantMessage.id}`
          upsertCurrentConversation()
          isLoading.value = false
          return
        }
        const label = result.label
        const saved = result.saved
        if (isValidFoodLabel(label)) {
          const assistantMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: formatFoodLabel(label, !!saved.alreadyExists),
            foodLabel: label,
            foodLabelSaved: true,
          }
          messages.value = [...allMessages, assistantMessage]
          scrollIntoView.value = `message-${assistantMessage.id}`
          upsertCurrentConversation()
          isLoading.value = false
          return
        }
      } catch (error) {
        console.warn('food label recognize skipped', error)
      }
    }

    const backendResponse = await backendApi.chat(currentId.value || undefined, history)
    currentId.value = backendResponse.conversationId
    answer = backendResponse.content || ''
    if (backendResponse.applied) {
      uni.showToast({ title: backendResponse.applied, icon: 'none', duration: 2500 })
    }

    if (!answer) throw new Error('模型没有返回有效内容')
    const assistantMessage = { id: `assistant-${Date.now()}`, role: 'assistant', content: answer, ledgerBatch: backendResponse.ledgerBatch || null }
    messages.value = [...allMessages, assistantMessage]
    scrollIntoView.value = `message-${assistantMessage.id}`
    upsertCurrentConversation()
  } catch (error) {
    if (cancelRequested.value) return
    console.error('chat failed', error)
    uni.showToast({ title: (error.errMsg || error.message || '请求失败').slice(0, 30), icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

const stopMessage = () => {
  if (!isLoading.value) return
  cancelRequested.value = true
  backendApi.cancelChat()
}

const onComposerPrimary = () => {
  if (isLoading.value) stopMessage()
  else sendMessage()
}

const startNewConversation = () => {
  if (isLoading.value) return
  upsertCurrentConversation()
  currentId.value = ''
  pendingImages.value = []
  messages.value = [welcome('已开始新的对话。有什么想聊的吗？')]
  scrollIntoView.value = 'message-welcome'
  historyVisible.value = false
}

const openHistory = () => {
  if (isLoading.value) return
  upsertCurrentConversation()
  backendApi.conversations()
    .then((items) => {
      conversations.value = items
      historyVisible.value = true
    })
    .catch((error) => uni.showToast({ title: error.message || '历史记录加载失败', icon: 'none' }))
}

const openModules = () => {
  upsertCurrentConversation()
  historyVisible.value = false
  uni.navigateTo({ url: '/pages/modules/index' })
}

const closeHistory = () => {
  if (historyLoading.value) return
  historyVisible.value = false
}

const openConversation = async (id) => {
  if (historyLoading.value || isLoading.value) return
  historyLoading.value = true
  try {
    const target = conversations.value.find((item) => item.id === id)
    if (!target) return
    const storedMessages = await backendApi.messages(id)
    currentId.value = target.id
    pendingImages.value = []
    const normalizedMessages = storedMessages.map((message) => ({
      ...message,
      images: Array.isArray(message.images) ? message.images.filter(isStoredImage) : [],
    }))
    messages.value = normalizedMessages.length ? normalizedMessages : [welcome('今天过得怎么样？')]
    const last = messages.value[messages.value.length - 1]
    scrollIntoView.value = last ? `message-${last.id}` : 'message-welcome'
    historyVisible.value = false
  } catch (error) {
    uni.showToast({ title: error.message || '会话加载失败', icon: 'none' })
  } finally {
    historyLoading.value = false
  }
}

const removeConversation = async (id) => {
  if (historyLoading.value || isLoading.value) return
  try {
    await backendApi.deleteConversation(id)
    conversations.value = conversations.value.filter((item) => item.id !== id)
  } catch (error) {
    uni.showToast({ title: error.message || '删除失败', icon: 'none' })
    return
  }
  if (currentId.value === id) {
    currentId.value = ''
    pendingImages.value = []
    messages.value = [welcome('已开始新的对话。有什么想聊的吗？')]
    scrollIntoView.value = 'message-welcome'
  }
}
</script>

<style scoped>
.chat-page {
  position: relative;
  height: 100vh;
  height: 100dvh;
  min-height: -webkit-fill-available;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--life-bg);
}
.chat-header {
  padding: 42rpx 32rpx 26rpx;
  padding-top: calc(42rpx + var(--status-bar-height, 0px) + env(safe-area-inset-top));
  background: var(--life-surface);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid var(--life-border);
}
.chat-title { font-size: 36rpx; font-weight: 700; color: var(--life-text); }
.chat-subtitle { margin-top: 8rpx; font-size: 24rpx; color: var(--life-muted); }
.header-actions { display: flex; align-items: center; gap: 12rpx; }
.icon-button {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  background: var(--life-surface-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-glyph {
  width: 36rpx;
  height: 36rpx;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}
.icon-glyph.small {
  width: 28rpx;
  height: 28rpx;
}
.icon-new {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23567a38' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M12 5v14'/%3E%3Cpath d='M5 12h14'/%3E%3C/svg%3E");
}
.icon-history {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23567a38' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M12 7v5l3 2'/%3E%3C/svg%3E");
}
.icon-modules {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23567a38'%3E%3Crect x='3' y='3' width='5' height='5' rx='1'/%3E%3Crect x='9.5' y='3' width='5' height='5' rx='1'/%3E%3Crect x='16' y='3' width='5' height='5' rx='1'/%3E%3Crect x='3' y='9.5' width='5' height='5' rx='1'/%3E%3Crect x='9.5' y='9.5' width='5' height='5' rx='1'/%3E%3Crect x='16' y='9.5' width='5' height='5' rx='1'/%3E%3Crect x='3' y='16' width='5' height='5' rx='1'/%3E%3Crect x='9.5' y='16' width='5' height='5' rx='1'/%3E%3Crect x='16' y='16' width='5' height='5' rx='1'/%3E%3C/svg%3E");
}
.icon-close {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23567a38' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 6l12 12'/%3E%3Cpath d='M18 6L6 18'/%3E%3C/svg%3E");
}
.icon-trash {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237d8c6a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 7h16'/%3E%3Cpath d='M9 7V5h6v2'/%3E%3Cpath d='M7 7l1 12h8l1-12'/%3E%3Cpath d='M10 11v5'/%3E%3Cpath d='M14 11v5'/%3E%3C/svg%3E");
}
.icon-image {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23567a38' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='5' width='18' height='14' rx='2'/%3E%3Ccircle cx='8.5' cy='10' r='1.5'/%3E%3Cpath d='M21 15l-5-5-4 4-2-2-5 5'/%3E%3C/svg%3E");
}
.icon-send {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12h12'/%3E%3Cpath d='m13 6 6 6-6 6'/%3E%3C/svg%3E");
}
.message-list { flex: 1; min-height: 0; padding: 28rpx 28rpx 16rpx; box-sizing: border-box; }
.message-row { display: flex; align-items: flex-start; margin-bottom: 28rpx; }
.message-row.user { flex-direction: row-reverse; }
.avatar {
  flex: none;
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  line-height: 58rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 600;
  color: #fff;
  background: var(--life-primary);
}
.user .avatar { background: var(--life-primary-deep); }
.message-bubble {
  max-width: 76%;
  margin-left: 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 10rpx 24rpx 24rpx;
  background: var(--life-surface);
  color: var(--life-text);
  font-size: 30rpx;
  line-height: 1.55;
  box-shadow: 0 4rpx 14rpx var(--life-shadow);
}
.copy-message {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
  margin-top: 16rpx;
  margin-left: 6rpx;
  padding: 8rpx 14rpx;
  border: 1rpx solid var(--life-border);
  border-radius: 999rpx;
  background: var(--life-surface-soft);
  color: var(--life-muted);
  font-size: 22rpx;
  line-height: 1.2;
}
.copy-message:active { opacity: .65; transform: scale(.97); }
.copy-icon { font-size: 24rpx; line-height: 1; color: var(--life-primary-deep); }
.user .message-bubble {
  margin-left: 0;
  margin-right: 16rpx;
  border-radius: 24rpx 10rpx 24rpx 24rpx;
  color: #fff;
  background: var(--life-primary);
}
.user .copy-message { border-color: rgba(255, 255, 255, .3); background: rgba(255, 255, 255, .14); color: rgba(255, 255, 255, .85); }
.user .copy-icon { color: #fff; }
.bubble-text {
  white-space: pre-wrap;
  word-break: break-word;
  user-select: text;
  -webkit-user-select: text;
}
.markdown-heading { margin: 8rpx 0 14rpx; color: var(--life-text); font-weight: 700; line-height: 1.35; }
.heading-1 { font-size: 36rpx; }.heading-2 { font-size: 33rpx; }.heading-3 { font-size: 31rpx; }.heading-4, .heading-5, .heading-6 { font-size: 29rpx; }
.markdown-list-item { display: flex; align-items: flex-start; margin: 6rpx 0; white-space: pre-wrap; word-break: break-word; }
.markdown-list-marker { flex: none; width: 42rpx; color: var(--life-primary-deep); font-weight: 700; }
.markdown-quote { margin: 8rpx 0; padding: 8rpx 16rpx; border-left: 6rpx solid var(--life-primary); background: var(--life-surface-soft); color: var(--life-muted); white-space: pre-wrap; }
.markdown-code { margin: 10rpx 0; padding: 16rpx; border-radius: 12rpx; background: #273126; color: #e8f0dc; font-family: monospace; font-size: 24rpx; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.markdown-hr { height: 1rpx; margin: 18rpx 0; background: var(--life-border); }
.inline-strong { font-weight: 700; }.inline-em { font-style: italic; color: var(--life-primary-deep); }.inline-code { padding: 2rpx 8rpx; border-radius: 6rpx; background: var(--life-surface-soft); color: var(--life-primary-deep); font-family: monospace; }
.markdown-table-wrap { max-width: 100%; margin: 4rpx 0 12rpx; overflow: hidden; }
.markdown-table-scroll { max-width: 100%; }
.markdown-table { min-width: 520rpx; border: 1rpx solid var(--life-border); border-radius: 12rpx; overflow: hidden; background: var(--life-surface); }
.markdown-table-row { display: flex; border-top: 1rpx solid var(--life-border); }
.markdown-table-row:first-child { border-top: 0; }
.markdown-table-row.header { background: var(--life-primary-soft); font-weight: 700; }
.markdown-table-cell { flex: 1; min-width: 150rpx; padding: 14rpx 16rpx; border-left: 1rpx solid var(--life-border); color: var(--life-text); font-size: 24rpx; line-height: 1.4; word-break: break-word; }
.markdown-table-cell:first-child { border-left: 0; }
.bubble-images {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 12rpx;
}
.bubble-images:last-child { margin-bottom: 0; }
.bubble-image {
  width: 180rpx;
  height: 180rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.2);
}
.loading { color: var(--life-muted); }
.food-label-result { margin-top: 18rpx; padding-top: 16rpx; border-top: 1rpx solid var(--life-border); }
.food-label-line { margin-top: 6rpx; font-size: 24rpx; color: var(--life-muted); }
.food-label-save { margin-top: 16rpx; padding: 14rpx; border-radius: 14rpx; text-align: center; background: var(--life-primary); color: #fff; font-size: 25rpx; }
.food-label-saved { margin-top: 16rpx; color: var(--life-primary-deep); font-size: 24rpx; }
.ledger-batch-result { margin-top: 18rpx; padding-top: 16rpx; border-top: 1rpx solid var(--life-border); }
.ledger-batch-title { color: var(--life-text); font-size: 27rpx; font-weight: 700; }
.ledger-batch-row { display: flex; justify-content: space-between; gap: 18rpx; margin-top: 10rpx; color: var(--life-muted); font-size: 24rpx; }
.ledger-batch-confirm { margin-top: 16rpx; padding: 14rpx; border-radius: 14rpx; text-align: center; background: var(--life-primary); color: #fff; font-size: 25rpx; }
.receipt-source { margin: 12rpx 24rpx 0; padding: 14rpx 18rpx; border-radius: 14rpx; background: var(--life-primary-soft); color: var(--life-primary-deep); font-size: 24rpx; }
.composer-wrap {
  flex: none;
  background: linear-gradient(180deg, rgba(242, 246, 235, 0) 0%, var(--life-bg) 28%, var(--life-surface) 28%);
  padding-top: 12rpx;
  box-shadow: 0 -8rpx 28rpx var(--life-shadow);
}
.image-preview-row {
  display: flex;
  gap: 16rpx;
  margin: 0 24rpx 4rpx;
  padding: 16rpx 18rpx;
  overflow-x: auto;
  border-radius: 22rpx 22rpx 0 0;
  background: var(--life-surface);
}
.image-preview-item {
  position: relative;
  width: 108rpx;
  height: 108rpx;
  flex: none;
}
.image-preview {
  width: 108rpx;
  height: 108rpx;
  border-radius: 18rpx;
  background: var(--life-surface-soft);
  box-shadow: 0 2rpx 10rpx var(--life-shadow);
}
.image-remove {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: var(--life-primary-deep);
  color: #fff;
  font-size: 26rpx;
  line-height: 38rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(36, 49, 31, 0.18);
}
.composer {
  padding: 16rpx 22rpx calc(16rpx + var(--bottom-safe-height, 0px) + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 14rpx;
  background: var(--life-surface);
}
.composer-shell {
  flex: 1;
  min-width: 0;
  height: 80rpx;
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 0 10rpx 0 8rpx;
  border-radius: 40rpx;
  background: var(--life-bg);
  border: 1rpx solid var(--life-border);
  box-sizing: border-box;
}
.composer-action {
  flex: none;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--life-primary-soft);
}
.composer-action.disabled {
  opacity: 0.4;
}
.message-input {
  flex: 1;
  min-width: 0;
  height: 56rpx;
  min-height: 56rpx;
  max-height: 56rpx;
  padding: 0 12rpx 0 4rpx;
  box-sizing: border-box;
  background: transparent;
  font-size: 30rpx;
  line-height: 56rpx;
  color: var(--life-text);
}
.message-input :deep(textarea),
.message-input :deep(.uni-textarea-textarea) {
  height: 56rpx !important;
  min-height: 56rpx !important;
  max-height: 56rpx !important;
  line-height: 56rpx !important;
  padding: 0 !important;
}
.send-button {
  flex: none;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--life-disabled);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(111, 155, 74, 0.12);
}
.send-button.active {
  background: var(--life-primary);
  box-shadow: 0 6rpx 16rpx rgba(111, 155, 74, 0.28);
}
.send-button.stopping {
  background: var(--life-primary-deep);
}
.send-label {
  font-size: 26rpx;
  font-weight: 600;
  line-height: 1;
  color: #fff;
}
.composer-action .icon-glyph,
.send-button .icon-glyph {
  width: 32rpx;
  height: 32rpx;
}
.history-mask {
  position: absolute;
  inset: 0;
  background: rgba(36, 49, 31, 0.28);
  z-index: 20;
}
.history-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 78%;
  max-width: 560rpx;
  background: var(--life-surface);
  z-index: 21;
  display: flex;
  flex-direction: column;
  box-shadow: -12rpx 0 40rpx var(--life-shadow);
  animation: history-slide-in 0.2s ease;
}
@keyframes history-slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.history-header {
  padding: 36rpx 28rpx 24rpx;
  padding-top: calc(36rpx + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid var(--life-border);
}
.history-title { font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.history-list { flex: 1; min-height: 0; padding: 12rpx 16rpx 24rpx; box-sizing: border-box; }
.history-loading { display: flex; flex-direction: column; align-items: center; gap: 16rpx; padding: 72rpx 24rpx; color: var(--life-muted); font-size: 26rpx; }
.history-spinner { width: 42rpx; height: 42rpx; border: 5rpx solid var(--life-primary-soft); border-top-color: var(--life-primary); border-radius: 50%; animation: history-spin .8s linear infinite; }
@keyframes history-spin { to { transform: rotate(360deg); } }
.history-empty { padding: 80rpx 24rpx; text-align: center; color: var(--life-muted); font-size: 28rpx; }
.history-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 22rpx 18rpx;
  border-radius: 16rpx;
  margin-bottom: 10rpx;
}
.history-item.active { background: var(--life-primary-soft); }
.history-item.disabled { opacity: .6; pointer-events: none; }
.history-item-main { flex: 1; min-width: 0; }
.history-item-title {
  font-size: 28rpx;
  color: var(--life-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-item-time { margin-top: 8rpx; font-size: 22rpx; color: var(--life-muted); }
.history-delete {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.image-preview-mask { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, .86); }
.image-preview-dialog { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.image-preview-large { width: 100%; height: calc(100% - 150rpx); }
.image-preview-actions { display: flex; align-items: center; gap: 20rpx; padding: 24rpx 28rpx calc(24rpx + env(safe-area-inset-bottom)); }
.image-preview-close, .image-preview-download { min-width: 150rpx; padding: 16rpx 24rpx; border-radius: 999rpx; text-align: center; font-size: 26rpx; }
.image-preview-close { background: rgba(255, 255, 255, .16); color: rgba(255, 255, 255, .86); }
.image-preview-download { background: var(--life-primary); color: #fff; }
</style>
