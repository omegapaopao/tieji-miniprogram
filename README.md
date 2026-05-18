# 铁记

一个力量训练的微信小程序。记录每次训练的重量、组数、次数，自动算 1RM 和容量，用图表看长期进步。

纯属自己训练时需要，顺手写的。

## 技术栈

微信小程序原生 + 云开发（数据库/存储/云函数），没有后端服务器。

echarts-for-weixin 做图表，Canvas 2D 画计时器。

## 功能大概这些

- 选动作、记数据：重量、组数、次数，步进器加减。1RM 用 Epley 公式实时算，容量自动出
- 组间休息计时：30秒到5分钟，圆形倒计时，到点震动
- 动作库：胸背腿肩臂五类，14个预置动作，可以自己加
- 按日期看历史，左滑删单条，长按删整次训练
- 统计页：1RM 折线图、日历热力图、训练次数/总容量卡片
- 账号系统：用户名密码注册，头像上传，自动登录
- 意见反馈区，像评论区那样，大家都能看
- 健身语录，每次打开随机一条，有个刷新按钮可以换
- AI 分析页是演示版，选视频后模拟分析出报告

全是深色底，暗色主题。

## 目录结构

```
miniprogram/
├── app.js / app.json / app.wxss / env.js
├── utils/           # epley / date / charts / quotes / hash
├── components/
│   ├── rest-timer/        # 组间休息计时器
│   ├── exercise-picker/   # 动作选择器
│   └── heatmap-calendar/  # 日历热力图
├── pages/
│   ├── training/    # 首页，今日训练
│   ├── record/      # 记录页，录入数据
│   ├── history/     # 历史记录
│   ├── stats/       # 统计图表
│   ├── ai-analysis/ # AI 分析（演示）
│   ├── profile/     # 我的
│   ├── auth/        # 登录注册
│   └── feedback/    # 意见反馈
└── lib/echarts/     # ec-canvas 占位组件
```

## 跑起来

1. 微信开发者工具导入项目，填 AppID
2. `env.js` 里把 `cloudEnvId` 换成你的云开发环境 ID
3. 云开发控制台创建集合：`training_records`、`exercise_library`、`users`、`feedback`
4. `users` 集合权限设为「所有用户可读，仅创建者可写」
5. 真需要 echarts 图表的话，下载 [echarts-for-weixin](https://github.com/ecomfe/echarts-for-weixin) 放到 `lib/echarts/`

## 许可

MIT
