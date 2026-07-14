<template>
  <view class="page">
    <PageNavbar title="饮食记录" />
    <view class="body">
      <view class="toolbar">
        <view class="toolbar-tip">记录今天吃了什么</view>
        <view class="history-button" @tap="openHistory">历史记录</view>
      </view>

      <view class="form-card">
        <view class="form-title">记录今日摄入</view>
        <picker v-if="foodItems.length" :range="foodItems" range-key="name" @change="selectFood">
          <view class="field">{{ selectedFood ? `食物库：${selectedFood.name}` : '选择食物库食品（可选）' }}</view>
        </picker>
        <input v-if="selectedFood" v-model="draft.amountG" class="input" type="digit" placeholder="食用重量（g）" />
        <view v-if="selectedFood && calculatedCalories != null" class="calculated">
          按 {{ draft.amountG || 0 }}g 估算：{{ calculatedCalories.toFixed(1) }} kcal
          <text v-if="calculatedProtein != null">，蛋白质 {{ calculatedProtein.toFixed(1) }}g</text>
        </view>
        <textarea v-model="draft.description" class="textarea" placeholder="吃了什么？" maxlength="1000" auto-height />
        <view class="row">
          <input v-model="draft.calories" class="input half" type="number" placeholder="热量 kcal" />
          <input v-model="draft.proteinG" class="input half" type="digit" placeholder="蛋白质 g" />
        </view>
        <view class="primary-button" @tap="save">保存到今天</view>
      </view>

      <view class="section-title">今日摄入总量</view>
      <view class="summary-card">
        <view class="summary-line">热量 {{ todayTotal.calories.toFixed(1) }} kcal</view>
        <view class="summary-line">蛋白质 {{ todayTotal.protein.toFixed(1) }}g · {{ todayRecords.length }} 条记录</view>
      </view>

      <view class="section-title">今日饮食</view>
      <view v-if="!todayRecords.length" class="empty">今天还没有饮食记录</view>
      <view v-for="item in todayRecords" :key="item.id" class="record-card">
        <view class="record-main">
          <view class="record-title">{{ item.description }}</view>
          <view class="record-description">
            热量 {{ item.calories != null ? Number(item.calories).toFixed(1) : '—' }} kcal
            <text v-if="item.proteinG != null"> · 蛋白质 {{ Number(item.proteinG).toFixed(1) }}g</text>
            <text v-if="item.amountG"> · {{ item.amountG }}g</text>
          </view>
        </view>
        <view class="card-actions">
          <view class="edit" @tap="openEdit(item)">编辑</view>
          <view class="delete" @tap="removeOne(item)">删除</view>
        </view>
      </view>
    </view>

    <view v-if="editVisible" class="sheet-mask" @tap="closeEdit" />
    <view v-if="editVisible" class="sheet-panel">
      <view class="sheet-header">
        <view class="sheet-title">编辑饮食</view>
        <view class="sheet-close" @tap="closeEdit">×</view>
      </view>
      <view class="sheet-food">{{ editTarget?.description }}</view>
      <picker mode="date" :value="editDraft.date" @change="editDraft.date = $event.detail.value">
        <view class="field">日期：{{ editDraft.date }}</view>
      </picker>
      <input v-model="editDraft.amountG" class="input" type="digit" placeholder="食用重量（g）" />
      <view class="primary-button" :class="{ disabled: editSaving }" @tap="saveEdit">{{ editSaving ? '保存中…' : '保存修改' }}</view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageNavbar from '../../components/PageNavbar.vue'
import { backendApi } from '../../lib/api.js'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const dayKey = (value) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const records = ref([])
const foodItems = ref([])
const selectedFood = ref(null)
const draft = reactive({ description: '', calories: '', proteinG: '', amountG: '' })
const editVisible = ref(false)
const editSaving = ref(false)
const editTarget = ref(null)
const editDraft = reactive({ date: '', amountG: '' })

const todayRecords = computed(() => records.value.filter((item) => dayKey(item.date) === today()))
const todayTotal = computed(() => todayRecords.value.reduce((sum, item) => ({
  calories: sum.calories + (Number(item.calories) || 0),
  protein: sum.protein + (Number(item.proteinG) || 0),
}), { calories: 0, protein: 0 }))

const calculatedCalories = computed(() => (
  selectedFood.value?.caloriesPer100g != null && Number(draft.amountG) > 0
    ? selectedFood.value.caloriesPer100g * Number(draft.amountG) / 100
    : null
))
const calculatedProtein = computed(() => (
  selectedFood.value?.proteinGPer100g != null && Number(draft.amountG) > 0
    ? selectedFood.value.proteinGPer100g * Number(draft.amountG) / 100
    : null
))

const selectFood = (event) => {
  selectedFood.value = foodItems.value[Number(event.detail.value)] || null
  draft.calories = ''
  draft.proteinG = ''
}

const load = async () => {
  await backendApi.login()
  const result = await Promise.all([backendApi.foods(), backendApi.foodItems()])
  records.value = result[0].items
  foodItems.value = result[1].items
}

const save = async () => {
  if (!draft.description.trim() && !selectedFood.value) {
    return uni.showToast({ title: '请填写饮食内容', icon: 'none' })
  }
  try {
    await backendApi.createFood({
      date: today(),
      description: draft.description.trim() || selectedFood.value.name,
      calories: draft.calories ? Number(draft.calories) : undefined,
      proteinG: draft.proteinG ? Number(draft.proteinG) : undefined,
      foodItemId: selectedFood.value?.id,
      amountG: draft.amountG ? Number(draft.amountG) : undefined,
    })
    draft.description = ''
    draft.calories = ''
    draft.proteinG = ''
    draft.amountG = ''
    selectedFood.value = null
    await load()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  }
}

const removeOne = (item) => {
  uni.showModal({
    title: '删除记录',
    content: `确定删除「${item.description}」吗？`,
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await backendApi.deleteFood(item.id)
        records.value = records.value.filter((row) => row.id !== item.id)
      } catch (error) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      }
    },
  })
}

const openEdit = (item) => {
  editTarget.value = item
  editDraft.date = dayKey(item.date)
  editDraft.amountG = item.amountG != null ? String(item.amountG) : ''
  editVisible.value = true
}

const closeEdit = () => {
  if (editSaving.value) return
  editVisible.value = false
  editTarget.value = null
}

const saveEdit = async () => {
  const item = editTarget.value
  if (!item) return
  const amount = editDraft.amountG === '' ? null : Number(editDraft.amountG)
  if (editDraft.amountG !== '' && !(amount > 0)) {
    uni.showToast({ title: '请输入正确重量', icon: 'none' })
    return
  }
  editSaving.value = true
  try {
    const updated = await backendApi.updateFood(item.id, {
      date: editDraft.date,
      amountG: amount,
    })
    records.value = records.value.map((row) => (row.id === item.id ? updated : row))
    editVisible.value = false
    editTarget.value = null
    if (dayKey(updated.date) !== today()) {
      uni.showToast({ title: '已改到其他日期', icon: 'none' })
    } else {
      uni.showToast({ title: '已保存', icon: 'success' })
    }
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    editSaving.value = false
  }
}

const openHistory = () => uni.navigateTo({ url: '/pages/modules/diet-history' })

onMounted(() => load().catch((error) => uni.showToast({ title: error.message || '加载失败', icon: 'none' })))
onShow(() => { if (records.value.length) load().catch(() => {}) })
</script>

<style scoped>
.page { min-height: 100vh; background: var(--life-bg); }
.body { padding: 30rpx 28rpx 60rpx; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 20rpx; }
.toolbar-tip { flex: 1; font-size: 26rpx; color: var(--life-muted); }
.history-button { flex: none; padding: 14rpx 22rpx; border-radius: 16rpx; background: var(--life-primary-soft); color: var(--life-primary-deep); font-size: 26rpx; font-weight: 600; }
.form-card, .summary-card, .record-card { padding: 26rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.form-title, .section-title { margin-bottom: 20rpx; font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.field, .input, .textarea { box-sizing: border-box; width: 100%; min-height: 76rpx; margin-bottom: 16rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 28rpx; }
.textarea { min-height: 150rpx; line-height: 1.5; }
.calculated { margin: -4rpx 0 16rpx; color: var(--life-primary-deep); font-size: 25rpx; }
.row { display: flex; gap: 16rpx; }
.half { flex: 1; min-width: 0; }
.primary-button { padding: 20rpx; border-radius: 16rpx; text-align: center; background: var(--life-primary); color: #fff; font-size: 28rpx; }
.section-title { margin-top: 34rpx; }
.summary-card { margin-bottom: 8rpx; }
.summary-line { font-size: 28rpx; color: var(--life-text); line-height: 1.6; }
.empty { padding: 60rpx; text-align: center; color: var(--life-muted); }
.record-card { display: flex; align-items: flex-start; justify-content: space-between; gap: 12rpx; margin-bottom: 14rpx; }
.record-main { flex: 1; min-width: 0; }
.record-title { font-size: 30rpx; font-weight: 700; color: var(--life-text); }
.record-description { margin-top: 10rpx; font-size: 26rpx; color: var(--life-muted); line-height: 1.45; }
.card-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 10rpx; flex: none; }
.edit { padding: 8rpx 12rpx; color: var(--life-primary-deep); font-size: 24rpx; }
.delete { padding: 8rpx 12rpx; color: #b97970; font-size: 24rpx; }
.sheet-mask { position: fixed; inset: 0; z-index: 20; background: rgba(36, 49, 31, .28); }
.sheet-panel { position: fixed; z-index: 21; left: 0; right: 0; bottom: 0; padding: 28rpx 28rpx calc(28rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: var(--life-surface); box-shadow: 0 -10rpx 40rpx var(--life-shadow); }
.sheet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; }
.sheet-title { font-size: 34rpx; font-weight: 700; color: var(--life-text); }
.sheet-close { width: 52rpx; height: 52rpx; border-radius: 50%; text-align: center; line-height: 46rpx; background: var(--life-surface-soft); color: var(--life-primary-deep); font-size: 38rpx; }
.sheet-food { margin-bottom: 18rpx; color: var(--life-primary-deep); font-size: 28rpx; font-weight: 600; }
.primary-button.disabled { opacity: .55; }
</style>
