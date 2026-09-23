import React from 'react';
import type { RLParams, TransitionRLParams } from '../rl/types';
import { Sliders, RefreshCw } from 'lucide-react';

interface ConfigPanelProps {
  spatialParams: RLParams;
  onSpatialParamsChange: (params: RLParams) => void;
  transitionParams: TransitionRLParams;
  onTransitionParamsChange: (params: TransitionRLParams) => void;
  onResetToDefaults: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  spatialParams,
  onSpatialParamsChange,
  transitionParams,
  onTransitionParamsChange,
  onResetToDefaults,
}) => {
  const handleSpatialChange = (key: keyof RLParams, val: number) => {
    onSpatialParamsChange({
      ...spatialParams,
      [key]: val,
    });
  };

  const handleTransitionChange = (key: keyof TransitionRLParams, val: number) => {
    onTransitionParamsChange({
      ...transitionParams,
      [key]: val,
    });
  };

  return (
    <div className="glass-panel card flex flex-col gap-6" style={{ height: '100%' }}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="flex items-center gap-2 mb-1">
            <Sliders size={20} className="text-purple-400" /> RL Hyperparameters
          </h2>
          <p className="text-sm">Tune learning algorithms and layout constraints.</p>
        </div>
        <button
          onClick={onResetToDefaults}
          title="Restore default parameters"
          className="p-1 bg-slate-900 border border-slate-800 rounded hover:text-white transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Spatial RL Agent (Voronoi) */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-900 pb-1">
          Spatial Voronoi Agent
        </h3>

        {/* Spatial Learning Rate */}
        <div className="form-group">
          <div className="flex justify-between text-xs font-mono">
            <span>Learning Rate (α)</span>
            <span className="text-purple-400 font-semibold">{spatialParams.learningRate.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="0.5"
            step="0.01"
            value={spatialParams.learningRate}
            onChange={(e) => handleSpatialChange('learningRate', parseFloat(e.target.value))}
            className="range-slider"
          />
          <div className="text-[10px] text-slate-500 leading-normal">
            Controls how fast key centers shift toward user coordinates on nearby typos.
          </div>
        </div>

        {/* Regularization Decay */}
        <div className="form-group">
          <div className="flex justify-between text-xs font-mono">
            <span>Regularization (λ)</span>
            <span className="text-purple-400 font-semibold">{spatialParams.regularization.toFixed(4)}</span>
          </div>
          <input
            type="range"
            min="0.0001"
            max="0.02"
            step="0.0001"
            value={spatialParams.regularization}
            onChange={(e) => handleSpatialChange('regularization', parseFloat(e.target.value))}
            className="range-slider"
          />
          <div className="text-[10px] text-slate-500 leading-normal">
            Decays keys back to default templates over time to protect muscle memory.
          </div>
        </div>

        {/* Adjacent Key Distance Threshold */}
        <div className="form-group">
          <div className="flex justify-between text-xs font-mono">
            <span>Adjacency Range</span>
            <span className="text-purple-400 font-semibold">{spatialParams.adjacentThreshold}px</span>
          </div>
          <input
            type="range"
            min="50"
            max="250"
            step="10"
            value={spatialParams.adjacentThreshold}
            onChange={(e) => handleSpatialChange('adjacentThreshold', parseInt(e.target.value))}
            className="range-slider"
          />
          <div className="text-[10px] text-slate-500 leading-normal">
            Errors beyond this distance are considered cognitive slips, skipping adaptation.
          </div>
        </div>

        {/* Bayesian LM Weight */}
        <div className="form-group">
          <div className="flex justify-between text-xs font-mono">
            <span>LM Prior Weight (ω)</span>
            <span className="text-purple-400 font-semibold">{spatialParams.lmWeight.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={spatialParams.lmWeight}
            onChange={(e) => handleSpatialChange('lmWeight', parseFloat(e.target.value))}
            className="range-slider"
          />
          <div className="text-[10px] text-slate-500 leading-normal">
            Controls how strongly bigram language priors override pure coordinate mapping.
          </div>
        </div>

        {/* Weight Growth Factor */}
        <div className="form-group">
          <div className="flex justify-between text-xs font-mono">
            <span>Weight Growth (β⁺)</span>
            <span className="text-purple-400 font-semibold">+{spatialParams.weightGrowth}</span>
          </div>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={spatialParams.weightGrowth}
            onChange={(e) => handleSpatialChange('weightGrowth', parseInt(e.target.value))}
            className="range-slider"
          />
        </div>

        {/* Weight Shrink Factor */}
        <div className="form-group">
          <div className="flex justify-between text-xs font-mono">
            <span>Weight Shrink (β⁻)</span>
            <span className="text-purple-400 font-semibold">-{spatialParams.weightShrink}</span>
          </div>
          <input
            type="range"
            min="50"
            max="1000"
            step="50"
            value={spatialParams.weightShrink}
            onChange={(e) => handleSpatialChange('weightShrink', parseInt(e.target.value))}
            className="range-slider"
          />
        </div>
      </div>

      {/* Transition RL Agent (Q-Learning) */}
      <div className="flex flex-col gap-4 mt-2">
        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-900 pb-1">
          Transition Q-Agent
        </h3>

        {/* Q Learning Rate */}
        <div className="form-group">
          <div className="flex justify-between text-xs font-mono">
            <span>Q-Learning Rate (α_t)</span>
            <span className="text-cyan-400 font-semibold">{transitionParams.learningRate.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.9"
            step="0.05"
            value={transitionParams.learningRate}
            onChange={(e) => handleTransitionChange('learningRate', parseFloat(e.target.value))}
            className="range-slider"
            style={{ '--accent-purple': 'var(--accent-teal)' } as React.CSSProperties}
          />
        </div>

        {/* Discount Factor */}
        <div className="form-group">
          <div className="flex justify-between text-xs font-mono">
            <span>Discount (γ)</span>
            <span className="text-cyan-400 font-semibold">{transitionParams.discountFactor.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="0.99"
            step="0.05"
            value={transitionParams.discountFactor}
            onChange={(e) => handleTransitionChange('discountFactor', parseFloat(e.target.value))}
            className="range-slider"
            style={{ '--accent-purple': 'var(--accent-teal)' } as React.CSSProperties}
          />
        </div>

        {/* Exploration Epsilon */}
        <div className="form-group">
          <div className="flex justify-between text-xs font-mono">
            <span>Exploration (ε)</span>
            <span className="text-cyan-400 font-semibold">{(transitionParams.epsilon * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="0.7"
            step="0.05"
            value={transitionParams.epsilon}
            onChange={(e) => handleTransitionChange('epsilon', parseFloat(e.target.value))}
            className="range-slider"
            style={{ '--accent-purple': 'var(--accent-teal)' } as React.CSSProperties}
          />
        </div>

        {/* Switch Penalty Cost */}
        <div className="form-group">
          <div className="flex justify-between text-xs font-mono">
            <span>Switch Penalty Cost</span>
            <span className="text-cyan-400 font-semibold">-{transitionParams.switchPenalty}</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={transitionParams.switchPenalty}
            onChange={(e) => handleTransitionChange('switchPenalty', parseInt(e.target.value))}
            className="range-slider"
            style={{ '--accent-purple': 'var(--accent-teal)' } as React.CSSProperties}
          />
          <div className="text-[10px] text-slate-500 leading-normal">
            Penalty assigned in the Q-table when a manual layout toggle is forced.
          </div>
        </div>
      </div>
    </div>
  );
};
