import { useState, useEffect, useRef } from 'react';
import type { Question } from '../types';
import Feedback from './Feedback';

const API = '/api';

interface Props { level: number; onLevels: () => void; onNextLevel: () => void; onComplete: () => void; }

export default function Trace({ level, onLevels, onNextLevel, onComplete }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [warn, setWarn] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokePixels = useRef(0);

  useEffect(() => {
    fetch(`${API}/questions/2/${level}`)
      .then(r => r.json())
      .then(d => { setQuestions(d.questions); setQIndex(0); setScore(0); });
  }, [level]);

  useEffect(() => {
    if (questions.length) { drawGuide(); resetDraw(); }
  }, [qIndex, questions]);

  function resetDraw() {
    strokePixels.current = 0;
    setHasDrawn(false);
    setWarn('');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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

  function submit() {
    if (!hasDrawn || strokePixels.current < 30) {
      setWarn('✏️ Please trace the letter properly!');
      return;
    }
    // Check pixel overlap between user drawing and guide letter
    const userCanvas = canvasRef.current;
    const guideCanvas = guideCanvasRef.current;
    if (!userCanvas || !guideCanvas) return;

    const W = userCanvas.width, H = userCanvas.height;
    const userCtx = userCanvas.getContext('2d')!;
    const guideCtx = guideCanvas.getContext('2d')!;
    const userData = userCtx.getImageData(0, 0, W, H).data;
    const guideData = guideCtx.getImageData(0, 0, W, H).data;

    let guidePixels = 0, overlap = 0;
    for (let i = 3; i < userData.length; i += 4) {
      const userAlpha = userData[i];
      const guideAlpha = guideData[i];
      if (guideAlpha > 20) { guidePixels++; if (userAlpha > 20) overlap++; }
    }

    const coverageRatio = guidePixels > 0 ? overlap / guidePixels : 0;
    const ok = coverageRatio >= 0.08 || strokePixels.current >= 80; // lenient for kids

    if (ok) setScore(s => s + 1);
    else setWarn('✏️ Try to trace the letter more carefully!');
    setFeedback(ok);
  }

  function clear() { drawGuide(); resetDraw(); }

  function next() { if (qIndex >= questions.length - 1) onComplete(); setFeedback(null); setQIndex(i => i + 1); }
  function prev() { setFeedback(null); setQIndex(i => Math.max(0, i - 1)); }

  if (!questions.length) return <div className="page-bg"><div className="page-title">Loading... ⏳</div></div>;

  const isLast = qIndex >= questions.length - 1;
  const letter = questions[qIndex]?.letter || '';

  return (
    <div className="page-bg">
      <div className="progress-bar">Level {level} · Q {qIndex + 1}/{questions.length} · ⭐ {score}</div>
      <div className={`trace-letter-label ${warn ? 'error' : ''}`}>
        {warn || `Trace the letter: ${letter}`}
      </div>
      <div className="trace-container">
        {/* Guide layer (bottom) */}
        <canvas ref={guideCanvasRef} width={300} height={300} className="trace-canvas trace-guide" />
        {/* Drawing layer (top) */}
        <canvas ref={canvasRef} width={300} height={300} className="trace-canvas trace-draw"
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
