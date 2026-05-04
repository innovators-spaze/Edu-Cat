const express = require('express');
const cors = require('cors');
const path = require('path');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// ── Static fallback question generator ───────────────────────────────────────
const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Chapter 1 phonics pools by difficulty tier
const PHONICS_TIERS = [
  // Tier 1 (levels 1-10): vowels + most common consonants
  ['A','E','I','O','U','B','C','D','F','G','H','M','N','P','R','S','T'],
  // Tier 2 (levels 11-20): add less common consonants
  ['A','E','I','O','U','B','C','D','F','G','H','J','K','L','M','N','P','Q','R','S','T','V','W'],
  // Tier 3 (levels 21-30): full alphabet
  ALL_LETTERS,
];

// Chapter 3 picture words by difficulty tier
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
  {word:'ORANGE',img:'orange',hint:[0,2,5]},{word:'BRIDGE',img:'bridge',hint:[0,2,5]},
  {word:'CASTLE',img:'castle',hint:[0,2,5]},{word:'FLOWER',img:'flower',hint:[0,2,5]},
  {word:'GARDEN',img:'garden',hint:[0,2,5]},{word:'HAMMER',img:'hammer',hint:[0,2,5]},
  {word:'ISLAND',img:'island',hint:[0,2,5]},{word:'JUNGLE',img:'jungle',hint:[0,2,5]},
  {word:'ELEPHANT',img:'elephant',hint:[0,2,4,7]},
  {word:'UMBRELLA',img:'umbrella',hint:[0,2,4,7]},
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function staticQuestions(chapter, level) {
  const questions = [];

  if (chapter === 1) {
    // Pick difficulty tier based on level
    const tierIdx = level <= 10 ? 0 : level <= 20 ? 1 : 2;
    const pool = shuffle(PHONICS_TIERS[tierIdx]);
    // At higher levels, use more match_letter_sound (harder)
    const matchFreq = level <= 10 ? 4 : level <= 20 ? 3 : 2; // every Nth question is match type

    for (let q = 0; q < 10; q++) {
      const letter = pool[q % pool.length];
      const wrong = shuffle(ALL_LETTERS.filter(l => l !== letter)).slice(0, 3);
      if (q % matchFreq === matchFreq - 1) {
        // match_letter_sound: harder, uses more pairs at higher levels
        const pairCount = level <= 10 ? 3 : level <= 20 ? 4 : 5;
        questions.push({ type: 'match_letter_sound', pairs: shuffle(pool).slice(0, pairCount) });
      } else if (q % 2 === 0) {
        questions.push({ type: 'sound_from_letter', letter, options: shuffle([letter, ...wrong]), correct: letter });
      } else {
        questions.push({ type: 'letter_from_sound', letter, options: shuffle([letter, ...wrong]), correct: letter });
      }
    }

  } else if (chapter === 2) {
    // Level 1-10: uppercase A-Z (cycle), 11-20: lowercase a-z, 21-30: mix both
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const lower = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let pool;
    if (level <= 10) pool = upper;
    else if (level <= 20) pool = lower;
    else pool = [...upper, ...lower];

    const start = ((level - 1) % 26) * (level <= 20 ? 1 : 0); // spread across alphabet
    for (let q = 0; q < 10; q++) {
      questions.push({ type: 'trace', letter: pool[(start + q) % pool.length] });
    }

  } else {
    // Chapter 3: level 1-10 easy 3-letter, 11-20 medium 4-letter, 21-30 hard long words
    let wordPool;
    if (level <= 10) wordPool = WORDS_EASY;
    else if (level <= 20) wordPool = WORDS_MEDIUM;
    else wordPool = WORDS_HARD;

    const shuffled = shuffle(wordPool);
    for (let q = 0; q < 10; q++) {
      const w = shuffled[q % shuffled.length];
      const usePartial = level >= 21 && w.hint && w.hint.length > 0;
      questions.push({
        type: usePartial ? 'pictorial_partial' : 'pictorial_full',
        word: w.word, img: w.img,
        jumbled: shuffle(w.word.split('')),
        hint: usePartial ? w.hint : []
      });
    }
  }

  return { level, questions };
}

// ── Groq AI question generator ────────────────────────────────────────────────
async function groqQuestions(chapter, level) {
  const prompts = {
    1: `Generate exactly 10 phonics questions for children (level ${level}/30, difficulty increases with level).
Mix these 3 types evenly:
1. "sound_from_letter": show a letter, pick which speaker sound is correct
2. "letter_from_sound": hear a sound, pick the correct letter  
3. "match_letter_sound": match 5 letters to their sounds

Return ONLY valid JSON array, no markdown, no explanation:
[
  {"type":"sound_from_letter","letter":"A","options":["A","B","C","D"],"correct":"A"},
  {"type":"letter_from_sound","letter":"B","options":["A","B","C","D"],"correct":"B"},
  {"type":"match_letter_sound","pairs":["C","D","E","F","G"]},
  ...10 total
]`,

    2: `Generate exactly 10 letter tracing questions for children (level ${level}/30).
Level 1-13: uppercase letters A-Z, Level 14-26: lowercase a-z, Level 27-30: mix.
Return ONLY valid JSON array:
[{"type":"trace","letter":"A"},{"type":"trace","letter":"b"},...]`,

    3: `Generate exactly 10 pictorial word-building questions for children (level ${level}/30, harder levels have longer words).
Levels 1-15: simple 3-4 letter words (dog, cat, sun). Levels 16-30: longer words (elephant, umbrella).
For levels 16-30 include hint indices (pre-filled letter positions).
Return ONLY valid JSON array:
[
  {"type":"pictorial_full","word":"DOG","img":"dog","jumbled":["G","O","D"],"hint":[]},
  {"type":"pictorial_partial","word":"ELEPHANT","img":"elephant","jumbled":["P","H","N","L","A"],"hint":[0,2,4,6,7]},
  ...10 total
]`
  };

  const completion = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [
      { role: 'system', content: 'You are a children\'s educational app question generator. Always return valid JSON only, no markdown code blocks, no extra text.' },
      { role: 'user', content: prompts[chapter] }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const text = completion.choices[0].message.content.trim();
  // Strip markdown code blocks if model adds them
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const questions = JSON.parse(clean);

  // Validate we got 10 questions
  if (!Array.isArray(questions) || questions.length < 5) throw new Error('Invalid response');

  return { level, questions: questions.slice(0, 10) };
}

// ── Cache ─────────────────────────────────────────────────────────────────────
const cache = new Map();

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/questions/:chapter/:level', async (req, res) => {
  const chapter = parseInt(req.params.chapter);
  const level = parseInt(req.params.level);
  if (chapter < 1 || chapter > 3 || level < 1 || level > 30)
    return res.status(404).json({ error: 'Not found' });

  const key = `${chapter}_${level}`;

  // Return cached if available (skip cache in dev by checking env)
  if (cache.has(key) && process.env.NODE_ENV === 'production') return res.json(cache.get(key));

  try {
    // Try Groq AI first
    if (groq) {
      const data = await groqQuestions(chapter, level);
      cache.set(key, data);
      return res.json(data);
    }
  } catch (e) {
    console.error('Groq failed, using static fallback:', e.message);
  }

  // Fallback to static
  const data = staticQuestions(chapter, level);
  cache.set(key, data);
  res.json(data);
});

// Progress store (in-memory)
const progressStore = {};

app.post('/api/progress', (req, res) => {
  const { uid, chapter, level, score, completed } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid required' });
  if (!progressStore[uid]) progressStore[uid] = {};
  const key = `${chapter}_${level}`;
  const prev = progressStore[uid][key] || { score: 0, completed: false };
  progressStore[uid][key] = { chapter, level, score: Math.max(prev.score, score), completed: completed || prev.completed };
  res.json({ ok: true });
});

app.get('/api/progress/:uid', (req, res) => {
  res.json(Object.values(progressStore[req.params.uid] || {}));
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
