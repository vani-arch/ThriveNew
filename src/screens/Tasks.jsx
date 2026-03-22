import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

// ─── Fallback used when navigated to directly (no API tasks in state) ─────────
const FALLBACK_TASKS = [
  { id: 1,  text: 'Resize 40 festive Ugadi banners',           type: 'automate' },
  { id: 2,  text: 'Pivot visual language to Coastal identity',  type: 'own'      },
  { id: 3,  text: 'Generate UTM links for 12 influencers',      type: 'automate' },
  { id: 4,  text: 'Analyse why Hubli leads dropped 18%',        type: 'own'      },
  { id: 5,  text: 'Format media spend CSV for agency',          type: 'automate' },
  { id: 6,  text: 'Build CFO briefing on Mangaluru campaign',   type: 'own'      },
  { id: 7,  text: 'Pull Mangaluru lead drop data',              type: 'automate' },
  { id: 8,  text: 'Define Regional Soul creative direction',    type: 'own'      },
  { id: 9,  text: 'Schedule launch day social posts',           type: 'automate' },
  { id: 10, text: 'Map competitor local pricing strategy',      type: 'own'      },
  { id: 11, text: 'Export competitor ad spend report',          type: 'automate' },
  { id: 12, text: 'Generate Ugadi emailer subject lines',       type: 'automate' },
]

// Animation phases:  idle → flying → sorted
//   idle   — single-column list with colored borders
//   flying — cards translate off screen (automate → left, own → right)
//   sorted — two-column layout fades in with staggered cards

export default function Tasks() {
  const navigate  = useNavigate()
  const location  = useLocation()

  // Normalise from Claude API shape {task,category} or fallback shape {text,type}
  const TASKS = (location.state?.tasks ?? FALLBACK_TASKS).map((t, i) => ({
    id:   t.id ?? i + 1,
    text: t.task ?? t.text,
    type: t.category ?? t.type,
  }))

  const aiTasks  = TASKS.filter(t => t.type === 'automate')
  const ownTasks = TASKS.filter(t => t.type === 'own')

  // phase: 'idle' | 'flying' | 'sorted'
  const [phase, setPhase] = useState('idle')
  // Per-card fly direction: populated right before the flying phase
  const [flyMap, setFlyMap] = useState({}) // { [id]: 'left' | 'right' }
  const cardRefs = useRef({})              // DOM refs for each unsorted card

  const handleSort = () => {
    if (phase !== 'idle') return

    // Build the fly direction map
    const map = {}
    TASKS.forEach(t => { map[t.id] = t.type === 'automate' ? 'left' : 'right' })
    setFlyMap(map)
    setPhase('flying')

    // After cards have flown off (400 ms), switch to the two-column view
    setTimeout(() => setPhase('sorted'), 480)
  }

  // Stagger the sorted column cards by triggering reflow once mounted
  const [sortedVisible, setSortedVisible] = useState(false)
  useEffect(() => {
    if (phase === 'sorted') {
      // Give React a frame to mount the sorted DOM before starting the animation
      requestAnimationFrame(() => setSortedVisible(true))
    } else {
      setSortedVisible(false)
    }
  }, [phase])

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
        <p style={{ color: '#dec0b5', fontSize: '0.875rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8, marginBottom: '8px' }}>Megha, I found</p>
        <h1 style={{ fontSize: 'clamp(2.25rem, 6vw, 3.75rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#dce4e2', transition: 'all 0.4s ease' }}>
          {phase === 'sorted' ? 'Sorted' : `${TASKS.length} tasks in your day`}
        </h1>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 160px', position: 'relative' }}>

        {/* UNSORTED / FLYING view — both idle and flying phases render this */}
        {phase !== 'sorted' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {TASKS.map(task => {
              const isTeal   = task.type === 'automate'
              const flyClass = flyMap[task.id] === 'left'  ? 'fly-left'
                             : flyMap[task.id] === 'right' ? 'fly-right'
                             : ''
              return (
                <div
                  key={task.id}
                  ref={el => { cardRefs.current[task.id] = el }}
                  className={`task-card ${isTeal ? 'border-teal' : 'border-orange'} ${flyClass}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Colored dot matches the border */}
                    <span
                      className="material-symbols-outlined"
                      style={{ color: isTeal ? '#2dd4bf' : '#D4622A', fontSize: '1.25rem' }}
                    >
                      {isTeal ? 'settings' : 'local_fire_department'}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{task.text}</span>
                  </div>
                  <span
                    className="material-symbols-outlined"
                    style={{ color: isTeal ? '#2dd4bf' : '#D4622A', fontSize: '1.125rem', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
                  >
                    check_circle
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* SORTED two-column view */}
        {phase === 'sorted' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px' }}>

            {/* Left: Hand to AI */}
            <div>
              <div className={`col-header ${sortedVisible ? 'visible' : ''}`} style={{ transitionDelay: '0ms' }}>
                <h2 style={{ color: '#2dd4bf', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Hand to AI</h2>
                <p style={{ color: 'rgba(220,228,226,0.5)', fontSize: '0.8125rem', marginTop: '4px' }}>Thrivee handles these</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {aiTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className={`sorted-card border-teal ${sortedVisible ? 'visible' : ''}`}
                    style={{ transitionDelay: `${60 + i * 70}ms` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#2dd4bf', fontSize: '1.125rem' }}>settings</span>
                      <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{task.text}</span>
                    </div>
                    <span
                      className="material-symbols-outlined"
                      style={{ color: '#2dd4bf', fontSize: '1.125rem', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
                    >
                      check_circle
                    </span>
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
                {ownTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className={`sorted-card border-orange ${sortedVisible ? 'visible' : ''}`}
                    style={{ transitionDelay: `${100 + i * 70}ms` }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span className="material-symbols-outlined" style={{ color: '#D4622A', fontSize: '1.125rem' }}>local_fire_department</span>
                      <span style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{task.text}</span>
                    </div>
                    <span
                      className="material-symbols-outlined"
                      style={{ color: '#D4622A', fontSize: '1.125rem', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}
                    >
                      check_circle
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
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
                onClick={() => navigate('/dashboard?panel=agent')}
                style={{ width: '100%', maxWidth: '400px', padding: '16px 32px', borderRadius: '9999px', fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(74,158,150,0.35)', fontSize: '1rem' }}
              >
                Delegate →
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="think-btn action-btn"
                onClick={() => navigate('/dashboard?panel=focus')}
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
