const express = require('express');
const cors = require('cors');
const path = require('path');
const { generateChapter1, generateChapter2, generateChapter3 } = require('./generate-questions');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

const QUESTIONS = {
  1: generateChapter1(),
  2: generateChapter2(),
  3: generateChapter3()
};

const progressStore = {};

app.get('/api/questions/:chapter/:level', (req, res) => {
  const chapter = parseInt(req.params.chapter);
  const level = parseInt(req.params.level);
  if (!QUESTIONS[chapter] || !QUESTIONS[chapter][level - 1])
    return res.status(404).json({ error: 'Not found' });
  res.json(QUESTIONS[chapter][level - 1]);
});

app.post('/api/progress', (req, res) => {
  const { uid, chapter, level, score, completed } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid required' });
  if (!progressStore[uid]) progressStore[uid] = {};
  const key = `${chapter}_${level}`;
  const prev = progressStore[uid][key] || { score: 0, completed: false };
  progressStore[uid][key] = {
    chapter, level,
    score: Math.max(prev.score, score),
    completed: completed || prev.completed
  };
  res.json({ ok: true });
});

app.get('/api/progress/:uid', (req, res) => {
  res.json(Object.values(progressStore[req.params.uid] || {}));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Phonics Fun server running on http://localhost:${PORT}`));
