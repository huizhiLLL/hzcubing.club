import cloud from '@lafjs/cloud';
import jwt from 'jsonwebtoken';

export default async function (ctx) {
  const { email, password } = ctx.request.body;

  // 字段校验
  if (!email || !password) {
    return { code: 400, message: '缺少必要字段' };
  }

  try {
    const db = cloud.database();

    // 查询用户
    const { data: user } = await db.collection('users').where({ email }).get();

    if (!user || user.length === 0) {
      return { code: 404, message: '用户不存在' };
    }

    if (user[0].password !== password) {
      return { code: 401, message: '密码错误' };
    }

    // ✅ 使用 jsonwebtoken 手动生成 token
    const secret = '3#x!L9@qAaBvTmZ$8KpQwE2^VdF7'; // 推荐在环境变量中配置
    const expiresIn = '365d'; // token 有效期

    const token = jwt.sign(
      {
        uid: user[0]._id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7天后过期
      },
      secret,
      { algorithm: 'HS256' }
    );

    // 返回用户信息和 token
    return {
      code: 200,
      data: {
        token,
        user: {
          id: user[0]._id,
          email: user[0].email,
          nickname: user[0].nickname,
          bio: user[0].bio,
          avatar: user[0].avatar
        }
      }
    };

  } catch (error) {
    console.error('登录接口异常:', error);
    return { code: 500, message: '服务器内部错误' };
  }
}