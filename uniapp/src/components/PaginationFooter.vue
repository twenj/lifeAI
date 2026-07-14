<template>
  <view v-if="hasMore || loading" class="pagination-footer" @tap="!loading && $emit('load-more')">
    <view class="pagination-button">{{ loading ? '加载中…' : '加载更多' }}</view>
  </view>
</template>

<script setup>
defineProps({ hasMore: Boolean, loading: Boolean })
defineEmits(['load-more'])
</script>

<style scoped>
.pagination-footer { padding: 18rpx 0 8rpx; text-align: center; }
.pagination-button { display: inline-block; padding: 14rpx 30rpx; border-radius: 999rpx; background: var(--life-surface-soft); color: var(--life-primary-deep); font-size: 25rpx; }
</style>
