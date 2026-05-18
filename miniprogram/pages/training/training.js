/**
 * 首页 — 今日训练快捷开始
 *
 * 功能:
 *   1. 展示今日训练概况（总容量、动作数、最大重量）
 *   2. 动作选择器（按分类筛选 + 自定义添加）
 *   3. 跳转记录页开始训练
 *   4. 今日训练记录列表展示
 */
const app = getApp();
const dateUtils = require('../../utils/date.js');
const quotes = require('../../utils/quotes.js');

Page({
  data: {
    dateCN: '',
    greeting: '',
    quoteText: '',
    quoteAuthor: '',
    todayRecordCount: 0,
    todayVolume: 0,
    todayVolumeTons: '0',
    todayActions: 0,
    todayMaxWeight: 0,
    todayRecords: [],
    exercises: [],
    loading: true,

    // 自定义动作弹窗
    showAddDialog: false,
    customName: '',
    customCategory: '胸',
    categories: [
      { label: '胸', value: '胸' },
      { label: '背', value: '背' },
      { label: '腿', value: '腿' },
      { label: '肩', value: '肩' },
      { label: '臂', value: '臂' }
    ]
  },

  onLoad() {
    const quote = quotes.getRandomQuote();
    this.setData({
      dateCN: dateUtils.formatDateCN(dateUtils.getToday()),
      greeting: this.getGreeting(),
      quoteText: quote.text,
      quoteAuthor: quote.author
    });
  },

  onShow() {
    // 检查登录状态
    if (app.globalData.isAuthChecked && !app.globalData.user) {
      wx.navigateTo({ url: '/pages/auth/auth' });
      return;
    }

    // 每次显示页面时刷新数据
    this.loadExercises();
    this.loadTodayRecords();
  },

  /**
   * 随机换一条语录
   */
  refreshQuote() {
    const quote = quotes.getRandomQuote();
    this.setData({
      quoteText: quote.text,
      quoteAuthor: quote.author
    });
    wx.vibrateShort({ type: 'light', fail: () => {} });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    Promise.all([
      this.loadExercises(),
      this.loadTodayRecords()
    ]).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 获取问候语
   */
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return '凌晨还在练？注意休息 💤';
    if (hour < 9) return '早上好，晨练开始 ☀️';
    if (hour < 12) return '上午好，状态正佳 🔥';
    if (hour < 14) return '中午好，别忘了吃饭 🍚';
    if (hour < 18) return '下午好，继续努力 💪';
    if (hour < 22) return '晚上好，黄金训练时间 ⚡';
    return '夜深了，练完早点休息 🌙';
  },

  /**
   * 加载动作库（分页拉取全量，绕过客户端 20 条限制）
   */
  async loadExercises() {
    const db = app.getDb();
    if (!db) return;

    try {
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

      this.setData({ exercises: all });
    } catch (err) {
      console.error('[训练页] 加载动作库失败:', err);
    }
  },

  /**
   * 加载今日训练记录
   */
  async loadTodayRecords() {
    const db = app.getDb();
    if (!db) {
      this.setData({ loading: false });
      return;
    }

    const today = dateUtils.getToday();

    try {
      const result = await db.collection('training_records')
        .where({ date: today })
        .orderBy('created_at', 'desc')
        .get();

      const records = result.data;
      const todayVolume = records.reduce((sum, r) => sum + r.volume, 0);
      const actionNames = new Set(records.map(r => r.action_name));
      const maxWeight = records.length > 0
        ? Math.max(...records.map(r => r.weight))
        : 0;

      this.setData({
        todayRecords: records,
        todayRecordCount: records.length,
        todayVolume: Math.round(todayVolume),
        todayVolumeTons: (todayVolume / 1000).toFixed(1),
        todayActions: actionNames.size,
        todayMaxWeight: maxWeight,
        loading: false
      });
    } catch (err) {
      console.error('[训练页] 加载今日记录失败:', err);
      this.setData({ loading: false });
    }
  },

  /**
   * 选择动作 — 跳转记录页
   */
  onSelectExercise(e) {
    const { exercise } = e.detail;
    wx.navigateTo({
      url: `/pages/record/record?action=${encodeURIComponent(exercise.name)}&category=${encodeURIComponent(exercise.category)}`
    });
  },

  /**
   * 打开添加自定义动作弹窗
   */
  onAddCustom() {
    this.setData({
      showAddDialog: true,
      customName: '',
      customCategory: '胸'
    });
  },

  /**
   * 关闭弹窗
   */
  closeAddDialog() {
    this.setData({ showAddDialog: false });
  },

  /**
   * 输入动作名称
   */
  onCustomNameInput(e) {
    this.setData({ customName: e.detail.value });
  },

  /**
   * 选择分类
   */
  selectCustomCategory(e) {
    this.setData({ customCategory: e.currentTarget.dataset.category });
  },

  /**
   * 确认添加自定义动作
   */
  async confirmAddCustom() {
    const { customName, customCategory } = this.data;
    if (!customName.trim()) {
      wx.showToast({ title: '请输入动作名称', icon: 'none' });
      return;
    }

    const db = app.getDb();
    if (!db) return;

    try {
      await db.collection('exercise_library').add({
        data: {
          name: customName.trim(),
          category: customCategory,
          is_custom: true,
          created_at: Date.now()
        }
      });

      wx.showToast({ title: '动作已添加', icon: 'success' });
      this.setData({ showAddDialog: false });
      this.loadExercises();
    } catch (err) {
      console.error('[训练页] 添加动作失败:', err);
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  }
});
