/**
 * ec-canvas 占位组件
 * 下载 echarts-for-weixin 后替换此文件:
 *   git clone https://github.com/ecomfe/echarts-for-weixin.git
 */
Component({
  properties: {
    ec: { type: Object, value: {} },
    canvasId: { type: String, value: '' }
  },
  methods: {
    init(callback) {
      // ec-canvas 未安装时不做任何操作
      console.warn('[ec-canvas] 占位组件，图表功能未启用');
    }
  }
});
