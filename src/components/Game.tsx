import { useState, useEffect } from 'react';
import type { Question } from '../types';
import Feedback from './Feedback';

const API = '/api';

interface Props {
  chapter: number;
  level: number;
  onLevels: () => void;
  onNextLevel: () => void;
  onComplete: (score: number) => void;
}

export default function Game({ chapter, level, onLevels, onNextLevel, onComplete }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [wrongChosen, setWrongChosen] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${API}/questions/${chapter}/${level}`)
      .then(r => r.json())
      .then(d => { setQuestions(d.questions); setQIndex(0); setScore(0); setChosen(null); setWrongChosen(null); setFeedback(null); });
  }, [chapter, level]);

  function speak(text: string) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.8; u.pitch = 1.2;
    speechSynthesis.speak(u);
  }

  function selectOpt(opt: string, correct: string) {
    if (chosen) return; // already answered correctly
    const ok = opt === correct;
    if (ok) {
      setChosen(opt);
      setScore(s => s + 1);
      setTimeout(() => setFeedback(true), 300);
    } else {
      // Show red shake, then clear so they can retry
      setWrongChosen(opt);
      setTimeout(() => setWrongChosen(null), 700);
    }
  }

  function next() {
    if (qIndex >= questions.length - 1) onComplete(score);
    setFeedback(null); setChosen(null); setWrongChosen(null);
    setQIndex(i => i + 1);
  }

  function prev() {
    setFeedback(null); setChosen(null); setWrongChosen(null);
    setQIndex(i => Math.max(0, i - 1));
  }

  if (!questions.length) return <div className="page-bg"><div className="page-title">Loading... ⏳</div></div>;

  const q = questions[qIndex];
  const isLast = qIndex >= questions.length - 1;

  function optClass(opt: string) {
    if (chosen === opt) return 'correct';
    if (wrongChosen === opt) return 'wrong shake';
    return '';
  }

  return (
    <div className="page-bg">
      <div className="progress-bar">Level {level} · Q {qIndex + 1}/{questions.length} · ⭐ {score}</div>
      <div className="game-area">
        {q.type === 'sound_from_letter' && (
          <>
            <div className="q-label">Which sound does this letter make?</div>
            <div className="big-letter">{q.letter}{q.letter?.toLowerCase()}</div>
            <div className="options-grid">
              {q.options?.map(opt => (
                <button key={opt}
                  className={`bubble opt-btn ${optClass(opt)}`}
                  onClick={() => selectOpt(opt, q.correct!)}
                  disabled={!!chosen}>
                  <span className="speaker-icon" onClick={e => { e.stopPropagation(); speak(opt); }}>🔊</span>
                  <span className="opt-letter">{opt}{opt.toLowerCase()}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {q.type === 'letter_from_sound' && (
          <>
            <div className="q-label">Hear the sound and pick the correct letter!</div>
            <button className="bubble play-btn" onClick={() => speak(q.letter!)}>🔊 Play Sound</button>
            <div className="options-grid">
              {q.options?.map(opt => (
                <button key={opt}
                  className={`bubble opt-btn ${optClass(opt)}`}
                  onClick={() => selectOpt(opt, q.correct!)}
                  disabled={!!chosen}>
                  {opt}{opt.toLowerCase()}
                </button>
              ))}
            </div>
          </>
        )}
        {q.type === 'match_letter_sound' && (
          <>
            <div className="q-label">Match each letter to its sound!</div>
            <div className="match-table">
              <div className="match-col">
                {q.pairs?.map(l => <div key={l} className="match-letter bubble">{l}{l.toLowerCase()}</div>)}
              </div>
              <div className="match-col">
                {q.pairs?.map(l => (
                  <button key={l} className="bubble match-sound" onClick={() => speak(l)}>🔊</button>
                ))}
              </div>
            </div>
            <button className="bubble submit-btn" onClick={() => { setScore(s => s + 1); setFeedback(true); }}>Submit ✅</button>
          </>
        )}
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
