const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const PICTURE_WORDS = [
  {word:'DOG',img:'dog',hint:[]},{word:'CAT',img:'cat',hint:[]},
  {word:'BALL',img:'ball',hint:[]},{word:'SUN',img:'sun',hint:[]},
  {word:'BUS',img:'bus',hint:[]},{word:'CUP',img:'cup',hint:[]},
  {word:'HAT',img:'hat',hint:[]},{word:'PIG',img:'pig',hint:[]},
  {word:'HEN',img:'hen',hint:[]},{word:'ANT',img:'ant',hint:[]},
  {word:'BEE',img:'bee',hint:[]},{word:'COW',img:'cow',hint:[]},
  {word:'EGG',img:'egg',hint:[]},{word:'FAN',img:'fan',hint:[]},
  {word:'JAR',img:'jar',hint:[]},{word:'KEY',img:'key',hint:[]},
  {word:'LOG',img:'log',hint:[]},{word:'MAP',img:'map',hint:[]},
  {word:'NET',img:'net',hint:[]},{word:'OWL',img:'owl',hint:[]},
  {word:'PEN',img:'pen',hint:[]},{word:'RAT',img:'rat',hint:[]},
  {word:'TOP',img:'top',hint:[]},{word:'VAN',img:'van',hint:[]},
  {word:'WEB',img:'web',hint:[]},{word:'YAK',img:'yak',hint:[]},
  {word:'ZIP',img:'zip',hint:[]},{word:'FOX',img:'fox',hint:[]},
  {word:'MUD',img:'mud',hint:[]},{word:'LOG',img:'log',hint:[]},
  {word:'ELEPHANT',img:'elephant',hint:[0,2,4,6,7]},
  {word:'APPLE',img:'apple',hint:[0,4]},
  {word:'ORANGE',img:'orange',hint:[0,2,5]},
  {word:'UMBRELLA',img:'umbrella',hint:[0,2,4,7]},
  {word:'FROG',img:'frog',hint:[0,3]},
  {word:'DRUM',img:'drum',hint:[0,3]},
  {word:'CRAB',img:'crab',hint:[0,3]},
  {word:'STAR',img:'star',hint:[0,3]},
  {word:'SHIP',img:'ship',hint:[0,3]},
  {word:'FISH',img:'fish',hint:[0,3]},
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWrongLetters(correct, count) {
  return shuffle(LETTERS.filter(l => l !== correct)).slice(0, count);
}

function generateChapter1() {
  const levels = [];
  for (let lvl = 0; lvl < 30; lvl++) {
    const questions = [];
    const pool = shuffle(LETTERS);
    for (let q = 0; q < 10; q++) {
      const letter = pool[q % 26];
      const qtype = q % 3;
      if (qtype === 0) {
        const options = shuffle([letter, ...getWrongLetters(letter, 3)]);
        questions.push({ type: 'sound_from_letter', letter, options, correct: letter });
      } else if (qtype === 1) {
        const options = shuffle([letter, ...getWrongLetters(letter, 3)]);
        questions.push({ type: 'letter_from_sound', letter, options, correct: letter });
      } else {
        questions.push({ type: 'match_letter_sound', pairs: shuffle(LETTERS).slice(0, 5) });
      }
    }
    levels.push({ level: lvl + 1, questions });
  }
  return levels;
}

function generateChapter2() {
  const allLetters = [
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    ...'abcdefghijklmnopqrstuvwxyz'.split('')
  ];
  const levels = [];
  for (let lvl = 0; lvl < 30; lvl++) {
    const questions = [];
    for (let q = 0; q < 10; q++) {
      questions.push({ type: 'trace', letter: allLetters[(lvl * 10 + q) % allLetters.length] });
    }
    levels.push({ level: lvl + 1, questions });
  }
  return levels;
}

function generateChapter3() {
  const levels = [];
  for (let lvl = 0; lvl < 30; lvl++) {
    const questions = [];
    for (let q = 0; q < 10; q++) {
      const wordObj = PICTURE_WORDS[(lvl * 10 + q) % PICTURE_WORDS.length];
      const { word, img, hint } = wordObj;
      const usePartial = lvl >= 15 && hint.length > 0;
      questions.push({
        type: usePartial ? 'pictorial_partial' : 'pictorial_full',
        word, img,
        jumbled: shuffle(word.split('')),
        hint: usePartial ? hint : []
      });
    }
    levels.push({ level: lvl + 1, questions });
  }
  return levels;
}

module.exports = { generateChapter1, generateChapter2, generateChapter3 };
