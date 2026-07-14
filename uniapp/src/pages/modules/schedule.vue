<template>
  <view class="page">
    <PageNavbar title="日程" />
    <view class="body">
      <view class="form-card">
        <view class="form-title">{{ editingId ? '编辑日程' : '添加日程' }}</view>
        <input v-model="draft.title" class="input" placeholder="日程标题，如：项目评审" maxlength="120" />
        <picker mode="date" :value="draft.date" @change="draft.date = $event.detail.value"><view class="field">日期：{{ draft.date }}</view></picker>
        <view class="row">
          <picker mode="time" :value="draft.startTime" @change="changeStartTime"><view class="field half">开始：{{ draft.startTime }}</view></picker>
          <picker mode="time" :value="draft.endTime" @change="draft.endTime = $event.detail.value"><view class="field half">结束：{{ draft.endTime }}</view></picker>
        </view>
        <picker :range="repeatOptions" @change="draft.repeat = repeatValues[$event.detail.value]"><view class="field">重复：{{ repeatLabel }}</view></picker>
        <picker :range="reminderOptions" @change="draft.reminderMinutes = reminderValues[$event.detail.value]"><view class="field">提醒：{{ reminderLabel }}</view></picker>
        <textarea v-model="draft.notes" class="textarea" placeholder="备注（可选）" maxlength="2000" auto-height />
        <view class="form-actions"><view class="primary-button" @tap="save">{{ editingId ? '保存修改' : '保存日程' }}</view><view v-if="editingId" class="cancel-button" @tap="resetDraft">取消编辑</view></view>
      </view>
      <view class="section-title">我的日程</view>
      <view v-if="!items.length" class="empty">还没有日程安排</view>
      <view v-for="item in items" :key="item.id" class="schedule-card" :class="{ done: item.completed }">
        <view class="schedule-main">
          <view class="schedule-title">{{ item.title }}</view>
          <view class="schedule-time">{{ formatDateTime(item.startAt) }}<text v-if="item.endAt"> - {{ formatTime(item.endAt) }}</text></view>
          <view v-if="item.notes" class="schedule-notes">{{ item.notes }}</view>
          <view class="schedule-meta">{{ repeatText(item.repeat) }}<text v-if="item.reminderMinutes != null"> · 提前{{ item.reminderMinutes }}分钟提醒</text></view>
        </view>
        <view class="actions"><view class="edit" @tap="edit(item)">编辑</view><view class="complete" @tap="toggle(item)">{{ item.completed ? '已完成' : '完成' }}</view><view class="delete" @tap="remove(item)">删除</view></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageNavbar from '../../components/PageNavbar.vue'
import { backendApi } from '../../lib/api.js'
import { scheduleLocalReminder } from '../../lib/notifications.js'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const items = ref([])
const repeatValues = ['none', 'daily', 'weekly', 'monthly']
const repeatOptions = ['不重复', '每天', '每周', '每月']
const reminderValues = [null, 10, 30, 60]
const reminderOptions = ['不提醒', '提前10分钟', '提前30分钟', '提前1小时']
const draft = reactive({ title: '', date: today(), startTime: '09:00', endTime: '10:00', repeat: 'none', reminderMinutes: null, notes: '' })
const editingId = ref('')
const repeatLabel = computed(() => repeatOptions[repeatValues.indexOf(draft.repeat)] || '不重复')
const reminderLabel = computed(() => reminderOptions[reminderValues.indexOf(draft.reminderMinutes)] || '不提醒')
const repeatText = (value) => repeatOptions[repeatValues.indexOf(value)] || '不重复'
const formatDateTime = (value) => new Date(value).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
const formatTime = (value) => new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
const load = async () => { await backendApi.login(); items.value = await backendApi.schedules() }
const timeAfterOneHour = (value) => {
  const [hour, minute] = String(value || '09:00').split(':').map(Number)
  const total = ((hour * 60 + minute + 60) % 1440 + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
const changeStartTime = (event) => {
  draft.startTime = event.detail.value
  draft.endTime = timeAfterOneHour(draft.startTime)
}
const localDate = (value) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const toIsoRange = () => {
  const start = new Date(`${draft.date}T${draft.startTime}:00`)
  const end = new Date(`${draft.date}T${draft.endTime}:00`)
  if (end <= start) end.setDate(end.getDate() + 1)
  return { startAt: start.toISOString(), endAt: end.toISOString() }
}
const resetDraft = () => {
  editingId.value = ''
  Object.assign(draft, { title: '', date: today(), startTime: '09:00', endTime: '10:00', repeat: 'none', reminderMinutes: null, notes: '' })
}
const edit = (item) => {
  editingId.value = item.id
  const start = new Date(item.startAt)
  Object.assign(draft, {
    title: item.title || '', date: localDate(item.startAt), startTime: `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
    endTime: item.endAt ? `${String(new Date(item.endAt).getHours()).padStart(2, '0')}:${String(new Date(item.endAt).getMinutes()).padStart(2, '0')}` : timeAfterOneHour(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`),
    repeat: item.repeat || 'none', reminderMinutes: item.reminderMinutes ?? null, notes: item.notes || '',
  })
}
const save = async () => {
  if (!draft.title.trim()) return uni.showToast({ title: '请输入日程标题', icon: 'none' })
  try {
    const wasEditing = Boolean(editingId.value)
    const range = toIsoRange()
    const payload = { title: draft.title.trim(), ...range, repeat: draft.repeat, reminderMinutes: draft.reminderMinutes, notes: draft.notes.trim() || undefined }
    const saved = editingId.value ? await backendApi.updateSchedule(editingId.value, payload) : await backendApi.createSchedule(payload)
    scheduleLocalReminder(saved)
    resetDraft(); await load(); uni.showToast({ title: wasEditing ? '修改成功' : '保存成功', icon: 'success' })
  } catch (error) { uni.showToast({ title: error.message || '保存失败', icon: 'none' }) }
}
const toggle = async (item) => { try { const updated = await backendApi.updateSchedule(item.id, { completed: !item.completed }); item.completed = updated.completed } catch (error) { uni.showToast({ title: error.message || '更新失败', icon: 'none' }) } }
const remove = (item) => uni.showModal({ title: '删除日程', content: '确定删除这条日程吗？', success: async ({ confirm }) => { if (!confirm) return; try { await backendApi.deleteSchedule(item.id); items.value = items.value.filter((row) => row.id !== item.id) } catch (error) { uni.showToast({ title: error.message || '删除失败', icon: 'none' }) } } })
onMounted(() => load().catch((error) => uni.showToast({ title: error.message || '加载失败', icon: 'none' })))
onShow(() => load().catch(() => undefined))
</script>

<style scoped>
.page { min-height: 100vh; background: var(--life-bg); }
.body { padding: 30rpx 28rpx 60rpx; }
.form-card, .schedule-card { padding: 26rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.form-title, .section-title { margin-bottom: 20rpx; font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.field, .input, .textarea { box-sizing: border-box; width: 100%; min-height: 76rpx; margin-bottom: 16rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 28rpx; }
.textarea { min-height: 130rpx; line-height: 1.5; }
.row { display: flex; gap: 16rpx; }
.half { flex: 1; min-width: 0; }
.form-actions { display: flex; gap: 16rpx; }
.form-actions > view { flex: 1; }
.primary-button, .cancel-button { padding: 20rpx; border-radius: 16rpx; text-align: center; font-size: 28rpx; }
.primary-button { background: var(--life-primary); color: #fff; }
.cancel-button { background: var(--life-surface-soft); color: var(--life-muted); }
.section-title { margin-top: 34rpx; }
.empty { padding: 60rpx; text-align: center; color: var(--life-muted); }
.schedule-card { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14rpx; }
.schedule-main { flex: 1; min-width: 0; }
.schedule-title { font-size: 31rpx; font-weight: 700; color: var(--life-text); }
.schedule-time { margin-top: 10rpx; color: var(--life-primary-deep); font-size: 26rpx; }
.schedule-notes { margin-top: 8rpx; color: var(--life-text); font-size: 26rpx; line-height: 1.4; }
.schedule-meta { margin-top: 9rpx; color: var(--life-muted); font-size: 23rpx; }
.actions { margin-left: 18rpx; text-align: right; white-space: nowrap; }
.edit, .complete, .delete { padding: 8rpx; font-size: 24rpx; }
.edit { color: var(--life-primary-deep); }
.complete { color: var(--life-primary-deep); }
.delete { color: #b97970; }
.done { opacity: .62; }
.done .schedule-title { text-decoration: line-through; }
</style>
