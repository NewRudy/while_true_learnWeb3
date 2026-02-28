import { getChapterQuickReview } from '@/content/chapter-quick-review';

interface ChapterQuickReviewModalProps {
  chapter: number;
  onClose: () => void;
}

export default function ChapterQuickReviewModal({
  chapter,
  onClose,
}: ChapterQuickReviewModalProps) {
  const review = getChapterQuickReview(chapter);

  if (!review) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-[min(96vw,760px)] max-h-[88vh] overflow-y-auto rounded-3xl border border-cyan-200/35 bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/90">1 分钟速记卡</p>
            <h3 className="mt-2 text-2xl font-semibold">
              第 {review.chapter} 章：{review.title}
            </h3>
            <p className="mt-2 text-sm text-slate-200">{review.conceptSummary}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-white/20 bg-black/20 px-3 py-1 text-xs text-slate-200 transition hover:bg-black/40"
          >
            关闭
          </button>
        </div>

        <section className="mt-5 rounded-xl border border-emerald-300/25 bg-emerald-400/10 p-4">
          <h4 className="text-sm font-semibold text-emerald-100">你现在应该掌握</h4>
          <div className="mt-2 space-y-1.5">
            {review.coreTakeaways.map((item) => (
              <p
                key={item}
                className="rounded border border-emerald-200/20 bg-black/20 px-2 py-1.5 text-xs text-emerald-50"
              >
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-amber-300/25 bg-amber-400/10 p-4">
          <h4 className="text-sm font-semibold text-amber-100">常见误区</h4>
          <div className="mt-2 space-y-1.5">
            {review.commonPitfalls.map((item) => (
              <p
                key={item}
                className="rounded border border-amber-200/20 bg-black/20 px-2 py-1.5 text-xs text-amber-50"
              >
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-cyan-300/25 bg-cyan-400/10 p-4">
          <h4 className="text-sm font-semibold text-cyan-100">实战起步清单</h4>
          <div className="mt-2 space-y-1.5">
            {review.starterChecklist.map((item) => (
              <p
                key={item}
                className="rounded border border-cyan-200/20 bg-black/20 px-2 py-1.5 text-xs text-cyan-50"
              >
                {item}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

