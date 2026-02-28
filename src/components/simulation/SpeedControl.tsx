/**
 * Speed Control Component
 * 模拟速度控制组件
 *
 * @description 提供速度调节 UI，允许玩家调整模拟动画速度
 * @requirements 2.5
 */

import { useState, useEffect, useCallback } from 'react';
import { simulationEngine } from '@/systems/simulation-engine';

/**
 * 速度控制组件属性
 */
interface SpeedControlProps {
  /** 初始速度 (1-10) */
  initialSpeed?: number;
  /** 速度变化回调 */
  onSpeedChange?: (speed: number) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 速度预设配置
 */
const SPEED_PRESETS = [
  { value: 1, label: '0.5x', description: '慢速' },
  { value: 2, label: '1x', description: '正常' },
  { value: 5, label: '2.5x', description: '快速' },
  { value: 10, label: '5x', description: '极速' },
];

/**
 * 获取速度显示标签
 */
function getSpeedLabel(speed: number): string {
  const multiplier = speed / 2;
  return `${multiplier}x`;
}

/**
 * 获取速度描述
 */
function getSpeedDescription(speed: number): string {
  if (speed <= 1) return '慢速';
  if (speed <= 3) return '正常';
  if (speed <= 6) return '快速';
  return '极速';
}

/**
 * Speed Control Component
 * 模拟速度控制组件
 */
export default function SpeedControl({
  initialSpeed,
  onSpeedChange,
  disabled = false,
  className = '',
}: SpeedControlProps) {
  // 使用初始值或从引擎获取当前速度
  const [speed, setSpeed] = useState<number>(() => {
    if (initialSpeed !== undefined) {
      return initialSpeed;
    }
    return simulationEngine.getSpeed();
  });

  // 当 initialSpeed 改变时同步
  useEffect(() => {
    if (initialSpeed !== undefined) {
      setSpeed(initialSpeed);
      simulationEngine.setSpeed(initialSpeed);
    }
  }, [initialSpeed]);

  /**
   * 处理速度变化
   */
  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      // 确保速度在有效范围内 (1-10)
      const clampedSpeed = Math.max(1, Math.min(10, newSpeed));
      
      // 更新本地状态
      setSpeed(clampedSpeed);
      
      // 更新模拟引擎速度
      simulationEngine.setSpeed(clampedSpeed);
      
      // 触发回调
      onSpeedChange?.(clampedSpeed);
    },
    [onSpeedChange]
  );

  /**
   * 处理滑块变化
   */
  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newSpeed = parseInt(event.target.value, 10);
      handleSpeedChange(newSpeed);
    },
    [handleSpeedChange]
  );

  /**
   * 处理预设按钮点击
   */
  const handlePresetClick = useCallback(
    (presetSpeed: number) => {
      handleSpeedChange(presetSpeed);
    },
    [handleSpeedChange]
  );

  /**
   * 增加速度
   */
  const increaseSpeed = useCallback(() => {
    handleSpeedChange(speed + 1);
  }, [speed, handleSpeedChange]);

  /**
   * 减少速度
   */
  const decreaseSpeed = useCallback(() => {
    handleSpeedChange(speed - 1);
  }, [speed, handleSpeedChange]);

  return (
    <div
      className={`
        bg-gray-900/80 backdrop-blur-sm rounded-lg border border-white/10 p-4
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `}
      data-testid="speed-control"
    >
      {/* 标题和当前速度显示 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>⚡</span>
          <span>模拟速度</span>
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="text-lg font-bold text-primary-400"
            data-testid="speed-value"
          >
            {getSpeedLabel(speed)}
          </span>
          <span className="text-xs text-gray-400">
            ({getSpeedDescription(speed)})
          </span>
        </div>
      </div>

      {/* 速度滑块 */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          {/* 减速按钮 */}
          <button
            onClick={decreaseSpeed}
            disabled={disabled || speed <= 1}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              bg-gray-800 border border-white/10
              text-white font-bold text-lg
              transition-all duration-200
              ${speed <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-700 hover:border-primary-500'}
            `}
            aria-label="减速"
            data-testid="speed-decrease"
          >
            −
          </button>

          {/* 滑块 */}
          <div className="flex-1 relative">
            <input
              type="range"
              min="1"
              max="10"
              value={speed}
              onChange={handleSliderChange}
              disabled={disabled}
              className={`
                w-full h-2 rounded-full appearance-none cursor-pointer
                bg-gray-700
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:h-5
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-primary-500
                [&::-webkit-slider-thumb]:border-2
                [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-5
                [&::-moz-range-thumb]:h-5
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-primary-500
                [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-white
                [&::-moz-range-thumb]:cursor-pointer
              `}
              aria-label="模拟速度"
              data-testid="speed-slider"
            />
            {/* 刻度标记 */}
            <div className="flex justify-between mt-1 px-1">
              <span className="text-xs text-gray-500">1</span>
              <span className="text-xs text-gray-500">5</span>
              <span className="text-xs text-gray-500">10</span>
            </div>
          </div>

          {/* 加速按钮 */}
          <button
            onClick={increaseSpeed}
            disabled={disabled || speed >= 10}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              bg-gray-800 border border-white/10
              text-white font-bold text-lg
              transition-all duration-200
              ${speed >= 10 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-700 hover:border-primary-500'}
            `}
            aria-label="加速"
            data-testid="speed-increase"
          >
            +
          </button>
        </div>
      </div>

      {/* 速度预设按钮 */}
      <div className="flex gap-2">
        {SPEED_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            disabled={disabled}
            className={`
              flex-1 py-2 px-3 rounded-md text-xs font-medium
              transition-all duration-200
              ${
                speed === preset.value
                  ? 'bg-primary-500 text-white border border-primary-400'
                  : 'bg-gray-800 text-gray-300 border border-white/10 hover:bg-gray-700 hover:border-primary-500/50'
              }
            `}
            title={preset.description}
            data-testid={`speed-preset-${preset.value}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* 速度说明 */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        调整速度以控制模拟动画的播放快慢
      </p>
    </div>
  );
}
