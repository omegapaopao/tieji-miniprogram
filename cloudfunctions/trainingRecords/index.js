/**
 * 铁记 — 训练记录云函数
 *
 * 功能:
 *   - 添加训练记录 (add)
 *   - 查询训练记录 (list)：支持按日期范围、动作名称筛选
 *   - 删除训练记录 (delete)
 *   - 批量删除某日记录 (deleteByDate)
 *   - 统计数据 (stats)：本周/本月/总计
 *
 * 调用方式 (微信小程序端):
 *   wx.cloud.callFunction({ name: 'trainingRecords', data: { action: 'add', ... } })
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const COLLECTION = 'training_records';

/**
 * 添加训练记录
 */
async function add(params) {
  const { date, action_name, category, weight, sets, reps, volume, one_rm, rest_time } = params;

  // 参数校验
  if (!date || !action_name || !weight || !sets || !reps) {
    return { code: -1, message: '缺少必要参数: date, action_name, weight, sets, reps' };
  }

  const record = {
    date: String(date),
    action_name: String(action_name),
    category: category || '',
    weight: parseFloat(weight),
    sets: parseInt(sets),
    reps: parseInt(reps),
    volume: volume || parseFloat(weight) * parseInt(sets) * parseInt(reps),
    one_rm: one_rm || parseFloat(weight) * (1 + parseInt(reps) / 30),
    rest_time: rest_time || null,
    created_at: Date.now()
  };

  try {
    const result = await db.collection(COLLECTION).add({ data: record });
    return { code: 0, data: { id: result._id }, message: '记录已保存' };
  } catch (err) {
    console.error('[trainingRecords] 添加失败:', err);
    return { code: -1, message: `添加失败: ${err.message}` };
  }
}

/**
 * 查询训练记录
 * 支持: 按日期范围、动作名称、分页
 */
async function list(params) {
  const { startDate, endDate, actionName, skip, limit } = params;

  // 构建查询条件
  const condition = {};
  if (startDate) condition.date = db.command.gte(startDate);
  if (endDate) condition.date = condition.date
    ? condition.date.and(db.command.lte(endDate))
    : db.command.lte(endDate);
  if (actionName) condition.action_name = actionName;

  const skipCount = parseInt(skip) || 0;
  const limitCount = Math.min(parseInt(limit) || 20, 100); // 最多 100 条

  try {
    let query = db.collection(COLLECTION)
      .where(condition)
      .orderBy('created_at', 'desc')
      .skip(skipCount)
      .limit(limitCount);

    const result = await query.get();

    return {
      code: 0,
      data: {
        records: result.data,
        total: result.data.length,
        skip: skipCount,
        limit: limitCount
      },
      message: '查询成功'
    };
  } catch (err) {
    console.error('[trainingRecords] 查询失败:', err);
    return { code: -1, message: `查询失败: ${err.message}` };
  }
}

/**
 * 删除单条记录
 */
async function remove(params) {
  const { id } = params;
  if (!id) return { code: -1, message: '缺少记录 id' };

  try {
    await db.collection(COLLECTION).doc(id).remove();
    return { code: 0, message: '记录已删除' };
  } catch (err) {
    console.error('[trainingRecords] 删除失败:', err);
    return { code: -1, message: `删除失败: ${err.message}` };
  }
}

/**
 * 批量删除某日期的全部记录
 */
async function removeByDate(params) {
  const { date } = params;
  if (!date) return { code: -1, message: '缺少日期参数' };

  try {
    const result = await db.collection(COLLECTION)
      .where({ date: String(date) })
      .get();

    // 逐条删除（云开发批量删除需遍历）
    const deletePromises = result.data.map(record =>
      db.collection(COLLECTION).doc(record._id).remove()
    );
    await Promise.all(deletePromises);

    return { code: 0, data: { deletedCount: result.data.length }, message: `已删除 ${result.data.length} 条记录` };
  } catch (err) {
    console.error('[trainingRecords] 批量删除失败:', err);
    return { code: -1, message: `批量删除失败: ${err.message}` };
  }
}

/**
 * 统计数据
 * 返回：总记录数、总训练天数、累计容量
 */
async function stats(params) {
  try {
    const result = await db.collection(COLLECTION)
      .orderBy('created_at', 'desc')
      .limit(1000)
      .get();

    const records = result.data;
    const dates = new Set(records.map(r => r.date));
    const totalVolume = records.reduce((sum, r) => sum + (r.volume || 0), 0);

    // 按动作名统计
    const actionCount = {};
    records.forEach(r => {
      actionCount[r.action_name] = (actionCount[r.action_name] || 0) + 1;
    });
    const topActions = Object.entries(actionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      code: 0,
      data: {
        totalRecords: records.length,
        totalDays: dates.size,
        totalVolume: Math.round(totalVolume),
        topActions
      },
      message: 'ok'
    };
  } catch (err) {
    console.error('[trainingRecords] 统计失败:', err);
    return { code: -1, message: `统计失败: ${err.message}` };
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const { action, ...params } = event;

  switch (action) {
    case 'add':
      return await add(params);
    case 'list':
      return await list(params);
    case 'delete':
      return await remove(params);
    case 'deleteByDate':
      return await removeByDate(params);
    case 'stats':
      return await stats(params);
    default:
      return { code: -1, message: `未知操作: ${action}，支持: add, list, delete, deleteByDate, stats` };
  }
};
