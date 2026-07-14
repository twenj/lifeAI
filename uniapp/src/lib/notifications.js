// App 端使用 plus.push 创建本地提醒；H5 和小程序环境会被编译为 no-op。
const scheduledIds = new Set()
export function initLocalPush() {
  // #ifdef APP-PLUS
  const push = globalThis.plus?.push
  if (!push) return false
  // 访问客户端信息会触发 iOS 首次运行时的通知权限初始化；Android 无需额外处理。
  try { push.getClientInfo?.() } catch (error) { console.warn('push init failed', error) }
  return true
  // #endif
  return false
}

export function scheduleLocalReminder(schedule) {
  // #ifdef APP-PLUS
  const push = globalThis.plus?.push
  if (schedule.reminderMinutes == null) return false
  const minutes = Number(schedule.reminderMinutes)
  const when = new Date(schedule.startAt).getTime() - minutes * 60 * 1000
  if (!push || scheduledIds.has(schedule.id) || !Number.isFinite(minutes) || minutes < 0 || !Number.isFinite(when) || when <= Date.now()) return false
  push.createMessage(`日程：${schedule.title}`, JSON.stringify({ scheduleId: schedule.id }), {
    title: '拾光AI 日程提醒',
    // iOS 不支持 when，使用 delay 让 Android/iOS 都在目标提醒时间触发。
    delay: Math.max(1, Math.ceil((when - Date.now()) / 1000)),
    sound: 'system',
    cover: false,
  })
  scheduledIds.add(schedule.id)
  return true
  // #endif
  return false
}
