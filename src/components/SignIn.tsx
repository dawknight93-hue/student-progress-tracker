import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';

export function SignIn() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-[1100px] flex-col gap-5 px-4 py-6">
      <header>
        <div className="eyebrow">Ground school</div>
        <h1 className="text-[44px] leading-none">Student Progress Tracker</h1>
      </header>

      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-4 rounded-md border border-line bg-surface p-6">
        <h2 className="text-[28px] leading-none">
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h2>
        <p className="text-muted">
          {mode === 'signin'
            ? 'Sign in to see your students on any device.'
            : 'Create an account to start tracking students.'}
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <label className="label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label" htmlFor="auth-pass">Password</label>
            <input
              id="auth-pass"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {error && (
            <div role="alert" className="rounded border border-bad bg-badBg px-3 py-2 text-bad text-sm">
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <button
          type="button"
          className="text-sm text-accent hover:underline"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
        >
          {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>

      <footer className="mt-auto pt-4 text-[12.5px] text-muted">
        Data is saved to your account and syncs across devices. Use Export for a backup.
      </footer>
    </div>
  );
}
