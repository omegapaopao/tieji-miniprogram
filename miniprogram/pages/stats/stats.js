/**
 * 统计页 — 数据可视化
 * 原生 Canvas 折线图 + 日历热力图
 */
const app = getApp();
const dateUtils = require('../../utils/date.js');

Page({
  data: {
    weeklyCount: 0,
    weeklyActions: 0,
    monthlyVolumeTons: '0',
    topActions: [],

    actionNames: [],
    selectedActionIndex: 0,
    selectedActionName: '',
    chartDates: [],
    chartValues: [],
    calendarData: []
  },

  onShow() {
    this.loadAllStats();
  },

  async loadAllStats() {
    wx.showLoading({ title: '加载中...' });
    try {
      await Promise.all([
        this.loadWeeklyStats(),
        this.loadMonthlyStats(),
        this.loadAllRecords()
      ]);
    } catch (err) {
      console.error('[统计页] 加载失败:', err);
    }
    wx.hideLoading();
  },

  async loadWeeklyStats() {
    const db = app.getDb();
    if (!db) return;

    const weekStart = dateUtils.getWeekStart();
    const today = dateUtils.getToday();

    try {
      const result = await db.collection('training_records')
        .where({
          date: db.command.gte(weekStart).and(db.command.lte(today))
        })
        .get();

      const records = result.data;
      const actionSet = new Set(records.map(r => r.action_name));

      this.setData({
        weeklyCount: records.length,
        weeklyActions: actionSet.size
      });
    } catch (err) {
      console.error('[统计页] 本周统计失败:', err);
    }
  },

  async loadMonthlyStats() {
    const db = app.getDb();
    if (!db) return;

    const monthStart = dateUtils.getMonthStart();
    const today = dateUtils.getToday();

    try {
      const result = await db.collection('training_records')
        .where({
          date: db.command.gte(monthStart).and(db.command.lte(today))
        })
        .get();

      const totalVolume = result.data.reduce((sum, r) => sum + (r.volume || 0), 0);

      this.setData({
        monthlyVolumeTons: (totalVolume / 1000).toFixed(1)
      });
    } catch (err) {
      console.error('[统计页] 本月统计失败:', err);
    }
  },

  async loadAllRecords() {
    const db = app.getDb();
    if (!db) return;

    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const startDate = dateUtils.formatDate(ninetyDaysAgo);

      const result = await db.collection('training_records')
        .where({
          date: db.command.gte(startDate)
        })
        .orderBy('date', 'asc')
        .limit(100)
        .get();

      const records = result.data;

      const actionCount = {};
      records.forEach(r => {
        actionCount[r.action_name] = (actionCount[r.action_name] || 0) + 1;
      });

      const topActions = Object.entries(actionCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      const actionNames = [...new Set(records.map(r => r.action_name))];

      const calendarData = [];
      const dateMap = {};
      records.forEach(r => {
        if (!dateMap[r.date]) {
          dateMap[r.date] = { volume: 0, categories: new Set() };
        }
        dateMap[r.date].volume += (r.volume || 0);
        if (r.category) {
          dateMap[r.date].categories.add(r.category);
        }
      });
      Object.entries(dateMap).forEach(([date, info]) => {
        calendarData.push({
          date,
          volume: info.volume,
          categories: [...info.categories]
        });
      });

      // 缓存全部记录供切换动作时使用
      this._allRecords = records;

      const currentName = this.data.selectedActionName;
      const validIndex = currentName ? actionNames.indexOf(currentName) : -1;
      const selIndex = validIndex >= 0 ? validIndex : 0;
      const selName = actionNames[selIndex] || '';

      this.setData({
        topActions,
        actionNames,
        calendarData,
        selectedActionIndex: selIndex,
        selectedActionName: selName
      });

      if (selName) {
        this.buildChartData(records, selName);
      }
    } catch (err) {
      console.error('[统计页] 加载记录失败:', err);
    }
  },

  onActionChange(e) {
    const index = e.detail.value;
    const name = this.data.actionNames[index];
    this.setData({
      selectedActionIndex: index,
      selectedActionName: name
    });
    // 直接从缓存构建图表，不重新加载全部数据
    if (this._allRecords) {
      this.buildChartData(this._allRecords, name);
    }
  },

  buildChartData(allRecords, actionName) {
    const filtered = allRecords
      .filter(r => r.action_name === actionName)
      .sort((a, b) => a.date.localeCompare(b.date));

    this.setData({
      chartDates: filtered.map(r => r.date),
      chartValues: filtered.map(r => Math.round(r.one_rm || 0))
    });
  },

  onCalendarDayTap(e) {
    const { date } = e.detail;
    wx.showToast({ title: date, icon: 'none' });
  }
});
