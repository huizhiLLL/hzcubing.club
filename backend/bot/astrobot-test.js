import cloud from '@lafjs/cloud'

/**
 * Astrobot 插件测试接口
 * 用于测试网站与 astrobot 的对接
 */
export default async function (ctx) {
  try {
    const method = ctx.method || ctx.request?.method || 'GET'
    const body = ctx.body || ctx.request?.body || {}
    const query = ctx.query || ctx.request?.query || {}
    
    console.log('收到 Astrobot 测试请求:', {
      method,
      query,
      body,
      headers: ctx.headers || ctx.request?.headers
    })
    
    // 获取请求参数（支持 GET 和 POST）
    const action = query.action || body.action || 'ping'
    const message = query.message || body.message || ''
    const timestamp = query.timestamp || body.timestamp || Date.now()
    
    // 处理不同的操作
    switch (action) {
      case 'ping':
        // 简单的 ping 测试，返回服务器时间
        return {
          code: 200,
          message: '连接成功',
          data: {
            status: 'online',
            serverTime: new Date().toISOString(),
            timestamp: Date.now(),
            message: '网站运行正常，接口可用'
          }
        }
      
      case 'echo':
        // 回声测试，返回发送的消息
        return {
          code: 200,
          message: '回声测试成功',
          data: {
            originalMessage: message,
            receivedAt: new Date().toISOString(),
            echo: `收到消息: ${message || '(空消息)'}`
          }
        }
      
      case 'stats':
        // 获取网站基础统计
        try {
          const db = cloud.database()
          
          // 获取用户总数
          const usersRes = await db.collection('users').count()
          const totalUsers = usersRes.total || 0
          
          // 获取记录总数
          const recordsRes = await db.collection('records').count()
          const totalRecords = recordsRes.total || 0
          
          // 获取今天的记录数
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayRecordsRes = await db.collection('records')
            .where({
              timestamp: db.command.gte(today.toISOString())
            })
            .count()
          const todayRecords = todayRecordsRes.total || 0
          
          return {
            code: 200,
            message: '获取统计成功',
            data: {
              totalUsers,
              totalRecords,
              todayRecords,
              serverTime: new Date().toISOString()
            }
          }
        } catch (error) {
          console.error('获取统计数据失败:', error)
          return {
            code: 500,
            message: '获取统计数据失败',
            error: error.message
          }
        }
      
      case 'record':
        // 获取最新记录（最近5条）
        try {
          const db = cloud.database()
          const recordsRes = await db.collection('records')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get()
          
          const recordsData = recordsRes.data || []
          
          // 收集所有唯一的 userId
          const userIds = [...new Set(recordsData
            .map(record => record.userId)
            .filter(Boolean))]
          
          // 批量获取用户昵称
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
          
          // 映射记录并添加昵称
          const records = recordsData.map(record => ({
            id: record._id,
            event: record.event,
            singleTime: record.single?.time || record.singleSeconds,
            averageTime: record.average?.time || record.averageSeconds,
            timestamp: record.timestamp,
            userId: record.userId,
            nickname: record.userId ? (userMap.get(record.userId) || record.nickname || '未知用户') : '匿名用户'
          }))
          
          return {
            code: 200,
            message: '获取最新记录成功',
            data: {
              records,
              count: records.length
            }
          }
        } catch (error) {
          console.error('获取记录失败:', error)
          return {
            code: 500,
            message: '获取记录失败',
            error: error.message
          }
        }
      
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
      
      default:
        return {
          code: 400,
          message: '不支持的操作',
          data: {
            supportedActions: ['ping', 'echo', 'stats', 'record', 'leaderboard'],
            receivedAction: action
          }
        }
    }
    
  } catch (error) {
    console.error('astrobot-test 接口异常:', error)
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message || String(error),
      timestamp: new Date().toISOString()
    }
  }
}

