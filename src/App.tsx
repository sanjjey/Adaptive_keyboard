import { useState, useEffect, useRef } from 'react';
import { Keyboard } from './components/Keyboard';
import { SimulationControls } from './components/SimulationControls';
import { ConfigPanel } from './components/ConfigPanel';
import { Analytics } from './components/Analytics';
import { KeyboardRLAgent } from './rl/KeyboardRLAgent';
import { TyperSimulator } from './rl/TyperSimulator';
import type { RLParams, TouchPoint, TypingStats, TyperProfile } from './rl/types';
import { PRESETS } from './rl/TyperSimulator';
import { Keyboard as KeyboardIcon, HelpCircle, Sparkles, Smartphone, Tablet, Laptop as LaptopIcon, RotateCcw, Save, Users } from 'lucide-react';

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

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    sender: 'bot',
    text: 'Hello! Focus the chat input field below and start typing to test the adaptive virtual keyboard.',
    timestamp: '12:00 PM',
  },
  {
    id: '2',
    sender: 'bot',
    text: "As you type, my Bayesian Touch Decoder will dynamically warp and shift the key boundaries to correct your typos. Press 'Send' to submit your message!",
    timestamp: '12:01 PM',
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
  
  // History of stats points for charting
  const [metricHistory, setMetricHistory] = useState<any[]>([]);

  // Keyboard render switches
  const [showVoronoi, setShowVoronoi] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showTouches, setShowTouches] = useState(true);
  const [showOverlays, _setShowOverlays] = useState(false);
  const [isSmoothingEnabled, setIsSmoothingEnabled] = useState(false);

  const [deviceMode, setDeviceMode] = useState<'mobile' | 'tablet' | 'laptop'>('laptop');
  const [isProductDemo, setIsProductDemo] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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




  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Auto-open keyboard if simulator runs in Product Demo mode
  useEffect(() => {
    if (isRunning && isProductDemo) {
      setIsKeyboardVisible(true);
    }
  }, [isRunning, isProductDemo]);

  // Listen to character index progress and auto-load next phrase for MacKenzie corpus
  useEffect(() => {
    const currentText = selectedTextOption === 'custom' ? customText : targetText;
    if (charIndex > 0 && charIndex >= currentText.length) {
      if (isProductDemo) {
        handleSendMessage();
      } else {
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
    }
  }, [charIndex, targetText, customText, selectedTextOption, mackenzieIndex, isProductDemo]);

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
      spatialAgent.updateLayout(targetKeyId, classifiedId, x, y, stats.totalKeystrokes);
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

      const switchesSaved = prev.switchesSaved;
      const manualSwitches = prev.manualSwitches + (manualSwitch ? 1 : 0);

      return {
        wpm,
        accuracy: acc,
        totalKeystrokes: totalK,
        correctKeystrokes: correctK,
        totalErrors: errors,
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
        // Record data point every few keystrokes or every step to avoid crowding
        if (prevHistory.length > 40) {
          return [
            ...prevHistory.slice(1),
            {
              wpm: currentStats.wpm,
              errorRate: (currentStats.totalErrors / currentStats.totalKeystrokes) * 100,
              stability: deviation,
              savedSwitches: currentStats.switchesSaved,
            },
          ];
        }
        return [
          ...prevHistory,
          {
            wpm: currentStats.wpm,
            errorRate: (currentStats.totalErrors / currentStats.totalKeystrokes) * 100,
            stability: deviation,
            savedSwitches: currentStats.switchesSaved,
          },
        ];
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

  const handleSendMessage = () => {
    const isFreeMode = selectedTextOption === 'free' || isProductDemo;
    if (!isFreeMode) {
      const currentText = selectedTextOption === 'custom' ? customText : targetText;
      if (charIndex < currentText.length) return;
    } else {
      if (inputText.trim().length === 0) return;
    }

    const userMessageText = inputText;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessageText,
      timestamp: timeStr,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setCharIndex(0);

    // Update phrase instantly so the simulation can keep typing without interruption
    let nextPhrase = '';
    if (selectedTextOption === 'mackenzie') {
      const nextIdx = (mackenzieIndex + 1) % MACKENZIE_PHRASES.length;
      setMackenzieIndex(nextIdx);
      nextPhrase = MACKENZIE_PHRASES[nextIdx];
      setTargetText(nextPhrase);
    } else if (selectedTextOption === 'synthetic') {
      nextPhrase = generateSyntheticPhrase();
      setTargetText(nextPhrase);

    } else if (!isFreeMode) {
      nextPhrase = selectedTextOption === 'custom' ? customText : targetText;
      setTargetText(nextPhrase);
    }

    // Chatbot response
    if (!isFreeMode) {
      setTimeout(() => {
        const drift = calculateMeanLayoutDrift();
        const botResponse = `Calibration successful! Current mean spatial key layout drift is ${drift.toFixed(1)}px. Keep typing to lock in muscle memory! Next phrase is loaded.`;
        
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setChatMessages((prev) => [...prev, botMsg]);
      }, 1000);
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
      handleSendMessage();
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
        const isFreeMode = selectedTextOption === 'free' || isProductDemo;
        if (!isFreeMode) {
          setCharIndex((prev) => Math.max(0, prev - 1));
        }
        setSimulatedTimeMs((prev) => prev + 200);
      }
      return;
    }

    const isFreeMode = selectedTextOption === 'free' || isProductDemo;
    
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
      spatialAgent.updateLayout(classifiedId, classifiedId, x, y, stats.totalKeystrokes);
    }

    // Record tap for backspace penalty
    tapHistoryRef.current = [
      ...tapHistoryRef.current.slice(-49),
      { key: classifiedId, x, y, timestamp: Date.now() },
    ];

    setInputText((prev) => prev + typedChar);
  };

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
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20 text-white">
            <KeyboardIcon size={24} />
          </div>
          <div>
            <h1>Antigravity Adaptive Keyboard Lab <span className="text-xs font-mono font-normal tracking-wide px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 ml-2">A2KL v1.0</span></h1>
            <p className="text-xs text-slate-500 font-medium">Research Sandbox for Reinforcement Learning Virtual Layout Optimization</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsProductDemo((prev) => {
                const nextVal = !prev;
                if (nextVal) {
                  setIsKeyboardVisible(false);
                }
                return nextVal;
              });
              handleReset();
            }}
            className="btn btn-primary py-1.5 px-4 text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2"
          >
            <Sparkles size={13} />
            {isProductDemo ? "Switch to Research Lab" : "Switch to Product Chat Demo"}
          </button>
          <div className="flex items-center gap-2">
            <span className="dot dot-green"></span>
            <span className="text-xs font-semibold text-slate-400 font-mono">AGENT CONVERGING</span>
          </div>
        </div>
      </header>

      {/* Main Sandbox Grid */}
      <div className={isProductDemo ? "flex flex-col flex-1 items-center pt-8 w-full max-w-[100vw] overflow-x-hidden" : "dashboard-grid flex-1"}>
        {/* Left Side: Keyboard Canvas & Interactive Console */}
        <div className="flex flex-col gap-6 w-full items-center">
          {isProductDemo ? (
            /* ===== PRODUCT DEMO VIEW: Authentic WhatsApp-style Chat ===== */
            <div className="flex flex-col gap-4 w-full items-center">
              {/* Profile & Device Manager Toolbar */}
              <div className="flex items-center justify-between gap-4 px-4 py-3 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md w-full max-w-[600px] flex-wrap">
                
                {/* Profiles */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Users size={14} className="text-blue-400" /> User
                  </div>
                  <select 
                    className="bg-slate-950/50 border border-slate-700/50 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                    value={activeProfileId || ''}
                    onChange={(e) => handleSwitchProfile(e.target.value === '' ? null : e.target.value)}
                  >
                    <option value="">Normal Keyboard (No Profile)</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleSaveAsNewProfile}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2 py-1.5 rounded-lg transition-all"
                    title="Save current layout as a new profile"
                  >
                    <Save size={12} /> Save As
                  </button>
                </div>

                {/* Device selector */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 bg-slate-950/50 p-1 rounded-lg border border-slate-800/50">
                    {DEVICE_PRESETS.map((preset) => {
                      const isActive = deviceMode === preset.id;
                      let Icon = LaptopIcon;
                      if (preset.id === 'mobile') Icon = Smartphone;
                      if (preset.id === 'tablet') Icon = Tablet;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => { setDeviceMode(preset.id); handleReset(); }}
                          className={`flex items-center justify-center p-1.5 rounded-md transition-all ${
                            isActive
                              ? 'bg-purple-500/20 text-purple-400 shadow-sm'
                              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                          }`}
                          title={preset.name}
                        >
                          <Icon size={14} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Device outer shell */}
              <div className="flex justify-center w-full">
                <div className={`wa-device-shell device-frame-${deviceMode}`}>

                  {/* ── Phone top bar ── */}
                  {deviceMode === 'mobile' && (
                    <div className="wa-status-bar">
                      <span className="wa-status-time">9:41</span>
                      <div className="wa-status-icons">
                        <svg width="15" height="10" viewBox="0 0 15 10" fill="currentColor"><rect x="0" y="3" width="3" height="7" rx="0.5"/><rect x="4" y="2" width="3" height="8" rx="0.5"/><rect x="8" y="0.5" width="3" height="9.5" rx="0.5"/><rect x="12" y="0" width="3" height="10" rx="0.5" opacity="0.3"/></svg>
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor"><path d="M7 2.2C9.9 2.2 12.5 3.6 14 5.8L12.6 7.1C11.4 5.4 9.3 4.2 7 4.2S2.6 5.4 1.4 7.1L0 5.8C1.5 3.6 4.1 2.2 7 2.2Z"/><path d="M7 5.5C8.7 5.5 10.2 6.4 11.1 7.7L9.7 9C9 8.1 8.1 7.5 7 7.5S5 8.1 4.3 9L2.9 7.7C3.8 6.4 5.3 5.5 7 5.5Z"/><circle cx="7" cy="10.5" r="1.5"/></svg>
                        <svg width="25" height="12" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35"/><rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor"/><path d="M23 4.5V7.5A2 2 0 0 0 23 4.5Z" fill="currentColor" fillOpacity="0.4"/></svg>
                      </div>
                    </div>
                  )}

                  {/* ── WhatsApp-style chat header ── */}
                  <div className="wa-chat-header">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Back arrow */}
                      <svg width="10" height="16" viewBox="0 0 10 16" fill="none" className="flex-shrink-0 opacity-80">
                        <path d="M9 1L2 8L9 15" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {/* Avatar */}
                      <div className="wa-avatar">
                        <span>A2</span>
                      </div>
                      {/* Contact info */}
                      <div className="min-w-0 flex-1">
                        <div className="wa-contact-name">A2KL Adaptive Agent</div>
                        <div className="wa-contact-status">
                          <span className="wa-online-dot"></span>
                          online
                        </div>
                      </div>
                    </div>
                    {/* Header icons */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {activeProfileId && (
                        <button onClick={handleResetMemory} title="Reset This Profile's Memory" className="hover:opacity-70 transition-opacity flex items-center justify-center">
                          <RotateCcw size={18} color="white" opacity="0.9" />
                        </button>
                      )}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.9"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.9"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                    </div>
                  </div>

                  {/* ── Chat wallpaper + messages ── */}
                  <div className="wa-chat-body">
                    {/* Date chip */}
                    <div className="wa-date-chip">TODAY</div>

                    {/* Messages */}
                    {chatMessages.map((msg, idx) => (
                      <div key={msg.id} className={`wa-msg-row ${msg.sender}`}>
                        <div className={`wa-bubble ${msg.sender}`}>
                          {msg.sender === 'bot' && idx === 0 && (
                            <div className="wa-bubble-sender">A2KL Agent</div>
                          )}
                          <div className="wa-bubble-text">{msg.text}</div>
                          <div className="wa-bubble-meta">
                            <span className="wa-bubble-time">{msg.timestamp}</span>
                            {msg.sender === 'user' && (
                              <svg width="14" height="10" viewBox="0 0 16 11" className="wa-tick ml-0.5">
                                <path d="M1 6L5 10L11 1" stroke="#53bdeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                <path d="M5 6L9 10L15 1" stroke="#53bdeb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator when simulator is running */}
                    {isRunning && (
                      <div className="wa-msg-row bot">
                        <div className="wa-bubble bot wa-typing-bubble">
                          <span></span><span></span><span></span>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* ── Input area ── */}
                  <div className="wa-input-area">
                    {/* Text input pill */}
                    <div
                      className="wa-input-pill"
                      onClick={() => setIsKeyboardVisible(true)}
                    >
                      {/* Emoji icon */}
                      <svg width="22" height="22" viewBox="0 0 24 24" className="wa-input-icon" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                        <circle cx="9" cy="10" r="1.2" fill="currentColor"/>
                        <circle cx="15" cy="10" r="1.2" fill="currentColor"/>
                      </svg>
                      {/* Live typing preview */}
                      <div className="wa-input-text flex-1 overflow-hidden">
                        {inputText || charIndex < activeTestText.length ? (
                          <span className="wa-typed-text">
                            {inputText}
                            {charIndex < activeTestText.length && (
                              <span className="wa-cursor-char">
                                {activeTestText[charIndex] === ' ' ? '\u00A0' : activeTestText[charIndex]}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="wa-placeholder">Type a message</span>
                        )}
                      </div>
                      {/* Attachment icon */}
                      <svg width="22" height="22" viewBox="0 0 24 24" className="wa-input-icon" fill="none">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {/* Camera icon */}
                      <svg width="22" height="22" viewBox="0 0 24 24" className="wa-input-icon" fill="none">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.7"/>
                      </svg>
                    </div>

                    {/* Send / Mic button */}
                    <button
                      onClick={charIndex >= activeTestText.length ? handleSendMessage : () => setIsKeyboardVisible(true)}
                      className="wa-send-btn"
                    >
                      {charIndex >= activeTestText.length ? (
                        /* Paper airplane send icon */
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                      ) : (
                        /* Mic icon */
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="9" y="2" width="6" height="11" rx="3" fill="white"/>
                          <path d="M5 10a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* ── Slide-up Adaptive Keyboard ── */}
                  <div className={`wa-keyboard-drawer ${isKeyboardVisible ? 'open' : 'closed'}`}>
                    {/* Tiny drag handle */}
                    <div className="wa-keyboard-handle" onClick={() => setIsKeyboardVisible(false)}>
                      <div className="wa-handle-bar"></div>
                    </div>
                    {/* Keyboard label bar */}
                    <div className="wa-keyboard-topbar">
                      <span className="wa-keyboard-label">
                        <span className="wa-kb-dot"></span>
                        A2KL Adaptive Keyboard
                      </span>
                      <div className="flex gap-3 text-[10px] text-slate-500">
                        <label className="flex items-center gap-1 cursor-pointer hover:text-slate-300">
                          <input type="checkbox" checked={showVoronoi} onChange={(e) => setShowVoronoi(e.target.checked)} className="accent-purple-600 w-2.5 h-2.5" /> Cells
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer hover:text-slate-300">
                          <input type="checkbox" checked={showVectors} onChange={(e) => setShowVectors(e.target.checked)} className="accent-purple-600 w-2.5 h-2.5" /> Drift
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer hover:text-slate-300">
                          <input type="checkbox" checked={isSmoothingEnabled} onChange={(e) => setIsSmoothingEnabled(e.target.checked)} className="accent-purple-600 w-2.5 h-2.5" /> Filter
                        </label>
                      </div>
                    </div>
                    {/* The actual SVG keyboard */}
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
                    {/* Home indicator */}
                    <div className="wa-home-bar"><div></div></div>
                  </div>

                  {/* phone bottom bar */}
                  {deviceMode === 'mobile' && !isKeyboardVisible && (
                    <div className="wa-home-indicator-outer"><div></div></div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Research Lab View (Default View) */
            <>
              {/* Target Text Display Console */}
              <div className="glass-panel card flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                    <Sparkles size={14} className="text-purple-400" /> Target Script Monitor
                  </span>
                  <span className="text-xs font-mono text-purple-400">
                    Index: {charIndex} / {activeTestText.length} chars
                  </span>
                </div>

                {/* Target script window */}
                <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-900 leading-relaxed text-lg font-mono relative overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-purple-500"></div>
                  {/* Highlight typed vs remaining */}
                  <span className="text-slate-500">{inputText}</span>
                  {charIndex < activeTestText.length && (
                    <span
                      className="bg-purple-600/30 text-white border-b-2 border-purple-400 px-0.5 animate-pulse"
                      style={{ textShadow: '0 0 8px var(--accent-purple)' }}
                    >
                      {activeTestText[charIndex] === ' ' ? '⎵' : activeTestText[charIndex]}
                    </span>
                  )}
                  <span className="text-slate-400">{activeTestText.slice(charIndex + 1)}</span>
                </div>

                {/* Tip overlay */}
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/30 p-2.5 rounded-lg border border-slate-900/60">
                  <HelpCircle size={14} className="text-slate-400" />
                  <span>
                    {isRunning
                      ? 'Simulation is running. Watch how the key boundaries expand or shift dynamically.'
                      : 'Click keys on the layout below to manually type. Use "123" to toggle layout, and "⌫" to correct typos.'}
                  </span>
                </div>
              </div>

              {/* Interactive Keyboard Container */}
              <div className="glass-panel card flex flex-col gap-4">
                <div className="keyboard-header">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                    Virtual Keyboard Canvas
                  </span>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white" title="Smoothens high-frequency muscle spasms using centroid trajectory averaging">
                      <input
                        type="checkbox"
                        checked={isSmoothingEnabled}
                        onChange={(e) => setIsSmoothingEnabled(e.target.checked)}
                        className="accent-purple-600"
                      />
                      Tremor Filter
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white">
                      <input
                        type="checkbox"
                        checked={showVoronoi}
                        onChange={(e) => setShowVoronoi(e.target.checked)}
                        className="accent-purple-600"
                      />
                      Show Voronoi Cells
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white">
                      <input
                        type="checkbox"
                        checked={showVectors}
                        onChange={(e) => setShowVectors(e.target.checked)}
                        className="accent-purple-600"
                      />
                      Drift Vectors
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white">
                      <input
                        type="checkbox"
                        checked={showTouches}
                        onChange={(e) => setShowTouches(e.target.checked)}
                        className="accent-purple-600"
                      />
                      Touch Scatter
                    </label>
                  </div>
                </div>

                {/* Device Mode Selector Toolbar */}
                <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 flex-wrap gap-2">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase ml-1 flex items-center gap-1.5">
                    <KeyboardIcon size={14} className="text-purple-400" /> Device Target Preset
                  </span>
                  <div className="flex gap-2">
                    {DEVICE_PRESETS.map((preset) => {
                      const isActive = deviceMode === preset.id;
                      let Icon = LaptopIcon;
                      if (preset.id === 'mobile') Icon = Smartphone;
                      if (preset.id === 'tablet') Icon = Tablet;

                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            setDeviceMode(preset.id);
                            handleReset();
                          }}
                          className={`btn py-1.5 px-3.5 text-xs rounded-lg border font-medium transition-all ${
                            isActive
                              ? 'bg-purple-600/10 text-purple-400 border-purple-500/30 shadow-lg shadow-purple-500/5'
                              : 'bg-slate-900/40 text-slate-500 border-slate-800/80 hover:text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <Icon size={13} />
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Simulated Device Frame Wrapper */}
                <div className="flex justify-center w-full py-4 bg-slate-950/30 rounded-2xl border border-slate-900/60 overflow-hidden">
                  <div className={`keyboard-device-wrapper device-frame-${deviceMode} transition-all duration-300 w-full`}>
                    {deviceMode === 'mobile' && (
                      <div className="device-notch-speaker">
                        <div className="notch-speaker-bar"></div>
                      </div>
                    )}
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
                    {deviceMode === 'mobile' && (
                      <div className="device-home-indicator">
                        <div className="home-indicator-bar"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Side: Simulation & Parameter Consoles */}
        <div className="flex flex-col gap-6">
          {/* Analytics Panel */}
          <Analytics stats={stats} history={metricHistory} />

          {/* Backspace Correction Counter */}
          {backspaceCorrectionCount > 0 && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-950/30 border border-red-800/30 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
              <span className="text-red-300 font-semibold font-mono">
                {backspaceCorrectionCount} Backspace Correction{backspaceCorrectionCount !== 1 ? 's' : ''}
              </span>
              <span className="text-red-500 ml-auto">RL ⊖ active</span>
            </div>
          )}

          {/* Simulation controller */}
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

          />

          {/* Hyperparameter configurator */}
          <ConfigPanel
            spatialParams={spatialParams}
            onSpatialParamsChange={setSpatialParams}
            onResetToDefaults={handleResetParams}
          />
        </div>
      </div>
    </div>
  );
}
