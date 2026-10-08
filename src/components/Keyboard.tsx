import React, { useRef, useState } from 'react';
import { KeyboardRLAgent } from '../rl/KeyboardRLAgent';
import type { TouchPoint } from '../rl/types';

interface KeyboardProps {
  agent: KeyboardRLAgent;
  recentTouches: TouchPoint[];
  showVoronoi: boolean;
  showVectors: boolean;
  showTouches: boolean;
  showOverlays: boolean;
  isSmoothingEnabled: boolean;
  onKeyTap: (x: number, y: number) => void;
  isShiftActive?: boolean;
  /** Key id to flash red (backspace correction visual feedback) */
  correctionFlashKey?: string | null;
  /** Aspect ratio mode: 'meet' for wide studio, 'stretch' for mobile drawer */
  aspectMode?: 'meet' | 'stretch';
}

// Maps alphabet keys to symbol overlays
const SYMBOL_OVERLAYS: { [key: string]: string } = {
  q: '1', w: '2', e: '3', r: '4', t: '5', y: '6', u: '7', i: '8', o: '9', p: '0',
  a: '@', s: '#', d: '$', f: '%', g: '&', h: '*', j: '-', k: '+', l: '=',
  z: '_', x: '/', c: ':', v: ';', b: '!', n: '?', m: ',',
};

export const Keyboard: React.FC<KeyboardProps> = ({
  agent,
  recentTouches,
  showVoronoi,
  showVectors,
  showTouches,
  showOverlays,
  isSmoothingEnabled,
  onKeyTap,
  isShiftActive = false,
  correctionFlashKey = null,
  aspectMode = 'meet',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragBuffer, setDragBuffer] = useState<{ x: number; y: number }[]>([]);
  const [pressedKeyId, setPressedKeyId] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    // Scale client click coordinates to 1000x350 coordinate space
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const x = (clickX / rect.width) * 1000;
    const y = (clickY / rect.height) * 350;
    
    const hitKey = agent.classifyTouch(x, y);
    setPressedKeyId(hitKey);
    setIsMouseDown(true);
    setDragBuffer([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isMouseDown || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const x = (clickX / rect.width) * 1000;
    const y = (clickY / rect.height) * 350;
    
    setDragBuffer((prev) => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
    setTimeout(() => setPressedKeyId(null), 120);

    if (dragBuffer.length > 0) {
      if (isSmoothingEnabled) {
        // Centroid Filter: average all points collected during active hold/shake
        const sumX = dragBuffer.reduce((sum, p) => sum + p.x, 0);
        const sumY = dragBuffer.reduce((sum, p) => sum + p.y, 0);
        const avgX = sumX / dragBuffer.length;
        const avgY = sumY / dragBuffer.length;
        onKeyTap(avgX, avgY);
      } else {
        // Normal click: use final point
        const last = dragBuffer[dragBuffer.length - 1];
        onKeyTap(last.x, last.y);
      }
    }
    setDragBuffer([]);
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!svgRef.current || e.touches.length === 0) return;
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    
    const clickX = touch.clientX - rect.left;
    const clickY = touch.clientY - rect.top;
    
    const x = (clickX / rect.width) * 1000;
    const y = (clickY / rect.height) * 350;
    
    const hitKey = agent.classifyTouch(x, y);
    setPressedKeyId(hitKey);
    setIsMouseDown(true);
    setDragBuffer([{ x, y }]);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!isMouseDown || !svgRef.current || e.touches.length === 0) return;
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    
    const clickX = touch.clientX - rect.left;
    const clickY = touch.clientY - rect.top;
    
    const x = (clickX / rect.width) * 1000;
    const y = (clickY / rect.height) * 350;
    
    setDragBuffer((prev) => [...prev, { x, y }]);
  };

  const handleTouchEnd = (e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    handleMouseUp();
  };

  // Separate keys into categories
  const specials = agent.keys.filter((k) => k.type === 'special');
  const activeAlphaNumerics = agent.keys.filter(
    (k) => k.type !== 'special' && (k.type !== 'numeric' || agent.showNumericRow)
  );

  return (
    <div className="relative w-full select-none" style={{ touchAction: 'none' }}>
      <svg
        ref={svgRef}
        viewBox="0 0 1000 350"
        preserveAspectRatio={aspectMode === 'stretch' ? 'none' : 'xMidYMid meet'}
        className={`w-full ${aspectMode === 'stretch' ? 'h-[235px] sm:h-[255px]' : 'h-auto'} bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden cursor-crosshair shadow-2xl transition-all duration-300`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.05) inset',
          userSelect: 'none',
        }}
      >
        {/* Grids / Glowing Ambient Background */}
        <defs>
          <radialGradient id="purpleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.15)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>
        <rect width="1000" height="350" fill="url(#purpleGlow)" />

        {/* 1. Draw Power Diagram / Voronoi Key Cells */}
        {activeAlphaNumerics.map((key) => {
          const polygon = agent.cells[key.id];
          const hasPolygon = polygon && polygon.length > 0;
          const overlayChar = SYMBOL_OVERLAYS[key.id];

          // Compute cell points string
          const pointsStr = hasPolygon
            ? polygon.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
            : '';

          const isPressed = pressedKeyId === key.id;

          return (
            <g key={key.id} className="transition-all duration-100">
              {/* 1a. Adaptive Voronoi Cell Territory (translucent background contour) */}
              {showVoronoi && hasPolygon && (
                <polygon
                  points={pointsStr}
                  fill={key.id === correctionFlashKey ? 'rgba(220, 38, 38, 0.25)' : 'rgba(139, 92, 246, 0.12)'}
                  stroke={key.id === correctionFlashKey ? 'rgba(239, 68, 68, 0.9)' : 'rgba(139, 92, 246, 0.4)'}
                  strokeWidth={key.id === correctionFlashKey ? '2.5' : '1.2'}
                  strokeDasharray="4 3"
                />
              )}

              {/* 1b. Tactile Physical Keycap (Always visible with proper padding & rounded corners) */}
              <rect
                x={key.currentX - key.defaultWidth / 2 + 4}
                y={key.currentY - key.defaultHeight / 2 + 3}
                width={Math.max(20, key.defaultWidth - 8)}
                height={Math.max(20, key.defaultHeight - 6)}
                rx="8"
                ry="8"
                fill={
                  key.id === correctionFlashKey
                    ? 'rgba(220, 38, 38, 0.75)'
                    : isPressed
                    ? 'rgba(124, 58, 237, 0.9)'
                    : 'rgba(30, 41, 59, 0.92)'
                }
                stroke={
                  key.id === correctionFlashKey
                    ? '#ef4444'
                    : isPressed
                    ? '#c4b5fd'
                    : 'rgba(255, 255, 255, 0.16)'
                }
                strokeWidth={isPressed ? '2' : '1.2'}
                className="transition-all duration-75"
              />

              {/* Backspace correction ripple pulse */}
              {key.id === correctionFlashKey && (
                <circle
                  cx={key.currentX}
                  cy={key.currentY}
                  r="32"
                  fill="none"
                  stroke="rgba(239, 68, 68, 0.8)"
                  strokeWidth="2.5"
                  className="key-correction-ripple"
                />
              )}

              {/* Key Character Label */}
              <text
                x={key.currentX}
                y={key.currentY + 10}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="26"
                fontWeight="600"
                className="pointer-events-none font-sans select-none"
              >
                {isShiftActive ? key.char.toUpperCase() : key.char.toLowerCase()}
              </text>

              {/* Overlay Symbol Hint */}
              {showOverlays && overlayChar && (
                <text
                  x={key.currentX + 22}
                  y={key.currentY - 14}
                  textAnchor="middle"
                  fill="var(--accent-teal)"
                  fontSize="12"
                  fontWeight="600"
                  className="pointer-events-none font-mono opacity-80"
                >
                  {overlayChar}
                </text>
              )}

              {/* Key Default Position Marker (Ghost Center) */}
              {showVectors && (
                <>
                  <circle
                    cx={key.defaultX}
                    cy={key.defaultY}
                    r="3"
                    fill="rgba(255,255,255,0.2)"
                    className="pointer-events-none"
                  />
                  <line
                    x1={key.defaultX}
                    y1={key.defaultY}
                    x2={key.currentX}
                    y2={key.currentY}
                    stroke="var(--accent-purple)"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                    className="pointer-events-none"
                  />
                  <circle
                    cx={key.currentX}
                    cy={key.currentY}
                    r="4"
                    fill="var(--accent-purple)"
                    className="pointer-events-none"
                  />
                </>
              )}
            </g>
          );
        })}

        {/* 2. Draw Special Fixed Rectangle Keys */}
        {specials.map((key) => {
          const w = key.defaultWidth;
          const h = key.defaultHeight;
          const x = key.currentX - w / 2;
          const y = key.currentY - h / 2;
          const isPressed = pressedKeyId === key.id;
          
          const isModeKey = key.id === 'mode';
          const isShiftKey = key.id === 'shift';
          const isSpace = key.id === 'space';
          
          let rectFill = "rgba(15, 23, 42, 0.9)";
          if (isPressed) rectFill = "rgba(124, 58, 237, 0.9)";
          else if (isShiftKey && isShiftActive) rectFill = "rgba(139, 92, 246, 0.75)";
          else if (isModeKey) rectFill = "rgba(15, 23, 42, 0.5)";
          
          const rectStroke = isPressed
            ? "#c4b5fd"
            : (isShiftKey && isShiftActive ? "#a78bfa" : "rgba(255, 255, 255, 0.15)");
          const textColor = (isShiftKey && isShiftActive) || isPressed ? "#ffffff" : (isModeKey ? "#94a3b8" : "#e2e8f0");
          const keyLabel = isModeKey ? "123" : isSpace ? "SPACE" : key.char;

          return (
            <g key={key.id} className="transition-all duration-100">
              <rect
                x={x + 3}
                y={y + 2}
                width={Math.max(20, w - 6)}
                height={Math.max(20, h - 4)}
                rx="8"
                ry="8"
                fill={rectFill}
                stroke={rectStroke}
                strokeWidth={isPressed ? "2" : "1.2"}
                className="transition-all duration-75"
              />
              <text
                x={key.currentX}
                y={key.currentY + (isSpace ? 6 : 9)}
                textAnchor="middle"
                fill={textColor}
                fontSize={isSpace ? "18" : "24"}
                fontWeight="700"
                letterSpacing={isSpace ? "2" : "normal"}
                className="pointer-events-none font-sans select-none"
              >
                {keyLabel}
              </text>
            </g>
          );
        })}

        {/* 3. Draw Touch Coordinates Heatmap/Scatter (Optional Overlay) */}
        {showTouches &&
          recentTouches.map((touch, i) => (
            <circle
              key={i}
              cx={touch.x}
              cy={touch.y}
              r={5 + i * 0.1} // Grow slightly for recent touches
              fill={touch.isCorrect ? 'var(--accent-green)' : 'var(--accent-rose)'}
              opacity={Math.max(0.1, 0.2 + (i / recentTouches.length) * 0.8)}
              className="pointer-events-none"
              style={{
                filter: `drop-shadow(0 0 4px ${touch.isCorrect ? 'var(--accent-green)' : 'var(--accent-rose)'})`,
              }}
            />
          ))}

        {/* 4. Draw Live Drag/Tremor Trajectory Path Trail */}
        {isMouseDown && dragBuffer.length > 1 && (
          <path
            d={`M ${dragBuffer[0].x.toFixed(1)} ${dragBuffer[0].y.toFixed(1)} ` + dragBuffer.slice(1).map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
            fill="none"
            stroke="var(--accent-teal)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
            className="pointer-events-none"
            style={{ filter: 'drop-shadow(0 0 6px var(--accent-teal))' }}
          />
        )}
      </svg>
    </div>
  );
};
