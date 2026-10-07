export interface KeyConfig {
  id: string;
  char: string;
  row: number;
  defaultX: number; // Center X
  defaultY: number; // Center Y
  defaultWidth: number;
  defaultHeight: number;
  currentX: number; // Adaptive Center X
  currentY: number; // Adaptive Center Y
  weight: number;   // Power Diagram weight
  type: 'alpha' | 'numeric' | 'special';
}

export interface TouchPoint {
  x: number;
  y: number;
  targetKeyId: string;
  classifiedKeyId: string;
  timestamp: number;
  isCorrect: boolean;
}

export interface RLParams {
  learningRate: number;      // Actor Policy learning rate (alpha_actor)
  criticLearningRate?: number; // Critic Value learning rate (alpha_critic)
  discountFactor?: number;   // Temporal discount factor (gamma)
  regularization: number;    // Muscle memory regularization (lambda_drift)
  weightGrowth: number;      // Hitbox expansion baseline
  weightShrink: number;      // Competitor contraction baseline
  adjacentThreshold: number; // Max Euclidean distance for adjacency consideration
  lmWeight: number;          // Weight of language model prior in Bayesian touch classification
  explorationNoise?: number; // Exploration noise variance for policy actions
}

export interface TyperProfile {
  id: string;
  name: string;
  description: string;
  noiseLevel: number;        // Standard deviation of random coordinate offset
  driftX: number;            // Constant horizontal coordinate offset
  driftY: number;            // Constant vertical coordinate offset
  doubleLetterRate: number;  // Tendency to type duplicate keys
  numericFrequency: number;  // Ratio of numerical key transitions
}

export interface TypingStats {
  wpm: number;
  accuracy: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  totalErrors: number;
  cumulativeReward: number;  // Total RL reward accumulated
  lastReward: number;        // Reward from most recent keystroke
  meanTdError: number;       // Running Temporal Difference (TD) error
  criticLoss?: number;       // Running Critic TD loss
  switchesSaved?: number;    // Backward compatibility
  manualSwitches?: number;   // Backward compatibility
}

export type RLAlgorithmType = 'actor-critic' | 'dqn' | 'ppo';

export interface AlgorithmOption {
  id: RLAlgorithmType;
  name: string;
  shortName: string;
  tagline: string;
  actionSpace: string;
  memoryStrategy: string;
  description: string;
}

export const ALGORITHM_OPTIONS: AlgorithmOption[] = [
  {
    id: 'actor-critic',
    name: 'Option 1: Actor-Critic (A2C)',
    shortName: 'Actor-Critic',
    tagline: 'Advantage Policy Gradient (Continuous, Online)',
    actionSpace: 'Continuous R^3 [dx, dy, dw]',
    memoryStrategy: 'Online On-Policy TD(0)',
    description: 'Instant O(1) spatial gradient updates per keystroke with zero rollout latency. Highly responsive for continuous coordinate tracking.',
  },
  {
    id: 'dqn',
    name: 'Option 2: Deep Q-Network (DQN)',
    shortName: 'Deep Q-Learning',
    tagline: 'Experience Replay & Bellman Q-Learning (Discrete)',
    actionSpace: 'Discrete 9-Actions',
    memoryStrategy: 'Experience Replay Buffer (D=256)',
    description: 'Quantizes adaptations into 9 directional & Voronoi power actions. Decouples exploration via epsilon-greedy and trains off-policy mini-batches.',
  },
  {
    id: 'ppo',
    name: 'Option 3: Proximal Policy Optimization (PPO)',
    shortName: 'PPO Clipped',
    tagline: 'Clipped Surrogate Objective & Trajectory Rollouts',
    actionSpace: 'Continuous Gaussian R^3 [dx, dy, dw]',
    memoryStrategy: 'Rollout Trajectory Buffer (K=16)',
    description: 'Clips probability ratio r_t(theta) within [1-eps, 1+eps] (eps=0.2). Prevents catastrophic layout degradation and guarantees monotonic policy improvement.',
  },
];
