import { useState, useEffect } from 'react';
import type { Question } from '../types';
import Feedback from './Feedback';

const API = '/api';

// Emoji map for all picture words used in backend
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

interface Props { level: number; onLevels: () => void; onNextLevel: () => void; onComplete: () => void; }

export default function Pictorial({ level, onLevels, onNextLevel, onComplete }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState<string[]>([]);
  const [usedIdx, setUsedIdx] = useState<number[]>([]);
  const [selectedBox, setSelectedBox] = useState(-1);
  const [feedback, setFeedback] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API}/questions/3/${level}`)
      .then(r => r.json())
      .then(d => { setQuestions(d.questions); setQIndex(0); setScore(0); });
  }, [level]);

  useEffect(() => {
    if (!questions.length) return;
    const q = questions[qIndex];
    const ans = Array(q.word!.length).fill('');
    (q.hint || []).forEach(i => { ans[i] = q.word![i]; });
    setAnswer(ans); setUsedIdx([]); setSelectedBox(-1);
  }, [qIndex, questions]);

  function speak(word: string) {
    const u = new SpeechSynthesisUtterance(word.toLowerCase());
    u.rate = 0.7; u.pitch = 1.3; speechSynthesis.speak(u);
  }

  function boxClick(idx: number) {
    const q = questions[qIndex];
    if ((q.hint || []).includes(idx)) return;
    // If box already has a letter, remove it back to jumbled
    if (answer[idx]) {
      const newAns = [...answer];
      const removedLetter = newAns[idx];
      newAns[idx] = '';
      // find the used index for this letter and unmark it
      const usedI = usedIdx.find(i => questions[qIndex].jumbled![i] === removedLetter);
      setUsedIdx(usedIdx.filter(i => i !== usedI));
      setAnswer(newAns);
      setSelectedBox(idx);
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
    // If box already filled, return that letter to pool
    const prev = newAns[box];
    let newUsed = prev
      ? usedIdx.filter(i => !(questions[qIndex].jumbled![i] === prev && !newUsed?.includes(i)))
      : [...usedIdx];
    newUsed = usedIdx.filter(i => !(newAns[box] && questions[qIndex].jumbled![i] === newAns[box]));
    newAns[box] = ch;
    newUsed = [...newUsed, li];
    setAnswer(newAns); setUsedIdx(newUsed); setSelectedBox(-1);
  }

  function submit() {
    const q = questions[qIndex];
    const ok = answer.join('') === q.word;
    if (ok) setScore(s => s + 1);
    setFeedback(ok);
  }

  function next() { if (qIndex >= questions.length - 1) onComplete(); setFeedback(null); setQIndex(i => i + 1); }
  function prev() { setFeedback(null); setQIndex(i => Math.max(0, i - 1)); }

  if (!questions.length) return <div className="page-bg"><div className="page-title">Loading... ⏳</div></div>;

  const q = questions[qIndex];
  const isLast = qIndex >= questions.length - 1;
  const available = (q.jumbled || []).map((ch, i) => ({ ch, i })).filter(({ i }) => !usedIdx.includes(i));
  const emoji = EMOJI[q.img?.toLowerCase() || ''] || '🖼️';

  return (
    <div className="page-bg">
      <div className="progress-bar">Level {level} · Q {qIndex + 1}/{questions.length} · ⭐ {score}</div>

      <button className="pic-emoji-btn bubble" onClick={() => speak(q.word!)}>
        <span className="pic-emoji">{emoji}</span>
        <span className="pic-tap-hint">👆 Tap to hear!</span>
      </button>

      <div className="pic-boxes">
        {answer.map((ch, i) => {
          const isHint = (q.hint || []).includes(i);
          return (
            <div key={i}
              className={`pic-box ${ch ? 'filled' : ''} ${isHint ? 'hint' : ''} ${selectedBox === i ? 'selected' : ''}`}
              onClick={() => boxClick(i)}>
              {ch}
            </div>
          );
        })}
      </div>

      <div className="pic-letters">
        {available.map(({ ch, i }) => (
          <button key={i} className="bubble pic-letter-btn" onClick={() => letterClick(ch, i)}>{ch}</button>
        ))}
      </div>

      <button className="bubble submit-btn" onClick={submit}>✅ Submit</button>

      {feedback !== null && (
        <Feedback correct={feedback} qIndex={qIndex} totalQ={questions.length}
          onNext={next} onPrev={prev} onLevels={onLevels}
          isLast={isLast} score={score} onNextLevel={onNextLevel} />
      )}
      <button className="bubble back-btn" onClick={onLevels}>◀ Levels</button>
    </div>
  );
}
