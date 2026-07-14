<template>
  <view class="page">
    <PageNavbar title="记账" />
    <view class="body">
      <view class="toolbar">
        <view class="toolbar-tip">本月流水 · {{ monthLabel }}</view>
        <view class="history-button" @tap="openHistory">历史记录</view>
      </view>

      <view class="summary-card">
        <view>
          <view class="summary-label">本月收入</view>
          <view class="income">+ ¥{{ totalIncome.toFixed(2) }}</view>
        </view>
        <view>
          <view class="summary-label">本月支出</view>
          <view class="expense">- ¥{{ totalExpense.toFixed(2) }}</view>
        </view>
      </view>

      <view class="form-card">
        <view class="form-title">新增一笔</view>
        <view class="type-row">
          <view class="type-button" :class="{ selected: draft.type === 'expense' }" @tap="draft.type = 'expense'">支出</view>
          <view class="type-button" :class="{ selected: draft.type === 'income' }" @tap="draft.type = 'income'">收入</view>
        </view>
        <picker mode="date" :value="draft.date" @change="draft.date = $event.detail.value">
          <view class="field">日期：{{ draft.date }}</view>
        </picker>
        <input v-model="draft.amount" class="input" type="digit" placeholder="金额" />
        <input v-model="draft.category" class="input" placeholder="分类，如餐饮、交通、工资" maxlength="40" />
        <input v-model="draft.description" class="input" placeholder="备注（可选）" maxlength="500" />
        <view class="primary-button" @tap="save">保存记录</view>
      </view>

      <view class="section-title">本月流水</view>
      <view v-if="!records.length" class="empty">本月还没有记账记录</view>
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
      <PaginationFooter :has-more="hasMore" :loading="loadingMore" @load-more="loadMore" />
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageNavbar from '../../components/PageNavbar.vue'
import PaginationFooter from '../../components/PaginationFooter.vue'
import { backendApi } from '../../lib/api.js'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const currentMonth = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const records = ref([])
const page = ref(1)
const hasMore = ref(false)
const loadingMore = ref(false)
const draft = reactive({ type: 'expense', date: today(), amount: '', category: '', description: '' })

const monthLabel = computed(() => {
  const [y, m] = currentMonth().split('-')
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
  await backendApi.login()
  page.value = 1
  const result = await backendApi.ledger(currentMonth(), page.value)
  records.value = result.items
  hasMore.value = result.hasMore
}
const loadMore = async () => { if (!hasMore.value || loadingMore.value) return; loadingMore.value = true; page.value += 1; try { const result = await backendApi.ledger(currentMonth(), page.value); records.value = [...records.value, ...result.items]; hasMore.value = result.hasMore } catch (error) { page.value -= 1; uni.showToast({ title: error.message || '加载失败', icon: 'none' }) } finally { loadingMore.value = false } }

const save = async () => {
  const amount = Number(draft.amount)
  if (!amount || amount <= 0 || !draft.category.trim()) {
    return uni.showToast({ title: '请填写金额和分类', icon: 'none' })
  }
  try {
    await backendApi.createLedger({
      type: draft.type,
      date: draft.date,
      amount,
      category: draft.category.trim(),
      description: draft.description.trim() || undefined,
    })
    draft.amount = ''
    draft.category = ''
    draft.description = ''
    await load()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  }
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

const openHistory = () => uni.navigateTo({ url: '/pages/modules/ledger-history' })

onShow(() => load().catch((error) => uni.showToast({ title: error.message || '加载失败', icon: 'none' })))
</script>

<style scoped>
.page { min-height: 100vh; background: var(--life-bg); }
.body { padding: 30rpx 28rpx 60rpx; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 20rpx; }
.toolbar-tip { flex: 1; font-size: 26rpx; color: var(--life-muted); }
.history-button { flex: none; padding: 14rpx 20rpx; border-radius: 16rpx; background: var(--life-primary-soft); color: var(--life-primary-deep); font-size: 24rpx; font-weight: 600; }
.summary-card, .form-card, .record-card { padding: 26rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.summary-card { display: flex; justify-content: space-around; margin-bottom: 18rpx; text-align: center; }
.summary-label { font-size: 23rpx; color: var(--life-muted); }
.income { margin-top: 8rpx; color: #4e9a6c; font-size: 30rpx; font-weight: 700; }
.expense { margin-top: 8rpx; color: #b97970; font-size: 30rpx; font-weight: 700; }
.form-title, .section-title { margin-bottom: 20rpx; font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.type-row { display: flex; gap: 14rpx; margin-bottom: 18rpx; }
.type-button { flex: 1; padding: 18rpx; border-radius: 16rpx; text-align: center; background: var(--life-surface-soft); color: var(--life-muted); font-size: 28rpx; }
.type-button.selected { background: var(--life-primary-soft); color: var(--life-primary-deep); font-weight: 700; }
.field, .input { box-sizing: border-box; width: 100%; min-height: 76rpx; margin-bottom: 16rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 28rpx; }
.primary-button { padding: 20rpx; border-radius: 16rpx; text-align: center; background: var(--life-primary); color: #fff; font-size: 28rpx; }
.section-title { margin-top: 34rpx; }
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
