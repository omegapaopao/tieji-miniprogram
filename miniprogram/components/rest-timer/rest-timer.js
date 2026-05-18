/**
 * 组间休息计时器组件
 * Canvas 2D 圆形倒计时，适配不同设备像素比
 */
Component({
  properties: {
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
    selectedTime: 90,
    isRunning: false,
    isDone: false,
    displayTime: '90',
    remainingSeconds: 0,
    totalSeconds: 0,
    timerInterval: null,
    canvasWidth: 280,
    canvasHeight: 280,
    canvasReady: false
  },

  lifetimes: {
    attached() {
      // 根据设备像素比设置 canvas 实际尺寸
      const dpr = wx.getSystemInfoSync().pixelRatio || 2;
      // 显示尺寸 280rpx ≈ 140px (iPhone 6 基准)
      const displaySize = 140;
      this.setData({
        canvasWidth: displaySize * dpr,
        canvasHeight: displaySize * dpr
      });
      this._dpr = dpr;
      this._displaySize = displaySize;
    },
    detached() {
      this.clearTimer();
    }
  },

  methods: {
    selectTime(e) {
      this.setData({ selectedTime: e.currentTarget.dataset.time });
    },

    startTimer() {
      const { selectedTime } = this.data;
      this.setData({
        isRunning: true,
        isDone: false,
        remainingSeconds: selectedTime,
        totalSeconds: selectedTime,
        displayTime: String(selectedTime)
      });

      this.drawProgress(selectedTime, selectedTime);

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

    onTimerEnd() {
      this.clearTimer();
      this.setData({
        isRunning: false,
        isDone: true,
        displayTime: '0'
      });

      wx.vibrateLong({ fail: () => {} });
      this.triggerEvent('complete');
    },

    cancelTimer() {
      this.clearTimer();
      this.setData({
        isRunning: false,
        isDone: false
      });
      this.triggerEvent('cancel');
    },

    clearTimer() {
      if (this.data.timerInterval) {
        clearInterval(this.data.timerInterval);
        this.data.timerInterval = null;
      }
    },

    /**
     * Canvas 2D 绘制圆形进度条
     */
    drawProgress(total, remaining) {
      const query = this.createSelectorQuery();
      query.select('#timerCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return;

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = this._dpr;
          const size = this._displaySize;

          // 设置 canvas 实际像素尺寸
          canvas.width = size * dpr;
          canvas.height = size * dpr;
          ctx.scale(dpr, dpr);

          const cx = size / 2;
          const cy = size / 2;
          const radius = size / 2 - 6;
          const lineWidth = 7;
          const ratio = remaining / total;

          ctx.clearRect(0, 0, size, size);

          // 背景圆环
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = '#333';
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';
          ctx.stroke();

          // 进度圆环（顺时针从12点方向开始）
          if (ratio > 0) {
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + Math.PI * 2 * ratio;
            const color = ratio < 0.2 ? '#e74c3c' : '#f5a623';

            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        });
    }
  }
});
