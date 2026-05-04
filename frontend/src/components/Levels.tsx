import { useAudio } from '../hooks/useAudio';

interface Props {
  chapter: number;
  onSelect: (level: number) => void;
  onBack: () => void;
  completed: Record<number, boolean>;
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
        {Array.from({ length: 30 }, (_, i) => i + 1).map(lvl => (
          <button key={lvl} className={`bubble level-btn ${completed[lvl] ? 'level-done' : ''}`} onClick={() => pick(lvl)}>
            {completed[lvl] ? '✅' : lvl}
          </button>
        ))}
      </div>
      <button className="bubble back-btn" onClick={onBack}>◀ Back</button>
    </div>
  );
}
