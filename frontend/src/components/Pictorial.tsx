import { useState, useEffect } from 'react';
import type { Question } from '../types';
import Feedback from './Feedback';

const API = 'http://localhost:3000/api';

interface Props { level: number; onLevels: () => void; onNextLevel: () => void; }

export default function Pictorial({ level, onLevels, onNextLevel }: Props) {
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
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.7; u.pitch = 1.3; speechSynthesis.speak(u);
  }

  function boxClick(idx: number) {
    const q = questions[qIndex];
    if ((q.hint || []).includes(idx)) return;
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
    // return previous letter
    const prev = newAns[box];
    let newUsed = usedIdx.filter(i => {
      if (prev && questions[qIndex].jumbled![i] === prev) return false;
      return true;
    });
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

  function next() { setFeedback(null); setQIndex(i => i + 1); }
  function prev() { setFeedback(null); setQIndex(i => Math.max(0, i - 1)); }

  if (!questions.length) return <div className="page-bg"><div className="page-title">Loading...</div></div>;

  const q = questions[qIndex];
  const isLast = qIndex >= questions.length - 1;
  const available = (q.jumbled || []).map((ch, i) => ({ ch, i })).filter(({ i }) => !usedIdx.includes(i));

  return (
    <div className="page-bg">
      <div className="progress-bar">Level {level} · Q {qIndex + 1}/{questions.length}</div>
      <img className="pic-image" src={`/images/${q.img}.png`} alt={q.word}
        onClick={() => speak(q.word!)}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      <div className="pic-tap-hint">👆 Tap image to hear!</div>
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
