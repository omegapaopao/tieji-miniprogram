/**
 * 登录/注册页
 * 直接操作云数据库，不依赖云函数
 */
const app = getApp();
const hashUtils = require('../../utils/hash.js');

Page({
  data: {
    mode: 'login',
    submitting: false,

    // 登录字段
    loginUsername: '',
    loginPassword: '',

    // 注册字段
    avatarUrl: '',
    avatarFileID: '',
    regUsername: '',
    regPassword: '',
    regPasswordConfirm: ''
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ mode });
    wx.vibrateShort({ type: 'light', fail: () => {} });
  },

  // ========== 登录 ==========

  onLoginUsernameInput(e) {
    this.setData({ loginUsername: e.detail.value });
  },

  onLoginPasswordInput(e) {
    this.setData({ loginPassword: e.detail.value });
  },

  async handleLogin() {
    const { loginUsername, loginPassword } = this.data;

    if (!loginUsername.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (!loginPassword) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    const db = app.getDb();
    if (!db) {
      wx.showToast({ title: '云开发未就绪', icon: 'none' });
      this.setData({ submitting: false });
      return;
    }

    try {
      // 按用户名查找用户
      const result = await db.collection('users')
        .where({ username: loginUsername.trim() })
        .get();

      if (result.data.length === 0) {
        wx.showToast({ title: '用户名不存在', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      const record = result.data[0];

      // 验证密码
      if (!hashUtils.verifyPassword(loginPassword, record.salt, record.password_hash)) {
        wx.showToast({ title: '密码错误', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      const user = {
        _id: record._id,
        username: record.username,
        avatar_url: record.avatar_url || '',
        created_at: record.created_at
      };

      wx.setStorageSync('user', user);
      app.globalData.user = user;

      wx.showToast({ title: '登录成功', icon: 'success' });
      wx.vibrateShort({ type: 'medium' });

      setTimeout(() => { wx.navigateBack(); }, 600);
    } catch (err) {
      console.error('[认证] 登录失败:', err);
      wx.showToast({ title: err.errMsg || '登录失败，请稍后重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  },

  // ========== 注册 ==========

  onRegUsernameInput(e) {
    this.setData({ regUsername: e.detail.value });
  },

  onRegPasswordInput(e) {
    this.setData({ regPassword: e.detail.value });
  },

  onRegPasswordConfirmInput(e) {
    this.setData({ regPasswordConfirm: e.detail.value });
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        this.setData({ avatarUrl: tempPath });

        wx.showLoading({ title: '上传中...' });
        try {
          const cloudPath = `avatars/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempPath
          });
          this.setData({ avatarFileID: uploadRes.fileID });
          wx.hideLoading();
        } catch (err) {
          console.error('[认证] 头像上传失败:', err);
          wx.hideLoading();
          wx.showToast({ title: '头像上传失败', icon: 'none' });
        }
      }
    });
  },

  async handleRegister() {
    const { avatarFileID, regUsername, regPassword, regPasswordConfirm } = this.data;

    if (!regUsername.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (regUsername.trim().length < 2) {
      wx.showToast({ title: '用户名至少 2 个字符', icon: 'none' });
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      wx.showToast({ title: '密码至少 4 位', icon: 'none' });
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      wx.showToast({ title: '两次密码输入不一致', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    const db = app.getDb();
    if (!db) {
      wx.showToast({ title: '云开发未就绪', icon: 'none' });
      this.setData({ submitting: false });
      return;
    }

    try {
      const trimmedName = regUsername.trim();

      // 检查用户名是否已存在
      const existResult = await db.collection('users')
        .where({ username: trimmedName })
        .count();

      if (existResult.total > 0) {
        wx.showToast({ title: '用户名已被占用', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      // 创建用户
      const salt = hashUtils.generateSalt();
      const passwordHash = hashUtils.hashPassword(regPassword, salt);
      const now = Date.now();

      const addResult = await db.collection('users').add({
        data: {
          username: trimmedName,
          password_hash: passwordHash,
          salt: salt,
          avatar_url: avatarFileID || '',
          created_at: now,
          updated_at: now
        }
      });

      const user = {
        _id: addResult._id,
        username: trimmedName,
        avatar_url: avatarFileID || '',
        created_at: now
      };

      wx.setStorageSync('user', user);
      app.globalData.user = user;

      wx.showToast({ title: '注册成功', icon: 'success' });
      wx.vibrateShort({ type: 'heavy' });

      setTimeout(() => { wx.navigateBack(); }, 800);
    } catch (err) {
      console.error('[认证] 注册失败:', err);

      // 根据错误码给出具体提示
      let errMsg = '注册失败，请稍后重试';
      if (err.errMsg && err.errMsg.includes('permission')) {
        errMsg = '权限不足，请检查数据库权限设置';
      }
      wx.showToast({ title: errMsg, icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
