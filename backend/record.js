import cloud from '@lafjs/cloud'

// 工具：鲁棒时间解析（trim、DNF/DNS→null、支持 m:ss / h:mm:ss / 纯秒）
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

// 写库规范：生成 seconds 缓存并移除旧结构字段
function normalizeForWrite(record) {
  const singleSeconds = record?.singleSeconds ?? convertToSeconds(record?.single?.time)
  const averageSeconds = record?.averageSeconds ?? convertToSeconds(record?.average?.time)
  const doc = {
    // 必要字段
    event: record.event,
    timestamp: record.timestamp || new Date().toISOString(),
    // 独立字段
    nickname: record.nickname ?? null,
    userId: record.userId ?? null,
    // 仅 seconds 缓存
    singleSeconds,
    averageSeconds
  }
  // 其他允许传入的安全字段可在此白名单追加
  return doc
}

// 读库规范：确保返回 seconds（不返回 single/average/singleRank/averageRank）
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
    const { pattern } = ctx.query || {}

    // 获取记录（支持分页 + event 过滤）
    if (pattern === '/records') {
      const { event, page = 1, pageSize = 50 } = ctx.query || {}
      const p = Math.max(1, parseInt(page))
      const ps = Math.min(200, Math.max(1, parseInt(pageSize)))
      const cond = event ? { event } : {}
      const col = db.collection('records')

      let total = null
      try {
        const countRes = await col.where(cond).count?.()
        total = countRes?.total ?? null
      } catch { total = null }

      const res = await col.where(cond)
        .orderBy('timestamp', 'desc')
        .skip((p - 1) * ps)
        .limit(ps)
        .get()

      const data = (res.data || []).map(normalizeForRead)
      return { code: 200, message: '获取成功', data, page: p, pageSize: ps, total }
    }

    // 获取用户记录（支持分页 + event 过滤）
    if (pattern === '/user-records') {
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

      const res = await col.where(cond)
        .orderBy('timestamp', 'desc')
        .skip((p - 1) * ps)
        .limit(ps)
        .get()

      const data = (res.data || []).map(normalizeForRead)
      return { code: 200, message: '获取成功', data, page: p, pageSize: ps, total }
    }

    // 添加记录（只存 seconds、不存排名/旧字段）
    if (pattern === '/add-record') {
      const body = ctx.body || {}
      if (!body?.event) return { code: 400, message: '记录数据不完整，缺少 event' }
      if (!body.single && !body.average && body.singleSeconds == null && body.averageSeconds == null) {
        return { code: 400, message: '记录必须包含单次或平均（传 seconds 或原始 time 均可）' }
      }
      const doc = normalizeForWrite(body)
      const res = await db.collection('records').add(doc)
      return { code: 200, message: '添加成功', data: { _id: res.id } }
    }

    // 更新记录（只存 seconds、不存排名/旧字段）
    if (pattern === '/update-record') {
      const { recordId, updateData } = ctx.body || {}
      if (!recordId || !updateData) return { code: 400, message: '缺少记录ID或更新数据' }
      const doc = normalizeForWrite(updateData)
      await db.collection('records').doc(recordId).update(doc)
      return { code: 200, message: '更新成功' }
    }

    // 删除记录
    if (pattern === '/delete-record') {
      const { recordId } = ctx.body || {}
      if (!recordId) return { code: 400, message: '缺少记录ID参数' }
      await db.collection('records').doc(recordId).remove()
      return { code: 200, message: '删除成功' }
    }

    // 项目最佳（按 seconds 计算，不存排名）
    if (pattern === '/best-records') {
      const { event } = ctx.query || {}
      const cond = event ? { event } : {}
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
    }

    return { code: 404, message: '未找到请求的API' }
  } catch (err) {
    console.error('record 接口异常:', err)
    return { code: 500, message: '服务端错误: ' + (err?.message || String(err)) }
  }
}