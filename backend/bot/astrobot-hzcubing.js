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
      
      case 'bind-user':
        // 用户绑定：通过昵称将 QQ号 与 userId 进行绑定
        try {
          const db = cloud.database()
          const qqId = query.qqId || body.qqId
          const nickname = query.nickname || body.nickname
          
          if (!qqId) {
            return {
              code: 400,
              message: '缺少必要参数',
              data: {
                requiredParams: ['qqId'],
                receivedParams: {
                  qqId: qqId || null,
                  nickname: nickname || null
                }
              }
            }
          }
          
          if (!nickname) {
            return {
              code: 400,
              message: '缺少必要参数',
              data: {
                requiredParams: ['nickname'],
                receivedParams: {
                  qqId: qqId || null,
                  nickname: nickname || null
                }
              }
            }
          }
          
          // 通过昵称查找用户
          const usersRes = await db.collection('users')
            .where({
              nickname: nickname
            })
            .get()
          
          if (!usersRes.data || usersRes.data.length === 0) {
            return {
              code: 404,
              message: '未找到该昵称对应的用户',
              data: {
                nickname,
                qqId
              }
            }
          }
          
          if (usersRes.data.length > 1) {
            return {
              code: 400,
              message: '存在多个相同昵称的用户，请使用更具体的标识',
              data: {
                nickname,
                foundUsers: usersRes.data.length
              }
            }
          }
          
          const user = usersRes.data[0]
          const userId = user._id
          
          // 检查该 QQ号 是否已绑定其他用户
          const existingBinding = await db.collection('users')
            .where({
              qqId: qqId
            })
            .get()
          
          if (existingBinding.data && existingBinding.data.length > 0) {
            const existingUser = existingBinding.data[0]
            if (existingUser._id !== userId) {
              return {
                code: 409,
                message: '该 QQ号 已绑定到其他用户',
                data: {
                  qqId,
                  existingUserId: existingUser._id,
                  existingNickname: existingUser.nickname,
                  targetUserId: userId,
                  targetNickname: nickname
                }
              }
            }
            // 如果已绑定到同一用户，直接返回成功
            return {
              code: 200,
              message: '绑定成功（已存在绑定关系）',
              data: {
                qqId,
                userId,
                nickname: user.nickname
              }
            }
          }
          
          // 更新用户信息，添加 qqId 绑定
          await db.collection('users').doc(userId).update({
            qqId: qqId
          })
          
          return {
            code: 200,
            message: '绑定成功',
            data: {
              qqId,
              userId,
              nickname: user.nickname
            }
          }
        } catch (error) {
          console.error('用户绑定失败:', error)
          return {
            code: 500,
            message: '用户绑定失败',
            error: error.message
          }
        }
      
      case 'submit-record':
        // 提交成绩：通过绑定的 QQ号 提交成绩
        try {
          const db = cloud.database()
          const qqId = query.qqId || body.qqId
          const event = query.event || body.event
          const singleTime = query.singleTime || body.singleTime // 支持 "1:23.45" 或 "83.45" 格式
          const averageTime = query.averageTime || body.averageTime
          const cube = query.cube || body.cube || null
          const method = query.method || body.method || null
          
          if (!qqId) {
            return {
              code: 400,
              message: '缺少必要参数',
              data: {
                requiredParams: ['qqId'],
                receivedParams: {
                  qqId: qqId || null,
                  event: event || null
                }
              }
            }
          }
          
          if (!event) {
            return {
              code: 400,
              message: '缺少必要参数',
              data: {
                requiredParams: ['event'],
                receivedParams: {
                  qqId,
                  event: event || null
                }
              }
            }
          }
          
          if (!singleTime && !averageTime) {
            return {
              code: 400,
              message: '必须提供单次或平均成绩',
              data: {
                receivedParams: {
                  qqId,
                  event,
                  singleTime: singleTime || null,
                  averageTime: averageTime || null
                }
              }
            }
          }
          
          // 通过 QQ号 查找绑定的用户
          const usersRes = await db.collection('users')
            .where({
              qqId: qqId
            })
            .get()
          
          if (!usersRes.data || usersRes.data.length === 0) {
            return {
              code: 404,
              message: '该 QQ号 未绑定用户，请先进行绑定',
              data: {
                qqId,
                hint: '请先使用 bind-user 接口进行用户绑定'
              }
            }
          }
          
          const user = usersRes.data[0]
          const userId = user._id
          const nickname = user.nickname
          
          // 解析时间格式（支持 "1:23.45" 或 "83.45" 格式）
          function parseTime(timeStr) {
            if (!timeStr) return null
            const str = timeStr.toString().trim()
            if (!str) return null
            const upper = str.toUpperCase()
            if (upper === 'DNF' || upper === 'DNS') return null
            
            const parts = str.split(':')
            let seconds = null
            try {
              if (parts.length === 2) {
                // 格式：m:ss.xx
                const m = parseInt(parts[0], 10)
                const sec = parseFloat(parts[1])
                seconds = m * 60 + sec
              } else if (parts.length === 1) {
                // 格式：ss.xx（纯秒数）
                seconds = parseFloat(str)
              } else {
                return null
              }
            } catch {
              return null
            }
            return (seconds === null || Number.isNaN(seconds)) ? null : seconds
          }
          
          const singleSeconds = singleTime ? parseTime(singleTime) : null
          const averageSeconds = averageTime ? parseTime(averageTime) : null
          
          if (singleTime && singleSeconds === null) {
            return {
              code: 400,
              message: '单次成绩格式错误',
              data: {
                receivedSingleTime: singleTime,
                hint: '支持格式：纯秒数（如 83.45）或 分:秒.毫秒（如 1:23.45）'
              }
            }
          }
          
          if (averageTime && averageSeconds === null) {
            return {
              code: 400,
              message: '平均成绩格式错误',
              data: {
                receivedAverageTime: averageTime,
                hint: '支持格式：纯秒数（如 83.45）或 分:秒.毫秒（如 1:23.45）'
              }
            }
          }
          
          // 构造记录数据
          const recordData = {
            event,
            userId,
            nickname,
            singleSeconds,
            averageSeconds,
            cube: cube || null,
            method: method || null,
            timestamp: new Date().toISOString()
          }
          
          // 使用 record.js 的 normalizeForWrite 函数（需要导入或复制逻辑）
          // 这里直接构造符合数据库格式的数据
          const doc = {
            event: recordData.event,
            timestamp: recordData.timestamp,
            nickname: recordData.nickname,
            userId: recordData.userId,
            singleSeconds: recordData.singleSeconds,
            averageSeconds: recordData.averageSeconds,
            cube: recordData.cube,
            method: recordData.method
          }
          
          // 添加到数据库
          const res = await db.collection('records').add(doc)
          
          return {
            code: 200,
            message: '成绩提交成功',
            data: {
              recordId: res.id,
              event,
              singleSeconds,
              averageSeconds,
              cube,
              method,
              userId,
              nickname
            }
          }
        } catch (error) {
          console.error('提交成绩失败:', error)
          return {
            code: 500,
            message: '提交成绩失败',
            error: error.message
          }
        }
      
      case 'get-user-bests':
        // 获取用户个人最佳成绩：通过绑定的 QQ号 获取该选手的个人最佳成绩
        try {
          const db = cloud.database()
          const qqId = query.qqId || body.qqId
          const event = query.event || body.event // 可选：指定项目，不传则返回所有项目
          
          if (!qqId) {
            return {
              code: 400,
              message: '缺少必要参数',
              data: {
                requiredParams: ['qqId'],
                receivedParams: {
                  qqId: qqId || null,
                  event: event || null
                }
              }
            }
          }
          
          // 通过 QQ号 查找绑定的用户
          const usersRes = await db.collection('users')
            .where({
              qqId: qqId
            })
            .get()
          
          if (!usersRes.data || usersRes.data.length === 0) {
            return {
              code: 404,
              message: '该 QQ号 未绑定用户，请先进行绑定',
              data: {
                qqId,
                hint: '请先使用 bind-user 接口进行用户绑定'
              }
            }
          }
          
          const user = usersRes.data[0]
          const userId = user._id
          const nickname = user.nickname
          
          // 时间转换函数（与 users-best-record.js 保持一致）
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
          
          // 查询该用户的所有记录
          const cond = event ? { userId, event } : { userId }
          const recordsRes = await db.collection('records').where(cond).get()
          const items = recordsRes.data || []
          
          // 按项目分组，找出每个项目的最佳成绩
          const bestMap = new Map() // event -> { event, bestSingleSeconds, bestAverageSeconds }
          for (const r of items) {
            const e = r.event || 'unknown'
            const s = r.singleSeconds ?? convertToSeconds(r?.single?.time)
            const a = r.averageSeconds ?? convertToSeconds(r?.average?.time)
            const prev = bestMap.get(e) || { event: e, bestSingleSeconds: null, bestAverageSeconds: null }
            if (s !== null && (prev.bestSingleSeconds === null || s < prev.bestSingleSeconds)) {
              prev.bestSingleSeconds = s
            }
            if (a !== null && (prev.bestAverageSeconds === null || a < prev.bestAverageSeconds)) {
              prev.bestAverageSeconds = a
            }
            bestMap.set(e, prev)
          }
          
          // 转换为数组格式
          const bestRecords = Array.from(bestMap.values())
          
          return {
            code: 200,
            message: '获取个人最佳成绩成功',
            data: {
              userId,
              nickname,
              qqId,
              bestRecords,
              count: bestRecords.length,
              event: event || 'all' // 如果指定了项目，返回项目代码；否则返回 'all'
            }
          }
        } catch (error) {
          console.error('获取个人最佳成绩失败:', error)
          return {
            code: 500,
            message: '获取个人最佳成绩失败',
            error: error.message
          }
        }
      
      default:
        return {
          code: 400,
          message: '不支持的操作',
          data: {
            supportedActions: ['leaderboard', 'record-history', 'best-records', 'bind-user', 'submit-record', 'get-user-bests'],
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

