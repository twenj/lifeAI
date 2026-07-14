<template>
  <view class="page">
    <PageNavbar title="日记" />
    <view class="body">
      <view class="hint">日记每天 00:00 根据前一天的聊天和模块记录自动生成，只能编辑，不能手动新增或删除。</view>
      <view v-if="!items.length" class="empty">还没有自动生成的日记</view>
      <view v-for="item in items" :key="item.id" class="journal-card">
        <view v-if="editingId !== item.id">
          <view class="journal-head"><view class="journal-title">{{ item.title }}</view><view class="edit" @tap="startEdit(item)">编辑</view></view>
          <view class="journal-content">{{ item.content }}</view>
          <view class="journal-date">生成于 {{ formatDate(item.createdAt) }}</view>
        </view>
        <view v-else>
          <input v-model="editDraft.title" class="input" placeholder="日记标题" maxlength="120" />
          <textarea v-model="editDraft.content" class="textarea" maxlength="100000" auto-height />
          <view class="row"><view class="primary-button" @tap="save(item)">保存修改</view><view class="secondary-button" @tap="cancel">取消</view></view>
        </view>
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

const items = ref([])
const page = ref(1)
const hasMore = ref(false)
const loadingMore = ref(false)
const editingId = ref('')
const editDraft = reactive({ title: '', content: '' })
const formatDate = (value) => new Date(value).toLocaleString('zh-CN')
const load = async () => { await backendApi.login(); page.value = 1; const result = await backendApi.journals(page.value); items.value = result.items; hasMore.value = result.hasMore }
const loadMore = async () => { if (!hasMore.value || loadingMore.value) return; loadingMore.value = true; page.value += 1; try { const result = await backendApi.journals(page.value); items.value = [...items.value, ...result.items]; hasMore.value = result.hasMore } catch (error) { page.value -= 1; uni.showToast({ title: error.message || '加载失败', icon: 'none' }) } finally { loadingMore.value = false } }
const startEdit = (item) => { editingId.value = item.id; editDraft.title = item.title; editDraft.content = item.content }
const cancel = () => { editingId.value = ''; editDraft.title = ''; editDraft.content = '' }
const save = async (item) => {
  if (!editDraft.title.trim() || !editDraft.content.trim()) return uni.showToast({ title: '标题和内容不能为空', icon: 'none' })
  try { const updated = await backendApi.updateJournal(item.id, { title: editDraft.title.trim(), content: editDraft.content.trim() }); Object.assign(item, updated); cancel(); uni.showToast({ title: '保存成功', icon: 'success' }) } catch (error) { uni.showToast({ title: error.message || '保存失败', icon: 'none' }) }
}
onMounted(() => load().catch((error) => uni.showToast({ title: error.message || '加载失败', icon: 'none' })))
</script>

<style scoped>
.page { min-height: 100vh; background: var(--life-bg); }
.body { padding: 30rpx 28rpx 60rpx; }
.hint { margin-bottom: 24rpx; padding: 22rpx; border-radius: 18rpx; background: #f2e8e0; color: #825b43; font-size: 25rpx; line-height: 1.5; }
.empty { padding: 90rpx 30rpx; text-align: center; color: var(--life-muted); font-size: 27rpx; }
.journal-card { margin-bottom: 18rpx; padding: 28rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.journal-head { display: flex; align-items: center; justify-content: space-between; }
.journal-title { color: var(--life-text); font-size: 32rpx; font-weight: 700; }
.edit { color: var(--life-primary-deep); font-size: 25rpx; }
.journal-content { margin-top: 20rpx; color: var(--life-text); font-size: 29rpx; line-height: 1.75; white-space: pre-wrap; }
.journal-date { margin-top: 18rpx; color: var(--life-muted); font-size: 23rpx; }
.input, .textarea { box-sizing: border-box; width: 100%; margin-bottom: 16rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 28rpx; }
.input { min-height: 76rpx; }
.textarea { min-height: 300rpx; line-height: 1.6; }
.row { display: flex; gap: 16rpx; }
.primary-button, .secondary-button { flex: 1; padding: 20rpx; border-radius: 16rpx; text-align: center; font-size: 27rpx; }
.primary-button { background: var(--life-primary); color: #fff; }
.secondary-button { background: var(--life-surface-soft); color: var(--life-muted); }
</style>
