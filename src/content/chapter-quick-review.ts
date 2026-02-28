export interface ChapterQuickReview {
  chapter: number;
  title: string;
  conceptSummary: string;
  coreTakeaways: string[];
  commonPitfalls: string[];
  starterChecklist: string[];
}

export const chapterQuickReviews: ChapterQuickReview[] = [
  {
    chapter: 1,
    title: '交易动作基础',
    conceptSummary: '先掌握买入、卖出、持有、转账四个基础动作和资金流向。',
    coreTakeaways: [
      '买入和卖出是完整交易闭环的最小单元。',
      '持有用于等待，不是“什么都不做”。',
      '转账会改变资金路径，需关注后续动作是否还能执行。',
    ],
    commonPitfalls: [
      '只放买入不放卖出，导致策略无法兑现收益。',
      '金额设置超过可用资金，引发执行错误。',
      '模块连线不完整，导致链路中断。',
    ],
    starterChecklist: [
      '每次至少保证一条“买入 -> 卖出”可执行链路。',
      '先用小金额参数做验证，再逐步提高。',
      '运行后先看成交次数，再看收益率。',
    ],
  },
  {
    chapter: 2,
    title: '条件与仓位',
    conceptSummary: '让策略根据条件分支执行，并控制每次投入比例。',
    coreTakeaways: [
      '条件模块决定“何时做什么”。',
      '仓位管理决定“每次做多少”。',
      '稳定策略依赖规则一致性，而非一次高收益。',
    ],
    commonPitfalls: [
      '条件阈值过于极端，几乎不触发。',
      '仓位过大，单次波动就拖垮总体收益。',
      '条件分支没有都接下游，造成死路。',
    ],
    starterChecklist: [
      '先让条件能触发，再优化触发精度。',
      '单笔风险先控制在总资金的低比例。',
      '每次改参数只改一项，便于定位效果。',
    ],
  },
  {
    chapter: 3,
    title: '止损止盈风控',
    conceptSummary: '先保命再盈利：止损限制下行，止盈锁定已得收益。',
    coreTakeaways: [
      '止损是生存底线，止盈是纪律执行。',
      '风险收益比要成体系，不看单笔结果。',
      '回撤控制比短期暴利更关键。',
    ],
    commonPitfalls: [
      '止损设得太宽，亏损失控。',
      '止盈设得太近，利润空间被过早截断。',
      '忽略仓位管理，风控模块效果被稀释。',
    ],
    starterChecklist: [
      '先确定最大可接受回撤，再倒推参数。',
      '止损和止盈要配对测试，不要单独看。',
      '复盘时优先看回撤与命中率。',
    ],
  },
  {
    chapter: 4,
    title: 'DeFi 交易与流动性',
    conceptSummary: '理解 swap 与流动性增减的收益来源和成本。',
    coreTakeaways: [
      'Swap 是代币转换，不等同于无成本交易。',
      '流动性收益来自手续费，但伴随无常损失风险。',
      '进出池时机直接影响净收益。',
    ],
    commonPitfalls: [
      '忽视滑点和手续费，纸面盈利变真实亏损。',
      '频繁进出池，成本过高。',
      '只看年化，不看资金锁定与退出条件。',
    ],
    starterChecklist: [
      '先用保守滑点参数测试成交稳定性。',
      '记录加池与撤池前后净值变化。',
      '高波动时降低仓位并缩短持有周期。',
    ],
  },
  {
    chapter: 5,
    title: '质押与收益管理',
    conceptSummary: '把资金在交易与质押之间动态分配，提高资金效率。',
    coreTakeaways: [
      '质押收益稳定但流动性受限。',
      '解质押时机影响整体资金周转效率。',
      '组合策略要平衡稳定收益和机会收益。',
    ],
    commonPitfalls: [
      '全部资金长期锁定，错失市场机会。',
      '忽略解锁等待期，导致计划外空仓。',
      '只追高收益池，忽视协议风险。',
    ],
    starterChecklist: [
      '保留可流动资金应对突发行情。',
      '提前规划解锁时间，不临时解押。',
      '先验证小规模收益路径再扩大。',
    ],
  },
  {
    chapter: 6,
    title: '综合策略整合',
    conceptSummary: '把交易、风控、DeFi 模块整合成稳定可复用的策略模板。',
    coreTakeaways: [
      '完整策略 = 入场规则 + 资金分配 + 风控退出。',
      '可解释、可复盘、可迭代比复杂更重要。',
      '量化入门的核心是流程化思维。',
    ],
    commonPitfalls: [
      '模块堆叠过多，逻辑不可控。',
      '频繁大改，无法判断改动效果。',
      '只看单次成绩，不看多次稳定性。',
    ],
    starterChecklist: [
      '沉淀一版“最小可盈利模板”作为基线。',
      '每轮只优化一类问题：收益或风控。',
      '固定复盘顺序：先执行正确性，再看收益曲线。',
    ],
  },
];

export function getChapterQuickReview(chapter: number): ChapterQuickReview | undefined {
  return chapterQuickReviews.find((item) => item.chapter === chapter);
}

