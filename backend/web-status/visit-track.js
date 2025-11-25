import cloud from '@lafjs/cloud'

export default async function (ctx) {
  try {
    const db = cloud.database()
    const { page, userAgent, referrer } = ctx.request.body || {}
    
    // 获取访问者信息
    const clientIP = ctx.request.headers['x-forwarded-for'] || 
                     ctx.request.headers['x-real-ip'] || 
                     ctx.request.connection?.remoteAddress || 
                     'unknown'
    
    // 记录访问
    const visitData = {
      page: page || '/',
      timestamp: new Date(),
      ip: clientIP,
      userAgent: userAgent || ctx.request.headers['user-agent'] || '',
      referrer: referrer || ctx.request.headers.referer || '',
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD格式
    }
    
    // 存储到visits集合
    await db.collection('visits').add(visitData)
    
    return { code: 200, message: '访问记录成功' }
    
  } catch (error) {
    console.error('visit-track 接口异常:', error)
    return { code: 500, message: '服务端错误: ' + (error?.message || String(error)) }
  }
}
