<template>
  <view class="shopping-page">
    <PageNavbar title="待购买" />

    <view class="shopping-body">
      <view class="tabs">
        <view class="tab" :class="{ active: listType === 'short' }" @tap="switchTab('short')">短期</view>
        <view class="tab" :class="{ active: listType === 'long' }" @tap="switchTab('long')">长期</view>
      </view>

      <view class="toolbar">
        <view class="toolbar-tip">{{ listType === 'short' ? '勾选已购买，可清空已购' : '按住左侧 ≡ 拖动排序' }}</view>
        <view class="toolbar-actions">
          <view v-if="listType === 'short' && purchasedCount" class="clear-button" @tap="clearPurchased">清空已购</view>
          <view class="add-button" @tap="startCreate">+ 添加</view>
        </view>
      </view>

      <view v-if="loading" class="state-card">正在加载…</view>
      <view v-else-if="!items.length" class="state-card empty">{{ listType === 'short' ? '还没有短期待购，先加一件吧' : '还没有长期清单，记下常备物品' }}</view>
      <view v-else class="item-list" :class="{ dragging: dragIndex >= 0 }">
        <view
          v-for="(item, index) in items"
          :key="item.id"
          class="item-card"
          :class="{ purchased: item.purchased, dragging: dragIndex === index }"
          :style="dragIndex === index ? { transform: `translateY(${dragOffsetY}px)` } : ''"
        >
          <view
            v-if="listType === 'long'"
            class="drag-handle"
            @touchstart.stop.prevent="onDragStart($event, index)"
            @touchmove.stop.prevent="onDragMove"
            @touchend.stop.prevent="onDragEnd"
            @touchcancel.stop.prevent="onDragEnd"
          >≡</view>
          <view v-if="listType === 'short'" class="check" :class="{ on: item.purchased }" @tap="togglePurchased(item)">
            <view v-if="item.purchased" class="check-mark">✓</view>
          </view>
          <view class="item-main" @tap="startEdit(item)">
            <view class="item-name">{{ item.name }}</view>
          </view>
          <view class="item-actions">
            <view class="move-button" @tap="moveItem(item)">{{ listType === 'short' ? '转长期' : '转短期' }}</view>
            <view class="delete-button" @tap="removeItem(item)">删除</view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="editorVisible" class="editor-mask" @tap="closeEditor" />
    <view v-if="editorVisible" class="editor-panel">
      <view class="editor-header">
        <view class="editor-title">{{ editingId ? '编辑物品' : '添加物品' }}</view>
        <view class="close-button" @tap="closeEditor">×</view>
      </view>
      <input v-model="draftName" class="editor-name-input" placeholder="物品名称" maxlength="100" focus />
      <view class="save-button" :class="{ disabled: saving }" @tap="saveItem">{{ saving ? '保存中…' : '保存' }}</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import PageNavbar from '../../components/PageNavbar.vue'
import { backendApi } from '../../lib/api.js'

const listType = ref('short')
const items = ref([])
const loading = ref(false)
const saving = ref(false)
const editorVisible = ref(false)
const editingId = ref('')
const draftName = ref('')

const dragIndex = ref(-1)
const dragFromIndex = ref(-1)
const dragOffsetY = ref(0)
const dragStartY = ref(0)
const rowHeightPx = ref(64)
const reorderSaving = ref(false)

const purchasedCount = computed(() => items.value.filter((item) => item.purchased).length)

const loadItems = async () => {
  loading.value = true
  try {
    await backendApi.login()
    items.value = await backendApi.shoppingItems(listType.value)
  } catch (error) {
    uni.showToast({ title: error.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const switchTab = (type) => {
  if (listType.value === type) return
  listType.value = type
  dragIndex.value = -1
  loadItems()
}

const startCreate = () => {
  editingId.value = ''
  draftName.value = ''
  editorVisible.value = true
}

const startEdit = (item) => {
  if (dragIndex.value >= 0) return
  editingId.value = item.id
  draftName.value = item.name
  editorVisible.value = true
}

const closeEditor = () => {
  if (!saving.value) editorVisible.value = false
}

const saveItem = async () => {
  const name = draftName.value.trim()
  if (!name) {
    uni.showToast({ title: '请填写名称', icon: 'none' })
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await backendApi.updateShoppingItem(editingId.value, { name })
    } else {
      await backendApi.createShoppingItem({ name, listType: listType.value })
    }
    editorVisible.value = false
    await loadItems()
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const togglePurchased = async (item) => {
  try {
    const updated = await backendApi.updateShoppingItem(item.id, { purchased: !item.purchased })
    items.value = items.value
      .map((row) => (row.id === item.id ? updated : row))
      .sort((a, b) => Number(a.purchased) - Number(b.purchased) || new Date(b.updatedAt) - new Date(a.updatedAt))
  } catch (error) {
    uni.showToast({ title: error.message || '更新失败', icon: 'none' })
  }
}

const moveItem = async (item) => {
  const next = listType.value === 'short' ? 'long' : 'short'
  try {
    await backendApi.updateShoppingItem(item.id, { listType: next })
    items.value = items.value.filter((row) => row.id !== item.id)
    uni.showToast({ title: next === 'long' ? '已转到长期' : '已转到短期', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '移动失败', icon: 'none' })
  }
}

const clearPurchased = () => {
  uni.showModal({
    title: '清空已购',
    content: `确定删除 ${purchasedCount.value} 件已购买物品吗？`,
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await backendApi.clearPurchasedShoppingItems()
        await loadItems()
        uni.showToast({ title: '已清空', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error.message || '清空失败', icon: 'none' })
      }
    },
  })
}

const removeItem = (item) => {
  uni.showModal({
    title: '删除物品',
    content: `确定删除“${item.name}”吗？`,
    success: async ({ confirm }) => {
      if (!confirm) return
      try {
        await backendApi.deleteShoppingItem(item.id)
        items.value = items.value.filter((row) => row.id !== item.id)
        uni.showToast({ title: '已删除', icon: 'success' })
      } catch (error) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      }
    },
  })
}

const onDragStart = (event, index) => {
  if (listType.value !== 'long' || reorderSaving.value) return
  const touch = event.touches?.[0]
  if (!touch) return
  dragIndex.value = index
  dragFromIndex.value = index
  dragStartY.value = touch.clientY
  dragOffsetY.value = 0
  // 约等于一行卡片高度（含间距）
  try {
    const sys = uni.getSystemInfoSync()
    rowHeightPx.value = Math.round((sys.windowWidth || 375) / 750 * 112)
  } catch {
    rowHeightPx.value = 56
  }
}

const onDragMove = (event) => {
  if (dragIndex.value < 0) return
  const touch = event.touches?.[0]
  if (!touch) return
  const rawDelta = touch.clientY - dragStartY.value
  const moveRows = Math.round(rawDelta / rowHeightPx.value)
  const target = Math.max(0, Math.min(items.value.length - 1, dragFromIndex.value + moveRows))
  // 补偿 DOM 重排位移：拖动项已从 dragFromIndex 移到 dragIndex，需扣除该位移让卡片跟随手指
  dragOffsetY.value = rawDelta - (dragIndex.value - dragFromIndex.value) * rowHeightPx.value
  if (target === dragIndex.value) return
  const next = items.value.slice()
  const [row] = next.splice(dragIndex.value, 1)
  next.splice(target, 0, row)
  items.value = next
  dragIndex.value = target
  dragOffsetY.value = rawDelta - (target - dragFromIndex.value) * rowHeightPx.value
}

const onDragEnd = async () => {
  if (dragIndex.value < 0) return
  dragIndex.value = -1
  dragFromIndex.value = -1
  dragOffsetY.value = 0
  if (listType.value !== 'long' || reorderSaving.value) return
  reorderSaving.value = true
  try {
    await backendApi.reorderShoppingItems({
      listType: 'long',
      orderedIds: items.value.map((item) => item.id),
    })
  } catch (error) {
    uni.showToast({ title: error.message || '排序保存失败', icon: 'none' })
    await loadItems()
  } finally {
    reorderSaving.value = false
  }
}

onShow(loadItems)
</script>

<style scoped>
.shopping-page { min-height: 100vh; max-width: 860px; margin: 0 auto; box-sizing: border-box; background: var(--life-bg); }
.shopping-body { padding: 30rpx 28rpx 60rpx; }
.tabs { display: flex; gap: 12rpx; margin-bottom: 24rpx; padding: 8rpx; border-radius: 20rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.tab { flex: 1; padding: 18rpx 0; border-radius: 14rpx; text-align: center; font-size: 28rpx; color: var(--life-muted); }
.tab.active { background: var(--life-primary); color: #fff; font-weight: 700; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-bottom: 24rpx; }
.toolbar-tip { flex: 1; font-size: 24rpx; color: var(--life-muted); }
.toolbar-actions { display: flex; align-items: center; gap: 12rpx; flex: none; }
.clear-button { padding: 16rpx 18rpx; border-radius: 18rpx; background: var(--life-surface-soft); color: var(--life-primary-deep); font-size: 24rpx; }
.add-button { padding: 16rpx 22rpx; border-radius: 18rpx; background: var(--life-primary); color: #fff; font-size: 26rpx; }
.state-card { padding: 80rpx 28rpx; border-radius: 24rpx; text-align: center; background: var(--life-surface); color: var(--life-muted); font-size: 28rpx; box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.item-list.dragging { user-select: none; }
.item-card { display: flex; align-items: center; gap: 16rpx; padding: 24rpx 22rpx; margin-bottom: 16rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); transition: box-shadow .15s ease; }
.item-card.dragging { z-index: 5; box-shadow: 0 12rpx 28rpx var(--life-shadow); background: #fff; }
.item-card.purchased .item-name { color: var(--life-muted); text-decoration: line-through; }
.drag-handle { flex: none; width: 48rpx; height: 48rpx; border-radius: 12rpx; text-align: center; line-height: 44rpx; background: var(--life-surface-soft); color: var(--life-muted); font-size: 30rpx; font-weight: 700; }
.check { flex: none; width: 44rpx; height: 44rpx; border-radius: 12rpx; border: 2rpx solid var(--life-primary); box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
.check.on { background: var(--life-primary); }
.check-mark { color: #fff; font-size: 26rpx; line-height: 1; }
.item-main { flex: 1; min-width: 0; }
.item-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 32rpx; font-weight: 600; color: var(--life-text); }
.item-actions { display: flex; align-items: center; gap: 8rpx; flex: none; }
.move-button { padding: 10rpx 12rpx; color: var(--life-primary-deep); font-size: 22rpx; }
.delete-button { padding: 10rpx 12rpx; color: #b97970; font-size: 22rpx; }
.editor-mask { position: fixed; inset: 0; z-index: 20; background: rgba(36, 49, 31, .28); }
.editor-panel { position: fixed; z-index: 21; left: 0; right: 0; bottom: 0; padding: 28rpx 28rpx calc(28rpx + env(safe-area-inset-bottom)); border-radius: 28rpx 28rpx 0 0; background: var(--life-surface); box-shadow: 0 -10rpx 40rpx var(--life-shadow); }
.editor-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24rpx; }
.editor-title { font-size: 34rpx; font-weight: 700; color: var(--life-text); }
.close-button { width: 52rpx; height: 52rpx; border-radius: 50%; text-align: center; line-height: 46rpx; background: var(--life-surface-soft); color: var(--life-primary-deep); font-size: 38rpx; }
.editor-name-input { box-sizing: border-box; width: 100%; height: 78rpx; padding: 0 20rpx; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 29rpx; }
.save-button { margin-top: 22rpx; padding: 22rpx; border-radius: 18rpx; text-align: center; background: var(--life-primary); color: #fff; font-size: 29rpx; }
.save-button.disabled { opacity: .55; }
</style>
