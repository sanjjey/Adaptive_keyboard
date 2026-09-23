import type { KeyConfig, RLParams } from './types';
import { computePowerDiagramCells } from './PowerDiagram';
import type { Polygon2D } from './PowerDiagram';
import { LanguageModel } from './LanguageModel';

export class KeyboardRLAgent {
  public keys: KeyConfig[] = [];
  public params: RLParams;
  public cells: { [id: string]: Polygon2D } = {};
  public showNumericRow: boolean = false;
  public recentKeystrokes: boolean[] = [];
  public reAnnealBoost: number = 0;
  public minWeight: number = 200;
  public maxWeight: number = 8000;

  constructor(params: RLParams) {
    this.params = params;
    this.initializeKeys();
    this.updateCells();
  }

  /**
   * Initializes the default QWERTY and Numeric keys with their starting sizes and positions.
   */
  private initializeKeys() {
    this.keys = [];

    // 1. Numeric Row (Row -1)
    const numChars = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    numChars.forEach((char, index) => {
      // Temporary positions; will be updated based on showNumericRow
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
    // Left Shift button
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

    // Spacebar
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

    // Backspace button
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

    // Enter button
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
   * Adjusts default and current Y positions of all keys depending on whether the top numeric row is active.
   */
  private applyNumericRowOffset() {
    this.keys.forEach((key) => {
      const deltaY = this.showNumericRow ? 65 : 0;
      if (key.type === 'numeric') {
        // Numeric keys are active or collapsed
        key.defaultY = 35;
        if (!this.showNumericRow) {
          // Collapse out of bounds/hidden
          key.currentY = -100;
        } else {
          key.currentY = 35;
        }
      } else if (key.type === 'alpha') {
        // Calculate the current adaptive offset relative to the old defaultY
        const currentOffset = key.currentY - key.defaultY;

        // Calculate the new defaultY
        const baseDefaultY = key.row === 0 ? 50 : key.row === 1 ? 130 : 210;
        key.defaultY = baseDefaultY + deltaY;

        // Apply new defaultY plus the preserved offset
        key.currentY = key.defaultY + currentOffset;
      } else if (key.type === 'special') {
        key.defaultY = 305 + deltaY;
        key.currentY = 305 + deltaY;
      }
    });
  }

  /**
   * Sets whether the numeric row is visible and adjusts key layouts.
   */
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

    // Filter keys that participate in the Power Diagram
    const activeSites = this.keys
      .filter((k) => k.type !== 'special' && (k.type !== 'numeric' || this.showNumericRow))
      .map((k) => ({
        id: k.id,
        x: k.currentX,
        y: k.currentY,
        weight: k.weight,
      }));

    const computed = computePowerDiagramCells(activeSites, bounds);
    
    // Clear and refill cells map
    this.cells = {};
    computed.forEach((cell) => {
      this.cells[cell.id] = cell.polygon;
    });
  }

  public classifyTouch(x: number, y: number, history: string = ' '): string {
    // 1. Check if the touch lies in the special keys region
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
      // Fallback: nearest special key if we are in the special area but between keys
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

    // 2. Classify using the Bayesian Touch Decoder for alpha-numeric keys
    const activeAlphaNumeric = this.keys.filter(
      (k) => k.type !== 'special' && (k.type !== 'numeric' || this.showNumericRow)
    );

    let bestKeyId = '';
    let maxScore = -Infinity;

    // Retrieve last character of history for bigram transition context
    const prevChar = history.slice(-1) || ' ';

    activeAlphaNumeric.forEach((key) => {
      const dx = x - key.currentX;
      const dy = y - key.currentY;
      
      // Power distance formula: d^2 - weight
      const powerDist = dx * dx + dy * dy - key.weight;
      
      // Spatial log-likelihood: normal distribution log-pdf exponent
      // We divide by 2 * sigma^2, choosing a standard touch variance of 30px
      const logLikelihood = -powerDist / (2 * 900); // 30^2 = 900

      // Linguistic log-prior: log( P(key.char | prevChar) )
      let logPrior = 0;
      if (key.type === 'alpha' || key.id === 'space') {
        const priorProb = LanguageModel.getBigramProbability(prevChar, key.char);
        logPrior = Math.log(priorProb);
      } else {
        // Neutral uniform prior for digits
        logPrior = Math.log(1 / 27);
      }

      // Bayesian classification score
      const score = logLikelihood + this.params.lmWeight * logPrior;

      if (score > maxScore) {
        maxScore = score;
        bestKeyId = key.id;
      }
    });

    // Fallback if no keys classified
    return bestKeyId || 'space';
  }

  /**
   * Calculates the simulated annealing learning temperature based on typing history.
   * Decays from 1.0 to 0.2 over approximately 850 keystrokes.
   */
  public getLearningTemperature(keystrokes: number): number {
    const minTemp = 0.2;
    const decayRate = 0.0025; // exponential decay coefficient
    return minTemp + (1.0 - minTemp) * Math.exp(-decayRate * keystrokes);
  }

  /**
   * Applies the Reinforcement Learning update rule to the virtual layout.
   * Steps and weight growths are scaled by the dynamic learning temperature.
   */
  public updateLayout(targetId: string, classifiedId: string, x: number, y: number, totalKeystrokes = 0) {
    const targetKey = this.keys.find((k) => k.id === targetId);
    const classifiedKey = this.keys.find((k) => k.id === classifiedId);

    if (!targetKey || !classifiedKey) return;

    // Do not adapt layout geometries for special key selections
    if (targetKey.type === 'special' || classifiedKey.type === 'special') return;

    // Record keystroke correctness for re-annealing scheduler
    this.recentKeystrokes.push(targetId === classifiedId);
    if (this.recentKeystrokes.length > 50) {
      this.recentKeystrokes.shift();
    }

    // Adaptive Re-Annealing: spike learning rate if error rate rises
    const errorCount = this.recentKeystrokes.filter((c) => !c).length;
    const errorRate = errorCount / Math.max(1, this.recentKeystrokes.length);
    if (errorRate > 0.15 && this.recentKeystrokes.length >= 20) {
      this.reAnnealBoost = Math.min(0.6, this.reAnnealBoost + 0.04);
    } else {
      this.reAnnealBoost = Math.max(0, this.reAnnealBoost - 0.005);
    }

    // Calculate active learning rate and updates based on dynamic temperature (plus re-anneal boost)
    const temp = Math.min(1.0, this.getLearningTemperature(totalKeystrokes) + this.reAnnealBoost);
    const lrBase = this.params.learningRate * temp;
    const weightGrowth = this.params.weightGrowth * temp;
    const weightShrink = this.params.weightShrink * temp;
    const regularization = this.params.regularization * temp;


    // Check Euclidean distance between default key centers to assess adjacency
    const dx = targetKey.defaultX - classifiedKey.defaultX;
    const dy = targetKey.defaultY - classifiedKey.defaultY;
    const centerDist = Math.sqrt(dx * dx + dy * dy);

    if (targetId === classifiedId) {
      // Correct keystroke: minor reinforcement to center the key closer to user habit
      const lr = lrBase * 0.1;
      targetKey.currentX += lr * (x - targetKey.currentX);
      targetKey.currentY += lr * (y - targetKey.currentY);
    } else {
      // Typo!
      if (centerDist <= this.params.adjacentThreshold) {
        // Nearby key error: strong adaptation
        const lr = lrBase;
        targetKey.currentX += lr * (x - targetKey.currentX);
        targetKey.currentY += lr * (y - targetKey.currentY);

        // Expand target weight, shrink competitor weight
        targetKey.weight += weightGrowth;
        classifiedKey.weight -= weightShrink;
      } else {
        // Distant key error: very low weightage (cognitive typo protection)
        const lr = lrBase * 0.02;
        targetKey.currentX += lr * (x - targetKey.currentX);
        targetKey.currentY += lr * (y - targetKey.currentY);

        targetKey.weight += weightGrowth * 0.05;
        classifiedKey.weight -= weightShrink * 0.05;
      }
    }

    // Regularization: decay layouts back toward default muscle memory structures
    this.keys.forEach((key) => {
      if (key.type === 'special') return;

      // Regularize centers
      key.currentX -= regularization * (key.currentX - key.defaultX);
      key.currentY -= regularization * (key.currentY - key.defaultY);

      // Regularize weight (default base weight is 1000)
      const defaultWeight = 1000;
      key.weight -= regularization * (key.weight - defaultWeight);
    });

    // Bound values to prevent extreme overlap distortions
    const padding = 8;
    this.keys.forEach((key) => {
      if (key.type === 'special') return;
      
      key.currentX = Math.max(padding, Math.min(1000 - padding, key.currentX));

      const minY = this.showNumericRow ? 70 : 0;
      const maxY = this.showNumericRow ? 280 : 260;
      key.currentY = Math.max(minY + padding, Math.min(maxY - padding, key.currentY));
      
      // Limit weights to safe numeric range
      key.weight = Math.max(this.minWeight, Math.min(this.maxWeight, key.weight));
    });

    // Re-clip cells under the updated coordinates and weights
    this.updateCells();
  }

  /**
   * Resets the entire keyboard layout to its original default state.
   */
  public resetLayout() {
    this.keys.forEach((key) => {
      key.currentX = key.defaultX;
      key.currentY = key.defaultY;
      key.weight = 1000;
    });
    this.recentKeystrokes = [];
    this.reAnnealBoost = 0;
    this.applyNumericRowOffset();
    this.updateCells();
  }

  // ─────────────────────────────────────────────────────────────────
  // BACKSPACE-AS-NEGATIVE-REWARD
  // ─────────────────────────────────────────────────────────────────

  /** Count of backspace correction events since last reset */
  public correctionCount: number = 0;

  /**
   * Applies a real-time negative reward when the user presses Backspace.
   *
   * Every backspace is interpreted as: "the previous tap at (x, y) was a mistake."
   * We retroactively penalise the key that was registered at that tap:
   *   1. Push the wrong key's centroid AWAY from the mis-tap position (anti-gradient).
   *   2. Shrink the wrong key's Voronoi weight → its cell contracts.
   *   3. Adjacent keys automatically expand to fill the gap, pulling the correct key
   *      into the territory where the user is actually tapping.
   *
   * Reward magnitude is scaled by `confidence` (0–1), which should be computed
   * from the time elapsed between the original tap and the backspace: the shorter
   * the interval, the higher the confidence that it was a reactive typo correction
   * rather than a deliberate edit.
   *
   * @param wrongKeyId  - id of the key that was registered at the mis-tap
   * @param x           - x coordinate of the original mis-tap (0–1000 space)
   * @param y           - y coordinate of the original mis-tap (0–1000 space)
   * @param confidence  - scalar in [0, 1]; default 1.0 (immediate backspace)
   */
  public applyBackspaceCorrection(
    wrongKeyId: string,
    x: number,
    y: number,
    confidence = 1.0,
  ): void {
    const wrongKey = this.keys.find((k) => k.id === wrongKeyId);
    if (!wrongKey || wrongKey.type === 'special') return;

    // Scale penalty by confidence and the current learning rate
    const penalty = this.params.learningRate * confidence;

    // ── Anti-gradient centroid push ───────────────────────────────
    // Move the centroid AWAY from the mis-tap position by inverting the
    // standard gradient direction. This is the opposite of what updateLayout
    // does for a correct tap.
    wrongKey.currentX -= penalty * (x - wrongKey.currentX);
    wrongKey.currentY -= penalty * (y - wrongKey.currentY);

    // ── Weight contraction ────────────────────────────────────────
    // Shrinking the weight reduces the Voronoi power so neighboring keys
    // win the cell boundary near (x, y).
    const shrink = this.params.weightShrink * confidence;
    wrongKey.weight -= shrink;

    // ── Record for re-annealing scheduler ────────────────────────
    // A backspace counts as an error in the recent window.
    this.recentKeystrokes.push(false);
    if (this.recentKeystrokes.length > 50) this.recentKeystrokes.shift();

    // ── Bounds clamping ───────────────────────────────────────────
    const padding = 8;
    wrongKey.currentX = Math.max(padding, Math.min(1000 - padding, wrongKey.currentX));
    const minY = this.showNumericRow ? 70 : 0;
    const maxY = this.showNumericRow ? 280 : 260;
    wrongKey.currentY = Math.max(minY + padding, Math.min(maxY - padding, wrongKey.currentY));
    wrongKey.weight = Math.max(this.minWeight, Math.min(this.maxWeight, wrongKey.weight));

    this.correctionCount++;
    this.updateCells();
  }

  // ─────────────────────────────────────────────────────────────────
  // SERIALIZATION & MEMORY
  // ─────────────────────────────────────────────────────────────────

  public exportState(): string {
    const state = {
      correctionCount: this.correctionCount,
      keys: this.keys.map(k => ({
        id: k.id,
        currentX: k.currentX,
        currentY: k.currentY,
        weight: k.weight
      }))
    };
    return JSON.stringify(state);
  }

  public loadState(json: string): void {
    try {
      const state = JSON.parse(json);
      if (state.correctionCount !== undefined) {
        this.correctionCount = state.correctionCount;
      }
      if (state.keys && Array.isArray(state.keys)) {
        state.keys.forEach((savedKey: any) => {
          const k = this.keys.find(key => key.id === savedKey.id);
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
