import { useEffect, useMemo, useRef, useState } from 'react';
import {
  StrategyBuilder,
  LandingPage,
  LevelMapPage,
  GraduationPage,
  ChapterUnlockCelebration,
  ChapterQuickReviewModal,
  type ChallengeRunPayload,
} from './components';
import {
  getAllLevelDefinitions,
  getChapterMetadata,
  isLastLevel,
  useLevelStore,
} from './systems/level-system';
import { useEconomyStore, useMotivationStore } from './systems';

type AppScreen = 'landing' | 'map' | 'play' | 'graduation';

function App() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [chapterUnlockFx, setChapterUnlockFx] = useState<{
    chapter: number;
    chapterName: string;
  } | null>(null);
  const [quickReviewChapter, setQuickReviewChapter] = useState<number | null>(null);

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

  const handleLevelFinished = ({ level, completionResult }: ChallengeRunPayload) => {
    if (completionResult.success && isLastLevel(level.id)) {
      setScreen('graduation');
      setActiveLevelId(null);
    }
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
    </>
  );
}

export default App;
