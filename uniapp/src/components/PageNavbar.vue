<template>
  <view class="page-navbar">
    <view class="page-navbar-inner">
      <view class="nav-left">
        <view class="nav-button" @tap="goBack" aria-label="返回">
          <view class="nav-icon icon-back" />
        </view>
        <view class="nav-button" @tap="goHome" aria-label="主页">
          <view class="nav-icon icon-home" />
        </view>
      </view>
      <view class="nav-title">{{ title }}</view>
      <view class="nav-right" />
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
})

const goBack = () => {
  uni.navigateBack({
    fail: () => {
      uni.reLaunch({ url: '/pages/index/index' })
    },
  })
}

const goHome = () => {
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style scoped>
.page-navbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--life-surface);
  border-bottom: 1rpx solid var(--life-border);
  padding-top: env(safe-area-inset-top);
}
.page-navbar-inner {
  height: 88rpx;
  padding: 0 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}
.nav-left,
.nav-right {
  width: 160rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.nav-right {
  justify-content: flex-end;
}
.nav-title {
  flex: 1;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--life-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nav-button {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-icon {
  width: 36rpx;
  height: 36rpx;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}
.icon-back {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23567a38' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 6l-6 6 6 6'/%3E%3C/svg%3E");
}
.icon-home {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23567a38' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z'/%3E%3C/svg%3E");
}
</style>
