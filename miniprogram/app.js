/**
 * 铁记 — 力量训练日志微信小程序
 * 全局入口：初始化云开发 + 全局数据共享
 */
const env = require('./env.js');
const exerciseData = require('./utils/exercise_data.js');

App({
  onLaunch() {
    console.log('[铁记] 小程序启动');

    if (wx.cloud) {
      wx.cloud.init({
        env: env.cloudEnvId,
        traceUser: true
      });
      console.log('[铁记] 云开发初始化完成, 环境:', env.cloudEnvId);
    } else {
      console.warn('[铁记] 当前版本不支持云开发，请使用 2.2.3 以上基础库');
    }

    // 动作库初始化是异步的，保存 promise 供页面等待
    this.globalData._exercisesInitPromise = this.initPresetExercises();
    this.globalData._exercisesInitPromise.then(() => {
      this.globalData.exercisesReady = true;
    });
    this.checkAutoLogin();
  },

  globalData: {
    cloudEnvId: env.cloudEnvId,
    user: null,
    isAuthChecked: false,
    exercises: [],
    todayRecords: [],
    currentDate: '',
    exercisesReady: false,
    _exercisesInitPromise: null
  },

  async checkAutoLogin() {
    const storedUser = wx.getStorageSync('user');

    if (storedUser && storedUser._id && storedUser.username) {
      try {
        const db = wx.cloud.database();
        const result = await db.collection('users')
          .where({ username: storedUser.username })
          .get();

        if (result.data.length > 0) {
          const record = result.data[0];
          this.globalData.user = {
            _id: record._id,
            username: record.username,
            avatar_url: record.avatar_url || '',
            created_at: record.created_at
          };
          wx.setStorageSync('user', this.globalData.user);
          console.log('[铁记] 自动登录成功:', record.username);
        } else {
          wx.removeStorageSync('user');
          this.globalData.user = null;
        }
      } catch (err) {
        console.error('[铁记] 自动登录检查失败:', err);
        this.globalData.user = storedUser;
      }
    }

    this.globalData.isAuthChecked = true;
  },

  /**
   * 分页拉取全部动作（客户端 get 硬限制 20 条/次）
   */
  async fetchAllExercises() {
    const db = this.getDb();
    if (!db) return [];

    const PAGE = 20;
    let all = [];
    let skip = 0;
    while (true) {
      const batch = await db.collection('exercise_library')
        .orderBy('created_at', 'asc')
        .skip(skip)
        .limit(PAGE)
        .get();
      all = all.concat(batch.data);
      if (batch.data.length < PAGE) break;
      skip += PAGE;
    }
    return all;
  },

  /**
   * 初始化预置动作库 — 分页比对 + 去重 + 补全
   */
  async initPresetExercises() {
    if (!wx.cloud) return;

    const db = wx.cloud.database();
    const presetNames = exerciseData.presetExercises.map(e => e.name);

    try {
      // 分页拉取全量动作
      const all = await this.fetchAllExercises();

      const nonCustom = all.filter(e => e.is_custom !== true);
      const custom = all.filter(e => e.is_custom === true);

      // 检测重复（错误迁移可能造成同名旧记录残留）
      const nameCounts = {};
      for (const item of nonCustom) {
        nameCounts[item.name] = (nameCounts[item.name] || 0) + 1;
      }
      const hasDuplicates = Object.values(nameCounts).some(c => c > 1);
      const existingPresetNames = new Set(Object.keys(nameCounts));
      const missing = presetNames.filter(n => !existingPresetNames.has(n));

      if (!hasDuplicates && missing.length === 0) {
        console.log('[铁记] 动作库已完整, 预置', existingPresetNames.size, '个 + 自定义', custom.length, '个');
        return;
      }

      // 有重复：先删全部非自定义动作再重建；否则只补缺
      if (hasDuplicates) {
        console.log('[铁记] 清理', nonCustom.length, '条非自定义动作...');
        for (const item of nonCustom) {
          await db.collection('exercise_library').doc(item._id).remove();
        }
      }

      const toAdd = hasDuplicates ? exerciseData.presetExercises : missing;
      const now = Date.now();
      for (const exercise of toAdd) {
        await db.collection('exercise_library').add({
          data: {
            name: exercise.name,
            category: exercise.category,
            target: exercise.target || '',
            is_custom: false,
            created_at: now
          }
        });
      }

      console.log('[铁记] 动作库同步完成, 新增', toAdd.length, '个');
    } catch (err) {
      console.error('[铁记] 动作库初始化失败:', err);
    }
  },

  /**
   * 等待动作库初始化完成（页面在 loadExercises 前调用）
   */
  async waitForExercisesReady() {
    if (this.globalData.exercisesReady) return;
    if (this.globalData._exercisesInitPromise) {
      await this.globalData._exercisesInitPromise;
    }
  },

  getDb() {
    return wx.cloud ? wx.cloud.database() : null;
  }
});
