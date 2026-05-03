import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import Splash from './components/Splash';
import Auth from './components/Auth';
import Home from './components/Home';
import Chapters from './components/Chapters';
import Levels from './components/Levels';
import Game from './components/Game';
import Trace from './components/Trace';
import Pictorial from './components/Pictorial';
import './App.css';

type Screen = 'splash' | 'auth' | 'home' | 'chapters' | 'levels' | 'game' | 'trace' | 'pictorial';

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [chapter, setChapter] = useState(1);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  function afterSplash() {
    setScreen(user ? 'home' : 'auth');
  }

  function selectChapter(ch: number) {
    setChapter(ch); setScreen('levels');
  }

  function selectLevel(lvl: number) {
    setLevel(lvl);
    if (chapter === 1) setScreen('game');
    else if (chapter === 2) setScreen('trace');
    else setScreen('pictorial');
  }

  function nextLevel() {
    if (level < 30) { setLevel(l => l + 1); }
    else setScreen('levels');
  }

  const displayName = user?.displayName || user?.email || 'Friend';

  return (
    <div className="app">
      {screen === 'splash' && <Splash onDone={afterSplash} />}
      {screen === 'auth'   && <Auth onLogin={() => setScreen('home')} />}
      {screen === 'home'   && <Home name={displayName} onStart={() => setScreen('chapters')} />}
      {screen === 'chapters' && <Chapters onSelect={selectChapter} onBack={() => setScreen('home')} />}
      {screen === 'levels'   && <Levels chapter={chapter} onSelect={selectLevel} onBack={() => setScreen('chapters')} />}
      {screen === 'game'     && <Game chapter={chapter} level={level} onLevels={() => setScreen('levels')} onNextLevel={nextLevel} />}
      {screen === 'trace'    && <Trace level={level} onLevels={() => setScreen('levels')} onNextLevel={nextLevel} />}
      {screen === 'pictorial'&& <Pictorial level={level} onLevels={() => setScreen('levels')} onNextLevel={nextLevel} />}
    </div>
  );
}
