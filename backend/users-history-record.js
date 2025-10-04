import cloud from '@lafjs/cloud'

function convertToSeconds(time) {
  if (time === null || time === undefined) return null
  if (typeof time === 'number') return Number.isNaN(time) ? null : time
  const raw = time.toString().trim()
  if (!raw) return null
  const s = raw.toUpperCase()
  if (s === 'DNF' || s === 'DNS') return null
  const parts = s.split(':')
  let seconds = null
  try {
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      const sec = parseFloat(parts[2])
      seconds = h * 3600 + m * 60 + sec
    } else if (parts.length === 2) {
      const m = parseInt(parts[0], 10)
      const sec = parseFloat(parts[1])
      seconds = m * 60 + sec
    } else {
      seconds = parseFloat(s)
    }
  } catch { seconds = null }
  return (seconds === null || Number.isNaN(seconds)) ? null : seconds
}

function normalizeForRead(record) {
  if (!record) return record
  const singleSeconds = record.singleSeconds ?? convertToSeconds(record?.single?.time)
  const averageSeconds = record.averageSeconds ?? convertToSeconds(record?.average?.time)
  return {
    _id: record._id,
    event: record.event,
    timestamp: record.timestamp,
    nickname: record.nickname ?? null,
    userId: record.userId ?? null,
    singleSeconds,
    averageSeconds
  }
}

export default async function (ctx) {
  try {
    const db = cloud.database()
    const { userId, event, page = 1, pageSize = 50 } = ctx.query || {}
    if (!userId) return { code: 400, message: '缺少用户ID参数' }

    const p = Math.max(1, parseInt(page))
    const ps = Math.min(200, Math.max(1, parseInt(pageSize)))
    const cond = event ? { userId, event } : { userId }
    const col = db.collection('records')

    let total = null
    try {
      const countRes = await col.where(cond).count?.()
      total = countRes?.total ?? null
    } catch { total = null }

    const listRes = await col.where(cond)
      .orderBy('timestamp', 'desc')
      .skip((p - 1) * ps)
      .limit(ps)
      .get()

    const data = (listRes.data || []).map(normalizeForRead)
    return { code: 200, message: '获取成功', data, page: p, pageSize: ps, total }
  } catch (err) {
    console.error('users-history-record 异常:', err)
    return { code: 500, message: '服务端错误: ' + (err?.message || String(err)) }
  }
}