import { useEffect, useMemo, useRef, useState } from 'react';
import {
  StrategyBuilder,
  LandingPage,
  LevelMapPage,
  GraduationPage,
  ChapterUnlockCelebration,
  ChapterQuickReviewModal,
  LevelRunResultModal,
  type ChallengeRunPayload,
} from './components';
import {
  getAllLevelDefinitions,
  getChapterMetadata,
  getNextLevel,
  isLastLevel,
  useLevelStore,
} from './systems/level-system';
import { useEconomyStore, useMotivationStore } from './systems';

type AppScreen = 'landing' | 'map' | 'play' | 'graduation';

type LevelRunModalState = {
  open: boolean;
  success: boolean;
  levelName: string;
  score: number;
  reward: number;
  profitLossPercent: number;
  transactionCount: number;
  nextLevelId: string | null;
  nextLevelName: string | null;
  finalLevel: boolean;
};

function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [chapterUnlockFx, setChapterUnlockFx] = useState<{
    chapter: number;
    chapterName: string;
  } | null>(null);
  const [quickReviewChapter, setQuickReviewChapter] = useState<number | null>(null);
  const [runModal, setRunModal] = useState<LevelRunModalState | null>(null);

  const levelProgress = useLevelStore((state) => state.levelProgress);
  const unlockedChapters = useLevelStore((state) => state.unlockedChapters);
  const loadLevelState = useLevelStore((state) => state.loadFromStorage);
  const loadEconomyState = useEconomyStore((state) => state.loadFromStorage);
  const loadMotivationState = useMotivationStore((state) => state.loadFromStorage);
  const previousUnlockedRef = useRef<number[]>([]);

  const levels = useMemo(() => getAllLevelDefinitions(), []);
  const completedLevels = useMemo(
    () =>
      levels.filter((level) => levelProgress[level.id]?.status === 'completed').length,
    [levels, levelProgress]
  );
  const totalLevels = levels.length;
  const allCleared = totalLevels > 0 && completedLevels === totalLevels;

  useEffect(() => {
    loadLevelState();
    loadEconomyState();
    loadMotivationState();
  }, [loadEconomyState, loadLevelState, loadMotivationState]);

  useEffect(() => {
    const previousUnlocked = previousUnlockedRef.current;
    const newlyUnlockedChapter = unlockedChapters.find(
      (chapter) => !previousUnlocked.includes(chapter)
    );
    previousUnlockedRef.current = unlockedChapters;

    if (!newlyUnlockedChapter || previousUnlocked.length === 0) {
      return;
    }

    const chapterMeta = getChapterMetadata(newlyUnlockedChapter);
    setChapterUnlockFx({
      chapter: newlyUnlockedChapter,
      chapterName: chapterMeta?.name ?? 'New Chapter',
    });

    const hideFxTimer = window.setTimeout(() => {
      setChapterUnlockFx(null);
    }, 2600);
    const openReviewTimer = window.setTimeout(() => {
      const completedChapter = newlyUnlockedChapter - 1;
      if (completedChapter >= 1) {
        setQuickReviewChapter(completedChapter);
      }
    }, 2800);

    return () => {
      window.clearTimeout(hideFxTimer);
      window.clearTimeout(openReviewTimer);
    };
  }, [unlockedChapters]);

  useEffect(() => {
    if (screen === 'play' && !activeLevelId) {
      setScreen('map');
    }
  }, [activeLevelId, screen]);

  const handleStartJourney = () => {
    setScreen(allCleared ? 'graduation' : 'map');
  };

  const handleOpenLevel = (levelId: string) => {
    setActiveLevelId(levelId);
    setScreen('play');
  };

  const handleBackToMap = () => {
    setScreen('map');
  };

  const handleLevelFinished = ({
    level,
    completionResult,
    simulationResult,
  }: ChallengeRunPayload) => {
    const nextLevel = getNextLevel(level.id);
    const finalLevel = isLastLevel(level.id);

    setRunModal({
      open: true,
      success: completionResult.success,
      levelName: level.name,
      score: completionResult.score,
      reward: completionResult.reward,
      profitLossPercent: simulationResult.profitLossPercent,
      transactionCount: simulationResult.transactionCount,
      nextLevelId: completionResult.success && nextLevel ? nextLevel.id : null,
      nextLevelName:
        completionResult.success && nextLevel
          ? `Lv.${nextLevel.chapter}.${nextLevel.levelNumber} ${nextLevel.name}`
          : null,
      finalLevel,
    });
  };

  const handleCloseRunModal = () => {
    setRunModal((previous) => (previous ? { ...previous, open: false } : null));
  };

  const handleBackToMapFromModal = () => {
    setRunModal(null);
    setScreen('map');
  };

  const handleQuickNextLevel = () => {
    if (!runModal?.nextLevelId) return;
    setActiveLevelId(runModal.nextLevelId);
    setRunModal(null);
    setScreen('play');
  };

  const handleOpenGraduation = () => {
    setRunModal(null);
    setActiveLevelId(null);
    setScreen('graduation');
  };

  const currentView = (() => {
    if (screen === 'landing') {
      return (
      <LandingPage
        completedLevels={completedLevels}
        totalLevels={totalLevels}
        onStartJourney={handleStartJourney}
      />
      );
    }

    if (screen === 'map') {
      return (
      <LevelMapPage
        onOpenLevel={handleOpenLevel}
        onBackToHome={() => setScreen('landing')}
        onOpenGraduation={() => setScreen('graduation')}
        onOpenQuickReview={(chapter) => setQuickReviewChapter(chapter)}
      />
      );
    }

    if (screen === 'graduation') {
      return <GraduationPage onBackToMap={() => setScreen('map')} />;
    }

    if (!activeLevelId) {
      return null;
    }

    return (
      <div className="h-screen w-screen overflow-hidden">
        <StrategyBuilder
          mode="level"
          levelId={activeLevelId}
          onBackToMap={handleBackToMap}
          onLevelFinished={handleLevelFinished}
        />
      </div>
    );
  })();

  return (
    <>
      {currentView}
      {chapterUnlockFx && (
        <ChapterUnlockCelebration
          chapter={chapterUnlockFx.chapter}
          chapterName={chapterUnlockFx.chapterName}
        />
      )}
      {quickReviewChapter && (
        <ChapterQuickReviewModal
          chapter={quickReviewChapter}
          onClose={() => setQuickReviewChapter(null)}
        />
      )}
      {runModal && (
        <LevelRunResultModal
          open={runModal.open}
          success={runModal.success}
          levelName={runModal.levelName}
          score={runModal.score}
          reward={runModal.reward}
          profitLossPercent={runModal.profitLossPercent}
          transactionCount={runModal.transactionCount}
          nextLevelName={runModal.nextLevelName}
          isFinalLevel={runModal.finalLevel}
          onClose={handleCloseRunModal}
          onBackToMap={handleBackToMapFromModal}
          onQuickNext={runModal.nextLevelId ? handleQuickNextLevel : undefined}
          onOpenGraduation={runModal.finalLevel ? handleOpenGraduation : undefined}
        />
      )}
    </>
  );
}

export default App;
