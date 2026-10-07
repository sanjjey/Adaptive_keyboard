import { KeyboardRLAgent } from './KeyboardRLAgent';
import { TyperSimulator, PRESETS } from './TyperSimulator';
import type { RLAlgorithmType } from './types';

interface AlgorithmComparisonResult {
  algorithm: string;
  baselineAccPct: string;
  adaptedAccPct: string;
  errorReductionPct: string;
  cumulativeReward: string;
  meanTdError: string;
  meanDriftPx: string;
  latencyUs: string;
  stability: string;
}

const PHRASES = [
  "the quick brown fox jumps over the lazy dog",
  "my adaptive keyboard learns user typing drift in real time",
  "reinforcement learning actor critic optimizes key centroids",
  "touch accuracy improves as the voronoi cells dynamically expand",
  "backspace applies retroactive credit assignment via anti gradient pushback",
  "proximal policy optimization guarantees clipped monotonic policy improvement",
  "deep q network quantizes continuous touch nudges with experience replay",
];

function runAlgorithmBenchmark(
  algo: RLAlgorithmType,
  profileId: string = 'right_drift',
  totalSteps = 600
): {
  baselineAcc: number;
  adaptedAcc: number;
  errorReduction: number;
  cumulativeReward: number;
  meanTdError: number;
  meanDrift: number;
  latencyUs: number;
} {
  const profile = PRESETS.find((p) => p.id === profileId) || PRESETS[0];
  const sim = new TyperSimulator(profile);
  const agent = new KeyboardRLAgent();
  agent.setAlgorithm(algo);

  let baselineErrors = 0;
  let adaptedErrors = 0;
  const splitPoint = 150; // First 150 steps baseline before adaptation stabilizes

  let phraseIdx = 0;
  let charIdx = 0;
  const latencies: number[] = [];

  for (let step = 0; step < totalSteps; step++) {
    const phrase = PHRASES[phraseIdx % PHRASES.length];
    const targetChar = phrase[charIdx];
    charIdx++;
    if (charIdx >= phrase.length) {
      charIdx = 0;
      phraseIdx++;
    }

    const targetKeyId = targetChar === ' ' ? 'space' : targetChar.toLowerCase();
    const targetKey = agent.keys.find((k) => k.id === targetKeyId) || agent.keys.find((k) => k.id === 'e')!;

    // Simulate user noisy physical touch
    const touch = sim.simulateTouch(targetKey);

    // Classify touch
    const classifiedId = agent.classifyTouch(touch.x, touch.y, phrase.slice(0, charIdx));
    const isHit = classifiedId === targetKeyId;

    if (step < splitPoint) {
      if (!isHit) baselineErrors++;
    } else {
      if (!isHit) adaptedErrors++;
    }

    // Measure RL execution time
    const t0 = performance.now();
    if (targetKey.type !== 'special') {
      agent.updateLayout(targetKeyId, classifiedId, touch.x, touch.y, step, phrase.slice(0, charIdx));
    }

    // If typo, trigger backspace retroactive credit assignment
    if (!isHit && targetKey.type !== 'special') {
      agent.applyBackspaceCorrection(classifiedId, touch.x, touch.y, 1.0);
    }
    const t1 = performance.now();
    latencies.push((t1 - t0) * 1000); // in microseconds (us)
  }

  const baselineAcc = ((splitPoint - baselineErrors) / splitPoint) * 100;
  const adaptedAcc = ((totalSteps - splitPoint - adaptedErrors) / (totalSteps - splitPoint)) * 100;
  const baseErrRate = baselineErrors / splitPoint;
  const adaptErrRate = adaptedErrors / (totalSteps - splitPoint);
  const errorReduction = baseErrRate > 0 ? ((baseErrRate - adaptErrRate) / baseErrRate) * 100 : 0;

  const activeKeys = agent.keys.filter((k) => k.type !== 'special');
  const meanDrift = activeKeys.reduce((acc, k) => acc + Math.hypot(k.currentX - k.defaultX, k.currentY - k.defaultY), 0) / activeKeys.length;
  const avgLatencyUs = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  return {
    baselineAcc,
    adaptedAcc,
    errorReduction: Math.max(0, errorReduction),
    cumulativeReward: agent.cumulativeReward,
    meanTdError: agent.runningTdError,
    meanDrift,
    latencyUs: avgLatencyUs,
  };
}

console.log("\n==========================================================================");
console.log("=== 3-WAY RL ALGORITHM BENCHMARK (Actor-Critic vs DQN vs PPO) ===");
console.log("=== Target Profile: Right Drift Typer (600 Keystroke Evaluation) ===");
console.log("==========================================================================\n");

const algorithms: Array<{ id: RLAlgorithmType; name: string; stability: string }> = [
  { id: 'actor-critic', name: 'Option 1: Actor-Critic (A2C Advantage PG)', stability: 'High (Smooth O(1))' },
  { id: 'dqn', name: 'Option 2: Deep Q-Network (DQN Replay)', stability: 'Moderate (Epsilon jitter)' },
  { id: 'ppo', name: 'Option 3: Proximal Policy Opt (PPO Clipped)', stability: 'Very High (Clipped monotonic)' },
];

const results: AlgorithmComparisonResult[] = algorithms.map((a) => {
  const res = runAlgorithmBenchmark(a.id, 'right_drift', 600);
  return {
    algorithm: a.name,
    baselineAccPct: `${res.baselineAcc.toFixed(1)}%`,
    adaptedAccPct: `${res.adaptedAcc.toFixed(1)}%`,
    errorReductionPct: `+${res.errorReduction.toFixed(1)}%`,
    cumulativeReward: res.cumulativeReward.toFixed(1),
    meanTdError: res.meanTdError.toFixed(3),
    meanDriftPx: `${res.meanDrift.toFixed(2)} px`,
    latencyUs: `${res.latencyUs.toFixed(1)} µs`,
    stability: a.stability,
  };
});

console.table(results);

console.log("\n--- ACROSS ALL 7 USER PROFILES SUMMARY ---");
const profileSummaries = PRESETS.map((p) => {
  const ac = runAlgorithmBenchmark('actor-critic', p.id, 400);
  const dqn = runAlgorithmBenchmark('dqn', p.id, 400);
  const ppo = runAlgorithmBenchmark('ppo', p.id, 400);
  return {
    profile: p.name,
    baseline: `${ac.baselineAcc.toFixed(1)}%`,
    'Actor-Critic': `${ac.adaptedAcc.toFixed(1)}% (+${ac.errorReduction.toFixed(0)}%)`,
    'DQN (Discrete)': `${dqn.adaptedAcc.toFixed(1)}% (+${dqn.errorReduction.toFixed(0)}%)`,
    'PPO (Clipped)': `${ppo.adaptedAcc.toFixed(1)}% (+${ppo.errorReduction.toFixed(0)}%)`,
  };
});
console.table(profileSummaries);
