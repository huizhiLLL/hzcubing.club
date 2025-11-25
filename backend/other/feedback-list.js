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
    const { page = 1, pageSize = 50 } = ctx.query || {}
    
    const p = Math.max(1, parseInt(page))
    const ps = Math.min(200, Math.max(1, parseInt(pageSize)))
    
    // 获取反馈列表（注意：feedback.js使用的是feedbacks集合）
    const feedbackRes = await db.collection('feedbacks')
      .orderBy('createdAt', 'desc')
      .skip((p - 1) * ps)
      .limit(ps)
      .get()
    
    // 获取总数
    let total = null
    try {
      const countRes = await db.collection('feedbacks').count()
      total = countRes?.total ?? null
    } catch { 
      total = null 
    }
    
    const data = (feedbackRes.data || []).map(feedback => ({
      ...feedback,
      timestamp: feedback.createdAt || feedback.timestamp || new Date().toISOString()
    }))
    
    return {
      code: 200,
      message: '获取反馈列表成功',
      data,
      page: p,
      pageSize: ps,
      total
    }
    
  } catch (error) {
    console.error('feedback-list 接口异常:', error)
    return { code: 500, message: '服务端错误: ' + (error?.message || String(error)) }
  }
}
