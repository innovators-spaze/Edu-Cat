import { useAudio } from '../hooks/useAudio';

interface Props {
  chapter: number;
  onSelect: (level: number) => void;
  onBack: () => void;
}

export default function Levels({ chapter, onSelect, onBack }: Props) {
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
          <button key={lvl} className="bubble level-btn" onClick={() => pick(lvl)}>{lvl}</button>
        ))}
      </div>
      <button className="bubble back-btn" onClick={onBack}>◀ Back</button>
    </div>
  );
}
