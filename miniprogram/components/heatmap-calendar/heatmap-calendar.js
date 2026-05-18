/**
 * 日历热力图组件
 *
 * 功能:
 *   1. 月视图日历，有训练的日子标绿色（深浅按训练量）
 *   2. 支持前后翻月
 *   3. 点击日期触发事件
 */
const dateUtils = require('../../utils/date.js');

Component({
  properties: {
    // 训练数据: [{ date: 'YYYY-MM-DD', volume: number }, ...]
    trainingData: {
      type: Array,
      value: []
    },
    // 初始年月
    year: {
      type: Number,
      value: new Date().getFullYear()
    },
    month: {
      type: Number,
      value: new Date().getMonth() + 1
    }
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
    /**
     * 构建日历数据
     */
    buildCalendar(trainingData, year, month) {
      const daysInMonth = dateUtils.getDaysInMonth(year, month);
      const firstDay = dateUtils.getFirstDayOfMonth(year, month); // 0=周日

      // 计算训练量范围，用于分级
      const volumeMap = {};
      let maxVolume = 0;
      if (trainingData && trainingData.length > 0) {
        trainingData.forEach(item => {
          volumeMap[item.date] = (volumeMap[item.date] || 0) + item.volume;
        });
        maxVolume = Math.max(...Object.values(volumeMap));
      }

      // 空白填充（月初对齐星期）
      const blankCells = [];
      for (let i = 0; i < firstDay; i++) {
        blankCells.push(i);
      }

      // 日期格子
      const dayCells = [];
      const today = dateUtils.getToday();

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const volume = volumeMap[dateStr] || 0;

        // 4 级热力: 无记录→0, 然后按训练量三分位
        let level = 0;
        if (volume > 0 && maxVolume > 0) {
          const ratio = volume / maxVolume;
          if (ratio < 0.25) level = 1;
          else if (ratio < 0.5) level = 2;
          else if (ratio < 0.75) level = 3;
          else level = 4;
        }

        dayCells.push({
          day: d,
          date: dateStr,
          volume: volume,
          level: level,
          hasRecord: volume > 0,
          isToday: dateStr === today
        });
      }

      this.setData({ blankCells, dayCells });
    },

    /**
     * 上一个月
     */
    prevMonth() {
      let { currentYear, currentMonth } = this.data;
      if (currentMonth === 1) {
        currentYear--;
        currentMonth = 12;
      } else {
        currentMonth--;
      }
      this.setData({ currentYear, currentMonth });
    },

    /**
     * 下一个月
     */
    nextMonth() {
      let { currentYear, currentMonth } = this.data;
      if (currentMonth === 12) {
        currentYear++;
        currentMonth = 1;
      } else {
        currentMonth++;
      }
      this.setData({ currentYear, currentMonth });
    },

    /**
     * 点击日期
     */
    onDayTap(e) {
      const { date, hasRecord } = e.currentTarget.dataset;
      if (hasRecord) {
        this.triggerEvent('daytap', { date });
      }
    }
  }
});
