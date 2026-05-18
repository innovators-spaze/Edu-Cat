import { useAudio } from '../hooks/useAudio';

interface Props {
  chapter: number;
  onSelect: (level: number) => void;
  onBack: () => void;
  completed: Record<number, number>; // level -> stars (0-3)
}

function Stars({ count }: { count: number }) {
  return (
    <div className="level-stars">
      {[1, 2, 3].map(i => (
        <span key={i} className={i <= count ? 'star-on' : 'star-off'}>★</span>
      ))}
    </div>
  );
}

export default function Levels({ chapter, onSelect, onBack, completed }: Props) {
  const { playPop } = useAudio();

  function pick(lvl: number) {
    playPop();
    onSelect(lvl);
  }

  return (
    <div className="page-bg">
      <h2 className="page-title">Chapter {chapter} — Pick a Level</h2>
      <div className="levels-grid">
        {Array.from({ length: 30 }, (_, i) => i + 1).map(lvl => {
          const stars = completed[lvl] ?? -1;
          const done = stars >= 0;
          return (
            <button key={lvl} className={`bubble level-btn ${done ? 'level-done' : ''}`} onClick={() => pick(lvl)}>
              <span className="level-num">{lvl}</span>
              {done && <Stars count={stars} />}
            </button>
          );
        })}
      </div>
      <button className="bubble back-btn" onClick={onBack}>◀ Back</button>
    </div>
  );
}
