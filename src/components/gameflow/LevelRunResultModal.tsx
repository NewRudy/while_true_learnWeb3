type LevelRunResultModalProps = {
  open: boolean;
  success: boolean;
  levelName: string;
  score: number;
  reward: number;
  profitLossPercent: number;
  transactionCount: number;
  nextLevelName?: string | null;
  isFinalLevel?: boolean;
  onClose: () => void;
  onBackToMap: () => void;
  onQuickNext?: () => void;
  onOpenGraduation?: () => void;
};

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default function LevelRunResultModal({
  open,
  success,
  levelName,
  score,
  reward,
  profitLossPercent,
  transactionCount,
  nextLevelName,
  isFinalLevel = false,
  onClose,
  onBackToMap,
  onQuickNext,
  onOpenGraduation,
}: LevelRunResultModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 px-4">
      <div
        className={`w-full max-w-xl rounded-2xl border p-5 shadow-2xl ${
          success
            ? 'border-emerald-300/40 bg-emerald-950/90'
            : 'border-red-300/35 bg-red-950/90'
        }`}
      >
        <p className="text-xs uppercase tracking-wide text-white/60">关卡运行结果</p>
        <h3 className="mt-1 text-xl font-semibold text-white">
          {success ? '通关成功' : '挑战失败'} · {levelName}
        </h3>
        <p className="mt-2 text-sm text-white/80">
          {success
            ? '本次运行已满足关卡目标。'
            : '本次运行未满足全部目标，建议按诊断面板修正后重试。'}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded border border-white/15 bg-black/25 p-2 text-white/90">
            评分：{score}
          </div>
          <div className="rounded border border-white/15 bg-black/25 p-2 text-white/90">
            奖励：{reward.toLocaleString()}
          </div>
          <div className="rounded border border-white/15 bg-black/25 p-2 text-white/90">
            收益率：{formatPercent(profitLossPercent)}
          </div>
          <div className="rounded border border-white/15 bg-black/25 p-2 text-white/90">
            成交次数：{transactionCount}
          </div>
        </div>

        {success && nextLevelName && (
          <p className="mt-3 rounded border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">
            已解锁下一关：{nextLevelName}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {success && !isFinalLevel && onQuickNext && (
            <button
              onClick={onQuickNext}
              className="rounded bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-cyan-200"
            >
              快速进入下一关
            </button>
          )}

          {success && isFinalLevel && onOpenGraduation && (
            <button
              onClick={onOpenGraduation}
              className="rounded bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-cyan-200"
            >
              查看毕业总结
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded border border-white/25 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            留在本关继续
          </button>

          <button
            onClick={onBackToMap}
            className="rounded border border-white/25 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            返回关卡地图
          </button>
        </div>
      </div>
    </div>
  );
}

