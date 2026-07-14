<script>
import { backendApi } from './lib/api.js'
import { scheduleLocalReminder } from './lib/notifications.js'

export default {
  onLaunch() {
    backendApi.login()
      .then(() => backendApi.schedules())
      .then((items) => items.forEach(scheduleLocalReminder))
      .catch((error) => console.warn('schedule reminders load failed', error))
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
