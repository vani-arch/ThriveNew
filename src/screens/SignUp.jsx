import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

export default function SignUp() {
  const navigate = useNavigate()

  const [isLogin,   setIsLogin]   = useState(false)
  const [fullName,  setFullName]  = useState('')
  const [email,     setEmail]     = useState('')
  const [linkedin,  setLinkedin]  = useState('')
  const [password,  setPassword]  = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // ── Basic client-side validation ──────────────────────────────────
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password.trim())
        navigate('/dashboard')
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password.trim())
        // Persist the user's name for personalised greeting on Home screen
        if (fullName.trim()) localStorage.setItem('userName', fullName.trim())
        navigate('/home')
      }
    } catch (err) {
      console.log('Firebase Auth Error:', err)
      setError(friendlyError(err.code || err.message, isLogin))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: '#0d1514', color: '#dce4e2', fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        .signup-btn {
          transition: all 0.3s;
        }
        .signup-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 0 30px rgba(212,98,42,0.3);
        }
        .signup-btn:active:not(:disabled) { transform: scale(0.98); }
        .signup-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .signup-input {
          width: 100%;
          background: #2e3635;
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 16px 16px 16px 48px;
          color: #dce4e2;
          font-size: 0.9375rem;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .signup-input:focus {
          outline: none;
          border-color: rgba(212, 98, 42, 0.5);
          box-shadow: 0 0 0 3px rgba(212, 98, 42, 0.12);
        }
        .signup-input::placeholder { color: rgba(166,139,129,0.45); }

        .pw-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(166,139,129,0.5);
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }
        .pw-toggle:hover { color: #dec0b5; }

        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(239,68,68,0.10);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 14px 16px;
          animation: errSlide 0.25s ease;
        }
        @keyframes errSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .spin-ring {
          width: 18px; height: 18px;
          border: 2px solid rgba(77,25,0,0.3);
          border-top-color: #4d1900;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Background blobs */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(255,181,150,0.05)', borderRadius: '50%', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '30%', height: '30%', background: 'rgba(118,209,255,0.05)', borderRadius: '50%', filter: 'blur(100px)' }} />
      </div>

      {/* Main */}
      <main style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>

        {/* Brand */}
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#ffb596' }}>Thrivee</h1>
        </header>

        {/* Form card */}
        <div style={{ width: '100%', maxWidth: '448px' }}>
          <div style={{ background: 'rgba(25,33,32,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(87,66,58,0.15)', padding: '40px', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>

            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#dce4e2', marginBottom: '8px' }}>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
              <p style={{ fontSize: '0.875rem', color: '#dec0b5' }}>{isLogin ? 'Sign in to review your dashboard.' : 'Give grunt work to AI. Discover what only you can do.'}</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>

              {/* Full Name (Signup only) */}
              {!isLogin && (
                <Field label="Full Name" htmlFor="full_name" icon="person">
                <input
                  className="signup-input"
                  id="full_name"
                  type="text"
                  placeholder="Elias Thorne"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  autoComplete="name"
                />
                </Field>
              )}

              {/* Email */}
              <Field label="Email" htmlFor="signup_email" icon="mail">
                <input
                  className="signup-input"
                  id="signup_email"
                  type="email"
                  placeholder="elias@architect.io"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </Field>

              {/* Password */}
              <Field label="Password" htmlFor="signup_password" icon="lock">
                <input
                  className="signup-input"
                  id="signup_password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ paddingRight: '48px' }}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
                    {showPw ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </Field>

              {/* LinkedIn (optional - Signup only) */}
              {!isLogin && (
                <Field label="LinkedIn URL (optional)" htmlFor="signup_linkedin" icon="link">
                <input
                  className="signup-input"
                  id="signup_linkedin"
                  type="url"
                  placeholder="linkedin.com/in/username"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                  autoComplete="url"
                />
                </Field>
              )}

              {/* Submit */}
              <div style={{ paddingTop: '4px' }}>
                <button
                  className="signup-btn"
                  type="submit"
                  disabled={isLoading}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #ffb596 0%, #e56e36 100%)', color: '#4d1900', fontWeight: 800, fontSize: '1.125rem', padding: '16px', borderRadius: '12px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  {isLoading ? (
                    <>
                      <div className="spin-ring" />
                      <span>{isLogin ? 'Signing in…' : 'Creating account…'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? 'Log in' : 'Get Started'}</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>arrow_forward</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mode Toggle inside the form directly below submit */}
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                  style={{ color: '#ffb596', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', fontSize: '0.875rem' }}
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>

              {/* Error message now shown BELOW the toggle/button */}
              {error && (
                <div className="error-box" role="alert" style={{ marginTop: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: '#f87171', fontSize: '1.125rem', flexShrink: 0, marginTop: '1px' }}>error</span>
                  <p style={{ color: '#fca5a5', fontSize: '0.875rem', lineHeight: 1.5 }}>{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Trust badges */}
          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', opacity: 0.4 }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: '#dec0b5' }}>security</span>
              <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#dec0b5' }}>Secure Encryption</span>
            </div>
            <div style={{ width: '48px', height: '1px', background: 'rgba(87,66,58,0.3)' }} />
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#dec0b5' }}>Global Network</span>
              <span className="material-symbols-outlined" style={{ color: '#dec0b5' }}>public</span>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ width: '100%', padding: '24px 0', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, color: 'rgba(220,228,226,0.3)' }}>
          © 2026 Thrive. Give the grunt work to AI. Discover what only YOU can do.
        </p>
      </footer>
    </div>
  )
}

// ─── Tiny layout component to keep form fields DRY ───────────────────────────
function Field({ label, htmlFor, icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label
        htmlFor={htmlFor}
        style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(222,192,181,0.7)', marginLeft: '4px' }}
      >
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', color: 'rgba(166,139,129,0.5)', fontSize: '20px', pointerEvents: 'none', zIndex: 1 }}>
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

// ─── Map Firebase error codes to human-friendly messages ─────────────────────
function friendlyError(code, isLogin) {
  const map = {
    'auth/email-already-in-use':    'This email is already registered. Try logging in instead.',
    'auth/invalid-email':            'Please enter a valid email address.',
    'auth/invalid-credential':       'Incorrect email or password. Please try again.',
    'auth/invalid-login-credentials':'Incorrect email or password. Please try again.',
    'auth/user-not-found':           'User not found. Please sign up first.',
    'auth/wrong-password':           'Incorrect password. Please try again.',
    'auth/weak-password':            'Password is too weak. Use at least 6 characters.',
    'auth/network-request-failed':   'Network error. Check your connection and try again.',
    'auth/too-many-requests':        'Too many attempts. Please wait a moment and try again.',
    'auth/operation-not-allowed':    'Email sign-up is not enabled. Contact support.',
    'auth/invalid-api-key':          'Firebase API key is missing or invalid. Check your .env file.',
  }
  return map[code] ?? `${isLogin ? 'Login' : 'Sign-up'} failed (${code ?? 'unknown error'}). Please try again.`
}
