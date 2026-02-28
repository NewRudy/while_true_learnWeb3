import { useMemo } from 'react';
import {
  allLevelDefinitions,
  getAllChapterMetadata,
  getLevelsByChapter,
  useLevelStore,
} from '@/systems/level-system';
import { useEconomyStore } from '@/systems/economy-system';
import { getNextStreakMilestone, useMotivationStore } from '@/systems/motivation-system';
import type { LevelDefinition, LevelObjectiveType, LevelStatus } from '@/types';

interface LevelMapPageProps {
  onOpenLevel: (levelId: string) => void;
  onBackToHome: () => void;
  onOpenGraduation: () => void;
  onOpenQuickReview?: (chapter: number) => void;
}

const objectiveConceptMap: Record<LevelObjectiveType, string> = {
  profit: '收益目标',
  transaction_count: '执行连贯性',
  use_module: '策略组合',
  avoid_loss: '风险控制',
};

const statusLabelMap: Record<LevelStatus, string> = {
  locked: '未解锁',
  unlocked: '可挑战',
  in_progress: '进行中',
  completed: '已通关',
};

function getLevelConcepts(level: LevelDefinition): string[] {
  return Array.from(
    new Set(level.objectives.map((objective) => objectiveConceptMap[objective.type]))
  );
}

function getStatusStyle(status: LevelStatus): string {
  if (status === 'completed') return 'border-emerald-400/40 bg-emerald-400/10';
  if (status === 'in_progress') return 'border-amber-300/40 bg-amber-400/10';
  if (status === 'unlocked') return 'border-cyan-300/40 bg-cyan-400/10';
  return 'border-white/10 bg-slate-900/40';
}

export default function LevelMapPage({
  onOpenLevel,
  onBackToHome,
  onOpenGraduation,
  onOpenQuickReview,
}: LevelMapPageProps) {
  const levelProgress = useLevelStore((state) => state.levelProgress);
  const unlockedChapters = useLevelStore((state) => state.unlockedChapters);
  const walletBalance = useEconomyStore((state) => state.wallet.balance);
  const winStreak = useMotivationStore((state) => state.winStreak);
  const longestStreak = useMotivationStore((state) => state.longestStreak);
  const totalBonusEarned = useMotivationStore((state) => state.totalBonusEarned);

  const chapterMetadata = useMemo(() => getAllChapterMetadata(), []);
  const completedCount = useMemo(
    () =>
      allLevelDefinitions.filter((level) => levelProgress[level.id]?.status === 'completed')
        .length,
    [levelProgress]
  );
  const totalCount = allLevelDefinitions.length;
  const completionPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const nextPlayableLevel = useMemo(
    () =>
      allLevelDefinitions.find((level) => {
        const status = levelProgress[level.id]?.status ?? 'locked';
        return status === 'unlocked' || status === 'in_progress';
      }) ?? null,
    [levelProgress]
  );

  const canGraduate = completedCount === totalCount && totalCount > 0;
  const nextMilestone = getNextStreakMilestone(winStreak);

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <section className="rounded-3xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/20 to-orange-400/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">关卡地图</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200">
                每关学一个关键概念，按章节推进，直到完成完整入门路径。
              </p>
            </div>
            <button
              onClick={onBackToHome}
              className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-xs text-white transition hover:bg-black/35"
            >
              返回首页
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-xs text-slate-300">总体进度</p>
              <p className="mt-1 text-lg font-semibold">
                {completedCount}/{totalCount} ({completionPercent}%)
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-xs text-slate-300">钱包积分</p>
              <p className="mt-1 text-lg font-semibold">{walletBalance.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-amber-300/35 bg-amber-400/10 p-3">
              <p className="text-xs text-amber-100/90">连胜</p>
              <p className="mt-1 text-lg font-semibold text-amber-100">x{winStreak}</p>
              <p className="mt-1 text-[11px] text-amber-100/80">最高 x{longestStreak}</p>
            </div>
            <div className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-3">
              <p className="text-xs text-emerald-100/90">累计额外奖励</p>
              <p className="mt-1 text-lg font-semibold text-emerald-100">
                +{totalBonusEarned.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-emerald-100/80">含连胜/章节解锁奖励</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 p-3">
              <p className="text-xs text-slate-300">下一步</p>
              {nextPlayableLevel ? (
                <button
                  onClick={() => onOpenLevel(nextPlayableLevel.id)}
                  className="mt-1 rounded-full bg-cyan-300 px-4 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-cyan-200"
                >
                  继续 Lv.{nextPlayableLevel.chapter}.{nextPlayableLevel.levelNumber}
                </button>
              ) : (
                <p className="mt-1 text-sm text-slate-200">当前已解锁关卡均已完成。</p>
              )}
              {nextMilestone && (
                <p className="mt-1 text-[11px] text-cyan-100/80">
                  连胜 x{nextMilestone.target} 可得 +{nextMilestone.bonus}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-5">
          {chapterMetadata.map((chapter) => {
            const chapterUnlocked = unlockedChapters.includes(chapter.chapter);
            const levels = getLevelsByChapter(chapter.chapter);
            const chapterCompleted = levels.filter(
              (level) => levelProgress[level.id]?.status === 'completed'
            ).length;

            return (
              <article
                key={chapter.chapter}
                className={`rounded-2xl border p-4 ${
                  chapterUnlocked
                    ? 'border-white/15 bg-slate-900/70'
                    : 'border-white/10 bg-slate-900/40 opacity-70'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/90">
                      Chapter {chapter.chapter}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{chapter.name}</h2>
                    <p className="mt-1 text-sm text-slate-300">{chapter.description}</p>
                  </div>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-200">
                    {chapterCompleted}/{levels.length} 通关
                  </span>
                  {chapterCompleted === levels.length && (
                    <button
                      onClick={() => onOpenQuickReview?.(chapter.chapter)}
                      className="rounded-full border border-cyan-300/35 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100 transition hover:bg-cyan-400/20"
                    >
                      查看 1 分钟速记卡
                    </button>
                  )}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {levels.map((level) => {
                    const status = levelProgress[level.id]?.status ?? 'locked';
                    const concepts = getLevelConcepts(level);
                    const isLocked = status === 'locked';

                    return (
                      <div key={level.id} className={`rounded-xl border p-4 ${getStatusStyle(status)}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">
                            Lv.{level.chapter}.{level.levelNumber} {level.name}
                          </p>
                          <span className="text-xs text-slate-300">{statusLabelMap[status]}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-300">{level.description}</p>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {concepts.map((concept) => (
                            <span
                              key={`${level.id}-${concept}`}
                              className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-slate-200"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => onOpenLevel(level.id)}
                          disabled={isLocked}
                          className={`mt-4 w-full rounded-lg px-3 py-2 text-sm font-medium transition ${
                            isLocked
                              ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                              : 'bg-cyan-300 text-slate-900 hover:bg-cyan-200'
                          }`}
                        >
                          {status === 'completed' ? '复盘本关' : '进入本关'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>

        {canGraduate && (
          <section className="mt-6 rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-5">
            <p className="text-sm text-emerald-200">
              你已完成全部关卡，可以打开毕业总结并整理黑客松提交材料。
            </p>
            <button
              onClick={onOpenGraduation}
              className="mt-3 rounded-full bg-emerald-300 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-200"
            >
              打开毕业总结
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
