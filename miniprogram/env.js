/**
 * 铁记 — 云开发环境配置
 *
 * 使用前请替换 cloudEnvId 为你的云开发环境 ID
 * 获取路径: 微信开发者工具 → 云开发 → 设置 → 环境 ID
 *
 * 此文件单独维护，方便后续环境切换和 CI/CD 部署
 */

module.exports = {
  // 云开发环境 ID（替换为实际值）
  cloudEnvId: 'cloud1-d7gehgeq0b6b1d9e4',

  // 数据库集合名（统一管理，避免硬编码）
  collections: {
    trainingRecords: 'training_records',
    exerciseLibrary: 'exercise_library',
    users: 'users',
    feedback: 'feedback'
  },

  // AI 分析接口地址（预留，后续接入真实 AI 时使用）
  aiAnalysisUrl: 'https://your-ai-service.com/api/analyze'
};
