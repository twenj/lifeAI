<template>
  <view class="page">
    <PageNavbar title="数据共享" />
    <view class="body">
      <view class="hint">本机生成共享码后，在另一台设备扫码或输入同一个共享码，就能使用同一份聊天和模块数据。</view>
      <view class="card">
        <view class="title">我的共享码</view>
        <view v-if="shareCode" class="code">{{ shareCode }}</view>
        <view v-else class="empty-code">还没有生成共享码</view>
        <image v-if="qrDataUrl" class="qr-code" :src="qrDataUrl" mode="widthFix" />
        <view v-if="shareCode" class="tip">请用另一台设备扫上面的码，不要扫自己屏幕</view>
        <view class="primary-button" @tap="generate">{{ shareCode ? '复制共享码' : '生成共享码' }}</view>
      </view>
      <view class="card">
        <view class="title">加入共享数据</view>
        <view class="warning">加入后，本设备会切换到共享账号；本设备当前的匿名数据不会自动合并。</view>
        <!-- #ifdef MP-WEIXIN || APP-PLUS -->
        <view class="scan-button" @tap="scan">扫码加入共享</view>
        <!-- #endif -->
        <!-- #ifdef H5 -->
        <view class="tip">网页端暂不支持扫码，请直接输入 8 位共享码</view>
        <!-- #endif -->
        <input v-model="joinCode" class="input" maxlength="8" placeholder="输入 8 位共享码" @input="joinCode = $event.detail.value.toUpperCase()" />
        <view class="primary-button" @tap="join">加入共享</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import QRCode from '../../lib/qrcode.js'
import PageNavbar from '../../components/PageNavbar.vue'
import { backendApi } from '../../lib/api.js'

const shareCode = ref('')
const joinCode = ref('')
const qrDataUrl = ref('')

const parseShareCode = (raw) => {
  const text = String(raw || '').trim()
  const fromScheme = text.match(/lifeai-share:\/\/([A-Za-z0-9]{8})/i)
  if (fromScheme) return fromScheme[1].toUpperCase()
  const plain = text.toUpperCase().match(/^[A-Z0-9]{8}$/)
  return plain ? plain[0] : ''
}

const makeQr = async (code) => {
  const svg = await QRCode.toString(`lifeai-share://${code}`, { type: 'svg', width: 8, margin: 2, errorCorrectionLevel: 'M' })
  qrDataUrl.value = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const generate = async () => {
  try {
    const result = await backendApi.shareCode()
    shareCode.value = result.shareCode
    await makeQr(result.shareCode)
    uni.setClipboardData({ data: result.shareCode })
    uni.showToast({ title: '共享码已复制', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error.message || '生成失败', icon: 'none' })
  }
}

const scan = () => {
  // #ifdef H5
  uni.showToast({ title: '网页端请手动输入共享码', icon: 'none' })
  return
  // #endif
  if (typeof uni.scanCode !== 'function') {
    uni.showToast({ title: '当前环境不支持扫码，请手动输入', icon: 'none' })
    return
  }
  uni.scanCode({
    onlyFromCamera: false,
    scanType: ['qrCode'],
    success: async (result) => {
      const code = parseShareCode(result.result)
      if (!code) {
        uni.showToast({ title: '二维码不是拾光AI共享码', icon: 'none' })
        return
      }
      joinCode.value = code
      await join()
    },
    fail: (error) => {
      const msg = String(error?.errMsg || '')
      if (/cancel|取消/i.test(msg)) return
      uni.showToast({ title: '扫码失败，请手动输入共享码', icon: 'none' })
    },
  })
}

const join = () => uni.showModal({
  title: '加入共享数据',
  content: '加入后会切换到共享账号，本设备当前的匿名数据不会自动合并，确定继续吗？',
  success: async ({ confirm }) => {
    if (!confirm) return
    const code = joinCode.value.trim().toUpperCase()
    if (!/^[A-Z0-9]{8}$/.test(code)) {
      uni.showToast({ title: '请输入 8 位共享码', icon: 'none' })
      return
    }
    try {
      await backendApi.joinShareCode(code)
      uni.showToast({ title: '加入成功', icon: 'success' })
      setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 500)
    } catch (error) {
      uni.showToast({ title: error.message || '加入失败', icon: 'none' })
    }
  },
})

onMounted(async () => {
  try {
    await backendApi.login()
    const result = await backendApi.shareCode()
    shareCode.value = result.shareCode
    await makeQr(result.shareCode)
  } catch (error) {
    uni.showToast({ title: error.message || '登录失败', icon: 'none' })
  }
})
</script>

<style scoped>
.page { min-height: 100vh; background: var(--life-bg); }
.body { padding: 30rpx 28rpx 60rpx; }
.hint, .warning, .tip { padding: 22rpx; border-radius: 18rpx; font-size: 25rpx; line-height: 1.5; }
.hint { margin-bottom: 24rpx; background: #e6eef4; color: #506f88; }
.tip { margin: 0 0 20rpx; background: var(--life-surface-soft); color: var(--life-muted); text-align: center; }
.card { margin-bottom: 20rpx; padding: 28rpx; border-radius: 22rpx; background: var(--life-surface); box-shadow: 0 4rpx 14rpx var(--life-shadow); }
.title { color: var(--life-text); font-size: 32rpx; font-weight: 700; }
.code { margin: 26rpx 0 16rpx; color: var(--life-primary-deep); font-size: 54rpx; font-weight: 800; letter-spacing: 8rpx; text-align: center; }
.qr-code { display: block; width: 420rpx; margin: 0 auto 16rpx; border-radius: 12rpx; }
.empty-code { margin: 26rpx 0; color: var(--life-muted); font-size: 27rpx; text-align: center; }
.warning { margin: 20rpx 0; background: #fff5df; color: #956f38; }
.input { box-sizing: border-box; width: 100%; min-height: 78rpx; margin-bottom: 18rpx; padding: 18rpx 20rpx; border-radius: 16rpx; background: var(--life-surface-soft); color: var(--life-text); font-size: 30rpx; letter-spacing: 4rpx; }
.scan-button { margin: 20rpx 0; padding: 18rpx; border: 1rpx solid var(--life-primary); border-radius: 16rpx; color: var(--life-primary-deep); font-size: 27rpx; text-align: center; }
.primary-button { padding: 20rpx; border-radius: 16rpx; background: var(--life-primary); color: #fff; font-size: 28rpx; text-align: center; }
</style>
