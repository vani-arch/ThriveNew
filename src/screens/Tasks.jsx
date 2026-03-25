import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { auth } from '../firebase'

// ─── Fallback used when navigated to directly (no API tasks in state) ─────────
const FALLBACK_TASKS = [
  { id: 1,  text: 'Resize 40 festive Ugadi banners',           category: 'hand-to-ai', reason: 'Highly repeatable format updates.', time_estimate: '30 mins', urgency: 'low' },
  { id: 2,  text: 'Pivot visual language to Coastal identity', category: 'protect', reason: 'Core brand and judgment required.', time_estimate: '2 hrs', urgency: 'high' },
  { id: 3,  text: 'Generate UTM links for 12 influencers',     category: 'hand-to-ai', reason: 'Mechanical data entry mapping.', time_estimate: '15 mins', urgency: 'medium' },
  { id: 4,  text: 'Analyse why Hubli leads dropped 18%',       category: 'protect', reason: 'Context-heavy strategic analysis.', time_estimate: '1.5 hrs', urgency: 'high' },
  { id: 5,  text: 'Format media spend CSV for agency',         category: 'hand-to-ai', reason: 'Basic predictable spreadsheet cleanup.', time_estimate: '45 mins', urgency: 'low' },
  { id: 6,  text: 'Build CFO briefing on Mangaluru campaign',  category: 'protect', reason: 'Internal stakeholder relationship management.', time_estimate: '1 hr', urgency: 'high' },
]

// Animation phases:  idle → flying → sorted
//   idle   — single-column list with colored borders
//   flying — cards translate off screen (automate → left, own → right)
//   sorted — two-column layout fades in with staggered cards

export default function Tasks() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const user = auth.currentUser
  const rawName = user?.displayName || (user?.email ? user.email.split('@')[0].split('.')[0] : 'Megha')
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  // Normalise from Claude API shape
  const getInitialTasks = () => {
    if (location.state?.tasks) return location.state.tasks
    try {
      const stored = localStorage.getItem('thrivee_tasks')
      if (stored) return JSON.parse(stored)
    } catch(e) {}
    return FALLBACK_TASKS
  }

  const TASKS = getInitialTasks().map((t, i) => ({
    id:            t.id ?? i + 1,
    text:          t.text ?? t.task,
    category:      t.category ?? t.type ?? 'protect',
    reason:        t.reason || 'Strategic priority.',
    time_estimate: t.time_estimate || '1 hr',
    urgency:       (t.urgency || 'medium').toLowerCase(),
  }))

  const handToAI = TASKS.filter(t => t.category === 'hand-to-ai' || t.category === 'automate')
  const protect  = TASKS.filter(t => t.category === 'protect' || t.category === 'own')

  // phase: 'idle' | 'flying' | 'sorted'
  const [phase, setPhase] = useState('idle')
  // Per-card fly direction
  const [flyMap, setFlyMap] = useState({}) // { [id]: 'left' | 'right' }
  const cardRefs = useRef({})

  const handleSort = () => {
    if (phase !== 'idle') return

    const map = {}
    TASKS.forEach(t => { 
      map[t.id] = (t.category === 'hand-to-ai' || t.category === 'automate') ? 'left' : 'right' 
    })
    setFlyMap(map)
    setPhase('flying')

    // Transition to sorted
    setTimeout(() => setPhase('sorted'), 480)
  }

  const [sortedVisible, setSortedVisible] = useState(false)
  const sessionSavedRef = useRef(false)

  useEffect(() => {
    if (phase === 'sorted') {
      requestAnimationFrame(() => setSortedVisible(true))

      if (!sessionSavedRef.current) {
        sessionSavedRef.current = true

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
          stats: {
            total: TASKS.length,
            handToAI: handToAI.length,
            protect: protect.length
          }
        }
        
        try {
          const existing = JSON.parse(localStorage.getItem('thrivee_sessions') || '[]')
          existing.unshift(session)
          localStorage.setItem('thrivee_sessions', JSON.stringify(existing))
        } catch (e) {
          console.error('Failed to save session:', e)
        }
      }
    } else {
      setSortedVisible(false)
    }
  }, [phase, TASKS, handToAI.length, protect])

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

  return (
    <div style={{ backgroundColor: '#0f1716', color: '#dce4e2', fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        /* ── Base card ─────────────────────────────────────────────── */
        .task-card {
          background-color: rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-left: 3px solid transparent;
          transition: background-color 0.2s ease;
        }
        .task-card:hover { background-color: rgba(255,255,255,0.11); }

        /* ── Colored left border in unsorted view ──────────────────── */
        .task-card.border-teal   { border-left-color: #2dd4bf; }
        .task-card.border-orange { border-left-color: #D4622A; }

        /* ── Flying animation ──────────────────────────────────────── */
        .task-card.fly-left {
          transform: translateX(-110vw) !important;
          opacity: 0 !important;
          transition: transform 400ms cubic-bezier(0.4, 0, 1, 1),
                      opacity   300ms ease !important;
        }
        .task-card.fly-right {
          transform: translateX(110vw) !important;
          opacity: 0 !important;
          transition: transform 400ms cubic-bezier(0.4, 0, 1, 1),
                      opacity   300ms ease !important;
        }

        /* ── Sorted column cards ───────────────────────────────────── */
        .sorted-card {
          background-color: rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 420ms ease, transform 420ms cubic-bezier(0.2, 0, 0, 1);
        }
        .sorted-card.border-teal   { border-left: 3px solid #2dd4bf; }
        .sorted-card.border-orange { border-left: 3px solid #D4622A; }
        .sorted-card.visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .sorted-card:hover { background-color: rgba(255,255,255,0.11); }

        /* ── Column header fade ────────────────────────────────────── */
        .col-header {
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 350ms ease, transform 350ms ease;
          margin-bottom: 28px;
        }
        .col-header.visible { opacity: 1; transform: translateY(0); }

        /* ── Bottom bar ────────────────────────────────────────────── */
        .sig-gradient { background: linear-gradient(135deg, #D4622A 0%, #a33e03 100%); }
        .delegate-btn { background-color: #4A9E96; }
        .think-btn    { background-color: #D4622A; }
        .action-btn   { transition: transform 0.15s, box-shadow 0.15s; }
        .action-btn:hover  { transform: scale(1.03); }
        .action-btn:active { transform: scale(0.96) !important; }
      `}</style>

      {/* Back Nav */}
      <nav style={{ position: 'fixed', top: '32px', left: '32px', zIndex: 50 }}>
        <button
          onClick={() => navigate('/home')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dec0b5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
          Back
        </button>
      </nav>

      {/* Header */}
      <header style={{ padding: '96px 24px 48px', textAlign: 'center', maxWidth: '896px', margin: '0 auto' }}>
        <p style={{ color: '#dec0b5', fontSize: '0.875rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8, marginBottom: '8px' }}>{userName}, I found</p>
        <h1 style={{ fontSize: 'clamp(2.25rem, 6vw, 3.75rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#dce4e2', transition: 'all 0.4s ease' }}>
          {phase === 'sorted' ? 'Sorted' : `${TASKS.length} tasks in your day`}
        </h1>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 160px', position: 'relative' }}>

        {/* UNSORTED / FLYING view — both idle and flying phases render this */}
        {phase !== 'sorted' && (
          <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TASKS.map(task => {
              const isTeal   = task.category === 'hand-to-ai' || task.category === 'automate'
              const flyClass = flyMap[task.id] === 'left'  ? 'fly-left'
                             : flyMap[task.id] === 'right' ? 'fly-right'
                             : ''
              return (
                <div
                  key={task.id}
                  ref={el => { cardRefs.current[task.id] = el }}
                  className={`task-card ${isTeal ? 'border-teal' : 'border-orange'} ${flyClass}`}
                >
                  {renderCardContent(task)}
                </div>
              )
            })}
          </div>
        )}

        {/* SORTED two-column view */}
        {phase === 'sorted' && (
          <>
            <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', height: '80%', width: '1px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.06), transparent)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', position: 'relative', zIndex: 10 }}>

            {/* Left: Hand to AI */}
            <div>
              <div className={`col-header ${sortedVisible ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
                <h2 style={{ color: '#2dd4bf', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Hand to AI</h2>
                <p style={{ color: 'rgba(220,228,226,0.5)', fontSize: '0.8125rem', marginTop: '4px' }}>Thrivee handles these</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {handToAI.map((task, i) => (
                  <div
                    key={task.id}
                    className={`sorted-card border-teal ${sortedVisible ? 'visible' : ''}`}
                    style={{ transitionDelay: `${60 + i * 70}ms` }}
                  >
                    {renderCardContent(task)}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Protect */}
            <div>
              <div className={`col-header ${sortedVisible ? 'visible' : ''}`} style={{ transitionDelay: '80ms' }}>
                <h2 style={{ color: '#D4622A', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Protect</h2>
                <p style={{ color: 'rgba(220,228,226,0.5)', fontSize: '0.8125rem', marginTop: '4px' }}>Only you can do these</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {protect.map((task, i) => (
                  <div
                    key={task.id}
                    className={`sorted-card border-orange ${sortedVisible ? 'visible' : ''}`}
                    style={{ transitionDelay: `${100 + i * 70}ms` }}
                  >
                    {renderCardContent(task)}
                  </div>
                ))}
              </div>
            </div>

          </div>
          </>
        )}
      </main>

      {/* ── Bottom floating bar ───────────────────────────────────────── */}

      {/* Sort CTA — shown while idle or flying */}
      {phase !== 'sorted' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(15,23,22,0.75)', backdropFilter: 'blur(20px)', zIndex: 40 }}>
          <button
            onClick={handleSort}
            disabled={phase === 'flying'}
            className="sig-gradient action-btn"
            style={{ color: 'white', fontWeight: 700, padding: '16px 56px', borderRadius: '9999px', fontSize: '1.125rem', border: 'none', cursor: phase === 'flying' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 30px rgba(212,98,42,0.4)', opacity: phase === 'flying' ? 0.6 : 1, transition: 'opacity 0.3s' }}
          >
            Sort →
          </button>
          <p style={{ marginTop: '14px', color: 'rgba(220,228,226,0.5)', fontSize: '0.8125rem', letterSpacing: '0.1em' }}>
            Watch what happens next
          </p>
        </div>
      )}

      {/* Delegate & Think — shown after sorted */}
      {phase === 'sorted' && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '40px 24px', background: 'rgba(15,23,22,0.75)', backdropFilter: 'blur(20px)', zIndex: 40 }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="delegate-btn action-btn"
                onClick={() => {
                  const automateTasks = handToAI.map(t => ({ id: t.id, task: t.text, category: 'automate' }))
                  const ownTasks      = protect.map(t => ({ id: t.id, task: t.text, category: 'own' }))
                  navigate('/dashboard?panel=agent', { state: { automateTasks, ownTasks, expandAgent: true } })
                }}
                style={{ width: '100%', maxWidth: '400px', padding: '16px 32px', borderRadius: '9999px', fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(74,158,150,0.35)', fontSize: '1rem' }}
              >
                Delegate →
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="think-btn action-btn"
                onClick={() => {
                  const automateTasks = handToAI.map(t => ({ id: t.id, task: t.text, category: 'automate' }))
                  const ownTasks      = protect.map(t => ({ id: t.id, task: t.text, category: 'own' }))
                  navigate('/dashboard?panel=focus', { state: { automateTasks, ownTasks, expandFocus: true } })
                }}
                style={{ width: '100%', maxWidth: '400px', padding: '16px 32px', borderRadius: '9999px', fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(212,98,42,0.35)', fontSize: '1rem' }}
              >
                Think →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background glow */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: -1, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-25%', left: '-25%', width: '50%', height: '50%', background: 'rgba(255,181,150,0.08)', filter: 'blur(120px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '33%', height: '33%', background: 'rgba(118,209,255,0.05)', filter: 'blur(100px)', borderRadius: '50%' }} />
      </div>
    </div>
  )
}
