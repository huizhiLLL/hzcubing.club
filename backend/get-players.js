import cloud from '@lafjs/cloud'

export default async function (ctx) {
  try {
    // 获取数据库引用
    const db = cloud.database()

    // 查询users集合中的所有用户
    const { data: users } = await db.collection('users')
      .field({
        // 排除敏感信息，只返回需要的字段
        email: true,
        nickname: true,
        bio: true,
        avatar: true,
        createTime: true,
        wcaId:true
      })
      .orderBy('createTime', 'desc') // 按注册时间降序排列
      .get()

    // 返回成功响应
    return {
      code: 0,
      message: '获取选手列表成功',
      data: users
    }
  } catch (error) {
    // 记录错误日志
    console.error('获取选手列表失败:', error)

    // 返回错误响应
    return {
      code: 1,
      message: '获取选手列表失败: ' + error.message
    }
  }
} // 添加了这个闭合的花括号