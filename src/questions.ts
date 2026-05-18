import type { Question } from './types';

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const PHONICS_TIERS = [
  ['A','E','I','O','U','B','C','D','F','G','H','M','N','P','R','S','T'],
  ['A','E','I','O','U','B','C','D','F','G','H','J','K','L','M','N','P','Q','R','S','T','V','W'],
  ALL_LETTERS,
];
const WORDS_EASY = [
  {word:'CAT',img:'cat'},{word:'DOG',img:'dog'},{word:'SUN',img:'sun'},
  {word:'BUS',img:'bus'},{word:'CUP',img:'cup'},{word:'HAT',img:'hat'},
  {word:'PIG',img:'pig'},{word:'HEN',img:'hen'},{word:'ANT',img:'ant'},
  {word:'BEE',img:'bee'},{word:'COW',img:'cow'},{word:'EGG',img:'egg'},
  {word:'FAN',img:'fan'},{word:'JAR',img:'jar'},{word:'MAP',img:'map'},
  {word:'NET',img:'net'},{word:'OWL',img:'owl'},{word:'PEN',img:'pen'},
  {word:'RAT',img:'rat'},{word:'TOP',img:'top'},
];
const WORDS_MEDIUM = [
  {word:'BALL',img:'ball'},{word:'FROG',img:'frog'},{word:'DRUM',img:'drum'},
  {word:'CRAB',img:'crab'},{word:'STAR',img:'star'},{word:'SHIP',img:'ship'},
  {word:'FISH',img:'fish'},{word:'DUCK',img:'duck'},{word:'CAKE',img:'cake'},
  {word:'KITE',img:'kite'},{word:'LAMP',img:'lamp'},{word:'MILK',img:'milk'},
  {word:'NEST',img:'nest'},{word:'POND',img:'pond'},{word:'RING',img:'ring'},
  {word:'SOCK',img:'sock'},{word:'TREE',img:'tree'},{word:'WOLF',img:'wolf'},
  {word:'YARN',img:'yarn'},{word:'ZINC',img:'zinc'},
];
const WORDS_HARD = [
  {word:'APPLE',img:'apple',hint:[0,4]},{word:'GRAPE',img:'grape',hint:[0,4]},
  {word:'TIGER',img:'tiger',hint:[0,4]},{word:'CAMEL',img:'camel',hint:[0,4]},
  {word:'PLANT',img:'plant',hint:[0,4]},{word:'CLOUD',img:'cloud',hint:[0,4]},
  {word:'BREAD',img:'bread',hint:[0,4]},{word:'CHAIR',img:'chair',hint:[0,4]},
  {word:'TRAIN',img:'train',hint:[0,4]},{word:'GLOBE',img:'globe',hint:[0,4]},
  {word:'ORANGE',img:'orange',hint:[0,2,5]},{word:'CASTLE',img:'castle',hint:[0,2,5]},
  {word:'FLOWER',img:'flower',hint:[0,2,5]},{word:'HAMMER',img:'hammer',hint:[0,2,5]},
  {word:'JUNGLE',img:'jungle',hint:[0,2,5]},{word:'BRIDGE',img:'bridge',hint:[0,2,5]},
  {word:'ELEPHANT',img:'elephant',hint:[0,2,4,7]},
  {word:'UMBRELLA',img:'umbrella',hint:[0,2,4,7]},
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function staticQuestions(chapter: number, level: number): Question[] {
  const questions: Question[] = [];

  if (chapter === 1) {
    const tierIdx = level <= 10 ? 0 : level <= 20 ? 1 : 2;
    const pool = shuffle(PHONICS_TIERS[tierIdx]);
    const matchFreq = level <= 10 ? 4 : level <= 20 ? 3 : 2;
    for (let q = 0; q < 10; q++) {
      const letter = pool[q % pool.length];
      const wrong = shuffle(ALL_LETTERS.filter(l => l !== letter)).slice(0, 3);
      if (q % matchFreq === matchFreq - 1) {
        const pairCount = level <= 10 ? 3 : level <= 20 ? 4 : 5;
        questions.push({ type: 'match_letter_sound', pairs: shuffle(pool).slice(0, pairCount) });
      } else if (q % 2 === 0) {
        questions.push({ type: 'sound_from_letter', letter, options: shuffle([letter, ...wrong]), correct: letter });
      } else {
        questions.push({ type: 'letter_from_sound', letter, options: shuffle([letter, ...wrong]), correct: letter });
      }
    }
  } else if (chapter === 2) {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const lower = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const pool = level <= 10 ? upper : level <= 20 ? lower : [...upper, ...lower];
    const start = (level - 1) % 26;
    for (let q = 0; q < 10; q++) {
      questions.push({ type: 'trace', letter: pool[(start + q) % pool.length] });
    }
  } else {
    const wordPool = level <= 10 ? WORDS_EASY : level <= 20 ? WORDS_MEDIUM : WORDS_HARD;
    const shuffled = shuffle(wordPool);
    for (let q = 0; q < 10; q++) {
      const w = shuffled[q % shuffled.length] as typeof WORDS_HARD[0];
      const usePartial = level >= 21 && w.hint && w.hint.length > 0;
      questions.push({
        type: usePartial ? 'pictorial_partial' : 'pictorial_full',
        word: w.word, img: w.img,
        jumbled: shuffle(w.word.split('')),
        hint: usePartial ? w.hint : [],
      });
    }
  }
  return questions;
}
