import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase'

export default function Dashboard() {
  const navigate = useNavigate()
  
  // --- BUG 1 Fix: Hardcoded Progress State ---
  const [progress1, setProgress1] = useState(0)
  const [progress2, setProgress2] = useState(0)
  const [progress3, setProgress3] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [activeTab, setActiveTab] = useState('insights')
  
  const [workModalOpen, setWorkModalOpen] = useState(false)
  const [activeTaskWork, setActiveTaskWork] = useState(null)
  
  // --- Progress Bar Animation Logic ---
  useEffect(() => {
    const animateBar = (setter, duration) => {
      let p = 0;
      const step = 100 / (duration / 150);
      const id = setInterval(() => {
        p = Math.min(parseFloat((p + step).toFixed(1)), 100);
        setter(p);
        if (p >= 100) clearInterval(id);
      }, 150);
      return id;
    };

    const id1 = animateBar(setProgress1, 8000)
    const id2 = animateBar(setProgress2, 14000)
    const id3 = animateBar(setProgress3, 20000)

    return () => {
      clearInterval(id1)
      clearInterval(id2)
      clearInterval(id3)
    }
  }, [])

  // Toast logic
  useEffect(() => {
    if (progress1 === 100 && progress2 === 100 && progress3 === 100) {
      setShowToast(true)
      const t = setTimeout(() => setShowToast(false), 4000)
      return () => clearTimeout(t)
    }
  }, [progress1, progress2, progress3])

  const handleViewWork = (taskName) => {
    setActiveTaskWork({ task: taskName, output: 'RICH_DELIVERABLE' })
    setWorkModalOpen(true)
  }

  // --- Rich Deliverables ---
  const UTMDeliverable = () => {
    const data = [
      { p: 'Instagram', i: '@shreyalifts', t: 'ugadi-2026', l: 'eduspark.com?utm_source=instagram&utm_medium=influencer&utm_campaign=ugadi-2026&utm_content=shreya' },
      { p: 'YouTube', i: '@techwithriya', t: 'ugadi-2026', l: 'eduspark.com?utm_source=youtube&utm_medium=influencer&utm_campaign=ugadi-2026&utm_content=riya' },
      { p: 'LinkedIn', i: '@growthwithkaran', t: 'ugadi-2026', l: 'eduspark.com?utm_source=linkedin&utm_medium=influencer&utm_campaign=ugadi-2026&utm_content=karan' },
    ]
    return (
      <div style={{ padding: '32px', color: '#dce4e2' }}>
        <h4 style={{ color: '#D4622A', fontWeight: 800, fontSize: '1.25rem', marginBottom: '24px' }}>UTM Links — Ugadi Influencer Campaign</h4>
        <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr><th style={{ padding: '16px' }}>Platform</th><th style={{ padding: '16px' }}>Influencer</th><th style={{ padding: '16px' }}>Tag</th><th style={{ padding: '16px' }}>Link</th></tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: 700 }}>{row.p}</td>
                  <td style={{ padding: '16px' }}>{row.i}</td>
                  <td style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }}>{row.t}</td>
                  <td style={{ padding: '16px', color: '#2dd4bf' }}>{row.l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const CompetitorDeliverable = () => {
    const blocks = [
      { stat: '41% higher CTR in Tier 2', detail: "Byju's Q4 launch used vernacular video-first vs English-only campaigns in AP and Karnataka", means: 'Your Ugadi creative should lead with Kannada or Telugu hook, not English headline', border: '#2dd4bf' },
      { stat: '3x better conversion at ₹999', detail: "PhysicsWallah's regional push — ₹999 entry point outperformed ₹1,499 in Tier 2", means: 'Price your Ugadi Tier 2 offer below ₹1,000 to match market expectation', border: '#D4622A' },
      { stat: '28% paid conversion in 30 days', detail: "Unacademy's free first week hook during Ugadi 2024", means: 'A time-limited free trial hook timed to Ugadi could drive your strongest Q1 conversion', border: '#2dd4bf' }
    ]
    return (
      <div style={{ padding: '32px', color: '#dce4e2' }}>
        <h4 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '8px' }}>Competitor Launch Intelligence — Q1 2026</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          {blocks.map((b, i) => (
            <div key={i} style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: `4px solid ${b.border}` }}>
              <h5 style={{ fontSize: '1.25rem', fontWeight: 800, color: b.border }}>{b.stat}</h5>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.5, margin: '8px 0' }}>{b.detail}</p>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>{b.means}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const CaptionsDeliverable = () => {
    const cards = [
      { tag: 'Emotional 🌿', text: 'This Ugadi, don’t just start fresh — start smart. While you celebrate new beginnings, let AI handle the grunt work so you can focus on what only you can do. 🌿 #Ugadi2026 #EduSpark' },
      { tag: 'Data-led 📊', text: 'Did you know marketing teams lose 14 hours a week to repetitive tasks? This Ugadi, EduSpark is changing that. Meet Thrive — your AI co-pilot for the work that matters. #AIForWork' },
      { tag: 'Bold 🔥', text: 'Your competition is already using AI. The question is — do you know which parts of your job to protect? This Ugadi, find out. EduSpark x Thrive. 🔥' }
    ]
    return (
      <div style={{ padding: '32px', color: '#dce4e2' }}>
        <h4 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '24px' }}>Draft Social Content Toolkit</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cards.map((c, i) => (
            <div key={i} style={{ background: '#1A1A1A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
              <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#D4622A', textTransform: 'uppercase' }}>{c.tag}</span>
              <p style={{ marginTop: '12px', fontSize: '0.9375rem', lineHeight: 1.6 }}>{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderRichDeliverable = () => {
    const task = activeTaskWork?.task || ''
    if (task.includes('UTM')) return <UTMDeliverable />
    if (task.includes('competitor')) return <CompetitorDeliverable />
    if (task.includes('social captions')) return <CaptionsDeliverable />
    return null
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#0f1716', color: '#dce4e2', minHeight: '100vh' }}>
      <style>{`
        .panel-container { display: flex; gap: 1.5rem; min-height: calc(100vh - 200px); }
        .panel-half { flex: 1; background: #192120; border: 1px solid rgba(87,66,58,0.1); borderRadius: 16px; overflow: hidden; display: flex; flexDirection: column; }
        .progress-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.05); borderRadius: 9999px; overflow: hidden; margin: 8px 0; }
        .progress-fill { height: 100%; transition: width 0.15s linear; }
        .tab-btn { padding: 8px 16px; font-size: 0.75rem; fontWeight: 700; borderRadius: 9999px; border: none; background: transparent; cursor: pointer; color: rgba(255,255,255,0.3); transition: all 0.2s; }
        .tab-btn.active { color: #D4622A; background: rgba(212,98,42,0.1); }
        .pill { padding: 8px 16px; borderRadius: 9999px; font-size: 0.75rem; fontWeight: 700; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; white-space: nowrap; }
        .pill.active { background: #D4622A; border-color: #D4622A; color: white; }
        .pill.inactive { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); }
        .signal-card { padding: 20px; borderRadius: 12px; border: 1px solid rgba(87,66,58,0.1); background: rgba(255,255,255,0.03); margin-bottom: 16px; }
        .pulse-soft { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(212,98,42,0.4); } 70% { box-shadow: 0 0 0 10px rgba(212,98,42,0); } 100% { box-shadow: 0 0 0 0 rgba(212,98,42,0); } }
      `}</style>

      {/* Nav */}
      <nav style={{ height: '80px', display: 'flex', alignItems: 'center', padding: '0 32px', borderBottom: '1px solid rgba(87,66,58,0.1)', background: 'rgba(15,23,22,0.8)', backdropFilter: 'blur(20px)' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#D4622A' }}>Thrivee</span>
      </nav>

      <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Banner */}
        <div style={{ marginBottom: '32px', background: 'rgba(35,44,42,0.4)', padding: '16px 24px', borderRadius: '12px', border: '1px solid rgba(87,66,58,0.1)' }}>
          <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
            6 hrs recovered · 3 automated · 3 protected
          </span>
        </div>

        <div className="panel-container">
          
          {/* AGENT ROOT (LEFT) */}
          <div className="panel-half">
            <div style={{ padding: '20px', background: 'rgba(35,44,42,0.6)', borderBottom: '1px solid rgba(87,66,58,0.1)', fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.1em' }}>AGENT ROOT — LIVE</div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Task 1 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                  <span>⚙️ Generate UTM links for the influencer post</span>
                  <span style={{ color: progress1 === 100 ? '#2dd4bf' : 'inherit', fontWeight: 700 }}>{progress1 === 100 ? '✓ Complete' : `${progress1.toFixed(0)}%`}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress1}%`, background: progress1 === 100 ? '#2dd4bf' : '#D4622A' }} /></div>
                <button onClick={() => handleViewWork('UTM')} disabled={progress1 < 100} style={{ background: 'none', border: 'none', color: progress1 === 100 ? '#D4622A' : 'rgba(255,255,255,0.2)', fontSize: '0.625rem', fontWeight: 800, cursor: progress1 === 100 ? 'pointer' : 'default', textTransform: 'uppercase' }}>View work →</button>
              </div>

              {/* Task 2 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                  <span>⚙️ Pull last quarter's competitor analysis</span>
                  <span style={{ color: progress2 === 100 ? '#2dd4bf' : 'inherit', fontWeight: 700 }}>{progress2 === 100 ? '✓ Complete' : `${progress2.toFixed(0)}%`}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress2}%`, background: progress2 === 100 ? '#2dd4bf' : '#D4622A' }} /></div>
                <button onClick={() => handleViewWork('competitor')} disabled={progress2 < 100} style={{ background: 'none', border: 'none', color: progress2 === 100 ? '#D4622A' : 'rgba(255,255,255,0.2)', fontSize: '0.625rem', fontWeight: 800, cursor: progress2 === 100 ? 'pointer' : 'default', textTransform: 'uppercase' }}>View work →</button>
              </div>

              {/* Task 3 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                  <span>⚙️ Draft three versions of our Ugadi social captions</span>
                  <span style={{ color: progress3 === 100 ? '#2dd4bf' : 'inherit', fontWeight: 700 }}>{progress3 === 100 ? '✓ Complete' : `${progress3.toFixed(0)}%`}</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress3}%`, background: progress3 === 100 ? '#2dd4bf' : '#D4622A' }} /></div>
                <button onClick={() => handleViewWork('social captions')} disabled={progress3 < 100} style={{ background: 'none', border: 'none', color: progress3 === 100 ? '#D4622A' : 'rgba(255,255,255,0.2)', fontSize: '0.625rem', fontWeight: 800, cursor: progress3 === 100 ? 'pointer' : 'default', textTransform: 'uppercase' }}>View work →</button>
              </div>

            </div>
          </div>

          {/* YOUR FOCUS (RIGHT) */}
          <div className="panel-half">
            <div style={{ padding: '20px', background: 'rgba(35,44,42,0.6)', borderBottom: '1px solid rgba(87,66,58,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>YOUR FOCUS</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['insights', 'signals', 'next'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn ${activeTab === t ? 'active' : ''}`}>{t.toUpperCase()}</button>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', overflowX: 'auto', borderBottom: '1px solid rgba(87,66,58,0.05)' }}>
              <div className="pill active">Finalise the press release</div>
              <div className="pill inactive">Decide Tier 2 pricing</div>
              <div className="pill inactive">Prep my investor update</div>
            </div>

            <div style={{ flexGrow: 1, padding: '40px' }}>
              {activeTab === 'insights' && (
                <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 300, marginBottom: '32px' }}>What's blocking progress on: <span style={{ color: '#D4622A', fontWeight: 700 }}>Finalise the press release for Ugadi campaign?</span></h3>
                  <div style={{ position: 'relative' }}>
                    <input type="text" placeholder="What's your instinct?" style={{ width: '100%', padding: '16px 20px', background: '#1A1A1A', border: '1px solid #D4622A', borderRadius: '12px', color: 'white', outline: 'none' }} />
                    <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#D4622A', cursor: 'pointer' }} className="material-symbols-outlined">arrow_forward</button>
                  </div>
                </div>
              )}

              {activeTab === 'signals' && (
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <div className="signal-card">
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.6 }}>"Brands like Tanishq and Paper Boat are leading Ugadi 2026 campaigns with vernacular-first content seeing 3-4x higher engagement than Hindi-only."</p>
                    <p style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Your press release should lead with a regional language hook to match where media attention is going.</p>
                  </div>
                  <div className="signal-card">
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.6 }}>"Google Trends India shows a spike in searches for Ugadi 2026 wishes and offers starting 10 days before the festival, with AP, Telangana and Karnataka driving 80% of volume."</p>
                    <p style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Front-load Ugadi cultural significance in your headline to ride this search momentum.</p>
                  </div>
                </div>
              )}

              {activeTab === 'next' && (
                <div style={{ textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(212,98,42,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#D4622A' }}>rocket_launch</span></div>
                  <p style={{ fontSize: '1.125rem', color: 'rgba(255,255,255,0.8)' }}>You've identified the signals. Now map the full strategy.</p>
                  <button onClick={() => navigate('/whiteboard')} className="pulse-soft" style={{ background: 'transparent', border: '2px solid #D4622A', color: '#D4622A', fontWeight: 900, padding: '16px 32px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer' }}>THINKING CANVAS →</button>
                </div>
              )}
            </div>

          </div>
        </div>

      </main>

      {/* Toast */}
      <div style={{ position: 'fixed', top: '32px', right: '32px', zIndex: 1000, background: '#2dd4bf', color: 'white', padding: '16px 24px', borderRadius: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)', opacity: showToast ? 1 : 0, transform: showToast ? 'translateX(0)' : 'translateX(120%)', boxShadow: '0 12px 32px rgba(45,212,191,0.3)' }}>
        ✓ All 3 tasks complete. 3.5 hours recovered.
      </div>

      {/* Deliverable Modal */}
      {workModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#192120', border: '1px solid #D4622A', borderRadius: '16px', width: '90%', maxWidth: '900px', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
            <button onClick={() => setWorkModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} className="material-symbols-outlined">close</button>
            {renderRichDeliverable()}
          </div>
        </div>
      )}

    </div>
  )
}
