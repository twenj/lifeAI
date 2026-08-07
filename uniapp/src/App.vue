<script>
import { backendApi } from './lib/api.js'
import { initLocalPush, scheduleLocalReminder } from './lib/notifications.js'

const loadSchedulesAndReminders = () => {
  initLocalPush()
  backendApi.login()
    .then(() => backendApi.schedules())
    .then((result) => (result.items || []).forEach(scheduleLocalReminder))
    .catch((error) => console.warn('schedule reminders load failed', error))
}

export default {
  onLaunch() {
    // Push 模块由原生运行时异步注册；过早调用会被 Runtime 误判为“未添加模块”。
    // #ifdef APP-PLUS
    document.addEventListener('plusready', loadSchedulesAndReminders, { once: true })
    // #endif
    // #ifndef APP-PLUS
    backendApi.login().catch((error) => console.warn('backend login failed', error))
    // #endif
  },
}
</script>

<style>
page {
  --life-bg: #f2f6eb;
  --life-surface: #ffffff;
  --life-surface-soft: #e8f0dc;
  --life-primary: #6f9b4a;
  --life-primary-deep: #567a38;
  --life-primary-soft: #d8e8c4;
  --life-accent: #a3c76d;
  --life-text: #24311f;
  --life-muted: #7d8c6a;
  --life-border: #e0e8d2;
  --life-disabled: #c5d4b0;
  --life-shadow: rgba(70, 98, 48, 0.08);

  background: var(--life-bg);
  color: var(--life-text);
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
}
</style>
