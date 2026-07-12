<template>
  <view class="placeholder-page">
    <PageNavbar title="减脂" />
    <view class="placeholder-body">
      <view class="placeholder-card">
        <view class="placeholder-badge fatloss">减脂</view>
        <view class="placeholder-title">模块建设中</view>
        <view class="placeholder-text">这里稍后会支持体重记录、饮食追踪等功能。当前仅为入口占位页。</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import PageNavbar from '../../components/PageNavbar.vue'
</script>

<style scoped>
.placeholder-page {
  min-height: 100vh;
  max-width: 860px;
  margin: 0 auto;
  box-sizing: border-box;
  background: var(--life-bg);
}
.placeholder-body {
  padding: 36rpx 28rpx;
}
.placeholder-card {
  padding: 48rpx 36rpx;
  border-radius: 24rpx;
  background: var(--life-surface);
  box-shadow: 0 4rpx 14rpx var(--life-shadow);
}
.placeholder-badge {
  display: inline-flex;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 600;
}
.placeholder-badge.fatloss {
  color: var(--life-primary);
  background: #eef6df;
}
.placeholder-title {
  margin-top: 28rpx;
  font-size: 36rpx;
  font-weight: 700;
  color: var(--life-text);
}
.placeholder-text {
  margin-top: 16rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: var(--life-muted);
}
</style>
