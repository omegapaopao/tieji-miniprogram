/**
 * 统计页 — 数据可视化
 *
 * 功能:
 *   1. 统计卡片：本周训练次数、本月总容量、最常用动作 TOP3
 *   2. 1RM 趋势折线图（echarts-for-weixin）
 *   3. 日历热力图
 */
const app = getApp();
const dateUtils = require('../../utils/date.js');
const chartUtils = require('../../utils/charts.js');

Page({
  data: {
    // 统计卡片
    weeklyCount: 0,
    weeklyActions: 0,
    monthlyVolumeKg: 0,
    monthlyVolumeTons: 0,
    topActions: [],

    // 图表
    actionNames: [],
    selectedActionIndex: 0,
    selectedActionName: '',
    chartData: [],
    chartDates: [],
    chartValues: [],
    hasEcharts: false,  // ec-canvas 组件是否已安装
    ec: {
      onInit: null
    },

    // 热力图
    calendarData: []
  },

  onLoad() {
    // 检测 echarts 是否可用
    this.setData({
      hasEcharts: typeof echarts !== 'undefined',
      ec: {
        onInit: this.initChart.bind(this)
      }
    });
    // 如果未安装 ec-canvas，动态加载组件引用
    if (typeof echarts !== 'undefined') {
      // 动态启用 ec-canvas 组件
      this.setData({ hasEcharts: true });
    }
  },

  onShow() {
    this.loadAllStats();
  },

  /**
   * 加载所有统计数据
   */
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

  /**
   * 加载本周统计
   */
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

  /**
   * 加载本月统计
   */
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
        monthlyVolumeKg: Math.round(totalVolume),
        monthlyVolumeTons: (totalVolume / 1000).toFixed(1)
      });
    } catch (err) {
      console.error('[统计页] 本月统计失败:', err);
    }
  },

  /**
   * 加载全部训练记录（用于图表和热力图）
   */
  async loadAllRecords() {
    const db = app.getDb();
    if (!db) return;

    try {
      // 加载最近 90 天数据（云数据库单次最多 100 条）
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

      // 统计最常用动作 TOP3
      const actionCount = {};
      records.forEach(r => {
        actionCount[r.action_name] = (actionCount[r.action_name] || 0) + 1;
      });

      const topActions = Object.entries(actionCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

      // 生成动作列表（用于 picker）
      const actionNames = [...new Set(records.map(r => r.action_name))];

      // 生成热力图数据
      const calendarData = [];
      const dateVolumeMap = {};
      records.forEach(r => {
        dateVolumeMap[r.date] = (dateVolumeMap[r.date] || 0) + (r.volume || 0);
      });
      Object.entries(dateVolumeMap).forEach(([date, volume]) => {
        calendarData.push({ date, volume });
      });

      this.setData({
        topActions,
        actionNames,
        calendarData
      });

      // 如果有动作，默认选中第一个并更新图表
      if (actionNames.length > 0) {
        this.setData({
          selectedActionIndex: 0,
          selectedActionName: actionNames[0]
        });
        this.updateChartData(records, actionNames[0]);
      }
    } catch (err) {
      console.error('[统计页] 加载记录失败:', err);
    }
  },

  /**
   * 切换动作 — picker 回调
   */
  onActionChange(e) {
    const index = e.detail.value;
    const name = this.data.actionNames[index];
    this.setData({
      selectedActionIndex: index,
      selectedActionName: name
    });

    // 重新加载图表数据
    this.loadAllRecords().then(() => {
      // updateChartData 已在 loadAllRecords 中调用
    });
  },

  /**
   * 更新图表数据
   */
  updateChartData(allRecords, actionName) {
    const filtered = allRecords
      .filter(r => r.action_name === actionName)
      .sort((a, b) => a.date.localeCompare(b.date));

    const dates = filtered.map(r => r.date);
    const values = filtered.map(r => r.one_rm || 0);

    this.setData({
      chartData: filtered,
      chartDates: dates,
      chartValues: values
    });

    // 初始化图表
    const ecComponent = this.selectComponent('#oneRMChart');
    if (ecComponent && dates.length > 0 && typeof echarts !== 'undefined') {
      chartUtils.initChart(ecComponent, (canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr
        });
        const option = chartUtils.buildOneRMOption(dates, values, actionName);
        chart.setOption(option);
        return chart;
      });
    }
  },

  /**
   * echarts 初始化回调
   * 注意: 需要先下载 ec-canvas 组件才可用
   */
  initChart(canvas, width, height, dpr) {
    // ec-canvas 未下载时，echarts 全局变量不存在
    if (typeof echarts === 'undefined') {
      console.warn('[统计页] echarts 未加载，图表功能暂不可用');
      return null;
    }

    const chart = echarts.init(canvas, null, {
      width: width,
      height: height,
      devicePixelRatio: dpr
    });

    const { chartDates, chartValues, selectedActionName } = this.data;
    if (chartDates && chartDates.length > 0) {
      const option = chartUtils.buildOneRMOption(chartDates, chartValues, selectedActionName);
      chart.setOption(option);
    }

    return chart;
  },

  /**
   * 日历热力图点击 — 跳转历史页查看当天记录
   */
  onCalendarDayTap(e) {
    const { date } = e.detail;
    wx.showToast({ title: date, icon: 'none' });
    // 可扩展：跳转到历史页并筛选该日期
  }
});
