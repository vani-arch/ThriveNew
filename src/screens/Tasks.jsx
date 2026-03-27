import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { auth } from '../firebase'

// ─── Fallback used when navigated to directly (no API tasks in state) ─────────
const FALLBACK_TASKS = [
  { id: 1,  text: 'Generate UTM links for the influencer post', category: 'hand-to-ai', reason: 'Mechanical data entry mapping.', time_estimate: '15 mins', urgency: 'medium' },
  { id: 2,  text: "Pull last quarter's competitor analysis",    category: 'hand-to-ai', reason: 'Context-heavy strategic analysis.', time_estimate: '2 hrs', urgency: 'high' },
  { id: 3,  text: 'Draft Ugadi social captions',                category: 'hand-to-ai', reason: 'Highly repeatable creative output.', time_estimate: '30 mins', urgency: 'low' },
  { id: 4,  text: 'Resize 40 festive Ugadi banners',             category: 'hand-to-ai', reason: 'Highly repeatable format updates.', time_estimate: '30 mins', urgency: 'low' },
  { id: 5,  text: 'Pivot visual language to Coastal identity',   category: 'protect', reason: 'Core brand and judgment required.', time_estimate: '2 hrs', urgency: 'high' },
  { id: 6,  text: 'Analyse why Hubli leads dropped 18%',         category: 'protect', reason: 'Context-heavy strategic analysis.', time_estimate: '1.5 hrs', urgency: 'high' },
  { id: 7,  text: 'Build CFO briefing on Mangaluru campaign',    category: 'protect', reason: 'Internal stakeholder relationship management.', time_estimate: '1 hr', urgency: 'high' },
]

// Animation phases:  idle → flying → sorted
//   idle   — single-column list with colored borders
//   flying — cards translate off screen (automate → left, own → right)
//   sorted — two-column layout fades in with staggered cards

export default function Tasks() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const user = auth.currentUser
  const rawName = user?.displayName || localStorage.getItem('userName') || (user?.email ? user.email.split('@')[0] : 'Megha')
  const firstNamePart = rawName.split(' ')[0].split('.')[0].split('_')[0]
  const userName = firstNamePart.charAt(0).toUpperCase() + firstNamePart.slice(1).toLowerCase()

  // Normalise from Claude API shape
  const getInitialTasks = () => {
    if (location.state?.tasks) return location.state.tasks
    try {
      const stored = localStorage.getItem('thrivee_tasks')
      if (stored) return JSON.parse(stored)
    } catch(e) {}
    return FALLBACK_TASKS
  }

  const TASKS = useMemo(() => getInitialTasks().map((t, i) => ({
    id:            t.id ?? i + 1,
    text:          t.text ?? t.task,
    category:      t.category ?? t.type ?? 'protect',
    reason:        t.reason || 'Strategic priority.',
    time_estimate: t.time_estimate || '1 hr',
    urgency:       (t.urgency || 'medium').toLowerCase(),
  })), [location.state?.tasks])

  const handToAI = useMemo(() => TASKS.filter(t => t.category === 'hand-to-ai' || t.category === 'automate'), [TASKS])
  const protect  = useMemo(() => TASKS.filter(t => t.category === 'protect' || t.category === 'own'), [TASKS])

  // phase: 'idle' | 'flying' | 'sorted'
  const [phase, setPhase] = useState('idle')
  // Per-card fly direction
  const [flyMap, setFlyMap] = useState({}) // { [id]: 'left' | 'right' }
  const cardRefs = useRef({})

  // Voice Chatbox state
  const [showVoiceChat, setShowVoiceChat] = useState(false)
  const [voiceWords, setVoiceWords] = useState([])
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isDelegated, setIsDelegated] = useState(false)
  const [showThinkTransition, setShowThinkTransition] = useState(false)
  const [hasVoiceError, setHasVoiceError] = useState(false)

  const voiceText = `Hey ${userName}. I've sorted your day. You have ${handToAI.length} tasks to hand to AI — ${handToAI.slice(0,3).map(t => t.text.split(' ').slice(0,2).join(' ')).join(', ')}. You have ${protect.length} tasks only you can do. Your highest priority protected task is: ${protect[0]?.text || 'your deep work'}. Delegate or Think — your call.`

  const speakText = (text) => {
    window.speechSynthesis.cancel()
    setIsSpeaking(true)
    const words = text.split(' ')
    setVoiceWords(words)
    setCurrentWordIndex(-1)
    
    function trySpeak() {
      const synth = window.speechSynthesis
      const voices = synth.getVoices()
      const utterance = new SpeechSynthesisUtterance(text)
      
      const preferred = voices.find(v => 
        v.name.includes('Neerja') || 
        v.name.includes('Veena') ||
        v.name.includes('Raveena') ||
        v.lang === 'en-IN'
      ) || voices.find(v => 
        v.name.toLowerCase().includes('female')
      ) || voices.find(v => 
        v.lang.startsWith('en')
      )
      
      if (preferred) utterance.voice = preferred
      utterance.rate = 0.92
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const textUpToBoundary = text.slice(0, event.charIndex + event.charLength).trim()
          const wordCount = textUpToBoundary.split(/\s+/).length - 1
          setCurrentWordIndex(wordCount)
        }
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        setCurrentWordIndex(words.length)
      }

      utterance.onerror = () => {
        setIsSpeaking(false)
      }
      
      synth.speak(utterance)
    }
    
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      trySpeak()
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        trySpeak()
      }
    }
  }

  const handleSort = () => {
    if (phase !== 'idle') return

    const map = {}
    TASKS.forEach(t => { 
      map[t.id] = (t.category === 'hand-to-ai' || t.category === 'automate') ? 'left' : 'right' 
    })
    setFlyMap(map)
    setPhase('flying')

    // Transition to sorted
    setTimeout(() => {
      setPhase('sorted')
      setShowVoiceChat(true)
      // Call visual animation immediately
    }, 480)

    // USER Voice Speech Requirement: Trigger on click
    speakText(voiceText)
  }

  const [sortedVisible, setSortedVisible] = useState(false)
  const sessionSavedRef = useRef(false)

  useEffect(() => {
    return () => { window.speechSynthesis.cancel() }
  }, [])

  useEffect(() => {
    if (phase === 'sorted') {
      requestAnimationFrame(() => setSortedVisible(true))

      if (!sessionSavedRef.current) {
        sessionSavedRef.current = true
        
        // --- Persistence for Dashboard retrieval ---
        try {
          localStorage.setItem('thrivee_hand_to_ai', JSON.stringify(handToAI))
          localStorage.setItem('thrivee_protect', JSON.stringify(protect))
        } catch (e) {}
        
        let title = 'Tasks & more'
        if (protect.length > 0) {
          title = protect[0].text.split(' ').slice(0, 4).join(' ') + ' & more'
        } else if (handToAI.length > 0) {
          title = handToAI[0].text.split(' ').slice(0, 4).join(' ') + ' & more'
        }
        const session = {
          id: Date.now().toString(),
          title,
          date: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
          tasks: TASKS,
          stats: { total: TASKS.length, handToAI: handToAI.length, protect: protect.length }
        }
        try {
          const existing = JSON.parse(localStorage.getItem('thrivee_sessions') || '[]')
          existing.unshift(session)
          localStorage.setItem('thrivee_sessions', JSON.stringify(existing))
        } catch (e) {}
      }
    } else {
      setSortedVisible(false)
    }
  }, [phase, userName, handToAI.length, protect, voiceText, TASKS])

  // Shared Card renderer to DRY up both phases
  const renderCardContent = (task) => (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.3 }}>{task.text}</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', color: '#a0aab2' }}>{task.time_estimate}</span>
          <span style={{ 
              fontSize: '0.625rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800,
              backgroundColor: task.urgency === 'high' ? 'rgba(239,68,68,0.2)' : task.urgency === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
              color: task.urgency === 'high' ? '#ef4444' : task.urgency === 'medium' ? '#f59e0b' : '#22c55e'
            }}>
            {task.urgency}
          </span>
        </div>
      </div>
      <span style={{ fontSize: '0.8125rem', fontStyle: 'italic', color: '#a0aab2' }}>{task.reason}</span>
    </div>
  )

  const backgroundRings = (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      {/* Top Left */}
      <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(212,98,42,0.15)' }} />
      <div style={{ position: 'absolute', top: '-170px', left: '-170px', width: '340px', height: '340px', borderRadius: '50%', border: '1px solid rgba(212,98,42,0.10)' }} />
      <div style={{ position: 'absolute', top: '-240px', left: '-240px', width: '480px', height: '480px', borderRadius: '50%', border: '1px solid rgba(212,98,42,0.06)' }} />
      
      {/* Bottom Right */}
      <div style={{ position: 'absolute', bottom: '-90px', right: '-90px', width: '180px', height: '180px', borderRadius: '50%', border: '1px solid rgba(29,158,117,0.12)' }} />
      <div style={{ position: 'absolute', bottom: '-150px', right: '-150px', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(29,158,117,0.08)' }} />
      <div style={{ position: 'absolute', bottom: '-200px', right: '-200px', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(29,158,117,0.05)' }} />
    </div>
  )

  return (
    <div style={{ backgroundColor: '#0f1716', color: '#dce4e2', fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      {/* Layer background colors and patterns below everything else */}
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0f1716', zIndex: 0 }} />
      {backgroundRings}
      
      <div style={{ position: 'relative', zIndex: 10 }}> 
        <style>{`
          .task-card { background-color: rgba(255, 255, 255, 0.07); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-left: 3px solid transparent; transition: background-color 0.2s ease; }
        .task-card:hover { background-color: rgba(255,255,255,0.11); }
        .task-card.border-teal { border-left-color: #2dd4bf; }
        .task-card.border-orange { border-left-color: #D4622A; }
        .task-card.fly-left { transform: translateX(-110vw) !important; opacity: 0 !important; transition: transform 400ms cubic-bezier(0.4, 0, 1, 1), opacity 300ms ease !important; }
        .task-card.fly-right { transform: translateX(110vw) !important; opacity: 0 !important; transition: transform 400ms cubic-bezier(0.4, 0, 1, 1), opacity 300ms ease !important; }
        .sorted-card { background-color: rgba(255, 255, 255, 0.07); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; opacity: 0; transform: translateY(14px); transition: opacity 420ms ease, transform 420ms cubic-bezier(0.2, 0, 0, 1); }
        .sorted-card.border-teal { border-left: 3px solid #2dd4bf; }
        .sorted-card.border-orange { border-left: 3px solid #D4622A; }
        .sorted-card.visible { opacity: 1 !important; transform: translateY(0) !important; }
        .col-header { opacity: 0; transform: translateY(8px); transition: opacity 350ms ease, transform 350ms ease; margin-bottom: 28px; }
        .col-header.visible { opacity: 1; transform: translateY(0); }
        .sig-gradient { background: linear-gradient(135deg, #D4622A 0%, #a33e03 100%); }
        .delegate-btn { background-color: #4A9E96; }
        .think-btn { background-color: #D4622A; }
        .action-btn { transition: transform 0.15s, box-shadow 0.15s; }
        .action-btn:hover { transform: scale(1.03); }
        .action-btn:active { transform: scale(0.96) !important; }
        .dot-pulse { width: 8px; height: 8px; background: #D4622A; border-radius: 50%; animation: pulse-dot 1.5s infinite; }
        @keyframes pulse-dot { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }
        .waveform-bar { width: 3px; background: #D4622A; border-radius: 2px; }
        @keyframes wave { 0%, 100% { height: 4px; } 50% { height: 36px; } }
        .think-tooltip { position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #D4622A; color: white; padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.2s; }
        .think-btn:hover + .think-tooltip { opacity: 1; }
      `}</style>

      {/* Back Nav */}
      <nav style={{ position: 'fixed', top: '32px', left: '32px', zIndex: 50 }}>
        <button onClick={() => phase === 'sorted' ? setPhase('idle') : navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dec0b5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span> Back
        </button>
      </nav>

      {/* Header */}
      <header style={{ padding: '96px 24px 48px', textAlign: 'center', maxWidth: '896px', margin: '0 auto' }}>
        <p style={{ color: '#dec0b5', fontSize: '0.875rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8, marginBottom: '8px' }}>{userName}, I found</p>
        <h1 style={{ fontSize: 'clamp(2.25rem, 6vw, 3.75rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#dce4e2', transition: 'all 0.4s ease' }}>{phase === 'sorted' ? 'Sorted' : `${TASKS.length} tasks in your day`}</h1>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 160px', position: 'relative' }}>
        {phase !== 'sorted' && (
          <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TASKS.map(task => {
              const isTeal = task.category === 'hand-to-ai' || task.category === 'automate'
              const flyClass = flyMap[task.id] === 'left' ? 'fly-left' : flyMap[task.id] === 'right' ? 'fly-right' : ''
              return <div key={task.id} ref={el => { cardRefs.current[task.id] = el }} className={`task-card ${isTeal ? 'border-teal' : 'border-orange'} ${flyClass}`}>{renderCardContent(task)}</div>
            })}
          </div>
        )}

        {phase === 'sorted' && (
          <>
            <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', height: '80%', width: '1px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.06), transparent)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', position: 'relative', zIndex: 10 }}>
              <div>
                <div className={`col-header ${sortedVisible ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
                  <h2 style={{ color: '#2dd4bf', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Hand to AI</h2>
                  <p style={{ color: 'rgba(220,228,226,0.5)', fontSize: '0.8125rem', marginTop: '4px' }}>Thrivee handles these</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {handToAI.map((task, i) => <div key={task.id} className={`sorted-card border-teal ${sortedVisible ? 'visible' : ''}`} style={{ transitionDelay: `${60 + i * 70}ms` }}>{renderCardContent(task)}</div>)}
                </div>
              </div>
              <div>
                <div className={`col-header ${sortedVisible ? 'visible' : ''}`} style={{ transitionDelay: '80ms' }}>
                  <h2 style={{ color: '#D4622A', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Protect</h2>
                  <p style={{ color: 'rgba(220,228,226,0.5)', fontSize: '0.8125rem', marginTop: '4px' }}>Only you can do these</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {protect.map((task, i) => <div key={task.id} className={`sorted-card border-orange ${sortedVisible ? 'visible' : ''}`} style={{ transitionDelay: `${100 + i * 70}ms` }}>{renderCardContent(task)}</div>)}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating UI */}
      {phase === 'sorted' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '24px', background: 'rgba(15,23,22,0.85)', backdropFilter: 'blur(24px)', zIndex: 40, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            
            {showVoiceChat && (
              <div style={{ background: '#192120', border: '1px solid #D4622A', borderRadius: '12px', padding: '16px', marginBottom: '24px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="dot-pulse" style={{ background: isDelegated ? '#2dd4bf' : '#D4622A' }} />
                    <span style={{ color: isDelegated ? '#2dd4bf' : '#D4622A', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.1em' }}>
                      {isDelegated ? 'AGENT ROOT STARTING' : 'THRIVE IS SPEAKING'}
                    </span>
                  </div>
                  <button onClick={() => setShowVoiceChat(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', cursor: 'pointer' }}>✕ dismiss</button>
                </div>
                
                <div style={{ background: '#0a0f0e', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '16px' }}>
                  {[...Array(18)].map((_, i) => (
                    <div key={i} className="waveform-bar" style={{ 
                      height: '4px',
                      background: isDelegated ? '#2dd4bf' : '#D4622A',
                      animation: (isSpeaking || isDelegated) ? `wave ${0.4 + Math.random() * 0.5}s ease-in-out infinite` : 'none',
                      animationDelay: `${Math.random() * 0.5}s`
                    }} />
                  ))}
                </div>

                <div style={{ textAlign: 'center', fontSize: '1rem', lineHeight: 1.6, minHeight: '3em', color: isDelegated ? '#2dd4bf' : 'inherit' }}>
                  {isDelegated ? (
                    <div style={{ fontWeight: 700 }}>✓ Agent Root starting... Working on your {handToAI.length} AI tasks</div>
                  ) : (
                    voiceWords.map((word, i) => {
                      let color = 'rgba(255,255,255,0.05)'
                      let fontWeight = 400
                      if (i < currentWordIndex) color = 'rgba(45, 212, 191, 0.4)'
                      if (i === currentWordIndex) { color = 'white'; fontWeight = 700 }
                      return <span key={i} style={{ color, fontWeight, transition: 'color 0.2s', margin: '0 2px' }}>{word} </span>
                    })
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <button 
                className="delegate-btn action-btn" 
                onClick={() => {
                  setIsDelegated(true)
                  setTimeout(() => navigate('/dashboard?panel=agent', { state: { tasks: TASKS, expandAgent: true } }), 1000)
                }} 
                disabled={isDelegated}
                style={{ width: '100%', padding: '16px', borderRadius: '9999px', fontWeight: 700, color: 'white', border: 'none', cursor: isDelegated ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: isDelegated ? 'none' : '0 8px 24px rgba(74,158,150,0.35)', opacity: isDelegated ? 0.6 : 1, transition: 'all 0.3s' }}
              >
                {isDelegated ? 'Tasks Delegated' : 'Delegate →'}
              </button>
              <div style={{ position: 'relative' }}>
                <button className="think-btn action-btn" onClick={() => navigate('/dashboard?panel=focus', { state: { tasks: TASKS, expandFocus: true } })} style={{ width: '100%', padding: '16px', borderRadius: '9999px', fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(212,98,42,0.35)' }}>Think →</button>
                <div className="think-tooltip">Goes to Your Focus</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort CTA */}
      {phase !== 'sorted' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(15,23,22,0.75)', backdropFilter: 'blur(20px)', zIndex: 40 }}>
          <button onClick={handleSort} disabled={phase === 'flying'} className="sig-gradient action-btn" style={{ color: 'white', fontWeight: 700, padding: '16px 56px', borderRadius: '9999px', fontSize: '1.125rem', border: 'none', cursor: phase === 'flying' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 30px rgba(212,98,42,0.4)', opacity: phase === 'flying' ? 0.6 : 1 }}>Sort →</button>
          <p style={{ marginTop: '14px', color: 'rgba(220,228,226,0.5)', fontSize: '0.8125rem' }}>Watch what happens next</p>
        </div>
      )}

      {/* Think Transition Overlay */}
      {showThinkTransition && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#0f1716', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          {backgroundRings}
          <div style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, marginBottom: '16px' }}>Your Focus — {protect[0]?.text.split(' ').slice(0, 3).join(' ') || 'Strategy'}</h2>
            <p style={{ color: '#dec0b5', fontSize: '1.125rem', lineHeight: 1.6, marginBottom: '48px' }}>AI is handling the grunt work. This is the task only you can do.</p>
            <button 
              onClick={() => navigate('/whiteboard')}
              className="think-btn action-btn pulse-soft"
              style={{ padding: '20px 48px', borderRadius: '9999px', color: 'white', border: 'none', fontWeight: 700, fontSize: '1.125rem', boxShadow: '0 20px 40px rgba(212,98,42,0.3)', cursor: 'pointer' }}
            >Open Thinking Canvas →</button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

