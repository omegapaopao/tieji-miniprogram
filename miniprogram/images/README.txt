========== TabBar 图标说明 ==========

请将以下 8 个图标文件放置在此目录（推荐 81x81 的 PNG）:

训练:
  tab-training.png         (未选中，灰色图标)
  tab-training-active.png  (选中，金色 #f5a623)

历史:
  tab-history.png
  tab-history-active.png

统计:
  tab-stats.png
  tab-stats-active.png

我的:
  tab-profile.png
  tab-profile-active.png

图标资源推荐:
  1. iconfont.cn 搜索下载
  2. 使用 AI 图标生成工具
  3. 使用 Figma / Sketch 自己画

暂时替代方案:
  在 app.json 中删除 tabBar.list 中的 iconPath 和 selectedIconPath，
  TabBar 会以纯文字方式显示（不影响功能）。
