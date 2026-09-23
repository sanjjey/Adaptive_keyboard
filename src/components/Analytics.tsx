import React from 'react';
import type { TypingStats } from '../rl/types';
import { Zap, AlertTriangle, Cpu, TrendingUp } from 'lucide-react';

interface MetricPoint {
  wpm: number;
  errorRate: number;
  stability: number; // Mean spatial drift from default
  savedSwitches: number;
}

interface AnalyticsProps {
  stats: TypingStats;
  history: MetricPoint[];
  currentActionName: string;
}

export const Analytics: React.FC<AnalyticsProps> = ({ stats, history, currentActionName }) => {
  // SVG Chart helper
  const renderLineChart = (
    data: number[],
    color: string,
    minVal = 0,
    maxVal = 100,
    labelFormatter: (v: number) => string
  ) => {
    const width = 320;
    const height = 90;
    const padding = 8;
    
    if (data.length < 2) {
      return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="#475569" fontSize="11">
            Waiting for keystrokes...
          </text>
        </svg>
      );
    }

    const max = Math.max(...data, maxVal);
    const min = Math.min(...data, minVal);
    const range = max - min || 1;

    const points = data.map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return { x, y, val };
    });

    const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
    
    // Gradient fill path
    const fillD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    const latest = data[data.length - 1];

    return (
      <div className="flex flex-col gap-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Fill Area */}
          <path d={fillD} fill={`url(#grad-${color})`} />
          {/* Sparkline */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Indicator Dot */}
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r="4.5"
            fill={color}
            stroke="#0a0b0e"
            strokeWidth="1.5"
          />
        </svg>
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1">
          <span>Min: {labelFormatter(min)}</span>
          <span style={{ color }}>Current: {labelFormatter(latest)}</span>
          <span>Max: {labelFormatter(max)}</span>
        </div>
      </div>
    );
  };

  const accuracyPercent = stats.accuracy * 100;

  return (
    <div className="glass-panel card flex flex-col gap-6">
      <div>
        <h2 className="flex items-center gap-2 mb-1">
          <TrendingUp size={20} className="text-purple-400" /> Live Analytics & Convergence
        </h2>
        <p className="text-sm">Real-time performance indicators and model training curves.</p>
      </div>

      {/* Top Level Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-semibold">Speed (WPM)</div>
            <div className="text-xl font-bold font-mono text-white">{stats.wpm.toFixed(1)}</div>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-semibold">Accuracy</div>
            <div className="text-xl font-bold font-mono text-white">{accuracyPercent.toFixed(1)}%</div>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-semibold">Total Errors</div>
            <div className="text-xl font-bold font-mono text-white">{stats.totalErrors}</div>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Cpu size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-500 font-semibold">Active Mode</div>
            <div className="text-xs font-semibold text-white mt-1 uppercase tracking-wider font-mono">
              {currentActionName}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="flex flex-col gap-5 border-t border-slate-900 pt-5">
        {/* Speed Chart */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2">SPEED PROGRESSION (WPM)</div>
          {renderLineChart(
            history.map((h) => h.wpm),
            '#a78bfa',
            20,
            60,
            (v) => `${v.toFixed(1)} WPM`
          )}
        </div>

        {/* Error Rate Chart */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2">ERROR RATE (%)</div>
          {renderLineChart(
            history.map((h) => h.errorRate),
            '#f43f5e',
            0,
            30,
            (v) => `${v.toFixed(1)}%`
          )}
        </div>

        {/* Saved Switch Actions Chart */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2">CUMULATIVE SWITCHES SAVED</div>
          {renderLineChart(
            history.map((h) => h.savedSwitches),
            '#06b6d4',
            0,
            10,
            (v) => `${v.toFixed(0)} saved`
          )}
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>Manual switches made: {stats.manualSwitches}</span>
            <span>RL predicted switches: {stats.switchesSaved}</span>
          </div>
        </div>

        {/* Convergence Chart */}
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-2">LAYOUT DRIFT STABILITY (MEAN SHIFT)</div>
          {renderLineChart(
            history.map((h) => h.stability),
            '#fbbf24',
            0,
            10,
            (v) => `${v.toFixed(2)}px`
          )}
          <div className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            As the stability curve plateaus, the spatial RL agent has aligned coordinates with user touch tendencies.
          </div>
        </div>
      </div>
    </div>
  );
};
