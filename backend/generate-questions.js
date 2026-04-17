// generate-questions.js
// Chapter 1: Phonics (30 levels x 10 questions)
// Chapter 2: Trace (30 levels x 10 questions - letters A-Z, a-z)
// Chapter 3: Pictorial (30 levels x 10 questions)

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Phonics data: letter -> phonetic sound description
const PHONICS = {
  A:'ay',B:'bee',C:'see',D:'dee',E:'ee',F:'ef',G:'jee',H:'aych',
  I:'eye',J:'jay',K:'kay',L:'el',M:'em',N:'en',O:'oh',P:'pee',
  Q:'kyoo',R:'ar',S:'es',T:'tee',U:'yoo',V:'vee',W:'dub',X:'eks',
  Y:'why',Z:'zee'
};

// Pictorial word bank with image keys and letter arrays
const PICTURE_WORDS = [
  {word:'DOG',img:'dog',hint:[]},
  {word:'CAT',img:'cat',hint:[]},
  {word:'BALL',img:'ball',hint:[]},
  {word:'SUN',img:'sun',hint:[]},
  {word:'BUS',img:'bus',hint:[]},
  {word:'CUP',img:'cup',hint:[]},
  {word:'HAT',img:'hat',hint:[]},
  {word:'PIG',img:'pig',hint:[]},
  {word:'HEN',img:'hen',hint:[]},
  {word:'ANT',img:'ant',hint:[]},
  {word:'BEE',img:'bee',hint:[]},
  {word:'COW',img:'cow',hint:[]},
  {word:'EGG',img:'egg',hint:[]},
  {word:'FAN',img:'fan',hint:[]},
  {word:'GUN',img:'gun',hint:[]},
  {word:'JAR',img:'jar',hint:[]},
  {word:'KEY',img:'key',hint:[]},
  {word:'LOG',img:'log',hint:[]},
  {word:'MAP',img:'map',hint:[]},
  {word:'NET',img:'net',hint:[]},
  {word:'OWL',img:'owl',hint:[]},
  {word:'PEN',img:'pen',hint:[]},
  {word:'RAT',img:'rat',hint:[]},
  {word:'TOP',img:'top',hint:[]},
  {word:'VAN',img:'van',hint:[]},
  {word:'WEB',img:'web',hint:[]},
  {word:'YAK',img:'yak',hint:[]},
  {word:'ZIP',img:'zip',hint:[]},
  {word:'FOX',img:'fox',hint:[]},
  {word:'MUD',img:'mud',hint:[]},
  // longer words for harder levels
  {word:'ELEPHANT',img:'elephant',hint:[0,2,4,6,7]},
  {word:'APPLE',img:'apple',hint:[0,4]},
  {word:'ORANGE',img:'orange',hint:[0,2,5]},
  {word:'UMBRELLA',img:'umbrella',hint:[0,2,4,7]},
  {word:'IGLOO',img:'igloo',hint:[0,3,4]},
  {word:'FROG',img:'frog',hint:[0,3]},
  {word:'DRUM',img:'drum',hint:[0,3]},
  {word:'CRAB',img:'crab',hint:[0,3]},
  {word:'STAR',img:'star',hint:[0,3]},
  {word:'SHIP',img:'ship',hint:[0,3]},
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
  const pool = LETTERS.filter(l => l !== correct);
  return shuffle(pool).slice(0, count);
}

// Chapter 1 question types
function makeC1Q1(letter) {
  // Find sound from letter: show letter, 4 speaker options, one correct
  const wrong = getWrongLetters(letter, 3);
  const options = shuffle([letter, ...wrong]);
  return { type: 'sound_from_letter', letter, options, correct: letter };
}

function makeC1Q2(letter) {
  // Find letter from pronunciation: hear sound, pick correct letter
  const wrong = getWrongLetters(letter, 3);
  const options = shuffle([letter, ...wrong]);
  return { type: 'letter_from_sound', letter, options, correct: letter };
}

function makeC1Q3(letters) {
  // Match letter to sound: 5 pairs
  return { type: 'match_letter_sound', pairs: letters };
}

function generateChapter1() {
  const levels = [];
  for (let lvl = 0; lvl < 30; lvl++) {
    const questions = [];
    const pool = shuffle(LETTERS);
    for (let q = 0; q < 10; q++) {
      const letter = pool[q % 26];
      const qtype = q % 3;
      if (qtype === 0) questions.push(makeC1Q1(letter));
      else if (qtype === 1) questions.push(makeC1Q2(letter));
      else {
        const five = shuffle(LETTERS).slice(0, 5);
        questions.push(makeC1Q3(five));
      }
    }
    levels.push({ level: lvl + 1, questions });
  }
  return levels;
}

function generateChapter2() {
  // Trace letters: A-Z uppercase then a-z lowercase, cycling through 30 levels
  const allLetters = [
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    ...'abcdefghijklmnopqrstuvwxyz'.split('')
  ];
  const levels = [];
  for (let lvl = 0; lvl < 30; lvl++) {
    const questions = [];
    for (let q = 0; q < 10; q++) {
      const idx = (lvl * 10 + q) % allLetters.length;
      questions.push({ type: 'trace', letter: allLetters[idx] });
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
      const letters = word.split('');
      const jumbled = shuffle(letters);
      // For harder levels (lvl >= 15) use partial fill (hint indices)
      const usePartial = lvl >= 15 && hint.length > 0;
      questions.push({
        type: usePartial ? 'pictorial_partial' : 'pictorial_full',
        word,
        img,
        jumbled,
        hint: usePartial ? hint : []
      });
    }
    levels.push({ level: lvl + 1, questions });
  }
  return levels;
}

module.exports = { generateChapter1, generateChapter2, generateChapter3 };
