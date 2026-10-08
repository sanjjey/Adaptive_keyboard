import { useState, useEffect, useRef } from 'react';
import { Keyboard } from './components/Keyboard';
import { SimulationControls } from './components/SimulationControls';
import { ConfigPanel } from './components/ConfigPanel';
import { Analytics } from './components/Analytics';
import { WhatsAppChat } from './components/WhatsAppChat';
import { KeyboardRLAgent } from './rl/KeyboardRLAgent';
import { TyperSimulator } from './rl/TyperSimulator';
import type { RLParams, TouchPoint, TypingStats, TyperProfile, RLAlgorithmType } from './rl/types';
import { PRESETS } from './rl/TyperSimulator';
import {
  Keyboard as KeyboardIcon,
  Sparkles,
  Smartphone,
  Tablet,
  Laptop as LaptopIcon,
  RotateCcw,
  Save,
  Users,
  MessageCircle,
  FlaskConical,
  Cpu,
} from 'lucide-react';

export interface UserProfile {
  id: string;
  name: string;
  data: string;
  lastUsed: number;
}

const MACKENZIE_PHRASES = [
  "my watch is three minutes fast",
  "our assistant is very competent",
  "we are open every day",
  "please select a diverse menu",
  "the weather is quite pleasant",
  "a critical review of the book",
  "a coupon is not required",
  "all questions must be answered",
  "this is a very good idea",
  "check the temperature of the water",
  "a thoroughly disappointing experience",
  "your left hand is shaking",
  "typing tests are very boring",
  "reinforcement learning converges quickly",
  "dynamic weights improve accuracy",
  "assistive technology for typing tremors",
  "the quick brown fox jumps over the lazy dog",
  "the temperature fell from seventy five to forty two",
  "const rate equals zero point zero five",
  "bayesian decoding combines touch and text priors",
  "have a good second half of the year",
  "the minimum wage was raised yesterday",
  "he is playing a game of chess",
  "please take a seat in the waiting room",
  "we are going to have a party tonight",
  "the bank is open until three o clock",
  "you must check your spam folder regularly",
  "the cat sat on the warm mat",
  "let us meet at nine thirty tomorrow morning",
  "she has a beautiful singing voice",
  "send an email to test at domain dot com",
  "please enter your password now",
  "press the red button to emergency stop",
  "the password must contain eight characters",
  "i would like a cup of hot coffee",
  "the train arrives at platform four",
  "we need to resolve this conflict soon",
  "drive carefully on the wet highway",
  "the books are arranged in alphabetical order",
  "please do not step on the fresh grass",
  "the flight was delayed by two hours",
  "water freezes at zero degrees celsius",
  "there are seven days in a week",
  "the capital of france is paris",
  "turn off the lights when you leave",
  "always wear your seatbelt in the car",
  "the phone is ringing in the other room",
  "i am looking forward to my vacation",
  "learning to play the piano takes time",
  "keep your eyes on the road ahead",
  "the sun rises in the east every morning",
  "he wrote a long letter to his friend",
  "the coffee shop is open twenty four hours",
  "she works as a software engineer at google",
  "they enjoyed a long walk along the beach",
  "please sign the document at the bottom",
  "the grocery store is closed on sundays",
  "we watched a beautiful sunset last night",
  "please turn to page forty five of the book",
  "the baby slept peacefully in the crib",
  "there is a meeting scheduled for monday",
  "the pizza was delivered in thirty minutes",
  "he plays soccer every saturday afternoon",
  "always wash your hands before eating",
  "she is reading a classic mystery novel",
  "we need to buy more fresh vegetables",
  "the library is a quiet place to study",
  "he bought a new pair of running shoes",
  "the flowers in the garden are blooming",
  "please close the window to keep the cold out",
  "the elevator is out of service today",
  "they went on a hike in the mountains",
  "the museum has a collection of rare art",
  "please check the date on the calendar",
  "the kids are playing in the backyard",
  "she won first prize in the art contest",
  "we had a picnic at the local park",
  "the ice cream melted in the hot sun",
  "please put your trash in the bin",
  "the concert starts at eight o clock sharp",
  "he walks his dog in the park every morning",
  "she is learning how to cook italian food",
  "they bought a house in the suburbs",
  "the wind blew the dry leaves away",
  "please fill out the survey online",
  "the post office is next to the pharmacy",
  "we visited the zoo and saw the monkeys",
  "the stars are bright in the clear sky",
  "please print this report for the meeting",
  "he has a doctor appointment at ten am",
  "she enjoys listening to classical music",
  "we need to update the project schedule",
  "the movie was very interesting and funny",
  "please write your name at the top",
  "the bread was freshly baked this morning",
  "she is taking a class on photography",
  "they are planning a trip to new york",
  "the restaurant serves delicious sea food",
  "please leave your keys on the counter",
  "he is learning a second language online",
  "the computer mouse is not working well",
  "she wears a silver ring on her finger",
  "we should plan a family get together",
  "the traffic was heavy during rush hour",
  "please take the trash out to the curb",
  "let us meet at nine thirty tomorrow morning",
  "water freezes at zero degrees celsius",
  "the train arrives at platform four",
  "please turn to page forty five of the book",
  "the pizza was delivered in thirty minutes",
  "the concert starts at eight o clock sharp",
  "he has a doctor appointment at ten am",
  "there are seven days in a week",
  "the temperature fell from seventy five to forty two",
  "const rate equals zero point zero five",
  "my watch is three minutes fast",
];

const generateSyntheticPhrase = (): string => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const letterWeights: { [c: string]: number } = {
    'a': 8, 'b': 2, 'c': 3, 'd': 4, 'e': 12, 'f': 2, 'g': 2, 'h': 6, 'i': 7, 'j': 1, 'k': 1, 'l': 4, 'm': 2,
    'n': 7, 'o': 8, 'p': 2, 'q': 1, 'r': 6, 's': 6, 't': 9, 'u': 3, 'v': 1, 'w': 2, 'x': 1, 'y': 2, 'z': 1
  };
  
  const sampleLetter = (): string => {
    const total = Object.values(letterWeights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const char of alphabet) {
      r -= letterWeights[char];
      if (r <= 0) return char;
    }
    return 'e';
  };

  const words: string[] = [];
  const numWords = 6;
  for (let w = 0; w < numWords; w++) {
    let wordLen = Math.floor(Math.random() * 5) + 3; // Word length 3-7
    let word = "";
    for (let c = 0; c < wordLen; c++) {
      word += sampleLetter();
    }
    words.push(word);
  }
  return words.join(' ');
};




const DEFAULT_SPATIAL_PARAMS: RLParams = {
  learningRate: 0.15,
  regularization: 0.002,
  weightGrowth: 400,
  weightShrink: 300,
  adjacentThreshold: 140,
  lmWeight: 0.4, // Bayesian Prior Weight
};



const DEFAULT_STATS: TypingStats = {
  wpm: 0,
  accuracy: 1.0,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  totalErrors: 0,
  cumulativeReward: 0,
  lastReward: 0,
  meanTdError: 0,
  criticLoss: 0,
  switchesSaved: 0,
  manualSwitches: 0,
};

interface DevicePresetConfig {
  id: 'mobile' | 'tablet' | 'laptop';
  name: string;
  minWeight: number;
  maxWeight: number;
  spatialParams: RLParams;
}

const DEVICE_PRESETS: DevicePresetConfig[] = [
  {
    id: 'mobile',
    name: 'Mobile Phone',
    minWeight: 550,
    maxWeight: 2200,
    spatialParams: {
      learningRate: 0.08,
      regularization: 0.005,
      weightGrowth: 250,
      weightShrink: 180,
      adjacentThreshold: 100,
      lmWeight: 0.4,
    },
  },
  {
    id: 'tablet',
    name: 'Tablet / iPad',
    minWeight: 400,
    maxWeight: 4500,
    spatialParams: {
      learningRate: 0.15,
      regularization: 0.003,
      weightGrowth: 400,
      weightShrink: 300,
      adjacentThreshold: 130,
      lmWeight: 0.4,
    },
  },
  {
    id: 'laptop',
    name: 'Laptop / Universal',
    minWeight: 200,
    maxWeight: 8000,
    spatialParams: {
      learningRate: 0.20,
      regularization: 0.0015,
      weightGrowth: 500,
      weightShrink: 350,
      adjacentThreshold: 150,
      lmWeight: 0.4,
    },
  },
];



export default function App() {
  // 1. Core Agent Instances (persistent refs)
  const spatialAgentRef = useRef<KeyboardRLAgent | null>(null);

  // Initialize agents once
  if (!spatialAgentRef.current) {
    spatialAgentRef.current = new KeyboardRLAgent(DEFAULT_SPATIAL_PARAMS);
  }

  const spatialAgent = spatialAgentRef.current;

  // 2. State Hooks
  const [spatialParams, setSpatialParams] = useState<RLParams>(DEFAULT_SPATIAL_PARAMS);
  const [currentProfile, setCurrentProfile] = useState<TyperProfile>(PRESETS[0]);
  const [stats, setStats] = useState<TypingStats>(DEFAULT_STATS);
  const [rlAlgorithm, setRlAlgorithm] = useState<RLAlgorithmType>('actor-critic');

  const handleAlgorithmChange = (newAlgo: RLAlgorithmType) => {
    setRlAlgorithm(newAlgo);
    if (spatialAgentRef.current) {
      spatialAgentRef.current.setAlgorithm(newAlgo);
    }
  };
  
  // History of stats points for charting
  const [metricHistory, setMetricHistory] = useState<any[]>([]);

  // Keyboard render switches
  const [showVoronoi, setShowVoronoi] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showTouches, setShowTouches] = useState(true);
  const [showOverlays, setShowOverlays] = useState(false);
  const [isSmoothingEnabled, setIsSmoothingEnabled] = useState(false);

  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'laptop'>('laptop');
  const [activeTab, setActiveTab] = useState<'studio' | 'whatsapp'>('studio');

  // ── Backspace-as-Negative-Reward state ──────────────────────────────────
  // Ring buffer storing metadata of the last 50 taps so we can retroactively
  // apply a negative reward when backspace fires.
  const tapHistoryRef = useRef<{ key: string; x: number; y: number; timestamp: number }[]>([]);
  // ID of the key that just received a backspace correction — drives CSS flash
  const [correctionFlashKey, setCorrectionFlashKey] = useState<string | null>(null);
  // Running total of backspace-driven RL corrections (shown in stats panel)
  const [backspaceCorrectionCount, setBackspaceCorrectionCount] = useState(0);

  // Texts
  const [selectedTextOption, setSelectedTextOption] = useState<string>('mackenzie');
  const [mackenzieIndex, setMackenzieIndex] = useState(0);
  const [targetText, setTargetText] = useState(MACKENZIE_PHRASES[0]);
  const [customText, setCustomText] = useState('');
  const [inputText, setInputText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [isShiftActive, setIsShiftActive] = useState(false);

  // Simulation Running State
  const [isRunning, setIsRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState(2); // Interval speed multiplier
  const [recentTouches, setRecentTouches] = useState<TouchPoint[]>([]);

  // Multi-User Profile State
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const [simulatedTimeMs, setSimulatedTimeMs] = useState(0);

  // Sync parameters back to agents when states change
  useEffect(() => {
    spatialAgent.params = spatialParams;
  }, [spatialParams]);

  // Sync device modes and bounds to KeyboardRLAgent
  useEffect(() => {
    const preset = DEVICE_PRESETS.find(p => p.id === deviceMode);
    if (preset) {
      spatialAgent.minWeight = preset.minWeight;
      spatialAgent.maxWeight = preset.maxWeight;
      spatialAgent.keys.forEach(k => {
        if (k.type !== 'special') {
          k.weight = Math.max(preset.minWeight, Math.min(preset.maxWeight, k.weight));
        }
      });
      spatialAgent.updateCells();
      setSpatialParams(preset.spatialParams);
    }
  }, [deviceMode, spatialAgent]);

  // ── Memory Persistence (LocalStorage Profiles) ─────────────────────────────────
  // Load profiles and last active state on mount
  useEffect(() => {
    const savedProfiles = localStorage.getItem('a2kl_profiles');
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        setProfiles(parsed);
      } catch (e) { console.error(e); }
    }

    const savedActiveId = localStorage.getItem('a2kl_active_profile');
    if (savedActiveId) {
      setActiveProfileId(savedActiveId);
    }
  }, []);

  // When activeProfileId or profiles finish loading, sync the agent
  useEffect(() => {
    if (activeProfileId) {
      const p = profiles.find(x => x.id === activeProfileId);
      if (p) {
        spatialAgent.loadState(p.data);
        setBackspaceCorrectionCount(spatialAgent.correctionCount);
      }
    } else {
      // No active profile: ensure clean factory state
      spatialAgent.resetLayout();
      spatialAgent.correctionCount = 0;
      setBackspaceCorrectionCount(0);
    }
    // We only want this to run when activeProfileId switches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfileId]);

  // Save state on any RL update
  useEffect(() => {
    if ((stats.totalKeystrokes > 0 || backspaceCorrectionCount > 0) && activeProfileId) {
      const currentData = spatialAgent.exportState();
      setProfiles(prev => {
        const updated = prev.map(p => p.id === activeProfileId ? { ...p, data: currentData, lastUsed: Date.now() } : p);
        localStorage.setItem('a2kl_profiles', JSON.stringify(updated));
        return updated;
      });
    }
  }, [stats.totalKeystrokes, backspaceCorrectionCount, activeProfileId, spatialAgent]);

  const handleResetMemory = () => {
    if (!activeProfileId) return;
    if (window.confirm("Are you sure you want to completely erase THIS profile's adapted muscle memory?")) {
      spatialAgent.resetLayout();
      spatialAgent.correctionCount = 0;
      setBackspaceCorrectionCount(0);
      setStats(DEFAULT_STATS);
      setMetricHistory([]);
      setInputText('');
      setCharIndex(0);
      
      const currentData = spatialAgent.exportState();
      setProfiles(prev => {
        const updated = prev.map(p => p.id === activeProfileId ? { ...p, data: currentData, lastUsed: Date.now() } : p);
        localStorage.setItem('a2kl_profiles', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleSaveAsNewProfile = () => {
    const name = window.prompt("Enter a name for this layout profile (e.g., 'John Fast Mode'):");
    if (!name || name.trim() === '') return;
    
    const newProfile: UserProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      data: spatialAgent.exportState(),
      lastUsed: Date.now()
    };
    
    setProfiles(prev => {
      const updated = [...prev, newProfile];
      localStorage.setItem('a2kl_profiles', JSON.stringify(updated));
      return updated;
    });
    
    setActiveProfileId(newProfile.id);
    localStorage.setItem('a2kl_active_profile', newProfile.id);
  };

  const handleSwitchProfile = (id: string | null) => {
    setActiveProfileId(id);
    if (id) {
      localStorage.setItem('a2kl_active_profile', id);
    } else {
      localStorage.removeItem('a2kl_active_profile');
      spatialAgent.resetLayout();
      setBackspaceCorrectionCount(0);
      setStats(DEFAULT_STATS);
    }
  };
  // ──────────────────────────────────────────────────────────────────────




  // Listen to character index progress and auto-load next phrase for MacKenzie corpus
  useEffect(() => {
    const currentText = selectedTextOption === 'custom' ? customText : targetText;
    if (charIndex > 0 && charIndex >= currentText.length) {
      if (selectedTextOption === 'mackenzie') {
        const nextIdx = (mackenzieIndex + 1) % MACKENZIE_PHRASES.length;
        setMackenzieIndex(nextIdx);
        setTargetText(MACKENZIE_PHRASES[nextIdx]);
        setInputText('');
        setCharIndex(0);
      } else if (selectedTextOption === 'synthetic') {
        setTargetText(generateSyntheticPhrase());
        setInputText('');
        setCharIndex(0);
      } else {
        setIsRunning(false);
      }
    }
  }, [charIndex, targetText, customText, selectedTextOption, mackenzieIndex]);

  // 3. Typing Logic (Process Keystroke)
  const processKeystroke = (targetChar: string, x: number, y: number, manualSwitch = false) => {


    // Determine which key is matched
    const classifiedId = spatialAgent.classifyTouch(x, y);
    const classifiedKey = spatialAgent.keys.find((k) => k.id === classifiedId);

    // Map targets: space is 'space', delete/backspace is 'backspace', otherwise lowercase
    let targetKeyId = targetChar === ' ' ? 'space' : targetChar.toLowerCase();
    
    // Fallbacks for special punctuation
    if (/^[0-9]$/.test(targetKeyId) === false && targetKeyId !== 'space' && targetKeyId !== 'backspace') {
      // If it's punctuation, map to letter keys or skip layout update
      if (SYMBOL_OVERLAYS_REVERSE[targetKeyId]) {
        targetKeyId = SYMBOL_OVERLAYS_REVERSE[targetKeyId];
      }
    }

    const targetKey = spatialAgent.keys.find((k) => k.id === targetKeyId);

    const isCorrect = classifiedId === targetKeyId;

    // A. Update Spatial RL Layout
    if (targetKey && classifiedKey && targetKey.type !== 'special') {
      spatialAgent.updateLayout(
        targetKeyId,
        classifiedId,
        x,
        y,
        stats.totalKeystrokes,
        targetText.slice(0, charIndex)
      );
    }

    // B. Calculate typing time duration for this keystroke
    const simulator = new TyperSimulator(currentProfile);
    const wasDoubleLetter = charIndex > 0 && targetText[charIndex] === targetText[charIndex - 1];
    
    const latency = simulator.calculateKeystrokeLatency(
      isCorrect,
      manualSwitch,
      wasDoubleLetter
    );
    const newSimTime = simulatedTimeMs + latency;
    setSimulatedTimeMs(newSimTime);

    // C. Record Touch Points
    const newTouch: TouchPoint = {
      x,
      y,
      targetKeyId,
      classifiedKeyId: classifiedId,
      timestamp: Date.now(),
      isCorrect,
    };
    
    setRecentTouches((prev) => [...prev.slice(-30), newTouch]);

    // Push to tapHistory ring buffer (used by backspace-as-reward system)
    tapHistoryRef.current = [
      ...tapHistoryRef.current.slice(-49),
      { key: classifiedId, x, y, timestamp: Date.now() },
    ];

    // D. Stats updates
    setStats((prev) => {
      const totalK = prev.totalKeystrokes + 1;
      const correctK = prev.correctKeystrokes + (isCorrect ? 1 : 0);
      const errors = prev.totalErrors + (isCorrect ? 0 : 1);
      const acc = correctK / totalK;

      // WPM = (Keystrokes / 5) / (Minutes)
      const minutes = newSimTime / 60000;
      const wpm = minutes > 0 ? (correctK / 5) / minutes : 0;

      const switchesSaved = prev.switchesSaved ?? 0;
      const manualSwitches = (prev.manualSwitches ?? 0) + (manualSwitch ? 1 : 0);

      return {
        wpm,
        accuracy: acc,
        totalKeystrokes: totalK,
        correctKeystrokes: correctK,
        totalErrors: errors,
        cumulativeReward: spatialAgent.cumulativeReward,
        lastReward: spatialAgent.lastReward,
        meanTdError: spatialAgent.runningTdError,
        criticLoss: spatialAgent.criticLoss,
        switchesSaved,
        manualSwitches,
      };
    });

    // F. Progress text
    setInputText((prev) => prev + targetChar);
    setCharIndex((prev) => prev + 1);

    // G. Append to training history for charting
    setStats((currentStats) => {
      const deviation = calculateMeanLayoutDrift();
      
      setMetricHistory((prevHistory) => {
        const point = {
          wpm: currentStats.wpm,
          errorRate: (currentStats.totalErrors / currentStats.totalKeystrokes) * 100,
          stability: deviation,
          reward: spatialAgent.cumulativeReward,
          tdError: spatialAgent.runningTdError,
          savedSwitches: currentStats.switchesSaved,
        };

        if (prevHistory.length > 40) {
          return [...prevHistory.slice(1), point];
        }
        return [...prevHistory, point];
      });

      return currentStats;
    });
  };

  // Helper mapping symbols back to their parent keys for typing mapping
  const SYMBOL_OVERLAYS_REVERSE: { [sym: string]: string } = {
    '1': 'q', '2': 'w', '3': 'e', '4': 'r', '5': 't', '6': 'y', '7': 'u', '8': 'i', '9': 'o', '0': 'p',
    '@': 'a', '#': 's', '$': 'd', '%': 'f', '&': 'g', '*': 'h', '-': 'j', '+': 'k', '=': 'l',
    '_': 'z', '/': 'x', ':': 'c', ';': 'v', '!': 'b', '?': 'n', ',': 'm',
  };

  // Calculate Mean layout drift/deviation from default centers
  const calculateMeanLayoutDrift = (): number => {
    const activeKeys = spatialAgent.keys.filter((k) => k.type !== 'special');
    let totalDist = 0;
    activeKeys.forEach((key) => {
      const dx = key.currentX - key.defaultX;
      const dy = key.currentY - key.defaultY;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    });
    return totalDist / activeKeys.length;
  };

  const handleAdvancePhrase = () => {
    setInputText('');
    setCharIndex(0);
    if (selectedTextOption === 'mackenzie') {
      const nextIdx = (mackenzieIndex + 1) % MACKENZIE_PHRASES.length;
      setMackenzieIndex(nextIdx);
      setTargetText(MACKENZIE_PHRASES[nextIdx]);
    } else if (selectedTextOption === 'synthetic') {
      setTargetText(generateSyntheticPhrase());
    }
  };

  // 4. Automated Typer Simulation Loop
  useEffect(() => {
    if (!isRunning) return;

    // Check if target text is completed
    const currentText = selectedTextOption === 'custom' ? customText : targetText;
    if (charIndex >= currentText.length) {
      if (selectedTextOption === 'mackenzie') {
        return;
      }
      setIsRunning(false);
      return;
    }

    const nextChar = currentText[charIndex];
    let keyId = nextChar === ' ' ? 'space' : nextChar.toLowerCase();

    const targetKey = spatialAgent.keys.find((k) => k.id === keyId);

    const simulator = new TyperSimulator(currentProfile);

    // Standard keystroke tap
    const executeSimStep = () => {
      let touchTargetKey = targetKey;
      if (!touchTargetKey) {
        touchTargetKey = spatialAgent.keys.find((k) => k.id === 'e')!;
      }
      const touch = simulator.simulateTouch(touchTargetKey);
      processKeystroke(nextChar, touch.x, touch.y, false);
    };

    const intervalTime = Math.max(10, 250 / simSpeed);
    const timer = setTimeout(executeSimStep, intervalTime);
    return () => clearTimeout(timer);
  }, [isRunning, charIndex, targetText, customText, selectedTextOption, simSpeed]);

  // 5. Manual Keyboard Tap Handler
  const handleKeyboardTap = (x: number, y: number) => {
    // If running simulator, ignore manual clicks to prevent index collisions
    if (isRunning) return;

    const classifiedId = spatialAgent.classifyTouch(x, y);

    // Functional Keys Handlers
    if (classifiedId === 'shift') {
      setIsShiftActive(!isShiftActive);
      return;
    }

    if (classifiedId === 'enter') {
      handleAdvancePhrase();
      return;
    }

    if (classifiedId === 'backspace') {
      if (inputText.length > 0) {
        // ── Backspace-as-Negative-Reward ──────────────────────────────────────
        const history = tapHistoryRef.current;
        if (history.length > 0) {
          const lastTap = history[history.length - 1];
          tapHistoryRef.current = history.slice(0, -1);

          // Confidence decays exponentially with time since the tap.
          const deltaMs = Date.now() - lastTap.timestamp;
          const confidence = Math.exp(-1.0 * (deltaMs / 1500));

          // Only fire RL update if backspace happened within 3 seconds (reactive typo)
          if (deltaMs < 3000 && lastTap.key !== 'space' && lastTap.key !== 'shift' && lastTap.key !== 'enter') {
            spatialAgent.applyBackspaceCorrection(lastTap.key, lastTap.x, lastTap.y, confidence);

            // Trigger visual flash on the penalised key
            setCorrectionFlashKey(lastTap.key);
            setTimeout(() => setCorrectionFlashKey(null), 600);

            // Increment UI counter
            setBackspaceCorrectionCount((c) => c + 1);
          }
        }
        // ─────────────────────────────────────────────────────────────────────

        setInputText((prev) => prev.slice(0, -1));
        const isFreeMode = selectedTextOption === 'free';
        if (!isFreeMode) {
          setCharIndex((prev) => Math.max(0, prev - 1));
        }
        setSimulatedTimeMs((prev) => prev + 200);
      }
      return;
    }

    const isFreeMode = selectedTextOption === 'free';
    
    if (!isFreeMode) {
      const currentText = selectedTextOption === 'custom' ? customText : targetText;
      if (charIndex >= currentText.length) return;
      const targetChar = currentText[charIndex];
      processKeystroke(targetChar, x, y, false);
      return;
    }

    // Free Typing Mode Logic (Unsupervised Learning)
    let typedChar = classifiedId;
    if (classifiedId === 'space') {
      typedChar = ' ';
    } else {
      typedChar = isShiftActive ? classifiedId.toUpperCase() : classifiedId.toLowerCase();
      setIsShiftActive(false); // consume shift
    }

    // Apply minor positive RL reward assuming the user tapped correctly
    if (classifiedId !== 'space' && classifiedId !== 'shift' && classifiedId !== 'enter') {
      spatialAgent.updateLayout(classifiedId, classifiedId, x, y, stats.totalKeystrokes, inputText.slice(-2));
    }

    // Record tap for backspace penalty
    tapHistoryRef.current = [
      ...tapHistoryRef.current.slice(-49),
      { key: classifiedId, x, y, timestamp: Date.now() },
    ];

    setInputText((prev) => prev + typedChar);
  };

  // Physical keyboard listener for Studio mode when not in automated simulation
  useEffect(() => {
    if (activeTab !== 'studio' || isRunning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdvancePhrase();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        const bk = spatialAgent.keys.find((k) => k.id === 'backspace');
        handleKeyboardTap(bk ? bk.currentX : 750, bk ? bk.currentY : 305);
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        const sp = spatialAgent.keys.find((k) => k.id === 'space');
        handleKeyboardTap(sp ? sp.currentX : 420, sp ? sp.currentY : 305);
        return;
      }

      const char = e.key.toLowerCase();
      const matched = spatialAgent.keys.find((k) => k.char.toLowerCase() === char && k.type !== 'special');
      if (matched) {
        e.preventDefault();
        const jitterX = (Math.random() - 0.5) * 14;
        const jitterY = (Math.random() - 0.5) * 14;
        handleKeyboardTap(matched.currentX + jitterX, matched.currentY + jitterY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isRunning, charIndex, targetText, customText, selectedTextOption, isShiftActive]);

  // 5.5 Fast Train offline training loop
  const handleFastTrain = (iterations = 250) => {
    setIsRunning(false);

    let activePhrase = selectedTextOption === 'custom' ? customText : targetText;
    if (selectedTextOption === 'mackenzie') {
      activePhrase = targetText;
    }
    if (selectedTextOption === 'synthetic') {
      activePhrase = targetText;
    }
    if (selectedTextOption === 'hybrid') {
      activePhrase = targetText;
    }
    if (!activePhrase || activePhrase.length === 0) return;

    const simulator = new TyperSimulator(currentProfile);

    let tempCharIndex = charIndex;
    let tempTimeMs = simulatedTimeMs;
    let tempInputText = inputText;
    let tempMackenzieIndex = mackenzieIndex;
    
    let totalKeystrokes = stats.totalKeystrokes;
    let correctKeystrokes = stats.correctKeystrokes;
    let totalErrors = stats.totalErrors;
    let switchesSaved = stats.switchesSaved;
    let manualSwitches = stats.manualSwitches;
    
    let tempRecentTouches = [...recentTouches];
    let checkpoints: any[] = [];

    for (let step = 0; step < iterations; step++) {
      // Loop text if completed during training
      if (tempCharIndex >= activePhrase.length) {
        if (selectedTextOption === 'mackenzie') {
          tempMackenzieIndex = (tempMackenzieIndex + 1) % MACKENZIE_PHRASES.length;
          activePhrase = MACKENZIE_PHRASES[tempMackenzieIndex];
          tempInputText = "";
          tempCharIndex = 0;
        } else if (selectedTextOption === 'synthetic') {
          activePhrase = generateSyntheticPhrase();
          tempInputText = "";
          tempCharIndex = 0;

        } else {
          tempCharIndex = 0;
        }
      }

      const char = activePhrase[tempCharIndex];
      let keyId = char === ' ' ? 'space' : char.toLowerCase();
      
      // Align punctuation mapping with processKeystroke
      if (/^[0-9]$/.test(keyId) === false && keyId !== 'space' && keyId !== 'backspace') {
        if (SYMBOL_OVERLAYS_REVERSE[keyId]) {
          keyId = SYMBOL_OVERLAYS_REVERSE[keyId];
        }
      }

      let targetKey = spatialAgent.keys.find((k) => k.id === keyId);
      if (!targetKey) {
        targetKey = spatialAgent.keys.find((k) => k.id === 'e')!;
      }

      const touch = simulator.simulateTouch(targetKey, tempTimeMs);
      const classifiedId = spatialAgent.classifyTouch(touch.x, touch.y, tempInputText);
      const isCorrect = classifiedId === targetKey.id;

      if (targetKey.type !== 'special') {
        spatialAgent.updateLayout(targetKey.id, classifiedId, touch.x, touch.y, totalKeystrokes);
      }

      const wasDouble = tempCharIndex > 0 && activePhrase[tempCharIndex] === activePhrase[tempCharIndex - 1];
      const latency = simulator.calculateKeystrokeLatency(isCorrect, false, wasDouble);
      tempTimeMs += latency;

      tempInputText += char;
      tempCharIndex++;

      totalKeystrokes++;
      if (isCorrect) {
        correctKeystrokes++;
      } else {
        totalErrors++;
      }

      if (step >= iterations - 20) {
        tempRecentTouches.push({
          x: touch.x,
          y: touch.y,
          targetKeyId: targetKey.id,
          classifiedKeyId: classifiedId,
          timestamp: Date.now(),
          isCorrect,
        });
      }

      // Add checkpoint every 10 steps to show training curve progression
      if (step % 10 === 0 || step === iterations - 1) {
        const minutes = tempTimeMs / 60000;
        const currentWpm = minutes > 0 ? (correctKeystrokes / 5) / minutes : 0;
        const currentErrorRate = (totalErrors / totalKeystrokes) * 100;
        const deviation = calculateMeanLayoutDrift();
        
        checkpoints.push({
          wpm: currentWpm,
          errorRate: currentErrorRate,
          stability: deviation,
          reward: spatialAgent.cumulativeReward,
          tdError: spatialAgent.runningTdError,
          savedSwitches: switchesSaved,
        });
      }
    }



    setCharIndex(tempCharIndex);
    setSimulatedTimeMs(tempTimeMs);
    setInputText(tempInputText);
    setTargetText(activePhrase);
    setRecentTouches(tempRecentTouches.slice(-30));
    if (selectedTextOption === 'mackenzie') {
      setMackenzieIndex(tempMackenzieIndex);
    }

    const finalStats: TypingStats = {
      wpm: checkpoints[checkpoints.length - 1].wpm,
      accuracy: correctKeystrokes / totalKeystrokes,
      totalKeystrokes,
      correctKeystrokes,
      totalErrors,
      cumulativeReward: spatialAgent.cumulativeReward,
      lastReward: spatialAgent.lastReward,
      meanTdError: spatialAgent.runningTdError,
      criticLoss: spatialAgent.criticLoss,
      switchesSaved,
      manualSwitches,
    };
    setStats(finalStats);
    setMetricHistory((prev) => [...prev, ...checkpoints]);
  };

  // 6. Reset Functions
  const handleReset = () => {
    setIsRunning(false);
    spatialAgent.resetLayout();
    setInputText('');
    setCharIndex(0);
    setRecentTouches([]);
    setStats(DEFAULT_STATS);
    setMetricHistory([]);
    setSimulatedTimeMs(0);
    setMackenzieIndex(0);
    // Reset backspace-as-reward system
    tapHistoryRef.current = [];
    setBackspaceCorrectionCount(0);
    setCorrectionFlashKey(null);
    if (selectedTextOption === 'mackenzie') {
      setTargetText(MACKENZIE_PHRASES[0]);
    } else if (selectedTextOption === 'synthetic') {
      setTargetText(generateSyntheticPhrase());
    }
  };


  const handleResetParams = () => {
    setSpatialParams(DEFAULT_SPATIAL_PARAMS);
  };

  const handleTextChange = (text: string) => {
    setSelectedTextOption(text);
    if (text === 'mackenzie') {
      setMackenzieIndex(0);
      setTargetText(MACKENZIE_PHRASES[0]);
    } else if (text === 'synthetic') {
      setTargetText(generateSyntheticPhrase());
    } else if (text !== 'custom') {
      setTargetText(text);
    }
    handleReset();
  };



  const activeTestText = selectedTextOption === 'custom' ? customText : targetText;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Premium Header Banner */}
      <header className="flex justify-between items-center py-2 px-3 sm:py-3 sm:px-6 bg-slate-950/80 border-b border-slate-900 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="p-1.5 sm:p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-lg sm:rounded-xl shadow-lg shadow-purple-500/20 text-white shrink-0">
            <KeyboardIcon size={18} className="sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2 truncate">
              <span>Adaptive Keyboard Lab</span>
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-mono font-normal tracking-wide px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                RL
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium hidden md:block">
              Reinforcement Learning Virtual Layout Optimization & Bayesian Touch Decoding
            </p>
          </div>
        </div>

        {/* Tab Switcher & Status */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="tab-switcher-box">
            <button
              onClick={() => setActiveTab('studio')}
              className={`tab-nav-btn ${activeTab === 'studio' ? 'active-studio' : ''} text-xs py-1 px-2 sm:px-3`}
            >
              <FlaskConical size={13} />
              <span className="hidden sm:inline">RL Lab & Studio</span>
              <span className="sm:hidden">Studio</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('whatsapp');
                setDeviceMode('mobile');
              }}
              className={`tab-nav-btn ${activeTab === 'whatsapp' ? 'active-whatsapp' : ''} text-xs py-1 px-2 sm:px-3`}
            >
              <MessageCircle size={13} />
              <span>WhatsApp</span>
              <span className="tab-nav-badge hidden sm:inline">
                Phone
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="dot dot-green"></span>
            <span className="text-[11px] font-semibold text-emerald-400 font-mono">
              RL CONVERGING
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'whatsapp' ? (
        /* ==============================================================
           TAB 2: DEDICATED WHATSAPP MESSENGER SIMULATOR (PHONE LAYOUT)
           ============================================================== */
        <main className="flex-1 w-full max-w-7xl mx-auto px-0 sm:px-4 py-0 sm:py-6">
          <div className="mb-4 text-center wa-intro-banner">
            <h2 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <MessageCircle size={18} className="text-[#25d366]" /> WhatsApp Live Typing Testbed
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto mt-0.5">
              Default Smartphone Enclosure • Test natural conversational typing. The RL agent adapts key centroids and weights to eliminate finger typos in real time.
            </p>
          </div>

          <WhatsAppChat
            agent={spatialAgent}
            stats={stats}
            recentTouches={recentTouches}
            correctionFlashKey={correctionFlashKey}
            backspaceCorrectionCount={backspaceCorrectionCount}
            onResetLayout={handleReset}
            showVoronoi={showVoronoi}
            onToggleVoronoi={() => setShowVoronoi(!showVoronoi)}
            rlAlgorithm={rlAlgorithm}
            onAlgorithmChange={handleAlgorithmChange}
          />
        </main>
      ) : (
        /* ==============================================================
           TAB 1: RL LAB & BENCHMARK STUDIO (3 HARDWARE LAYOUT MODES)
           ============================================================== */
        <main className="dashboard-grid flex-1 p-6 max-w-7xl mx-auto w-full">
          {/* Left Side: Hardware Chassis & Interactive Keyboard */}
          <div className="flex flex-col gap-5 w-full items-center">
            {/* Top Toolbar: User Profiles & Device Layout Selector */}
            <div className="profile-toolbar">
              {/* RL Algorithm Engine Selector Dropdown Box */}
              <div className="profile-group">
                <div className="profile-label">
                  <Cpu size={14} className="text-cyan-400" /> RL Engine:
                </div>
                <select
                  className="profile-select"
                  value={rlAlgorithm}
                  onChange={(e) => handleAlgorithmChange(e.target.value as RLAlgorithmType)}
                  title="Switch Reinforcement Learning Algorithm Engine"
                >
                  <option value="actor-critic">Option 1: Actor-Critic (A2C Advantage PG)</option>
                  <option value="dqn">Option 2: Deep Q-Network (DQN Replay)</option>
                  <option value="ppo">Option 3: Proximal Policy Opt (PPO Clipped)</option>
                </select>
              </div>

              {/* User Profiles */}
              <div className="profile-group">
                <div className="profile-label">
                  <Users size={14} className="text-purple-400" /> Profile:
                </div>
                <select
                  className="profile-select"
                  value={activeProfileId || ''}
                  onChange={(e) => handleSwitchProfile(e.target.value === '' ? null : e.target.value)}
                >
                  <option value="">Default Keyboard (No Profile)</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleSaveAsNewProfile}
                  className="btn-profile-save"
                  title="Save current layout weights as a new profile"
                >
                  <Save size={13} /> Save As
                </button>
                {activeProfileId && (
                  <button
                    onClick={handleResetMemory}
                    className="btn-profile-reset"
                    title="Reset active profile adapted layout"
                  >
                    <RotateCcw size={13} /> Reset Profile
                  </button>
                )}
              </div>

              {/* Three Defined Hardware Layout Modes Switcher */}
              <div className="hw-switcher-wrapper">
                <span className="profile-label">
                  Hardware Layout:
                </span>
                <div className="hw-switcher-box">
                  {DEVICE_PRESETS.map((preset) => {
                    const isActive = deviceMode === preset.id;
                    let Icon = LaptopIcon;
                    if (preset.id === 'tablet') Icon = Tablet;
                    if (preset.id === 'mobile') Icon = Smartphone;

                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setDeviceMode(preset.id);
                          handleReset();
                        }}
                        className={`hw-btn ${isActive ? 'active' : ''}`}
                        title={preset.name}
                      >
                        <Icon size={14} />
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── 1. LAPTOP HARDWARE CHASSIS ── */}
            {deviceMode === 'laptop' && (
              <div className="device-chassis-laptop w-full">
                {/* Laptop Screen Lid Header */}
                <div className="laptop-lid-header">
                  <div className="laptop-camera-notch">
                    <span className="laptop-webcam-dot" title="Webcam sensor"></span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Laptop Deck • 1000×350px Viewport • Wide Key Hitbox • α = 0.20
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                    Max Weight: 8000 • Desktop Ergonomics
                  </div>
                </div>

                {/* Target Script Monitor */}
                <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 font-mono text-base relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1 text-[11px] text-slate-400 font-sans">
                    <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-purple-400">
                      <Sparkles size={13} /> Mackenzie Script Monitor
                    </span>
                    <span>
                      Char: {charIndex} / {activeTestText.length}
                    </span>
                  </div>
                  <div className="leading-relaxed">
                    <span className="text-slate-500">{inputText}</span>
                    {charIndex < activeTestText.length && (
                      <span className="bg-purple-600/40 text-white border-b-2 border-purple-400 px-0.5 animate-pulse">
                        {activeTestText[charIndex] === ' ' ? '⎵' : activeTestText[charIndex]}
                      </span>
                    )}
                    <span className="text-slate-400">{activeTestText.slice(charIndex + 1)}</span>
                  </div>
                </div>

                {/* Recessed Keyboard Deck */}
                <div className="laptop-keyboard-deck">
                  <Keyboard
                    agent={spatialAgent}
                    recentTouches={recentTouches}
                    showVoronoi={showVoronoi}
                    showVectors={showVectors}
                    showTouches={showTouches}
                    showOverlays={showOverlays}
                    isSmoothingEnabled={isSmoothingEnabled}
                    onKeyTap={handleKeyboardTap}
                    isShiftActive={isShiftActive}
                    correctionFlashKey={correctionFlashKey}
                  />
                </div>

                {/* Palm Rest & Trackpad Outline */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <div className="laptop-trackpad" title="Multitouch Trackpad Area"></div>
                  <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
                    Precision Force Trackpad
                  </span>
                </div>
              </div>
            )}

            {/* ── 2. TABLET HARDWARE CHASSIS ── */}
            {deviceMode === 'tablet' && (
              <div className="device-chassis-tablet w-full">
                {/* Front Camera Dot */}
                <div className="tablet-camera-notch" title="Tablet Center Camera"></div>

                <div className="flex justify-between items-center px-1 text-[11px] font-mono text-slate-400">
                  <span>iPad Pro 11″ / Tablet Landscape • 740px Viewport</span>
                  <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    Balanced Touch Geometry • α = 0.15
                  </span>
                </div>

                {/* Target Script Monitor */}
                <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 font-mono text-base relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1 text-[11px] text-slate-400 font-sans">
                    <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-purple-400">
                      <Sparkles size={13} /> Tablet Script Monitor
                    </span>
                    <span>
                      Char: {charIndex} / {activeTestText.length}
                    </span>
                  </div>
                  <div className="leading-relaxed">
                    <span className="text-slate-500">{inputText}</span>
                    {charIndex < activeTestText.length && (
                      <span className="bg-purple-600/40 text-white border-b-2 border-purple-400 px-0.5 animate-pulse">
                        {activeTestText[charIndex] === ' ' ? '⎵' : activeTestText[charIndex]}
                      </span>
                    )}
                    <span className="text-slate-400">{activeTestText.slice(charIndex + 1)}</span>
                  </div>
                </div>

                {/* Tablet Keyboard */}
                <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <Keyboard
                    agent={spatialAgent}
                    recentTouches={recentTouches}
                    showVoronoi={showVoronoi}
                    showVectors={showVectors}
                    showTouches={showTouches}
                    showOverlays={showOverlays}
                    isSmoothingEnabled={isSmoothingEnabled}
                    onKeyTap={handleKeyboardTap}
                    isShiftActive={isShiftActive}
                    correctionFlashKey={correctionFlashKey}
                  />
                </div>
              </div>
            )}

            {/* ── 3. PHONE HARDWARE CHASSIS ── */}
            {deviceMode === 'mobile' && (
              <div className="device-chassis-phone w-full">
                {/* Dynamic Island Pill */}
                <div className="flex justify-center w-full">
                  <div className="wa-dynamic-island">
                    <span className="wa-island-dot"></span>
                  </div>
                </div>

                <div className="flex justify-between items-center px-1 text-[11px] font-mono text-slate-400">
                  <span>Smartphone 6.1″ Portrait • 410px Viewport</span>
                  <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 text-[10px]">
                    Thumb Hitbox • α = 0.08
                  </span>
                </div>

                {/* Target Script Monitor */}
                <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 font-mono text-sm relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1 text-[10px] text-slate-400 font-sans">
                    <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-purple-400">
                      <Sparkles size={12} /> Mobile Script Monitor
                    </span>
                    <span>
                      {charIndex} / {activeTestText.length}
                    </span>
                  </div>
                  <div className="leading-relaxed">
                    <span className="text-slate-500">{inputText}</span>
                    {charIndex < activeTestText.length && (
                      <span className="bg-purple-600/40 text-white border-b-2 border-purple-400 px-0.5 animate-pulse">
                        {activeTestText[charIndex] === ' ' ? '⎵' : activeTestText[charIndex]}
                      </span>
                    )}
                    <span className="text-slate-400">{activeTestText.slice(charIndex + 1)}</span>
                  </div>
                </div>

                {/* Phone Keyboard Canvas */}
                <div className="p-1.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                  <Keyboard
                    agent={spatialAgent}
                    recentTouches={recentTouches}
                    showVoronoi={showVoronoi}
                    showVectors={showVectors}
                    showTouches={showTouches}
                    showOverlays={showOverlays}
                    isSmoothingEnabled={isSmoothingEnabled}
                    onKeyTap={handleKeyboardTap}
                    isShiftActive={isShiftActive}
                    correctionFlashKey={correctionFlashKey}
                  />
                </div>

                {/* Home Indicator Swipe Bar */}
                <div className="wa-home-bar">
                  <div></div>
                </div>
              </div>
            )}

            {/* Canvas Display View Options */}
            <div className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex-wrap gap-2">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Visualization Layers:
              </span>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white" title="Smoothens high-frequency tremor coordinates">
                  <input
                    type="checkbox"
                    checked={isSmoothingEnabled}
                    onChange={(e) => setIsSmoothingEnabled(e.target.checked)}
                    className="accent-purple-600 w-3 h-3"
                  />
                  Tremor Filter
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={showVoronoi}
                    onChange={(e) => setShowVoronoi(e.target.checked)}
                    className="accent-purple-600 w-3 h-3"
                  />
                  Voronoi Cells
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={showVectors}
                    onChange={(e) => setShowVectors(e.target.checked)}
                    className="accent-purple-600 w-3 h-3"
                  />
                  Drift Vectors
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={showTouches}
                    onChange={(e) => setShowTouches(e.target.checked)}
                    className="accent-purple-600 w-3 h-3"
                  />
                  Touch Scatter
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white" title="Display secondary symbol hints on keys">
                  <input
                    type="checkbox"
                    checked={showOverlays}
                    onChange={(e) => setShowOverlays(e.target.checked)}
                    className="accent-purple-600 w-3 h-3"
                  />
                  Symbol Badges
                </label>
              </div>
            </div>
          </div>

          {/* Right Side: Simulation & Parameter Consoles */}
          <div className="flex flex-col gap-6 w-full">
            {/* Analytics Panel with Live Convergence Curves */}
            <Analytics stats={stats} history={metricHistory} rlAlgorithm={rlAlgorithm} />

            {/* Backspace Correction Counter */}
            {backspaceCorrectionCount > 0 && (
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-950/30 border border-red-800/30 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                <span className="text-red-300 font-semibold font-mono">
                  {backspaceCorrectionCount} Backspace Correction{backspaceCorrectionCount !== 1 ? 's' : ''}
                </span>
                <span className="text-red-500 ml-auto font-mono text-[11px]">
                  RL Anti-Gradient ⊖ Active
                </span>
              </div>
            )}

            {/* Simulation Controller */}
            <SimulationControls
              currentProfile={currentProfile}
              onProfileChange={(prof) => {
                setCurrentProfile(prof);
                handleReset();
              }}
              isRunning={isRunning}
              onToggleStartPause={() => setIsRunning(!isRunning)}
              onReset={handleReset}
              onFastTrain={handleFastTrain}
              simSpeed={simSpeed}
              onSpeedChange={setSimSpeed}
              selectedText={selectedTextOption}
              onTextChange={handleTextChange}
              customText={customText}
              onCustomTextChange={(t) => {
                setCustomText(t);
                handleReset();
              }}
              rlAlgorithm={rlAlgorithm}
              onAlgorithmChange={handleAlgorithmChange}
            />

            {/* Hyperparameter Configurator */}
            <ConfigPanel
              spatialParams={spatialParams}
              onSpatialParamsChange={setSpatialParams}
              onResetToDefaults={handleResetParams}
              rlAlgorithm={rlAlgorithm}
              onAlgorithmChange={handleAlgorithmChange}
            />
          </div>
        </main>
      )}
    </div>
  );
}
