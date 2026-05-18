import { useAudio } from '../hooks/useAudio';

interface Props {
  onSelect: (ch: number) => void;
  onBack: () => void;
  isUnlocked: (ch: number) => boolean;
  progress: Record<number, Record<number, boolean>>;
}

export default function Chapters({ onSelect, onBack, isUnlocked, progress }: Props) {
  const { playPop } = useAudio();

  function pick(ch: number) {
    if (!isUnlocked(ch)) return;
    playPop();
    onSelect(ch);
  }

  function doneCount(ch: number) {
    return Object.keys(progress[ch] || {}).length;
  }

  const chapters = [
    { ch: 1, icon: '🔤', name: 'Chapter 1', sub: 'Phonics', cls: 'ch1' },
    { ch: 2, icon: '✏️', name: 'Chapter 2', sub: 'Trace', cls: 'ch2' },
    { ch: 3, icon: '🖼️', name: 'Chapter 3', sub: 'Pictorial', cls: 'ch3' },
  ];

  return (
    <div className="page-bg">
      <h2 className="page-title">Choose a Chapter 📚</h2>
      <div className="chapters-grid">
        {chapters.map(({ ch, icon, name, sub, cls }) => {
          const unlocked = isUnlocked(ch);
          const done = doneCount(ch);
          return (
            <button key={ch} className={`bubble chapter-btn ${cls} ${!unlocked ? 'locked' : ''}`} onClick={() => pick(ch)}>
              <div className="ch-icon">{unlocked ? icon : '🔒'}</div>
              <div className="ch-name">{name}</div>
              <div className="ch-sub">{unlocked ? sub : 'Complete Ch.1 & Ch.2 to unlock'}</div>
              <div className="ch-progress">{done}/30 levels</div>
            </button>
          );
        })}
      </div>
      <button className="bubble back-btn" onClick={onBack}>◀ Back</button>
    </div>
  );
}
