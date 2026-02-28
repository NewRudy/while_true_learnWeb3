interface ChapterUnlockCelebrationProps {
  chapter: number;
  chapterName: string;
}

export default function ChapterUnlockCelebration({
  chapter,
  chapterName,
}: ChapterUnlockCelebrationProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] animate-fade-in-out" />

      <div className="relative z-10 w-[min(92vw,540px)] overflow-hidden rounded-3xl border border-cyan-200/40 bg-gradient-to-br from-cyan-400/20 via-slate-900 to-orange-400/20 p-6 text-center shadow-2xl animate-float-in">
        <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-cyan-300/25 blur-2xl" />
        <div className="absolute -bottom-10 -right-8 h-36 w-36 rounded-full bg-orange-300/20 blur-3xl" />

        <p className="relative text-xs uppercase tracking-[0.28em] text-cyan-100/90">
          Chapter Unlocked
        </p>
        <h3 className="relative mt-3 text-3xl font-semibold text-white">Chapter {chapter}</h3>
        <p className="relative mt-2 text-sm text-slate-200">{chapterName}</p>
        <p className="relative mt-4 text-xs text-emerald-200">
          +300 unlock bonus has been added to your wallet.
        </p>
      </div>
    </div>
  );
}

