import { useState } from 'react';
import { api } from '../services/api';
import splashParchment from '../assets/marauders-splash-parchment.png';
import '../styles/login.css';

export default function LoginForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login' ? { username, password } : { username, displayName, password };
      const { data } = await api.post(endpoint, body);
      onAuthenticated({ token: data.token, sessionId: data.sessionId, displayName: data.user.displayName || data.user.display_name });
    } catch (err) {
      setError(err.response?.data?.error || 'The map could not verify you. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode((currentMode) => currentMode === 'login' ? 'signup' : 'login');
    setError('');
    setShowPassword(false);
  }

  return (
    <main className="login-screen">
      <img className="login-map-watermark" src={splashParchment} alt="" aria-hidden="true" />
      <div className="login-folds" aria-hidden="true" />

      <aside className="login-marginalia login-marginalia--left" aria-hidden="true">
        <span>Passage VII</span>
        <strong>Hogwarts Grounds</strong>
      </aside>
      <aside className="login-marginalia login-marginalia--right" aria-hidden="true">
        <span>Authorized Marauders</span>
        <strong>Mischief Managed</strong>
      </aside>

      <section className="login-folio" aria-labelledby="login-title">
        <span className="login-corner login-corner--top-left" aria-hidden="true" />
        <span className="login-corner login-corner--top-right" aria-hidden="true" />
        <span className="login-corner login-corner--bottom-left" aria-hidden="true" />
        <span className="login-corner login-corner--bottom-right" aria-hidden="true" />

        <header className="login-heading">
          <p className="login-kicker">Restricted Map Access</p>
          <p className="login-makers">Messrs Moony, Wormtail, Padfoot &amp; Prongs</p>
          <h1 id="login-title">{mode === 'login' ? 'Identify Yourself' : 'Enter Your Name'}</h1>
          <p className="login-introduction">
            {mode === 'login'
              ? 'The map reveals its secrets only to those it remembers.'
              : 'Add your name to the map before the next moonrise.'}
          </p>
        </header>

        <div className="login-rule" aria-hidden="true">
          <span>✦</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form" aria-busy={submitting}>
          <div className="login-field">
            <label htmlFor="map-username">Username</label>
            <input
              id="map-username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name in the margins"
              autoComplete="username"
              spellCheck="false"
              disabled={submitting}
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="login-field">
              <label htmlFor="map-display-name">Name shown on the map</label>
              <input
                id="map-display-name"
                name="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="What should fellow marauders see?"
                autoComplete="nickname"
                disabled={submitting}
                required
              />
            </div>
          )}

          <div className="login-field">
            <div className="login-label-row">
              <label htmlFor="map-password">Secret phrase</label>
              <button
                className="login-password-toggle"
                type="button"
                onClick={() => setShowPassword((isVisible) => !isVisible)}
                aria-controls="map-password"
                aria-pressed={showPassword}
                disabled={submitting}
              >
                {showPassword ? 'Conceal' : 'Reveal'}
              </button>
            </div>
            <input
              id="map-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Speak quietly"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={submitting}
              required
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              <span aria-hidden="true">×</span>
              {error}
            </p>
          )}

          <button className="login-submit" type="submit" disabled={submitting}>
            {submitting
              ? 'Consulting the map…'
              : mode === 'login' ? 'Reveal the Map' : 'Sign the Map'}
          </button>
        </form>

        <footer className="login-footer">
          <span>{mode === 'login' ? 'Not yet known to the map?' : 'Already written in the margins?'}</span>
          <button type="button" onClick={switchMode} disabled={submitting}>
            {mode === 'login' ? 'Add your name' : 'Identify yourself'}
          </button>
        </footer>
      </section>
    </main>
  );
}
