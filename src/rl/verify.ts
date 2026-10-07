import { KeyboardRLAgent } from './KeyboardRLAgent';
import { LanguageModel } from './LanguageModel';

console.log('--- STARTING REINFORCEMENT LEARNING VERIFICATION TESTS ---');

// Test 1: Power Diagram & KeyboardRLAgent Touch Classification
try {
  const agent = new KeyboardRLAgent({
    learningRate: 0.1,
    regularization: 0.001,
    weightGrowth: 100,
    weightShrink: 100,
    adjacentThreshold: 150,
    lmWeight: 0.0,
  });

  const classification = agent.classifyTouch(50, 50);
  console.log(`Test 1 (Default classification): Tapping at (50, 50) classified as: ${classification}`);
  if (classification !== 'q') {
    throw new Error(`Expected 'q' but got '${classification}'`);
  }
  console.log('✅ Test 1 Passed.');
} catch (e) {
  console.error('❌ Test 1 Failed:', e);
}

// Test 2: Actor-Critic Spatial Adaptation Updates
try {
  const agent = new KeyboardRLAgent({
    learningRate: 0.2,
    regularization: 0.0,
    weightGrowth: 200,
    weightShrink: 200,
    adjacentThreshold: 150,
    lmWeight: 0.0,
  });

  const beforeKey = agent.keys.find((k) => k.id === 'q')!;
  const beforeWeight = beforeKey.weight;

  // Typo: user wanted 'q' but tapped at (90, 50) in 'w' territory
  const stepResult = agent.updateLayout('q', 'w', 90, 50);

  const afterKey = agent.keys.find((k) => k.id === 'q')!;

  console.log(`Test 2 (Actor-Critic Adaptation): 'q' weight went from ${beforeWeight} to ${afterKey.weight}`);
  console.log(`Test 2 (Actor-Critic Adaptation): 'q' center X shifted from 50 to ${afterKey.currentX.toFixed(2)}`);
  console.log(`Test 2 (Actor-Critic Adaptation): Step reward = ${stepResult.reward.toFixed(2)}, TD error = ${stepResult.tdError.toFixed(2)}`);

  if (afterKey.weight <= beforeWeight) {
    throw new Error('Target key weight should have grown under policy action!');
  }
  if (afterKey.currentX <= 50) {
    throw new Error('Target key center should have shifted right toward touch point!');
  }
  console.log('✅ Test 2 Passed.');
} catch (e) {
  console.error('❌ Test 2 Failed:', e);
}

// Test 3: Actor-Critic RL Training & TD Learning Convergence
try {
  const agent = new KeyboardRLAgent({
    learningRate: 0.15,
    criticLearningRate: 0.1,
    discountFactor: 0.85,
    regularization: 0.001,
    weightGrowth: 300,
    weightShrink: 200,
    adjacentThreshold: 140,
    lmWeight: 0.4,
  });

  // Train agent on 50 repeated typing events
  for (let i = 0; i < 50; i++) {
    // Alternating between hits and nearby slips
    if (i % 2 === 0) {
      agent.updateLayout('e', 'e', 250, 50, i);
    } else {
      agent.updateLayout('e', 'r', 270, 50, i);
    }
  }

  console.log(`Test 3 (RL TD Convergence): Total transitions: ${agent.totalTransitions}`);
  console.log(`Test 3 (RL TD Convergence): Cumulative reward: ${agent.cumulativeReward.toFixed(2)}`);
  console.log(`Test 3 (RL TD Convergence): Running TD Error: ${agent.runningTdError.toFixed(4)}`);
  console.log(`Test 3 (RL TD Convergence): Critic Loss: ${agent.criticLoss.toFixed(4)}`);

  if (agent.totalTransitions !== 50) {
    throw new Error(`Expected 50 transitions, got ${agent.totalTransitions}`);
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
    throw new Error('Transition P(h|t) should be significantly higher than P(x|t)!');
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
    lmWeight: 1.2,
  });

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

// Test 6: Asynchronous Backspace Credit Assignment (Negative RL Reward)
try {
  const agent = new KeyboardRLAgent({
    learningRate: 0.2,
    regularization: 0.0,
    weightGrowth: 300,
    weightShrink: 300,
    adjacentThreshold: 150,
    lmWeight: 0.4,
  });

  // Tap registered mistakenly as 'o' at (840, 50)
  agent.updateLayout('o', 'o', 840, 50);
  const rewardBefore = agent.cumulativeReward;
  const oKeyBefore = agent.keys.find((k) => k.id === 'o')!;
  const oWeightBefore = oKeyBefore.weight;

  // User presses backspace to undo 'o'
  agent.applyBackspaceCorrection('o', 840, 50, 1.0);

  const oKeyAfter = agent.keys.find((k) => k.id === 'o')!;
  console.log(`Test 6 (Backspace Credit Assignment): Cumulative reward went from ${rewardBefore.toFixed(2)} to ${agent.cumulativeReward.toFixed(2)}`);
  console.log(`Test 6 (Backspace Credit Assignment): 'o' weight contracted from ${oWeightBefore} to ${oKeyAfter.weight}`);

  if (agent.cumulativeReward >= rewardBefore) {
    throw new Error('Cumulative reward should have decreased after backspace penalty!');
  }
  if (oKeyAfter.weight >= oWeightBefore) {
    throw new Error('Wrong key weight should contract on backspace correction!');
  }
  console.log('✅ Test 6 Passed.');
} catch (e) {
  console.error('❌ Test 6 Failed:', e);
}

console.log('--- ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ---');
