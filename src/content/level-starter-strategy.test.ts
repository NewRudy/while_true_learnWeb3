import { describe, expect, it } from 'vitest';
import { getAllLevelDefinitions } from '@/systems/level-system';
import { createSimulationEngine } from '@/systems/simulation-engine';
import { createLevelStore } from '@/systems/level-system/level-store';
import { buildStarterStrategy } from './level-starter-strategy';

async function runStrategy(initialFunds: number, levelId: string) {
  const level = getAllLevelDefinitions().find((item) => item.id === levelId);
  if (!level) {
    throw new Error(`Unknown level: ${levelId}`);
  }

  const engine = createSimulationEngine({
    baseStepInterval: 1,
    defaultSpeed: 10,
    maxSteps: 500,
  });

  const strategy = buildStarterStrategy(level);
  engine.loadStrategy(strategy);

  const result = await new Promise<ReturnType<typeof engine.getResult>>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Simulation timeout for ${levelId}`));
    }, 5000);

    const unsubscribe = engine.onStateChange((state) => {
      if (state.status === 'completed' || state.status === 'error') {
        clearTimeout(timeout);
        unsubscribe();
        resolve(engine.getResult());
      }
    });

    engine.start(initialFunds);
  });

  if (!result) {
    throw new Error(`No simulation result for ${levelId}`);
  }

  return { level, result };
}

describe('level starter strategy', () => {
  it(
    'builds runnable and passable strategies for all levels',
    async () => {
      const levelStore = createLevelStore();

      for (const level of getAllLevelDefinitions()) {
        const { result } = await runStrategy(level.initialFunds, level.id);
        const completion = levelStore.getState().completeLevel(level.id, result);

        expect(result.success, `${level.id} should run successfully`).toBe(true);
        expect(completion.success, `${level.id} should be completable by starter strategy`).toBe(
          true
        );
      }
    },
    30000
  );
});

