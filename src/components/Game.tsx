import { useState, useEffect } from 'react';
import type { Question } from '../types';
import Feedback from './Feedback';

import { staticQuestions } from '../questions';

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
  const [loading, setLoading] = useState(true);

  // Match state
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<string | null>(null);
  const [shuffledSounds, setShuffledSounds] = useState<string[]>([]);

  useEffect(() => {
    // Load instantly from static generator
    setQuestions(staticQuestions(chapter, level));
    setQIndex(0); setScore(0);
    setChosen(null); setWrongChosen(null); setFeedback(null);
    setLoading(false);
    // Only upgrade with AI for chapters 2 and 3, not chapter 1
    // Chapter 1 uses static questions to avoid match sound button issues
    if (chapter !== 1) {
      fetch(`${API}/questions/${chapter}/${level}`)
        .then(r => r.json())
        .then(d => { if (d.questions?.length) setQuestions(d.questions); })
        .catch(() => {});
    }
  }, [chapter, level]);

  useEffect(() => {
    setSelectedLetter(null); setMatched([]); setWrongPair(null);
    const q = questions[qIndex];
    if (q?.pairs) setShuffledSounds(shuffle([...q.pairs]));
  }, [qIndex, questions]);

  function speak(text: string) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.7; u.pitch = 1.3;
    speechSynthesis.speak(u);
  }

  function selectOpt(opt: string, correct: string) {
    if (chosen) return;
    const ok = opt === correct;
    if (ok) {
      setChosen(opt);
      setScore(s => s + 1);
      speak('Correct!');
      setTimeout(() => setFeedback(true), 300);
    } else {
      setWrongChosen(opt);
      speak('Try again!');
      setTimeout(() => setWrongChosen(null), 700);
    }
  }

  function matchLetterClick(letter: string) {
    speak(letter);
    setSelectedLetter(letter);
  }

  function matchSoundClick(letter: string) {
    if (!selectedLetter) { speak(letter); return; }
    if (selectedLetter === letter) {
      // Correct match
      const newMatched = [...matched, letter];
      setMatched(newMatched);
      setSelectedLetter(null);
      speak('Correct!');
      // All matched — auto submit as correct
      if (newMatched.length === questions[qIndex].pairs?.length) {
        setScore(s => s + 1);
        setTimeout(() => setFeedback(true), 500);
      }
    } else {
      // Wrong match
      setWrongPair(letter);
      speak('Try again!');
      setTimeout(() => { setWrongPair(null); setSelectedLetter(null); }, 700);
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

  if (loading) return (
    <div className="page-bg">
      <div className="loading-box">
        <div className="loading-cat">🐱</div>
        <div className="loading-text">Loading questions... ⏳</div>
      </div>
    </div>
  );

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
            <div className="q-label">🔊 Which sound does this letter make?</div>
            <div className="big-letter" onClick={() => speak(q.letter!)}>{q.letter}{q.letter?.toLowerCase()}</div>
            <div className="q-sublabel">👆 Tap letter to hear it</div>
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
            <div className="q-label">👂 Hear the sound — pick the correct letter!</div>
            <button className="bubble play-btn" onClick={() => speak(q.letter!)}>
              🔊 Play Sound
            </button>
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
            <div className="q-label">🔗 Tap a letter, then tap its matching sound!</div>
            <div className="match-table">
              <div className="match-col">
                <div className="match-col-label">Letters</div>
                {q.pairs?.map(l => (
                  <button key={l}
                    className={`bubble match-letter ${selectedLetter === l ? 'match-selected' : ''} ${matched.includes(l) ? 'match-done' : ''}`}
                    onClick={() => !matched.includes(l) && matchLetterClick(l)}
                    disabled={matched.includes(l)}>
                    {l}{l.toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="match-col">
                <div className="match-col-label">Sounds 🔊</div>
                {shuffledSounds.map(l => (
                  <button key={l}
                    className={`bubble match-sound ${matched.includes(l) ? 'match-done' : ''} ${wrongPair === l ? 'wrong shake' : ''}`}
                    onClick={() => !matched.includes(l) && matchSoundClick(l)}
                    disabled={matched.includes(l)}>
                    <span style={{fontSize:'1.6rem'}}>🔊</span>
                  </button>
                ))}
              </div>
            </div>
            {selectedLetter && <div className="match-hint">Now tap the 🔊 sound for <strong>{selectedLetter}</strong></div>}
            {matched.length > 0 && matched.length < (q.pairs?.length || 0) && (
              <div className="match-progress">{matched.length}/{q.pairs?.length} matched ✅</div>
            )}
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
