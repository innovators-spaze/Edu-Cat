import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface Props { onLogin: () => void; }

export default function Auth({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const errMsg = (code: string, msg: string) => {
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') return 'Invalid email or password.';
    if (code === 'auth/user-not-found') return 'No account found with this email.';
    if (code === 'auth/email-already-in-use') return 'Email already registered.';
    if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
    if (code === 'auth/invalid-email') return 'Invalid email address.';
    return msg.replace('Firebase: ', '').replace(/\(.*\)/, '').trim();
  };

  async function submit() {
    setError(''); setLoading(true);
    try {
      if (mode === 'register') {
        if (!name) { setError('Please enter your name!'); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      onLogin();
    } catch (e: any) {
      setError(errMsg(e.code, e.message));
    }
    setLoading(false);
  }

  async function googleLogin() {
    setError(''); setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') setError(errMsg(e.code, e.message));
    }
    setLoading(false);
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-emoji">🎓</div>
        <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
        {mode === 'register' && (
          <input className="auth-input" placeholder="Your Name 😊" value={name} onChange={e => setName(e.target.value)} />
        )}
        <input className="auth-input" type="email" placeholder="Email 📧" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="auth-input" type="password" placeholder="Password 🔒" value={pass} onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        {error && <div className="auth-error">{error}</div>}
        <button className="bubble auth-btn" onClick={submit} disabled={loading}>
          {loading ? '⏳ Please wait...' : mode === 'login' ? 'Login 🚀' : 'Register 🎉'}
        </button>
        <div className="auth-divider"><span>or</span></div>
        <button className="bubble google-btn" onClick={googleLogin} disabled={loading}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width={20} height={20} alt="G" />
          Continue with Google
        </button>
        <div className="auth-switch">
          <span>{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
          <button className="link-btn" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Register' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
