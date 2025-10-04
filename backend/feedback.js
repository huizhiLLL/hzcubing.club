import cloud from '@lafjs/cloud'

export default async function (ctx) {
  // 添加 CORS 头
  ctx.response.set('Access-Control-Allow-Origin', '*')
  ctx.response.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  ctx.response.set('Access-Control-Allow-Headers', 'Content-Type')

  // 处理 OPTIONS 请求
  if (ctx.method === 'OPTIONS') {
    return { code: 0 }
  }

  // 验证请求体
  if (!ctx.body || typeof ctx.body !== 'object') {
    return {
      code: 1,
      message: '无效的请求数据'
    }
  }

  const { nickname, content } = ctx.body

  // 验证必填字段
  if (!content || typeof content !== 'string') {
    return {
      code: 1,
      message: '反馈内容不能为空'
    }
  }

  const db = cloud.database()

  try {
    // 创建反馈记录
    const result = await db.collection('feedbacks').add({
      nickname: nickname || '匿名用户',
      content,
      createdAt: new Date(),
      status: 'pending' // pending, processed
    })

    return {
      code: 0,
      data: result,
      message: '反馈提交成功'
    }
  } catch (error) {
    console.error('保存反馈失败:', error)
    return {
      code: 1,
      error: error.message,
      message: '反馈提交失败'
    }
  }
}