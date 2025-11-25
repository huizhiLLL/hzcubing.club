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
    // 验证用户权限
    const currentUser = await verifyToken(ctx)
    if (!currentUser || currentUser.role !== 'super_admin') {
      return { code: 403, message: '权限不足，仅超级管理员可操作' }
    }
    
    if (currentUser.status !== 'active') {
      return { code: 403, message: '账户已被禁用' }
    }
    
    const db = cloud.database()
    const { userId, status } = ctx.request.body || {}
    
    if (!userId || !status) {
      return { code: 400, message: '缺少必要参数' }
    }
    
    // 验证状态值
    const validStatuses = ['active', 'inactive', 'banned']
    if (!validStatuses.includes(status)) {
      return { code: 400, message: '无效的状态值' }
    }
    
    // 检查用户是否存在
    const userRes = await db.collection('users').doc(userId).get()
    if (!userRes.data) {
      return { code: 404, message: '用户不存在' }
    }
    
    // 更新用户状态
    await db.collection('users').doc(userId).update({
      status: status,
      updatedAt: new Date()
    })
    
    return { code: 200, message: '用户状态更新成功' }
    
  } catch (error) {
    console.error('user-status 接口异常:', error)
    return { code: 500, message: '服务端错误: ' + (error?.message || String(error)) }
  }
}
