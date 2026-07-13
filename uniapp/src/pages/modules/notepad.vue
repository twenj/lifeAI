<template>
  <view class="notepad-page">
    <template v-if="editorVisible">
      <view class="editor-page">
        <view class="editor-navbar">
          <view class="editor-back" @tap="closeEditor">‹ 返回</view>
          <view class="editor-navbar-title">{{ editingId ? '编辑笔记' : '新建笔记' }}</view>
          <view class="editor-navbar-placeholder" />
        </view>
        <view class="editor-body">
          <input v-model="draft.title" class="editor-title-input" placeholder="标题" maxlength="100" />
          <textarea v-model="draft.content" class="editor-content-input" placeholder="写下你的想法…" maxlength="100000" auto-height />
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
              <view class="note-content">{{ note.content || '暂无内容' }}</view>
              <view class="note-time">{{ formatTime(note.updatedAt) }}</view>
            </view>
            <view class="delete-button" @tap.stop="removeNote(note)">删除</view>
          </view>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import PageNavbar from '../../components/PageNavbar.vue'
import { backendApi } from '../../lib/api.js'

const notes = ref([])
const loading = ref(false)
const saving = ref(false)
const editorVisible = ref(false)
const editingId = ref('')
const draft = reactive({ title: '', content: '' })

const formatTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const loadNotes = async () => {
  loading.value = true
  try {
    await backendApi.login()
    notes.value = await backendApi.notes()
  } catch (error) {
    uni.showToast({ title: error.message || '笔记加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const startCreate = () => {
  editingId.value = ''
  draft.title = ''
  draft.content = ''
  editorVisible.value = true
}

const startEdit = (note) => {
  editingId.value = note.id
  draft.title = note.title
  draft.content = note.content || ''
  editorVisible.value = true
}

const closeEditor = () => {
  if (!saving.value) editorVisible.value = false
}

const saveNote = async () => {
  const title = draft.title.trim()
  const content = draft.content.trim()
  if (!title) {
    uni.showToast({ title: '请填写标题', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await backendApi.updateNote(editingId.value, { title, content })
    } else {
      await backendApi.createNote({ title, content })
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
.note-time { margin-top: 14rpx; font-size: 22rpx; color: var(--life-muted); }
.delete-button { flex: none; padding: 12rpx; color: #b97970; font-size: 24rpx; }
.editor-page { min-height: 100vh; background: var(--life-bg); }
.editor-navbar { display: flex; align-items: center; justify-content: space-between; height: calc(88rpx + env(safe-area-inset-top)); padding: env(safe-area-inset-top) 24rpx 0; box-sizing: border-box; background: var(--life-surface); border-bottom: 1rpx solid var(--life-border); }
.editor-back { width: 160rpx; color: var(--life-primary-deep); font-size: 28rpx; }
.editor-navbar-title { flex: 1; text-align: center; color: var(--life-text); font-size: 32rpx; font-weight: 700; }
.editor-navbar-placeholder { width: 160rpx; }
.editor-body { padding: 32rpx 28rpx calc(60rpx + env(safe-area-inset-bottom)); }
.editor-title-input, .editor-content-input { box-sizing: border-box; width: 100%; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 29rpx; }
.editor-title-input { height: 78rpx; padding: 0 20rpx; }
.editor-content-input { min-height: 520rpx; max-height: none; margin-top: 18rpx; padding: 18rpx 20rpx; line-height: 1.5; }
.save-button { margin-top: 22rpx; padding: 22rpx; border-radius: 18rpx; text-align: center; background: var(--life-primary); color: #fff; font-size: 29rpx; }
.save-button.disabled { opacity: .55; }
</style>
