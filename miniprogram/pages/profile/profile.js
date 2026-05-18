/**
 * 我的页 — 个人中心
 *
 * 功能:
 *   1. 用户信息展示 / 退出登录
 *   2. 动作库管理（查看/添加/删除自定义动作）
 *   3. 训练数据概览（总记录数/天数/容量）
 *   4. 关于信息
 */
const app = getApp();

Page({
  data: {
    user: null,
    avatarUrl: '',

    exercises: [],
    categories: [
      { label: '全部', value: 'all' },
      { label: '胸', value: '胸' },
      { label: '背', value: '背' },
      { label: '腿', value: '腿' },
      { label: '肩', value: '肩' },
      { label: '臂', value: '臂' }
    ],
    activeCategory: 'all',
    filteredExercises: [],

    // 添加表单
    showForm: false,
    newName: '',
    newCategory: '胸',
    addCategories: [
      { label: '胸', value: '胸' },
      { label: '背', value: '背' },
      { label: '腿', value: '腿' },
      { label: '肩', value: '肩' },
      { label: '臂', value: '臂' }
    ],

    // 数据概览
    totalRecords: 0,
    totalDays: 0,
    totalVolume: 0,

    // 意见反馈
    showFeedback: false,
    feedbackText: '',
    submittingFeedback: false
  },

  onShow() {
    this.loadUserInfo();
    this.loadExercises();
    this.loadOverview();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const user = app.globalData.user || wx.getStorageSync('user') || null;
    this.setData({ user });

    if (user && user.avatar_url) {
      this.loadAvatarUrl(user.avatar_url);
    }
  },

  /**
   * 将云存储 fileID 转换为临时可访问 URL
   */
  async loadAvatarUrl(fileID) {
    try {
      const res = await wx.cloud.getTempFileURL({ fileList: [fileID] });
      if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
        this.setData({ avatarUrl: res.fileList[0].tempFileURL });
      }
    } catch (err) {
      console.error('[我的] 加载头像失败:', err);
    }
  },

  /**
   * 更换头像
   */
  changeAvatar() {
    if (!this.data.user) return;

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;

        wx.showLoading({ title: '上传中...' });
        try {
          const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempPath
          });

          // 更新数据库
          const callRes = await wx.cloud.callFunction({
            name: 'userAuth',
            data: {
              action: 'updateAvatar',
              avatarUrl: uploadRes.fileID
            }
          });

          if (callRes.result && callRes.result.ok) {
            // 更新本地
            const user = this.data.user;
            user.avatar_url = uploadRes.fileID;
            wx.setStorageSync('user', user);
            app.globalData.user = user;

            this.setData({ avatarUrl: tempPath });
            wx.showToast({ title: '头像已更新', icon: 'success' });
          } else {
            wx.showToast({ title: '更新失败', icon: 'none' });
          }
        } catch (err) {
          console.error('[我的] 头像更新失败:', err);
          wx.showToast({ title: '更新失败', icon: 'none' });
        }
        wx.hideLoading();
      }
    });
  },

  /**
   * 退出登录
   */
  handleLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (!res.confirm) return;

        wx.removeStorageSync('user');
        app.globalData.user = null;
        this.setData({ user: null, avatarUrl: '' });

        wx.showToast({ title: '已退出', icon: 'none' });
        wx.vibrateShort({ type: 'light' });
      }
    });
  },

  /**
   * 跳转登录页
   */
  goToAuth() {
    wx.navigateTo({ url: '/pages/auth/auth' });
  },

  /**
   * 加载动作库
   */
  async loadExercises() {
    const db = app.getDb();
    if (!db) return;

    try {
      const result = await db.collection('exercise_library')
        .orderBy('created_at', 'asc')
        .get();

      this.setData({ exercises: result.data });
      this.filterExercises();
    } catch (err) {
      console.error('[我的] 加载动作库失败:', err);
    }
  },

  /**
   * 加载训练数据概览
   */
  async loadOverview() {
    const db = app.getDb();
    if (!db) return;

    try {
      const result = await db.collection('training_records')
        .orderBy('date', 'desc')
        .limit(1000)
        .get();

      const records = result.data;
      const dates = new Set(records.map(r => r.date));
      const totalVolume = records.reduce((sum, r) => sum + (r.volume || 0), 0);

      this.setData({
        totalRecords: records.length,
        totalDays: dates.size,
        totalVolume: Math.round(totalVolume)
      });
    } catch (err) {
      console.error('[我的] 加载概览失败:', err);
    }
  },

  /**
   * 切换分类
   */
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({ activeCategory: category });
    this.filterExercises();
  },

  /**
   * 按分类筛选动作
   */
  filterExercises() {
    const { exercises, activeCategory } = this.data;
    if (activeCategory === 'all') {
      this.setData({ filteredExercises: exercises });
    } else {
      this.setData({
        filteredExercises: exercises.filter(e => e.category === activeCategory)
      });
    }
  },

  /**
   * 显示添加表单
   */
  showAddForm() {
    this.setData({
      showForm: true,
      newName: '',
      newCategory: '胸'
    });
  },

  /**
   * 隐藏表单
   */
  hideAddForm() {
    this.setData({ showForm: false });
  },

  /**
   * 输入动作名称
   */
  onNewNameInput(e) {
    this.setData({ newName: e.detail.value });
  },

  /**
   * 选择分类
   */
  selectNewCategory(e) {
    this.setData({ newCategory: e.currentTarget.dataset.category });
  },

  /**
   * 确认添加
   */
  async confirmAdd() {
    const { newName, newCategory } = this.data;
    if (!newName.trim()) {
      wx.showToast({ title: '请输入动作名称', icon: 'none' });
      return;
    }

    const db = app.getDb();
    if (!db) return;

    try {
      await db.collection('exercise_library').add({
        data: {
          name: newName.trim(),
          category: newCategory,
          is_custom: true,
          created_at: Date.now()
        }
      });

      wx.showToast({ title: '动作已添加', icon: 'success' });
      this.setData({ showForm: false });
      this.loadExercises();
    } catch (err) {
      console.error('[我的] 添加动作失败:', err);
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },

  /**
   * 打开反馈页
   */
  openFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' });
  },

  /**
   * 关闭反馈弹窗
   */
  closeFeedback() {
    this.setData({ showFeedback: false });
  },

  /**
   * 输入反馈内容
   */
  onFeedbackInput(e) {
    this.setData({ feedbackText: e.detail.value });
  },

  /**
   * 提交反馈
   */
  async submitFeedback() {
    const { feedbackText } = this.data;
    if (!feedbackText.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' });
      return;
    }

    this.setData({ submittingFeedback: true });

    const db = app.getDb();
    if (!db) {
      this.setData({ submittingFeedback: false });
      return;
    }

    try {
      const user = app.globalData.user;
      await db.collection('feedback').add({
        data: {
          content: feedbackText.trim(),
          username: user ? user.username : '匿名用户',
          created_at: Date.now()
        }
      });

      wx.showToast({ title: '感谢反馈！', icon: 'success' });
      wx.vibrateShort({ type: 'medium' });
      this.setData({ showFeedback: false, submittingFeedback: false });
    } catch (err) {
      console.error('[我的] 提交反馈失败:', err);
      wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' });
      this.setData({ submittingFeedback: false });
    }
  },

  /**
   * 删除自定义动作
   */
  async deleteExercise(e) {
    const { id, name } = e.currentTarget.dataset;

    wx.showModal({
      title: '删除动作',
      content: `确定删除「${name}」吗？`,
      confirmColor: '#e74c3c',
      success: async (res) => {
        if (!res.confirm) return;

        const db = app.getDb();
        if (!db) return;

        try {
          await db.collection('exercise_library').doc(id).remove();
          wx.showToast({ title: '已删除', icon: 'success' });
          this.loadExercises();
        } catch (err) {
          console.error('[我的] 删除动作失败:', err);
          wx.showToast({ title: '删除失败', icon: 'none' });
        }
      }
    });
  }
});
