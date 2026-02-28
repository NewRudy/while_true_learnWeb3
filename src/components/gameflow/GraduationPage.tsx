import { useMemo } from 'react';
import { getAllChapterMetadata, getLevelsByChapter, useLevelStore } from '@/systems/level-system';
import { useEconomyStore } from '@/systems/economy-system';

interface GraduationPageProps {
  onBackToMap: () => void;
}

const chapterSkillMap: Record<number, string> = {
  1: 'Basic order actions and flow',
  2: 'Conditional logic and position sizing',
  3: 'Stop-loss and take-profit risk control',
  4: 'DeFi swap and liquidity operations',
  5: 'Staking and yield workflow',
  6: 'Multi-module strategy synthesis',
};

const submissionChecklist = [
  'Playable entry page and level map',
  'Level-based mini-game loop with measurable objectives',
  'Post-run feedback with actionable recommendations',
  'Progression with unlock states and chapter completion',
  'Beginner quant trading concept coverage',
];

export default function GraduationPage({ onBackToMap }: GraduationPageProps) {
  const levelProgress = useLevelStore((state) => state.levelProgress);
  const wallet = useEconomyStore((state) => state.wallet);

  const chapterMetadata = useMemo(() => getAllChapterMetadata(), []);
  const summary = useMemo(() => {
    let totalLevels = 0;
    let completedLevels = 0;
    let scoreSum = 0;
    let scoredLevels = 0;

    for (const chapter of chapterMetadata) {
      const levels = getLevelsByChapter(chapter.chapter);
      totalLevels += levels.length;

      for (const level of levels) {
        const progress = levelProgress[level.id];
        if (progress?.status === 'completed') {
          completedLevels += 1;
          scoreSum += progress.bestScore;
          scoredLevels += 1;
        }
      }
    }

    const avgScore = scoredLevels > 0 ? Math.round(scoreSum / scoredLevels) : 0;
    return { totalLevels, completedLevels, avgScore };
  }, [chapterMetadata, levelProgress]);

  return (
    <main className="min-h-screen w-full overflow-y-auto bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-3xl border border-emerald-400/35 bg-gradient-to-br from-emerald-500/20 via-slate-900 to-cyan-500/10 p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/90">Graduation</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Quant Trading Foundations Completed
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
            You have completed the full learning path and finished all mini-game levels.
            This build is ready to be packaged as a hackathon submission.
          </p>
          <button
            onClick={onBackToMap}
            className="mt-6 rounded-full bg-emerald-300 px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-200"
          >
            Back to Level Map
          </button>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/15 bg-slate-900/75 p-4">
            <p className="text-xs text-slate-300">Levels completed</p>
            <p className="mt-1 text-2xl font-semibold">
              {summary.completedLevels}/{summary.totalLevels}
            </p>
          </article>
          <article className="rounded-2xl border border-white/15 bg-slate-900/75 p-4">
            <p className="text-xs text-slate-300">Average best score</p>
            <p className="mt-1 text-2xl font-semibold">{summary.avgScore}</p>
          </article>
          <article className="rounded-2xl border border-white/15 bg-slate-900/75 p-4">
            <p className="text-xs text-slate-300">Wallet balance</p>
            <p className="mt-1 text-2xl font-semibold">{wallet.balance.toLocaleString()}</p>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-white/15 bg-slate-900/75 p-5">
          <h2 className="text-lg font-semibold">Capability Coverage</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {chapterMetadata.map((chapter) => {
              const levels = getLevelsByChapter(chapter.chapter);
              const chapterDone = levels.every(
                (level) => levelProgress[level.id]?.status === 'completed'
              );

              return (
                <div
                  key={chapter.chapter}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    chapterDone
                      ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200'
                      : 'border-white/10 bg-black/20 text-slate-300'
                  }`}
                >
                  Chapter {chapter.chapter}: {chapterSkillMap[chapter.chapter]}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/15 bg-slate-900/75 p-5">
          <h2 className="text-lg font-semibold">Submission Checklist</h2>
          <div className="mt-3 space-y-2">
            {submissionChecklist.map((item) => (
              <p key={item} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200">
                {item}
              </p>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
