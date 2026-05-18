/**
 * 登录/注册页
 * 支持用户名+密码登录，自定义头像注册，自动登录
 */
const app = getApp();

Page({
  data: {
    mode: 'login',        // login | register
    submitting: false,

    // 登录字段
    loginUsername: '',
    loginPassword: '',

    // 注册字段
    avatarUrl: '',        // 本地预览临时路径
    avatarFileID: '',     // 云存储 fileID
    regUsername: '',
    regPassword: '',
    regPasswordConfirm: ''
  },

  /**
   * 切换登录/注册
   */
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

    try {
      const res = await wx.cloud.callFunction({
        name: 'userAuth',
        data: {
          action: 'login',
          username: loginUsername.trim(),
          password: loginPassword
        }
      });

      const result = res.result;

      if (!result.ok) {
        wx.showToast({ title: result.error, icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      // 登录成功 — 保存用户信息
      wx.setStorageSync('user', result.user);
      app.globalData.user = result.user;

      wx.showToast({ title: '登录成功', icon: 'success' });
      wx.vibrateShort({ type: 'medium' });

      setTimeout(() => {
        wx.navigateBack();
      }, 600);
    } catch (err) {
      console.error('[认证] 登录失败:', err);
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
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

  /**
   * 选择并上传头像
   */
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;

        // 先显示本地预览
        this.setData({ avatarUrl: tempPath });

        // 上传到云存储
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

    try {
      const res = await wx.cloud.callFunction({
        name: 'userAuth',
        data: {
          action: 'register',
          username: regUsername.trim(),
          password: regPassword,
          avatarUrl: avatarFileID
        }
      });

      const result = res.result;

      if (!result.ok) {
        wx.showToast({ title: result.error, icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      // 注册成功 — 保存用户信息
      wx.setStorageSync('user', result.user);
      app.globalData.user = result.user;

      wx.showToast({ title: '注册成功', icon: 'success' });
      wx.vibrateShort({ type: 'heavy' });

      setTimeout(() => {
        wx.navigateBack();
      }, 800);
    } catch (err) {
      console.error('[认证] 注册失败:', err);
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
      this.setData({ submitting: false });
    }
  }
});
