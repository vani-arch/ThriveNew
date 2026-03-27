import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { auth } from '../firebase'

// ─── Fallbacks when navigated to directly ────────────────────────────────────
const FALLBACK_AUTOMATE = [
  { id: 1, task: 'Generate UTM links for the influencer post', category: 'automate' },
  { id: 2, task: "Pull last quarter's competitor analysis",    category: 'automate' },
  { id: 3, task: 'Draft Ugadi social captions',                category: 'automate' },
  { id: 4, task: 'Resize 40 festive Ugadi banners',             category: 'automate' },
  { id: 5, task: 'Format media spend CSV for agency',           category: 'automate' },
  { id: 6, task: 'Pull Mangaluru lead drop data',               category: 'automate' },
  { id: 7, task: 'Generate Ugadi emailer subject lines',        category: 'automate' },
]
const FALLBACK_OWN = [
  { id: 8,  task: 'Pivot visual language to Coastal identity', category: 'own' },
  { id: 9,  task: 'Analyse why Hubli leads dropped 18%',       category: 'own' },
  { id: 10, task: 'Map competitor local pricing strategy',     category: 'own' },
  { id: 11, task: 'Build CFO briefing on Mangaluru campaign',  category: 'own' },
  { id: 12, task: 'Define Regional Soul creative direction',   category: 'own' },
]

// ─── Derive a "thinking question" from a task name ───────────────────────────
const getQuestion = (taskName) => `What's blocking progress on: ${taskName}?`

// ─── Pseudo-random progress value seeded by task id ──────────────────────────
const taskProgress = (id) => [45, 72, 88, 30, 60, 95, 50][id % 7]

export default function Dashboard() {
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const location      = useLocation()

  const panel = searchParams.get('panel') // 'agent' | 'focus'

  // Read tasks passed from Tasks screen, fall back to demo data
  const {
    automateTasks = FALLBACK_AUTOMATE,
    ownTasks      = FALLBACK_OWN,
  } = location.state || {}

  const user = auth.currentUser
  const rawName = user?.displayName || localStorage.getItem('userName') || (user?.email ? user.email.split('@')[0] : 'Megha')
  const firstNamePart = rawName.split(' ')[0].split('.')[0].split('_')[0]
  const userName = firstNamePart.charAt(0).toUpperCase() + firstNamePart.slice(1).toLowerCase()

  const [panelState,      setPanelState]      = useState('default')
  const [statsCollapsed,  setStatsCollapsed]  = useState(false)
  const [activeTab,       setActiveTab]       = useState('insights')
  const [activePillIndex, setActivePillIndex] = useState(0)  // index into ownTasks
  const [instinct,        setInstinct]        = useState('')
  const [showResponse,    setShowResponse]    = useState(false)
  const [stickyCollapsed, setStickyCollapsed] = useState(false)
  
  const [signalsData,     setSignalsData]     = useState([])
  const [signalsLoading,  setSignalsLoading]  = useState(false)

  const [workModalOpen, setWorkModalOpen] = useState(false)
  const [activeTaskWork, setActiveTaskWork] = useState(null)
  const [isWorking, setIsWorking] = useState(false)

  const [taskProgressMap, setTaskProgressMap] = useState({})
  const [showToast, setShowToast] = useState(false)

  // Trigger animations on mount
  useEffect(() => {
    const tasksToAnimate = [
      { id: 1, duration: 8000 },
      { id: 2, duration: 14000 },
      { id: 3, duration: 20000 },
    ]
    
    tasksToAnimate.forEach(({ id, duration }) => {
      let currentProgress = 0
      const totalSteps = duration / 100 // update every 100ms
      const stepSize = 100 / totalSteps
      
      const timer = setInterval(() => {
        currentProgress += stepSize
        if (currentProgress >= 100) {
          currentProgress = 100
          clearInterval(timer)
        }
        setTaskProgressMap(prev => ({ ...prev, [id]: Math.floor(currentProgress) }))
      }, 100)
    })
  }, [])

  const toastFiredRef = useRef(false)
  useEffect(() => {
    if (taskProgressMap[1] === 100 && taskProgressMap[2] === 100 && taskProgressMap[3] === 100) {
      if (!toastFiredRef.current) {
        toastFiredRef.current = true
        console.log('AGENT ROOT: All tasks complete. Firing toast.')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 10000)
      }
    }
  }, [taskProgressMap])

  const handleViewWork = async (taskName) => {
    setActiveTaskWork({ task: taskName, output: '' })
    setWorkModalOpen(true)
    setIsWorking(true)

    console.log('handleViewWork calling for task:', taskName)
    const isUTM        = taskName.includes('UTM')
    const isCompetitor = taskName.includes('competitor')
    const isCaptions   = taskName.includes('social captions')
    const isSpecial    = isUTM || isCompetitor || isCaptions
    const delay        = isSpecial ? 1500 : 800
    
    console.log('isSpecial:', isSpecial, 'delay:', delay)

    setTimeout(async () => {
      console.log('Timeout finished for task:', taskName)
      try {
        if (isSpecial) {
          console.log('Setting rich deliverable state...')
          setIsWorking(false)
          setActiveTaskWork({ task: taskName, output: 'RICH_DELIVERABLE' })
          return
        }
        const res = await fetch('/api/agent-work', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskName, userName })
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setActiveTaskWork({ task: taskName, output: data.result })
      } catch (e) {
        console.error(e)
        setActiveTaskWork({ task: taskName, output: 'Error: ' + e.message })
      } finally {
        setIsWorking(false)
      }
    }, delay)
  }

  const downloadFile = (txt, filename) => {
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  const copyToClipboard = (txt) => {
    navigator.clipboard.writeText(txt)
    alert('Copied to clipboard!')
  }

  const UTMDeliverable = () => {
    const data = [
      { p: 'Instagram', i: '@shreyalifts', t: 'ugadi-2026', l: 'eduspark.com?utm_source=instagram&utm_medium=influencer&utm_campaign=ugadi-2026&utm_content=shreya' },
      { p: 'YouTube', i: '@techwithriya', t: 'ugadi-2026', l: 'eduspark.com?utm_source=youtube&utm_medium=influencer&utm_campaign=ugadi-2026&utm_content=riya' },
      { p: 'LinkedIn', i: '@growthwithkaran', t: 'ugadi-2026', l: 'eduspark.com?utm_source=linkedin&utm_medium=influencer&utm_campaign=ugadi-2026&utm_content=karan' },
    ]
    const fullText = data.map(d => `${d.p} | ${d.i} | ${d.t} | ${d.l}`).join('\n')
    return (
      <div style={{ padding: '32px', color: '#dce4e2' }}>
        <h4 style={{ color: '#D4622A', fontWeight: 800, fontSize: '1.25rem', marginBottom: '24px' }}>UTM Links — Ugadi Influencer Campaign</h4>
        <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <tr><th style={{ padding: '16px' }}>Platform</th><th style={{ padding: '16px' }}>Influencer</th><th style={{ padding: '16px' }}>Tag</th><th style={{ padding: '16px' }}>Link</th><th style={{ padding: '16px' }}></th></tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px', fontWeight: 700 }}>{row.p}</td>
                  <td style={{ padding: '16px' }}>{row.i}</td>
                  <td style={{ padding: '16px', color: 'rgba(255,255,255,0.6)' }}>{row.t}</td>
                  <td style={{ padding: '16px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#2dd4bf' }}>{row.l}</td>
                  <td style={{ padding: '16px' }}><button onClick={() => copyToClipboard(row.l)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#D4622A', cursor: 'pointer', fontSize: '0.625rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px' }}>COPY</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => downloadFile(fullText, 'Ugadi_Influencer_UTMs.txt')} style={{ marginTop: '24px', background: '#D4622A', border: 'none', color: 'white', fontWeight: 700, padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>download</span> Download all links</button>
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
      <div style={{ padding: '32px', color: '#dce4e2', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '32px', right: '32px', background: '#226b5d', color: 'white', fontSize: '0.625rem', fontWeight: 900, padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.05em' }}>READY TO SEND TO MANAGER</div>
        <h4 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '8px' }}>Competitor Launch Intelligence — Q1 2026</h4>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', marginBottom: '40px' }}>3 signals relevant to your Ugadi pricing and distribution strategy</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {blocks.map((b, i) => (
            <div key={i} style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: `4px solid ${b.border}` }}>
              <h5 contentEditable style={{ fontSize: '1.25rem', fontWeight: 800, color: b.border, outline: 'none' }}>{b.stat}</h5>
              <p contentEditable style={{ fontSize: '0.9375rem', lineHeight: 1.5, outline: 'none', margin: '8px 0' }}>{b.detail}</p>
              <p contentEditable style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', outline: 'none', fontStyle: 'italic' }}>{b.means}</p>
            </div>
          ))}
        </div>
        <button onClick={() => downloadFile(blocks.map(b => `${b.stat}\n${b.detail}\n${b.means}`).join('\n\n'), 'Competitor_Analysis_Megha_March2026.txt')} style={{ marginTop: '24px', background: '#D4622A', border: 'none', color: 'white', fontWeight: 700, padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>download</span> Download Brief</button>
      </div>
    )
  }
  const CaptionsDeliverable = () => {
    const [openedCard, setOpenedCard] = useState(0)
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
            <div key={i} style={{ background: '#1A1A1A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div onClick={() => setOpenedCard(openedCard === i ? -1 : i)} style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span style={{ fontSize: '0.625rem', fontWeight: 900, color: '#D4622A' }}>{c.tag}</span>
                <span className="material-symbols-outlined">{openedCard === i ? 'expand_less' : 'expand_more'}</span>
              </div>
              {openedCard === i && (
                <div style={{ padding: '0 24px 24px' }}>
                  <textarea defaultValue={c.text} style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontSize: '0.9375rem', lineHeight: 1.6, resize: 'none', minHeight: '80px', outline: 'none' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => copyToClipboard(c.text)} style={{ background: 'rgba(212,98,42,0.1)', border: 'none', color: '#D4622A', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 700 }}>COPY</button>
                      <button onClick={() => downloadFile(c.text, `Caption_${i+1}.txt`)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px 12px', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 700 }}>SAVE</button>
                    </div>
                    <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.3)' }}>{c.text.length} chars</span>
                  </div>
                </div>
              )}
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


  // Expand correct panel on mount (from URL param or state flag)
  useEffect(() => {
    if (panel === 'agent' || location.state?.expandAgent) {
      setPanelState('agent-expanded')
    } else if (panel === 'focus' || location.state?.expandFocus) {
      setPanelState('focus-expanded')
    }
  }, [panel]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-collapse stats after 3 s
  useEffect(() => {
    const t = setTimeout(() => setStatsCollapsed(true), 3000)
    return () => clearTimeout(t)
  }, [])

  // Reset instinct response when pill changes
  useEffect(() => { setShowResponse(false); setInstinct('') }, [activePillIndex])

  // Fetch signals when task pill changes
  useEffect(() => {
    const fetchSignals = async () => {
      const taskName = ownTasks[activePillIndex]?.task
      if (!taskName) return
      
      setSignalsLoading(true)
      setSignalsData([])
      try {
        const res = await fetch('/api/generate-signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskName })
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setSignalsData(data)
      } catch (e) {
        console.error('Error generating signals:', e)
        setSignalsData([{ id: 'err', signal: 'Failed to load signals.', relevance: e.message }])
      } finally {
        setSignalsLoading(false)
      }
    }
    fetchSignals()
  }, [activePillIndex, ownTasks])

  const activePillTask = ownTasks[activePillIndex]?.task ?? ''
  const activeQuestion = getQuestion(activePillTask)

  const leftClass  = panelState === 'agent-expanded' ? 'panel-expanded'
                   : panelState === 'focus-expanded'  ? 'panel-collapsed-strip'
                   : 'panel-half'
  const rightClass = panelState === 'focus-expanded'  ? 'panel-expanded'
                   : panelState === 'agent-expanded'  ? 'panel-collapsed-strip'
                   : 'panel-half'

  const toggleLeft  = () => setPanelState(p => p === 'agent-expanded' ? 'default' : 'agent-expanded')
  const toggleRight = () => setPanelState(p => p === 'focus-expanded'  ? 'default' : 'focus-expanded')

  const handleInstinctSend = () => { if (instinct.trim()) setShowResponse(true) }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#0f1716', color: '#dce4e2', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        .teal-text { color: #2dd4bf; }
        .teal-bg   { background-color: #2dd4bf; }
        .panel-container         { display: flex; gap: 1.5rem; min-height: 750px; transition: all 350ms ease-in-out; }
        .panel-half              { flex: 1; min-width: 0; }
        .panel-expanded          { flex: 3; min-width: 0; }
        .panel-collapsed-strip   { flex: 0 0 80px; min-width: 80px; cursor: pointer; }
        .vertical-text           { writing-mode: vertical-lr; transform: rotate(180deg); }
        .progress-fill           { transition: width 1s cubic-bezier(0.65,0,0.35,1); }
        .tab-active              { color: #D4622A; border-bottom: 2px solid #D4622A; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar          { -ms-overflow-style: none; scrollbar-width: none; }
        .transition-all-custom   { transition: all 350ms cubic-bezier(0.4,0,0.2,1); }
        .stats-collapsed         { height: 56px; overflow: hidden; }
        .stats-expanded          { height: 120px; }
        .pulse-soft              { animation: pulse-soft 2s infinite; }
        @keyframes pulse-soft {
          0%   { box-shadow: 0 0 0 0   rgba(212,98,42,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(212,98,42,0); }
          100% { box-shadow: 0 0 0 0   rgba(212,98,42,0); }
        }
        .notebook-input {
          background: #1A1A1A; border: 1px solid #D4622A;
          box-shadow: 0 0 10px rgba(212,98,42,0.2);
          width: 100%; padding: 16px 50px 16px 20px;
          color: white; outline: none; border-radius: 12px;
        }
        .notebook-input::placeholder { color: #666; }
        .notebook-input:focus { box-shadow: 0 0 15px rgba(212,98,42,0.3); }
        .sticky-note {
          width: 200px; height: 150px; background: #FFF8DC; color: #1a1a1a;
          position: fixed; bottom: 24px; right: 24px; z-index: 50;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3); border-radius: 8px;
          overflow: hidden; display: flex; flex-direction: column; transition: all 0.3s;
        }
        .sticky-note.collapsed { height: 32px; }
        .notepad-lines {
          background-image: linear-gradient(#e5e0c9 1px, transparent 1px);
          background-size: 100% 16px; padding-top: 4px;
        }
        .agent-task-card {
          background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05);
          padding: 16px; border-radius: 12px; margin-bottom: 12px;
        }
        .pill-btn {
          flex-shrink: 0; padding: 8px 16px; border-radius: 9999px;
          font-size: 0.6875rem; font-weight: 700; cursor: pointer;
          transition: all 0.2s; white-space: nowrap; font-family: inherit;
        }
        .pill-active   { background: #D4622A; border: 1px solid #D4622A; color: white; }
        .pill-inactive { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); }
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, background: 'rgba(15,23,22,0.8)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', height: '80px', borderBottom: '1px solid rgba(87,66,58,0.1)' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#D4622A' }}>Thrivee</span>
      </nav>

      <div style={{ position: 'fixed', top: '96px', left: '32px', zIndex: 40 }}>
        <button 
          onClick={() => navigate('/tasks')} 
          style={{ background: 'transparent', border: 'none', color: '#a0aab2', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
        >
          ← Back
        </button>
      </div>

      <main style={{ paddingTop: '136px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '48px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Stats Bar */}
          <div
            className={`transition-all-custom ${statsCollapsed ? 'stats-collapsed' : 'stats-expanded'}`}
            style={{ background: 'rgba(35,44,42,0.4)', borderRadius: '16px', border: '1px solid rgba(87,66,58,0.1)', position: 'relative' }}
          >
            {!statsCollapsed && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', padding: '24px', height: '100%' }}>
                {[
                  ['Time Recovered',  `${automateTasks.length * 2} hrs`],
                  ['Automated Tasks', `${automateTasks.length} active`],
                  ['Protect Tasks',   `${ownTasks.length} protected`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{val}</span>
                  </div>
                ))}
              </div>
            )}
            {statsCollapsed && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 32px', height: '100%' }}>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  {automateTasks.length * 2} hrs recovered · {automateTasks.length} automated · {ownTasks.length} protected
                </span>
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

            {/* ── LEFT: Agent Root ──────────────────────────────────────────── */}
            <div
              className={`${leftClass} transition-all-custom`}
              style={{ background: '#192120', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(87,66,58,0.1)' }}
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

                  {/* Agent task list */}
                  <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div>
                      <h4 style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' }}>Working on</h4>
                      {automateTasks.map((t, i) => {
                        const id = t.id ?? (i + 1)
                        const prog = taskProgressMap[id] ?? taskProgress(id)
                        const isDone = prog === 100
                        const isSpecial = id <= 3

                        return (
                          <div key={id} className="agent-task-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>⚙️ {t.task}</span>
                              <span className={isDone ? 'teal-text' : ''} style={{ fontSize: '0.625rem', fontWeight: 700, flexShrink: 0, marginLeft: '8px', color: isDone ? '#2dd4bf' : 'inherit' }}>
                                {isDone ? '✓ Complete' : `${prog}%`}
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '12px' }}>
                              <div 
                                className="progress-fill" 
                                style={{ height: '100%', width: `${prog}%`, background: isDone ? '#2dd4bf' : '#D4622A', transition: isSpecial ? 'width 0.1s linear' : 'width 0.6s ease' }} 
                              />
                            </div>
                            <button 
                              disabled={!isDone}
                              onClick={() => handleViewWork(t.task)}
                              style={{ 
                                fontSize: '0.625rem', 
                                fontWeight: 800, 
                                color: !isDone ? 'rgba(255,255,255,0.2)' : '#D4622A', 
                                background: 'none', 
                                border: 'none', 
                                cursor: !isDone ? 'not-allowed' : 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                textTransform: 'uppercase'
                              }}
                            >
                              {activeTaskWork?.task === t.task && isWorking ? 'Generating...' : 'View work →'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Slim strip */
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

            {/* ── RIGHT: Your Focus ────────────────────────────────────────── */}
            <div
              className={`${rightClass} transition-all-custom`}
              style={{ background: '#192120', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(87,66,58,0.1)' }}
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

                    {/* Dynamic task pills from ownTasks */}
                    <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {ownTasks.map((task, i) => (
                        <button
                          key={task.id ?? i}
                          className={`pill-btn ${activePillIndex === i ? 'pill-active' : 'pill-inactive'}`}
                          onClick={() => setActivePillIndex(i)}
                        >
                          {task.task}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab content */}
                  <div style={{ flexGrow: 1, overflowY: 'auto', padding: '40px' }}>

                    {/* Insights */}
                    {activeTab === 'insights' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', maxWidth: '672px', margin: '0 auto', width: '100%', gap: '48px' }}>
                        <h4 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 300, textAlign: 'center', lineHeight: 1.5, color: '#dce4e2' }}>
                          {activeQuestion.split(activePillTask).map((part, i, arr) =>
                            i < arr.length - 1
                              ? <span key={i}>{part}<span style={{ color: '#D4622A', fontWeight: 700 }}>{activePillTask}</span></span>
                              : <span key={i}>{part}</span>
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
                              "Analysing patterns related to <strong>{activePillTask}</strong>... Your instinct is noted. Shall I surface relevant data signals?"
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

                    {/* Signals */}
                    {activeTab === 'signals' && (
                      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '576px', margin: '0 auto', width: '100%' }}>
                        <h5 style={{ fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' }}>Active Market Signals</h5>
                        
                        {signalsLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#a0aab2', padding: '40px 0' }}>
                            <div style={{ width: '16px', height: '16px', border: '2px solid rgba(212,98,42,0.3)', borderTopColor: '#D4622A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Fetching real-time signals...
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            {signalsData.map((sig, i) => (
                              <div key={sig.id || i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px', borderRadius: '12px', border: '1px solid rgba(87,66,58,0.1)', background: 'rgba(255,255,255,0.05)' }}>
                                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#dce4e2' }}>{sig.signal}</span>
                                <span style={{ fontSize: '0.8125rem', color: '#a0aab2', lineHeight: 1.5 }}>{sig.relevance}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Next */}
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
                /* Focus slim strip */
                <div onClick={toggleRight} style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', justifyContent: 'space-between', borderLeft: '1px solid rgba(212,98,42,0.3)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <span style={{ background: 'rgba(212,98,42,0.2)', color: '#D4622A', fontSize: '0.625rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px' }}>{ownTasks.length}</span>
                  </div>
                  <div className="vertical-text" style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)' }}>YOUR FOCUS</div>
                  <div />
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <div style={{ 
        position: 'fixed', top: '32px', right: '32px', zIndex: 1000,
        background: '#2dd4bf', color: 'white', padding: '16px 24px', borderRadius: '12px',
        fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 12px 32px rgba(45,212,191,0.3)',
        transform: showToast ? 'translateX(0)' : 'translateX(calc(100% + 40px))',
        opacity: showToast ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.19, 1, 0.22, 1)'
      }}>
        <span className="material-symbols-outlined">verified_user</span>
        ✓ All 3 tasks complete. 3.5 hours recovered.
      </div>

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

      {/* Agent Work Modal */}
      {workModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', padding: '24px' }}>
          <div style={{ background: '#192120', border: '1px solid #D4622A', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(212,98,42,0.2)', background: 'rgba(212,98,42,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ color: '#D4622A' }}>terminal</span>
                <span style={{ fontWeight: 700, color: '#ffb596', fontSize: '1.125rem' }}>{activeTaskWork?.task}</span>
              </div>
              <button onClick={() => setWorkModalOpen(false)} className="material-symbols-outlined" style={{ background: 'transparent', border: 'none', color: '#dec0b5', cursor: 'pointer' }}>close</button>
            </div>
            
            <div className="hide-scrollbar" style={{ padding: '0', overflowY: 'auto', flexGrow: 1, color: '#dce4e2' }}>
              {isWorking ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '16px', color: '#a0aab2' }}>
                  <div style={{ width: '32px', height: '32px', border: '3px solid rgba(212,98,42,0.3)', borderTopColor: '#D4622A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>PREPARING DELIVERABLE...</span>
                </div>
              ) : (
                activeTaskWork?.output === 'RICH_DELIVERABLE' ? renderRichDeliverable() : (
                  <div style={{ padding: '32px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6 }}>{activeTaskWork?.output}</div>
                )
              )}
            </div>

            {(!isWorking && activeTaskWork?.output !== 'RICH_DELIVERABLE') && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(87,66,58,0.1)', display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
                <button 
                  onClick={() => downloadFile(activeTaskWork.output, `${activeTaskWork.task.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`)}
                  style={{ background: '#D4622A', border: 'none', color: 'white', fontWeight: 700, padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>download</span> Download
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
