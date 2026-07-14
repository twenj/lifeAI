// App 端使用 plus.push 创建本地提醒；H5 和小程序环境会被编译为 no-op。
const scheduledIds = new Set()
export function scheduleLocalReminder(schedule) {
  // #ifdef APP-PLUS
  const push = globalThis.plus?.push
  const minutes = Number(schedule.reminderMinutes)
  const when = new Date(schedule.startAt).getTime() - minutes * 60 * 1000
  if (!push || scheduledIds.has(schedule.id) || !Number.isFinite(minutes) || minutes < 0 || !Number.isFinite(when) || when <= Date.now()) return false
  push.createMessage(`日程：${schedule.title}`, JSON.stringify({ scheduleId: schedule.id }), {
    title: '小日子AI 日程提醒',
    when: new Date(when),
    sound: 'system',
    cover: false,
  })
  scheduledIds.add(schedule.id)
  return true
  // #endif
  return false
}
