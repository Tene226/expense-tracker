import { useState } from 'react';
import { login, register } from '../lib/api';
import { LG, glassStyle } from '../styles/tokens';
import { Gleam, GlassInput, GlassButton } from './Glass';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode]         = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? login : register;
      const data = await fn(username.trim(), password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 24px',
      background: LG.bgGradient,
      position: 'relative',
    }}>
      {/* Blobs */}
      <div style={{ position: 'absolute', top: -60, left: -40, width: 250, height: 250, borderRadius: '99px', background: LG.blob1, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 100, right: -40, width: 200, height: 200, borderRadius: '99px', background: LG.blob2, filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 340, position: 'relative', zIndex: 1 }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontFamily: '-apple-system, system-ui', fontSize: 26, fontWeight: 300, color: LG.textPrimary, letterSpacing: '-0.04em', margin: 0, marginBottom: 6 }}>
            Mes Dépenses
          </h1>
          <p style={{ fontFamily: '-apple-system, system-ui', fontSize: 14, color: LG.textSecondary, margin: 0 }}>
            {mode === 'login' ? 'Connectez-vous pour continuer' : 'Créer un compte'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ ...glassStyle(), borderRadius: 18, padding: 20, position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Gleam />
            <div>
              <label style={{ fontFamily: '-apple-system, system-ui', fontSize: 11, fontWeight: 600, color: LG.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Nom d'utilisateur
              </label>
              <GlassInput
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ex: arnold"
              />
            </div>
            <div>
              <label style={{ fontFamily: '-apple-system, system-ui', fontSize: 11, fontWeight: 600, color: LG.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Mot de passe
              </label>
              <GlassInput
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 caractères"
              />
            </div>

            {error && (
              <div style={{ padding: '8px 12px', borderRadius: 10, background: `${LG.red}18`, border: `1px solid ${LG.red}44` }}>
                <span style={{ fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.red }}>{error}</span>
              </div>
            )}

            <GlassButton
              label={loading ? '…' : (mode === 'login' ? 'Se connecter' : 'Créer le compte')}
              primary
              full
              disabled={loading}
              onClick={handleSubmit}
            />
          </div>
        </form>

        <button
          onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
          style={{ width: '100%', marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', fontFamily: '-apple-system, system-ui', fontSize: 13, color: LG.textSecondary, padding: '8px 0', WebkitTapHighlightColor: 'transparent' }}
        >
          {mode === 'login' ? 'Pas de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
        </button>
      </div>
    </div>
  );
}
