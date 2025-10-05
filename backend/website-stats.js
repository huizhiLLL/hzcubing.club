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
    
    // 获取用户统计
    const usersRes = await db.collection('users').get()
    const users = usersRes.data || []
    
    const userStats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      inactiveUsers: users.filter(u => u.status === 'inactive').length,
      bannedUsers: users.filter(u => u.status === 'banned').length,
      usersByRole: {
        guest: users.filter(u => (u.role || 'user') === 'guest').length,
        user: users.filter(u => (u.role || 'user') === 'user').length,
        admin: users.filter(u => (u.role || 'user') === 'admin').length,
        super_admin: users.filter(u => (u.role || 'user') === 'super_admin').length
      }
    }
    
    // 获取成绩统计
    const recordsRes = await db.collection('records').get()
    const records = recordsRes.data || []
    
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
    
    const recentActivities = recentRecords.map(record => ({
      id: record._id,
      type: 'record_submit',
      description: `${record.nickname || '匿名用户'} 提交了 ${record.event} 成绩`,
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
    
    // 获取真实访问量统计
    const visitsRes = await db.collection('visits').get()
    const visits = visitsRes.data || []
    
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
    
    const visitStats = {
      totalVisits: visits.length,
      visitsToday: visits.filter(v => v.date === today).length,
      visitsThisMonth: visits.filter(v => v.date && v.date.startsWith(thisMonth)).length,
      uniqueIPs: [...new Set(visits.map(v => v.ip))].length
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
