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

const CANDIES = ['🍬', '🍭', '🍫', '🍡', '🍩', '🌟', '⭐', '✨', '🎊', '🎈', '🎉', '🍰'];
const FISH = ['🐟', '🐠', '🐡', '🦈', '🐙', '🦑'];

export default function Feedback({ correct, qIndex, onNext, onPrev, onLevels, isLast, score, onNextLevel }: Props) {
  useEffect(() => {
    const u = new SpeechSynthesisUtterance(correct ? 'Awesome! Great job!' : 'Wrong! Try again!');
    u.pitch = correct ? 1.6 : 0.7; u.rate = 0.9;
    speechSynthesis.speak(u);
  }, []);

  return (
    <div className={`feedback-overlay ${correct ? 'fb-correct' : 'fb-wrong'}`}>
      {correct ? (
        <>
          <div className="candy-shower">
            {Array.from({ length: 40 }, (_, i) => (
              <span key={i} className="candy" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.2}s`,
                animationDuration: `${1.2 + Math.random() * 1.5}s`,
                fontSize: `${1.4 + Math.random() * 1.2}rem`,
              }}>
                {CANDIES[Math.floor(Math.random() * CANDIES.length)]}
              </span>
            ))}
          </div>
          <div className="awesome-card">
            <div className="awesome-emoji">🎉</div>
            <div className="awesome-text">{isLast ? `Level Complete!` : 'Awesome!'}</div>
            {isLast && <div className="score-text">Score: {score}/10 ⭐</div>}
          </div>
        </>
      ) : (
        <div className="water-scene">
          {/* Sky */}
          <div className="water-sky">
            <div className="wrong-text">Wrong! 😢</div>
          </div>
          {/* Water surface with waves */}
          <div className="water-body">
            <div className="wave wave1" />
            <div className="wave wave2" />
            <div className="water-fill" />
            {/* Bubbles rising */}
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} className="water-bubble" style={{
                left: `${5 + Math.random() * 88}%`,
                animationDelay: `${Math.random() * 2.5}s`,
                animationDuration: `${1.5 + Math.random() * 2}s`,
                width: `${10 + Math.random() * 22}px`,
                height: `${10 + Math.random() * 22}px`,
              }} />
            ))}
            {/* Fish swimming */}
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className="fish" style={{
                top: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.6}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
                fontSize: `${1.2 + Math.random() * 0.8}rem`,
              }}>
                {FISH[Math.floor(Math.random() * FISH.length)]}
              </span>
            ))}
            {/* Sinking cat */}
            <div className="sinking-cat">🐱</div>
          </div>
        </div>
      )}

      <div className="nav-btns">
        {qIndex > 0 && <button className="bubble nav-btn" onClick={onPrev}>◀ Prev</button>}
        {isLast ? (
          <>
            <button className="bubble nav-btn" onClick={onLevels}>🗂 Levels</button>
            {onNextLevel && <button className="bubble nav-btn go-btn" onClick={onNextLevel}>Next Level ▶</button>}
          </>
        ) : (
          <button className="bubble nav-btn go-btn" onClick={onNext}>Next ▶</button>
        )}
      </div>
    </div>
  );
}
