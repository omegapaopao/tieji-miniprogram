/**
 * 铁记 — 动作库管理云函数
 *
 * 功能:
 *   - 获取动作列表 (list)
 *   - 添加自定义动作 (add)
 *   - 删除自定义动作 (delete)
 *   - 初始化预置动作 (initPreset) — 仅首次使用
 *
 * 调用方式:
 *   wx.cloud.callFunction({ name: 'exerciseLibrary', data: { action: 'list', ... } })
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION = 'exercise_library';

/**
 * 预置动作数据
 */
const PRESET_EXERCISES = [
  // 胸
  { name: '卧推', category: '胸', is_custom: false },
  { name: '哑铃飞鸟', category: '胸', is_custom: false },
  { name: '上斜卧推', category: '胸', is_custom: false },
  // 背
  { name: '引体向上', category: '背', is_custom: false },
  { name: '杠铃划船', category: '背', is_custom: false },
  { name: '高位下拉', category: '背', is_custom: false },
  // 腿
  { name: '深蹲', category: '腿', is_custom: false },
  { name: '硬拉', category: '腿', is_custom: false },
  { name: '腿举', category: '腿', is_custom: false },
  // 肩
  { name: '推举', category: '肩', is_custom: false },
  { name: '侧平举', category: '肩', is_custom: false },
  { name: '面拉', category: '肩', is_custom: false },
  // 臂
  { name: '杠铃弯举', category: '臂', is_custom: false },
  { name: '三头下压', category: '臂', is_custom: false }
];

/**
 * 获取动作列表
 */
async function list(params) {
  const { category } = params;

  const condition = {};
  if (category && category !== 'all') {
    condition.category = category;
  }

  try {
    const result = await db.collection(COLLECTION)
      .where(condition)
      .orderBy('created_at', 'asc')
      .get();

    return { code: 0, data: { exercises: result.data }, message: 'ok' };
  } catch (err) {
    console.error('[exerciseLibrary] 查询失败:', err);
    return { code: -1, message: `查询失败: ${err.message}` };
  }
}

/**
 * 添加自定义动作
 */
async function add(params) {
  const { name, category } = params;

  if (!name || !name.trim()) {
    return { code: -1, message: '动作名称不能为空' };
  }
  if (!category) {
    return { code: -1, message: '请选择分类' };
  }

  // 检查是否已存在同名动作
  const existing = await db.collection(COLLECTION)
    .where({ name: name.trim() })
    .count();

  if (existing.total > 0) {
    return { code: -1, message: '该动作已存在' };
  }

  try {
    const result = await db.collection(COLLECTION).add({
      data: {
        name: name.trim(),
        category: category,
        is_custom: true,
        created_at: Date.now()
      }
    });

    return { code: 0, data: { id: result._id }, message: '动作已添加' };
  } catch (err) {
    console.error('[exerciseLibrary] 添加失败:', err);
    return { code: -1, message: `添加失败: ${err.message}` };
  }
}

/**
 * 删除自定义动作（只能删除 is_custom = true 的动作）
 */
async function remove(params) {
  const { id } = params;
  if (!id) return { code: -1, message: '缺少动作 id' };

  try {
    // 检查是否为自定义动作
    const doc = await db.collection(COLLECTION).doc(id).get();
    if (!doc.data) {
      return { code: -1, message: '动作不存在' };
    }
    if (!doc.data.is_custom) {
      return { code: -1, message: '预置动作无法删除' };
    }

    await db.collection(COLLECTION).doc(id).remove();
    return { code: 0, message: '动作已删除' };
  } catch (err) {
    console.error('[exerciseLibrary] 删除失败:', err);
    return { code: -1, message: `删除失败: ${err.message}` };
  }
}

/**
 * 初始化预置动作（仅在动作库为空时执行）
 */
async function initPreset() {
  try {
    const count = await db.collection(COLLECTION).count();
    if (count.total > 0) {
      return { code: 0, message: `动作库已有 ${count.total} 个动作，跳过初始化` };
    }

    for (const exercise of PRESET_EXERCISES) {
      await db.collection(COLLECTION).add({
        data: { ...exercise, created_at: Date.now() }
      });
    }

    return { code: 0, data: { count: PRESET_EXERCISES.length }, message: `已初始化 ${PRESET_EXERCISES.length} 个预置动作` };
  } catch (err) {
    console.error('[exerciseLibrary] 初始化失败:', err);
    return { code: -1, message: `初始化失败: ${err.message}` };
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { action, ...params } = event;

  switch (action) {
    case 'list':
      return await list(params);
    case 'add':
      return await add(params);
    case 'delete':
      return await remove(params);
    case 'initPreset':
      return await initPreset();
    default:
      return { code: -1, message: `未知操作: ${action}，支持: list, add, delete, initPreset` };
  }
};
