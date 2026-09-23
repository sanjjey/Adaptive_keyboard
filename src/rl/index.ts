// Headless modular exports for external frameworks or environments
export { KeyboardRLAgent } from './KeyboardRLAgent';
export { TransitionAgent } from './TransitionAgent';
export { LanguageModel } from './LanguageModel';
export { TyperSimulator, PRESETS } from './TyperSimulator';
export { computePowerDiagramCells } from './PowerDiagram';

// Export type configurations
export type {
  KeyConfig,
  TouchPoint,
  RLParams,
  TransitionRLParams,
  TyperProfile,
  TypingStats,
} from './types';
