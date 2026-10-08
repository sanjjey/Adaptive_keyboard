import React, { useState, useRef, useEffect } from 'react';
import { KeyboardRLAgent } from '../rl/KeyboardRLAgent';
import { Keyboard } from './Keyboard';
import type { TouchPoint, TypingStats, RLAlgorithmType } from '../rl/types';
import {
  Send,
  Mic,
  Smile,
  Paperclip,
  Camera,
  Phone,
  Video,
  MoreVertical,
  RotateCcw,
  Trash2,
  CheckCheck,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isDelivered?: boolean;
  accuracySnap?: number;
}

interface WhatsAppChatProps {
  agent: KeyboardRLAgent;
  stats: TypingStats;
  recentTouches: TouchPoint[];
  correctionFlashKey: string | null;
  backspaceCorrectionCount: number;
  onResetLayout: () => void;
  showVoronoi: boolean;
  onToggleVoronoi: () => void;
  rlAlgorithm?: RLAlgorithmType;
  onAlgorithmChange?: (algo: RLAlgorithmType) => void;
}

const INITIAL_WHATSAPP_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    sender: 'bot',
    text: '👋 Welcome to the WhatsApp Live Testbed for the Adaptive RL Keyboard!',
    timestamp: '10:41 AM',
    isDelivered: true,
  },
  {
    id: '2',
    sender: 'bot',
    text: 'Tap keys on the virtual phone keyboard below to chat. The Actor-Critic RL agent dynamically warps key boundaries to compensate for your finger drift and typos in real-time.',
    timestamp: '10:42 AM',
    isDelivered: true,
  },
];

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  agent,
  stats,
  recentTouches,
  correctionFlashKey,
  backspaceCorrectionCount,
  onResetLayout,
  showVoronoi,
  onToggleVoronoi,
  rlAlgorithm,
  onAlgorithmChange,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_WHATSAPP_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showVectors, setShowVectors] = useState(true);
  const [showTouches, setShowTouches] = useState(true);
  
  // Local telemetry & visual interaction states
  const [localTouches, setLocalTouches] = useState<TouchPoint[]>(recentTouches);
  const [localFlashKey, setLocalFlashKey] = useState<string | null>(null);
  const [localCorrections, setLocalCorrections] = useState(backspaceCorrectionCount);
  const [localKeystrokes, setLocalKeystrokes] = useState(0);
  const [sessionStartTime] = useState<number>(Date.now());
  const tapHistoryRef = useRef<{ key: string; x: number; y: number; timestamp: number }[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  // Compute live WhatsApp typing telemetry
  const elapsedMinutes = Math.max(0.05, (Date.now() - sessionStartTime) / 60000);
  const currentWpm = localKeystrokes > 0 ? (localKeystrokes / 5) / elapsedMinutes : stats.wpm;
  const currentAccuracy = localKeystrokes > 0
    ? Math.max(0.7, 1 - localCorrections / Math.max(1, localKeystrokes))
    : stats.accuracy;

  // Handle key tap on the docked phone keyboard
  const handleKeyTap = (x: number, y: number) => {
    const classifiedId = agent.classifyTouch(x, y, inputText.slice(-2));

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
        // Retrieve true prior tap coordinates from history buffer
        const history = tapHistoryRef.current;
        if (history.length > 0) {
          const lastTap = history[history.length - 1];
          tapHistoryRef.current = history.slice(0, -1);

          const deltaMs = Date.now() - lastTap.timestamp;
          const confidence = Math.exp(-1.0 * (deltaMs / 1500));

          if (lastTap.key !== 'space' && lastTap.key !== 'shift' && lastTap.key !== 'enter') {
            // Apply retroactive anti-gradient pushback at real finger coordinate
            agent.applyBackspaceCorrection(lastTap.key, lastTap.x, lastTap.y, confidence);
            setLocalFlashKey(lastTap.key);
            setTimeout(() => setLocalFlashKey(null), 600);
            setLocalCorrections((c) => c + 1);
          }
        }
        setInputText((prev) => prev.slice(0, -1));
      }
      return;
    }

    // Normal character classification
    let typedChar = classifiedId;
    if (classifiedId === 'space') {
      typedChar = ' ';
    } else {
      typedChar = isShiftActive ? classifiedId.toUpperCase() : classifiedId.toLowerCase();
      setIsShiftActive(false);
    }

    // Record tap history for backspace correction
    tapHistoryRef.current = [
      ...tapHistoryRef.current.slice(-49),
      { key: classifiedId, x, y, timestamp: Date.now() },
    ];

    // Record touch point
    const newTouch: TouchPoint = {
      x,
      y,
      targetKeyId: classifiedId,
      classifiedKeyId: classifiedId,
      timestamp: Date.now(),
      isCorrect: true,
    };
    setLocalTouches((prev) => [...prev.slice(-30), newTouch]);
    setLocalKeystrokes((k) => k + 1);

    // Adapt RL layout on keystroke
    if (classifiedId !== 'space' && classifiedId !== 'shift' && classifiedId !== 'enter') {
      agent.updateLayout(classifiedId, classifiedId, x, y, localKeystrokes + stats.totalKeystrokes, inputText.slice(-2));
    }

    setInputText((prev) => prev + typedChar);
  };

  // Support physical desktop keyboard typing when in WhatsApp testbed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleSendMessage();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        const backspaceKey = agent.keys.find((k) => k.id === 'backspace');
        const bx = backspaceKey ? backspaceKey.currentX : 750;
        const by = backspaceKey ? backspaceKey.currentY : 305;
        handleKeyTap(bx, by);
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        const spaceKey = agent.keys.find((k) => k.id === 'space');
        const sx = spaceKey ? spaceKey.currentX : 420;
        const sy = spaceKey ? spaceKey.currentY : 305;
        handleKeyTap(sx, sy);
        return;
      }

      const char = e.key.toLowerCase();
      const matchedKey = agent.keys.find((k) => k.char.toLowerCase() === char && k.type !== 'special');
      if (matchedKey) {
        e.preventDefault();
        // Add subtle thumb jitter (+/- 8px) to emulate human touch variance
        const jitterX = (Math.random() - 0.5) * 16;
        const jitterY = (Math.random() - 0.5) * 16;
        handleKeyTap(matchedKey.currentX + jitterX, matchedKey.currentY + jitterY);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputText, isShiftActive, localKeystrokes]);

  // Send message handler
  const handleSendMessage = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      timestamp: timeStr,
      isDelivered: true,
      accuracySnap: currentAccuracy * 100,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Trigger simulated WhatsApp bot reply
    setIsBotTyping(true);
    setTimeout(() => {
      setIsBotTyping(false);
      const botReplies = [
        `Got it! Your typing speed is ${currentWpm.toFixed(1)} WPM at ${(currentAccuracy * 100).toFixed(1)}% accuracy. The RL Actor-Critic policy adjusted Voronoi centroids to align with your thumb tap distribution.`,
        `Message received: "${trimmed}". The Bayesian Decoder evaluated spatial likelihood alongside bigram priors to correctly map your touch points. Cumulative RL return: ${agent.cumulativeReward.toFixed(1)} pts.`,
        `Smooth typing! The keyboard has adapted across ${agent.totalTransitions} interaction steps. Try tapping nearby letter borders to watch the Voronoi tessellation expand in real-time.`,
        `Feedback processed! Backspace negative-reward triggers registered: ${localCorrections}. Erroneous key hitboxes have been retroactively contracted via anti-gradient pushback.`,
      ];
      const randomReply = botReplies[Math.floor(Math.random() * botReplies.length)];

      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDelivered: true,
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1100);
  };

  const handleClearChat = () => {
    setMessages(INITIAL_WHATSAPP_MESSAGES);
    setInputText('');
  };

  return (
    <div className="wa-chat-page-container flex flex-col items-center w-full">
      {/* ── Outer Smartphone Enclosure ── */}
      <div className="wa-device-wrapper">
        <div className="wa-phone-chassis">
          {/* Status Bar with Dynamic Island */}
          <div className="wa-status-bar">
            <span className="wa-status-time">9:41</span>
            {/* Dynamic Island Pill */}
            <div className="wa-dynamic-island">
              <span className="wa-island-dot"></span>
            </div>
            <div className="wa-status-icons">
              <svg width="15" height="10" viewBox="0 0 15 10" fill="currentColor">
                <rect x="0" y="3" width="3" height="7" rx="0.5" />
                <rect x="4" y="2" width="3" height="8" rx="0.5" />
                <rect x="8" y="0.5" width="3" height="9.5" rx="0.5" />
                <rect x="12" y="0" width="3" height="10" rx="0.5" opacity="0.3" />
              </svg>
              <svg width="14" height="11" viewBox="0 0 14 11" fill="currentColor">
                <path d="M7 2.2C9.9 2.2 12.5 3.6 14 5.8L12.6 7.1C11.4 5.4 9.3 4.2 7 4.2S2.6 5.4 1.4 7.1L0 5.8C1.5 3.6 4.1 2.2 7 2.2Z" />
                <circle cx="7" cy="10.5" r="1.5" />
              </svg>
              <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
                <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.4" />
                <rect x="2" y="2" width="17" height="8" rx="2" fill="currentColor" />
                <path d="M23 4.5V7.5A2 2 0 0 0 23 4.5Z" fill="currentColor" fillOpacity="0.5" />
              </svg>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="wa-chat-header">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="wa-avatar">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="wa-contact-name">A2KL Adaptive Bot</span>
                  <span className="wa-verified-badge" title="Reinforcement Learning Engine Active">
                    ✓
                  </span>
                </div>
                <div className="wa-contact-status">
                  <span className="wa-online-dot"></span>
                  {isBotTyping ? 'typing...' : 'online (RL Active)'}
                </div>
              </div>
            </div>

            {/* Header Action Icons */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <button
                onClick={onResetLayout}
                title="Reset Keyboard Centroids"
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-all active:scale-90"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={handleClearChat}
                title="Clear Messages"
                className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 transition-all active:scale-90"
              >
                <Trash2 size={16} />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-all active:scale-90" title="Video call">
                <Video size={17} />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-all active:scale-90" title="Audio call">
                <Phone size={16} />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-all active:scale-90" title="Options">
                <MoreVertical size={17} />
              </button>
            </div>
          </div>

          {/* Live Telemetry Banner */}
          <div className="wa-telemetry-strip">
            <div className="flex items-center gap-1 text-emerald-400">
              <Zap size={11} />
              <span>{currentWpm.toFixed(1)} WPM</span>
            </div>
            <div className="flex items-center gap-1 text-purple-400">
              <TrendingUp size={11} />
              <span>{(currentAccuracy * 100).toFixed(0)}% Acc</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-400">
              <Cpu size={11} />
              {onAlgorithmChange ? (
                <select
                  value={rlAlgorithm || agent.algorithmType}
                  onChange={(e) => onAlgorithmChange(e.target.value as RLAlgorithmType)}
                  className="bg-transparent border-0 text-cyan-300 font-mono text-[10px] cursor-pointer outline-none"
                  title="Switch RL Algorithm"
                >
                  <option value="actor-critic" className="bg-slate-900 text-white">A2C</option>
                  <option value="dqn" className="bg-slate-900 text-white">DQN</option>
                  <option value="ppo" className="bg-slate-900 text-white">PPO</option>
                </select>
              ) : (
                <span>{agent.algorithmType.toUpperCase()}</span>
              )}
            </div>
            <div className="text-slate-400 text-[10px]">
              RL: {agent.cumulativeReward.toFixed(1)}
            </div>
          </div>

          {/* WhatsApp Chat Messages Stream */}
          <div ref={chatScrollRef} className="wa-chat-body">
            {/* Encryption notice */}
            <div className="wa-encryption-chip">
              <ShieldCheck size={12} className="text-amber-400 inline mr-1" />
              Messages are processed 100% on-device via Reinforcement Learning.
            </div>

            <div className="wa-date-chip">TODAY</div>

            {messages.map((m) => (
              <div key={m.id} className={`wa-msg-row ${m.sender}`}>
                <div className={`wa-bubble ${m.sender}`}>
                  <div className="wa-bubble-text">{m.text}</div>
                  <div className="wa-bubble-meta">
                    <span className="wa-bubble-time">{m.timestamp}</span>
                    {m.sender === 'user' && (
                      <CheckCheck size={14} className="text-sky-400 ml-1 inline" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator Bubble */}
            {isBotTyping && (
              <div className="wa-msg-row bot">
                <div className="wa-bubble bot wa-typing-bubble">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp Input Pill Area */}
          <div className="wa-input-area">
            <button className="wa-input-icon hover:text-white" title="Emoji">
              <Smile size={20} />
            </button>
            <button className="wa-input-icon hover:text-white" title="Attach Document">
              <Paperclip size={19} />
            </button>

            {/* Message input pill */}
            <div className="wa-input-pill">
              <div className="wa-input-text">
                {inputText ? (
                  <span className="wa-typed-text">
                    {inputText}
                    <span className="wa-cursor-char">|</span>
                  </span>
                ) : (
                  <span className="wa-placeholder">Type a message...</span>
                )}
              </div>
            </div>

            <button className="wa-input-icon hover:text-white" title="Camera">
              <Camera size={20} />
            </button>

            {/* Send / Mic button */}
            <button
              onClick={handleSendMessage}
              className={`wa-send-btn ${inputText.trim() ? 'bg-emerald-500' : 'bg-[#00a884]'}`}
              title={inputText.trim() ? 'Send Message' : 'Voice Message'}
            >
              {inputText.trim() ? (
                <Send size={18} className="text-white ml-0.5" />
              ) : (
                <Mic size={18} className="text-white" />
              )}
            </button>
          </div>

          {/* Keyboard Drawer / Controls Strip */}
          <div className="wa-keyboard-drawer open">
            <div className="wa-keyboard-topbar">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-purple-400">
                <span className="wa-kb-dot"></span>
                <span>Adaptive RL Phone Layout</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onToggleVoronoi}
                  className={`wa-bar-toggle-btn ${showVoronoi ? 'active' : ''}`}
                  title="Toggle Voronoi Cells"
                >
                  {showVoronoi ? <Eye size={11} className="inline mr-1" /> : <EyeOff size={11} className="inline mr-1" />}
                  Voronoi
                </button>
                <button
                  onClick={() => setShowVectors(!showVectors)}
                  className={`wa-bar-toggle-btn ${showVectors ? 'active' : ''}`}
                  title="Toggle Centroid Drift Vectors"
                >
                  Vectors
                </button>
                <button
                  onClick={() => setShowTouches(!showTouches)}
                  className={`wa-bar-toggle-btn ${showTouches ? 'active' : ''}`}
                  title="Toggle Touch Dots"
                >
                  Touches
                </button>
              </div>
            </div>

            {/* Docked Keyboard */}
            <div className="p-1.5 bg-slate-950/90">
              <Keyboard
                agent={agent}
                recentTouches={showTouches ? localTouches : []}
                showVoronoi={showVoronoi}
                showVectors={showVectors}
                showTouches={showTouches}
                showOverlays={false}
                isSmoothingEnabled={false}
                onKeyTap={handleKeyTap}
                isShiftActive={isShiftActive}
                correctionFlashKey={localFlashKey || correctionFlashKey}
                aspectMode="stretch"
              />
            </div>

            {/* Bottom Home Indicator */}
            <div className="wa-home-bar">
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
