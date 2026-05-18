/**
 * 用户认证云函数
 * 支持: register / login / checkSession / updateAvatar
 */
const crypto = require('crypto');
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

/**
 * PBKDF2 密码哈希
 */
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  switch (action) {
    case 'register':
      return register(event, OPENID);
    case 'login':
      return login(event, OPENID);
    case 'checkSession':
      return checkSession(OPENID);
    case 'updateAvatar':
      return updateAvatar(event, OPENID);
    default:
      return { ok: false, error: '未知操作' };
  }
};

/**
 * 注册新用户
 */
async function register(event, openid) {
  const { username, password, avatarUrl } = event;

  if (!username || !username.trim()) {
    return { ok: false, error: '请输入用户名' };
  }
  if (!password || password.length < 4) {
    return { ok: false, error: '密码至少 4 位' };
  }

  const trimmedName = username.trim();

  try {
    // 检查用户名是否已存在
    const existResult = await db.collection('users')
      .where({ username: trimmedName })
      .count();

    if (existResult.total > 0) {
      return { ok: false, error: '用户名已被占用' };
    }

    // 检查该 openid 是否已注册
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .count();

    if (userResult.total > 0) {
      return { ok: false, error: '该微信账号已注册' };
    }

    // 创建用户
    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const now = Date.now();

    const addResult = await db.collection('users').add({
      data: {
        username: trimmedName,
        password_hash: passwordHash,
        salt: salt,
        avatar_url: avatarUrl || '',
        created_at: now,
        updated_at: now
      }
    });

    const user = {
      _id: addResult._id,
      username: trimmedName,
      avatar_url: avatarUrl || '',
      created_at: now
    };

    return { ok: true, user };
  } catch (err) {
    console.error('[userAuth] 注册失败:', err);
    return { ok: false, error: '注册失败，请稍后重试' };
  }
}

/**
 * 用户登录
 */
async function login(event, openid) {
  const { username, password } = event;

  if (!username || !password) {
    return { ok: false, error: '请输入用户名和密码' };
  }

  try {
    const result = await db.collection('users')
      .where({ username: username.trim() })
      .get();

    if (result.data.length === 0) {
      return { ok: false, error: '用户名不存在' };
    }

    const record = result.data[0];
    const passwordHash = hashPassword(password, record.salt);

    if (passwordHash !== record.password_hash) {
      return { ok: false, error: '密码错误' };
    }

    // 如果 openid 不匹配（用户换了微信或首次登录绑定了 openid），更新 openid
    // 云开发会自动为每条记录加 _openid，首次创建才有，这里不处理迁移

    const user = {
      _id: record._id,
      username: record.username,
      avatar_url: record.avatar_url || '',
      created_at: record.created_at
    };

    return { ok: true, user };
  } catch (err) {
    console.error('[userAuth] 登录失败:', err);
    return { ok: false, error: '登录失败，请稍后重试' };
  }
}

/**
 * 检查会话（自动登录）
 * 通过 openid 查找已注册的用户
 */
async function checkSession(openid) {
  try {
    const result = await db.collection('users')
      .where({ _openid: openid })
      .get();

    if (result.data.length === 0) {
      return { ok: false, error: '未注册' };
    }

    const record = result.data[0];
    const user = {
      _id: record._id,
      username: record.username,
      avatar_url: record.avatar_url || '',
      created_at: record.created_at
    };

    return { ok: true, user };
  } catch (err) {
    console.error('[userAuth] 会话检查失败:', err);
    return { ok: false, error: '会话检查失败' };
  }
}

/**
 * 更新用户头像
 */
async function updateAvatar(event, openid) {
  const { avatarUrl } = event;

  if (!avatarUrl) {
    return { ok: false, error: '请提供头像' };
  }

  try {
    await db.collection('users')
      .where({ _openid: openid })
      .update({
        data: {
          avatar_url: avatarUrl,
          updated_at: Date.now()
        }
      });

    return { ok: true, avatar_url: avatarUrl };
  } catch (err) {
    console.error('[userAuth] 更新头像失败:', err);
    return { ok: false, error: '更新头像失败' };
  }
}
