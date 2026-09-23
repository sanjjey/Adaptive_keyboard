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
  learningRate: number;      // Position shift learning rate (alpha)
  regularization: number;    // Layout decay rate (lambda)
  weightGrowth: number;      // Target key weight increase (beta_pos)
  weightShrink: number;      // Competitor key weight decrease (beta_neg)
  adjacentThreshold: number; // Max Euclidean distance between centers for adjacency
  lmWeight: number;          // Weight of language model prior in Bayesian touch classification
}

export interface TransitionRLParams {
  learningRate: number;
  discountFactor: number;
  epsilon: number;
  switchPenalty: number;
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
  switchesSaved: number;
  manualSwitches: number;
}
