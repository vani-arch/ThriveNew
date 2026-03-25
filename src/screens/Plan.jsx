import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Plan() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('thrivee_sessions') || '[]')
      setSessions(stored)
    } catch (e) {
      console.error('Failed to parse sessions from local storage:', e)
    }
  }, [])

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div style={{ backgroundColor: '#0F1716', color: '#dce4e2', fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <style>{`
        .session-card {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .session-card:hover {
          background: rgba(255,255,255,0.05);
        }
        .task-list {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .task-item {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 16px;
          border-left: 3px solid transparent;
        }
        .task-item.border-orange {
          border-left-color: #D4622A;
        }
        .task-item.border-green {
          border-left-color: #2dd4bf;
        }
        .start-btn {
          margin-top: 32px;
          background: #D4622A;
          color: white;
          padding: 16px 40px;
          border-radius: 9999px;
          border: none;
          font-weight: 700;
          font-size: 1.125rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          box-shadow: 0 10px 30px rgba(212,98,42,0.3);
        }
        .start-btn:hover {
          transform: scale(1.05);
        }
      `}</style>
      
      {/* Top Header Placeholder to match spacing, but simple header block */}
      <header style={{ padding: '40px 24px 32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: '8px' }}>Your Library</h1>
        <p style={{ color: '#a0aab2', fontSize: '1rem', fontWeight: 500 }}>Every session. Every insight.</p>
      </header>

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '0 24px 120px', maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <p style={{ color: '#a0aab2', fontSize: '1.25rem', fontWeight: 500 }}>Your first session will appear here</p>
            <button className="start-btn" onClick={() => navigate('/dashboard')}>Start Today →</button>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="session-card" onClick={() => toggleExpand(session.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', margin: 0, paddingRight: '16px' }}>{session.title}</h2>
                <span style={{ color: '#a0aab2', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{session.date}</span>
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#a0aab2' }}>
                {session.stats.handToAI} automated · {session.stats.protect} protected · {(session.stats.handToAI * 1.5).toFixed(1)} hrs saved
              </div>
              
              {expandedId === session.id && (
                <div className="task-list">
                  {(session.tasks || []).map((t, index) => {
                    const isAutomate = (t.category === 'hand-to-ai' || t.category === 'automate')
                    return (
                      <div key={t.id || index} className={`task-item ${isAutomate ? 'border-orange' : 'border-green'}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#dce4e2' }}>{t.text || t.task}</span>
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontStyle: 'italic', color: '#a0aab2' }}>{t.reason || (isAutomate ? 'Automated task' : 'Strategic task')}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {/* Bottom Mobile Nav */}
      <nav style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, width: '100%', justifyContent: 'space-around', alignItems: 'center', padding: '0 16px 24px', paddingTop: '8px', background: 'rgba(13,21,20,0.8)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        {[
          { icon: 'wb_sunny', label: 'Today', path: '/home', active: false },
          { icon: 'calendar_today', label: 'Library', path: '/plan', active: true },
          { icon: 'timer', label: 'Focus', path: '/focus', active: false },
          { icon: 'person', label: 'Me', path: '/me', active: false },
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
    </div>
  )
}
