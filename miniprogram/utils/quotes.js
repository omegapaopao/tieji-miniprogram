/**
 * 铁记 — 健身励志语录库
 * 每次随机取一条，按标签分类
 */
const quotes = [
  // 坚持
  { text: '没有天生的强者，只有不放弃的坚持者。', author: '铁记' },
  { text: '每一次力竭，都是为了下一次更强的自己。', author: '铁记' },
  { text: '肌肉不会在舒适区生长，人也是。', author: '铁记' },
  { text: '你流的每一滴汗，都是对抗平庸的子弹。', author: '铁记' },
  { text: '训练很苦，但后悔更苦。', author: '铁记' },
  { text: '不要等有动力了再练，先练了动力自然来。', author: '铁记' },
  { text: '最重的不是杠铃，是踏进健身房的第一步。', author: '铁记' },
  { text: '今天不想练，才是你最需要练的时候。', author: '铁记' },
  { text: '别人看到的是身材，自己知道的是蜕变。', author: '铁记' },

  // 力量
  { text: '力量不是来自你能举起多重，而是你能承受多少。', author: '铁记' },
  { text: '杠铃不会说谎，它永远诚实地反映你的努力。', author: '铁记' },
  { text: '铁是冷的，但它会记住你每一次的全力以赴。', author: '铁记' },
  { text: '深蹲教会我：只有蹲得够低，才能跳得更高。', author: '铁记' },
  { text: '硬拉的意义：把生活给你的重压，一次又一次地拉起来。', author: '铁记' },
  { text: '卧推不下百次，才知道推起的不只是杠铃，还有对自己的信心。', author: '铁记' },
  { text: '不是重量让你变强，是你为了征服重量而付出的努力让你变强。', author: '铁记' },

  // 成长
  { text: '进步不在某一天，而在每一天。', author: '铁记' },
  { text: '1RM 会告诉你：每一次微小的积累，终将汇聚成力量。', author: '铁记' },
  { text: '你最大的对手不是别人，是昨天镜子里那个想放弃的自己。', author: '铁记' },
  { text: '与其羡慕别人的身材，不如成为别人羡慕的对象。', author: '铁记' },
  { text: '训练不会背叛你，付出多少，铁记帮你记住。', author: '铁记' },
  { text: '身体是最诚实的日记本，每一组数字都是你写下的篇章。', author: '铁记' },
  { text: '从空杆到百斤，中间只隔着一件事——坚持。', author: '铁记' },

  // 自律
  { text: '自律不是自虐，是对未来的自己最大的温柔。', author: '铁记' },
  { text: '凌晨五点的铁馆，藏着普通人不知道的秘密。', author: '铁记' },
  { text: '真正的自由，是能控制自己的身体和意志。', author: '铁记' },
  { text: '每次想偷懒的时候，问问自己为什么开始。', author: '铁记' },
  { text: '把训练变成习惯，就像呼吸一样自然。', author: '铁记' },
  { text: '厉害的人，不过是把简单的事重复做了无数次。', author: '铁记' },

  // 名人名言
  { text: '痛苦只是暂时的，但放弃是永远的。——兰斯·阿姆斯特朗', author: 'Lance Armstrong' },
  { text: '如果你只做你能力范围之内的事，你永远不会进步。——佚名', author: '佚名' },
  { text: '身体能承受的极限，远远超过大脑告诉你的。——大卫·戈金斯', author: 'David Goggins' },
  { text: '健身是唯一一件，付出就一定会有回报的事。——阿诺德·施瓦辛格', author: 'Arnold Schwarzenegger' },
  { text: '重要的不是你能打多重，而是你能承受多重并继续向前。——洛奇', author: 'Rocky Balboa' },
];

/**
 * 随机获取一条励志语录
 * @returns {{ text: string, author: string }}
 */
function getRandomQuote() {
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

/**
 * 获取全部语录（用于将来扩展）
 */
function getAllQuotes() {
  return quotes;
}

module.exports = {
  getRandomQuote,
  getAllQuotes
};
