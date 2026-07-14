<template>
  <view class="page">
    <PageNavbar title="体重记录" />
    <view class="body">
      <view class="form-card">
        <view class="form-title">记录体重</view>
        <view class="hint">一天可以记录多次，日期和时间都可以自己选</view>
        <picker mode="date" :value="draft.date" @change="draft.date = $event.detail.value">
          <view class="field">日期：{{ draft.date }}</view>
        </picker>
        <picker mode="time" :value="draft.time" @change="draft.time = $event.detail.value">
          <view class="field">时间：{{ draft.time }}</view>
        </picker>
        <input v-model="draft.weightKg" class="input" type="digit" placeholder="体重（kg）" />
        <input v-model="draft.note" class="input" placeholder="备注（可选）" maxlength="500" />
        <view class="primary-button" @tap="save">保存记录</view>
      </view>
      <view class="section-title">历史记录</view>
      <view v-if="!records.length" class="empty">还没有体重记录</view>
      <view v-for="item in records" :key="item.id" class="record-card">
        <view class="record-main">
          <view class="record-value">{{ item.weightKg }} kg</view>
          <view class="record-date">{{ formatDateTime(item) }}{{ item.note ? ` · ${item.note}` : '' }}</view>
        </view>
        <view class="delete" @tap="remove(item)">删除</view>
      </view>
      <PaginationFooter :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
    </view>
  </view>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import PageNavbar from '../../components/PageNavbar.vue'
import PaginationFooter from '../../components/PaginationFooter.vue'
import { backendApi } from '../../lib/api.js'

const pad = (n) => String(n).padStart(2, '0')
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
const nowTime = () => {
  const date = new Date()
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const records = ref([])
const page = ref(1)
const hasMore = ref(false)
const loadingMore = ref(false)
const draft = reactive({ date: today(), time: nowTime(), weightKg: '', note: '' })

const formatDateTime = (item) => {
  const primary = new Date(item.date)
  const fallback = new Date(item.createdAt)
  const date = Number.isNaN(primary.getTime()) ? fallback : primary
  const useFallback = !Number.isNaN(fallback.getTime())
    && date.getHours() === 0
    && date.getMinutes() === 0
    && date.getSeconds() === 0
    && fallback.getTime() !== date.getTime()
  const show = useFallback ? fallback : date
  if (Number.isNaN(show.getTime())) return ''
  return `${show.getFullYear()}/${show.getMonth() + 1}/${show.getDate()} ${pad(show.getHours())}:${pad(show.getMinutes())}`
}

const buildRecordedAt = (dateText, timeText) => {
  const [year, month, day] = dateText.split('-').map(Number)
  const [hour, minute] = String(timeText || '00:00').split(':').map(Number)
  return new Date(year, month - 1, day, hour || 0, minute || 0, 0)
}

const load = async () => {
  await backendApi.login()
  page.value = 1
  const result = await backendApi.weights(page.value)
  records.value = result.items
  hasMore.value = result.hasMore
}
const loadMore = async () => { if (!hasMore.value || loadingMore.value) return; loadingMore.value = true; page.value += 1; try { const result = await backendApi.weights(page.value); records.value = [...records.value, ...result.items]; hasMore.value = result.hasMore } catch (error) { page.value -= 1; uni.showToast({ title: error.message || '加载失败', icon: 'none' }) } finally { loadingMore.value = false } }

const save = async () => {
  const weightKg = Number(draft.weightKg)
  if (!weightKg || weightKg <= 0) return uni.showToast({ title: '请输入正确体重', icon: 'none' })
  try {
    await backendApi.createWeight({
      date: buildRecordedAt(draft.date, draft.time).toISOString(),
      weightKg,
      note: draft.note.trim() || undefined,
    })
    draft.weightKg = ''
    draft.note = ''
    draft.time = nowTime()
    await load()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  }
}

const remove = (item) => {
  uni.showModal({
    title: '删除记录',
    content: '确定删除这条体重记录吗？',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await backendApi.deleteWeight(item.id)
        records.value = records.value.filter((row) => row.id !== item.id)
      } catch (error) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      }
    },
  })
}

onMounted(() => load().catch((error) => uni.showToast({ title: error.message || '加载失败', icon: 'none' })))
</script>

<style scoped>
.page { min-height: 100vh; background: var(--life-bg); }
.body { padding: 30rpx 28rpx 60rpx; }
.form-card, .record-card { padding: 26rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.form-title, .section-title { margin-bottom: 20rpx; font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.hint { margin: -8rpx 0 18rpx; font-size: 24rpx; color: var(--life-muted); line-height: 1.4; }
.field, .input { box-sizing: border-box; width: 100%; min-height: 76rpx; margin-bottom: 16rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 28rpx; }
.primary-button { padding: 20rpx; border-radius: 16rpx; text-align: center; background: var(--life-primary); color: #fff; font-size: 28rpx; }
.section-title { margin-top: 34rpx; }
.empty { padding: 60rpx; text-align: center; color: var(--life-muted); }
.record-card { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14rpx; }
.record-main { flex: 1; min-width: 0; }
.record-value { font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.record-date { margin-top: 8rpx; font-size: 24rpx; color: var(--life-muted); }
.delete { padding: 12rpx; color: #b97970; font-size: 24rpx; }
</style>
