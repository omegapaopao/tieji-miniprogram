/**
 * 铁记 — 力量训练日志微信小程序
 * 全局入口：初始化云开发 + 全局数据共享
 */
const env = require('./env.js');

App({
  onLaunch() {
    console.log('[铁记] 小程序启动');

    // 初始化微信云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: env.cloudEnvId,
        traceUser: true
      });
      console.log('[铁记] 云开发初始化完成, 环境:', env.cloudEnvId);
    } else {
      console.warn('[铁记] 当前版本不支持云开发，请使用 2.2.3 以上基础库');
    }

    // 初始化预置动作库（首次使用时写入云数据库）
    this.initPresetExercises();

    // 自动登录检测
    this.checkAutoLogin();
  },

  /**
   * 自动登录检测
   * 本地存储有用户数据 → 去数据库验证该用户名仍存在 → 恢复登录态
   */
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
          console.log('[铁记] 用户数据不存在，需重新登录');
        }
      } catch (err) {
        console.error('[铁记] 自动登录检查失败:', err);
        // 网络异常时保留本地数据，允许离线使用
        this.globalData.user = storedUser;
      }
    } else {
      console.log('[铁记] 未登录，请先注册或登录');
    }

    this.globalData.isAuthChecked = true;
  },

  /**
   * 全局共享数据
   */
  globalData: {
    cloudEnvId: env.cloudEnvId,
    user: null,             // 当前登录用户信息
    isAuthChecked: false,   // 是否已完成登录检查
    exercises: [],          // 动作库缓存
    todayRecords: [],       // 今日训练记录缓存
    currentDate: ''         // 当前选中日期
  },

  /**
   * 首次使用时初始化预置动作库到云数据库
   * 仅在用户动作库为空时写入
   */
  async initPresetExercises() {
    if (!wx.cloud) return;

    const db = wx.cloud.database();

    try {
      // 检查是否已有数据（直接查总数，不依赖 _openid 条件）
      const existing = await db.collection('exercise_library').count();

      if (existing.total > 0) {
        console.log('[铁记] 动作库已存在, 共', existing.total, '个动作');
        return;
      }

      // 写入预置动作
      const now = Date.now();
      const presetExercises = [
        // 胸
        { name: '卧推', category: '胸', is_custom: false, created_at: now },
        { name: '哑铃飞鸟', category: '胸', is_custom: false, created_at: now },
        { name: '上斜卧推', category: '胸', is_custom: false, created_at: now },
        // 背
        { name: '引体向上', category: '背', is_custom: false, created_at: now },
        { name: '杠铃划船', category: '背', is_custom: false, created_at: now },
        { name: '高位下拉', category: '背', is_custom: false, created_at: now },
        // 腿
        { name: '深蹲', category: '腿', is_custom: false, created_at: now },
        { name: '硬拉', category: '腿', is_custom: false, created_at: now },
        { name: '腿举', category: '腿', is_custom: false, created_at: now },
        // 肩
        { name: '推举', category: '肩', is_custom: false, created_at: now },
        { name: '侧平举', category: '肩', is_custom: false, created_at: now },
        { name: '面拉', category: '肩', is_custom: false, created_at: now },
        // 臂
        { name: '杠铃弯举', category: '臂', is_custom: false, created_at: now },
        { name: '三头下压', category: '臂', is_custom: false, created_at: now }
      ];

      for (const exercise of presetExercises) {
        await db.collection('exercise_library').add({ data: exercise });
      }

      console.log('[铁记] 预置动作库初始化完成, 共', presetExercises.length, '个动作');
    } catch (err) {
      console.error('[铁记] 动作库初始化失败:', err);
    }
  },

  /**
   * 获取云数据库实例
   */
  getDb() {
    return wx.cloud ? wx.cloud.database() : null;
  }
});
