import cloud from '@lafjs/cloud'
import jwt from 'jsonwebtoken'

export default async function (ctx) {
  try {
    // 打印请求头中的 Authorization
    console.log('收到初始化请求:', ctx.request.headers.authorization);

    // 获取 Token
    const authHeader = ctx.request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { code: 401, message: '缺少或无效的 Token' };
    }

    const token = authHeader.split(' ')[1];
    console.log('解析 Token:', token);

    // 解码 Token
    let decoded;
    try {
      decoded = jwt.verify(token, cloud.env.JWT_SECRET);
      console.log('解码成功:', decoded);
    } catch (err) {
      console.error('Token 解码失败:', err.message);
      return { code: 401, message: '无效 Token' };
    }

    // 获取 uid
    const uid = decoded.uid;
    if (!uid) {
      return { code: 401, message: 'Token 中缺少 uid' };
    }

    // 查询用户
    const db = cloud.database();

    // 尝试多种方式查询用户
    let user = null;

    // 先尝试使用uid作为id查询
    const { data: userById } = await db.collection('users').where({ id: uid }).getOne();
    if (userById) {
      user = userById;
      console.log('通过id找到用户:', user);
    } else {
      // 如果没找到，尝试使用uid作为_id查询
      const { data: userById_id } = await db.collection('users').doc(uid).get();
      if (userById_id) {
        user = userById_id;
        console.log('通过_id找到用户:', user);
      }
    }

    if (!user) {
      console.warn(`用户 ${uid} 不存在`);
      return { code: 404, message: '用户不存在' };
    }

    // 确保用户同时有id和_id字段
    if (!user._id && user.id) {
      user._id = user.id;
    }
    if (!user.id && user._id) {
      user.id = user._id;
    }

    // 返回用户信息
    const { password, ...userInfo } = user;
    console.log('返回用户信息:', userInfo);
    return { code: 200, data: userInfo };

  } catch (error) {
    console.error('初始化用户失败:', error);
    return {
      code: 500,
      message: '服务器内部错误',
      error: error.message
    };
  }
}