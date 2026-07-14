<template>
  <view class="notepad-page">
    <template v-if="editorVisible">
      <view class="editor-page" :style="pageInsets">
        <view class="editor-navbar">
          <view class="editor-back" @tap="closeEditor">‹ 返回</view>
          <view class="editor-navbar-title">{{ editingId ? '编辑笔记' : '新建笔记' }}</view>
          <view class="editor-navbar-placeholder" />
        </view>
        <view class="editor-body">
          <input v-model="draft.title" class="editor-title-input" placeholder="标题" maxlength="100" />
          <textarea v-if="draft.type === 'text'" v-model="draft.content" class="editor-content-input" placeholder="写下你的想法…" maxlength="100000" auto-height />
          <view v-else class="draft-list-editor">
            <view class="draft-list-toolbar">
              <view class="draft-list-tip">勾选已完成，可随时补充清单</view>
              <view class="draft-add-button" @tap="draftAddVisible = !draftAddVisible">＋ 添加</view>
            </view>
            <view v-if="draftAddVisible" class="draft-add-row">
              <input v-model="draftNewItem" class="draft-add-input" placeholder="输入清单内容" confirm-type="done" @confirm="addDraftItem" />
              <view class="draft-add-confirm" @tap="addDraftItem">确定</view>
            </view>
            <view v-if="draftItems.length" class="draft-item-list">
              <view v-for="(item, index) in draftItems" :key="index" class="draft-item">
                <view class="check-box" :class="{ checked: item.done }" @tap="toggleDraftItem(index)">{{ item.done ? '✓' : '' }}</view>
                <view class="draft-item-text" :class="{ done: item.done }">{{ item.text }}</view>
                <view class="draft-item-delete" @tap="removeDraftItem(index)">删除</view>
              </view>
            </view>
            <view v-else class="draft-list-empty">还没有清单项，点击右上角“＋ 添加”</view>
          </view>
          <view class="save-button" :class="{ disabled: saving }" @tap="saveNote">{{ saving ? '保存中…' : '保存笔记' }}</view>
        </view>
      </view>
    </template>
    <template v-else>
      <PageNavbar title="记事本" />

      <view class="notepad-body">
        <view class="toolbar">
          <view class="toolbar-tip">记录生活里的想法和待办</view>
          <view class="add-button" @tap="startCreate">+ 新建</view>
        </view>

        <view v-if="loading" class="state-card">正在加载…</view>
        <view v-else-if="!notes.length" class="state-card empty">还没有笔记，先记下第一件事吧</view>
        <view v-else class="note-list">
          <view v-for="note in notes" :key="note.id" class="note-card" @tap="startEdit(note)">
            <view class="note-main">
              <view class="note-title">{{ note.title }}</view>
              <view v-if="note.type === 'list'" class="note-items">
                <view v-for="(item, index) in noteItems(note)" :key="index" class="note-item" @tap.stop="toggleItem(note, index)"><view class="check-box" :class="{ checked: item.done }">{{ item.done ? '✓' : '' }}</view><view class="note-item-text" :class="{ done: item.done }">{{ item.text }}</view></view>
                <view class="list-add-row" @tap.stop><input v-model="newItemText[note.id]" class="list-add-input" placeholder="新增一项" @confirm="addListItem(note)" /><view class="list-add-button" @tap.stop="addListItem(note)">添加</view></view>
              </view>
              <view v-else class="note-content">{{ note.content || '暂无内容' }}</view>
              <view class="note-time">{{ formatTime(note.updatedAt) }}</view>
            </view>
            <view class="delete-button" @tap.stop="removeNote(note)">删除</view>
          </view>
          <PaginationFooter :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import PageNavbar from '../../components/PageNavbar.vue'
import PaginationFooter from '../../components/PaginationFooter.vue'
import { backendApi } from '../../lib/api.js'

const notes = ref([])
const systemInfo = uni.getSystemInfoSync?.() || {}
const pageInsets = {
  '--status-bar-height': `${Number(systemInfo.statusBarHeight || 0)}px`,
}
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const hasMore = ref(false)
const saving = ref(false)
const editorVisible = ref(false)
const editingId = ref('')
const draft = reactive({ title: '', content: '', type: 'text', itemsText: '' })
const draftItems = ref([])
const draftNewItem = ref('')
const draftAddVisible = ref(false)
const newItemText = reactive({})
const typeValues = ['text', 'list']
const typeOptions = ['文本', '列表']

const formatTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const loadNotes = async (reset = true) => {
  if (loadingMore.value) return
  if (reset) { page.value = 1; hasMore.value = false }
  loading.value = true
  try {
    await backendApi.login()
    const result = await backendApi.notes(page.value)
    notes.value = reset ? result.items : [...notes.value, ...result.items]
    hasMore.value = result.hasMore
  } catch (error) {
    uni.showToast({ title: error.message || '笔记加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const loadMore = async () => { if (!hasMore.value || loadingMore.value) return; loadingMore.value = true; page.value += 1; try { const result = await backendApi.notes(page.value); notes.value = [...notes.value, ...result.items]; hasMore.value = result.hasMore } catch (error) { page.value -= 1; uni.showToast({ title: error.message || '加载失败', icon: 'none' }) } finally { loadingMore.value = false } }

const startCreate = () => {
  uni.showActionSheet({ itemList: typeOptions, success: ({ tapIndex }) => {
    editingId.value = ''
    draft.title = ''
    draft.content = ''
    draft.type = typeValues[tapIndex] || 'text'
    draft.itemsText = ''
    draftItems.value = []
    draftNewItem.value = ''
    draftAddVisible.value = false
    editorVisible.value = true
  } })
}

const startEdit = (note) => {
  editingId.value = note.id
  draft.title = note.title
  draft.content = note.content || ''
  draft.type = note.type === 'list' ? 'list' : 'text'
  draftItems.value = noteItems(note).map((item) => ({ text: String(item.text || ''), done: Boolean(item.done) }))
  draft.itemsText = draftItems.value.map((item) => item.text).join('\n')
  draftNewItem.value = ''
  draftAddVisible.value = false
  editorVisible.value = true
}

const noteItems = (note) => Array.isArray(note.items) ? note.items : []
const buildItems = () => draftItems.value.map((item) => ({ text: String(item.text || '').trim(), done: Boolean(item.done) })).filter((item) => item.text).slice(0, 200)
const addDraftItem = () => {
  const text = draftNewItem.value.trim()
  if (!text) return
  if (draftItems.value.length >= 200) return uni.showToast({ title: '列表最多 200 项', icon: 'none' })
  draftItems.value.push({ text, done: false })
  draftNewItem.value = ''
  draftAddVisible.value = false
}
const toggleDraftItem = (index) => { if (draftItems.value[index]) draftItems.value[index].done = !draftItems.value[index].done }
const removeDraftItem = (index) => { draftItems.value.splice(index, 1) }
const toggleItem = async (note, index) => {
  const items = noteItems(note).map((item) => ({ ...item }))
  if (!items[index]) return
  items[index].done = !items[index].done
  try { const updated = await backendApi.updateNote(note.id, { items, type: 'list' }); Object.assign(note, updated) } catch (error) { uni.showToast({ title: error.message || '更新失败', icon: 'none' }) }
}
const addListItem = async (note) => {
  const text = String(newItemText[note.id] || '').trim()
  if (!text) return
  const items = [...noteItems(note).map((item) => ({ ...item })), { text, done: false }]
  if (items.length > 200) return uni.showToast({ title: '列表最多 200 项', icon: 'none' })
  try { const updated = await backendApi.updateNote(note.id, { items, type: 'list' }); Object.assign(note, updated); newItemText[note.id] = '' } catch (error) { uni.showToast({ title: error.message || '添加失败', icon: 'none' }) }
}

const closeEditor = () => {
  if (!saving.value) editorVisible.value = false
}

const saveNote = async () => {
  const title = draft.title.trim()
  const content = draft.type === 'text' ? draft.content.trim() : ''
  const items = draft.type === 'list' ? buildItems() : undefined
  if (!title) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  if (draft.type === 'list' && !items.length) return uni.showToast({ title: '请至少填写一项', icon: 'none' })
  saving.value = true
  try {
    const payload = { title, content, type: draft.type, ...(items ? { items } : {}) }
    if (editingId.value) {
      await backendApi.updateNote(editingId.value, payload)
    } else {
      await backendApi.createNote(payload)
    }
    editorVisible.value = false
    await loadNotes()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const removeNote = (note) => {
  uni.showModal({
    title: '删除笔记',
    content: `确定删除“${note.title}”吗？`,
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await backendApi.deleteNote(note.id)
        notes.value = notes.value.filter((item) => item.id !== note.id)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      }
    },
  })
}

onMounted(loadNotes)
</script>

<style scoped>
.notepad-page { min-height: 100vh; max-width: 860px; margin: 0 auto; box-sizing: border-box; background: var(--life-bg); }
.notepad-body { padding: 30rpx 28rpx 60rpx; }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; }
.toolbar-tip { font-size: 26rpx; color: var(--life-muted); }
.add-button { padding: 16rpx 22rpx; border-radius: 18rpx; background: var(--life-primary); color: #fff; font-size: 26rpx; }
.state-card { padding: 80rpx 28rpx; border-radius: 24rpx; text-align: center; background: var(--life-surface); color: var(--life-muted); font-size: 28rpx; box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.note-card { display: flex; align-items: center; gap: 18rpx; padding: 26rpx 24rpx; margin-bottom: 16rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.note-main { flex: 1; min-width: 0; }
.note-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.note-content { margin-top: 12rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 27rpx; color: var(--life-muted); }
.note-items { margin-top: 12rpx; }
.note-item { display: flex; align-items: center; gap: 14rpx; padding: 10rpx 0; }
.check-box { flex: none; width: 34rpx; height: 34rpx; border: 2rpx solid var(--life-primary); border-radius: 8rpx; color: #fff; text-align: center; line-height: 34rpx; font-size: 24rpx; }
.check-box.checked { background: var(--life-primary); }
.note-item-text { flex: 1; min-width: 0; color: var(--life-text); font-size: 27rpx; word-break: break-word; }
.note-item-text.done { color: var(--life-muted); text-decoration: line-through; }
.list-add-row { display: flex; align-items: center; gap: 12rpx; margin-top: 10rpx; padding-top: 12rpx; border-top: 1rpx solid var(--life-border); }
.list-add-input { flex: 1; min-width: 0; height: 64rpx; padding: 0 16rpx; border-radius: 14rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 25rpx; }
.list-add-button { flex: none; padding: 14rpx 20rpx; border-radius: 14rpx; background: var(--life-primary-soft); color: var(--life-primary-deep); font-size: 24rpx; }
.note-time { margin-top: 14rpx; font-size: 22rpx; color: var(--life-muted); }
.delete-button { flex: none; padding: 12rpx; color: #b97970; font-size: 24rpx; }
.editor-page { min-height: 100vh; background: var(--life-bg); }
.editor-navbar { display: flex; align-items: center; justify-content: space-between; height: calc(88rpx + var(--status-bar-height, 0px)); padding: var(--status-bar-height, 0px) 24rpx 0; box-sizing: border-box; background: var(--life-surface); border-bottom: 1rpx solid var(--life-border); }
.editor-back { width: 160rpx; color: var(--life-primary-deep); font-size: 28rpx; }
.editor-navbar-title { flex: 1; text-align: center; color: var(--life-text); font-size: 32rpx; font-weight: 700; }
.editor-navbar-placeholder { width: 160rpx; }
.editor-body { padding: 32rpx 28rpx calc(60rpx + env(safe-area-inset-bottom)); }
.editor-title-input, .editor-content-input { box-sizing: border-box; width: 100%; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 29rpx; }
.type-picker { margin-top: 18rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-primary-deep); font-size: 28rpx; }
.editor-title-input { height: 78rpx; padding: 0 20rpx; }
.editor-content-input { min-height: 520rpx; max-height: none; margin-top: 18rpx; padding: 18rpx 20rpx; line-height: 1.5; }
.draft-list-editor { margin-top: 18rpx; padding: 22rpx 20rpx; border-radius: 18rpx; background: var(--life-surface-soft); }
.draft-list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.draft-list-tip { flex: 1; color: var(--life-muted); font-size: 25rpx; }
.draft-add-button { flex: none; padding: 14rpx 20rpx; border-radius: 16rpx; background: var(--life-primary); color: #fff; font-size: 26rpx; }
.draft-add-row { display: flex; align-items: center; gap: 12rpx; margin-top: 18rpx; padding-top: 16rpx; border-top: 1rpx solid var(--life-border); }
.draft-add-input { flex: 1; min-width: 0; height: 68rpx; padding: 0 16rpx; border-radius: 14rpx; background: var(--life-surface); color: var(--life-text); font-size: 26rpx; }
.draft-add-confirm { flex: none; padding: 16rpx 20rpx; border-radius: 14rpx; background: var(--life-primary-soft); color: var(--life-primary-deep); font-size: 25rpx; }
.draft-item-list { margin-top: 14rpx; }
.draft-item { display: flex; align-items: center; gap: 14rpx; min-height: 72rpx; padding: 10rpx 0; border-bottom: 1rpx solid var(--life-border); }
.draft-item-text { flex: 1; min-width: 0; color: var(--life-text); font-size: 28rpx; word-break: break-word; }
.draft-item-text.done { color: var(--life-muted); text-decoration: line-through; }
.draft-item-delete { flex: none; color: #b97970; font-size: 23rpx; }
.draft-list-empty { padding: 48rpx 12rpx 34rpx; text-align: center; color: var(--life-muted); font-size: 25rpx; }
.save-button { margin-top: 22rpx; padding: 22rpx; border-radius: 18rpx; text-align: center; background: var(--life-primary); color: #fff; font-size: 29rpx; }
.save-button.disabled { opacity: .55; }
</style>
