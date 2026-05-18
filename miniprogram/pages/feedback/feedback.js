/**
 * 意见反馈页 — 评论展示 + 发布
 */
const app = getApp();
const dateUtils = require('../../utils/date.js');

Page({
  data: {
    feedbacks: [],
    postText: '',
    posting: false
  },

  onShow() {
    this.loadFeedbacks();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadFeedbacks().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载所有反馈
   */
  async loadFeedbacks() {
    const db = app.getDb();
    if (!db) return;

    try {
      const result = await db.collection('feedback')
        .orderBy('created_at', 'desc')
        .limit(100)
        .get();

      const feedbacks = result.data.map(item => ({
        ...item,
        avatarChar: (item.username || '匿')[0].toUpperCase(),
        timeText: this.formatTimeText(item.created_at)
      }));

      this.setData({ feedbacks });
    } catch (err) {
      console.error('[反馈] 加载失败:', err);
    }
  },

  /**
   * 格式化时间显示
   */
  formatTimeText(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 30) return `${days} 天前`;

    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  /**
   * 输入反馈内容
   */
  onPostInput(e) {
    this.setData({ postText: e.detail.value });
  },

  /**
   * 提交反馈
   */
  async submitFeedback() {
    const { postText, posting } = this.data;
    if (posting) return;

    const text = postText.trim();
    if (!text) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    this.setData({ posting: true });

    const db = app.getDb();
    if (!db) {
      this.setData({ posting: false });
      return;
    }

    try {
      const user = app.globalData.user;
      await db.collection('feedback').add({
        data: {
          content: text,
          username: user ? user.username : '匿名用户',
          created_at: Date.now()
        }
      });

      wx.showToast({ title: '感谢反馈！', icon: 'success' });
      wx.vibrateShort({ type: 'medium' });

      this.setData({ postText: '', posting: false });
      this.loadFeedbacks();
    } catch (err) {
      console.error('[反馈] 提交失败:', err);
      wx.showToast({ title: '提交失败', icon: 'none' });
      this.setData({ posting: false });
    }
  }
});
