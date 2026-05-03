export type Screen = 'splash' | 'auth' | 'home' | 'chapters' | 'levels' | 'game' | 'trace' | 'pictorial';

export interface Question {
  type: 'sound_from_letter' | 'letter_from_sound' | 'match_letter_sound' | 'trace' | 'pictorial_full' | 'pictorial_partial';
  letter?: string;
  options?: string[];
  correct?: string;
  pairs?: string[];
  word?: string;
  img?: string;
  jumbled?: string[];
  hint?: number[];
}

export interface Level {
  level: number;
  questions: Question[];
}
