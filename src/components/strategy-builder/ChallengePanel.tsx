import { useEffect, useMemo, useRef, useState } from 'react';
import { simulationEngine, moduleSystem } from '@/systems';
import {
  useLevelStore,
  getAllChapterMetadata,
  getLevelsByChapter,
  getLevelDefinitionById,
} from '@/systems/level-system';
import { useEconomyStore } from '@/systems/economy-system';
import {
  useMotivationStore,
  getNextStreakMilestone,
  type RewardBreakdown,
} from '@/systems/motivation-system';
import { useStrategyBuilderStore } from './StrategyBuilderStore';
import type {
  LevelDefinition,
  LevelObjectiveType,
  LevelCompletionResult,
  SimulationResult,
} from '@/types';

type LearningCard = {
  concept: string;
  whyItMatters: string;
  nextAction: string;
};

type ObjectiveDiagnostic = {
  id: string;
  description: string;
  completed: boolean;
  statusText: string;
  targetText: string;
  metricText: string;
  fixText: string;
};

export interface ChallengeRunPayload {
  level: LevelDefinition;
  simulationResult: SimulationResult;
  completionResult: LevelCompletionResult;
  completedObjectiveIds: string[];
}

interface ChallengePanelProps {
  mode?: 'free' | 'level';
  forcedLevelId?: string;
  onLevelFinished?: (payload: ChallengeRunPayload) => void;
  externalRunSignal?: number;
}

const objectiveLearningMap: Record<LevelObjectiveType, LearningCard> = {
  profit: {
    concept: '收益目标',
    whyItMatters: '策略必须具备可重复的正收益能力。',
    nextAction: '优化入场和出场规则，减少无效交易。',
  },
  transaction_count: {
    concept: '执行连贯性',
    whyItMatters: '完整策略图应持续产生有效交易。',
    nextAction: '修复断路，确保模块从头到尾可执行。',
  },
  use_module: {
    concept: '模块化组合',
    whyItMatters: 'Web3 策略依赖多个动作的正确组合。',
    nextAction: '补齐缺失模块，完善信号流路径。',
  },
  avoid_loss: {
    concept: '回撤控制',
    whyItMatters: '在追求收益前，必须先稳定控制风险。',
    nextAction: '增加更严格的退出条件和仓位控制。',
  },
};

function buildRecommendations(
  level: LevelDefinition,
  result: SimulationResult,
  completedObjectiveIds: string[]
): string[] {
  const suggestions: string[] = [];

  if (result.errors.length > 0) {
    suggestions.push(
      `先修复运行错误：${result.errors[0]?.message || '未知错误'}。`
    );
  }

  if (result.transactionCount === 0) {
    suggestions.push('当前无成交。请确保至少有一条可执行路径。');
  }

  const missedProfit = level.objectives.find(
    (objective) => objective.type === 'profit' && !completedObjectiveIds.includes(objective.id)
  );
  if (missedProfit) {
    suggestions.push(
      `收益目标未达成（${missedProfit.target}%）。需优化入场/出场时机。`
    );
  }

  const missedRisk = level.objectives.find(
    (objective) =>
      objective.type === 'avoid_loss' && !completedObjectiveIds.includes(objective.id)
  );
  if (missedRisk) {
    suggestions.push(
      `风控目标未达成。请将回撤控制在 ${missedRisk.target}% 内。`
    );
  }

  const missedCount = level.objectives.find(
    (objective) =>
      objective.type === 'transaction_count' &&
      !completedObjectiveIds.includes(objective.id)
  );
  if (missedCount) {
    suggestions.push(
      `成交次数不足。至少需要 ${missedCount.target} 次动作。`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push('目标已完成。可尝试减少模块数量，让策略更简洁。');
  }

  return suggestions.slice(0, 4);
}

function buildObjectiveDiagnostics(
  level: LevelDefinition,
  result: SimulationResult,
  completedObjectiveIds: string[]
): ObjectiveDiagnostic[] {
  const uniqueModuleCount = Array.isArray(result.executedModuleTypes)
    ? new Set(result.executedModuleTypes).size
    : 0;
  const lossPercent = result.profitLossPercent < 0 ? Math.abs(result.profitLossPercent) : 0;

  return level.objectives.map((objective) => {
    const completed = completedObjectiveIds.includes(objective.id);
    const learningCard = objectiveLearningMap[objective.type];

    if (objective.type === 'profit') {
      return {
        id: objective.id,
        description: objective.description,
        completed,
        statusText: completed ? '已达成' : '未达成',
        targetText: `目标收益 >= ${objective.target}%`,
        metricText: `当前收益 ${result.profitLossPercent.toFixed(2)}%`,
        fixText: learningCard.nextAction,
      };
    }

    if (objective.type === 'transaction_count') {
      return {
        id: objective.id,
        description: objective.description,
        completed,
        statusText: completed ? '已达成' : '未达成',
        targetText: `目标成交次数 >= ${objective.target}`,
        metricText: `当前成交次数 ${result.transactionCount}`,
        fixText: learningCard.nextAction,
      };
    }

    if (objective.type === 'use_module') {
      return {
        id: objective.id,
        description: objective.description,
        completed,
        statusText: completed ? '已达成' : '未达成',
        targetText: `目标执行模块种类 >= ${objective.target}`,
        metricText: `当前执行模块种类 ${uniqueModuleCount}`,
        fixText: learningCard.nextAction,
      };
    }

    return {
      id: objective.id,
      description: objective.description,
      completed,
      statusText: completed ? '已达成' : '未达成',
      targetText: `目标回撤 <= ${objective.target}%`,
      metricText: `当前回撤 ${lossPercent.toFixed(2)}%`,
      fixText: learningCard.nextAction,
    };
  });
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatCredits(value: number): string {
  return value.toLocaleString();
}

export default function ChallengePanel({
  mode = 'free',
  forcedLevelId,
  onLevelFinished,
  externalRunSignal = 0,
}: ChallengePanelProps) {
  const exportStrategy = useStrategyBuilderStore((state) => state.exportStrategy);
  const nodes = useStrategyBuilderStore((state) => state.nodes);
  const setPlayerLevel = useStrategyBuilderStore((state) => state.setPlayerLevel);
  const setAllowedModuleTypes = useStrategyBuilderStore((state) => state.setAllowedModuleTypes);

  const levelProgress = useLevelStore((state) => state.levelProgress);
  const unlockedChapters = useLevelStore((state) => state.unlockedChapters);
  const startLevel = useLevelStore((state) => state.startLevel);
  const completeLevel = useLevelStore((state) => state.completeLevel);
  const checkObjectivesCompletion = useLevelStore((state) => state.checkObjectivesCompletion);
  const loadLevelState = useLevelStore((state) => state.loadFromStorage);

  const addFunds = useEconomyStore((state) => state.addFunds);
  const walletBalance = useEconomyStore((state) => state.wallet.balance);
  const loadEconomyState = useEconomyStore((state) => state.loadFromStorage);

  const winStreak = useMotivationStore((state) => state.winStreak);
  const longestStreak = useMotivationStore((state) => state.longestStreak);
  const recordRunResult = useMotivationStore((state) => state.recordRunResult);
  const loadMotivationState = useMotivationStore((state) => state.loadFromStorage);

  const isLevelMode = mode === 'level';
  const chapters = useMemo(() => getAllChapterMetadata(), []);

  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [selectedLevelId, setSelectedLevelId] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<SimulationResult | null>(null);
  const [completionResult, setCompletionResult] = useState<LevelCompletionResult | null>(null);
  const [completedObjectiveIds, setCompletedObjectiveIds] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [objectiveDiagnostics, setObjectiveDiagnostics] = useState<ObjectiveDiagnostic[]>([]);
  const [runError, setRunError] = useState<string | null>(null);
  const [rewardBreakdown, setRewardBreakdown] = useState<RewardBreakdown | null>(null);

  const activeLevelRef = useRef<LevelDefinition | null>(null);
  const activeRunRef = useRef(false);
  const replayClearRef = useRef(false);

  const forcedLevel = useMemo(
    () => (forcedLevelId ? getLevelDefinitionById(forcedLevelId) ?? null : null),
    [forcedLevelId]
  );

  const levelsInChapter = useMemo(() => getLevelsByChapter(selectedChapter), [selectedChapter]);

  const unlockedLevelsInChapter = useMemo(
    () =>
      levelsInChapter.filter((level) => {
        const status = levelProgress[level.id]?.status;
        return Boolean(status && status !== 'locked');
      }),
    [levelsInChapter, levelProgress]
  );

  const selectedFreeLevel = useMemo(
    () => levelsInChapter.find((level) => level.id === selectedLevelId) ?? null,
    [levelsInChapter, selectedLevelId]
  );

  const selectedLevel = isLevelMode ? forcedLevel : selectedFreeLevel;
  const currentChapter = selectedLevel?.chapter ?? selectedChapter;
  const nextMilestone = getNextStreakMilestone(winStreak);

  const handleRunChallenge = () => {
    if (!selectedLevel) {
      setRunError('当前关卡不可用，请返回地图重新选择。');
      return;
    }

    if (nodes.length === 0) {
      setRunError('请先拖入至少一个模块再运行。');
      return;
    }

    const startedLevel = startLevel(selectedLevel.id);
    if (!startedLevel) {
      setRunError('关卡未解锁或不可用。');
      return;
    }

    replayClearRef.current = levelProgress[selectedLevel.id]?.status === 'completed';
    setRunError(null);
    setRunResult(null);
    setCompletionResult(null);
    setCompletedObjectiveIds([]);
    setRecommendations([]);
    setObjectiveDiagnostics([]);
    setRewardBreakdown(null);
    setIsRunning(true);
    activeRunRef.current = true;
    activeLevelRef.current = selectedLevel;

    const strategy = exportStrategy();
    simulationEngine.reset();
    simulationEngine.loadStrategy(strategy);
    simulationEngine.setSpeed(10);
    simulationEngine.start(selectedLevel.initialFunds);
  };

  useEffect(() => {
    loadLevelState();
    loadEconomyState();
    loadMotivationState();
  }, [loadEconomyState, loadLevelState, loadMotivationState]);

  useEffect(() => {
    if (isLevelMode) return;

    if (!unlockedChapters.includes(selectedChapter)) {
      setSelectedChapter(unlockedChapters[0] ?? 1);
    }
  }, [isLevelMode, selectedChapter, unlockedChapters]);

  useEffect(() => {
    if (isLevelMode) return;

    const defaultLevel = unlockedLevelsInChapter[0];
    if (!defaultLevel) {
      setSelectedLevelId('');
      return;
    }

    const stillValid = unlockedLevelsInChapter.some((level) => level.id === selectedLevelId);
    if (!selectedLevelId || !stillValid) {
      setSelectedLevelId(defaultLevel.id);
    }
  }, [isLevelMode, unlockedLevelsInChapter, selectedLevelId]);

  useEffect(() => {
    if (isLevelMode) {
      if (!selectedLevel) {
        setAllowedModuleTypes([]);
        setPlayerLevel(1);
        return;
      }

      const requiredUnlockLevel = selectedLevel.availableModules.reduce((maxLevel, moduleType) => {
        const moduleDefinition = moduleSystem.getModuleDefinition(moduleType);
        return Math.max(maxLevel, moduleDefinition.unlockLevel);
      }, 1);

      setAllowedModuleTypes(selectedLevel.availableModules);
      setPlayerLevel(requiredUnlockLevel);
      return;
    }

    setAllowedModuleTypes(null);
    setPlayerLevel(Math.max(1, selectedChapter * 2));
  }, [isLevelMode, selectedChapter, selectedLevel, setAllowedModuleTypes, setPlayerLevel]);

  useEffect(() => {
    return () => {
      setAllowedModuleTypes(null);
    };
  }, [setAllowedModuleTypes]);

  useEffect(() => {
    setRunResult(null);
    setCompletionResult(null);
    setCompletedObjectiveIds([]);
    setRecommendations([]);
    setObjectiveDiagnostics([]);
    setRunError(null);
    setRewardBreakdown(null);
  }, [selectedLevel?.id]);

  useEffect(() => {
    if (externalRunSignal > 0) {
      handleRunChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalRunSignal]);

  useEffect(() => {
    const unsubscribe = simulationEngine.onStateChange((state) => {
      if (
        (state.status === 'completed' || state.status === 'error') &&
        activeRunRef.current &&
        activeLevelRef.current
      ) {
        const result = simulationEngine.getResult();
        if (!result) return;

        const level = activeLevelRef.current;
        const completedIds = checkObjectivesCompletion(level.id, result);
        const levelCompletion = completeLevel(level.id, result);
        const reward = recordRunResult({
          success: levelCompletion.success,
          baseReward: levelCompletion.reward,
          replayClear: replayClearRef.current,
          unlockedNewChapter: levelCompletion.unlockedNewChapter,
        });

        if (reward.totalPayout > 0) {
          addFunds(reward.totalPayout, `Challenge payout: ${level.name}`);
        }

        setRunResult(result);
        setCompletedObjectiveIds(completedIds);
        setCompletionResult(levelCompletion);
        setRewardBreakdown(reward);
        setRecommendations(buildRecommendations(level, result, completedIds));
        setObjectiveDiagnostics(buildObjectiveDiagnostics(level, result, completedIds));
        setRunError(result.errors.length > 0 ? result.errors[0]?.message || '运行失败。' : null);
        setIsRunning(false);
        activeRunRef.current = false;

        onLevelFinished?.({
          level,
          simulationResult: result,
          completionResult: levelCompletion,
          completedObjectiveIds: completedIds,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addFunds, checkObjectivesCompletion, completeLevel, onLevelFinished, recordRunResult]);

  const chapterUnlocked = (chapter: number): boolean => unlockedChapters.includes(chapter);

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-white/10 bg-gray-900/95 shadow-2xl">
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">
          {isLevelMode ? '关卡挑战面板' : '挑战与学习循环'}
        </h3>
        <p className="mt-1 text-xs text-gray-400">
          {isLevelMode
            ? '先搭建策略图，再运行本关完成目标。'
            : '选择已解锁关卡，按目标反馈快速迭代。'}
        </p>
      </div>

      <div className="border-b border-white/10 bg-black/20 px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded border border-white/10 bg-black/20 p-2">
            <p className="text-[11px] text-gray-400">总资金</p>
            <p className="text-sm font-semibold text-emerald-300">{formatCredits(walletBalance)}</p>
          </div>
          <div className="rounded border border-amber-300/30 bg-amber-400/10 p-2">
            <p className="text-[11px] text-amber-100/90">连胜</p>
            <p className="text-sm font-semibold text-amber-100">
              x{winStreak}（最高 x{longestStreak}）
            </p>
          </div>
          <div className="rounded border border-white/10 bg-black/20 p-2">
            <p className="text-[11px] text-gray-400">本局起始资金</p>
            <p className="text-sm font-semibold text-cyan-200">
              {selectedLevel ? formatCredits(selectedLevel.initialFunds) : '-'}
            </p>
          </div>
          <div className="rounded border border-white/10 bg-black/20 p-2">
            <p className="text-[11px] text-gray-400">目标资金 / 交易上限</p>
            <p className="text-sm font-semibold text-orange-200">
              {selectedLevel
                ? `${formatCredits(selectedLevel.targetFunds)} / ${selectedLevel.maxTransactions}`
                : '-'}
            </p>
          </div>
        </div>

        {nextMilestone && (
          <p className="mt-2 rounded border border-cyan-300/30 bg-cyan-400/10 px-2 py-1.5 text-[11px] text-cyan-100">
            下一连胜宝箱：达到 x{nextMilestone.target} 可得 +{nextMilestone.bonus} 积分。
          </p>
        )}

        <button
          onClick={handleRunChallenge}
          disabled={isRunning}
          className={`mt-3 w-full rounded py-2 text-sm font-semibold transition-colors ${
            isRunning
              ? 'cursor-not-allowed bg-gray-700 text-gray-400'
              : 'bg-emerald-400 text-slate-900 hover:bg-emerald-300'
          }`}
        >
          {isRunning ? '运行中...' : '开始运行'}
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!isLevelMode && (
          <>
            <div className="space-y-2">
              <label className="block text-xs text-gray-400">章节</label>
              <select
                className="w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white"
                value={selectedChapter}
                onChange={(event) => setSelectedChapter(Number(event.target.value))}
              >
                {chapters.map((chapter) => (
                  <option
                    key={chapter.chapter}
                    value={chapter.chapter}
                    disabled={!chapterUnlocked(chapter.chapter)}
                  >
                    {`Chapter ${chapter.chapter}: ${chapter.name}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-gray-400">关卡</label>
              <select
                className="w-full rounded border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white"
                value={selectedLevelId}
                onChange={(event) => setSelectedLevelId(event.target.value)}
              >
                {unlockedLevelsInChapter.map((level) => (
                  <option key={level.id} value={level.id}>
                    {`Lv.${level.levelNumber} ${level.name}`}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {selectedLevel ? (
          <>
            <section className="rounded-lg border border-white/10 bg-gray-800/70 p-3">
              <h4 className="text-sm font-medium text-white">
                {`第 ${currentChapter} 章 - 第 ${selectedLevel.levelNumber} 关`}
              </h4>
              <p className="mt-1 text-xs text-primary-200">{selectedLevel.name}</p>
              <p className="mt-2 text-xs leading-relaxed text-gray-300">{selectedLevel.storyContext}</p>
            </section>

            <section className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 p-3">
              <h4 className="text-sm font-medium text-cyan-100">3 步最小通关路径</h4>
              <div className="mt-2 space-y-1.5">
                <p className="rounded border border-cyan-200/25 bg-black/20 px-2 py-1.5 text-xs text-cyan-50">
                  1. 在左侧拖入本关必需模块（至少 {selectedLevel.objectives.filter((objective) => objective.type === 'use_module').length || 1} 个关键动作）。
                </p>
                <p className="rounded border border-cyan-200/25 bg-black/20 px-2 py-1.5 text-xs text-cyan-50">
                  2. 用连线把模块接成完整执行链，保证至少一次有效成交。
                </p>
                <p className="rounded border border-cyan-200/25 bg-black/20 px-2 py-1.5 text-xs text-cyan-50">
                  3. 点击“开始运行”，根据结果面板逐条修正未完成目标。
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-gray-800/70 p-3">
              <h4 className="text-sm font-medium text-white">目标与概念卡</h4>
              <div className="mt-3 space-y-2">
                {selectedLevel.objectives.map((objective) => {
                  const card = objectiveLearningMap[objective.type];
                  const completed = completedObjectiveIds.includes(objective.id);

                  return (
                    <div
                      key={objective.id}
                      className={`rounded border p-2 ${
                        completed
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-white/10 bg-black/10'
                      }`}
                    >
                      <p className="text-xs text-white">{objective.description}</p>
                      <p className="mt-1 text-[11px] text-gray-300">{card.concept}</p>
                      <p className="text-[11px] text-gray-400">{card.whyItMatters}</p>
                      <p className="mt-1 text-[11px] text-primary-300">{card.nextAction}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {selectedLevel.hints.length > 0 && (
              <section className="rounded-lg border border-white/10 bg-gray-800/70 p-3">
                <h4 className="text-sm font-medium text-white">提示</h4>
                <div className="mt-2 space-y-1.5">
                  {selectedLevel.hints.map((hint) => (
                    <p
                      key={hint}
                      className="rounded border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-gray-300"
                    >
                      {hint}
                    </p>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <p className="rounded border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {isLevelMode ? '关卡加载失败，请返回地图重选。' : '当前章节没有可用关卡。'}
          </p>
        )}

        {runError && (
          <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {runError}
          </p>
        )}

        {runResult && completionResult && rewardBreakdown && (
          <section className="rounded-lg border border-white/10 bg-gray-800/70 p-3">
            <h4 className="text-sm font-medium text-white">结果与奖励节奏</h4>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-black/20 p-2">
                <p className="text-gray-400">收益率</p>
                <p
                  className={
                    runResult.profitLossPercent >= 0
                      ? 'font-semibold text-emerald-300'
                      : 'font-semibold text-red-300'
                  }
                >
                  {formatPercent(runResult.profitLossPercent)}
                </p>
              </div>
              <div className="rounded bg-black/20 p-2">
                <p className="text-gray-400">成交次数</p>
                <p className="font-semibold text-white">{runResult.transactionCount}</p>
              </div>
              <div className="rounded bg-black/20 p-2">
                <p className="text-gray-400">评分</p>
                <p className="font-semibold text-white">{completionResult.score}</p>
              </div>
              <div className="rounded bg-black/20 p-2">
                <p className="text-gray-400">连胜</p>
                <p className="font-semibold text-amber-200">x{rewardBreakdown.newStreak}</p>
              </div>
            </div>
            <p className="mt-2 rounded border border-white/10 bg-black/20 px-2 py-1.5 text-[11px] text-slate-200">
              实际执行模块：{' '}
              {runResult.executedModuleTypes && runResult.executedModuleTypes.length > 0
                ? `${runResult.executedModuleTypes.length}（${runResult.executedModuleTypes.join(', ')}）`
                : '未捕获到模块执行数据'}
            </p>

            <div className="mt-3 rounded border border-emerald-300/30 bg-emerald-400/10 p-2 text-xs">
              <p className="text-emerald-100">
                基础奖励：{formatCredits(rewardBreakdown.baseReward)} ｜ 额外奖励：+{formatCredits(rewardBreakdown.totalBonus)} ｜ 本次到账：{formatCredits(rewardBreakdown.totalPayout)}
              </p>
              {rewardBreakdown.replayReduction > 0 && (
                <p className="mt-1 text-emerald-100/80">
                  重复通关仅发放 35% 基础奖励，鼓励优先推进新关卡。
                </p>
              )}
              {rewardBreakdown.milestoneReached && (
                <p className="mt-1 text-emerald-100/80">
                  连胜里程碑达成：x{rewardBreakdown.milestoneReached}（+{formatCredits(rewardBreakdown.milestoneBonus)}）。
                </p>
              )}
              {rewardBreakdown.chapterUnlockBonus > 0 && (
                <p className="mt-1 text-emerald-100/80">
                  章节解锁奖励：+{formatCredits(rewardBreakdown.chapterUnlockBonus)}。
                </p>
              )}
              {rewardBreakdown.comebackBonus > 0 && (
                <p className="mt-1 text-emerald-100/80">
                  逆转奖励：+{formatCredits(rewardBreakdown.comebackBonus)}。
                </p>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {objectiveDiagnostics.map((diagnostic) => (
                <div
                  key={diagnostic.id}
                  className={`rounded border px-2 py-2 text-xs ${
                    diagnostic.completed
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                      : 'border-amber-300/30 bg-amber-400/10 text-amber-100'
                  }`}
                >
                  <p className="font-medium">{diagnostic.description} - {diagnostic.statusText}</p>
                  <p className="mt-1">{diagnostic.targetText}</p>
                  <p>{diagnostic.metricText}</p>
                  {!diagnostic.completed && (
                    <p className="mt-1 text-amber-50/90">修复建议：{diagnostic.fixText}</p>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-white">
              {completionResult.success
                ? '本关通关。保持连胜可持续提升奖励强度。'
                : '本关未过。连胜已重置，建议先修复关键问题再冲刺。'}
            </p>

            {(completionResult.unlockedNewLevel || completionResult.unlockedNewChapter) && (
              <p className="mt-2 rounded border border-cyan-300/35 bg-cyan-400/10 px-2 py-1.5 text-xs text-cyan-100">
                {completionResult.unlockedNewChapter
                  ? '已解锁新章节。'
                  : '已解锁下一关。'}
              </p>
            )}

            <div className="mt-3 space-y-2">
              {recommendations.map((item) => (
                <p
                  key={item}
                  className="rounded border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-gray-200"
                >
                  {item}
                </p>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
