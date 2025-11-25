import cloud from '@lafjs/cloud'

/**
 * Astrobot 插件接口
 * 用于网站与 astrobot 的对接
 */
export default async function (ctx) {
  try {
    const method = ctx.method || ctx.request?.method || 'GET'
    const body = ctx.body || ctx.request?.body || {}
    const query = ctx.query || ctx.request?.query || {}
    
    console.log('收到 Astrobot 请求:', {
      method,
      action: query.action || body.action,
      query,
      body
    })
    
    // 获取请求参数（支持 GET 和 POST）
    const action = query.action || body.action
    
    // 如果没有提供 action，返回错误
    if (!action) {
      return {
        code: 400,
        message: '缺少必要参数',
        data: {
          requiredParams: ['action'],
          supportedActions: ['leaderboard', 'record-history'],
          receivedParams: {
            action: null
          }
        }
      }
    }
    
    // 处理不同的操作
    switch (action) {
      case 'leaderboard':
        // 获取项目排行榜
        try {
          const db = cloud.database()
          const event = query.event || body.event
          const rankType = query.rankType || body.rankType || 'single' // 'single' 或 'average'
          const limit = query.limit || body.limit // 可选的限制数量
          
          if (!event) {
            return {
              code: 400,
              message: '缺少必要参数',
              data: {
                requiredParams: ['event'],
                receivedParams: {
                  event: event || null,
                  rankType,
                  limit
                }
              }
            }
          }
          
          if (rankType !== 'single' && rankType !== 'average') {
            return {
              code: 400,
              message: '无效的排行榜类型',
              data: {
                supportedTypes: ['single', 'average'],
                receivedType: rankType
              }
            }
          }
          
          // 获取该项目所有记录（分批查询避免限制）
          let allRecords = []
          let skip = 0
          const pageSize = 100
          
          while (true) {
            const recordsRes = await db.collection('records')
              .where({ event: event })
              .skip(skip)
              .limit(pageSize)
              .get()
            
            if (!recordsRes.data || recordsRes.data.length === 0) {
              break
            }
            
            allRecords = allRecords.concat(recordsRes.data)
            skip += pageSize
            
            if (recordsRes.data.length < pageSize) {
              break
            }
          }
          
          if (allRecords.length === 0) {
            return {
              code: 200,
              message: '获取排行榜成功',
              data: {
                event,
                rankType,
                leaderboard: [],
                count: 0
              }
            }
          }
          
          // 为每个用户找到最佳成绩
          const userBestRecords = new Map()
          
          allRecords.forEach(record => {
            const userId = record.userId
            if (!userId) return
            
            // 根据 rankType 选择单次或平均成绩
            let currentTime = null
            if (rankType === 'single') {
              currentTime = typeof record.singleSeconds === 'number' 
                ? record.singleSeconds 
                : (record.single?.time ? parseFloat(record.single.time) : null)
            } else {
              currentTime = typeof record.averageSeconds === 'number'
                ? record.averageSeconds
                : (record.average?.time ? parseFloat(record.average.time) : null)
            }
            
            // 跳过无效成绩
            if (currentTime === null || currentTime === undefined || isNaN(currentTime)) {
              return
            }
            
            // 获取用户昵称（优先从记录中，否则稍后批量获取）
            const nickname = record.nickname || null
            
            if (!userBestRecords.has(userId)) {
              userBestRecords.set(userId, {
                userId,
                nickname,
                time: currentTime,
                recordId: record._id,
                timestamp: record.timestamp
              })
            } else {
              const existing = userBestRecords.get(userId)
              // 取最佳成绩（时间越小越好）
              if (currentTime < existing.time) {
                userBestRecords.set(userId, {
                  userId,
                  nickname: nickname || existing.nickname,
                  time: currentTime,
                  recordId: record._id,
                  timestamp: record.timestamp
                })
              }
            }
          })
          
          // 收集所有唯一的 userId 用于批量获取昵称
          const userIds = [...new Set(Array.from(userBestRecords.keys()))]
          
          // 批量获取用户昵称（补充缺失的昵称）
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
                userMap.set(user._id, user.nickname || '未知用户')
              })
            } catch (userError) {
              console.error('批量获取用户信息失败:', userError)
            }
          }
          
          // 转换为数组并排序，同时补充昵称
          let sortedRecords = Array.from(userBestRecords.values())
            .map(record => ({
              ...record,
              nickname: record.nickname || userMap.get(record.userId) || '未知用户'
            }))
            .sort((a, b) => a.time - b.time)
          
          // 应用限制（如果指定）
          if (limit && parseInt(limit) > 0) {
            sortedRecords = sortedRecords.slice(0, parseInt(limit))
          }
          
          // 分配排名
          const leaderboard = sortedRecords.map((record, index) => ({
            rank: index + 1,
            userId: record.userId,
            nickname: record.nickname,
            time: record.time,
            recordId: record.recordId,
            timestamp: record.timestamp
          }))
          
          return {
            code: 200,
            message: '获取排行榜成功',
            data: {
              event,
              rankType,
              leaderboard,
              count: leaderboard.length
            }
          }
        } catch (error) {
          console.error('获取排行榜失败:', error)
          return {
            code: 500,
            message: '获取排行榜失败',
            error: error.message
          }
        }
      
      case 'record-history':
        // 获取项目历史记录（打破记录的记录）
        try {
          const db = cloud.database()
          const event = query.event || body.event
          const page = parseInt(query.page || body.page || 1)
          const pageSize = parseInt(query.pageSize || body.pageSize || 10)
          
          if (!event) {
            return {
              code: 400,
              message: '缺少必要参数',
              data: {
                requiredParams: ['event'],
                receivedParams: {
                  event: event || null,
                  page,
                  pageSize
                }
              }
            }
          }
          
          // 获取该项目所有记录（分批查询避免限制）
          let allRecords = []
          let skip = 0
          const batchSize = 100
          
          while (true) {
            const recordsRes = await db.collection('records')
              .where({ event: event })
              .skip(skip)
              .limit(batchSize)
              .get()
            
            if (!recordsRes.data || recordsRes.data.length === 0) {
              break
            }
            
            allRecords = allRecords.concat(recordsRes.data)
            skip += batchSize
            
            if (recordsRes.data.length < batchSize) {
              break
            }
          }
          
          if (allRecords.length === 0) {
            return {
              code: 200,
              message: '获取历史记录成功',
              data: {
                event,
                records: [],
                total: 0,
                page,
                pageSize,
                totalPages: 0
              }
            }
          }
          
          // 按时间从早到晚排序
          const sortedRecords = [...allRecords].sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
            const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
            return dateA - dateB
          })
          
          // 记录打破历史的逻辑
          const recordBreakHistory = []
          let bestSingleTime = Infinity
          let bestAverageTime = Infinity
          
          sortedRecords.forEach(record => {
            let isBreakingRecord = false
            let isSingleRecord = false
            let isAverageRecord = false
            
            // 获取单次和平均成绩
            const singleTime = typeof record.singleSeconds === 'number' 
              ? record.singleSeconds 
              : (record.single?.time ? parseFloat(record.single.time) : null)
            const averageTime = typeof record.averageSeconds === 'number'
              ? record.averageSeconds
              : (record.average?.time ? parseFloat(record.average.time) : null)
            
            // 检查单次是否打破记录
            if (singleTime !== null && !isNaN(singleTime) && singleTime < bestSingleTime) {
              bestSingleTime = singleTime
              isBreakingRecord = true
              isSingleRecord = true
            }
            
            // 检查平均是否打破记录
            if (averageTime !== null && !isNaN(averageTime) && averageTime < bestAverageTime) {
              bestAverageTime = averageTime
              isBreakingRecord = true
              isAverageRecord = true
            }
            
            // 如果打破了记录，添加到历史中
            if (isBreakingRecord) {
              recordBreakHistory.push({
                id: record._id,
                event: record.event,
                singleSeconds: singleTime,
                averageSeconds: averageTime,
                timestamp: record.timestamp,
                userId: record.userId,
                nickname: record.nickname || null,
                isSingleRecord,
                isAverageRecord
              })
            }
          })
          
          // 反转，使最新记录在上面
          recordBreakHistory.reverse()
          
          // 收集所有唯一的 userId 用于批量获取昵称
          const userIds = [...new Set(recordBreakHistory
            .map(r => r.userId)
            .filter(Boolean))]
          
          // 批量获取用户昵称（补充缺失的昵称）
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
                userMap.set(user._id, user.nickname || '未知用户')
              })
            } catch (userError) {
              console.error('批量获取用户信息失败:', userError)
            }
          }
          
          // 补充昵称
          const recordsWithNickname = recordBreakHistory.map(record => ({
            ...record,
            nickname: record.nickname || userMap.get(record.userId) || '未知用户'
          }))
          
          // 分页
          const total = recordsWithNickname.length
          const totalPages = Math.ceil(total / pageSize)
          const startIndex = (page - 1) * pageSize
          const endIndex = startIndex + pageSize
          const paginatedRecords = recordsWithNickname.slice(startIndex, endIndex)
          
          return {
            code: 200,
            message: '获取历史记录成功',
            data: {
              event,
              records: paginatedRecords,
              total,
              page,
              pageSize,
              totalPages
            }
          }
        } catch (error) {
          console.error('获取历史记录失败:', error)
          return {
            code: 500,
            message: '获取历史记录失败',
            error: error.message
          }
        }
      
      case 'best-records':
        // 获取各项目的最佳记录（GR记录）
        try {
          const db = cloud.database()
          const event = query.event || body.event // 可选的，如果提供则只返回该项目的
          
          // 时间转换工具函数
          const convertToSeconds = (time) => {
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
          
          // 获取所有记录（分批查询避免限制）
          let allRecords = []
          let skip = 0
          const batchSize = 100
          const cond = event ? { event } : {}
          
          while (true) {
            const recordsRes = await db.collection('records')
              .where(cond)
              .skip(skip)
              .limit(batchSize)
              .get()
            
            if (!recordsRes.data || recordsRes.data.length === 0) {
              break
            }
            
            allRecords = allRecords.concat(recordsRes.data)
            skip += batchSize
            
            if (recordsRes.data.length < batchSize) {
              break
            }
          }
          
          if (allRecords.length === 0) {
            return {
              code: 200,
              message: '获取最佳记录成功',
              data: {
                bestRecords: [],
                count: 0
              }
            }
          }
          
          // 按项目计算最佳记录
          const bestMap = new Map() // event -> best record info
          
          allRecords.forEach(record => {
            const eventCode = record.event
            if (!eventCode) return
            
            // 获取单次和平均成绩
            const singleSeconds = typeof record.singleSeconds === 'number'
              ? record.singleSeconds
              : convertToSeconds(record?.single?.time)
            const averageSeconds = typeof record.averageSeconds === 'number'
              ? record.averageSeconds
              : convertToSeconds(record?.average?.time)
            
            // 获取或初始化该项目的最佳记录
            let bestRecord = bestMap.get(eventCode)
            if (!bestRecord) {
              bestRecord = {
                event: eventCode,
                singleSeconds: null,
                singleHolderUserId: null,
                singleHolderNickname: null,
                singleTimestamp: null,
                averageSeconds: null,
                averageHolderUserId: null,
                averageHolderNickname: null,
                averageTimestamp: null
              }
              bestMap.set(eventCode, bestRecord)
            }
            
            // 更新单次最佳
            if (singleSeconds !== null && !isNaN(singleSeconds)) {
              if (bestRecord.singleSeconds === null || singleSeconds < bestRecord.singleSeconds) {
                bestRecord.singleSeconds = singleSeconds
                bestRecord.singleHolderUserId = record.userId || null
                bestRecord.singleHolderNickname = record.nickname || null
                bestRecord.singleTimestamp = record.timestamp || null
              }
            }
            
            // 更新平均最佳
            if (averageSeconds !== null && !isNaN(averageSeconds)) {
              if (bestRecord.averageSeconds === null || averageSeconds < bestRecord.averageSeconds) {
                bestRecord.averageSeconds = averageSeconds
                bestRecord.averageHolderUserId = record.userId || null
                bestRecord.averageHolderNickname = record.nickname || null
                bestRecord.averageTimestamp = record.timestamp || null
              }
            }
          })
          
          // 收集所有需要查询的用户ID
          const userIds = new Set()
          bestMap.forEach(bestRecord => {
            if (bestRecord.singleHolderUserId) userIds.add(bestRecord.singleHolderUserId)
            if (bestRecord.averageHolderUserId) userIds.add(bestRecord.averageHolderUserId)
          })
          
          // 批量获取用户昵称
          const userMap = new Map()
          if (userIds.size > 0) {
            try {
              const usersRes = await db.collection('users')
                .where({
                  _id: db.command.in(Array.from(userIds))
                })
                .field({ _id: true, nickname: true })
                .get()
              
              usersRes.data?.forEach(user => {
                userMap.set(user._id, user.nickname || '未知用户')
              })
            } catch (userError) {
              console.error('批量获取用户信息失败:', userError)
            }
          }
          
          // 补充昵称并转换为数组
          const bestRecords = Array.from(bestMap.values()).map(bestRecord => ({
            event: bestRecord.event,
            single: bestRecord.singleSeconds !== null ? {
              seconds: bestRecord.singleSeconds,
              holderUserId: bestRecord.singleHolderUserId,
              holderNickname: bestRecord.singleHolderNickname || 
                (bestRecord.singleHolderUserId ? userMap.get(bestRecord.singleHolderUserId) || '未知用户' : '未知用户'),
              timestamp: bestRecord.singleTimestamp
            } : null,
            average: bestRecord.averageSeconds !== null ? {
              seconds: bestRecord.averageSeconds,
              holderUserId: bestRecord.averageHolderUserId,
              holderNickname: bestRecord.averageHolderNickname || 
                (bestRecord.averageHolderUserId ? userMap.get(bestRecord.averageHolderUserId) || '未知用户' : '未知用户'),
              timestamp: bestRecord.averageTimestamp
            } : null
          }))
          
          return {
            code: 200,
            message: '获取最佳记录成功',
            data: {
              bestRecords,
              count: bestRecords.length
            }
          }
        } catch (error) {
          console.error('获取最佳记录失败:', error)
          return {
            code: 500,
            message: '获取最佳记录失败',
            error: error.message
          }
        }
      
      default:
        return {
          code: 400,
          message: '不支持的操作',
          data: {
            supportedActions: ['leaderboard', 'record-history', 'best-records'],
            receivedAction: action
          }
        }
    }
    
  } catch (error) {
    console.error('astrobot-hzcubing 接口异常:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message || String(error),
      timestamp: new Date().toISOString()
    }
  }
}

