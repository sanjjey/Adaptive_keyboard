import { KeyboardRLAgent } from './KeyboardRLAgent';
import { TransitionAgent } from './TransitionAgent';
import { LanguageModel } from './LanguageModel';

console.log('--- STARTING VERIFICATION TESTS ---');

// Test 1: Power Diagram & KeyboardRLAgent Touch Classification
try {
  const agent = new KeyboardRLAgent({
    learningRate: 0.1,
    regularization: 0.001,
    weightGrowth: 100,
    weightShrink: 100,
    adjacentThreshold: 150,
    lmWeight: 0.0, // Disable LM weight for pure spatial test
  });

  // Verify that default 'q' classification works
  // 'q' default center is at (50, 50)
  const classification = agent.classifyTouch(50, 50);
  console.log(`Test 1 (Default classification): Tapping at (50, 50) classified as: ${classification}`);
  if (classification !== 'q') {
    throw new Error(`Expected 'q' but got '${classification}'`);
  }
  console.log('✅ Test 1 Passed.');
} catch (e) {
  console.error('❌ Test 1 Failed:', e);
}

// Test 2: Spatial Adaptation Updates
try {
  const agent = new KeyboardRLAgent({
    learningRate: 0.2,
    regularization: 0.0, // Disable regularization to isolate updates
    weightGrowth: 200,
    weightShrink: 200,
    adjacentThreshold: 150,
    lmWeight: 0.0,
  });

  // Simulate nearby typo: user wanted 'q' (default center 50, 50) but tapped at (90, 50) which falls into 'w'
  const beforeKey = agent.keys.find((k) => k.id === 'q')!;
  const beforeWeight = beforeKey.weight;
  
  agent.updateLayout('q', 'w', 90, 50);

  const afterKey = agent.keys.find((k) => k.id === 'q')!;
  
  console.log(`Test 2 (Spatial Adaptation): 'q' weight went from ${beforeWeight} to ${afterKey.weight}`);
  console.log(`Test 2 (Spatial Adaptation): 'q' center X shifted from 50 to ${afterKey.currentX}`);

  if (afterKey.weight <= beforeWeight) {
    throw new Error('Target key weight should have grown!');
  }
  if (afterKey.currentX <= 50) {
    throw new Error('Target key center should have shifted right toward the touch point!');
  }
  console.log('✅ Test 2 Passed.');
} catch (e) {
  console.error('❌ Test 2 Failed:', e);
}

// Test 3: Q-Learning Transition Agent
try {
  const tAgent = new TransitionAgent({
    learningRate: 0.5,
    discountFactor: 0.8,
    epsilon: 0.0, // Force exploitation for deterministic verification
    switchPenalty: 10,
  });

  // Target letter 'a', then number '1'.
  // Under standard layout, action is 0 (Alphabet Mode).
  // Digit transition requires switch penalty.
  const result1 = tAgent.processKeystroke('a', '1', true);
  console.log(`Test 3 (Transition Agent): Reward for typing '1' in alphabet mode: ${result1.reward}`);
  if (result1.reward >= 0) {
    throw new Error('Reward should be negative due to manual layout switch penalty!');
  }

  // After multiple trials, it should learn that showing numeric row (action 1) is better
  // Let's train it on state 'a ' -> '1' multiple times
  const state = tAgent.getState('a');
  for (let i = 0; i < 20; i++) {
    tAgent.processKeystroke('a', '1', false);
  }

  const action = tAgent.selectAction(state, true);
  console.log(`Test 3 (Transition Agent): Action selected for state '${state}' after training: ${action}`);
  if (action !== 1 && action !== 2) {
    throw new Error('Agent failed to learn layout adaptation for digits!');
  }
  console.log('✅ Test 3 Passed.');
} catch (e) {
  console.error('❌ Test 3 Failed:', e);
}

// Test 4: Language Model Bigram Probability lookup
try {
  const pTH = LanguageModel.getBigramProbability('t', 'h');
  const pTX = LanguageModel.getBigramProbability('t', 'x');

  console.log(`Test 4 (LM Probability): P(h|t) = ${pTH.toFixed(4)}, P(x|t) = ${pTX.toFixed(4)}`);
  if (pTH <= pTX) {
    throw new Error("Transition P(h|t) should be significantly higher than P(x|t)!");
  }
  console.log('✅ Test 4 Passed.');
} catch (e) {
  console.error('❌ Test 4 Failed:', e);
}

// Test 5: Bayesian Decoder context bias classification
try {
  const agent = new KeyboardRLAgent({
    learningRate: 0.1,
    regularization: 0.001,
    weightGrowth: 100,
    weightShrink: 100,
    adjacentThreshold: 150,
    lmWeight: 1.2, // High weight to observe language bias clearly
  });

  // Touch coordinates: (802, 50).
  // Default center of 'i' is 750. Default center of 'o' is 850.
  // The tap at 802 is slightly closer to 'o' (dist = 48) than 'i' (dist = 52).
  // Under pure spatial decoding, this resolves to 'o'.
  // However:
  // - If history context is 'h', bigram 'hi' is highly likely. It should bias and resolve to 'i'.
  // - If history context is 'w', bigram 'wo' is highly likely. It should bias and resolve to 'o'.
  
  const classWithH = agent.classifyTouch(802, 50, 'h');
  const classWithC = agent.classifyTouch(802, 50, 'c');

  console.log(`Test 5 (Bayesian Decoder): Tapping between 'i' and 'o' with history 'h' resolved to: ${classWithH}`);
  console.log(`Test 5 (Bayesian Decoder): Tapping between 'i' and 'o' with history 'c' resolved to: ${classWithC}`);

  if (classWithH !== 'i') {
    throw new Error("Expected context bias to resolve to 'i' after 'h'!");
  }
  if (classWithC !== 'o') {
    throw new Error("Expected context bias to resolve to 'o' after 'c'!");
  }
  
  console.log('✅ Test 5 Passed.');
} catch (e) {
  console.error('❌ Test 5 Failed:', e);
}

// Test 6: Adaptive Re-Annealing Scheduler
try {
  const agent = new KeyboardRLAgent({
    learningRate: 0.2,
    regularization: 0.002,
    weightGrowth: 400,
    weightShrink: 300,
    adjacentThreshold: 140,
    lmWeight: 0.4,
  });

  // Verify default reAnnealBoost is 0
  if (agent.reAnnealBoost !== 0) {
    throw new Error('Initial reAnnealBoost should be 0!');
  }

  // Simulate a high error rate burst (25 typos in a row)
  for (let i = 0; i < 25; i++) {
    agent.updateLayout('q', 'w', 90, 50, i); // 'q' target but 'w' classified
  }

  console.log(`Test 6 (Adaptive Re-Annealing): reAnnealBoost after 25 typos: ${agent.reAnnealBoost.toFixed(4)}`);
  if (agent.reAnnealBoost <= 0) {
    throw new Error('Re-annealing boost should have spiked above 0 due to high error rate!');
  }

  // Simulate subsequent correct keystrokes
  for (let i = 0; i < 150; i++) {
    agent.updateLayout('q', 'q', 50, 50, 25 + i);
  }

  console.log(`Test 6 (Adaptive Re-Annealing): reAnnealBoost after recovery: ${agent.reAnnealBoost.toFixed(4)}`);
  if (agent.reAnnealBoost >= 0.2) {
    throw new Error('Re-annealing boost should have cooled down after successful typing recovery!');
  }

  console.log('✅ Test 6 Passed.');
} catch (e) {
  console.error('❌ Test 6 Failed:', e);
}

console.log('--- VERIFICATION TESTS COMPLETED ---');
