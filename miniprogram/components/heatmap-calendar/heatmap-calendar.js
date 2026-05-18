/**
 * 日历热力图组件
 *
 * 功能:
 *   1. 月视图日历，有训练的日子标绿色（深浅按训练量）
 *   2. 多色圆点展示每日训练部位（胸/背/腿/肩/臂）
 *   3. 支持前后翻月 / 点击日期触发事件
 */
const dateUtils = require('../../utils/date.js');

const CATEGORY_COLORS = {
  '胸': '#f5a623',
  '背': '#3498db',
  '腿': '#4caf50',
  '肩': '#9b59b6',
  '臂': '#e74c3c'
};

Component({
  properties: {
    trainingData: {
      type: Array,
      value: []
    },
    year: { type: Number, value: new Date().getFullYear() },
    month: { type: Number, value: new Date().getMonth() + 1 }
  },

  data: {
    weekdayLabels: ['日', '一', '二', '三', '四', '五', '六'],
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    blankCells: [],
    dayCells: [],
    today: dateUtils.getToday()
  },

  observers: {
    'trainingData, currentYear, currentMonth'(trainingData, year, month) {
      this.buildCalendar(trainingData, year, month);
    }
  },

  lifetimes: {
    attached() {
      this.buildCalendar(
        this.properties.trainingData,
        this.data.currentYear,
        this.data.currentMonth
      );
    }
  },

  methods: {
    buildCalendar(trainingData, year, month) {
      const daysInMonth = dateUtils.getDaysInMonth(year, month);
      const firstDay = dateUtils.getFirstDayOfMonth(year, month);

      // 按日期汇总训练量和分类
      const dateMap = {};
      let maxVolume = 0;
      if (trainingData && trainingData.length > 0) {
        trainingData.forEach(item => {
          if (!dateMap[item.date]) {
            dateMap[item.date] = { volume: 0, categories: [] };
          }
          dateMap[item.date].volume += (item.volume || 0);
          if (item.categories && item.categories.length > 0) {
            const set = new Set(dateMap[item.date].categories);
            item.categories.forEach(c => set.add(c));
            dateMap[item.date].categories = [...set];
          }
        });
        maxVolume = Math.max(...Object.values(dateMap).map(d => d.volume));
      }

      const blankCells = [];
      for (let i = 0; i < firstDay; i++) blankCells.push(i);

      const dayCells = [];
      const today = dateUtils.getToday();

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const info = dateMap[dateStr];
        const volume = info ? info.volume : 0;
        const categories = info ? info.categories : [];

        let level = 0;
        if (volume > 0 && maxVolume > 0) {
          const ratio = volume / maxVolume;
          if (ratio < 0.25) level = 1;
          else if (ratio < 0.5) level = 2;
          else if (ratio < 0.75) level = 3;
          else level = 4;
        }

        const catDots = categories.map(cat => ({
          name: cat,
          color: CATEGORY_COLORS[cat] || '#888'
        }));
        const catNames = categories.join('·');

        dayCells.push({
          day: d, date: dateStr, volume, level,
          hasRecord: volume > 0,
          isToday: dateStr === today,
          catDots,
          catNames
        });
      }

      this.setData({ blankCells, dayCells });
    },

    prevMonth() {
      let { currentYear, currentMonth } = this.data;
      if (currentMonth === 1) { currentYear--; currentMonth = 12; }
      else { currentMonth--; }
      this.setData({ currentYear, currentMonth });
    },

    nextMonth() {
      let { currentYear, currentMonth } = this.data;
      if (currentMonth === 12) { currentYear++; currentMonth = 1; }
      else { currentMonth++; }
      this.setData({ currentYear, currentMonth });
    },

    onDayTap(e) {
      const { date, hasRecord } = e.currentTarget.dataset;
      if (hasRecord) {
        this.triggerEvent('daytap', { date });
      }
    }
  }
});
