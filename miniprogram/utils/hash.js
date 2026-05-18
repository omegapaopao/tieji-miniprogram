/**
 * 客户端密码哈希工具
 * 多重混淆 + 盐值，适配小程序环境
 */

/**
 * DJB2 哈希（快速字符串哈希）
 */
function djb2(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // 32-bit
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * FNV-1a 哈希
 */
function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * 生成随机盐值
 */
function generateSalt() {
  const r1 = Math.random().toString(36).substring(2, 10);
  const r2 = Date.now().toString(36);
  const r3 = Math.random().toString(36).substring(2, 10);
  return r1 + r2 + r3;
}

/**
 * 密码哈希 — 交替使用两种哈希算法，多轮迭代
 */
function hashPassword(password, salt) {
  let result = salt + password + salt;
  for (let i = 0; i < 2000; i++) {
    result = i % 2 === 0
      ? djb2(result + salt + String(i))
      : fnv1a(result + salt + String(i));
  }
  return result;
}

/**
 * 验证密码
 */
function verifyPassword(password, salt, hash) {
  return hashPassword(password, salt) === hash;
}

module.exports = {
  hashPassword,
  generateSalt,
  verifyPassword
};
