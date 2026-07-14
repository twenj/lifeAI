<template>
  <view class="page">
    <PageNavbar title="食物库" />
    <view class="body">
      <view class="hint">聊天里发营养成分表图片，并在文字中带上「食物」（如「每日坚果 食物」），识别成功后会自动保存。也可搜索后一键加入今日饮食。</view>

      <view class="search-bar">
        <input v-model="keyword" class="search-input" placeholder="搜索食物名称" confirm-type="search" />
        <view v-if="keyword" class="search-clear" @tap="keyword = ''">清除</view>
      </view>

      <view class="form-card">
        <view class="form-title">{{ editingId ? '编辑食物' : '手动新增食物' }}</view>
        <view v-if="!editingId" class="form-hint">手动新增只需填名称等基础信息；完整营养可在聊天识图入库后再编辑。</view>
        <input v-model="draft.name" class="input" placeholder="食品名称" maxlength="200" />
        <input v-model="draft.servingSizeG" class="input" type="digit" placeholder="每份重量（g，可选）" />
        <input v-model="draft.calories" class="input" type="digit" placeholder="热量 kcal / 100g（可选）" />
        <template v-if="editingId">
          <view class="form-section">每 100g 营养（完整）</view>
          <view class="row">
            <input v-model="draft.proteinG" class="input half" type="digit" placeholder="蛋白质 g" />
            <input v-model="draft.fatG" class="input half" type="digit" placeholder="脂肪 g" />
          </view>
          <view class="row">
            <input v-model="draft.carbsG" class="input half" type="digit" placeholder="碳水 g" />
            <input v-model="draft.sugarG" class="input half" type="digit" placeholder="糖 g" />
          </view>
          <view class="row">
            <input v-model="draft.fiberG" class="input half" type="digit" placeholder="膳食纤维 g" />
            <input v-model="draft.sodiumMg" class="input half" type="digit" placeholder="钠 mg" />
          </view>
        </template>
        <view class="row buttons">
          <view class="primary-button" @tap="save">{{ editingId ? '保存修改' : '新增食物' }}</view>
          <view v-if="editingId" class="secondary-button" @tap="reset">取消编辑</view>
        </view>
      </view>

      <view v-if="!filteredItems.length" class="empty">{{ items.length ? '没有匹配的食物' : '还没有食物，去聊天里识别一张营养成分表吧' }}</view>
      <view v-for="item in filteredItems" :key="item.id" class="food-card">
        <view class="food-head">
          <view class="food-name">{{ item.name }}</view>
          <view class="card-actions">
            <view class="add-diet" @tap="openDietSheet(item)">加入饮食</view>
            <view class="edit" @tap="edit(item)">编辑</view>
            <view class="delete" @tap="remove(item)">删除</view>
          </view>
        </view>
        <view class="nutrition-grid">
          <view class="nutrition"><text class="value">{{ display(item.caloriesPer100g) }}</text><text class="label">kcal</text></view>
          <view class="nutrition"><text class="value">{{ display(item.proteinGPer100g) }}</text><text class="label">蛋白质 g</text></view>
          <view class="nutrition"><text class="value">{{ display(item.fatGPer100g) }}</text><text class="label">脂肪 g</text></view>
          <view class="nutrition"><text class="value">{{ display(item.carbsGPer100g) }}</text><text class="label">碳水 g</text></view>
          <view class="nutrition"><text class="value">{{ display(item.sugarGPer100g) }}</text><text class="label">糖 g</text></view>
          <view class="nutrition"><text class="value">{{ display(item.fiberGPer100g) }}</text><text class="label">纤维 g</text></view>
          <view class="nutrition"><text class="value">{{ display(item.sodiumMgPer100g) }}</text><text class="label">钠 mg</text></view>
        </view>
        <view v-if="item.servingSizeG" class="source">包装标注每份 {{ item.servingSizeG }}g</view>
      </view>
      <PaginationFooter :has-more="hasMore && !keyword.trim()" :loading="loadingMore" @load-more="loadMore" />
    </view>

    <view v-if="dietVisible" class="sheet-mask" @tap="closeDietSheet" />
    <view v-if="dietVisible" class="sheet-panel">
      <view class="sheet-header">
        <view class="sheet-title">加入今日饮食</view>
        <view class="sheet-close" @tap="closeDietSheet">×</view>
      </view>
      <view class="sheet-food">{{ dietTarget?.name }}</view>
      <input v-model="dietAmountG" class="input" type="digit" placeholder="食用重量（g）" focus />
      <view v-if="dietEstimate" class="estimate">{{ dietEstimate }}</view>
      <view class="primary-button" :class="{ disabled: dietSaving }" @tap="confirmAddDiet">{{ dietSaving ? '加入中…' : '确认加入' }}</view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import PageNavbar from '../../components/PageNavbar.vue'
import PaginationFooter from '../../components/PaginationFooter.vue'
import { backendApi } from '../../lib/api.js'

const items = ref([])
const page = ref(1)
const hasMore = ref(false)
const loadingMore = ref(false)
const keyword = ref('')
const editingId = ref('')
const emptyDraft = () => ({
  name: '',
  servingSizeG: '',
  calories: '',
  proteinG: '',
  fatG: '',
  carbsG: '',
  sugarG: '',
  fiberG: '',
  sodiumMg: '',
})
const draft = reactive(emptyDraft())

const dietVisible = ref(false)
const dietTarget = ref(null)
const dietAmountG = ref('')
const dietSaving = ref(false)

const display = (value) => (value == null ? '--' : Number(value).toFixed(1))
const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const filteredItems = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((item) => String(item.name || '').toLowerCase().includes(q))
})

const dietEstimate = computed(() => {
  const amount = Number(dietAmountG.value)
  const food = dietTarget.value
  if (!food || !(amount > 0)) return ''
  const ratio = amount / 100
  const parts = []
  if (food.caloriesPer100g != null) parts.push(`${(food.caloriesPer100g * ratio).toFixed(1)} kcal`)
  if (food.proteinGPer100g != null) parts.push(`蛋白质 ${(food.proteinGPer100g * ratio).toFixed(1)}g`)
  return parts.length ? `按 ${amount}g 估算：${parts.join(' · ')}` : ''
})

const load = async () => {
  await backendApi.login()
  page.value = 1
  const result = await backendApi.foodItems(page.value)
  items.value = result.items
  hasMore.value = result.hasMore
}
const loadMore = async () => { if (!hasMore.value || loadingMore.value || keyword.value.trim()) return; loadingMore.value = true; page.value += 1; try { const result = await backendApi.foodItems(page.value); items.value = [...items.value, ...result.items]; hasMore.value = result.hasMore } catch (error) { page.value -= 1; uni.showToast({ title: error.message || '加载失败', icon: 'none' }) } finally { loadingMore.value = false } }

const numberOrNull = (value) => (value === '' || value == null ? null : Number(value))
const reset = () => {
  Object.assign(draft, emptyDraft())
  editingId.value = ''
}

const edit = (item) => {
  editingId.value = item.id
  Object.assign(draft, {
    name: item.name || '',
    servingSizeG: item.servingSizeG ?? '',
    calories: item.caloriesPer100g ?? '',
    proteinG: item.proteinGPer100g ?? '',
    fatG: item.fatGPer100g ?? '',
    carbsG: item.carbsGPer100g ?? '',
    sugarG: item.sugarGPer100g ?? '',
    fiberG: item.fiberGPer100g ?? '',
    sodiumMg: item.sodiumMgPer100g ?? '',
  })
  uni.pageScrollTo({ scrollTop: 0, duration: 200 })
}

const save = async () => {
  if (!draft.name.trim()) return uni.showToast({ title: '请输入食品名称', icon: 'none' })
  const calories = numberOrNull(draft.calories)
  try {
    if (editingId.value) {
      // 编辑：完整营养字段（与聊天识图一致）
      await backendApi.updateFoodItem(editingId.value, {
        name: draft.name.trim(),
        servingSizeG: numberOrNull(draft.servingSizeG),
        caloriesPer100g: calories,
        proteinGPer100g: numberOrNull(draft.proteinG),
        fatGPer100g: numberOrNull(draft.fatG),
        carbsGPer100g: numberOrNull(draft.carbsG),
        sugarGPer100g: numberOrNull(draft.sugarG),
        fiberGPer100g: numberOrNull(draft.fiberG),
        sodiumMgPer100g: numberOrNull(draft.sodiumMg),
      })
    } else {
      // 手动新增：精简版，只提交名称/份量/热量
      const result = await backendApi.createFoodItem({
        name: draft.name.trim(),
        servingSizeG: numberOrNull(draft.servingSizeG),
        nutritionPer100g: { calories },
      })
      if (result.alreadyExists) {
        uni.showToast({ title: '该食物已在库中', icon: 'none' })
        return
      }
    }
    reset()
    await load()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  }
}

const remove = (item) => {
  uni.showModal({
    title: '删除食物',
    content: `确定删除「${item.name}」吗？`,
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await backendApi.deleteFoodItem(item.id)
        items.value = items.value.filter((row) => row.id !== item.id)
        if (editingId.value === item.id) reset()
      } catch (error) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      }
    },
  })
}

const openDietSheet = (item) => {
  dietTarget.value = item
  dietAmountG.value = item.servingSizeG ? String(item.servingSizeG) : ''
  dietVisible.value = true
}

const closeDietSheet = () => {
  if (dietSaving.value) return
  dietVisible.value = false
  dietTarget.value = null
  dietAmountG.value = ''
}

const confirmAddDiet = async () => {
  const amount = Number(dietAmountG.value)
  if (!(amount > 0)) {
    uni.showToast({ title: '请输入食用重量', icon: 'none' })
    return
  }
  const food = dietTarget.value
  if (!food) return
  dietSaving.value = true
  try {
    await backendApi.createFood({
      date: today(),
      description: food.name,
      foodItemId: food.id,
      amountG: amount,
    })
    dietVisible.value = false
    dietTarget.value = null
    dietAmountG.value = ''
    uni.showToast({ title: '已加入今日饮食', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '加入失败', icon: 'none' })
  } finally {
    dietSaving.value = false
  }
}

onMounted(() => load().catch((error) => uni.showToast({ title: error.message || '加载失败', icon: 'none' })))
</script>

<style scoped>
.page { min-height: 100vh; background: var(--life-bg); }
.body { padding: 30rpx 28rpx 60rpx; }
.hint { margin-bottom: 24rpx; padding: 22rpx; border-radius: 18rpx; background: var(--life-primary-soft); color: var(--life-primary-deep); font-size: 25rpx; line-height: 1.5; }
.search-bar { display: flex; align-items: center; gap: 12rpx; margin-bottom: 20rpx; padding: 10rpx 10rpx 10rpx 20rpx; border-radius: 18rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.search-input { flex: 1; min-height: 64rpx; font-size: 28rpx; color: var(--life-text); }
.search-clear { flex: none; padding: 12rpx 18rpx; color: var(--life-muted); font-size: 24rpx; }
.form-card { margin-bottom: 26rpx; padding: 26rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.form-title { margin-bottom: 12rpx; color: var(--life-text); font-size: 32rpx; font-weight: 700; }
.form-hint { margin-bottom: 16rpx; color: var(--life-muted); font-size: 23rpx; line-height: 1.45; }
.form-section { margin: 8rpx 0 12rpx; color: var(--life-primary-deep); font-size: 25rpx; font-weight: 600; }
.input { box-sizing: border-box; width: 100%; min-height: 76rpx; margin-bottom: 14rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 27rpx; }
.input.half { flex: 1; min-width: 0; }
.row { display: flex; gap: 14rpx; }
.buttons { align-items: center; }
.primary-button, .secondary-button { flex: 1; padding: 20rpx 10rpx; border-radius: 16rpx; text-align: center; font-size: 27rpx; }
.primary-button { background: var(--life-primary); color: #fff; }
.primary-button.disabled { opacity: .55; }
.secondary-button { background: var(--life-surface-soft); color: var(--life-muted); }
.empty { padding: 90rpx 30rpx; text-align: center; color: var(--life-muted); font-size: 27rpx; line-height: 1.6; }
.food-card { margin-bottom: 18rpx; padding: 26rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.food-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12rpx; margin-bottom: 22rpx; }
.food-name { flex: 1; min-width: 0; font-size: 32rpx; font-weight: 700; color: var(--life-text); }
.card-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 14rpx; flex: none; }
.add-diet, .edit, .delete { font-size: 24rpx; }
.add-diet { color: var(--life-primary); font-weight: 600; }
.edit { color: var(--life-primary-deep); }
.delete { color: #b97970; }
.source { margin-top: 18rpx; color: var(--life-muted); font-size: 23rpx; }
.nutrition-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14rpx; }
.nutrition { padding: 16rpx 8rpx; border-radius: 14rpx; text-align: center; background: var(--life-surface-soft); }
.value { display: block; color: var(--life-text); font-size: 28rpx; font-weight: 700; }
.label { display: block; margin-top: 6rpx; color: var(--life-muted); font-size: 21rpx; }
.sheet-mask { position: fixed; inset: 0; z-index: 20; background: rgba(36, 49, 31, .28); }
.sheet-panel { position: fixed; z-index: 21; left: 0; right: 0; bottom: 0; padding: 28rpx 28rpx calc(28rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: var(--life-surface); box-shadow: 0 -10rpx 40rpx var(--life-shadow); }
.sheet-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18rpx; }
.sheet-title { font-size: 34rpx; font-weight: 700; color: var(--life-text); }
.sheet-close { width: 52rpx; height: 52rpx; border-radius: 50%; text-align: center; line-height: 46rpx; background: var(--life-surface-soft); color: var(--life-primary-deep); font-size: 38rpx; }
.sheet-food { margin-bottom: 18rpx; color: var(--life-primary-deep); font-size: 28rpx; font-weight: 600; }
.estimate { margin: -4rpx 0 18rpx; color: var(--life-muted); font-size: 24rpx; }
</style>
