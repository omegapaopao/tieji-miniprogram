/**
 * 铁记 — 日期格式化工具
 */

/**
 * 获取今天的日期字符串
 * @returns {string} YYYY-MM-DD
 */
function getToday() {
  const d = new Date();
  return formatDate(d);
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|number} date - 日期对象或时间戳
 * @returns {string}
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期为中文显示
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string} 如 "5月18日 周一"
 */
function formatDateCN(dateStr) {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekday = weekdays[d.getDay()];

  // 判断是否是今天/昨天
  const today = getToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  if (dateStr === today) return `今天 ${weekday}`;
  if (dateStr === yesterdayStr) return `昨天 ${weekday}`;
  return `${month}月${day}日 ${weekday}`;
}

/**
 * 获取本周的起始日期 (周一)
 * @returns {string} YYYY-MM-DD
 */
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return formatDate(monday);
}

/**
 * 获取本月的起始日期
 * @returns {string} YYYY-MM-DD
 */
function getMonthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

/**
 * 获取月份的天数
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {number}
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * 获取月份第一天是周几
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {number} 0=周日, 1=周一, ...
 */
function getFirstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * 格式化时间戳为时间显示
 * @param {number} timestamp
 * @returns {string} HH:MM
 */
function formatTime(timestamp) {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 格式化秒数为 mm:ss
 * @param {number} seconds
 * @returns {string}
 */
function formatSeconds(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

module.exports = {
  getToday,
  formatDate,
  formatDateCN,
  getWeekStart,
  getMonthStart,
  getDaysInMonth,
  getFirstDayOfMonth,
  formatTime,
  formatSeconds
};
