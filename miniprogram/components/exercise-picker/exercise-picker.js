/**
 * 动作选择器组件
 * 分类筛选 + 横向滚动 + 长按查看动作指导
 */
const exerciseData = require('../../utils/exercise_data.js');

Component({
  properties: {
    exercises: {
      type: Array,
      value: []
    }
  },

  data: {
    categories: [
      { label: '全部', value: 'all' },
      { label: '胸', value: '胸' },
      { label: '背', value: '背' },
      { label: '腿', value: '腿' },
      { label: '肩', value: '肩' },
      { label: '臂', value: '臂' }
    ],
    activeCategory: 'all',
    filteredExercises: [],

    showGuide: false,
    guideExercise: {}
  },

  observers: {
    'exercises, activeCategory'(exercises, activeCategory) {
      this.filterExercises(exercises, activeCategory);
    }
  },

  lifetimes: {
    attached() {
      this.filterExercises(this.properties.exercises, this.data.activeCategory);
    }
  },

  methods: {
    switchCategory(e) {
      const category = e.currentTarget.dataset.category;
      this.setData({ activeCategory: category });
      this.filterExercises(this.properties.exercises, category);
    },

    filterExercises(exercises, category) {
      if (!exercises || exercises.length === 0) {
        this.setData({ filteredExercises: [] });
        return;
      }
      // 过滤掉 DB 中缺少 name 的无效记录，再用本地数据补全 target
      let list = exercises.filter(e => e.name);
      list = category === 'all' ? list : list.filter(e => e.category === category);
      list = list.map(e => ({
        ...e,
        target: e.target || exerciseData.getTarget(e.name) || ''
      }));
      if (category === 'all') {
        this.setData({ filteredExercises: list });
      } else {
        this.setData({ filteredExercises: list });
      }
    },

    onSelectExercise(e) {
      const exercise = e.currentTarget.dataset.exercise;
      this.triggerEvent('select', { exercise });
    },

    /**
     * 长按动作 — 弹出动作指导（优先本地查表）
     */
    onLongPressExercise(e) {
      const exercise = e.currentTarget.dataset.exercise;
      const guide = exerciseData.getGuide(exercise.name) || exercise.guide || '暂无动作指导';
      const target = exerciseData.getTarget(exercise.name) || exercise.target || '';
      this.setData({
        showGuide: true,
        guideExercise: { ...exercise, displayGuide: guide, displayTarget: target }
      });
      wx.vibrateShort({ type: 'light', fail: () => {} });
    },

    closeGuide() {
      this.setData({ showGuide: false });
    },

    onAddCustom() {
      this.triggerEvent('addcustom');
    }
  }
});
