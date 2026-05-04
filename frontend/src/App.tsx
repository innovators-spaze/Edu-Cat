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

// completed[chapter][level] = true
type Progress = Record<number, Record<number, boolean>>;

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [chapter, setChapter] = useState(1);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState<Progress>({ 1: {}, 2: {}, 3: {} });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setAuthReady(true); });
    return unsub;
  }, []);

  useEffect(() => {
    if (splashDone && authReady) setScreen(user ? 'home' : 'auth');
  }, [splashDone, authReady, user]);

  // Load progress from localStorage per user
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`educat_progress_${user.uid}`);
    if (saved) setProgress(JSON.parse(saved));
  }, [user]);

  function markComplete(ch: number, lvl: number) {
    setProgress(prev => {
      const next = { ...prev, [ch]: { ...prev[ch], [lvl]: true } };
      if (user) localStorage.setItem(`educat_progress_${user.uid}`, JSON.stringify(next));
      return next;
    });
  }

  function isChapterUnlocked(ch: number) {
    if (ch <= 2) return true;
    // Chapter 3 unlocked only when all 30 levels of ch1 and ch2 are done
    const ch1Done = Object.keys(progress[1] || {}).length >= 30;
    const ch2Done = Object.keys(progress[2] || {}).length >= 30;
    return ch1Done && ch2Done;
  }

  function selectChapter(ch: number) {
    setChapter(ch);
    setScreen('levels');
  }

  function selectLevel(lvl: number) {
    setLevel(lvl);
    if (chapter === 1) setScreen('game');
    else if (chapter === 2) setScreen('trace');
    else setScreen('pictorial');
  }

  function nextLevel() {
    markComplete(chapter, level);
    const next = level + 1;
    if (next <= 30) setLevel(next);
    else setScreen('levels');
  }

  function handleLevelComplete() {
    markComplete(chapter, level);
  }

  const displayName = user?.displayName || user?.email || 'Friend';

  return (
    <div className="app">
      {screen === 'splash'    && <Splash onDone={() => setSplashDone(true)} />}
      {screen === 'auth'      && <Auth onLogin={() => setScreen('home')} />}
      {screen === 'home'      && <Home name={displayName} onStart={() => setScreen('chapters')} />}
      {screen === 'chapters'  && <Chapters onSelect={selectChapter} onBack={() => setScreen('home')} isUnlocked={isChapterUnlocked} progress={progress} />}
      {screen === 'levels'    && <Levels chapter={chapter} onSelect={selectLevel} onBack={() => setScreen('chapters')} completed={progress[chapter] || {}} />}
      {screen === 'game'      && <Game chapter={chapter} level={level} onLevels={() => setScreen('levels')} onNextLevel={nextLevel} onComplete={handleLevelComplete} />}
      {screen === 'trace'     && <Trace level={level} onLevels={() => setScreen('levels')} onNextLevel={nextLevel} onComplete={handleLevelComplete} />}
      {screen === 'pictorial' && <Pictorial level={level} onLevels={() => setScreen('levels')} onNextLevel={nextLevel} onComplete={handleLevelComplete} />}
    </div>
  );
}
