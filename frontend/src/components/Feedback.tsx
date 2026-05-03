import { useEffect } from 'react';

interface Props {
  correct: boolean;
  qIndex: number;
  totalQ: number;
  onNext: () => void;
  onPrev: () => void;
  onLevels: () => void;
  isLast: boolean;
  score: number;
  onNextLevel?: () => void;
}

export default function Feedback({ correct, qIndex, onNext, onPrev, onLevels, isLast, score, onNextLevel }: Props) {
  useEffect(() => {
    const u = new SpeechSynthesisUtterance(correct ? 'Awesome!' : 'Wrong! Try again!');
    u.pitch = correct ? 1.5 : 0.8; u.rate = 0.9;
    speechSynthesis.speak(u);
  }, []);

  const emojis = ['🍬','🍭','🍫','🍡','🍩','🌟','⭐','✨','🎊','🎈'];

  return (
    <div className={`feedback-overlay ${correct ? 'correct' : 'wrong'}`}>
      {correct ? (
        <>
          <div className="feedback-msg awesome-msg">
            {isLast ? `🏆 Level Complete! Score: ${score}/10` : '🎉 Awesome! 🎉'}
          </div>
          <div className="candy-shower">
            {Array.from({ length: 30 }, (_, i) => (
              <span key={i} className="candy" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${1.5 + Math.random()}s`
              }}>
                {emojis[Math.floor(Math.random() * emojis.length)]}
              </span>
            ))}
          </div>
        </>
      ) : (
        <div className="water-scene">
          <div className="water-surface" />
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="bubble-water" style={{
              left: `${Math.random() * 90}%`,
              animationDelay: `${Math.random() * 2}s`,
              width: `${20 + Math.random() * 30}px`,
              height: `${20 + Math.random() * 30}px`
            }} />
          ))}
          <div className="wrong-text">Wrong! 😢</div>
        </div>
      )}
      <div className="nav-btns">
        {qIndex > 0 && <button className="bubble nav-btn" onClick={onPrev}>◀ Previous</button>}
        {isLast ? (
          <>
            <button className="bubble nav-btn" onClick={onLevels}>🗂 Levels</button>
            {onNextLevel && <button className="bubble nav-btn close-btn" onClick={onNextLevel}>Next Level ▶</button>}
          </>
        ) : (
          <button className="bubble nav-btn close-btn" onClick={onNext}>Next ▶</button>
        )}
      </div>
    </div>
  );
}
