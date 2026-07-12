<template>
  <view class="page">
    <PageNavbar title="记账历史" />
    <view class="body">
      <view v-if="!months.length" class="empty">还没有历史记账</view>
      <view v-for="item in months" :key="item.month" class="month-card" @tap="openMonth(item.month)">
        <view class="month-main">
          <view class="month-title">{{ formatLabel(item.month) }}</view>
          <view class="month-meta">
            <text class="income">收入 ¥{{ Number(item.income).toFixed(2) }}</text>
            <text class="expense">支出 ¥{{ Number(item.expense).toFixed(2) }}</text>
          </view>
          <view class="month-count">{{ item.count }} 笔 · 结余 ¥{{ (Number(item.income) - Number(item.expense)).toFixed(2) }}</view>
        </view>
        <view class="month-arrow">›</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageNavbar from '../../components/PageNavbar.vue'
import { backendApi } from '../../lib/api.js'

const months = ref([])

const formatLabel = (month) => {
  const [y, m] = String(month).split('-')
  return `${Number(y)}年${Number(m)}月`
}

const load = async () => {
  await backendApi.login()
  const list = await backendApi.ledgerMonths()
  const current = (() => {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })()
  // 历史页展示往月；当月在首页看
  months.value = (list || []).filter((item) => item.month !== current)
}

const openMonth = (month) => uni.navigateTo({ url: `/pages/modules/ledger-month?month=${encodeURIComponent(month)}` })

onShow(() => load().catch((error) => uni.showToast({ title: error.message || '加载失败', icon: 'none' })))
</script>

<style scoped>
.page { min-height: 100vh; background: var(--life-bg); }
.body { padding: 30rpx 28rpx 60rpx; }
.empty { padding: 90rpx 30rpx; text-align: center; color: var(--life-muted); font-size: 28rpx; }
.month-card { display: flex; align-items: center; gap: 12rpx; margin-bottom: 16rpx; padding: 26rpx 24rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.month-main { flex: 1; min-width: 0; }
.month-title { font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.month-meta { display: flex; flex-wrap: wrap; gap: 18rpx; margin-top: 12rpx; font-size: 26rpx; }
.income { color: #4e9a6c; font-weight: 600; }
.expense { color: #b97970; font-weight: 600; }
.month-count { margin-top: 10rpx; font-size: 23rpx; color: var(--life-muted); }
.month-arrow { flex: none; color: var(--life-muted); font-size: 40rpx; line-height: 1; }
</style>
