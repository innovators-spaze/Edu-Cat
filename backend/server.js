const express = require('express');
const cors = require('cors');
const path = require('path');
const Groq = require('groq-sdk');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Static fallback question generator ───────────────────────────────────────
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
  {word:'MAP',img:'map',hint:[]},{word:'NET',img:'net',hint:[]},
  {word:'OWL',img:'owl',hint:[]},{word:'PEN',img:'pen',hint:[]},
  {word:'RAT',img:'rat',hint:[]},{word:'TOP',img:'top',hint:[]},
  {word:'VAN',img:'van',hint:[]},{word:'WEB',img:'web',hint:[]},
  {word:'FOX',img:'fox',hint:[]},{word:'MUD',img:'mud',hint:[]},
  {word:'ZIP',img:'zip',hint:[]},{word:'YAK',img:'yak',hint:[]},
  {word:'FROG',img:'frog',hint:[0,3]},{word:'DRUM',img:'drum',hint:[0,3]},
  {word:'CRAB',img:'crab',hint:[0,3]},{word:'STAR',img:'star',hint:[0,3]},
  {word:'SHIP',img:'ship',hint:[0,3]},{word:'FISH',img:'fish',hint:[0,3]},
  {word:'ELEPHANT',img:'elephant',hint:[0,2,4,6,7]},
  {word:'APPLE',img:'apple',hint:[0,4]},
  {word:'ORANGE',img:'orange',hint:[0,2,5]},
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
    const pool = shuffle(LETTERS);
    for (let q = 0; q < 10; q++) {
      const letter = pool[q % 26];
      const wrong = shuffle(LETTERS.filter(l => l !== letter)).slice(0, 3);
      const qtype = q % 3;
      if (qtype === 0) {
        questions.push({ type: 'sound_from_letter', letter, options: shuffle([letter, ...wrong]), correct: letter });
      } else if (qtype === 1) {
        questions.push({ type: 'letter_from_sound', letter, options: shuffle([letter, ...wrong]), correct: letter });
      } else {
        questions.push({ type: 'match_letter_sound', pairs: shuffle(LETTERS).slice(0, 5) });
      }
    }
  } else if (chapter === 2) {
    const all = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), ...'abcdefghijklmnopqrstuvwxyz'.split('')];
    for (let q = 0; q < 10; q++) {
      questions.push({ type: 'trace', letter: all[((level - 1) * 10 + q) % all.length] });
    }
  } else {
    for (let q = 0; q < 10; q++) {
      const w = PICTURE_WORDS[((level - 1) * 10 + q) % PICTURE_WORDS.length];
      const usePartial = level >= 15 && w.hint.length > 0;
      questions.push({ type: usePartial ? 'pictorial_partial' : 'pictorial_full', word: w.word, img: w.img, jumbled: shuffle(w.word.split('')), hint: usePartial ? w.hint : [] });
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

  // Return cached if available
  if (cache.has(key)) return res.json(cache.get(key));

  try {
    // Try Groq AI first
    if (process.env.GROQ_API_KEY) {
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
