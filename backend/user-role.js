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
      return null
    }
  } catch (error) {
    return null
  }
}

export default async function (ctx) {
  try {
    const db = cloud.database()
    const method = ctx.method
    
    // 获取用户角色
    if (method === 'GET') {
      const { userId } = ctx.query || {}
      if (!userId) {
        return { code: 400, message: '缺少用户ID参数' }
      }
      
      const userRes = await db.collection('users').doc(userId).get()
      if (!userRes.data) {
        return { code: 404, message: '用户不存在' }
      }
      
      const role = userRes.data.role || 'user'
      return { 
        code: 200, 
        message: '获取成功', 
        data: { 
          userId, 
          role,
          nickname: userRes.data.nickname,
          email: userRes.data.email
        } 
      }
    }
    
    // 更新用户角色（仅超级管理员可操作）
    if (method === 'PUT') {
      const { userId, role } = ctx.request.body || {}
      
      if (!userId || !role) {
        return { code: 400, message: '缺少必要参数' }
      }
      
      // 验证角色值
      const validRoles = ['guest', 'user', 'admin', 'super_admin']
      if (!validRoles.includes(role)) {
        return { code: 400, message: '无效的角色值' }
      }
      
      // 验证当前用户是否为超级管理员
      const currentUser = await verifyToken(ctx)
      if (!currentUser || currentUser.role !== 'super_admin') {
        return { code: 403, message: '权限不足，仅超级管理员可操作' }
      }
      
      await db.collection('users').doc(userId).update({
        role: role,
        updatedAt: new Date()
      })
      
      return { code: 200, message: '角色更新成功' }
    }
    
    return { code: 405, message: '不支持的请求方法' }
    
  } catch (error) {
    console.error('user-role 接口异常:', error)
    return { code: 500, message: '服务端错误: ' + (error?.message || String(error)) }
  }
}
