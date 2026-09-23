import type { TransitionRLParams } from './types';

export class TransitionAgent {
  public qTable: { [state: string]: number[] } = {}; // State -> [Q(none), Q(numeric_row), Q(overlays)]
  public params: TransitionRLParams;
  public lastState: string = ' ';
  public lastAction: number = 0; // 0: None, 1: Show Numeric Row, 2: Show Overlays

  constructor(params: TransitionRLParams) {
    this.params = params;
  }

  /**
   * Translates the character history (last 2 chars) into a state string.
   */
  public getState(history: string): string {
    const clean = history.slice(-2);
    // Pad to length 2
    return clean.padStart(2, ' ');
  }

  /**
   * Chooses an action (layout mode) based on the current text context.
   */
  public selectAction(state: string, forceExploitation: boolean = false): number {
    // Ensure state exists in Q-table
    if (!this.qTable[state]) {
      this.qTable[state] = [0.0, 0.0, 0.0];
    }

    // Epsilon-greedy exploration
    if (!forceExploitation && Math.random() < this.params.epsilon) {
      return Math.floor(Math.random() * 3);
    }

    // Exploit: find action with max Q-value
    const qValues = this.qTable[state];
    let maxVal = -Infinity;
    let bestAction = 0;

    for (let a = 0; a < qValues.length; a++) {
      if (qValues[a] > maxVal) {
        maxVal = qValues[a];
        bestAction = a;
      }
    }

    return bestAction;
  }

  /**
   * Updates the Q-table based on the reward received for a transition.
   */
  public update(state: string, action: number, reward: number, nextState: string) {
    if (!this.qTable[state]) {
      this.qTable[state] = [0.0, 0.0, 0.0];
    }
    if (!this.qTable[nextState]) {
      this.qTable[nextState] = [0.0, 0.0, 0.0];
    }

    const currentQ = this.qTable[state][action];
    const maxNextQ = Math.max(...this.qTable[nextState]);

    // Q-learning update formula: Q(s,a) = Q(s,a) + alpha * (R + gamma * max Q(s',a') - Q(s,a))
    this.qTable[state][action] =
      currentQ +
      this.params.learningRate *
        (reward + this.params.discountFactor * maxNextQ - currentQ);
  }

  /**
   * Evaluates the typing transition event and gives a reward.
   * Returns: { reward, isManualSwitchSaved, actionChosen }
   */
  public processKeystroke(
    historyBefore: string,
    typedChar: string,
    manualSwitchPressed: boolean
  ): { reward: number; savedSwitch: boolean; action: number } {
    const state = this.getState(historyBefore);
    const action = this.selectAction(state);

    // Determine target type
    const isDigit = /^[0-9]$/.test(typedChar);

    let reward = 0;
    let savedSwitch = false;

    if (isDigit) {
      if (action === 1) {
        // Show numeric row: user tapped digit directly
        reward = 10.0;
        savedSwitch = true;
      } else if (action === 2) {
        // Overlays: user long-pressed/swiped digit
        reward = 5.0;
        savedSwitch = true;
      } else {
        // None: user had to manually switch layouts
        reward = -this.params.switchPenalty;
        if (manualSwitchPressed) {
          reward -= 5.0; // Extra penalty for manual switch click
        }
      }
    } else {
      // Alphabet or space
      if (action === 1) {
        // Wasted space by displaying numeric row
        reward = -4.0;
      } else if (action === 2) {
        // Minor distraction by displaying overlays
        reward = -1.0;
      } else {
        // Perfect: alphabetic layout for alphabetic key
        reward = 1.0;
      }
    }

    const nextHistory = (historyBefore + typedChar).slice(-2);
    const nextState = this.getState(nextHistory);

    // Update RL Q-table
    this.update(state, action, reward, nextState);

    // Record last state-action
    this.lastState = state;
    this.lastAction = action;

    return { reward, savedSwitch, action };
  }

  /**
   * Resets the Q-table to blank state.
   */
  public reset() {
    this.qTable = {};
    this.lastState = ' ';
    this.lastAction = 0;
  }
}
