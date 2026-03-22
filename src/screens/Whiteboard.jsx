import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const SUGGESTIONS = [
  { text: 'Is it the language?', chip: 'Kannada messaging', angle: -60 },
  { text: 'Is it the creative?', chip: 'Local context', angle: -120 },
  { text: 'Is it the offer?', chip: 'Discount relevance', angle: 120 },
  { text: 'Local Competition?', chip: 'Speed vs Price', angle: 60 },
]

export default function Whiteboard() {
  const navigate = useNavigate()
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [nodes, setNodes] = useState([])
  const [showStartBtn, setShowStartBtn] = useState(true)
  const [connections, setConnections] = useState([])
  const canvasRef = useRef(null)
  const nodeRefs = useRef({})

  const updateConnections = () => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    const newConns = nodes.map((n, i) => {
      const nodeEl = nodeRefs.current[i]
      if (!nodeEl) return null
      const nr = nodeEl.getBoundingClientRect()
      const nx = nr.left - rect.left + nr.width / 2
      const ny = nr.top - rect.top + nr.height / 2
      return { x1: cx, y1: cy, x2: nx, y2: ny }
    }).filter(Boolean)
    setConnections(newConns)
  }

  useEffect(() => {
    updateConnections()
  }, [nodes, showAiPanel])

  useEffect(() => {
    window.addEventListener('resize', updateConnections)
    return () => window.removeEventListener('resize', updateConnections)
  }, [nodes])

  const handleStartingPoint = () => {
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.3
    const newNodes = SUGGESTIONS.map((s) => {
      const rad = s.angle * (Math.PI / 180)
      return { text: s.text, chip: s.chip, x: Math.cos(rad) * radius, y: Math.sin(rad) * radius }
    })
    setNodes(newNodes)
    setShowStartBtn(false)
    setTimeout(updateConnections, 100)
  }

  const removeNode = (idx) => {
    setNodes(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#0F1716', color: '#dce4e2', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        .whiteboard-grid {
          background-color: #0F1716;
          background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 0);
          background-size: 24px 24px;
        }
        .node-connector {
          stroke: #D4622A;
          stroke-dasharray: 4 4;
          fill: none;
          stroke-width: 1.5;
          opacity: 0.3;
        }
        .cursor-blink {
          display: inline-block; width: 2px; height: 1.2em;
          background-color: currentColor; margin-left: 2px;
          vertical-align: middle; animation: blink 1s step-end infinite;
        }
        @keyframes blink { 50% { opacity: 0; } }
        .node-card {
          transition: border-color 0.2s;
          cursor: pointer;
        }
        .node-card:hover { border-color: rgba(212,98,42,0.4) !important; }
        .wbtn { transition: all 0.15s; }
        .wbtn:active { transform: scale(0.95); }
        .agent-dot-ping {
          animation: ping 1s cubic-bezier(0,0,0.2,1) infinite;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .ai-panel-slide {
          animation: slideInRight 0.3s ease forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .node-appear {
          animation: nodeAppear 0.5s ease forwards;
        }
        @keyframes nodeAppear {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      {/* Whiteboard grid background */}
      <div className="whiteboard-grid" style={{ position: 'absolute', inset: 0 }} />

      {/* Top Header */}
      <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 32px', pointerEvents: 'none' }}>
        {/* Back to Dashboard */}
        <div style={{ pointerEvents: 'auto' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="wbtn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dec0b5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, transition: 'color 0.2s' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', transition: 'transform 0.2s' }}>arrow_back</span>
            Dashboard
          </button>
        </div>

        {/* Agent Root status */}
        <div style={{ pointerEvents: 'auto', position: 'relative' }}>
          <details style={{ position: 'relative' }}>
            <summary style={{ listStyle: 'none', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0F1716', border: '1px solid rgba(38,166,154,0.3)', padding: '6px 16px', borderRadius: '9999px', transition: 'background 0.2s' }}>
                <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
                  <span className="agent-dot-ping" style={{ position: 'absolute', inset: 0, background: '#26a69a', borderRadius: '50%', opacity: 0.75, width: '8px', height: '8px' }} />
                  <span style={{ position: 'relative', background: '#26a69a', borderRadius: '50%', width: '8px', height: '8px' }} />
                </span>
                <span style={{ color: '#26a69a', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Agent Root: Active</span>
              </div>
            </summary>
            <div style={{ position: 'absolute', right: 0, marginTop: '12px', width: '288px', background: '#2e3635', border: '1px solid rgba(87,66,58,0.3)', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', padding: '16px', zIndex: 100 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#dec0b5' }}>Agent Root Status</h3>
                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: '#26a69a' }}>verified</span>
              </div>
              <hr style={{ borderColor: 'rgba(87,66,58,0.2)', marginBottom: '12px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { icon: 'check_circle', text: '12 UTM links generated', sub: '2 min ago', spin: false },
                  { icon: 'sync', text: 'Monitoring lead data...', sub: 'live', spin: true },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: '#26a69a', flexShrink: 0, animation: item.spin ? 'spin 2s linear infinite' : 'none' }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500 }}>{item.text}</p>
                      <p style={{ fontSize: '0.625rem', color: item.spin ? '#26a69a' : 'rgba(222,192,181,0.6)', fontWeight: item.spin ? 700 : 400 }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      </header>

      {/* Canvas */}
      <main ref={canvasRef} style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        {/* SVG connections */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {connections.map((c, i) => (
            <path key={i} className="node-connector" d={`M ${c.x1} ${c.y1} L ${c.x2} ${c.y2}`} />
          ))}
        </svg>

        {/* Central Node */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ background: '#D4622A', padding: '40px', borderRadius: '12px', boxShadow: '0 20px 50px rgba(212,98,42,0.3)', maxWidth: '384px', textAlign: 'center', border: '1px solid rgba(212,98,42,0.2)', cursor: 'pointer', transition: 'transform 0.3s' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'white' }}>
                Why are Hubli girls not signing up?<span className="cursor-blink">|</span>
              </h1>
            </div>
            <p style={{ color: 'rgba(220,228,226,0.4)', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Start anywhere.</p>
          </div>
        </div>

        {/* Suggestion Nodes */}
        {nodes.map((n, i) => (
          <div
            key={i}
            ref={el => { nodeRefs.current[i] = el }}
            className="node-appear"
            style={{
              position: 'absolute',
              left: `calc(50% + ${n.x}px)`,
              top: `calc(50% + ${n.y}px)`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              animationDelay: `${i * 100}ms`,
            }}
            onContextMenu={e => { e.preventDefault(); removeNode(i) }}
          >
            <div className="node-card" style={{ background: '#2e3635', padding: '16px', borderRadius: '8px', border: '1px solid rgba(87,66,58,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', minWidth: '180px', textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: '0.875rem' }} contentEditable suppressContentEditableWarning>{n.text}</p>
              <div style={{ marginTop: '8px', background: 'rgba(212,98,42,0.1)', color: '#D4622A', fontSize: '0.625rem', padding: '4px 8px', borderRadius: '9999px', display: 'inline-block', border: '1px solid rgba(212,98,42,0.2)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {n.chip}
              </div>
            </div>
          </div>
        ))}

        {/* Bottom Left Actions */}
        <div style={{ position: 'absolute', bottom: '48px', left: '48px', zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="wbtn" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#232c2a', color: '#dce4e2', padding: '16px 24px', borderRadius: '9999px', border: '1px solid rgba(87,66,58,0.2)', cursor: 'pointer', fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}>
            <span className="material-symbols-outlined" style={{ color: '#D4622A', transition: 'transform 0.2s' }}>add_circle</span>
            + New Node
          </button>
          {showStartBtn && (
            <button onClick={handleStartingPoint} className="wbtn" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(25,33,32,0.3)', color: 'rgba(220,228,226,0.6)', padding: '16px 20px', borderRadius: '9999px', border: '1px solid rgba(87,66,58,0.1)', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', transition: 'all 0.2s' }}>
              ✦ Give me a starting point
            </button>
          )}
        </div>

        {/* Bottom Right: Ask Thrivee */}
        <div style={{ position: 'absolute', bottom: '48px', right: '48px', zIndex: 50 }}>
          <button
            onClick={() => { setShowAiPanel(v => !v); setTimeout(updateConnections, 350) }}
            className="wbtn"
            style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#D4622A', color: 'white', padding: '16px 28px', borderRadius: '9999px', border: '1px solid rgba(212,98,42,0.2)', cursor: 'pointer', fontWeight: 700, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            Ask Thrivee
          </button>
        </div>
      </main>

      {/* AI Assistant Side Panel */}
      {showAiPanel && (
        <aside className="ai-panel-slide" style={{ position: 'fixed', right: 0, top: 0, height: '100%', width: '360px', background: '#151d1c', borderLeft: '1px solid rgba(87,66,58,0.2)', display: 'flex', flexDirection: 'column', zIndex: 60 }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(87,66,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#D4622A', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h2 style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Thrivee AI Assistant</h2>
            </div>
            <button onClick={() => { setShowAiPanel(false); setTimeout(updateConnections, 350) }} style={{ color: 'rgba(220,228,226,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '90%' }}>
              <div style={{ background: '#2e3635', padding: '16px', borderRadius: '16px 16px 16px 0', fontSize: '0.875rem', color: '#dec0b5', border: '1px solid rgba(87,66,58,0.2)' }}>
                I'm analyzing your nodes. Would you like to explore the Hubli demographics further?
              </div>
              <span style={{ fontSize: '0.625rem', color: 'rgba(220,228,226,0.4)', fontWeight: 700, textTransform: 'uppercase', marginLeft: '4px' }}>Thrivee AI</span>
            </div>
          </div>
          <div style={{ padding: '24px', paddingTop: '8px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Type a message..."
                style={{ width: '100%', background: '#192120', border: '1px solid rgba(87,66,58,0.3)', borderRadius: '9999px', padding: '12px 20px', paddingRight: '48px', fontSize: '0.875rem', color: '#dce4e2', outline: 'none', caretColor: '#D4622A' }}
              />
              <button style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#D4622A' }}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
