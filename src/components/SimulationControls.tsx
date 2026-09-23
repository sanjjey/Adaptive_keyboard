import React from 'react';
import type { TyperProfile } from '../rl/types';
import { PRESETS } from '../rl/TyperSimulator';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

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
  isProfileShifting: boolean;
  onProfileShiftingChange: (val: boolean) => void;
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
    name: 'Hybrid Corpus (Mixed Style & Characters)',
    text: 'hybrid',
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
  isProfileShifting,
  onProfileShiftingChange,
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
        <label className="form-label">Select Typer Profile</label>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((prof) => (
            <button
              key={prof.id}
              onClick={() => onProfileChange(prof)}
              className={`p-3 rounded-xl border text-left transition-all ${
                currentProfile.id === prof.id
                  ? 'border-purple-500 bg-purple-500/10 text-white'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold text-sm">{prof.name}</div>
              <div className="text-[10px] mt-1 line-clamp-2 text-slate-500 leading-tight">
                {prof.description}
              </div>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs text-slate-400 hover:text-white" title="Cyles user profile every 150 keystrokes to test online learning rate re-annealing">
          <input
            type="checkbox"
            checked={isProfileShifting}
            onChange={(e) => onProfileShiftingChange(e.target.checked)}
            className="accent-purple-600"
          />
          Enable Dynamic Profile Shifting (Cycle mid-run)
        </label>
      </div>

      {/* Typing Test Text Selection */}
      <div className="flex flex-col gap-2">
        <label className="form-label">Simulation Target Text</label>
        <select
          value={selectedText}
          onChange={(e) => onTextChange(e.target.value)}
          className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-purple-500"
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
            className="p-2 mt-1 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 h-16 resize-none focus:outline-none focus:border-purple-500 font-mono"
          />
        )}
      </div>

      {/* Simulator Parameters */}
      <div className="flex flex-col gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-900">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Physical Noise (σ):</span>
          <span className="font-mono text-purple-400">{currentProfile.noiseLevel}px</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Hand Drift (X/Y):</span>
          <span className="font-mono text-purple-400">
            {currentProfile.driftX}px / {currentProfile.driftY}px
          </span>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Numeric Switch Rate:</span>
          <span className="font-mono text-purple-400">
            {(currentProfile.numericFrequency * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col gap-3 mt-auto">
        <div className="flex items-center gap-2 justify-between">
          <label className="form-label">Simulation Speed</label>
          <div className="flex items-center gap-1">
            {[1, 2, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 text-xs rounded font-mono ${
                  simSpeed === s
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                }`}
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
              isRunning ? 'btn-secondary text-amber-500 border-amber-500/20' : 'btn-primary'
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={16} /> Pause
              </>
            ) : (
              <>
                <Play size={16} /> Start Simulation
              </>
            )}
          </button>

          <button
            onClick={onReset}
            title="Reset simulation and keyboard layout"
            className="btn btn-secondary px-3"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="flex gap-2 w-full font-mono">
          <select
            value={fastTrainIters}
            onChange={(e) => setFastTrainIters(Number(e.target.value))}
            disabled={isRunning}
            className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-purple-500 w-28"
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
            style={{ textShadow: '0 0 8px rgba(6, 182, 212, 0.3)' }}
          >
            <Sparkles size={16} /> Fast-Train
          </button>
        </div>
      </div>
    </div>
  );
};
