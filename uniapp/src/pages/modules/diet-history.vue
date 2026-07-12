<template>
  <view class="page">
    <PageNavbar title="饮食历史" />
    <view class="body">
      <view v-if="!days.length" class="empty">还没有历史饮食记录</view>
      <view v-for="item in days" :key="item.key" class="day-card" @tap="openDay(item.key)">
        <view class="day-main">
          <view class="day-title">{{ item.label }}</view>
          <view class="day-meta">热量 {{ item.calories.toFixed(1) }} kcal · 蛋白质 {{ item.protein.toFixed(1) }}g</view>
          <view class="day-count">{{ item.count }} 条饮食</view>
        </view>
        <view class="day-arrow">›</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageNavbar from '../../components/PageNavbar.vue'
import { backendApi } from '../../lib/api.js'

const records = ref([])

const dayKey = (value) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatLabel = (key) => {
  const [y, m, d] = key.split('-')
  return `${Number(y)}年${Number(m)}月${Number(d)}日`
}

const days = computed(() => {
  const grouped = new Map()
  records.value.forEach((record) => {
    const key = dayKey(record.date)
    const current = grouped.get(key) || { key, calories: 0, protein: 0, count: 0 }
    current.calories += Number(record.calories) || 0
    current.protein += Number(record.proteinG) || 0
    current.count += 1
    grouped.set(key, current)
  })
  return [...grouped.values()]
    .sort((a, b) => (a.key < b.key ? 1 : -1))
    .map((item) => ({ ...item, label: formatLabel(item.key) }))
})

const load = async () => {
  await backendApi.login()
  records.value = await backendApi.foods()
}

const openDay = (date) => uni.navigateTo({ url: `/pages/modules/diet-day?date=${encodeURIComponent(date)}` })

onShow(() => load().catch((error) => uni.showToast({ title: error.message || '加载失败', icon: 'none' })))
</script>

<style scoped>
.page { min-height: 100vh; background: var(--life-bg); }
.body { padding: 30rpx 28rpx 60rpx; }
.empty { padding: 90rpx 30rpx; text-align: center; color: var(--life-muted); font-size: 28rpx; }
.day-card { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; padding: 26rpx 24rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.day-main { flex: 1; min-width: 0; }
.day-title { font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.day-meta { margin-top: 10rpx; font-size: 26rpx; color: var(--life-text); }
.day-count { margin-top: 8rpx; font-size: 23rpx; color: var(--life-muted); }
.day-arrow { flex: none; color: var(--life-muted); font-size: 40rpx; line-height: 1; }
</style>
