<template>
  <view class="modules-page">
    <PageNavbar title="我的生活" />
    <view class="modules-body">
      <view class="modules-intro">选择一个生活模块开始使用</view>
      <view v-for="group in moduleGroups" :key="group.id" class="module-group">
        <view class="group-title">{{ group.title }}</view>
        <view class="modules-grid">
          <view
            v-for="item in group.items"
            :key="item.id"
            class="module-card"
            @tap="openModule(item.path)"
          >
            <view class="module-icon" :class="item.iconClass" />
            <view class="module-name">{{ item.name }}</view>
            <view class="module-desc">{{ item.desc }}</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import PageNavbar from '../../components/PageNavbar.vue'

const moduleGroups = [
  {
    id: 'health',
    title: '健康',
    items: [
      {
        id: 'weight',
        name: '体重记录',
        desc: '记录体重变化趋势',
        path: '/pages/modules/weight',
        iconClass: 'icon-weight',
      },
      {
        id: 'diet',
        name: '饮食记录',
        desc: '记录每日饮食摄入',
        path: '/pages/modules/diet',
        iconClass: 'icon-diet',
      },
      {
        id: 'food',
        name: '食物库',
        desc: '管理食品营养成分',
        path: '/pages/modules/food',
        iconClass: 'icon-food',
      },
    ],
  },
  {
    id: 'daily',
    title: '日常',
    items: [
      {
        id: 'notepad',
        name: '记事本',
        desc: '记录想法与待办',
        path: '/pages/modules/notepad',
        iconClass: 'icon-notepad',
      },
      {
        id: 'schedule',
        name: '日程',
        desc: '安排生活与工作计划',
        path: '/pages/modules/schedule',
        iconClass: 'icon-schedule',
      },
      {
        id: 'journal',
        name: '日记',
        desc: '回顾每天的生活轨迹',
        path: '/pages/modules/journal',
        iconClass: 'icon-journal',
      },
    ],
  },
  {
    id: 'finance',
    title: '消费',
    items: [
      {
        id: 'ledger',
        name: '记账',
        desc: '记录收入与日常支出',
        path: '/pages/modules/ledger',
        iconClass: 'icon-ledger',
      },
      {
        id: 'shopping',
        name: '待购买',
        desc: '短期清单与长期常备',
        path: '/pages/modules/shopping',
        iconClass: 'icon-shopping',
      },
    ],
  },
  {
    id: 'settings',
    title: '设置',
    items: [
      {
        id: 'share',
        name: '数据共享',
        desc: '让手机和电脑使用同一份数据',
        path: '/pages/modules/share',
        iconClass: 'icon-share',
      },
    ],
  },
]

const openModule = (path) => {
  uni.navigateTo({ url: path })
}
</script>

<style scoped>
.modules-page {
  min-height: 100vh;
  max-width: 860px;
  margin: 0 auto;
  box-sizing: border-box;
  background: var(--life-bg);
}
.modules-body {
  padding: 36rpx 28rpx 48rpx;
}
.modules-intro {
  margin-bottom: 12rpx;
  font-size: 26rpx;
  color: var(--life-muted);
}
.module-group {
  margin-top: 28rpx;
}
.group-title {
  margin-bottom: 16rpx;
  padding-left: 4rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: var(--life-primary-deep);
}
.modules-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}
.module-card {
  padding: 32rpx 28rpx;
  border-radius: 24rpx;
  background: var(--life-surface);
  box-shadow: 0 4rpx 14rpx var(--life-shadow);
}
.module-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  margin-bottom: 20rpx;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 34rpx 34rpx;
}
.icon-notepad {
  background-color: var(--life-primary-soft);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23567a38' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2z'/%3E%3C/svg%3E");
}
.icon-fatloss {
  background-color: #eef6df;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236f9b4a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 21c4-3.5 7-6.8 7-11a7 7 0 1 0-14 0c0 4.2 3 7.5 7 11z'/%3E%3Ccircle cx='12' cy='10' r='2.2'/%3E%3C/svg%3E");
}
.icon-weight {
  background-color: #eef6df;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236f9b4a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 19h16'/%3E%3Cpath d='M6 16V9'/%3E%3Cpath d='M12 16V5'/%3E%3Cpath d='M18 16v-3'/%3E%3C/svg%3E");
}
.icon-diet {
  background-color: #f3f0dc;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b8a4f' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 3v8a4 4 0 0 0 8 0V3'/%3E%3Cpath d='M8 3v18'/%3E%3Cpath d='M16 3v18'/%3E%3Cpath d='M20 3v18'/%3E%3Cpath d='M16 9h4'/%3E%3C/svg%3E");
}
.icon-ledger {
  background-color: #f5ead4;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23aa7b3b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='4' y='3' width='16' height='18' rx='2'/%3E%3Cpath d='M8 7h8'/%3E%3Cpath d='M8 11h2'/%3E%3Cpath d='M14 11h2'/%3E%3Cpath d='M8 15h2'/%3E%3Cpath d='M14 15h2'/%3E%3C/svg%3E");
}
.icon-food {
  background-color: #e8f1e4;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23567a38' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 3v18'/%3E%3Cpath d='M6 3c0 4 2 5 2 8s-2 4-2 4'/%3E%3Cpath d='M18 3v18'/%3E%3Cpath d='M14 3v5a4 4 0 0 0 8 0V3'/%3E%3C/svg%3E");
}
.icon-schedule {
  background-color: #e8edf5;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23526f9b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='17' rx='2'/%3E%3Cpath d='M16 2v4M8 2v4M3 10h18'/%3E%3Cpath d='m8 15 2 2 5-5'/%3E%3C/svg%3E");
}
.icon-journal {
  background-color: #f2e8e0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23956b4d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 4h16v16H4z'/%3E%3Cpath d='M8 8h8M8 12h8M8 16h5'/%3E%3C/svg%3E");
}
.icon-share {
  background-color: #e6eef4;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23506f88' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='18' cy='5' r='3'/%3E%3Ccircle cx='6' cy='12' r='3'/%3E%3Ccircle cx='18' cy='19' r='3'/%3E%3Cpath d='m8.7 13.5 6.6 4M15.3 6.5l-6.6 4'/%3E%3C/svg%3E");
}
.icon-shopping {
  background-color: #e9f3ea;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23567a38' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 7h15l-1.5 9h-12z'/%3E%3Cpath d='M6 7 5 3H2'/%3E%3Ccircle cx='9' cy='20' r='1.5'/%3E%3Ccircle cx='18' cy='20' r='1.5'/%3E%3C/svg%3E");
}
.module-name {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--life-text);
}
.module-desc {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: var(--life-muted);
  line-height: 1.4;
}
</style>
