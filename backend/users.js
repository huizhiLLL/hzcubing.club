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
      
      // 从数据库获取用户信息
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

export default async function (ctx) {
  try {
    // 验证用户权限
    const currentUser = await verifyToken(ctx)
    if (!currentUser || currentUser.role !== 'super_admin') {
      return { code: 403, message: '权限不足，仅超级管理员可访问' }
    }
    
    if (currentUser.status !== 'active') {
      return { code: 403, message: '账户已被禁用' }
    }
    
    const db = cloud.database()
    const { page = 1, pageSize = 50, role } = ctx.query || {}
    
    const p = Math.max(1, parseInt(page))
    const ps = Math.min(200, Math.max(1, parseInt(pageSize)))
    
    // 构建查询条件
    const condition = {}
    if (role) {
      condition.role = role
    }
    
    const col = db.collection('users')
    
    // 获取总数
    let total = null
    try {
      const countRes = await col.where(condition).count?.()
      total = countRes?.total ?? null
    } catch { 
      total = null 
    }
    
    // 获取用户列表
    const listRes = await col.where(condition)
      .orderBy('createTime', 'desc')
      .skip((p - 1) * ps)
      .limit(ps)
      .field({
        _id: true,
        email: true,
        nickname: true,
        role: true,
        avatar: true,
        createTime: true,
        lastLoginTime: true,
        status: true
      })
      .get()
    
    const data = (listRes.data || []).map(user => ({
      ...user,
      role: user.role || 'user', // 默认角色为user
      status: user.status || 'active' // 默认状态为active
    }))
    
    return { 
      code: 200, 
      message: '获取成功', 
      data, 
      page: p, 
      pageSize: ps, 
      total 
    }
    
  } catch (error) {
    console.error('users 接口异常:', error)
    return { code: 500, message: '服务端错误: ' + (error?.message || String(error)) }
  }
}
