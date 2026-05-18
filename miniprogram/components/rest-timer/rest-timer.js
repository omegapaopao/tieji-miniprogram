/**
 * 组间休息计时器组件
 *
 * 功能:
 *   1. 选择休息时间 (30s ~ 5min)
 *   2. Canvas 圆形倒计时动画
 *   3. 计时结束震动提醒
 */
Component({
  properties: {
    // 是否显示
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {
    timeOptions: [
      { label: '30秒', value: 30 },
      { label: '60秒', value: 60 },
      { label: '90秒', value: 90 },
      { label: '2分钟', value: 120 },
      { label: '3分钟', value: 180 },
      { label: '5分钟', value: 300 }
    ],
    selectedTime: 90,    // 默认 90 秒
    isRunning: false,
    isDone: false,
    displayTime: '90',
    remainingSeconds: 0,
    totalSeconds: 0,
    timerInterval: null
  },

  lifetimes: {
    detached() {
      // 组件销毁时清理定时器
      this.clearTimer();
    }
  },

  methods: {
    /**
     * 选择休息时间
     */
    selectTime(e) {
      const time = e.currentTarget.dataset.time;
      this.setData({ selectedTime: time });
    },

    /**
     * 开始计时
     */
    startTimer() {
      const { selectedTime } = this.data;
      this.setData({
        isRunning: true,
        isDone: false,
        remainingSeconds: selectedTime,
        totalSeconds: selectedTime,
        displayTime: String(selectedTime)
      });

      // 绘制初始圆形
      this.drawProgress(selectedTime, selectedTime);

      // 每秒更新
      this.clearTimer();
      this.data.timerInterval = setInterval(() => {
        const remaining = this.data.remainingSeconds - 1;
        if (remaining <= 0) {
          this.onTimerEnd();
        } else {
          this.setData({
            remainingSeconds: remaining,
            displayTime: String(remaining)
          });
          this.drawProgress(this.data.totalSeconds, remaining);
        }
      }, 1000);
    },

    /**
     * 计时结束
     */
    onTimerEnd() {
      this.clearTimer();
      this.setData({
        isRunning: false,
        isDone: true,
        displayTime: '0'
      });

      // 震动提醒
      wx.vibrateLong({
        fail: () => {}
      });

      // 触发完成事件
      this.triggerEvent('complete');
    },

    /**
     * 取消计时
     */
    cancelTimer() {
      this.clearTimer();
      this.setData({
        isRunning: false,
        isDone: false
      });
      this.triggerEvent('cancel');
    },

    /**
     * 清除定时器
     */
    clearTimer() {
      if (this.data.timerInterval) {
        clearInterval(this.data.timerInterval);
        this.data.timerInterval = null;
      }
    },

    /**
     * 绘制圆形倒计时进度
     * @param {number} total - 总秒数
     * @param {number} remaining - 剩余秒数
     */
    drawProgress(total, remaining) {
      const ctx = wx.createCanvasContext('timerCanvas', this);
      const radius = 120;       // 圆半径 (280rpx / 2 ≈ 140, 留边)
      const lineWidth = 8;
      const x = 140;
      const y = 140;
      const ratio = remaining / total;
      const startAngle = -Math.PI / 2;  // 从 12 点方向开始
      const endAngle = startAngle + 2 * Math.PI * ratio;

      // 清除画布
      ctx.clearRect(0, 0, 280, 280);

      // 背景圆环
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.setStrokeStyle('#333');
      ctx.setLineWidth(lineWidth);
      ctx.setLineCap('round');
      ctx.stroke();

      // 进度圆环 (即将结束时变红)
      const color = ratio < 0.2 ? '#e74c3c' : '#f5a623';
      ctx.beginPath();
      ctx.arc(x, y, radius, startAngle, endAngle);
      ctx.setStrokeStyle(color);
      ctx.setLineWidth(lineWidth);
      ctx.setLineCap('round');
      ctx.stroke();

      ctx.draw();
    }
  }
});
