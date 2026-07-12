<template>
  <view class="page">
    <PageNavbar :title="monthLabel" />
    <view class="body">
      <view class="summary-card">
        <view>
          <view class="summary-label">收入</view>
          <view class="income">+ ¥{{ totalIncome.toFixed(2) }}</view>
        </view>
        <view>
          <view class="summary-label">支出</view>
          <view class="expense">- ¥{{ totalExpense.toFixed(2) }}</view>
        </view>
        <view>
          <view class="summary-label">结余</view>
          <view class="balance">¥{{ (totalIncome - totalExpense).toFixed(2) }}</view>
        </view>
      </view>

      <view class="section-title">流水明细</view>
      <view v-if="!records.length" class="empty">这个月没有记账记录</view>
      <view v-for="item in records" :key="item.id" class="record-card">
        <view class="record-main">
          <view class="record-title">{{ item.category }}</view>
          <view class="record-description">{{ item.description || (item.type === 'income' ? '收入' : '支出') }}</view>
          <view class="record-date">{{ formatDate(item.date) }}</view>
        </view>
        <view class="record-right">
          <view :class="item.type === 'income' ? 'income' : 'expense'">
            {{ item.type === 'income' ? '+' : '-' }} ¥{{ Number(item.amount).toFixed(2) }}
          </view>
          <view class="delete" @tap="remove(item)">删除</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import PageNavbar from '../../components/PageNavbar.vue'
import { backendApi } from '../../lib/api.js'

const month = ref('')
const records = ref([])

const monthLabel = computed(() => {
  if (!month.value) return '月度账单'
  const [y, m] = month.value.split('-')
  return `${Number(y)}年${Number(m)}月`
})

const totalIncome = computed(() =>
  records.value.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0),
)
const totalExpense = computed(() =>
  records.value.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0),
)

const formatDate = (value) => new Date(value).toLocaleDateString('zh-CN')

const load = async () => {
  if (!month.value) return
  await backendApi.login()
  records.value = await backendApi.ledger(month.value)
}

const remove = (item) => {
  uni.showModal({
    title: '删除记录',
    content: '确定删除这条记账记录吗？',
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await backendApi.deleteLedger(item.id)
        records.value = records.value.filter((row) => row.id !== item.id)
      } catch (error) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      }
    },
  })
}

onLoad((query) => {
  month.value = decodeURIComponent(query?.month || '')
})

onShow(() => load().catch((error) => uni.showToast({ title: error.message || '加载失败', icon: 'none' })))
</script>

<style scoped>
.page { min-height: 100vh; background: var(--life-bg); }
.body { padding: 30rpx 28rpx 60rpx; }
.summary-card, .record-card { padding: 26rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.summary-card { display: flex; justify-content: space-around; margin-bottom: 18rpx; text-align: center; }
.summary-label { font-size: 23rpx; color: var(--life-muted); }
.income { margin-top: 8rpx; color: #4e9a6c; font-size: 28rpx; font-weight: 700; }
.expense { margin-top: 8rpx; color: #b97970; font-size: 28rpx; font-weight: 700; }
.balance { margin-top: 8rpx; color: var(--life-text); font-size: 28rpx; font-weight: 700; }
.section-title { margin: 28rpx 0 18rpx; font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.empty { padding: 60rpx; text-align: center; color: var(--life-muted); }
.record-card { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14rpx; }
.record-main { flex: 1; min-width: 0; }
.record-title { font-size: 30rpx; font-weight: 700; color: var(--life-text); }
.record-description { margin-top: 8rpx; font-size: 26rpx; color: var(--life-muted); }
.record-date { margin-top: 8rpx; font-size: 23rpx; color: var(--life-muted); }
.record-right { flex: none; text-align: right; }
.record-right .income, .record-right .expense { margin-top: 0; font-size: 28rpx; }
.delete { margin-top: 12rpx; color: #b97970; font-size: 24rpx; }
</style>
