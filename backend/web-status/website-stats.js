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
      const secret = '3#x!L9@qAaBvTmZ$8KpQwE2^VdF7'
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
      return null
    }
  } catch (error) {
    return null
  }
}

export default async function (ctx) {
  try {
    // 验证管理员权限
    const currentUser = await verifyToken(ctx)
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      return { code: 403, message: '权限不足，仅管理员可访问' }
    }
    
    if (currentUser.status !== 'active') {
      return { code: 403, message: '账户已被禁用' }
    }
    
    const db = cloud.database()
    
    // 获取所有用户（分批查询避免限制）
    let allUsers = []
    let skip = 0
    const limit = 100
    
    while (true) {
      const usersRes = await db.collection('users')
        .skip(skip)
        .limit(limit)
        .get()
      
      if (!usersRes.data || usersRes.data.length === 0) {
        break
      }
      
      allUsers = allUsers.concat(usersRes.data)
      skip += limit
      
      if (usersRes.data.length < limit) {
        break
      }
    }
    
    const users = allUsers
    
    // 获取所有成绩记录（分批查询避免限制）
    let allRecords = []
    let recordSkip = 0
    
    while (true) {
      const recordsRes = await db.collection('records')
        .skip(recordSkip)
        .limit(limit)
        .get()
      
      if (!recordsRes.data || recordsRes.data.length === 0) {
        break
      }
      
      allRecords = allRecords.concat(recordsRes.data)
      recordSkip += limit
      
      if (recordsRes.data.length < limit) {
        break
      }
    }
    
    const records = allRecords
    
    // 计算真正的活跃用户（最近30天内有活动的用户）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // 最近30天内登录过的用户
    const recentlyLoggedInUsers = users.filter(u => {
      if (!u.lastLoginTime) return false
      const loginDate = new Date(u.lastLoginTime)
      return loginDate >= thirtyDaysAgo
    })
    
    // 最近30天内提交过成绩的用户ID
    const recentlyActiveUserIds = new Set(
      records
        .filter(r => new Date(r.timestamp) >= thirtyDaysAgo)
        .map(r => r.userId)
        .filter(Boolean)
    )
    
    // 综合活跃用户（登录过或提交过成绩）
    const activeUserIds = new Set([
      ...recentlyLoggedInUsers.map(u => u._id),
      ...recentlyActiveUserIds
    ])
    
    // 计算本月注册用户数
    const currentMonth = new Date()
    const usersThisMonth = users.filter(u => {
      if (!u.createTime) return false
      const createDate = new Date(u.createTime)
      return createDate.getFullYear() === currentMonth.getFullYear() && 
             createDate.getMonth() === currentMonth.getMonth()
    }).length
    
    const userStats = {
      totalUsers: users.length,
      usersThisMonth, // 本月注册用户数
      activeUsers: activeUserIds.size, // 真正的活跃用户数
      accountActiveUsers: users.filter(u => u.status === 'active').length, // 账户状态为active的用户
      inactiveUsers: users.filter(u => u.status === 'inactive').length,
      bannedUsers: users.filter(u => u.status === 'banned').length,
      recentlyLoggedIn: recentlyLoggedInUsers.length, // 最近登录用户数
      recentlySubmitted: recentlyActiveUserIds.size, // 最近提交成绩用户数
      usersByRole: {
        guest: users.filter(u => (u.role || 'user') === 'guest').length,
        user: users.filter(u => (u.role || 'user') === 'user').length,
        admin: users.filter(u => (u.role || 'user') === 'admin').length,
        super_admin: users.filter(u => (u.role || 'user') === 'super_admin').length
      }
    }
    
    const recordStats = {
      totalRecords: records.length,
      recordsThisMonth: records.filter(r => {
        const recordDate = new Date(r.timestamp)
        const now = new Date()
        return recordDate.getFullYear() === now.getFullYear() && 
               recordDate.getMonth() === now.getMonth()
      }).length,
      recordsToday: records.filter(r => {
        const recordDate = new Date(r.timestamp)
        const today = new Date()
        return recordDate.toDateString() === today.toDateString()
      }).length
    }
    
    // 获取最近活动（最近10条记录）
    const recentRecords = records
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
    
    // 批量获取用户昵称
    const userIds = [...new Set(recentRecords.map(r => r.userId).filter(Boolean))]
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
    
    const recentActivities = recentRecords.map(record => ({
      id: record._id,
      type: 'record_submit',
      description: `${userMap.get(record.userId) || '匿名用户'} 提交了 ${record.event} 成绩`,
      timestamp: record.timestamp,
      userId: record.userId
    }))
    
    // 获取最近注册用户（最近5个）
    const recentUsers = users
      .filter(u => u.createTime)
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      .slice(0, 5)
    
    const recentUserActivities = recentUsers.map(user => ({
      id: user._id,
      type: 'user_register',
      description: `新用户 ${user.nickname} 注册`,
      timestamp: user.createTime,
      userId: user._id
    }))
    
    // 合并活动并按时间排序
    const allActivities = [...recentActivities, ...recentUserActivities]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
    
    // 获取所有访问记录（分批查询避免限制）
    let allVisits = []
    let visitSkip = 0
    
    while (true) {
      const visitsRes = await db.collection('visits')
        .skip(visitSkip)
        .limit(limit)
        .get()
      
      if (!visitsRes.data || visitsRes.data.length === 0) {
        break
      }
      
      allVisits = allVisits.concat(visitsRes.data)
      visitSkip += limit
      
      if (visitsRes.data.length < limit) {
        break
      }
    }
    
    const visits = allVisits
    
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
    
    const visitStats = {
      totalVisits: visits.length,
      visitsToday: visits.filter(v => v.date === today).length,
      visitsThisMonth: visits.filter(v => v.date && v.date.startsWith(thisMonth)).length,
      uniqueIPs: [...new Set(visits.map(v => v.ip))].length,
      description: '主页访问统计' // 说明这是主页访问统计
    }
    
    return {
      code: 200,
      message: '获取统计数据成功',
      data: {
        userStats,
        recordStats,
        visitStats,
        recentActivities: allActivities
      }
    }
    
  } catch (error) {
    console.error('website-stats 接口异常:', error)
    return { code: 500, message: '服务端错误: ' + (error?.message || String(error)) }
  }
}
