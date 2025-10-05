import cloud from '@lafjs/cloud'

export default async function (ctx) {
  try {
    // 获取用户ID
    const { userId } = ctx.query

    if (!userId) {
      return {
        code: 400,
        message: '缺少用户ID参数'
      }
    }

    // 获取数据库引用
    const db = cloud.database()

    // 查询用户信息
    const user = await db.collection('users').doc(userId).get()

    if (!user.data) {
      return {
        code: 404,
        message: '用户不存在'
      }
    }

    // 排除敏感信息并添加默认角色
    const { password, ...safeUserData } = user.data
    safeUserData.role = safeUserData.role || 'user'
    safeUserData.status = safeUserData.status || 'active'

    return {
      code: 200,
      message: '获取用户信息成功',
      data: safeUserData
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      code: 500,
      message: '获取用户信息失败: ' + error.message
    }
  }
}