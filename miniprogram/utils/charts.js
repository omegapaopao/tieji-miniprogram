/**
 * 铁记 — echarts 图表初始化辅助
 *
 * 使用 echarts-for-weixin 组件: https://github.com/ecomfe/echarts-for-weixin
 * 需要将 ec-canvas 组件放置在 lib/echarts/ 目录下
 *
 * 下载方式:
 *   git clone https://github.com/ecomfe/echarts-for-weixin.git
 *   将 ec-canvas 目录复制到 lib/echarts/ 下
 */

/**
 * 初始化 echarts 组件实例
 * @param {Object} ecComponent - ec-canvas 组件实例 (通过 selectComponent 获取)
 * @param {Function} onInit - 图表初始化回调 function(canvas, width, height, dpr)
 */
function initChart(ecComponent, onInit) {
  if (!ecComponent) return;
  ecComponent.init(onInit);
}

/**
 * 生成 1RM 趋势折线图配置
 * @param {Array} dates - 日期数组 ['2024-01-01', ...]
 * @param {Array} values - 1RM 值数组 [100, 105, ...]
 * @param {string} actionName - 动作名称
 * @returns {Object} echarts option
 */
function buildOneRMOption(dates, values, actionName) {
  return {
    backgroundColor: 'transparent',
    grid: {
      left: 50,
      right: 20,
      top: 40,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#444' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#999',
        fontSize: 10,
        formatter: function(val) {
          // 只显示月-日
          const parts = val.split('-');
          return parts[1] + '/' + parts[2];
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '1RM (kg)',
      nameTextStyle: { color: '#666', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#333' } },
      axisLabel: { color: '#999', fontSize: 10 }
    },
    series: [{
      data: values,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#f5a623', width: 2 },
      itemStyle: { color: '#f5a623' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(245,166,35,0.3)' },
            { offset: 1, color: 'rgba(245,166,35,0.02)' }
          ]
        }
      },
      markLine: {
        silent: true,
        data: [{ type: 'max', label: { color: '#f5a623', fontSize: 10 } }],
        lineStyle: { color: 'rgba(245,166,35,0.5)', type: 'dashed' }
      }
    }]
  };
}

/**
 * 生成训练容量柱状图配置
 * @param {Array} dates - 日期数组
 * @param {Array} volumes - 容量数组 (kg)
 * @returns {Object} echarts option
 */
function buildVolumeOption(dates, volumes) {
  return {
    backgroundColor: 'transparent',
    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 30
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: '#444' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#999',
        fontSize: 10,
        formatter: function(val) {
          const parts = val.split('-');
          return parts[1] + '/' + parts[2];
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '容量 (kg)',
      nameTextStyle: { color: '#666', fontSize: 10 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#333' } },
      axisLabel: { color: '#999', fontSize: 10 }
    },
    series: [{
      data: volumes,
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#4caf50' },
            { offset: 1, color: 'rgba(76,175,80,0.3)' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  };
}

module.exports = {
  initChart,
  buildOneRMOption,
  buildVolumeOption
};
