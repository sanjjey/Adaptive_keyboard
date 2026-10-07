import type { KeyConfig, RLParams, RLAlgorithmType } from './types';
import { computePowerDiagramCells } from './PowerDiagram';
import type { Polygon2D } from './PowerDiagram';
import { LanguageModel } from './LanguageModel';

/**
 * Feature dimensions for RL State space:
 * 1. Normalized dx: (touch.x - key.x) / 50
 * 2. Normalized dy: (touch.y - key.y) / 50
 * 3. Distance ratio to adjacency threshold
 * 4. Keystroke hit indicator (+1 for correct, -1 for error)
 * 5. Recent rolling error rate [0, 1]
 * 6. Normalized layout drift from default muscle memory [0, 1]
 * 7. Language model bigram context log-prior probability
 */
const STATE_DIM = 7;
/**
 * Action dimensions for Continuous Policy:
 * 1. a_x in [-1, 1]: Horizontal centroid adaptation scale
 * 2. a_y in [-1, 1]: Vertical centroid adaptation scale
 * 3. a_w in [-1, 1]: Voronoi power weight growth/shrink scale
 */
const ACTION_DIM = 3;

export class KeyboardRLAgent {
  public keys: KeyConfig[] = [];
  public params: RLParams;
  public cells: { [id: string]: Polygon2D } = {};
  public showNumericRow: boolean = false;
  public minWeight: number = 200;
  public maxWeight: number = 8000;

  // ── Multi-Algorithm Selection ───────────────────────────────────────────────
  public algorithmType: RLAlgorithmType = 'actor-critic';

  // ── RL Actor-Critic Network Weights ───────────────────────────────────────────
  // Critic: Linear value function V(s) = w_c^T * s + b_c
  private criticWeights: number[] = new Array(STATE_DIM).fill(0.05);
  private criticBias: number = 0.0;

  // Actor: Policy network mean mu(s) = tanh(W_a * s + b_a)
  private actorWeights: number[][] = Array.from({ length: ACTION_DIM }, () =>
    new Array(STATE_DIM).fill(0.1)
  );
  private actorBias: number[] = [0.5, 0.5, 0.5]; // Initial bias favors positive adaptive response

  // ── DQN Discrete Action Set (9 distinct micro-decisions) ─────────────────────
  public static readonly DQN_ACTIONS: Array<{
    id: number;
    name: string;
    shiftX: number;
    shiftY: number;
    weightFactor: number;
  }> = [
    { id: 0, name: 'Maintain', shiftX: 0.0, shiftY: 0.0, weightFactor: 0.0 },
    { id: 1, name: 'Gentle Shift & Expand', shiftX: 0.4, shiftY: 0.4, weightFactor: 0.4 },
    { id: 2, name: 'Moderate Shift & Expand', shiftX: 0.8, shiftY: 0.8, weightFactor: 0.75 },
    { id: 3, name: 'Aggressive Shift & Expand', shiftX: 1.2, shiftY: 1.2, weightFactor: 1.0 },
    { id: 4, name: 'Horizontal Correction', shiftX: 1.0, shiftY: 0.0, weightFactor: 0.5 },
    { id: 5, name: 'Vertical Correction', shiftX: 0.0, shiftY: 1.0, weightFactor: 0.5 },
    { id: 6, name: 'Hitbox Enlarge Only', shiftX: 0.0, shiftY: 0.0, weightFactor: 1.0 },
    { id: 7, name: 'Hitbox Contract Only', shiftX: 0.0, shiftY: 0.0, weightFactor: -0.8 },
    { id: 8, name: 'Muscle Recenter Nudge', shiftX: -0.5, shiftY: -0.5, weightFactor: 0.0 },
  ];

  // ── DQN Q-Network Weights & Experience Replay Buffer ─────────────────────────
  private dqnWeights: number[][] = Array.from({ length: 9 }, () =>
    new Array(STATE_DIM).fill(0.05)
  );
  private dqnBias: number[] = new Array(9).fill(0.1);
  private targetDqnWeights: number[][] = Array.from({ length: 9 }, () =>
    new Array(STATE_DIM).fill(0.05)
  );
  private targetDqnBias: number[] = new Array(9).fill(0.1);
  private dqnReplayBuffer: Array<{
    state: number[];
    actionIdx: number;
    reward: number;
    nextState: number[];
  }> = [];
  private readonly dqnMaxReplay: number = 256;
  public dqnEpsilon: number = 0.10;
  private lastDqnActionIdx: number | null = null;

  // ── PPO Trajectory Rollout Buffer & Parameters ───────────────────────────────
  private ppoRolloutBuffer: Array<{
    state: number[];
    action: number[];
    reward: number;
    nextState: number[];
    oldLogProb: number;
    value: number;
  }> = [];
  private readonly ppoRolloutCapacity: number = 16;
  public ppoClipEpsilon: number = 0.20;
  public ppoEpochs: number = 3;

  // RL Trajectory & Metric Tracking
  public cumulativeReward: number = 0;
  public lastReward: number = 0;
  public runningTdError: number = 0;
  public criticLoss: number = 0;
  public totalTransitions: number = 0;

  // Transition History for Delayed Credit Assignment (Backspace)
  private lastState: number[] | null = null;
  private lastAction: number[] | null = null;

  // Recent Keystroke Accuracy Buffer (for state feature extraction)
  public recentKeystrokes: boolean[] = [];
  public correctionCount: number = 0;

  constructor(params: Partial<RLParams> = {}) {
    this.params = {
      learningRate: 0.15,
      regularization: 0.002,
      weightGrowth: 400,
      weightShrink: 300,
      adjacentThreshold: 140,
      lmWeight: 0.4,
      criticLearningRate: 0.08,
      discountFactor: 0.85,
      explorationNoise: 0.15,
      ...params,
    };
    this.initializeKeys();
    this.updateCells();
  }

  /**
   * Initializes the default QWERTY and Numeric keys with baseline positions.
   */
  private initializeKeys() {
    this.keys = [];

    // 1. Numeric Row (Row -1)
    const numChars = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    numChars.forEach((char, index) => {
      this.keys.push({
        id: char,
        char,
        row: -1,
        defaultX: 50 + index * 90,
        defaultY: 35,
        defaultWidth: 88,
        defaultHeight: 60,
        currentX: 50 + index * 90,
        currentY: 35,
        weight: 1000,
        type: 'numeric',
      });
    });

    // 2. Alphabet Row 0 (q..p)
    const row0Chars = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
    row0Chars.forEach((char, index) => {
      this.keys.push({
        id: char,
        char,
        row: 0,
        defaultX: 50 + index * 100,
        defaultY: 50,
        defaultWidth: 98,
        defaultHeight: 76,
        currentX: 50 + index * 100,
        currentY: 50,
        weight: 1000,
        type: 'alpha',
      });
    });

    // 3. Alphabet Row 1 (a..l)
    const row1Chars = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
    row1Chars.forEach((char, index) => {
      this.keys.push({
        id: char,
        char,
        row: 1,
        defaultX: 100 + index * 100,
        defaultY: 130,
        defaultWidth: 98,
        defaultHeight: 76,
        currentX: 100 + index * 100,
        currentY: 130,
        weight: 1000,
        type: 'alpha',
      });
    });

    // 4. Alphabet Row 2 (z..m)
    const row2Chars = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
    row2Chars.forEach((char, index) => {
      this.keys.push({
        id: char,
        char,
        row: 2,
        defaultX: 200 + index * 100,
        defaultY: 210,
        defaultWidth: 98,
        defaultHeight: 76,
        currentX: 200 + index * 100,
        currentY: 210,
        weight: 1000,
        type: 'alpha',
      });
    });

    // 5. Special Keys Row 3
    this.keys.push({
      id: 'shift',
      char: '⇧',
      row: 3,
      defaultX: 85,
      defaultY: 305,
      defaultWidth: 150,
      defaultHeight: 80,
      currentX: 85,
      currentY: 305,
      weight: 1000,
      type: 'special',
    });

    this.keys.push({
      id: 'space',
      char: ' ',
      row: 3,
      defaultX: 420,
      defaultY: 305,
      defaultWidth: 450,
      defaultHeight: 80,
      currentX: 420,
      currentY: 305,
      weight: 1000,
      type: 'special',
    });

    this.keys.push({
      id: 'backspace',
      char: '⌫',
      row: 3,
      defaultX: 750,
      defaultY: 305,
      defaultWidth: 150,
      defaultHeight: 80,
      currentX: 750,
      currentY: 305,
      weight: 1000,
      type: 'special',
    });

    this.keys.push({
      id: 'enter',
      char: '⏎',
      row: 3,
      defaultX: 915,
      defaultY: 305,
      defaultWidth: 150,
      defaultHeight: 80,
      currentX: 915,
      currentY: 305,
      weight: 1000,
      type: 'special',
    });

    this.applyNumericRowOffset();
  }

  /**
   * Adjusts default and current Y positions of all keys depending on whether top numeric row is active.
   */
  private applyNumericRowOffset() {
    this.keys.forEach((key) => {
      const deltaY = this.showNumericRow ? 65 : 0;
      if (key.type === 'numeric') {
        key.defaultY = 35;
        key.currentY = this.showNumericRow ? 35 : -100;
      } else if (key.type === 'alpha') {
        const currentOffset = key.currentY - key.defaultY;
        const baseDefaultY = key.row === 0 ? 50 : key.row === 1 ? 130 : 210;
        key.defaultY = baseDefaultY + deltaY;
        key.currentY = key.defaultY + currentOffset;
      } else if (key.type === 'special') {
        key.defaultY = 305 + deltaY;
        key.currentY = 305 + deltaY;
      }
    });
  }

  public setNumericRowVisible(visible: boolean) {
    if (this.showNumericRow === visible) return;
    this.showNumericRow = visible;
    this.applyNumericRowOffset();
    this.updateCells();
  }

  /**
   * Recalculates the Power Diagram cell shapes for the active alpha-numeric keys.
   */
  public updateCells() {
    const bounds = {
      minX: 0,
      maxX: 1000,
      minY: this.showNumericRow ? 70 : 0,
      maxY: this.showNumericRow ? 280 : 260,
    };

    const activeSites = this.keys
      .filter((k) => k.type !== 'special' && (k.type !== 'numeric' || this.showNumericRow))
      .map((k) => ({
        id: k.id,
        x: k.currentX,
        y: k.currentY,
        weight: k.weight,
      }));

    const computed = computePowerDiagramCells(activeSites, bounds);
    this.cells = {};
    computed.forEach((cell) => {
      this.cells[cell.id] = cell.polygon;
    });
  }

  /**
   * Bayesian Touch Decoder:
   * Maps touch coordinates (x, y) to optimal key using Gaussian spatial likelihood
   * combined with Language Model context prior.
   */
  public classifyTouch(x: number, y: number, history: string = ' '): string {
    const specialRowY = this.showNumericRow ? 280 : 260;
    if (y >= specialRowY) {
      const specials = this.keys.filter((k) => k.type === 'special');
      for (const key of specials) {
        const left = key.currentX - key.defaultWidth / 2;
        const right = key.currentX + key.defaultWidth / 2;
        const top = key.currentY - key.defaultHeight / 2;
        const bottom = key.currentY + key.defaultHeight / 2;
        if (x >= left && x <= right && y >= top && y <= bottom) {
          return key.id;
        }
      }
      let closestId = 'space';
      let minD = Infinity;
      specials.forEach((key) => {
        const d = Math.pow(x - key.currentX, 2) + Math.pow(y - key.currentY, 2);
        if (d < minD) {
          minD = d;
          closestId = key.id;
        }
      });
      return closestId;
    }

    const activeAlphaNumeric = this.keys.filter(
      (k) => k.type !== 'special' && (k.type !== 'numeric' || this.showNumericRow)
    );

    let bestKeyId = '';
    let maxScore = -Infinity;
    const prevChar = history.slice(-1) || ' ';

    activeAlphaNumeric.forEach((key) => {
      const dx = x - key.currentX;
      const dy = y - key.currentY;
      // Power distance formula: d^2 - weight
      const powerDist = dx * dx + dy * dy - key.weight;
      const logLikelihood = -powerDist / (2 * 900); // touch variance 30px

      let logPrior = 0;
      if (key.type === 'alpha' || key.id === 'space') {
        const priorProb = LanguageModel.getBigramProbability(prevChar, key.char);
        logPrior = Math.log(priorProb);
      } else {
        logPrior = Math.log(1 / 27);
      }

      const score = logLikelihood + this.params.lmWeight * logPrior;
      if (score > maxScore) {
        maxScore = score;
        bestKeyId = key.id;
      }
    });

    return bestKeyId || 'space';
  }

  // ─────────────────────────────────────────────────────────────────
  // REINFORCEMENT LEARNING: ACTOR-CRITIC MDP CORE
  // ─────────────────────────────────────────────────────────────────

  /**
   * Constructs normalized state vector s_t in R^7
   */
  public extractState(
    targetKey: KeyConfig,
    classifiedKey: KeyConfig,
    touchX: number,
    touchY: number,
    prevChar: string = ' '
  ): number[] {
    const dx = (touchX - targetKey.currentX) / 50.0;
    const dy = (touchY - targetKey.currentY) / 50.0;

    const centerDist = Math.sqrt(
      Math.pow(targetKey.defaultX - classifiedKey.defaultX, 2) +
      Math.pow(targetKey.defaultY - classifiedKey.defaultY, 2)
    );
    const normalizedDist = Math.min(2.0, centerDist / Math.max(1, this.params.adjacentThreshold));

    const isHit = targetKey.id === classifiedKey.id ? 1.0 : -1.0;

    const errorCount = this.recentKeystrokes.filter((c) => !c).length;
    const errorRate = errorCount / Math.max(1, this.recentKeystrokes.length);

    const drift = Math.sqrt(
      Math.pow(targetKey.currentX - targetKey.defaultX, 2) +
      Math.pow(targetKey.currentY - targetKey.defaultY, 2)
    ) / 30.0;

    const priorProb = LanguageModel.getBigramProbability(prevChar, targetKey.char);
    const normalizedPrior = Math.log(priorProb) / 5.0; // scale log probability

    return [dx, dy, normalizedDist, isHit, errorRate, drift, normalizedPrior];
  }

  public setAlgorithm(type: RLAlgorithmType): void {
    this.algorithmType = type;
  }

  /**
   * Critic: V(s) = w_c^T * s + b_c
   */
  public evaluateValue(state: number[]): number {
    let val = this.criticBias;
    for (let i = 0; i < STATE_DIM; i++) {
      val += this.criticWeights[i] * state[i];
    }
    return val;
  }

  /**
   * Actor: Policy pi_theta(a | s) with continuous Gaussian exploration
   */
  public sampleAction(state: number[]): { action: number[]; mean: number[] } {
    const mean: number[] = [];
    const action: number[] = [];
    const noiseStd = this.params.explorationNoise ?? 0.15;

    for (let a = 0; a < ACTION_DIM; a++) {
      let linear = this.actorBias[a];
      for (let s = 0; s < STATE_DIM; s++) {
        linear += this.actorWeights[a][s] * state[s];
      }
      // tanh activation bounds mean into [-1, 1]
      const m = Math.tanh(linear);
      mean.push(m);

      // Gaussian sample
      const gaussianNoise = (Math.random() + Math.random() - 1.0) * noiseStd * 1.73;
      const act = Math.max(-1.0, Math.min(1.0, m + gaussianNoise));
      action.push(act);
    }

    return { action, mean };
  }

  /**
   * PPO: Evaluates log-probability of continuous action under current policy Gaussian:
   * log pi_theta(a | s) = sum_i [ -0.5 * ((a_i - mu_i)/sigma)^2 - ln(sigma * sqrt(2*pi)) ]
   */
  public computeLogProb(state: number[], action: number[]): { logProb: number; mean: number[] } {
    const mean: number[] = [];
    const noiseStd = this.params.explorationNoise ?? 0.15;
    const variance = noiseStd * noiseStd;
    let logProb = 0;

    for (let a = 0; a < ACTION_DIM; a++) {
      let linear = this.actorBias[a];
      for (let s = 0; s < STATE_DIM; s++) {
        linear += this.actorWeights[a][s] * state[s];
      }
      const m = Math.tanh(linear);
      mean.push(m);

      const diff = action[a] - m;
      logProb += -0.5 * ((diff * diff) / variance) - Math.log(noiseStd * 2.5066);
    }

    return { logProb, mean };
  }

  /**
   * DQN: Linear Q-value evaluation for discrete micro-action a in [0..8]:
   * Q(s, a) = w_q[a]^T * s + b_q[a]
   */
  public evaluateQ(state: number[], actionIdx: number, useTarget = false): number {
    const weights = useTarget ? this.targetDqnWeights : this.dqnWeights;
    const biases = useTarget ? this.targetDqnBias : this.dqnBias;
    let val = biases[actionIdx];
    for (let s = 0; s < STATE_DIM; s++) {
      val += weights[actionIdx][s] * state[s];
    }
    return val;
  }

  /**
   * DQN: Epsilon-Greedy Action Selection over 9 discrete micro-decisions
   */
  public sampleDqnAction(state: number[]): { actionIdx: number; qValues: number[] } {
    const qValues: number[] = [];
    for (let a = 0; a < 9; a++) {
      qValues.push(this.evaluateQ(state, a, false));
    }

    // Epsilon exploration
    if (Math.random() < this.dqnEpsilon) {
      const randomIdx = Math.floor(Math.random() * 9);
      return { actionIdx: randomIdx, qValues };
    }

    let bestIdx = 0;
    let bestQ = -Infinity;
    for (let a = 0; a < 9; a++) {
      if (qValues[a] > bestQ) {
        bestQ = qValues[a];
        bestIdx = a;
      }
    }
    return { actionIdx: bestIdx, qValues };
  }

  /**
   * Multi-objective scalar reward function:
   * R = R_accuracy - R_drift - R_error_severity
   */
  public computeReward(
    isCorrect: boolean,
    centerDist: number
  ): number {
    if (isCorrect) {
      return 1.2;
    }

    if (centerDist <= this.params.adjacentThreshold) {
      return -1.5;
    } else {
      return -3.5;
    }
  }

  /**
   * Executes one step of Reinforcement Learning across the selected engine:
   * - Option 1: Actor-Critic (Continuous On-Policy Policy Gradient)
   * - Option 2: Deep Q-Network (Discrete Actions, Replay Buffer, Bellman updates)
   * - Option 3: Proximal Policy Optimization (PPO Clipped Surrogate & Rollouts)
   */
  public updateLayout(
    targetId: string,
    classifiedId: string,
    x: number,
    y: number,
    _totalKeystrokes = 0,
    historyContext: string = ' '
  ): { reward: number; tdError: number } {
    const targetKey = this.keys.find((k) => k.id === targetId);
    const classifiedKey = this.keys.find((k) => k.id === classifiedId);

    if (!targetKey || !classifiedKey) return { reward: 0, tdError: 0 };
    if (targetKey.type === 'special' || classifiedKey.type === 'special') {
      return { reward: 0, tdError: 0 };
    }

    const isHit = targetId === classifiedId;
    this.recentKeystrokes.push(isHit);
    if (this.recentKeystrokes.length > 50) this.recentKeystrokes.shift();

    // 1. Extract State s_t
    const state = this.extractState(targetKey, classifiedKey, x, y, historyContext);

    // 2. Action Generation & Scaling per Algorithm
    let shiftScaleX = 0;
    let shiftScaleY = 0;
    let weightFactor = 0;
    let continuousAction: number[] = [0, 0, 0];
    let continuousMean: number[] = [0, 0, 0];
    let dqnActionIdx = 0;
    let ppoOldLogProb = 0;

    if (this.algorithmType === 'dqn') {
      const dqnResult = this.sampleDqnAction(state);
      dqnActionIdx = dqnResult.actionIdx;
      this.lastDqnActionIdx = dqnActionIdx;
      const dqnMeta = KeyboardRLAgent.DQN_ACTIONS[dqnActionIdx];
      shiftScaleX = dqnMeta.shiftX;
      shiftScaleY = dqnMeta.shiftY;
      weightFactor = dqnMeta.weightFactor;
      continuousAction = [shiftScaleX, shiftScaleY, weightFactor];
    } else if (this.algorithmType === 'ppo') {
      const sampled = this.sampleAction(state);
      continuousAction = sampled.action;
      continuousMean = sampled.mean;
      shiftScaleX = Math.abs(continuousAction[0]);
      shiftScaleY = Math.abs(continuousAction[1]);
      weightFactor = (continuousAction[2] + 1.0) / 2.0;

      const ppoLog = this.computeLogProb(state, continuousAction);
      ppoOldLogProb = ppoLog.logProb;
    } else {
      // Option 1: Actor-Critic (A2C Default)
      const sampled = this.sampleAction(state);
      continuousAction = sampled.action;
      continuousMean = sampled.mean;
      shiftScaleX = Math.abs(continuousAction[0]);
      shiftScaleY = Math.abs(continuousAction[1]);
      weightFactor = (continuousAction[2] + 1.0) / 2.0;
    }

    // 3. Compute Distance & Scalar Reward R_t
    const dx = targetKey.defaultX - classifiedKey.defaultX;
    const dy = targetKey.defaultY - classifiedKey.defaultY;
    const centerDist = Math.sqrt(dx * dx + dy * dy);

    let reward = this.computeReward(isHit, centerDist);

    // Muscle memory drift penalty (regularization in reward)
    const driftDist = Math.sqrt(
      Math.pow(targetKey.currentX - targetKey.defaultX, 2) +
      Math.pow(targetKey.currentY - targetKey.defaultY, 2)
    );
    reward -= this.params.regularization * (driftDist / 10.0);

    // 4. Apply Physical Adaptation to Virtual Key Hitbox
    const actorAlpha = this.params.learningRate;
    if (isHit) {
      targetKey.currentX += actorAlpha * 0.15 * shiftScaleX * (x - targetKey.currentX);
      targetKey.currentY += actorAlpha * 0.15 * shiftScaleY * (y - targetKey.currentY);
    } else {
      if (centerDist <= this.params.adjacentThreshold) {
        targetKey.currentX += actorAlpha * shiftScaleX * (x - targetKey.currentX);
        targetKey.currentY += actorAlpha * shiftScaleY * (y - targetKey.currentY);

        targetKey.weight += this.params.weightGrowth * weightFactor;
        classifiedKey.weight -= this.params.weightShrink * weightFactor;
      }
    }

    // Regularization pull back toward muscle memory defaults
    const reg = this.params.regularization;
    this.keys.forEach((key) => {
      if (key.type === 'special') return;
      key.currentX -= reg * (key.currentX - key.defaultX);
      key.currentY -= reg * (key.currentY - key.defaultY);
      key.weight -= reg * (key.weight - 1000);
      key.weight = Math.max(this.minWeight, Math.min(this.maxWeight, key.weight));
    });

    // Bounds Clamping
    const padding = 8;
    this.keys.forEach((key) => {
      if (key.type === 'special') return;
      key.currentX = Math.max(padding, Math.min(1000 - padding, key.currentX));
      const minY = this.showNumericRow ? 70 : 0;
      const maxY = this.showNumericRow ? 280 : 260;
      key.currentY = Math.max(minY + padding, Math.min(maxY - padding, key.currentY));
    });

    // 5. Next State s_{t+1}
    const nextState = this.extractState(targetKey, classifiedKey, x, y, historyContext);
    const gamma = this.params.discountFactor ?? 0.85;
    let tdError = 0;

    // 6. Algorithm-Specific Policy / Value Updates
    if (this.algorithmType === 'dqn') {
      // ── Option 2: Deep Q-Network Update ───────────────────────────────────
      this.dqnReplayBuffer.push({
        state,
        actionIdx: dqnActionIdx,
        reward,
        nextState,
      });
      if (this.dqnReplayBuffer.length > this.dqnMaxReplay) {
        this.dqnReplayBuffer.shift();
      }

      // Sample mini-batch of up to 8 transitions
      const batchSize = Math.min(8, this.dqnReplayBuffer.length);
      const dqnAlpha = this.params.learningRate * 0.5;
      let batchLoss = 0;

      for (let b = 0; b < batchSize; b++) {
        const randIdx = Math.floor(Math.random() * this.dqnReplayBuffer.length);
        const trans = this.dqnReplayBuffer[randIdx];

        // Max target Q over discrete actions: max_{a'} Q_target(s', a')
        let maxNextQ = -Infinity;
        for (let a = 0; a < 9; a++) {
          const qVal = this.evaluateQ(trans.nextState, a, true);
          if (qVal > maxNextQ) maxNextQ = qVal;
        }

        const targetQ = trans.reward + gamma * maxNextQ;
        const currentQ = this.evaluateQ(trans.state, trans.actionIdx, false);
        const bellmanError = targetQ - currentQ;
        batchLoss += bellmanError * bellmanError;

        // Semi-gradient Q-weight update
        for (let s = 0; s < STATE_DIM; s++) {
          this.dqnWeights[trans.actionIdx][s] += dqnAlpha * bellmanError * trans.state[s];
        }
        this.dqnBias[trans.actionIdx] += dqnAlpha * bellmanError;

        if (b === 0) tdError = bellmanError;
      }

      // Periodic Target Network soft sync every 32 transitions
      if (this.totalTransitions % 32 === 0) {
        for (let a = 0; a < 9; a++) {
          this.targetDqnBias[a] = this.dqnBias[a];
          for (let s = 0; s < STATE_DIM; s++) {
            this.targetDqnWeights[a][s] = this.dqnWeights[a][s];
          }
        }
      }

      this.runningTdError = 0.9 * this.runningTdError + 0.1 * Math.abs(tdError);
      this.criticLoss = 0.9 * this.criticLoss + 0.1 * (batchLoss / batchSize);

    } else if (this.algorithmType === 'ppo') {
      // ── Option 3: Proximal Policy Optimization (PPO) ─────────────────────
      const currentVal = this.evaluateValue(state);
      const nextVal = this.evaluateValue(nextState);
      tdError = reward + gamma * nextVal - currentVal;

      this.ppoRolloutBuffer.push({
        state,
        action: continuousAction,
        reward,
        nextState,
        oldLogProb: ppoOldLogProb,
        value: currentVal,
      });

      // When trajectory rollout buffer is full (16 steps), perform clipped updates
      if (this.ppoRolloutBuffer.length >= this.ppoRolloutCapacity) {
        const N = this.ppoRolloutBuffer.length;
        const advantages: number[] = new Array(N);
        let meanAdv = 0;

        for (let i = 0; i < N; i++) {
          const item = this.ppoRolloutBuffer[i];
          const adv = item.reward + gamma * this.evaluateValue(item.nextState) - item.value;
          advantages[i] = adv;
          meanAdv += adv;
        }
        meanAdv /= N;

        let varAdv = 0;
        for (let i = 0; i < N; i++) {
          varAdv += Math.pow(advantages[i] - meanAdv, 2);
        }
        const stdAdv = Math.sqrt(varAdv / N) + 1e-6;

        // Multi-epoch PPO Clipped Surrogate updates
        const actorLR = this.params.learningRate * 0.3;
        const criticAlpha = (this.params.criticLearningRate ?? 0.08) * 0.5;
        const noiseStd = this.params.explorationNoise ?? 0.15;
        const variance = noiseStd * noiseStd;

        for (let epoch = 0; epoch < this.ppoEpochs; epoch++) {
          for (let i = 0; i < N; i++) {
            const item = this.ppoRolloutBuffer[i];
            const normAdv = (advantages[i] - meanAdv) / stdAdv;

            // Current policy log prob
            const { logProb: currentLogProb, mean: currentMean } = this.computeLogProb(item.state, item.action);
            const ratio = Math.exp(currentLogProb - item.oldLogProb);

            // Clipped surrogate objective
            const surr1 = ratio * normAdv;
            const surr2 = Math.min(Math.max(ratio, 1.0 - this.ppoClipEpsilon), 1.0 + this.ppoClipEpsilon) * normAdv;
            const effectiveAdv = Math.min(surr1, surr2);

            // Policy gradient step
            for (let a = 0; a < ACTION_DIM; a++) {
              const diff = item.action[a] - currentMean[a];
              const gradMu = (1.0 - currentMean[a] * currentMean[a]);
              const gradLogP = (diff / variance) * gradMu;
              const stepGrad = actorLR * effectiveAdv * gradLogP;

              for (let s = 0; s < STATE_DIM; s++) {
                this.actorWeights[a][s] += stepGrad * item.state[s];
              }
              this.actorBias[a] += stepGrad;
            }

            // Critic value function update
            const targetVal = item.reward + gamma * this.evaluateValue(item.nextState);
            const vErr = targetVal - this.evaluateValue(item.state);
            for (let s = 0; s < STATE_DIM; s++) {
              this.criticWeights[s] += criticAlpha * vErr * item.state[s];
            }
            this.criticBias += criticAlpha * vErr;
          }
        }

        this.ppoRolloutBuffer = [];
      }

      this.runningTdError = 0.9 * this.runningTdError + 0.1 * Math.abs(tdError);
      this.criticLoss = 0.9 * this.criticLoss + 0.1 * (tdError * tdError);

    } else {
      // ── Option 1: Actor-Critic (A2C Default) ──────────────────────────────
      const currentVal = this.evaluateValue(state);
      const nextVal = this.evaluateValue(nextState);
      tdError = reward + gamma * nextVal - currentVal;

      // Critic Update (Semi-gradient TD(0)):
      const criticAlpha = this.params.criticLearningRate ?? 0.08;
      for (let i = 0; i < STATE_DIM; i++) {
        this.criticWeights[i] += criticAlpha * tdError * state[i];
      }
      this.criticBias += criticAlpha * tdError;

      // Actor Update (Policy Gradient with Advantage = tdError):
      const actorLR = this.params.learningRate * 0.5;
      for (let a = 0; a < ACTION_DIM; a++) {
        const advantage = tdError * (continuousAction[a] - continuousMean[a]);
        for (let s = 0; s < STATE_DIM; s++) {
          this.actorWeights[a][s] += actorLR * advantage * state[s];
        }
        this.actorBias[a] += actorLR * advantage;
      }

      this.runningTdError = 0.9 * this.runningTdError + 0.1 * Math.abs(tdError);
      this.criticLoss = 0.9 * this.criticLoss + 0.1 * (tdError * tdError);
    }

    // 7. Record Metrics
    this.cumulativeReward += reward;
    this.lastReward = reward;
    this.totalTransitions++;

    // Save for retroactive backspace credit assignment
    this.lastState = state;
    this.lastAction = continuousAction;

    this.updateCells();
    return { reward, tdError };
  }

  /**
   * ASYNCHRONOUS CREDIT ASSIGNMENT: Backspace-as-Negative-Reward
   * When user presses backspace, the preceding action caused a typing failure.
   * Retroactively penalizes the Critic and shifts Actor policy weights away via anti-gradient.
   */
  public applyBackspaceCorrection(
    wrongKeyId: string,
    x: number,
    y: number,
    confidence = 1.0
  ): void {
    const wrongKey = this.keys.find((k) => k.id === wrongKeyId);
    if (!wrongKey || wrongKey.type === 'special') return;

    // Delayed negative reward for typo
    const penaltyReward = -3.5 * confidence;
    this.cumulativeReward += penaltyReward;
    this.lastReward = penaltyReward;

    // Anti-gradient spatial pushback
    const penaltyRate = this.params.learningRate * confidence;
    wrongKey.currentX -= penaltyRate * (x - wrongKey.currentX);
    wrongKey.currentY -= penaltyRate * (y - wrongKey.currentY);
    wrongKey.weight -= this.params.weightShrink * confidence;

    // Retroactive Policy Gradient or Q-Learning update if last transition recorded
    if (this.algorithmType === 'dqn' && this.lastState && this.lastDqnActionIdx !== null) {
      this.dqnReplayBuffer.push({
        state: this.lastState,
        actionIdx: this.lastDqnActionIdx,
        reward: penaltyReward,
        nextState: this.lastState,
      });
      const dqnAlpha = this.params.learningRate * 0.5 * confidence;
      const currentQ = this.evaluateQ(this.lastState, this.lastDqnActionIdx, false);
      const err = penaltyReward - currentQ;
      for (let s = 0; s < STATE_DIM; s++) {
        this.dqnWeights[this.lastDqnActionIdx][s] += dqnAlpha * err * this.lastState[s];
      }
      this.dqnBias[this.lastDqnActionIdx] += dqnAlpha * err;
      this.runningTdError = 0.9 * this.runningTdError + 0.1 * Math.abs(err);
    } else if (this.lastState && this.lastAction) {
      const retroactiveTd = penaltyReward - this.evaluateValue(this.lastState);
      const actorLR = this.params.learningRate * 0.5 * confidence;
      for (let a = 0; a < ACTION_DIM; a++) {
        const advantage = retroactiveTd * this.lastAction[a];
        for (let s = 0; s < STATE_DIM; s++) {
          this.actorWeights[a][s] += actorLR * advantage * this.lastState[s];
        }
      }
      this.runningTdError = 0.9 * this.runningTdError + 0.1 * Math.abs(retroactiveTd);
    }

    this.recentKeystrokes.push(false);
    if (this.recentKeystrokes.length > 50) this.recentKeystrokes.shift();

    const padding = 8;
    wrongKey.currentX = Math.max(padding, Math.min(1000 - padding, wrongKey.currentX));
    const minY = this.showNumericRow ? 70 : 0;
    const maxY = this.showNumericRow ? 280 : 260;
    wrongKey.currentY = Math.max(minY + padding, Math.min(maxY - padding, wrongKey.currentY));
    wrongKey.weight = Math.max(this.minWeight, Math.min(this.maxWeight, wrongKey.weight));

    this.correctionCount++;
    this.updateCells();
  }

  public resetLayout() {
    this.keys.forEach((key) => {
      key.currentX = key.defaultX;
      key.currentY = key.defaultY;
      key.weight = 1000;
    });
    this.recentKeystrokes = [];
    this.cumulativeReward = 0;
    this.runningTdError = 0;
    this.criticLoss = 0;
    this.ppoRolloutBuffer = [];
    this.dqnReplayBuffer = [];
    this.applyNumericRowOffset();
    this.updateCells();
  }

  // ── Serialization & Checkpoint ──────────────────────────────────────────────
  public exportState(): string {
    const state = {
      algorithmType: this.algorithmType,
      correctionCount: this.correctionCount,
      cumulativeReward: this.cumulativeReward,
      runningTdError: this.runningTdError,
      criticWeights: this.criticWeights,
      criticBias: this.criticBias,
      actorWeights: this.actorWeights,
      actorBias: this.actorBias,
      dqnWeights: this.dqnWeights,
      dqnBias: this.dqnBias,
      keys: this.keys.map((k) => ({
        id: k.id,
        currentX: k.currentX,
        currentY: k.currentY,
        weight: k.weight,
      })),
    };
    return JSON.stringify(state);
  }

  public loadState(json: string): void {
    try {
      const state = JSON.parse(json);
      if (state.algorithmType) this.algorithmType = state.algorithmType;
      if (state.correctionCount !== undefined) this.correctionCount = state.correctionCount;
      if (state.cumulativeReward !== undefined) this.cumulativeReward = state.cumulativeReward;
      if (state.runningTdError !== undefined) this.runningTdError = state.runningTdError;
      if (state.criticWeights) this.criticWeights = state.criticWeights;
      if (state.criticBias !== undefined) this.criticBias = state.criticBias;
      if (state.actorWeights) this.actorWeights = state.actorWeights;
      if (state.actorBias) this.actorBias = state.actorBias;
      if (state.dqnWeights) this.dqnWeights = state.dqnWeights;
      if (state.dqnBias) this.dqnBias = state.dqnBias;

      if (state.keys && Array.isArray(state.keys)) {
        state.keys.forEach((savedKey: any) => {
          const k = this.keys.find((key) => key.id === savedKey.id);
          if (k) {
            k.currentX = savedKey.currentX;
            k.currentY = savedKey.currentY;
            k.weight = savedKey.weight;
          }
        });
      }
      this.updateCells();
    } catch (e) {
      console.error('Failed to load RL agent state', e);
    }
  }
}
