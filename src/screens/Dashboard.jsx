import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const panel = searchParams.get('panel') // 'agent' or 'focus'

  const [panelState, setPanelState] = useState('default') // default | agent-expanded | focus-expanded
  const [statsCollapsed, setStatsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('insights')
  const [activeTask, setActiveTask] = useState('Why are Hubli creatives not resonating?')
  const [instinct, setInstinct] = useState('')
  const [showResponse, setShowResponse] = useState(false)
  const [stickyCollapsed, setStickyCollapsed] = useState(false)
  const [signalInput, setSignalInput] = useState('')
  const [signals, setSignals] = useState(['Coastal Ochre palette'])

  // On mount, read URL param and expand correct panel
  useEffect(() => {
    if (panel === 'agent') {
      setPanelState('agent-expanded')
    } else if (panel === 'focus') {
      setPanelState('focus-expanded')
    }
  }, [panel])

  // Auto-collapse stats after 3s
  useEffect(() => {
    const t = setTimeout(() => setStatsCollapsed(true), 3000)
    return () => clearTimeout(t)
  }, [])

  const leftClass = panelState === 'agent-expanded'
    ? 'panel-expanded'
    : panelState === 'focus-expanded'
      ? 'panel-collapsed-strip'
      : 'panel-half'

  const rightClass = panelState === 'focus-expanded'
    ? 'panel-expanded'
    : panelState === 'agent-expanded'
      ? 'panel-collapsed-strip'
      : 'panel-half'

  const toggleLeft = () => {
    setPanelState(prev => prev === 'agent-expanded' ? 'default' : 'agent-expanded')
  }
  const toggleRight = () => {
    setPanelState(prev => prev === 'focus-expanded' ? 'default' : 'focus-expanded')
  }

  const handleInstinctSend = () => {
    if (instinct.trim()) setShowResponse(true)
  }

  const addSignal = (e) => {
    if (e.key === 'Enter' && signalInput.trim()) {
      setSignals(prev => [...prev, signalInput.trim()])
      setSignalInput('')
    }
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#0f1716', color: '#dce4e2', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        .teal-text { color: #2dd4bf; }
        .teal-bg { background-color: #2dd4bf; }
        .panel-container { display: flex; gap: 1.5rem; min-height: 750px; transition: all 350ms ease-in-out; }
        .panel-half { flex: 1; min-width: 0; }
        .panel-expanded { flex: 3; min-width: 0; }
        .panel-collapsed-strip { flex: 0 0 80px; min-width: 80px; cursor: pointer; }
        .vertical-text { writing-mode: vertical-lr; transform: rotate(180deg); }
        .progress-fill { transition: width 1s cubic-bezier(0.65, 0, 0.35, 1); }
        .tab-active { color: #D4622A; border-bottom: 2px solid #D4622A; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .transition-all-custom { transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1); }
        .stats-collapsed { height: 56px; overflow: hidden; }
        .stats-expanded { height: 120px; }
        .pulse-soft { animation: pulse-soft 2s infinite; }
        @keyframes pulse-soft {
          0% { box-shadow: 0 0 0 0 rgba(212,98,42,0.4); }
          70% { box-shadow: 0 0 0 10px rgba(212,98,42,0); }
          100% { box-shadow: 0 0 0 0 rgba(212,98,42,0); }
        }
        .notebook-input {
          background: #1A1A1A;
          border: 1px solid #D4622A;
          box-shadow: 0 0 10px rgba(212,98,42,0.2);
          width: 100%;
          padding: 16px 50px 16px 20px;
          color: white;
          outline: none;
          border-radius: 12px;
        }
        .notebook-input::placeholder { color: #666666; }
        .notebook-input:focus { box-shadow: 0 0 15px rgba(212,98,42,0.3); }
        .sticky-note {
          width: 200px; height: 150px; background: #FFF8DC; color: #1a1a1a;
          position: fixed; bottom: 24px; right: 24px; z-index: 50;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3); border-radius: 8px;
          overflow: hidden; display: flex; flex-direction: column;
          transition: all 0.3s;
        }
        .sticky-note.collapsed { height: 32px; }
        .notepad-lines {
          background-image: linear-gradient(#e5e0c9 1px, transparent 1px);
          background-size: 100% 16px; padding-top: 4px;
        }
        .checkpoint-item.checked .check-icon { color: #2dd4bf; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, background: 'rgba(15,23,22,0.8)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', height: '80px', borderBottom: '1px solid rgba(87,66,58,0.1)' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#D4622A' }}>Thrivee</span>
      </nav>

      <main style={{ paddingTop: '112px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '48px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Stats Bar */}
          <div
            className={`transition-all-custom ${statsCollapsed ? 'stats-collapsed' : 'stats-expanded'}`}
            style={{ background: 'rgba(35,44,42,0.4)', borderRadius: '16px', border: '1px solid rgba(87,66,58,0.1)', position: 'relative' }}
          >
            {!statsCollapsed && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', padding: '24px', height: '100%' }}>
                {[['Time Recovered', '14 hrs'], ['Automated Tasks', '7 active'], ['Data Streams', '5 protected']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>
            )}
            {statsCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 32px', height: '100%' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>14 hrs recovered · 7 automated · 5 protected</span>
              </div>
            )}
            <button
              onClick={() => setStatsCollapsed(v => !v)}
              className="material-symbols-outlined"
              style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.25rem' }}
            >
              {statsCollapsed ? 'expand_more' : 'expand_less'}
            </button>
          </div>

          {/* Panels */}
          <div className="panel-container">
            {/* LEFT: Agent Root */}
            <div
              className={`${leftClass} transition-all-custom`}
              style={{ background: '#192120', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(87,66,58,0.1)', position: 'relative' }}
            >
              {panelState !== 'focus-expanded' ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Panel header */}
                  <div style={{ padding: '16px', borderBottom: '1px solid rgba(87,66,58,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(35,44,42,0.4)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ position: 'relative', width: '8px', height: '8px' }}>
                        <div style={{ position: 'absolute', inset: 0, background: '#4ade80', borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', inset: 0, background: '#4ade80', borderRadius: '50%', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.75 }} />
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Agent Root</h3>
                      <span style={{ fontSize: '0.625rem', fontWeight: 900, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'rgba(255,255,255,0.6)' }}>LIVE</span>
                    </div>
                    <button onClick={toggleLeft} className="material-symbols-outlined" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.25rem' }}>open_in_full</button>
                  </div>

                  {/* Sidebar content */}
                  <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>Working on</h4>
                      {[
                        { label: '📧 Writing Ugadi email subjects', progress: 80, count: '4/5', id: 'p1' },
                        { label: '🖼 Resizing festive banners', progress: 100, count: '40/40', id: 'p2' },
                      ].map(item => (
                        <div key={item.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</span>
                            <span className="teal-text" style={{ fontSize: '0.625rem', fontWeight: 700 }}>{item.count}</span>
                          </div>
                          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '12px' }}>
                            <div className="teal-bg progress-fill" style={{ height: '100%', width: `${item.progress}%` }} />
                          </div>
                          <button style={{ fontSize: '0.625rem', fontWeight: 700, color: '#D4622A', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            View work <span className="material-symbols-outlined" style={{ fontSize: '0.75rem' }}>arrow_forward</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>Done</h4>
                      {['Email subjects — 5 generated', '40 banners resized', 'CSV sent to agency'].map(item => (
                        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>
                          <span className="material-symbols-outlined teal-text" style={{ fontSize: '0.875rem' }}>check</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Slim strip for agent when focus is expanded */
                <div onClick={toggleLeft} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', justifyContent: 'space-between', borderLeft: '1px solid rgba(45,212,191,0.3)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.625rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>LIVE</span>
                  </div>
                  <div className="vertical-text" style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>AGENT ROOT</div>
                  <div />
                </div>
              )}
            </div>

            {/* RIGHT: Your Focus */}
            <div
              className={`${rightClass} transition-all-custom`}
              style={{ background: '#192120', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(87,66,58,0.1)', position: 'relative' }}
            >
              {panelState !== 'agent-expanded' ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Panel header */}
                  <div style={{ padding: '20px', borderBottom: '1px solid rgba(87,66,58,0.1)', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(35,44,42,0.4)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Your Focus</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: '9999px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          {['insights', 'signals', 'next'].map(tab => (
                            <button
                              key={tab}
                              onClick={() => setActiveTab(tab)}
                              className={activeTab === tab ? 'tab-active' : ''}
                              style={{ padding: '6px 16px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '9999px', border: 'none', background: 'transparent', cursor: 'pointer', color: activeTab === tab ? '#D4622A' : 'rgba(255,255,255,0.3)', textTransform: 'capitalize', transition: 'all 0.2s' }}
                            >
                              {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                          ))}
                        </div>
                        <button onClick={toggleRight} className="material-symbols-outlined" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.25rem' }}>open_in_full</button>
                      </div>
                    </div>
                    {/* Task pills */}
                    <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {[
                        { label: 'Pivot visual language', question: 'Why are Hubli creatives not resonating?' },
                        { label: 'Analyse Hubli leads', question: 'What is causing the Hubli lead drop?' },
                        { label: 'Map competitor pricing', question: 'How does our pricing compare in Mangaluru?' },
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={() => { setActiveTask(item.question); setShowResponse(false) }}
                          style={{
                            flexShrink: 0, padding: '8px 16px', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                            ...(activeTask === item.question
                              ? { background: '#D4622A', border: '1px solid #D4622A', color: 'white' }
                              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' })
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab content */}
                  <div style={{ flexGrow: 1, overflowY: 'auto', padding: '40px' }}>
                    {/* Insights tab */}
                    {activeTab === 'insights' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '672px', margin: '0 auto', width: '100%', gap: '48px' }}>
                        <h4 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 300, textAlign: 'center', lineHeight: 1.4 }}>
                          {activeTask.includes('Hubli creatives') ? (
                            <>Why are <span style={{ color: '#D4622A', fontWeight: 700 }}>Hubli creatives</span> not resonating?</>
                          ) : activeTask.includes('lead drop') ? (
                            <>What is causing the <span style={{ color: '#D4622A', fontWeight: 700 }}>Hubli lead drop</span>?</>
                          ) : (
                            <>How does our pricing compare in <span style={{ color: '#D4622A', fontWeight: 700 }}>Mangaluru</span>?</>
                          )}
                        </h4>
                        <div style={{ width: '100%', position: 'relative' }}>
                          <input
                            className="notebook-input"
                            type="text"
                            placeholder="What's your instinct?"
                            value={instinct}
                            onChange={e => setInstinct(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleInstinctSend()}
                            style={{ fontSize: '1.125rem', caretColor: '#D4622A' }}
                          />
                          <button
                            onClick={handleInstinctSend}
                            className="material-symbols-outlined"
                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#D4622A', background: 'rgba(212,98,42,0.1)', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', fontSize: '1.25rem' }}
                          >
                            arrow_forward
                          </button>
                        </div>
                        {showResponse && (
                          <div style={{ width: '100%', background: '#1A1208', borderLeft: '4px solid #D4622A', padding: '24px', borderRadius: '0 12px 12px 0' }}>
                            <p style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.6 }}>
                              "Checking regional engagement data... It seems the 'Coastal Ochre' palette is outperforming 'Golden Temple' specifically in north Karnataka. Shall I swap the banner backgrounds?"
                            </p>
                          </div>
                        )}
                        <button
                          onClick={() => navigate('/whiteboard')}
                          style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #D4622A', color: '#D4622A', fontWeight: 700, borderRadius: '12px', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s', marginTop: '32px' }}
                        >
                          Thinking Canvas →
                        </button>
                      </div>
                    )}

                    {/* Signals tab */}
                    {activeTab === 'signals' && (
                      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '576px', margin: '0 auto', width: '100%' }}>
                        <h5 style={{ fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' }}>Active Market Signals</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                          {signals.map((sig, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '12px', border: '1px solid rgba(87,66,58,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                              <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.1)', fontSize: '1.25rem' }}>check_circle</span>
                              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{sig}</span>
                            </div>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="+ Add your own signal"
                          value={signalInput}
                          onChange={e => setSignalInput(e.target.value)}
                          onKeyDown={addSignal}
                          style={{ width: '100%', background: 'transparent', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '12px 0', fontSize: '0.875rem', color: '#dce4e2', outline: 'none', caretColor: '#D4622A' }}
                        />
                      </div>
                    )}

                    {/* Next tab */}
                    {activeTab === 'next' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <div style={{ background: 'rgba(212,98,42,0.05)', border: '1px solid rgba(212,98,42,0.2)', borderRadius: '16px', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '32px', boxShadow: '0 0 40px rgba(212,98,42,0.1)', maxWidth: '400px' }}>
                          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(212,98,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: '#D4622A', fontSize: '2.5rem' }}>rocket_launch</span>
                          </div>
                          <p style={{ fontSize: '1.125rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>You've identified the signals. Now map the full strategy.</p>
                          <button
                            onClick={() => navigate('/whiteboard')}
                            className="pulse-soft"
                            style={{ width: '100%', border: '2px solid #D4622A', color: '#D4622A', fontWeight: 900, padding: '16px 32px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                          >
                            Thinking Canvas →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Slim strip for focus when agent is expanded */
                <div onClick={toggleRight} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', justifyContent: 'space-between', borderLeft: '1px solid rgba(212,98,42,0.3)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <span style={{ background: 'rgba(212,98,42,0.2)', color: '#D4622A', fontSize: '0.625rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px' }}>3</span>
                  </div>
                  <div className="vertical-text" style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>YOUR FOCUS</div>
                  <div />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Note */}
      <div className={`sticky-note ${stickyCollapsed ? 'collapsed' : ''}`}>
        <div onClick={() => setStickyCollapsed(v => !v)} style={{ background: '#1a1a1a', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>edit</span>
            <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>Notes</span>
          </div>
          <button style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.125rem', fontWeight: 700 }}>−</button>
        </div>
        {!stickyCollapsed && (
          <div className="notepad-lines" style={{ flexGrow: 1, padding: '16px', overflow: 'hidden' }}>
            <textarea
              style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(26,26,26,0.8)', fontFamily: 'inherit' }}
              placeholder="Scribble here..."
            />
          </div>
        )}
      </div>
    </div>
  )
}
