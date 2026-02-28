/**
 * Speed Control Component Tests
 * 模拟速度控制组件测试
 *
 * @description 测试速度控制组件的功能
 * @requirements 2.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpeedControl from './SpeedControl';
import { simulationEngine } from '@/systems/simulation-engine';

// Mock the simulation engine
vi.mock('@/systems/simulation-engine', () => ({
  simulationEngine: {
    getSpeed: vi.fn(() => 5),
    setSpeed: vi.fn(),
  },
}));

describe('SpeedControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (simulationEngine.getSpeed as ReturnType<typeof vi.fn>).mockReturnValue(5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the speed control component', () => {
      render(<SpeedControl />);
      
      expect(screen.getByTestId('speed-control')).toBeInTheDocument();
      expect(screen.getByText('模拟速度')).toBeInTheDocument();
    });

    it('should display the current speed value', () => {
      render(<SpeedControl initialSpeed={5} />);
      
      expect(screen.getByTestId('speed-value')).toHaveTextContent('2.5x');
    });

    it('should render the speed slider', () => {
      render(<SpeedControl />);
      
      const slider = screen.getByTestId('speed-slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('type', 'range');
      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '10');
    });

    it('should render increase and decrease buttons', () => {
      render(<SpeedControl />);
      
      expect(screen.getByTestId('speed-decrease')).toBeInTheDocument();
      expect(screen.getByTestId('speed-increase')).toBeInTheDocument();
    });

    it('should render speed preset buttons', () => {
      render(<SpeedControl />);
      
      expect(screen.getByTestId('speed-preset-1')).toBeInTheDocument();
      expect(screen.getByTestId('speed-preset-2')).toBeInTheDocument();
      expect(screen.getByTestId('speed-preset-5')).toBeInTheDocument();
      expect(screen.getByTestId('speed-preset-10')).toBeInTheDocument();
    });
  });

  describe('Speed Control Interactions', () => {
    it('should update speed when slider is changed', () => {
      const onSpeedChange = vi.fn();
      render(<SpeedControl onSpeedChange={onSpeedChange} />);
      
      const slider = screen.getByTestId('speed-slider');
      fireEvent.change(slider, { target: { value: '7' } });
      
      expect(simulationEngine.setSpeed).toHaveBeenCalledWith(7);
      expect(onSpeedChange).toHaveBeenCalledWith(7);
    });

    it('should increase speed when + button is clicked', () => {
      const onSpeedChange = vi.fn();
      render(<SpeedControl initialSpeed={5} onSpeedChange={onSpeedChange} />);
      
      const increaseBtn = screen.getByTestId('speed-increase');
      fireEvent.click(increaseBtn);
      
      expect(simulationEngine.setSpeed).toHaveBeenCalledWith(6);
      expect(onSpeedChange).toHaveBeenCalledWith(6);
    });

    it('should decrease speed when - button is clicked', () => {
      const onSpeedChange = vi.fn();
      render(<SpeedControl initialSpeed={5} onSpeedChange={onSpeedChange} />);
      
      const decreaseBtn = screen.getByTestId('speed-decrease');
      fireEvent.click(decreaseBtn);
      
      expect(simulationEngine.setSpeed).toHaveBeenCalledWith(4);
      expect(onSpeedChange).toHaveBeenCalledWith(4);
    });

    it('should set speed to preset value when preset button is clicked', () => {
      const onSpeedChange = vi.fn();
      render(<SpeedControl initialSpeed={5} onSpeedChange={onSpeedChange} />);
      
      const preset10Btn = screen.getByTestId('speed-preset-10');
      fireEvent.click(preset10Btn);
      
      expect(simulationEngine.setSpeed).toHaveBeenCalledWith(10);
      expect(onSpeedChange).toHaveBeenCalledWith(10);
    });
  });

  describe('Speed Boundaries', () => {
    it('should clamp speed to minimum 1 when trying to decrease below', () => {
      render(<SpeedControl initialSpeed={1} />);
      
      const decreaseBtn = screen.getByTestId('speed-decrease');
      // Button should be disabled at minimum
      expect(decreaseBtn).toBeDisabled();
    });

    it('should clamp speed to maximum 10 when trying to increase above', () => {
      render(<SpeedControl initialSpeed={10} />);
      
      const increaseBtn = screen.getByTestId('speed-increase');
      // Button should be disabled at maximum
      expect(increaseBtn).toBeDisabled();
    });

    it('should disable decrease button at minimum speed', () => {
      render(<SpeedControl initialSpeed={1} />);
      
      const decreaseBtn = screen.getByTestId('speed-decrease');
      expect(decreaseBtn).toBeDisabled();
    });

    it('should disable increase button at maximum speed', () => {
      render(<SpeedControl initialSpeed={10} />);
      
      const increaseBtn = screen.getByTestId('speed-increase');
      expect(increaseBtn).toBeDisabled();
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styling when disabled prop is true', () => {
      render(<SpeedControl disabled />);
      
      const container = screen.getByTestId('speed-control');
      expect(container).toHaveClass('opacity-50');
      expect(container).toHaveClass('pointer-events-none');
    });

    it('should disable slider when disabled prop is true', () => {
      render(<SpeedControl disabled />);
      
      const slider = screen.getByTestId('speed-slider');
      expect(slider).toBeDisabled();
    });
  });

  describe('Engine Integration', () => {
    it('should sync with engine speed on mount', () => {
      (simulationEngine.getSpeed as ReturnType<typeof vi.fn>).mockReturnValue(8);
      
      render(<SpeedControl />);
      
      expect(simulationEngine.getSpeed).toHaveBeenCalled();
    });

    it('should call engine setSpeed when speed changes', () => {
      render(<SpeedControl initialSpeed={3} />);
      
      const slider = screen.getByTestId('speed-slider');
      fireEvent.change(slider, { target: { value: '6' } });
      
      expect(simulationEngine.setSpeed).toHaveBeenCalledWith(6);
    });
  });
});
