import React from 'react';
import type { TyperProfile, RLAlgorithmType } from '../rl/types';
import { PRESETS } from '../rl/TyperSimulator';
import { Play, Pause, RotateCcw, Sparkles, Cpu } from 'lucide-react';

interface SimulationControlsProps {
  currentProfile: TyperProfile;
  onProfileChange: (profile: TyperProfile) => void;
  isRunning: boolean;
  onToggleStartPause: () => void;
  onReset: () => void;
  onFastTrain: (iterations: number) => void;
  simSpeed: number; // Interval multiplier (e.g. 1x, 2x, 5x, 10x)
  onSpeedChange: (speed: number) => void;
  selectedText: string;
  onTextChange: (text: string) => void;
  customText: string;
  onCustomTextChange: (text: string) => void;
  rlAlgorithm?: RLAlgorithmType;
  onAlgorithmChange?: (algo: RLAlgorithmType) => void;
}

const PRESET_TEXTS = [
  {
    name: 'Adaptive Phrase Corpus (115 Templates)',
    text: 'mackenzie',
  },
  {
    name: 'Synthetic Random (Varied Characters)',
    text: 'synthetic',
  },

  {
    name: 'Alpha Typing Test',
    text: 'hello this is a simple keyboard typing test to verify adaptive reinforcement learning layout performance',
  },
  {
    name: 'Numeric-Heavy Order',
    text: 'order number 48275 contains 10 items of type x92 and 3 items of type y84 priced at 19 dollars each',
  },
  {
    name: 'Code Snippet Logic',
    text: 'const rate = 0.05; let discount = price * rate; return (total - discount) + 12.5;',
  },
  {
    name: 'Frequent Typos Sentence',
    text: 'people typing fast sometimes swap letters and write sominw who is giod at typping',
  },
  {
    name: 'Free Typing (Real Mode)',
    text: 'free',
  },
];

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  currentProfile,
  onProfileChange,
  isRunning,
  onToggleStartPause,
  onReset,
  onFastTrain,
  simSpeed,
  onSpeedChange,
  selectedText,
  onTextChange,
  customText,
  onCustomTextChange,
  rlAlgorithm,
  onAlgorithmChange,
}) => {
  const [fastTrainIters, setFastTrainIters] = React.useState<number>(250);
  return (
    <div className="glass-panel card flex flex-col gap-6" style={{ height: '100%' }}>
      <div>
        <h2 className="flex items-center gap-2 mb-1">
          <span className="dot dot-purple"></span> Typer Simulation Arena
        </h2>
        <p className="text-sm">Simulate motor-noise and transition behaviors to test RL convergence.</p>
      </div>

      {/* Profile Selector */}
      <div className="flex flex-col gap-2">
        <label className="form-label text-slate-300 font-semibold text-xs uppercase tracking-wider">Select Typer Profile</label>
        <div className="grid grid-cols-2 gap-2.5">
          {PRESETS.map((prof) => {
            const isSelected = currentProfile.id === prof.id;
            return (
              <button
                key={prof.id}
                onClick={() => onProfileChange(prof)}
                className={`sim-profile-card ${isSelected ? 'active' : ''}`}
              >
                {isSelected && (
                  <span className="sim-profile-pip" />
                )}
                <div style={{ fontWeight: 600, fontSize: '12px', color: isSelected ? '#ffffff' : '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {prof.name}
                </div>
                <div style={{ fontSize: '10px', marginTop: '4px', color: '#94a3b8', lineHeight: 1.3 }}>
                  {prof.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active RL Algorithm Dropdown Box */}
      {onAlgorithmChange && (
        <div className="flex flex-col gap-2">
          <label className="form-label text-slate-300 font-semibold text-xs uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu size={13} className="text-cyan-400" /> Active RL Algorithm
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              {rlAlgorithm === 'actor-critic' ? 'Continuous A2C' : rlAlgorithm === 'dqn' ? 'Discrete DQN' : 'Clipped PPO'}
            </span>
          </label>
          <select
            value={rlAlgorithm || 'actor-critic'}
            onChange={(e) => onAlgorithmChange(e.target.value as RLAlgorithmType)}
            className="sim-select"
            title="Select RL Algorithm for Simulation and Live Keystrokes"
          >
            <option value="actor-critic">Option 1: Actor-Critic (A2C Advantage PG)</option>
            <option value="dqn">Option 2: Deep Q-Network (DQN Experience Replay)</option>
            <option value="ppo">Option 3: Proximal Policy Optimization (PPO Clipped)</option>
          </select>
        </div>
      )}

      {/* Typing Test Text Selection */}
      <div className="flex flex-col gap-2">
        <label className="form-label text-slate-300 font-semibold text-xs uppercase tracking-wider">Simulation Target Text</label>
        <select
          value={selectedText}
          onChange={(e) => onTextChange(e.target.value)}
          className="sim-select"
        >
          {PRESET_TEXTS.map((pt, idx) => (
            <option key={idx} value={pt.text}>
              {pt.name}
            </option>
          ))}
          <option value="custom">Custom Text...</option>
        </select>

        {selectedText === 'custom' && (
          <textarea
            value={customText}
            onChange={(e) => onCustomTextChange(e.target.value)}
            placeholder="Type your own research test text here..."
            className="sim-select"
            style={{ marginTop: '6px', height: '64px', resize: 'none', fontFamily: 'monospace' }}
          />
        )}
      </div>

      {/* Simulator Parameters */}
      <div className="flex flex-col gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
        <div className="flex justify-between text-xs text-slate-400">
          <span className="font-medium">Physical Noise (σ):</span>
          <span className="font-mono text-purple-400 font-semibold">{currentProfile.noiseLevel}px</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span className="font-medium">Hand Drift (X/Y):</span>
          <span className="font-mono text-purple-400 font-semibold">
            {currentProfile.driftX}px / {currentProfile.driftY}px
          </span>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span className="font-medium">Numeric Switch Rate:</span>
          <span className="font-mono text-purple-400 font-semibold">
            {(currentProfile.numericFrequency * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col gap-3 mt-auto pt-2">
        <div className="flex items-center gap-2 justify-between">
          <label className="form-label text-slate-300 font-semibold text-xs uppercase tracking-wider">Simulation Speed</label>
          <div className="sim-speed-box">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`sim-speed-btn ${simSpeed === s ? 'active' : ''}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onToggleStartPause}
            className={`flex-1 btn ${
              isRunning
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-lg shadow-amber-950/30'
                : 'btn-primary'
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={15} /> Pause Simulation
              </>
            ) : (
              <>
                <Play size={15} /> Start Simulation
              </>
            )}
          </button>

          <button
            onClick={onReset}
            title="Reset simulation and keyboard layout"
            className="btn btn-secondary px-3.5"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="flex gap-2 w-full font-mono">
          <select
            value={fastTrainIters}
            onChange={(e) => setFastTrainIters(Number(e.target.value))}
            disabled={isRunning}
            className="sim-select"
            style={{ width: '115px' }}
          >
            <option value={250}>250 iters</option>
            <option value={500}>500 iters</option>
            <option value={1000}>1000 iters</option>
            <option value={2500}>2500 iters</option>
            <option value={5000}>5000 iters</option>
            <option value={10000}>10k iters</option>
            <option value={20000}>20k iters</option>
          </select>
          <button
            onClick={() => onFastTrain(fastTrainIters)}
            disabled={isRunning}
            className="flex-1 btn btn-accent flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={15} /> Fast-Train Policy
          </button>
        </div>
      </div>
    </div>
  );
};
