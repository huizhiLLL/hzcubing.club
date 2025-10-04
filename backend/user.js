import cloud from '@lafjs/cloud'

export default async function (ctx) {
  try {
    // 获取用户ID
    const { userId } = ctx.query

    if (!userId) {
      return {
        code: 1,
        message: '缺少用户ID参数'
      }
    }

    // 获取数据库引用
    const db = cloud.database()

    // 查询用户信息
    const user = await db.collection('users').doc(userId).get()

    if (!user.data) {
      return {
        code: 1,
        message: '用户不存在'
      }
    }

    // 排除敏感信息
    const { password, ...safeUserData } = user.data

    return {
      code: 0,
      message: '获取用户信息成功',
      data: safeUserData
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return {
      code: 1,
      message: '获取用户信息失败: ' + error.message
    }
  }
}