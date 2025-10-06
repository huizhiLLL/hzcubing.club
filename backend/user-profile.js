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

export default async function (ctx) {
  try {
    // 验证用户登录状态
    const currentUser = await verifyToken(ctx)
    if (!currentUser) {
      return { code: 401, message: '未登录或token无效' }
    }
    
    if (currentUser.status !== 'active') {
      return { code: 403, message: '账户已被禁用' }
    }

    const db = cloud.database()
    const { nickname, wcaId, bio } = ctx.request.body || {}

    // 验证必填字段
    if (!nickname) {
      return { code: 400, message: '昵称是必填项' }
    }

    // 用户只能修改自己的资料
    const userId = currentUser._id

    // 更新用户信息
    await db.collection('users').doc(userId).update({
      nickname,
      wcaId,
      bio,
      updateTime: new Date()
    })

    // 获取更新后的用户信息
    const updatedUserRes = await db.collection('users').doc(userId).get()
    const updatedUser = updatedUserRes.data
    
    // 确保返回role和status字段
    updatedUser.role = updatedUser.role || 'user'
    updatedUser.status = updatedUser.status || 'active'

    return {
      code: 200,
      message: '更新成功',
      data: updatedUser
    }

  } catch (error) {
    console.error('更新用户资料失败:', error)
    return { code: 500, message: '更新失败，请稍后重试' }
  }
}