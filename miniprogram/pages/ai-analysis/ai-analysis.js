/**
 * AI 动作分析页 — 演示版
 *
 * 流程: 选视频 → 上传 → 假分析动画(3秒) → 展示报告
 * 为后续接入真实 AI 分析预留接口
 */
const env = require('../../env.js');

Page({
  data: {
    // 动作信息（从上一页传入）
    actionName: '',

    // 视频
    videoSelected: false,
    videoUrl: '',
    videoFile: null,

    // 分析状态
    analyzing: false,
    analyzingStep: '正在解析动作姿态...',
    analyzeProgress: 0,

    // 报告
    reportReady: false,
    report: {
      score: 0,
      actionName: '',
      suggestions: [],
      trajectory: '',
      rhythm: '',
      jointStress: '',
      riskLevel: ''
    }
  },

  onLoad(options) {
    const actionName = decodeURIComponent(options.action || '');
    this.setData({ actionName });
  },

  /**
   * 选择视频
   * 使用 wx.chooseMedia 支持手机相册和拍摄
   */
  chooseVideo() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 10,    // 限制 10 秒
      success: (res) => {
        const tempFile = res.tempFiles[0];
        if (tempFile.duration > 10) {
          wx.showToast({ title: '视频不能超过 10 秒', icon: 'none' });
          return;
        }

        this.setData({
          videoSelected: true,
          videoUrl: tempFile.tempFilePath,
          videoFile: tempFile,
          reportReady: false
        });
      },
      fail: (err) => {
        console.log('[AI分析] 选择视频取消或失败:', err);
      }
    });
  },

  /**
   * 开始分析 — 模拟 AI 分析流程
   */
  startAnalysis() {
    this.setData({
      analyzing: true,
      videoSelected: false,
      reportReady: false,
      analyzeProgress: 0
    });

    // 模拟分析步骤（每步约 0.75 秒，共 3 秒）
    const steps = [
      { step: '正在解析动作姿态...', progress: 20 },
      { step: '正在分析发力模式...', progress: 45 },
      { step: '正在对比标准动作库...', progress: 70 },
      { step: '正在生成改进建议...', progress: 90 },
      { step: '分析完成 ✓', progress: 100 }
    ];

    let stepIndex = 0;
    const timer = setInterval(() => {
      if (stepIndex < steps.length) {
        this.setData({
          analyzingStep: steps[stepIndex].step,
          analyzeProgress: steps[stepIndex].progress
        });
        stepIndex++;
      } else {
        clearInterval(timer);
        this.generateReport();
      }
    }, 600);
  },

  /**
   * 生成假分析报告
   * ====== 后续接入真实 AI 时替换此方法 ======
   */
  generateReport() {
    const { actionName } = this.data;

    // 随机评分 65~95
    const score = Math.floor(Math.random() * 31) + 65;

    // 根据动作类型生成针对性建议
    const suggestionMap = {
      '深蹲': [
        '下蹲深度可再增加 5-8cm，保持腰椎中立位',
        '足跟轻微外旋 5-10°，可改善膝关节内扣',
        '离心阶段控制 2-3 秒，向心阶段爆发发力'
      ],
      '卧推': [
        '杠铃下放至胸口时，前臂应垂直于地面',
        '肩胛骨全程收紧，减少肩关节压力',
        '起桥高度可适度增加，但需保持臀部接触凳面'
      ],
      '硬拉': [
        '启动前预拉杠铃杆，背阔肌提前激活',
        '杠铃轨迹应始终贴近小腿，直线上升',
        '锁定阶段臀部前推而非过度后仰'
      ],
      '引体向上': [
        '起始时肩胛骨下沉，避免耸肩借力',
        '下巴过杠即可，无需追求胸口触杠',
        '离心阶段控制 3-4 秒，最大化背肌刺激'
      ],
      '推举': [
        '杠铃起始位置应在前三角肌上方，手腕中立',
        '推起时头部微微后仰让杠铃通过面部',
        '锁定后杠铃在耳后正上方，避免腰椎过度伸展'
      ],
      '划船': [
        '俯身角度保持 45 度，核心全程收紧',
        '拉动时肘部贴近身体，顶峰收缩 1-2 秒',
        '避免上半身过度晃动借力'
      ]
    };

    const defaultSuggestions = [
      '动作整体轨迹良好，建议放慢离心阶段速度',
      '核心稳定性有提升空间，加强腹内压控制',
      '注意呼吸节奏：发力时呼气，离心时吸气'
    ];

    const suggestions = suggestionMap[actionName] || defaultSuggestions;

    // 构造报告
    const report = {
      score: score,
      actionName: actionName,
      suggestions: suggestions,
      trajectory: score >= 80 ? '轨迹接近标准，轻微偏差可接受' : '轨迹有改善空间，建议对镜练习',
      rhythm: score >= 80 ? '发力节奏良好，离心/向心比例合理' : '节奏偏快，建议延长离心阶段',
      jointStress: score >= 80 ? '关节压力分布正常' : '肩/膝关节压力偏高，注意热身',
      riskLevel: score >= 85 ? '低' : score >= 70 ? '中' : '需关注'
    };

    setTimeout(() => {
      this.setData({
        analyzing: false,
        reportReady: true,
        report: report
      });
    }, 300);
  },

  /**
   * 上传视频到云存储（预留方法）
   * 后续接入真实 AI 时启用
   */
  async uploadVideo(filePath) {
    const cloudPath = `videos/${Date.now()}_${Math.random().toString(36).slice(2)}.mp4`;

    try {
      const result = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      });
      return result.fileID;
    } catch (err) {
      console.error('[AI分析] 视频上传失败:', err);
      return null;
    }
  },

  /**
   * 调用真实 AI 分析接口（预留方法）
   * 后续接入真实 AI 时实现
   *
   * @param {string} videoFileId - 云存储文件 ID
   * @param {string} actionName - 动作名称
   * @returns {Object} 分析报告
   */
  async analyzeVideo(videoFileId, actionName) {
    // TODO: 调用真实 AI 接口
    // const result = await wx.request({
    //   url: env.aiAnalysisUrl,
    //   method: 'POST',
    //   data: { videoFileId, actionName }
    // });
    // return result.data;
    return null;
  },

  /**
   * 重置分析
   */
  resetAnalysis() {
    this.setData({
      videoSelected: false,
      videoUrl: '',
      videoFile: null,
      analyzing: false,
      reportReady: false,
      analyzeProgress: 0
    });
  }
});
