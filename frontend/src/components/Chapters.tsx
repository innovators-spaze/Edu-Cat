import { useAudio } from '../hooks/useAudio';

interface Props {
  onSelect: (ch: number) => void;
  onBack: () => void;
}

export default function Chapters({ onSelect, onBack }: Props) {
  const { playPop } = useAudio();

  function pick(ch: number) {
    playPop();
    onSelect(ch);
  }

  return (
    <div className="page-bg">
      <h2 className="page-title">Choose a Chapter 📚</h2>
      <div className="chapters-grid">
        <button className="bubble chapter-btn ch1" onClick={() => pick(1)}>
          <div className="ch-icon">🔤</div>
          <div className="ch-name">Chapter 1</div>
          <div className="ch-sub">Phonics</div>
        </button>
        <button className="bubble chapter-btn ch2" onClick={() => pick(2)}>
          <div className="ch-icon">✏️</div>
          <div className="ch-name">Chapter 2</div>
          <div className="ch-sub">Trace</div>
        </button>
        <button className="bubble chapter-btn ch3" onClick={() => pick(3)}>
          <div className="ch-icon">🖼️</div>
          <div className="ch-name">Chapter 3</div>
          <div className="ch-sub">Pictorial</div>
        </button>
      </div>
      <button className="bubble back-btn" onClick={onBack}>◀ Back</button>
    </div>
  );
}
