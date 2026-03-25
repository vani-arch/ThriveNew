import { useNavigate } from 'react-router-dom'
import { useRef, useState, useEffect, useCallback } from 'react'
// Inline generateTasks removed, now delegating to /api/generate-tasks

export default function Home() {
  const navigate  = useNavigate()
  const userName  = localStorage.getItem('userName') || 'Megha'
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState('') // 'reading' | 'sorting'
  const [inputText, setInputText] = useState('')
  // Stores the committed (final) text so interim results don't overwrite it
  const committedTextRef = useRef(inputText)
  const recognitionRef = useRef(null)

  // Keep committedTextRef in sync whenever input changes outside of voice
  const handleTextChange = (e) => {
    setInputText(e.target.value)
    committedTextRef.current = e.target.value
  }

  const startRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-IN'

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      // Append finalized speech to the committed text
      if (finalTranscript) {
        const separator = committedTextRef.current.trim() ? ', ' : ''
        committedTextRef.current = committedTextRef.current.trim() + separator + finalTranscript.trim()
      }

      // Show committed + in-progress interim text live in textarea
      const displayText = interimTranscript
        ? committedTextRef.current + (committedTextRef.current.trim() ? ' ' : '') + interimTranscript
        : committedTextRef.current

      setInputText(displayText)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      // Don't stop on 'no-speech' — it's just a silence timeout
      if (event.error !== 'no-speech') {
        setIsRecording(false)
        recognitionRef.current = null
      }
    }

    recognition.onend = () => {
      // Auto-restart if still in recording mode (continuous mode can end unexpectedly)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (_) {
          // Already started
        }
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [])

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null // prevent auto-restart
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    // Sync committed ref with final displayed text
    committedTextRef.current = inputText
    setIsRecording(false)
  }, [inputText])

  const toggleMic = () => {
    if (isRecording) {
      stopRecognition()
    } else {
      startRecognition()
    }
  }

  const handleSort = async () => {
    if (isLoading || !inputText.trim()) return

    // Stop mic if still running
    if (recognitionRef.current) stopRecognition()

    setIsLoading(true)
    setLoadingPhase('reading')

    let tasks = []
    try {
      // Brief pause so 'Reading your day…' is visible before the fetch starts
      await new Promise(r => setTimeout(r, 600))
      setLoadingPhase('sorting')
      
      const response = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputText })
      })
      
      if (!response.ok) {
        let errText = "Server Error"
        try { const errObj = await response.json(); errText = errObj.error } catch(_) {}
        throw new Error(errText)
      }
      
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      
      tasks = data
    } catch (err) {
      console.warn('API failed:', err.message)
      alert(`API Error: ${err.message}`)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    navigate('/tasks', { state: { tasks } })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      }
    }
  }, [])

  return (
    <div style={{ backgroundColor: '#0F1716', color: '#dce4e2', fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh' }}>
      <style>{`
        .home-textarea {
          border: 1px solid #D4622A !important;
          box-shadow: 0 0 12px rgba(212, 98, 42, 0.3);
          transition: box-shadow 0.3s ease;
          background: #151d1c;
          resize: none;
        }
        .home-textarea:focus {
          outline: none !important;
          box-shadow: 0 0 24px rgba(212, 98, 42, 0.6) !important;
        }
        .home-textarea::-webkit-scrollbar { width: 4px; }
        .home-textarea::-webkit-scrollbar-track { background: transparent; }
        .home-textarea::-webkit-scrollbar-thumb { background: #2e3635; border-radius: 10px; }

        .home-mic-btn {
          border: 1px solid #ffffff;
          color: #ffffff;
          background: transparent;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .home-mic-btn:hover {
          border-color: #D4622A;
          box-shadow: 0 0 15px rgba(212, 98, 42, 0.4);
        }
        .home-mic-btn.recording {
          background-color: #ef4444 !important;
          border-color: #ef4444 !important;
          color: white;
          animation: mic-pulse 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        @keyframes mic-pulse {
          0%   { box-shadow: 0 0 0 0   rgba(239, 68, 68, 0.7); }
          70%  { box-shadow: 0 0 0 16px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0   rgba(239, 68, 68, 0); }
        }

        .home-sort-btn {
          background: #D4622A;
          transition: all 0.2s;
        }
        .home-sort-btn:hover:not(:disabled) { filter: brightness(1.1); }
        .home-sort-btn:active:not(:disabled) { transform: scale(0.95); }
        .home-sort-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .sort-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .loading-shimmer {
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }

        .recording-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #ef4444;
          letter-spacing: 0.05em;
          animation: badge-fade 0.3s ease;
        }
        .recording-dot {
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          animation: dot-blink 1s step-end infinite;
        }
        @keyframes dot-blink { 50% { opacity: 0; } }
        @keyframes badge-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Top Header */}
      <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, background: 'rgba(21,29,28,0.5)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#ffb596' }}>Thrivee</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span className="material-symbols-outlined" style={{ color: '#dec0b5', cursor: 'pointer', transition: 'color 0.2s' }}>settings</span>
          <span className="material-symbols-outlined" style={{ color: '#dec0b5', cursor: 'pointer', transition: 'color 0.2s' }}>account_circle</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ width: '100%', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: '100px', paddingBottom: '40px', paddingLeft: '24px', paddingRight: '24px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(222,192,181,0.6)', marginBottom: '16px' }}>
          GOOD MORNING, {userName.toUpperCase()}
        </span>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#dce4e2', marginBottom: '48px', lineHeight: 1.15 }}>
          What's on your{' '}
          <span style={{ color: '#D4622A', fontStyle: 'italic' }}>plate</span>{' '}
          today?
        </h1>

        {/* Input Section */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              className="home-textarea"
              placeholder="What's on your plate today? Add your tasks, separated by commas..."
              value={inputText}
              onChange={handleTextChange}
              style={{ width: '100%', height: '320px', borderRadius: '16px', padding: '32px', color: '#dec0b5', fontSize: '1.0625rem', lineHeight: 1.65 }}
            />
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: '8px' }}>

            {/* Mic button + live recording badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <button
                className={`home-mic-btn${isRecording ? ' recording' : ''}`}
                onClick={toggleMic}
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                title={isRecording ? 'Click to stop recording' : 'Click to speak'}
                style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>
                  {isRecording ? 'stop' : 'mic'}
                </span>
              </button>

              {isRecording && (
                <div className="recording-badge">
                  <div className="recording-dot" />
                  LISTENING
                </div>
              )}
            </div>

            <button
              className="home-sort-btn"
              onClick={handleSort}
              disabled={isLoading}
              style={{ color: 'white', padding: '16px 40px', borderRadius: '9999px', fontWeight: 700, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 30px rgba(212,98,42,0.3)', minWidth: '160px', justifyContent: 'center' }}
            >
              {isLoading ? (
                <>
                  <div className="sort-spinner" />
                  <span className="loading-shimmer" style={{ fontSize: '0.9375rem' }}>
                    {loadingPhase === 'reading' ? 'Reading your day…' : 'Sorting your tasks…'}
                  </span>
                </>
              ) : (
                <>
                  Sort
                  <span className="material-symbols-outlined" style={{ fontWeight: 700 }}>arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Mobile Nav */}
      <nav style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, width: '100%', justifyContent: 'space-around', alignItems: 'center', padding: '0 16px 24px', paddingTop: '8px', background: 'rgba(13,21,20,0.8)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        {[
          { icon: 'wb_sunny', label: 'Today', path: '/dashboard', active: false },
          { icon: 'calendar_today', label: 'Plan', path: '/plan', active: window.location.pathname === '/plan' },
          { icon: 'timer', label: 'Focus', path: '/focus', active: window.location.pathname === '/focus' },
          { icon: 'person', label: 'Me', path: '/me', active: window.location.pathname === '/me' },
        ].map(item => (
          <div 
             key={item.label} 
             onClick={() => navigate(item.path)}
             style={{
               cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px',
               ...(item.active ? { background: 'linear-gradient(135deg, #ffb596, #e56e36)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(212,98,42,0.4)' } : { color: '#dec0b5' }),
          }}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Background blobs */}
      <div style={{ position: 'fixed', top: '25%', left: '-96px', width: '384px', height: '384px', background: 'rgba(255,181,150,0.05)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '25%', right: '-96px', width: '320px', height: '320px', background: 'rgba(229,110,54,0.05)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
    </div>
  )
}
