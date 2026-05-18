import { useRef } from 'react';

export function useAudio() {
  const acRef = useRef<AudioContext | null>(null);

  function getAC(): AudioContext {
    if (!acRef.current) acRef.current = new AudioContext();
    if (acRef.current.state === 'suspended') acRef.current.resume();
    return acRef.current;
  }

  function playMeow() {
    try {
      const ac = getAC();
      const osc = ac.createOscillator(), gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ac.currentTime + 0.4);
      gain.gain.setValueAtTime(0.4, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.5);
      osc.start(); osc.stop(ac.currentTime + 0.5);
    } catch {}
  }

  function playPop() {
    try {
      const ac = getAC();
      const osc = ac.createOscillator(), gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.08);
      gain.gain.setValueAtTime(0.5, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1);
      osc.start(); osc.stop(ac.currentTime + 0.1);
    } catch {}
  }

  return { playMeow, playPop };
}
