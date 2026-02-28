import { useEffect, useMemo, useState } from 'react';
import StrategyCanvas from './StrategyCanvas';
import ModulePanel from './ModulePanel';
import NodeConfigPanel from './NodeConfigPanel';
import ChallengePanel, { type ChallengeRunPayload } from './ChallengePanel';
import { useStrategyBuilderStore } from './StrategyBuilderStore';
import { getLevelDefinitionById } from '@/systems/level-system';
import { useEconomyStore } from '@/systems/economy-system';
import type { StrategyListItem } from '@/utils';

interface SaveLoadDialogProps {
  isOpen: boolean;
  mode: 'save' | 'load';
  onClose: () => void;
  savedStrategies: StrategyListItem[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

interface StrategyToolbarProps {
  mode: 'sandbox' | 'level';
  levelTitle?: string;
  onBackToMap?: () => void;
  onRun: () => void;
  walletBalance: number;
  startFunds?: number;
  targetFunds?: number;
  maxTransactions?: number;
}

export interface StrategyBuilderProps {
  mode?: 'sandbox' | 'level';
  levelId?: string;
  onBackToMap?: () => void;
  onLevelFinished?: (payload: ChallengeRunPayload) => void;
}

function SaveLoadDialog({
  isOpen,
  mode,
  onClose,
  savedStrategies,
  onLoad,
  onDelete,
}: SaveLoadDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex max-h-[80vh] w-96 flex-col overflow-hidden rounded-lg bg-gray-800 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {mode === 'save' ? '保存策略' : '加载策略'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
          >
            x
          </button>
        </div>

        {savedStrategies.length === 0 ? (
          <p className="py-8 text-center text-gray-400">暂无已保存策略。</p>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto">
            {savedStrategies.map((strategy) => (
              <div
                key={strategy.id}
                className="flex items-center justify-between rounded bg-gray-700 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{strategy.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(strategy.updatedAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div className="ml-2 flex items-center gap-2">
                  {mode === 'load' && (
                    <button
                      onClick={() => onLoad(strategy.id)}
                      className="rounded bg-primary-500 px-3 py-1 text-sm text-white transition-colors hover:bg-primary-600"
                    >
                      加载
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(strategy.id)}
                    className="rounded bg-red-500/20 px-3 py-1 text-sm text-red-400 transition-colors hover:bg-red-500/30"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StrategyToolbar({
  mode,
  levelTitle,
  onBackToMap,
  onRun,
  walletBalance,
  startFunds,
  targetFunds,
  maxTransactions,
}: StrategyToolbarProps) {
  const strategyName = useStrategyBuilderStore((state) => state.strategyName);
  const setStrategyName = useStrategyBuilderStore((state) => state.setStrategyName);
  const clearStrategy = useStrategyBuilderStore((state) => state.clearStrategy);
  const saveStrategy = useStrategyBuilderStore((state) => state.saveStrategy);
  const loadStrategy = useStrategyBuilderStore((state) => state.loadStrategy);
  const deleteStrategy = useStrategyBuilderStore((state) => state.deleteStrategy);
  const getSavedStrategyList = useStrategyBuilderStore((state) => state.getSavedStrategyList);
  const nodes = useStrategyBuilderStore((state) => state.nodes);
  const edges = useStrategyBuilderStore((state) => state.edges);

  const [dialogMode, setDialogMode] = useState<'save' | 'load' | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<StrategyListItem[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleOpenDialog = (dialog: 'save' | 'load') => {
    setSavedStrategies(getSavedStrategyList());
    setDialogMode(dialog);
  };

  const handleCloseDialog = () => {
    setDialogMode(null);
  };

  const handleSave = () => {
    const success = saveStrategy();
    setSaveMessage(success ? '策略已保存' : '保存失败');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleLoad = (strategyId: string) => {
    const success = loadStrategy(strategyId);
    if (success) {
      handleCloseDialog();
    }
  };

  const handleDelete = (strategyId: string) => {
    const success = deleteStrategy(strategyId);
    if (success) {
      setSavedStrategies(getSavedStrategyList());
    }
  };

  return (
    <>
      <div className="flex h-14 items-center gap-3 border-b border-white/10 bg-gray-900/80 px-4 backdrop-blur-sm">
        {mode === 'level' && (
          <button
            onClick={onBackToMap}
            className="rounded border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-200 transition-colors hover:bg-cyan-400/20"
          >
            返回关卡地图
          </button>
        )}

        {mode === 'level' && levelTitle && (
          <span className="max-w-[220px] truncate rounded border border-white/15 bg-black/20 px-3 py-1 text-xs text-slate-200">
            {levelTitle}
          </span>
        )}

        <span className="rounded border border-emerald-400/35 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">
          总资金：{walletBalance.toLocaleString()}
        </span>

        {mode === 'level' && typeof startFunds === 'number' && typeof targetFunds === 'number' && (
          <span className="rounded border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-100">
            本局 {startFunds.toLocaleString()} -&gt; 目标 {targetFunds.toLocaleString()}
          </span>
        )}

        {mode === 'level' && typeof maxTransactions === 'number' && (
          <span className="rounded border border-orange-300/30 bg-orange-400/10 px-2 py-1 text-xs text-orange-100">
            交易上限：{maxTransactions}
          </span>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">策略名称：</span>
          <input
            type="text"
            value={strategyName}
            onChange={(event) => setStrategyName(event.target.value)}
            className="rounded border border-white/10 bg-gray-800 px-3 py-1 text-sm text-white focus:border-primary-500 focus:outline-none"
            placeholder="输入策略名称"
          />
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>节点：{nodes.length}</span>
          <span>连接：{edges.length}</span>
        </div>

        <div className="flex-1" />

        {saveMessage && <span className="animate-pulse text-sm text-green-400">{saveMessage}</span>}

        <button
          onClick={handleSave}
          className="rounded bg-primary-500/20 px-4 py-1.5 text-sm text-primary-400 transition-colors hover:bg-primary-500/30"
        >
          保存
        </button>
        <button
          onClick={onRun}
          className="rounded bg-emerald-400 px-4 py-1.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-emerald-300"
        >
          开始运行
        </button>
        <button
          onClick={() => handleOpenDialog('load')}
          className="rounded bg-blue-500/20 px-4 py-1.5 text-sm text-blue-400 transition-colors hover:bg-blue-500/30"
        >
          加载
        </button>
        <button
          onClick={clearStrategy}
          className="rounded bg-red-500/20 px-4 py-1.5 text-sm text-red-400 transition-colors hover:bg-red-500/30"
        >
          清空画布
        </button>
      </div>

      <SaveLoadDialog
        isOpen={dialogMode !== null}
        mode={dialogMode || 'load'}
        onClose={handleCloseDialog}
        savedStrategies={savedStrategies}
        onLoad={handleLoad}
        onDelete={handleDelete}
      />
    </>
  );
}

export default function StrategyBuilder({
  mode = 'sandbox',
  levelId,
  onBackToMap,
  onLevelFinished,
}: StrategyBuilderProps) {
  const clearStrategy = useStrategyBuilderStore((state) => state.clearStrategy);
  const walletBalance = useEconomyStore((state) => state.wallet.balance);
  const [externalRunSignal, setExternalRunSignal] = useState(0);

  const levelDefinition = useMemo(() => {
    if (mode !== 'level' || !levelId) {
      return null;
    }
    return getLevelDefinitionById(levelId) ?? null;
  }, [levelId, mode]);

  const levelTitle = useMemo(() => {
    if (!levelDefinition) {
      return mode === 'level' ? '关卡不可用' : '';
    }
    return `Lv.${levelDefinition.chapter}.${levelDefinition.levelNumber} ${levelDefinition.name}`;
  }, [levelDefinition, mode]);

  useEffect(() => {
    if (mode === 'level' && levelId) {
      clearStrategy();
    }
  }, [clearStrategy, levelId, mode]);

  return (
    <div className="flex h-full w-full flex-col bg-gray-950">
      <StrategyToolbar
        mode={mode}
        levelTitle={levelTitle}
        onBackToMap={onBackToMap}
        onRun={() => setExternalRunSignal((prev) => prev + 1)}
        walletBalance={walletBalance}
        startFunds={levelDefinition?.initialFunds}
        targetFunds={levelDefinition?.targetFunds}
        maxTransactions={levelDefinition?.maxTransactions}
      />

      <div className="flex flex-1 overflow-hidden">
        <ModulePanel />

        <div className="relative min-w-0 flex-1">
          <StrategyCanvas />
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded border border-white/15 bg-black/40 px-2 py-1 text-[11px] text-slate-200">
            左下角控件仅用于缩放/适配视图。运行请点顶部“开始运行”或右侧面板按钮。
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 top-3 z-20 w-[360px]">
            <div className="pointer-events-auto h-full">
              <ChallengePanel
                mode={mode === 'level' ? 'level' : 'free'}
                forcedLevelId={levelId}
                onLevelFinished={onLevelFinished}
                externalRunSignal={externalRunSignal}
              />
            </div>
          </div>
        </div>

        <NodeConfigPanel />
      </div>
    </div>
  );
}
