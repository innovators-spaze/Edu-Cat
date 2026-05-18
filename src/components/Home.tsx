import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAudio } from '../hooks/useAudio';

interface Props { name: string; onStart: () => void; }

export default function Home({ name, onStart }: Props) {
  const { playPop } = useAudio();

  async function logout() {
    await signOut(auth);
  }

  function handleStart() {
    playPop();
    onStart();
  }

  return (
    <div className="home-bg">
      <div className="home-header">
        <span className="home-wave">👋</span>
        <span>Hello, <strong>{name}</strong>!</span>
        <button className="bubble logout-btn" onClick={logout}>Logout</button>
      </div>
      <div className="home-center">
        <div className="home-logo">🐱 Edu-Cat</div>
        <div className="home-mascot">🐱</div>
        <button className="bubble start-btn" onClick={handleStart}>▶ START</button>
      </div>
      <div className="floating-letters">
        {['A','B','C','D','E','F'].map((l, i) => (
          <span key={l} style={{ '--d': `${i * 0.3}s` } as React.CSSProperties}>{l}</span>
        ))}
      </div>
    </div>
  );
}
