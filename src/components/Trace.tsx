import { useState, useEffect, useRef } from 'react';
import type { Question } from '../types';
import Feedback from './Feedback';

import { staticQuestions } from '../questions';

const API = '/api';

interface Props { level: number; onLevels: () => void; onNextLevel: () => void; onComplete: (score: number) => void; }

// AI-style feedback messages based on accuracy
function getTraceMessage(accuracy: number): { msg: string; emoji: string; ok: boolean } {
  if (accuracy >= 90) return { msg: 'Excellent tracing! 🌟', emoji: '🏆', ok: true };
  if (accuracy >= 75) return { msg: 'Great job! Keep it up! 👍', emoji: '⭐', ok: true };
  if (accuracy >= 55) return { msg: 'Good try! Trace more carefully!', emoji: '😊', ok: true };
  if (accuracy >= 35) return { msg: 'Try staying inside the line! ✏️', emoji: '🙂', ok: false };
  if (accuracy >= 15) return { msg: 'Follow the dotted letter shape!', emoji: '👆', ok: false };
  return { msg: 'Trace the full letter outline!', emoji: '✏️', ok: false };
}

export default function Trace({ level, onLevels, onNextLevel, onComplete }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [warn, setWarn] = useState('');
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [traceMsg, setTraceMsg] = useState<{ msg: string; emoji: string; ok: boolean } | null>(null);
  const [attempts, setAttempts] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokePixels = useRef(0);

  useEffect(() => {
    setQuestions(staticQuestions(2, level));
    setQIndex(0); setScore(0);
    fetch(`${API}/questions/2/${level}`)
      .then(r => r.json())
      .then(d => { if (d.questions?.length) setQuestions(d.questions); })
      .catch(() => {});
  }, [level]);

  useEffect(() => {
    if (questions.length) { drawGuide(); resetDraw(); }
  }, [qIndex, questions]);

  function resetDraw() {
    strokePixels.current = 0;
    setHasDrawn(false);
    setWarn('');
    setAccuracy(null);
    setTraceMsg(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawGuide() {
    const canvas = guideCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const letter = questions[qIndex]?.letter || '';
    ctx.save();
    ctx.font = `bold ${W * 0.72}px 'Comic Sans MS', cursive`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.setLineDash([8, 10]);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(168,85,247,0.4)';
    ctx.fillStyle = 'rgba(168,85,247,0.08)';
    ctx.fillText(letter, W / 2, H / 2);
    ctx.strokeText(letter, W / 2, H / 2);
    ctx.setLineDash([]);
    ctx.restore();
  }

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const r = canvas.getBoundingClientRect();
    const src = 'touches' in e ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * (canvas.width / r.width), y: (src.clientY - r.top) * (canvas.height / r.height) };
  }

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#ff6b9d'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    drawing.current = true; setHasDrawn(true);
    const p = getPos(e, canvas); ctx.beginPath(); ctx.moveTo(p.x, p.y);
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const p = getPos(e, canvas);
    ctx.lineTo(p.x, p.y); ctx.stroke();
    strokePixels.current += 1;
  }

  function onUp() { drawing.current = false; }

  function calcAccuracy(): number {
    const userCanvas = canvasRef.current;
    const guideCanvas = guideCanvasRef.current;
    if (!userCanvas || !guideCanvas) return 0;

    const W = userCanvas.width, H = userCanvas.height;
    const userData = userCanvas.getContext('2d')!.getImageData(0, 0, W, H).data;
    const guideData = guideCanvas.getContext('2d')!.getImageData(0, 0, W, H).data;

    let guidePixels = 0, overlap = 0, outsideStrokes = 0, totalUserPixels = 0;

    for (let i = 3; i < userData.length; i += 4) {
      const userAlpha = userData[i];
      const guideAlpha = guideData[i];
      if (userAlpha > 20) {
        totalUserPixels++;
        if (guideAlpha > 10) overlap++;
        else outsideStrokes++;
      }
      if (guideAlpha > 20) guidePixels++;
    }

    if (guidePixels === 0 || totalUserPixels === 0) return 0;

    // Coverage: how much of the guide letter was traced
    const coverage = Math.min(overlap / guidePixels, 1);
    // Neatness: how much of user strokes are inside the guide
    const neatness = totalUserPixels > 0 ? Math.max(0, 1 - (outsideStrokes / totalUserPixels)) : 0;
    // Combined score weighted: 60% coverage + 40% neatness
    return Math.round((coverage * 0.6 + neatness * 0.4) * 100);
  }

  function submit() {
    if (!hasDrawn || strokePixels.current < 20) {
      setWarn('✏️ Please trace the letter first!');
      return;
    }
    setWarn('');
    const acc = calcAccuracy();
    setAccuracy(acc);
    const result = getTraceMessage(acc);
    setTraceMsg(result);
    setAttempts(a => a + 1);

    if (result.ok) {
      setScore(s => s + 1);
      setTimeout(() => setFeedback(true), 600);
    } else {
      // Don't show full feedback overlay — just show message and let retry
      setTimeout(() => {
        if (attempts >= 2) {
          // After 3 failed attempts, move on anyway
          setTimeout(() => setFeedback(false), 400);
        }
      }, 100);
    }
  }

  function retry() {
    resetDraw();
    drawGuide();
  }

  function next() { if (qIndex >= questions.length - 1) onComplete(score); setFeedback(null); setQIndex(i => i + 1); setAttempts(0); }
  function prev() { setFeedback(null); setQIndex(i => Math.max(0, i - 1)); setAttempts(0); }

  if (!questions.length) return (
    <div className="page-bg">
      <div className="loading-box">
        <div className="loading-cat">🐱</div>
        <div className="loading-text">Loading... ⏳</div>
      </div>
    </div>
  );

  const isLast = qIndex >= questions.length - 1;
  const letter = questions[qIndex]?.letter || '';

  return (
    <div className="page-bg">
      <div className="progress-bar">Level {level} · Q {qIndex + 1}/{questions.length} · ⭐ {score}</div>

      <div className="trace-header">
        <div className="trace-letter-display">{letter}</div>
        <div className="trace-instruction">
          {warn ? <span className="trace-warn">{warn}</span> : `Trace the letter: ${letter}`}
        </div>
      </div>

      {/* Accuracy feedback card */}
      {traceMsg && (
        <div className={`trace-feedback-card ${traceMsg.ok ? 'trace-fb-good' : 'trace-fb-bad'}`}>
          <span className="trace-fb-emoji">{traceMsg.emoji}</span>
          <span className="trace-fb-msg">{traceMsg.msg}</span>
          {accuracy !== null && (
            <div className="trace-accuracy-bar">
              <div className="trace-accuracy-fill" style={{ width: `${accuracy}%`, background: accuracy >= 55 ? '#22c55e' : accuracy >= 35 ? '#f97316' : '#ef4444' }} />
              <span className="trace-accuracy-label">{accuracy}% accuracy</span>
            </div>
          )}
          {!traceMsg.ok && attempts < 3 && (
            <button className="bubble trace-retry-btn" onClick={retry}>🔄 Try Again</button>
          )}
        </div>
      )}

      <div className="trace-container">
        <canvas ref={guideCanvasRef} width={300} height={300} className="trace-canvas trace-guide" />
        <canvas ref={canvasRef} width={300} height={300} className="trace-canvas trace-draw"
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />
      </div>

      <div className="trace-btns">
        <button className="bubble trace-clear-btn" onClick={retry}>🗑 Clear</button>
        <button className="bubble submit-btn" onClick={submit} disabled={!!traceMsg && traceMsg.ok}>✅ Done</button>
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
