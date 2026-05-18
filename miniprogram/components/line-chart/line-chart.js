/**
 * 原生 Canvas 2D 折线图
 * 不依赖 echarts，开箱即用
 */
Component({
  properties: {
    dates: { type: Array, value: [] },
    values: { type: Array, value: [] },
    title: { type: String, value: '' }
  },

  data: {
    canvasWidth: 700,
    canvasHeight: 360
  },

  lifetimes: {
    attached() {
      const dpr = wx.getSystemInfoSync().pixelRatio || 2;
      this._dpr = dpr;
      this.setData({
        canvasWidth: 350 * dpr,
        canvasHeight: 180 * dpr
      });
    }
  },

  observers: {
    'dates, values'(dates, values) {
      if (dates && values && dates.length > 0) {
        this.drawChart(dates, values);
      }
    }
  },

  methods: {
    drawChart(dates, values) {
      const query = this.createSelectorQuery();
      query.select('#chartCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!res || !res[0] || !res[0].node) return;

          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = this._dpr;

          const w = 350;
          const h = 180;
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          ctx.scale(dpr, dpr);

          // 边距
          const pad = { top: 20, right: 16, bottom: 32, left: 44 };
          const plotW = w - pad.left - pad.right;
          const plotH = h - pad.top - pad.bottom;

          ctx.clearRect(0, 0, w, h);

          if (values.length === 0) return;

          const maxVal = Math.max(...values, 1);
          const minVal = Math.min(...values, 0);
          const range = maxVal - minVal || 1;

          // Y 轴刻度线
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 0.5;
          ctx.fillStyle = '#888';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          for (let i = 0; i <= 3; i++) {
            const y = pad.top + (plotH / 3) * i;
            const val = maxVal - (range / 3) * i;
            // 水平网格线
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(w - pad.right, y);
            ctx.stroke();
            // Y 轴标签
            ctx.fillText(Math.round(val), pad.left - 6, y + 4);
          }

          // X 轴标签（最多显示 6 个）
          const xStep = Math.max(1, Math.floor(dates.length / 5));
          ctx.textAlign = 'center';
          ctx.fillStyle = '#888';
          ctx.font = '10px sans-serif';
          for (let i = 0; i < dates.length; i += xStep) {
            const x = pad.left + (plotW / (dates.length - 1 || 1)) * i;
            const label = dates[i].slice(5); // MM-DD
            ctx.fillText(label, x, h - pad.bottom + 16);
          }
          // 最后一个点一定显示
          if (dates.length > 1) {
            const lastX = pad.left + plotW;
            ctx.fillText(dates[dates.length - 1].slice(5), lastX, h - pad.bottom + 16);
          }

          // 数据点和折线
          if (values.length === 1) {
            // 只有一个点 — 画个圆点
            const cx = pad.left + plotW / 2;
            const cy = pad.top + plotH / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#f5a623';
            ctx.fill();
          } else {
            // 折线
            ctx.beginPath();
            ctx.strokeStyle = '#f5a623';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            values.forEach((v, i) => {
              const x = pad.left + (plotW / (values.length - 1)) * i;
              const y = pad.top + plotH - ((v - minVal) / range) * plotH;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // 数据点
            values.forEach((v, i) => {
              const x = pad.left + (plotW / (values.length - 1)) * i;
              const y = pad.top + plotH - ((v - minVal) / range) * plotH;

              // 外圈
              ctx.beginPath();
              ctx.arc(x, y, 5, 0, Math.PI * 2);
              ctx.fillStyle = '#1a1a1a';
              ctx.fill();
              ctx.strokeStyle = '#f5a623';
              ctx.lineWidth = 2;
              ctx.stroke();

              // 内点
              ctx.beginPath();
              ctx.arc(x, y, 2.5, 0, Math.PI * 2);
              ctx.fillStyle = '#f5a623';
              ctx.fill();
            });

            // 最高点标注数值
            const maxIdx = values.indexOf(maxVal);
            const mx = pad.left + (plotW / (values.length - 1)) * maxIdx;
            const my = pad.top + plotH - ((maxVal - minVal) / range) * plotH;
            ctx.fillStyle = '#f5a623';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(Math.round(maxVal) + 'kg', mx, my - 10);
          }
        });
    }
  }
});
