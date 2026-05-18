/**
 * 记录页 — 核心训练数据录入
 *
 * 功能:
 *   1. 重量/组数/次数 输入（步进器 + 手动输入）
 *   2. 实时计算 Epley 1RM 和训练容量
 *   3. 组间休息倒计时器
 *   4. 保存到云数据库
 *   5. AI 动作分析入口
 */
const app = getApp();
const epley = require('../../utils/epley.js');
const dateUtils = require('../../utils/date.js');

Page({
  data: {
    // 动作信息（从上一页传入）
    actionName: '',
    category: '',

    // 输入值
    weight: '',
    sets: '',
    reps: '',

    // 计算值
    oneRM: 0,
    volume: 0,

    // 动画状态
    oneRMPulse: false,
    showParticles: false,
    showSuccess: false,
    particles: [],

    // 计时器
    showTimer: false
  },

  onLoad(options) {
    // 接收上一页传来的动作参数
    const actionName = decodeURIComponent(options.action || '训练');
    const category = decodeURIComponent(options.category || '');

    this.setData({ actionName, category });

    // 设置导航栏标题
    wx.setNavigationBarTitle({ title: actionName });
  },

  // ==================== 重量输入 ====================
  onWeightInput(e) {
    const val = parseFloat(e.detail.value) || 0;
    this.setData({ weight: val });
    this.recalc();
  },

  decreaseWeight() {
    const val = Math.max(0, (parseFloat(this.data.weight) || 0) - 2.5);
    this.setData({ weight: val });
    this.recalc();
  },

  increaseWeight() {
    const val = (parseFloat(this.data.weight) || 0) + 2.5;
    this.setData({ weight: val });
    this.recalc();
  },

  // ==================== 组数输入 ====================
  onSetsInput(e) {
    const val = parseInt(e.detail.value) || 0;
    this.setData({ sets: val });
    this.recalc();
  },

  decreaseSets() {
    const val = Math.max(0, (parseInt(this.data.sets) || 0) - 1);
    this.setData({ sets: val });
    this.recalc();
  },

  increaseSets() {
    const val = (parseInt(this.data.sets) || 0) + 1;
    this.setData({ sets: val });
    this.recalc();
  },

  // ==================== 次数输入 ====================
  onRepsInput(e) {
    const val = parseInt(e.detail.value) || 0;
    this.setData({ reps: val });
    this.recalc();
  },

  decreaseReps() {
    const val = Math.max(0, (parseInt(this.data.reps) || 0) - 1);
    this.setData({ reps: val });
    this.recalc();
  },

  increaseReps() {
    const val = (parseInt(this.data.reps) || 0) + 1;
    this.setData({ reps: val });
    this.recalc();
  },

  /**
   * 重新计算 1RM 和训练容量
   */
  recalc() {
    const weight = parseFloat(this.data.weight) || 0;
    const sets = parseInt(this.data.sets) || 0;
    const reps = parseInt(this.data.reps) || 0;

    const oneRM = epley.calcOneRM(weight, reps);
    const volume = epley.calcVolume(weight, sets, reps);

    // 仅在数值变化时触发脉冲动画
    const changed = oneRM !== this.data.oneRM || volume !== this.data.volume;

    this.setData({ oneRM, volume });

    if (changed && oneRM > 0) {
      this.setData({ oneRMPulse: true });
      clearTimeout(this._pulseTimer);
      this._pulseTimer = setTimeout(() => {
        this.setData({ oneRMPulse: false });
      }, 420);
    }
  },

  // ==================== 计时器 ====================
  toggleTimer() {
    this.setData({ showTimer: !this.data.showTimer });
  },

  onTimerComplete() {
    console.log('[记录页] 休息计时结束');
  },

  onTimerCancel() {
    console.log('[记录页] 跳过休息');
  },

  // ==================== 保存记录 ====================
  async saveRecord() {
    const { actionName, category, weight, sets, reps, oneRM, volume } = this.data;

    // 参数校验
    if (!actionName) {
      wx.showToast({ title: '动作名称不能为空', icon: 'none' });
      return;
    }
    if (!weight || parseFloat(weight) <= 0) {
      wx.showToast({ title: '请输入有效重量', icon: 'none' });
      return;
    }
    if (!sets || parseInt(sets) <= 0) {
      wx.showToast({ title: '请输入有效组数', icon: 'none' });
      return;
    }
    if (!reps || parseInt(reps) <= 0) {
      wx.showToast({ title: '请输入有效次数', icon: 'none' });
      return;
    }

    const db = app.getDb();
    if (!db) {
      wx.showToast({ title: '云开发未初始化', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    try {
      await db.collection('training_records').add({
        data: {
          date: dateUtils.getToday(),
          action_name: actionName,
          category: category,
          weight: parseFloat(weight),
          sets: parseInt(sets),
          reps: parseInt(reps),
          volume: volume,
          one_rm: oneRM,
          rest_time: null,
          created_at: Date.now()
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '记录已保存', icon: 'success' });

      // 触发成功特效
      this.showSaveSuccess();

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      wx.hideLoading();
      console.error('[记录页] 保存失败:', err);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  // ==================== AI 分析入口 ====================
  goToAIAnalysis() {
    wx.navigateTo({
      url: `/pages/ai-analysis/ai-analysis?action=${encodeURIComponent(this.data.actionName)}`
    });
  },

  // ==================== 保存成功特效 ====================
  /**
   * 显示保存成功浮层 + 粒子爆发
   */
  showSaveSuccess() {
    // 生成 24 个彩色粒子
    const colors = ['#f5a623', '#f7931e', '#4caf50', '#3498db', '#e74c3c', '#ff6b6b', '#ffd93d', '#6bcb77'];
    const particles = [];
    for (let i = 0; i < 24; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 6,
        delay: Math.random() * 0.3,
        dx: (Math.random() - 0.5) * 160,
        dy: (Math.random() - 1) * 160
      });
    }

    this.setData({ showParticles: true, particles });

    // 0.45s 后显示成功卡片
    setTimeout(() => {
      this.setData({ showParticles: false, showSuccess: true });
      wx.vibrateShort({ type: 'heavy', fail: () => {} });
    }, 450);
  },

  /**
   * 关闭成功浮层（页面离开时自动消失）
   */
  dismissSuccess() {
    this.setData({ showSuccess: false });
  }
});
