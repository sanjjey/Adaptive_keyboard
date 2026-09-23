import type { KeyConfig, TyperProfile } from './types';

export class TyperSimulator {
  public profile: TyperProfile;

  constructor(profile: TyperProfile) {
    this.profile = profile;
  }

  /**
   * Helper to generate normally distributed random numbers (Box-Muller transform)
   */
  private gaussianRandom(mean = 0, stdDev = 1): number {
    const u = 1 - Math.random(); // Subtraction to prevent 0
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }

  /**
   * Simulates a touch coordinate for a targeted key.
   * Note: The user targets the key's DEFAULT (muscle memory) position,
   * but they type with noise and systematic drift according to their profile.
   */
  public simulateTouch(key: KeyConfig, timeMs: number = Date.now()): { x: number; y: number } {
    // Standard deviation is based on profile's noise level
    const noiseX = this.gaussianRandom(0, this.profile.noiseLevel);
    const noiseY = this.gaussianRandom(0, this.profile.noiseLevel);

    // Coordinate = Default Center + Profile Drift + Random Noise
    let x = key.defaultX + this.profile.driftX + noiseX;
    let y = key.defaultY + this.profile.driftY + noiseY;

    // If it's the tremor or hybrid profile, overlay a high-frequency 6Hz spasmodic tremor oscillation
    if (this.profile.id === 'parkinsons' || this.profile.id === 'hybrid') {
      const freq = 6.0;
      const t = timeMs / 1000.0;
      const amplitude = this.profile.id === 'hybrid' ? 12.0 : 22.0; // Moderate tremor for Hybrid
      x += amplitude * Math.sin(2 * Math.PI * freq * t);
      y += amplitude * Math.cos(2 * Math.PI * freq * t + Math.PI / 4);
    }

    // Constrain to typical keyboard dimensions
    return {
      x: Math.max(0, Math.min(1000, x)),
      y: Math.max(0, Math.min(350, y)),
    };
  }

  /**
   * Calculates the simulated latency (in milliseconds) for a single keystroke event.
   * Base key press is ~250ms.
   * Nearby typos or corrections add time.
   * Layout switches add time.
   */
  public calculateKeystrokeLatency(
    isCorrect: boolean,
    hadToSwitchLayout: boolean,
    wasDoubleLetter: boolean
  ): number {
    let latency = 200; // Base physical tapping latency in ms (~60 WPM baseline)

    // Add noise to typing cadence
    latency += this.gaussianRandom(0, 40);

    // If incorrect, user needs to realize, hit backspace, and re-type: adds heavy latency
    if (!isCorrect) {
      latency += 450; // Realization delay + Backspace keytap + Re-typing keytap
    }

    // Manual layout switch button click takes time
    if (hadToSwitchLayout) {
      latency += 300; // Switch delay to hit "123" button and refocus
    }

    // Double letter speed boost (re-tapping same key is faster)
    if (wasDoubleLetter) {
      latency = Math.max(80, latency - 100);
    }

    return Math.max(50, latency);
  }
}

/**
 * Predefined list of standard Typer Profiles for testing/research.
 */
export const PRESETS: TyperProfile[] = [
  {
    id: 'standard',
    name: 'Standard Typer',
    description: 'Accurate, high speed, and low physical key landing variance.',
    noiseLevel: 10,
    driftX: 0,
    driftY: 0,
    doubleLetterRate: 0.05,
    numericFrequency: 0,
  },
  {
    id: 'fat_fingers',
    name: 'Fat Fingers',
    description: 'High touch coordinate variance; frequently clips neighboring keys.',
    noiseLevel: 25,
    driftX: 0,
    driftY: 0,
    doubleLetterRate: 0.08,
    numericFrequency: 0,
  },
  {
    id: 'right_drift',
    name: 'Right-Drift Typer',
    description: 'Constant systematic drift to the right, common with single-hand usage.',
    noiseLevel: 12,
    driftX: 32,
    driftY: 0,
    doubleLetterRate: 0.04,
    numericFrequency: 0,
  },
  {
    id: 'numeric_spammer',
    name: 'Numeric Power User',
    description: 'Types numbers and special alphanumeric codes frequently.',
    noiseLevel: 12,
    driftX: 0,
    driftY: 0,
    doubleLetterRate: 0.05,
    numericFrequency: 0,
  },
  {
    id: 'parkinsons',
    name: 'Tremor Typer (Parkinson\'s)',
    description: 'Simulates severe 6Hz spasmodic hand tremors. High spatial noise and oscillations.',
    noiseLevel: 28,
    driftX: 6,
    driftY: -6,
    doubleLetterRate: 0.12,
    numericFrequency: 0,
  },
  {
    id: 'hybrid',
    name: 'Hybrid Profile (Impairs)',
    description: 'Combines 24px drift, 18px random noise, and moderate 6Hz tremors.',
    noiseLevel: 18,
    driftX: 24,
    driftY: -6,
    doubleLetterRate: 0.08,
    numericFrequency: 0,
  },
  {
    id: 'typo_prone',
    name: 'Typo-Prone Typer',
    description: 'High motor noise and systematic drift; makes adjacent key typos very easily.',
    noiseLevel: 32,
    driftX: 16,
    driftY: 8,
    doubleLetterRate: 0.05,
    numericFrequency: 0,
  },
];
