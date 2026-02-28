import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { useLevelStore } from './systems/level-system';
import { useEconomyStore } from './systems/economy-system';
import { useStrategyBuilderStore } from './components/strategy-builder';

describe('App flow', () => {
  beforeEach(() => {
    useLevelStore.getState().resetLevelState();
    useEconomyStore.getState().resetWallet();
    useStrategyBuilderStore.getState().clearStrategy();
  });

  it('renders landing page on first load', () => {
    render(<App />);
    expect(screen.getByText('Web3 交易学习闯关游戏')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '开始闯关' })).toBeInTheDocument();
  });

  it('navigates to level map when starting journey', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '开始闯关' }));
    expect(screen.getByText('关卡地图')).toBeInTheDocument();
  });

  it('opens strategy builder when selecting an unlocked level', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '开始闯关' }));
    const [firstOpenButton] = screen.getAllByRole('button', { name: '进入本关' });
    expect(firstOpenButton).toBeDefined();
    if (!firstOpenButton) {
      throw new Error('No unlocked lesson button found');
    }
    fireEvent.click(firstOpenButton);

    expect(screen.getByPlaceholderText('输入策略名称')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '返回关卡地图' })).toBeInTheDocument();
  });
});
