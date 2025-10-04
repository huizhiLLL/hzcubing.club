import cloud from '@lafjs/cloud';

export default async function (ctx) {
  const { email, password, nickname, bio } = ctx.request.body;

  // 字段校验
  if (!email || !password || !nickname) {
    return { code: 400, message: '缺少必要字段' };
  }

  try {
    const db = cloud.database();

    // 检查邮箱是否已存在
    const { data: existingUser } = await db.collection('users').where({ email }).get();

    if (existingUser && existingUser.length > 0) {
      return { code: 400, message: '该邮箱已被注册' };
    }

    // 创建新用户
    const { id } = await db.collection('users').add({
      email,
      password,
      nickname,
      bio,
      avatar: null,
      createTime: new Date()
    });

    // 返回成功响应
    return {
      code: 200,
      data: {
        id,
        email,
        nickname,
        bio,
        avatar: null
      }
    };

  } catch (error) {
    console.error('注册接口异常:', error);
    return { code: 500, message: '服务器内部错误' };
  }
}