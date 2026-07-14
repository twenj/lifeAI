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
          <picker :range="typeOptions" @change="draft.type = typeValues[$event.detail.value]"><view class="type-picker">类型：{{ typeLabel }}</view></picker>
          <textarea v-if="draft.type === 'text'" v-model="draft.content" class="editor-content-input" placeholder="写下你的想法…" maxlength="100000" auto-height />
          <textarea v-else v-model="draft.itemsText" class="editor-content-input list-editor" placeholder="每行一项，例如：\n买牛奶\n整理房间" maxlength="100000" auto-height />
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
import { computed, onMounted, reactive, ref } from 'vue'
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
const typeValues = ['text', 'list']
const typeOptions = ['文本', '列表']
const typeLabel = computed(() => typeOptions[typeValues.indexOf(draft.type)] || '文本')

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
  editingId.value = ''
  draft.title = ''
  draft.content = ''
  draft.type = 'text'
  draft.itemsText = ''
  editorVisible.value = true
}

const startEdit = (note) => {
  editingId.value = note.id
  draft.title = note.title
  draft.content = note.content || ''
  draft.type = note.type === 'list' ? 'list' : 'text'
  draft.itemsText = noteItems(note).map((item) => item.text).join('\n')
  editorVisible.value = true
}

const noteItems = (note) => Array.isArray(note.items) ? note.items : []
const buildItems = () => draft.itemsText.split(/\r?\n/).map((text) => text.trim()).filter(Boolean).slice(0, 200).map((text) => ({ text, done: false }))
const toggleItem = async (note, index) => {
  const items = noteItems(note).map((item) => ({ ...item }))
  if (!items[index]) return
  items[index].done = !items[index].done
  try { const updated = await backendApi.updateNote(note.id, { items, type: 'list' }); Object.assign(note, updated) } catch (error) { uni.showToast({ title: error.message || '更新失败', icon: 'none' }) }
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
.list-editor { min-height: 360rpx; }
.save-button { margin-top: 22rpx; padding: 22rpx; border-radius: 18rpx; text-align: center; background: var(--life-primary); color: #fff; font-size: 29rpx; }
.save-button.disabled { opacity: .55; }
</style>
