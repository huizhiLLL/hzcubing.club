import cloud from '@lafjs/cloud'
import jwt from 'jsonwebtoken'

// 内嵌权限验证函数
async function verifyToken(ctx) {
  try {
    const authHeader = ctx.headers?.authorization || ctx.headers?.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    const token = authHeader.substring(7)
    if (!token) return null
    
    try {
      // 使用JWT库验证token
      const secret = '3#x!L9@qAaBvTmZ$8KpQwE2^VdF7' // 与登录时使用的相同密钥
      const payload = jwt.verify(token, secret)
      const userId = payload.uid
      
      if (!userId) return null
      
      const db = cloud.database()
      const userRes = await db.collection('users').doc(userId).get()
      
      if (!userRes.data) return null
      
      return {
        ...userRes.data,
        role: userRes.data.role || 'user',
        status: userRes.data.status || 'active'
      }
    } catch (e) {
      console.error('Token验证失败:', e)
      return null
    }
  } catch (error) {
    console.error('权限验证错误:', error)
    return null
  }
}

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
    averageSeconds,
    // 魔方和解法信息
    cube: record.cube || null,
    method: record.method || null
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
    averageSeconds,
    // 魔方和解法信息
    cube: record.cube || null,
    method: record.method || null
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

      // 批量获取用户昵称（性能优化）
      const records = res.data || []
      const userIds = [...new Set(records.map(r => r.userId).filter(Boolean))]
      
      // 批量查询用户信息
      const userMap = new Map()
      if (userIds.length > 0) {
        try {
          const usersRes = await db.collection('users')
            .where({
              _id: db.command.in(userIds)
            })
            .field({ _id: true, nickname: true })
            .get()
          
          usersRes.data?.forEach(user => {
            userMap.set(user._id, user.nickname)
          })
        } catch (e) {
          console.error('批量获取用户信息失败:', e)
        }
      }
      
      // 处理记录数据
      const data = records.map(record => {
        const normalizedRecord = normalizeForRead(record)
        normalizedRecord.nickname = userMap.get(record.userId) || '匿名用户'
        return normalizedRecord
      })
      
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

      // 由于是查询特定用户的记录，直接获取该用户的昵称即可
      let nickname = '匿名用户'
      try {
        const userRes = await db.collection('users').doc(userId).get()
        if (userRes.data && userRes.data.nickname) {
          nickname = userRes.data.nickname
        }
      } catch (e) {
        // 如果获取用户失败，使用默认昵称
      }
      
      // 处理记录数据
      const data = (res.data || []).map(record => {
        const normalizedRecord = normalizeForRead(record)
        normalizedRecord.nickname = nickname
        return normalizedRecord
      })
      
      return { code: 200, message: '获取成功', data, page: p, pageSize: ps, total }
    }

    // 添加记录（需要登录）
    if (pattern === '/add-record') {
      // 验证用户登录状态
      const currentUser = await verifyToken(ctx)
      if (!currentUser) {
        return { code: 401, message: '未登录或token无效' }
      }
      
      if (currentUser.status !== 'active') {
        return { code: 403, message: '账户已被禁用' }
      }
      
      const body = ctx.body || {}
      if (!body?.event) return { code: 400, message: '记录数据不完整，缺少 event' }
      if (!body.single && !body.average && body.singleSeconds == null && body.averageSeconds == null) {
        return { code: 400, message: '记录必须包含单次或平均（传 seconds 或原始 time 均可）' }
      }
      
      // 确保记录关联到当前用户
      const recordData = { ...body, userId: currentUser._id, nickname: currentUser.nickname }
      const doc = normalizeForWrite(recordData)
      const res = await db.collection('records').add(doc)
      return { code: 200, message: '添加成功', data: { _id: res.id } }
    }

    // 更新记录（需要登录，只能修改自己的记录）
    if (pattern === '/update-record') {
      // 验证用户登录状态
      const currentUser = await verifyToken(ctx)
      if (!currentUser) {
        return { code: 401, message: '未登录或token无效' }
      }
      
      if (currentUser.status !== 'active') {
        return { code: 403, message: '账户已被禁用' }
      }
      
      const { recordId, updateData } = ctx.body || {}
      if (!recordId || !updateData) return { code: 400, message: '缺少记录ID或更新数据' }
      
      // 检查记录是否属于当前用户
      const existingRecord = await db.collection('records').doc(recordId).get()
      if (!existingRecord.data) {
        return { code: 404, message: '记录不存在' }
      }
      
      if (existingRecord.data.userId !== currentUser._id) {
        return { code: 403, message: '只能修改自己的记录' }
      }
      
      const doc = normalizeForWrite(updateData)
      await db.collection('records').doc(recordId).update(doc)
      return { code: 200, message: '更新成功' }
    }

    // 删除记录（需要登录，只能删除自己的记录）
    if (pattern === '/delete-record') {
      // 验证用户登录状态
      const currentUser = await verifyToken(ctx)
      if (!currentUser) {
        return { code: 401, message: '未登录或token无效' }
      }
      
      if (currentUser.status !== 'active') {
        return { code: 403, message: '账户已被禁用' }
      }
      
      const { recordId } = ctx.body || {}
      if (!recordId) return { code: 400, message: '缺少记录ID参数' }
      
      // 检查记录是否属于当前用户
      const existingRecord = await db.collection('records').doc(recordId).get()
      if (!existingRecord.data) {
        return { code: 404, message: '记录不存在' }
      }
      
      if (existingRecord.data.userId !== currentUser._id) {
        return { code: 403, message: '只能删除自己的记录' }
      }
      
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

    // 获取最近打破的记录（GR 历史）
    if (pattern === '/recent-record-breaks') {
      const { limit = 5 } = ctx.query || {}
      const limitNum = Math.min(Math.max(1, parseInt(limit)), 100)
      
      // 获取所有记录，按时间排序
      const res = await db.collection('records')
        .orderBy('timestamp', 'desc')
        .get()
      
      const allRecords = res.data || []
      
      // 计算每个项目的打破记录历史
      const eventRecordsMap = new Map()
      
      // 按事件分组
      for (const record of allRecords) {
        const event = record.event
        if (!event) continue
        
        if (!eventRecordsMap.has(event)) {
          eventRecordsMap.set(event, [])
        }
        eventRecordsMap.get(event).push(record)
      }
      
      // 计算每个事件的打破记录
      const recordBreaks = []
      
      for (const [event, records] of eventRecordsMap.entries()) {
        // 按时间从早到晚排序
        const sortedRecords = [...records].sort((a, b) => {
          const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return timeA - timeB
        })
        
        let bestSingleTime = Infinity
        let bestAverageTime = Infinity
        
        // 遍历找出打破记录的
        for (const record of sortedRecords) {
          const singleTime = record.singleSeconds
          const averageTime = record.averageSeconds
          let isBreakingRecord = false
          
          if (singleTime !== null && singleTime !== undefined && singleTime < bestSingleTime) {
            bestSingleTime = singleTime
            isBreakingRecord = true
          }
          
          if (averageTime !== null && averageTime !== undefined && averageTime < bestAverageTime) {
            bestAverageTime = averageTime
            isBreakingRecord = true
          }
          
          if (isBreakingRecord) {
            recordBreaks.push({
              ...normalizeForRead(record),
              isSingleRecord: singleTime !== null && singleTime !== undefined && singleTime === bestSingleTime,
              isAverageRecord: averageTime !== null && averageTime !== undefined && averageTime === bestAverageTime
            })
          }
        }
      }
      
      // 按时间从新到旧排序，取前 limit 条
      recordBreaks.sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
        return timeB - timeA
      })
      
      const data = recordBreaks.slice(0, limitNum)
      
      // 批量获取用户昵称
      const userIds = [...new Set(data.map(r => r.userId).filter(Boolean))]
      const userMap = new Map()
      
      if (userIds.length > 0) {
        try {
          const usersRes = await db.collection('users')
            .where({
              _id: db.command.in(userIds)
            })
            .field({ _id: true, nickname: true })
            .get()
          
          usersRes.data?.forEach(user => {
            userMap.set(user._id, user.nickname)
          })
        } catch (e) {
          console.error('批量获取用户信息失败:', e)
        }
      }
      
      // 填充昵称
      const result = data.map(record => ({
        ...record,
        nickname: userMap.get(record.userId) || record.nickname || '匿名用户'
      }))
      
      return { code: 200, message: '获取成功', data: result }
    }

    return { code: 404, message: '未找到请求的API' }
  } catch (err) {
    console.error('record 接口异常:', err)
    return { code: 500, message: '服务端错误: ' + (err?.message || String(err)) }
  }
}