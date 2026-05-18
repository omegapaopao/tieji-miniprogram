/**
 * 铁记 — Epley 公式计算工具
 *
 * Epley 公式是力量训练中最常用的 1RM（最大重量）估算公式:
 *   1RM = weight × (1 + reps / 30)
 *
 * 限制: reps <= 20 时精度较高，超过 20 次建议用其他公式
 */

/**
 * 计算单次训练的 1RM 估值
 * @param {number} weight - 使用重量 (kg)
 * @param {number} reps   - 完成次数
 * @returns {number} 估算的 1RM，保留 1 位小数
 */
function calcOneRM(weight, reps) {
  if (!weight || !reps || weight <= 0 || reps <= 0) return 0;
  // reps 上限 20，超出范围精度下降
  const clampedReps = Math.min(reps, 20);
  const oneRM = weight * (1 + clampedReps / 30);
  return Math.round(oneRM * 10) / 10;
}

/**
 * 计算训练容量 (Volume)
 * @param {number} weight - 重量 (kg)
 * @param {number} sets   - 组数
 * @param {number} reps   - 每组次数
 * @returns {number} 容量 = weight × sets × reps
 */
function calcVolume(weight, sets, reps) {
  if (!weight || !sets || !reps) return 0;
  return Math.round(weight * sets * reps * 10) / 10;
}

/**
 * 计算总容量（支持多组不同重量/次数）
 * @param {Array} setsData - [{ weight, reps }, ...]
 * @returns {number} 总容量
 */
function calcTotalVolume(setsData) {
  return setsData.reduce((sum, set) => {
    return sum + (set.weight || 0) * (set.reps || 0);
  }, 0);
}

module.exports = {
  calcOneRM,
  calcVolume,
  calcTotalVolume
};
