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

export default async function (ctx) {
  try {
    const db = cloud.database()
    const { userId, event } = ctx.query || {}
    if (!userId) return { code: 400, message: '缺少用户ID参数' }

    const cond = event ? { userId, event } : { userId }
    const res = await db.collection('records').where(cond).get()
    const items = res.data || []

    const bestMap = new Map() // event -> { event, bestSingleSeconds, bestAverageSeconds }
    for (const r of items) {
      const e = r.event || 'unknown'
      const s = r.singleSeconds ?? convertToSeconds(r?.single?.time)
      const a = r.averageSeconds ?? convertToSeconds(r?.average?.time)
      const prev = bestMap.get(e) || { event: e, bestSingleSeconds: null, bestAverageSeconds: null }
      if (s !== null && (prev.bestSingleSeconds === null || s < prev.bestSingleSeconds)) prev.bestSingleSeconds = s
      if (a !== null && (prev.bestAverageSeconds === null || a < prev.bestAverageSeconds)) prev.bestAverageSeconds = a
      bestMap.set(e, prev)
    }

    const data = Array.from(bestMap.values())
    return { code: 200, message: '获取成功', data }
  } catch (err) {
    console.error('users-best-record 异常:', err)
    return { code: 500, message: '服务端错误: ' + (err?.message || String(err)) }
  }
}