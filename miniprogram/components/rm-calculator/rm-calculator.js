/**
 * RM 换算器 — 输入做组重量和次数，输出 1RM~12RM 对照表
 * 公式: Epley — 1RM = weight × (1 + reps/30)
 */
Component({
  data: {
    weight: '',
    reps: '',
    oneRM: 0,
    table: [],        // [{rm, weight, percent}]
    hasResult: false
  },

  methods: {
    onWeightInput(e) {
      this.setData({ weight: e.detail.value });
    },

    onRepsInput(e) {
      this.setData({ reps: e.detail.value });
    },

    calculate() {
      const weight = parseFloat(this.data.weight);
      const reps = parseInt(this.data.reps, 10);

      if (!weight || weight <= 0) {
        wx.showToast({ title: '请输入有效重量', icon: 'none' });
        return;
      }
      if (!reps || reps <= 0 || reps > 30) {
        wx.showToast({ title: '请输入有效次数 (1-30)', icon: 'none' });
        return;
      }

      const oneRM = Math.round(weight * (1 + reps / 30) * 10) / 10;

      const table = [];
      for (let r = 1; r <= 12; r++) {
        const rmWeight = Math.round((oneRM / (1 + r / 30)) * 10) / 10;
        const percent = Math.round((rmWeight / oneRM) * 100);
        table.push({ rm: r + 'RM', weight: rmWeight, percent });
      }

      this.setData({ oneRM, table, hasResult: true });
      wx.vibrateShort({ type: 'light', fail: () => {} });
    },

    reset() {
      this.setData({
        weight: '',
        reps: '',
        oneRM: 0,
        table: [],
        hasResult: false
      });
    }
  }
});
