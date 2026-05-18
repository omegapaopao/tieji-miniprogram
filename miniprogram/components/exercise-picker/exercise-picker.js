/**
 * 动作选择器组件
 *
 * 功能:
 *   1. 按分类（全部/胸/背/腿/肩/臂）筛选动作
 *   2. 横向滚动展示动作卡片
 *   3. "自定义"入口触发添加事件
 */
Component({
  properties: {
    // 动作列表（从父页面传入）
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
    filteredExercises: []
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
    /**
     * 切换分类
     */
    switchCategory(e) {
      const category = e.currentTarget.dataset.category;
      this.setData({ activeCategory: category });
      this.filterExercises(this.properties.exercises, category);
    },

    /**
     * 按分类筛选动作
     */
    filterExercises(exercises, category) {
      if (!exercises || exercises.length === 0) {
        this.setData({ filteredExercises: [] });
        return;
      }
      if (category === 'all') {
        this.setData({ filteredExercises: exercises });
      } else {
        this.setData({
          filteredExercises: exercises.filter(e => e.category === category)
        });
      }
    },

    /**
     * 选择动作 — 触发父页面事件
     */
    onSelectExercise(e) {
      const exercise = e.currentTarget.dataset.exercise;
      this.triggerEvent('select', { exercise });
    },

    /**
     * 添加自定义动作 — 触发父页面事件
     */
    onAddCustom() {
      this.triggerEvent('addcustom');
    }
  }
});
