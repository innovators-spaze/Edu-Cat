import { useEffect } from 'react';
import { useAudio } from '../hooks/useAudio';

interface Props { onDone: () => void; }

export default function Splash({ onDone }: Props) {
  const { playMeow } = useAudio();

  useEffect(() => {
    playMeow();
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="splash-bg">
      <span className="star" style={{ top: '10%', left: '15%', animationDelay: '0s' }}>⭐</span>
      <span className="star" style={{ top: '20%', left: '80%', animationDelay: '0.5s' }}>🌟</span>
      <span className="star" style={{ top: '70%', left: '10%', animationDelay: '1s' }}>✨</span>
      <span className="star" style={{ top: '60%', left: '85%', animationDelay: '0.3s' }}>⭐</span>
      <div className="splash-cat">🐱</div>
      <div className="splash-title">
        <span style={{ color: '#ff6b9d' }}>E</span>
        <span style={{ color: '#fbbf24' }}>d</span>
        <span style={{ color: '#22c55e' }}>u</span>
        <span style={{ color: 'white' }}>-</span>
        <span style={{ color: '#3b82f6' }}>C</span>
        <span style={{ color: '#f97316' }}>a</span>
        <span style={{ color: '#a855f7' }}>t</span>
      </div>
      <div className="splash-sub">Learn &amp; Play 🐱</div>
    </div>
  );
}
