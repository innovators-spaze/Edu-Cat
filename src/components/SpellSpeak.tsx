import { useState, useEffect, useRef } from 'react';
import Feedback from './Feedback';

// Levels 1-10: single letters, 11-30: words
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const WORDS = [
  'CAT','DOG','SUN','BUS','HAT','PIG','BEE','ANT','EGG','CUP',
  'BALL','FROG','DRUM','FISH','DUCK','CAKE','KITE','MILK','TREE','STAR',
  'APPLE','GRAPE','TIGER','CLOUD','TRAIN','ORANGE','FLOWER','CASTLE','ELEPHANT','UMBRELLA',
];

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface Props { level: number; onLevels: () => void; onNextLevel: () => void; onComplete: (score: number) => void; }

function buildQuestions(level: number) {
  if (level <= 10) {
    // Single letter pronunciation — 10 letters per level cycling through alphabet
    return Array.from({ length: 10 }, (_, i) => ({
      type: 'pronounce' as const,
      target: LETTERS[(((level - 1) * 10) + i) % 26],
    }));
  } else {
    // Word spelling — 10 words per level
    const start = ((level - 11) * 10) % WORDS.length;
    return Array.from({ length: 10 }, (_, i) => ({
      type: 'spell' as const,
      target: WORDS[(start + i) % WORDS.length],
    }));
  }
}

export default function SpellSpeak({ level, onLevels, onNextLevel, onComplete }: Props) {
  const [questions] = useState(() => buildQuestions(level));
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [hint, setHint] = useState('');
  const [spokenLetters, setSpokenLetters] = useState<string[]>([]);
  const recogRef = useRef<any>(null);

  const q = questions[qIndex];
  const isLast = qIndex >= questions.length - 1;

  useEffect(() => { resetQ(); }, [qIndex]);

  function resetQ() {
    setHeard(''); setAccuracy(null); setFeedback(null); setHint(''); setSpokenLetters([]);
  }

  function speak(text: string, rate = 0.8) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate; u.pitch = 1.3; u.volume = 1;
    speechSynthesis.speak(u);
  }

  function playTarget() {
    if (q.type === 'pronounce') speak(q.target, 0.7);
    else speak(q.target.split('').join('... '), 0.6);
  }

  function calcAccuracy(spoken: string, target: string): number {
    const s = spoken.toUpperCase().trim();
    const t = target.toUpperCase().trim();
    if (s === t) return 100;
    // Check if spoken contains the target
    if (s.includes(t)) return 90;
    // Letter-by-letter match for spell mode
    if (q.type === 'spell') {
      const spokenChars = s.replace(/\s+/g, '').split('');
      const targetChars = t.split('');
      let matches = 0;
      targetChars.forEach((ch, i) => { if (spokenChars[i] === ch) matches++; });
      return Math.round((matches / targetChars.length) * 100);
    }
    // Phonetic similarity for pronounce mode
    if (s.startsWith(t[0]) || t.startsWith(s[0])) return 60;
    return 20;
  }

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHint('🎤 Speech recognition not supported on this browser. Try Chrome!');
      return;
    }
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 3;
    recogRef.current = recog;

    recog.onstart = () => { setListening(true); setHint('🎤 Listening... speak now!'); };
    recog.onend = () => setListening(false);
    recog.onerror = (e: SpeechRecognitionErrorEvent) => {
      setListening(false);
      setHint(e.error === 'no-speech' ? '🔇 No speech detected. Try again!' : '❌ Mic error. Try again!');
    };
    recog.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setHeard(transcript);
      const acc = calcAccuracy(transcript, q.target);
      setAccuracy(acc);
      if (q.type === 'spell') {
        setSpokenLetters(transcript.toUpperCase().replace(/\s+/g, '').split(''));
      }
      const ok = acc >= 80;
      if (ok) {
        setScore(s => s + 1);
        speak('Awesome! Great job!', 1.1);
      } else {
        speak('Try again! You can do it!', 0.9);
        setHint(`💡 You said "${transcript}". Expected "${q.target}". Try again!`);
      }
      setTimeout(() => setFeedback(ok), 400);
    };
    recog.start();
  }

  function stopListening() {
    recogRef.current?.stop();
    setListening(false);
  }

  function next() {
    if (isLast) onComplete(score);
    setFeedback(null);
    setQIndex(i => i + 1);
  }

  function prev() {
    setFeedback(null);
    setQIndex(i => Math.max(0, i - 1));
  }

  return (
    <div className="page-bg spell-bg">
      <div className="progress-bar">Level {level} · Q {qIndex + 1}/{questions.length} · ⭐ {score}</div>

      <div className="spell-card">
        {q.type === 'pronounce' ? (
          <>
            <div className="spell-instruction">Say this letter out loud! 🗣️</div>
            <div className="spell-big-letter" onClick={playTarget}>{q.target}</div>
            <div className="spell-sub">{q.target.toLowerCase()} — tap to hear</div>
          </>
        ) : (
          <>
            <div className="spell-instruction">Spell this word letter by letter! 🔤</div>
            <div className="spell-word" onClick={playTarget}>{q.target}</div>
            <div className="spell-letters-row">
              {q.target.split('').map((ch, i) => (
                <div key={i} className={`spell-letter-box ${spokenLetters[i] === ch ? 'spell-correct-box' : spokenLetters[i] ? 'spell-wrong-box' : ''}`}>
                  {spokenLetters[i] || '_'}
                </div>
              ))}
            </div>
          </>
        )}

        {accuracy !== null && (
          <div className={`spell-accuracy ${accuracy >= 80 ? 'acc-good' : 'acc-bad'}`}>
            {accuracy >= 80 ? '✅' : '❌'} Accuracy: {accuracy}%
          </div>
        )}

        {heard && <div className="spell-heard">🎤 You said: "<strong>{heard}</strong>"</div>}
        {hint && <div className="spell-hint">{hint}</div>}
      </div>

      <div className="spell-btns">
        <button className="bubble play-btn" onClick={playTarget}>🔊 Hear it</button>
        <button
          className={`bubble mic-btn ${listening ? 'mic-active' : ''}`}
          onClick={listening ? stopListening : startListening}>
          {listening ? '⏹ Stop' : '🎤 Speak!'}
        </button>
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
