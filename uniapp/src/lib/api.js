const TOKEN_KEY = 'lifeai-backend-token'
const DEVICE_KEY = 'lifeai-device-id'
let activeChatTask = null
// 由 vite.config.js 在构建时注入，避免 App-Plus 运行时访问 import.meta.env。
const configuredBaseUrl = typeof __LIFEAI_API_BASE_URL__ !== 'undefined' ? String(__LIFEAI_API_BASE_URL__ || '').trim().replace(/\/$/, '') : ''

const baseUrl = () => {
  // #ifdef H5
  // 生产环境可通过 VITE_API_BASE_URL 指向 HTTPS API；未配置时使用同源代理。
  return configuredBaseUrl || '/backend'
  // #endif
  // App-Plus 使用线上 HTTPS 反向代理；接口路径会拼成 /backend/v1/...
  return configuredBaseUrl || 'https://lifeai-shiguang.com/backend'
}

export const backendAssetUrl = (path) => `${baseUrl()}${path}`

const getDeviceId = () => {
  let id = uni.getStorageSync(DEVICE_KEY)
  if (!id) {
    id = `device-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    uni.setStorageSync(DEVICE_KEY, id)
  }
  return id
}

const login = async (force = false) => {
  const existingToken = uni.getStorageSync(TOKEN_KEY)
  if (existingToken && !force) return { token: existingToken }
  const result = await request('/v1/auth/anonymous', {
    method: 'POST',
    data: { externalId: getDeviceId() },
    skipAuth: true,
  })
  uni.setStorageSync(TOKEN_KEY, result.token)
  return result
}

export async function request(path, options = {}) {
  const token = uni.getStorageSync(TOKEN_KEY)
  const headers = { ...(options.header || {}) }
  if (token && !options.skipAuth) headers.Authorization = `Bearer ${token}`
  const method = options.method || 'GET'
  const data = options.data === undefined && !['GET', 'HEAD'].includes(method) ? {} : options.data
  const response = await new Promise((resolve, reject) => {
    const task = uni.request({
      url: `${baseUrl()}${path}`,
      method,
      data,
      header: headers,
      timeout: options.timeout ?? 180000,
      success: resolve,
      fail: reject,
    })
    options.onTask?.(task)
  })
  const result = Array.isArray(response) ? response[1] || response[0] : response
  if ((result?.statusCode || 0) === 401 && !options.skipAuth && !options.retried) {
    await login(true)
    return request(path, { ...options, retried: true })
  }
  if ((result?.statusCode || 0) >= 400) {
    throw new Error(result?.data?.error || `请求失败（${result?.statusCode}）`)
  }
  return result?.data
}

export const backendApi = {
  login,
  shareCode: () => request('/v1/auth/share-code', { method: 'POST', data: {} }),
  joinShareCode: async (shareCode) => { const result = await request('/v1/auth/share-code/join', { method: 'POST', data: { shareCode }, skipAuth: true }); uni.setStorageSync(TOKEN_KEY, result.token); return result },
  conversations: () => request('/v1/conversations'),
  messages: (id) => request(`/v1/conversations/${id}/messages`),
  deleteConversation: (id) => request(`/v1/conversations/${id}`, { method: 'DELETE' }),
  chat: (conversationId, messages) => request('/v1/chat', { method: 'POST', data: { conversationId, messages }, onTask: (task) => { activeChatTask = task } }).finally(() => { activeChatTask = null }),
  cancelChat: () => { activeChatTask?.abort?.(); activeChatTask = null },
  notes: (page = 1, pageSize = 20) => request(`/v1/notes?page=${page}&pageSize=${pageSize}`),
  createNote: (data) => request('/v1/notes', { method: 'POST', data }),
  updateNote: (id, data) => request(`/v1/notes/${id}`, { method: 'PATCH', data }),
  deleteNote: (id) => request(`/v1/notes/${id}`, { method: 'DELETE' }),
  journals: (page = 1, pageSize = 20) => request(`/v1/journals?page=${page}&pageSize=${pageSize}`),
  updateJournal: (id, data) => request(`/v1/journals/${id}`, { method: 'PATCH', data }),
  weights: (page = 1, pageSize = 20) => request(`/v1/weight-records?page=${page}&pageSize=${pageSize}`),
  createWeight: (data) => request('/v1/weight-records', { method: 'POST', data }),
  deleteWeight: (id) => request(`/v1/weight-records/${id}`, { method: 'DELETE' }),
  foods: (page = 1, pageSize = 20) => request(`/v1/food-records?page=${page}&pageSize=${pageSize}`),
  createFood: (data) => request('/v1/food-records', { method: 'POST', data }),
  updateFood: (id, data) => request(`/v1/food-records/${id}`, { method: 'PATCH', data }),
  deleteFood: (id) => request(`/v1/food-records/${id}`, { method: 'DELETE' }),
  ledger: (month, page = 1, pageSize = 20) => request(`/v1/ledger?${month ? `month=${encodeURIComponent(month)}&` : ''}page=${page}&pageSize=${pageSize}`),
  ledgerMonths: () => request('/v1/ledger/months'),
  createLedger: (data) => request('/v1/ledger', { method: 'POST', data }),
  createLedgerBatch: (items) => request('/v1/ledger/batch', { method: 'POST', data: { items } }),
  deleteLedger: (id) => request(`/v1/ledger/${id}`, { method: 'DELETE' }),
  schedules: (page = 1, pageSize = 20) => request(`/v1/schedules?page=${page}&pageSize=${pageSize}`),
  createSchedule: (data) => request('/v1/schedules', { method: 'POST', data }),
  updateSchedule: (id, data) => request(`/v1/schedules/${id}`, { method: 'PATCH', data }),
  deleteSchedule: (id) => request(`/v1/schedules/${id}`, { method: 'DELETE' }),
  recognizeFoodLabel: (images) => request('/v1/food-label/recognize', { method: 'POST', data: { images } }),
  recognizeAndSaveFoodLabel: (images, name) => request('/v1/food-label/recognize-and-save', { method: 'POST', data: { images, ...(name ? { name } : {}) } }),
  parseReceipt: (images, source = 'other') => request('/v1/receipt/parse', { method: 'POST', data: { images, source } }),
  foodItems: (page = 1, pageSize = 20) => request(`/v1/food-items?page=${page}&pageSize=${pageSize}`),
  createFoodItem: (data) => request('/v1/food-items', { method: 'POST', data }),
  updateFoodItem: (id, data) => request(`/v1/food-items/${id}`, { method: 'PATCH', data }),
  deleteFoodItem: (id) => request(`/v1/food-items/${id}`, { method: 'DELETE' }),
  shoppingItems: (listType) => request(`/v1/shopping-items${listType ? `?listType=${encodeURIComponent(listType)}` : ''}`),
  createShoppingItem: (data) => request('/v1/shopping-items', { method: 'POST', data }),
  updateShoppingItem: (id, data) => request(`/v1/shopping-items/${id}`, { method: 'PATCH', data }),
  reorderShoppingItems: (data) => request('/v1/shopping-items/reorder', { method: 'PUT', data }),
  deleteShoppingItem: (id) => request(`/v1/shopping-items/${id}`, { method: 'DELETE' }),
  clearPurchasedShoppingItems: () => request('/v1/shopping-items/purchased', { method: 'DELETE' }),
}
