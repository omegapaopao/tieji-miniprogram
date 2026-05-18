/**
 * 历史页 — 按日期分组查看训练记录
 *
 * 功能:
 *   1. 按日期分组显示训练记录
 *   2. 折叠/展开日期组
 *   3. 删除单条记录
 *   4. 长按删除整次训练
 *   5. 分页加载
 */
const app = getApp();
const dateUtils = require('../../utils/date.js');

const PAGE_SIZE = 20; // 每页加载 20 条

Page({
  data: {
    dateGroups: [],       // [{ date, dateCN, expanded, records[], totalVolume }]
    loading: true,
    loadingMore: false,
    hasMore: true,
    cursor: null,         // 分页游标（用最后一条的 created_at）

    // 删除确认
    showDeleteModal: false,
    deleteTarget: 'single', // 'single' | 'date'
    deleteId: null,
    deleteDate: null
  },

  onLoad() {
    this.loadRecords();
  },

  onShow() {
    // 每次回到页面时刷新
    this.setData({ dateGroups: [], cursor: null, hasMore: true });
    this.loadRecords();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ dateGroups: [], cursor: null, hasMore: true });
    this.loadRecords().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 加载训练记录
   */
  async loadRecords() {
    const db = app.getDb();
    if (!db) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await db.collection('training_records')
        .orderBy('created_at', 'desc')
        .limit(PAGE_SIZE)
        .get();

      this.processRecords(result.data);
      this.setData({
        loading: false,
        hasMore: result.data.length >= PAGE_SIZE
      });
    } catch (err) {
      console.error('[历史页] 加载记录失败:', err);
      this.setData({ loading: false });
    }
  },

  /**
   * 加载更多
   */
  async loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return;
    this.setData({ loadingMore: true });

    const db = app.getDb();
    if (!db) return;

    try {
      // 用 skip 实现简单分页
      const skipCount = this.getTotalRecordCount();

      const result = await db.collection('training_records')
        .orderBy('created_at', 'desc')
        .skip(skipCount)
        .limit(PAGE_SIZE)
        .get();

      if (result.data.length > 0) {
        // 合并到现有分组中
        const processed = this.groupByDate(result.data);
        const merged = this.mergeDateGroups(this.data.dateGroups, processed);
        this.setData({ dateGroups: merged });
      }

      this.setData({
        loadingMore: false,
        hasMore: result.data.length >= PAGE_SIZE
      });
    } catch (err) {
      console.error('[历史页] 加载更多失败:', err);
      this.setData({ loadingMore: false });
    }
  },

  /**
   * 获取当前总记录数
   */
  getTotalRecordCount() {
    let count = 0;
    this.data.dateGroups.forEach(group => {
      count += group.records.length;
    });
    return count;
  },

  /**
   * 处理记录数据：按日期分组
   */
  processRecords(records) {
    const groups = this.groupByDate(records);
    this.setData({ dateGroups: groups });
  },

  /**
   * 按日期分组
   */
  groupByDate(records) {
    const dateMap = {};

    records.forEach(record => {
      if (!dateMap[record.date]) {
        dateMap[record.date] = {
          date: record.date,
          dateCN: dateUtils.formatDateCN(record.date),
          expanded: true,  // 默认展开
          records: [],
          totalVolume: 0
        };
      }
      dateMap[record.date].records.push(record);
      dateMap[record.date].totalVolume += record.volume || 0;
    });

    // 保留原有分组的展开状态
    const existingMap = {};
    this.data.dateGroups.forEach(g => {
      existingMap[g.date] = g.expanded;
    });

    return Object.values(dateMap).map(group => ({
      ...group,
      expanded: existingMap[group.date] !== undefined ? existingMap[group.date] : true,
      totalVolume: Math.round(group.totalVolume)
    }));
  },

  /**
   * 合并日期分组
   */
  mergeDateGroups(existing, newGroups) {
    const map = {};
    existing.forEach(g => { map[g.date] = g; });
    newGroups.forEach(g => {
      if (map[g.date]) {
        map[g.date].records.push(...g.records);
        map[g.date].totalVolume += g.totalVolume;
      } else {
        map[g.date] = g;
      }
    });
    // 按日期降序排列
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  },

  /**
   * 折叠/展开日期组
   */
  toggleDateGroup(e) {
    const date = e.currentTarget.dataset.date;
    const groups = this.data.dateGroups.map(g => {
      if (g.date === date) {
        g.expanded = !g.expanded;
      }
      return g;
    });
    this.setData({ dateGroups: groups });
  },

  /**
   * 删除单条记录
   */
  deleteRecord(e) {
    this.setData({
      showDeleteModal: true,
      deleteTarget: 'single',
      deleteId: e.currentTarget.dataset.id
    });
  },

  /**
   * 长按日期头 — 删除整次训练
   */
  onLongPressDate(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({
      showDeleteModal: true,
      deleteTarget: 'date',
      deleteDate: date
    });
  },

  /**
   * 确认删除
   */
  async confirmDelete() {
    const db = app.getDb();
    if (!db) return;

    const { deleteTarget, deleteId, deleteDate } = this.data;

    try {
      if (deleteTarget === 'single') {
        await db.collection('training_records').doc(deleteId).remove();
        wx.showToast({ title: '已删除', icon: 'success' });
      } else {
        // 删除该日期所有记录（需用云函数批量删除）
        const result = await db.collection('training_records')
          .where({ date: deleteDate })
          .get();

        for (const record of result.data) {
          await db.collection('training_records').doc(record._id).remove();
        }

        wx.showToast({ title: `已删除 ${result.data.length} 条记录`, icon: 'success' });
      }

      this.setData({ showDeleteModal: false });

      // 刷新列表
      this.setData({ dateGroups: [], cursor: null, hasMore: true });
      this.loadRecords();
    } catch (err) {
      console.error('[历史页] 删除失败:', err);
      wx.showToast({ title: '删除失败', icon: 'none' });
    }
  },

  /**
   * 关闭删除弹窗
   */
  closeDeleteModal() {
    this.setData({ showDeleteModal: false });
  }
});
