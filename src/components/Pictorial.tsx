import { useState, useEffect } from 'react';
import type { Question } from '../types';
import Feedback from './Feedback';

import { staticQuestions } from '../questions';

const API = '/api';

const EMOJI: Record<string, string> = {
  cat:'🐱', dog:'🐶', sun:'☀️', bus:'🚌', cup:'☕', hat:'🎩', pig:'🐷', hen:'🐔',
  ant:'🐜', bee:'🐝', cow:'🐄', egg:'🥚', fan:'🌀', jar:'🫙', map:'🗺️', net:'🥅',
  owl:'🦉', pen:'🖊️', rat:'🐀', top:'🪀', van:'🚐', web:'🕸️', fox:'🦊', mud:'💧',
  zip:'🤐', yak:'🦬', key:'🔑', log:'🪵',
  ball:'⚽', frog:'🐸', drum:'🥁', crab:'🦀', star:'⭐', ship:'🚢', fish:'🐟',
  duck:'🦆', cake:'🎂', kite:'🪁', lamp:'💡', milk:'🥛', nest:'🪺', pond:'🏞️',
  ring:'💍', sock:'🧦', tree:'🌳', wolf:'🐺', yarn:'🧶', zinc:'⚗️',
  apple:'🍎', grape:'🍇', tiger:'🐯', camel:'🐪', plant:'🌱', cloud:'☁️',
  bread:'🍞', chair:'🪑', train:'🚂', globe:'🌍', orange:'🍊', bridge:'🌉',
  castle:'🏰', flower:'🌸', garden:'🌻', hammer:'🔨', island:'🏝️', jungle:'🌴',
  elephant:'🐘', umbrella:'☂️',
};

interface Props { level: number; onLevels: () => void; onNextLevel: () => void; onComplete: (score: number) => void; }

export default function Pictorial({ level, onLevels, onNextLevel, onComplete }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const [usedIdx, setUsedIdx] = useState<number[]>([]);
  const [selectedBox, setSelectedBox] = useState(-1);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [wrongBoxes, setWrongBoxes] = useState<number[]>([]);
  const [emojiPop, setEmojiPop] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    setQuestions(staticQuestions(3, level));
    setQIndex(0); setScore(0);
    fetch(`${API}/questions/3/${level}`)
      .then(r => r.json())
      .then(d => { if (d.questions?.length) setQuestions(d.questions); })
      .catch(() => {});
  }, [level]);

  useEffect(() => {
    if (!questions.length) return;
    const q = questions[qIndex];
    const ans = Array(q.word!.length).fill('');
    (q.hint || []).forEach(i => { ans[i] = q.word![i]; });
    setAnswer(ans);
    setUsedIdx([]);
    setSelectedBox(-1);
    setWrongBoxes([]);
    setHintsRevealed(0);
    // Auto-pronounce on load
    setTimeout(() => speak(q.word!), 500);
  }, [qIndex, questions]);

  function speak(word: string) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word.toLowerCase());
    u.rate = 0.7; u.pitch = 1.3;
    speechSynthesis.speak(u);
    setEmojiPop(true);
    setTimeout(() => setEmojiPop(false), 600);
  }

  function boxClick(idx: number) {
    const q = questions[qIndex];
    if ((q.hint || []).includes(idx)) return;
    if (answer[idx]) {
      const newAns = [...answer];
      const removedLetter = newAns[idx];
      newAns[idx] = '';
      const usedI = usedIdx.find(i => questions[qIndex].jumbled![i] === removedLetter);
      setUsedIdx(usedIdx.filter(i => i !== usedI));
      setAnswer(newAns);
      setSelectedBox(idx);
      setWrongBoxes(wrongBoxes.filter(w => w !== idx));
      return;
    }
    setSelectedBox(idx);
  }

  function letterClick(ch: string, li: number) {
    let box = selectedBox;
    if (box === -1) {
      const q = questions[qIndex];
      box = answer.findIndex((v, i) => !v && !(q.hint || []).includes(i));
      if (box === -1) return;
    }
    const q = questions[qIndex];
    if ((q.hint || []).includes(box)) return;
    const newAns = [...answer];
    const prev = newAns[box];
    let newUsed: number[] = prev
      ? usedIdx.filter(i => questions[qIndex].jumbled![i] !== prev)
      : [...usedIdx];
    newAns[box] = ch;
    newUsed = [...newUsed, li];
    setAnswer(newAns);
    setUsedIdx(newUsed);
    setSelectedBox(-1);
    setWrongBoxes(wrongBoxes.filter(w => w !== box));
  }

  function revealHint() {
    const q = questions[qIndex];
    // Find first empty non-hint box and fill it
    const idx = answer.findIndex((v, i) => !v && !(q.hint || []).includes(i));
    if (idx === -1) return;
    const correctLetter = q.word![idx];
    // Find this letter in jumbled that's not used
    const jumbledIdx = (q.jumbled || []).findIndex((ch, i) => ch === correctLetter && !usedIdx.includes(i));
    if (jumbledIdx === -1) return;
    const newAns = [...answer];
    newAns[idx] = correctLetter;
    setAnswer(newAns);
    setUsedIdx([...usedIdx, jumbledIdx]);
    setHintsRevealed(h => h + 1);
  }

  function submit() {
    const q = questions[qIndex];
    const ok = answer.join('') === q.word;
    if (ok) {
      setScore(s => s + 1);
      speak(q.word!);
    } else {
      // Highlight wrong boxes
      const wrong = answer.map((ch, i) => ch !== q.word![i] ? i : -1).filter(i => i !== -1);
      setWrongBoxes(wrong);
      // Speak hint
      const u = new SpeechSynthesisUtterance('Try again! Check the highlighted letters.');
      u.pitch = 1.2; u.rate = 0.9;
      speechSynthesis.speak(u);
    }
    setFeedback(ok);
  }

  function next() { if (qIndex >= questions.length - 1) onComplete(score); setFeedback(null); setQIndex(i => i + 1); }
  function prev() { setFeedback(null); setQIndex(i => Math.max(0, i - 1)); }

  if (loading) return (
    <div className="page-bg">
      <div className="loading-box">
        <div className="loading-cat">🐱</div>
        <div className="loading-text">Loading... ⏳</div>
      </div>
    </div>
  );

  const q = questions[qIndex];
  const isLast = qIndex >= questions.length - 1;
  const available = (q.jumbled || []).map((ch, i) => ({ ch, i })).filter(({ i }) => !usedIdx.includes(i));
  const emoji = EMOJI[q.img?.toLowerCase() || ''] || '🖼️';
  const allFilled = answer.every(ch => ch !== '');

  return (
    <div className="page-bg">
      <div className="progress-bar">Level {level} · Q {qIndex + 1}/{questions.length} · ⭐ {score}</div>

      {/* Animated emoji image */}
      <button className={`pic-emoji-btn bubble ${emojiPop ? 'emoji-pop' : ''}`} onClick={() => speak(q.word!)}>
        <span className="pic-emoji">{emoji}</span>
        <span className="pic-tap-hint">👆 Tap to hear!</span>
      </button>

      {/* Answer boxes */}
      <div className="pic-boxes">
        {answer.map((ch, i) => {
          const isHint = (q.hint || []).includes(i);
          const isWrong = wrongBoxes.includes(i);
          return (
            <div key={i}
              className={`pic-box ${ch ? 'filled' : ''} ${isHint ? 'hint' : ''} ${selectedBox === i ? 'selected' : ''} ${isWrong ? 'pic-wrong' : ''}`}
              onClick={() => boxClick(i)}>
              {ch}
            </div>
          );
        })}
      </div>

      {wrongBoxes.length > 0 && (
        <div className="pic-wrong-hint">❌ Red boxes are wrong — tap them to remove!</div>
      )}

      {/* Jumbled letters */}
      <div className="pic-letters">
        {available.map(({ ch, i }) => (
          <button key={i} className="bubble pic-letter-btn" onClick={() => letterClick(ch, i)}>{ch}</button>
        ))}
      </div>

      <div className="pic-action-row">
        {hintsRevealed < 2 && !allFilled && (
          <button className="bubble pic-hint-btn" onClick={revealHint}>💡 Hint ({2 - hintsRevealed} left)</button>
        )}
        <button className="bubble submit-btn" onClick={submit} disabled={!allFilled}>✅ Submit</button>
      </div>

      {feedback !== null && (
        <Feedback correct={feedback} qIndex={qIndex} totalQ={questions.length}
          onNext={next} onPrev={prev} onLevels={onLevels}
          isLast={isLast} score={score} onNextLevel={onNextLevel} />
      )}
      <button className="bubble back-btn" onClick={onLevels}>◀ Levels</button>
    </div>
  );
}
