import { getNextStreakMilestone, useMotivationStore } from '@/systems/motivation-system';

interface LandingPageProps {
  completedLevels: number;
  totalLevels: number;
  onStartJourney: () => void;
}

const journeySteps = [
  {
    title: '从核心概念开始',
    description: '每个关卡聚焦一个交易概念，边做边学，不靠死记硬背。',
  },
  {
    title: '搭建策略图',
    description: '用可视化模块组合策略逻辑，理解执行链路。',
  },
  {
    title: '看数据复盘',
    description: '每次运行都看收益、风险、目标完成度，快速迭代。',
  },
  {
    title: '完成量化入门',
    description: '通关后你会建立可迁移的交易与风控基础。',
  },
];

export default function LandingPage({
  completedLevels,
  totalLevels,
  onStartJourney,
}: LandingPageProps) {
  const winStreak = useMotivationStore((state) => state.winStreak);
  const totalBonusEarned = useMotivationStore((state) => state.totalBonusEarned);
  const hasProgress = completedLevels > 0;
  const completionPercent =
    totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
  const nextMilestone = getNextStreakMilestone(winStreak);

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <section className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-orange-500/10 px-6 py-8 md:px-10 md:py-12">
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-400/20 blur-3xl" />
          <div className="absolute -bottom-28 -left-14 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-200/90">ChainQuest</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">
              Web3 交易学习闯关游戏
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-200 md:text-base">
              从基础交易动作出发，逐关掌握策略、风险与执行概念，最终完成量化交易入门。
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={onStartJourney}
                className="rounded-full bg-cyan-300 px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200"
              >
                {hasProgress ? '继续闯关' : '开始闯关'}
              </button>
              <span className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs text-slate-200">
                进度：{completedLevels}/{totalLevels}（{completionPercent}%）
              </span>
              <span className="rounded-full border border-amber-300/35 bg-amber-400/10 px-4 py-2 text-xs text-amber-100">
                连胜 x{winStreak}
              </span>
              <span className="rounded-full border border-emerald-300/35 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100">
                累计额外奖励 +{totalBonusEarned.toLocaleString()}
              </span>
            </div>

            {nextMilestone && (
              <p className="mt-3 text-xs text-cyan-100/85">
                下一连胜宝箱：再通关 {nextMilestone.target - winStreak} 关，额外 +{nextMilestone.bonus}
              </p>
            )}
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:mt-10 md:grid-cols-2">
          {journeySteps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"
            >
              <p className="text-xs text-cyan-300">步骤 {index + 1}</p>
              <h2 className="mt-1 text-lg font-semibold text-white">{step.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{step.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

