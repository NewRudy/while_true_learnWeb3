/**
 * Node Config Panel Tests
 * 节点配置面板测试
 *
 * @description 测试节点配置面板的参数配置、验证和错误提示功能
 * @requirements 1.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NodeConfigPanel from './NodeConfigPanel';
import { useStrategyBuilderStore } from './StrategyBuilderStore';
import { ModuleType } from '@/types';

// Mock the module system
vi.mock('@/systems', () => ({
  moduleSystem: {
    getModuleDefinition: vi.fn((type: ModuleType) => {
      const definitions: Record<string, unknown> = {
        [ModuleType.BUY]: {
          type: ModuleType.BUY,
          name: '买入',
          description: '使用指定金额或比例购买目标资产',
          category: 'basic',
          inputs: [{ id: 'fund_in', name: '资金输入', dataType: 'fund' }],
          outputs: [{ id: 'remaining', name: '剩余资金', dataType: 'fund' }],
          defaultParams: {
            amount: 100,
            amountType: 'fixed',
            asset: 'ETH',
            orderType: 'market',
          },
          unlockLevel: 1,
        },
        [ModuleType.STOP_LOSS]: {
          type: ModuleType.STOP_LOSS,
          name: '止损',
          description: '当价格下跌到设定阈值时自动卖出',
          category: 'risk',
          inputs: [{ id: 'fund_in', name: '资金输入', dataType: 'fund' }],
          outputs: [{ id: 'fund_out', name: '资金输出', dataType: 'fund' }],
          defaultParams: {
            stopLossPercent: 10,
            stopLossType: 'trailing',
            triggerPrice: 0,
          },
          unlockLevel: 3,
        },
        [ModuleType.TRANSFER]: {
          type: ModuleType.TRANSFER,
          name: '转账',
          description: '将资金从当前钱包转移到指定地址',
          category: 'basic',
          inputs: [{ id: 'fund_in', name: '资金输入', dataType: 'fund' }],
          outputs: [{ id: 'signal_out', name: '完成信号', dataType: 'signal' }],
          defaultParams: {
            amount: 100,
            toAddress: '',
            asset: 'ETH',
          },
          unlockLevel: 1,
        },
      };
      return definitions[type];
    }),
  },
}));

describe('NodeConfigPanel', () => {
  beforeEach(() => {
    // Reset the store before each test
    useStrategyBuilderStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      strategyId: 'test-strategy',
      strategyName: '测试策略',
      playerLevel: 5,
    });
  });

  describe('Panel Visibility', () => {
    it('should not render when no node is selected', () => {
      render(<NodeConfigPanel />);
      
      // Panel should not be visible
      expect(screen.queryByText('参数配置')).not.toBeInTheDocument();
    });

    it('should render when a node is selected', () => {
      // Add a node and select it
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.BUY,
              params: { amount: 100, amountType: 'fixed', asset: 'ETH', orderType: 'market' },
              label: '买入',
              description: '使用指定金额或比例购买目标资产',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Panel should be visible with module name
      expect(screen.getByText('买入')).toBeInTheDocument();
      expect(screen.getByText('参数配置')).toBeInTheDocument();
    });
  });

  describe('Parameter Display', () => {
    it('should display all module parameters', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.BUY,
              params: { amount: 100, amountType: 'fixed', asset: 'ETH', orderType: 'market' },
              label: '买入',
              description: '使用指定金额或比例购买目标资产',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Check for parameter labels
      expect(screen.getByText('金额')).toBeInTheDocument();
      expect(screen.getByText('金额类型')).toBeInTheDocument();
      expect(screen.getByText('资产')).toBeInTheDocument();
      expect(screen.getByText('订单类型')).toBeInTheDocument();
    });

    it('should display correct input values', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.BUY,
              params: { amount: 250, amountType: 'percent', asset: 'USDC', orderType: 'limit' },
              label: '买入',
              description: '使用指定金额或比例购买目标资产',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Check input values
      const amountInput = screen.getByDisplayValue('250');
      expect(amountInput).toBeInTheDocument();
    });
  });

  describe('Parameter Updates', () => {
    it('should update node config when parameter changes', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.BUY,
              params: { amount: 100, amountType: 'fixed', asset: 'ETH', orderType: 'market' },
              label: '买入',
              description: '使用指定金额或比例购买目标资产',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Find and change the amount input
      const amountInput = screen.getByDisplayValue('100');
      fireEvent.change(amountInput, { target: { value: '200', valueAsNumber: 200 } });
      
      // Check that the store was updated
      const state = useStrategyBuilderStore.getState();
      const [firstNode] = state.nodes;
      if (!firstNode) {
        throw new Error('Expected node to exist');
      }
      expect(firstNode.data.params.amount).toBe(200);
    });

    it('should update select field values', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.BUY,
              params: { amount: 100, amountType: 'fixed', asset: 'ETH', orderType: 'market' },
              label: '买入',
              description: '使用指定金额或比例购买目标资产',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Find and change the asset select
      const assetSelect = screen.getByDisplayValue('ETH');
      fireEvent.change(assetSelect, { target: { value: 'USDC' } });
      
      // Check that the store was updated
      const state = useStrategyBuilderStore.getState();
      const [firstNode] = state.nodes;
      if (!firstNode) {
        throw new Error('Expected node to exist');
      }
      expect(firstNode.data.params.asset).toBe('USDC');
    });
  });

  describe('Parameter Validation', () => {
    it('should show error for negative amount', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.BUY,
              params: { amount: 100, amountType: 'fixed', asset: 'ETH', orderType: 'market' },
              label: '买入',
              description: '使用指定金额或比例购买目标资产',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Find and change the amount input to negative
      const amountInput = screen.getByDisplayValue('100');
      fireEvent.change(amountInput, { target: { value: '-10', valueAsNumber: -10 } });
      
      // Check for error message
      expect(screen.getByText(/不能小于/)).toBeInTheDocument();
    });

    it('should show error for percentage over 100', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.STOP_LOSS,
              params: { stopLossPercent: 10, stopLossType: 'trailing', triggerPrice: 0 },
              label: '止损',
              description: '当价格下跌到设定阈值时自动卖出',
              category: 'risk',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Find and change the stopLossPercent input to over 100
      const percentInput = screen.getByDisplayValue('10');
      fireEvent.change(percentInput, { target: { value: '150', valueAsNumber: 150 } });
      
      // Check for error message
      expect(screen.getByText(/不能大于/)).toBeInTheDocument();
    });

    it('should show error for invalid Ethereum address', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.TRANSFER,
              params: { amount: 100, toAddress: '', asset: 'ETH' },
              label: '转账',
              description: '将资金从当前钱包转移到指定地址',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Find and change the address input to invalid
      const addressInput = screen.getByPlaceholderText(/钱包地址/);
      fireEvent.change(addressInput, { target: { value: 'invalid-address' } });
      
      // Check for error message
      expect(screen.getByText(/有效的以太坊地址/)).toBeInTheDocument();
    });

    it('should accept valid Ethereum address', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.TRANSFER,
              params: { amount: 100, toAddress: '', asset: 'ETH' },
              label: '转账',
              description: '将资金从当前钱包转移到指定地址',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Find and change the address input to valid
      const addressInput = screen.getByPlaceholderText(/钱包地址/);
      fireEvent.change(addressInput, { target: { value: '0x1234567890123456789012345678901234567890' } });
      
      // Check that no error is shown
      expect(screen.queryByText(/有效的以太坊地址/)).not.toBeInTheDocument();
    });
  });

  describe('Node Actions', () => {
    it('should delete node when delete button is clicked', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.BUY,
              params: { amount: 100, amountType: 'fixed', asset: 'ETH', orderType: 'market' },
              label: '买入',
              description: '使用指定金额或比例购买目标资产',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Click delete button
      const deleteButton = screen.getByText('删除此模块');
      fireEvent.click(deleteButton);
      
      // Check that node was removed
      const state = useStrategyBuilderStore.getState();
      expect(state.nodes.length).toBe(0);
      expect(state.selectedNodeId).toBe(null);
    });

    it('should close panel when close button is clicked', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.BUY,
              params: { amount: 100, amountType: 'fixed', asset: 'ETH', orderType: 'market' },
              label: '买入',
              description: '使用指定金额或比例购买目标资产',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      // Click close button (the X button)
      const closeButton = screen.getByTitle('关闭面板');
      fireEvent.click(closeButton);
      
      // Check that selection was cleared
      const state = useStrategyBuilderStore.getState();
      expect(state.selectedNodeId).toBe(null);
    });
  });

  describe('Category Display', () => {
    it('should display basic module category correctly', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.BUY,
              params: { amount: 100, amountType: 'fixed', asset: 'ETH', orderType: 'market' },
              label: '买入',
              description: '使用指定金额或比例购买目标资产',
              category: 'basic',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      expect(screen.getByText('基础模块')).toBeInTheDocument();
    });

    it('should display risk module category correctly', () => {
      useStrategyBuilderStore.setState({
        nodes: [
          {
            id: 'node-1',
            type: 'moduleNode',
            position: { x: 100, y: 100 },
            data: {
              moduleType: ModuleType.STOP_LOSS,
              params: { stopLossPercent: 10, stopLossType: 'trailing', triggerPrice: 0 },
              label: '止损',
              description: '当价格下跌到设定阈值时自动卖出',
              category: 'risk',
            },
          },
        ],
        selectedNodeId: 'node-1',
      });

      render(<NodeConfigPanel />);
      
      expect(screen.getByText('风控模块')).toBeInTheDocument();
    });
  });
});
