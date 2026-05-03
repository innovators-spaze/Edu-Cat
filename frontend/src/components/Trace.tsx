import { useState, useEffect, useRef } from 'react';
import type { Question } from '../types';
import Feedback from './Feedback';

const API = '/api';

interface Props { level: number; onLevels: () => void; onNextLevel: () => void; }

export default function Trace({ level, onLevels, onNextLevel }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [warn, setWarn] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    fetch(`${API}/questions/2/${level}`)
      .then(r => r.json())
      .then(d => { setQuestions(d.questions); setQIndex(0); setScore(0); });
  }, [level]);

  useEffect(() => {
    if (questions.length) drawGuide();
  }, [qIndex, questions]);

  function drawGuide() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const letter = questions[qIndex]?.letter || '';
    ctx.save();
    ctx.font = `bold ${W * 0.72}px 'Comic Sans MS', cursive`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.setLineDash([8, 10]);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(168,85,247,0.35)';
    ctx.fillStyle = 'rgba(168,85,247,0.07)';
    ctx.fillText(letter, W / 2, H / 2);
    ctx.strokeText(letter, W / 2, H / 2);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(251,191,36,0.85)';
    ctx.font = '22px serif';
    ctx.fillText('👆 Start here', W * 0.1, H * 0.12);
    ctx.restore();
    setHasDrawn(false); setWarn('');
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
    ctx.strokeStyle = '#ff6b9d'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    drawing.current = true; setHasDrawn(true);
    const p = getPos(e, canvas); ctx.beginPath(); ctx.moveTo(p.x, p.y);
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const p = getPos(e, canvas); ctx.lineTo(p.x, p.y); ctx.stroke();
  }

  function onUp() { drawing.current = false; }

  function submit() {
    if (!hasDrawn) { setWarn('✏️ Please trace the letter first!'); return; }
    setScore(s => s + 1); setFeedback(true);
  }

  function clear() { drawGuide(); }

  function next() { setFeedback(null); setQIndex(i => i + 1); }
  function prev() { setFeedback(null); setQIndex(i => Math.max(0, i - 1)); }

  if (!questions.length) return <div className="page-bg"><div className="page-title">Loading...</div></div>;

  const isLast = qIndex >= questions.length - 1;

  return (
    <div className="page-bg">
      <div className="progress-bar">Level {level} · Q {qIndex + 1}/{questions.length}</div>
      <div className={`trace-letter-label ${warn ? 'error' : ''}`}>
        {warn || `Trace the letter: ${questions[qIndex]?.letter}`}
      </div>
      <div className="trace-container">
        <canvas ref={canvasRef} width={300} height={300} className="trace-canvas"
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp} />
      </div>
      <div className="trace-btns">
        <button className="bubble trace-clear-btn" onClick={clear}>🗑 Clear</button>
        <button className="bubble submit-btn" onClick={submit}>✅ Done</button>
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
