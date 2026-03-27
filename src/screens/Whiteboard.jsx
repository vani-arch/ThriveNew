import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ReactFlow, useNodesState, useEdgesState, addEdge, Handle, Position } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const CentralNode = ({ data }) => {
  return (
    <>
      <Handle type="source" position={Position.Top} className="custom-handle" />
      <Handle type="source" position={Position.Right} className="custom-handle" />
      <Handle type="source" position={Position.Bottom} className="custom-handle" />
      <Handle type="source" position={Position.Left} className="custom-handle" />
      
      <div style={{ background: '#D4622A', padding: '40px', borderRadius: '12px', boxShadow: '0 20px 50px rgba(212,98,42,0.3)', width: '280px', maxWidth: '280px', textAlign: 'center', border: '1px solid rgba(212,98,42,0.2)', cursor: 'grab', transition: 'transform 0.3s' }}>
        {data.isGenerating ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#ffb596' }}>
            <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Generating Mind Map...
          </div>
        ) : (
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'white', wordWrap: 'break-word', overflowWrap: 'break-word', userSelect: 'none' }}>
            {data.text}
          </h1>
        )}
        {!data.isGenerating && <p style={{ color: 'rgba(220,228,226,0.4)', fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '24px' }}>Start anywhere.</p>}
      </div>
    </>
  )
}

const IdeaNode = ({ id, data }) => {
  return (
    <>
      <Handle type="source" position={Position.Top} className="custom-handle" />
      <Handle type="source" position={Position.Right} className="custom-handle" />
      <Handle type="source" position={Position.Bottom} className="custom-handle" />
      <Handle type="source" position={Position.Left} className="custom-handle" />
      
      <div className="node-card" style={{ background: '#2e3635', padding: '16px', borderRadius: '8px', border: '1px solid rgba(87,66,58,0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', minWidth: '180px', maxWidth: '220px', textAlign: 'center' }}>
        {data.isEditing ? (
          <textarea
            className="nodrag"
            autoFocus
            onBlur={(e) => data.onBlur(id, e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) e.currentTarget.blur() }}
            defaultValue={data.text}
            placeholder="Type your thought..."
            style={{ width: '100%', minHeight: '60px', background: 'transparent', border: 'none', color: '#dce4e2', outline: 'none', fontSize: '0.875rem', fontWeight: 700, textAlign: 'center', resize: 'none', fontFamily: 'inherit' }}
          />
        ) : (
          <p onClick={() => data.onClick(id)} style={{ fontWeight: 700, fontSize: '0.875rem', wordWrap: 'break-word', overflowWrap: 'break-word', cursor: 'text' }}>
            {data.text || 'Type your thought...'}
          </p>
        )}
        <div style={{ marginTop: '8px', background: 'rgba(212,98,42,0.1)', color: '#D4622A', fontSize: '0.625rem', padding: '4px 8px', borderRadius: '9999px', display: 'inline-block', border: '1px solid rgba(212,98,42,0.2)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {data.chip}
        </div>
      </div>
    </>
  )
}

const nodeTypes = {
  central: CentralNode,
  idea: IdeaNode
}

const FIX_POSITIONS = [
  { x: -280, y: -220 },
  { x: 280, y: -220 },
  { x: -280, y: 220 },
  { x: 280, y: 220 },
]

export default function Whiteboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeTask = location.state?.activeTask || 'Finalise the press release'
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [showStartBtn, setShowStartBtn] = useState(true)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: "I'm analyzing your nodes. What's standing out to you?" }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatScrollRef = useRef(null)
  
  const [agentCount, setAgentCount] = useState(0)

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('thrivee_tasks')
      if (storedTasks) {
        const tasksList = JSON.parse(storedTasks)
        setAgentCount(tasksList.filter(t => t.category === 'hand-to-ai').length)
      }
    } catch (e) {}
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const handleNodeClick = useCallback((id) => {
    if (id === 'central') return
    setNodes(nds => {
      const updated = nds.map(n => n.id === id ? { ...n, data: { ...n.data, isEditing: true } } : n)
      localStorage.setItem('thrivee_canvas_nodes', JSON.stringify(updated.filter(k => k.id !== 'central')))
      return updated
    })
  }, [setNodes])

  const handleNodeBlur = useCallback((id, newText) => {
    setNodes(nds => {
      const updated = nds.map(n => n.id === id ? { ...n, data: { ...n.data, text: newText, isEditing: false } } : n)
      localStorage.setItem('thrivee_canvas_nodes', JSON.stringify(updated.filter(k => k.id !== 'central')))
      return updated
    })
  }, [setNodes])

  const getExportContent = (format) => {
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const centralNode = nodes.find(n => n.id === 'central')?.data?.text || 'Finalise the press release for Ugadi campaign'

    if (format === 'md') {
      return `## STRATEGY BRIEF
**Task:** ${centralNode}
**Prepared by:** Megha S — Senior Growth Manager, EduSpark
**Date:** ${date}

## CORE QUESTION
**What angle gets maximum news pickups?**

### OPTION 1 — Market data angle
- 14 hrs/week lost to grunt work
- WEF: 92M jobs shifting by 2030
- Strongest for journalists

### OPTION 2 — Founder story angle
- Had to let someone go on a Friday
- She couldn't keep up — not skill, system
- Human, emotional, shareable

### OPTION 3 — Product launch angle
- Thrive's AI playbook feature
- Risk: too internal, low news value

### OPTION 4 — Regional Ugadi hook
- Vernacular-first content — 3-4x engagement
- Tanishq and Paper Boat doing this now
- Timely, culturally relevant

## RECOMMENDATION
[Leave blank for Megha to fill in]

## NEXT STEPS
[Leave blank for Megha to fill in]`
    }

    return `STRATEGY BRIEF
Task: ${centralNode}
Prepared by: Megha S — Senior Growth Manager, EduSpark
Date: ${date}

CORE QUESTION
What angle gets maximum news pickups?

OPTION 1 — Market data angle
- 14 hrs/week lost to grunt work
- WEF: 92M jobs shifting by 2030
- Strongest for journalists

OPTION 2 — Founder story angle
- Had to let someone go on a Friday
- She couldn't keep up — not skill, system
- Human, emotional, shareable

OPTION 3 — Product launch angle
- Thrive's AI playbook feature
- Risk: too internal, low news value

OPTION 4 — Regional Ugadi hook
- Vernacular-first content — 3-4x engagement
- Tanishq and Paper Boat doing this now
- Timely, culturally relevant

RECOMMENDATION
[Leave blank for Megha to fill in]

NEXT STEPS
[Leave blank for Megha to fill in]`
  }

  const downloadFile = (format) => {
    const content = getExportContent(format)
    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `Press_Release_Strategy_Megha_${dateStr}.${format}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const initializeCanvas = () => {
      const cWidth = 280;
      const cHeight = 200;
      const cX = window.innerWidth / 2 - cWidth / 2;
      const cY = window.innerHeight / 2 - cHeight / 2;

      // Persistence check based on task
      const savedTask = localStorage.getItem('thrivee_canvas_task')
      const storedNodes = localStorage.getItem('thrivee_canvas_nodes')
      
      if (savedTask === activeTask && storedNodes) {
        console.log('[Whiteboard] Loading saved session for task:', activeTask)
        const parsedNodes = JSON.parse(storedNodes)
        setNodes(parsedNodes.map(n => ({
          ...n,
          data: { ...n.data, onClick: handleNodeClick, onBlur: handleNodeBlur }
        })))
        const storedEdges = localStorage.getItem('thrivee_canvas_edges')
        if (storedEdges) setEdges(JSON.parse(storedEdges))
        setShowStartBtn(false)
        return
      }

      // Fresh Start or Task Switch
      console.log('[Whiteboard] Initializing fresh canvas for:', activeTask)
      localStorage.setItem('thrivee_canvas_task', activeTask)
      setShowStartBtn(false)

      const isPressRelease = activeTask.toLowerCase().includes('press release')

      if (isPressRelease) {
        const centralText = "What angle gets maximum news pickups?"
        const nodesList = [
          { id: 'central', type: 'central', position: { x: cX, y: cY }, data: { text: centralText, isGenerating: false } },
          
          { id: 'b1', type: 'idea', position: { x: cX - 350, y: cY - 200 }, data: { text: 'Market data angle', chip: 'OPTION 1', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's1-1', type: 'idea', position: { x: cX - 600, y: cY - 280 }, data: { text: '14 hrs/week lost to grunt work', chip: 'DATA', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's1-2', type: 'idea', position: { x: cX - 600, y: cY - 200 }, data: { text: 'WEF — 92M jobs shifting by 2030', chip: 'SIGNAL', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's1-3', type: 'idea', position: { x: cX - 600, y: cY - 120 }, data: { text: '✓ Strongest for journalists', chip: 'PRO', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },

          { id: 'b2', type: 'idea', position: { x: cX + 350, y: cY - 200 }, data: { text: 'Founder story angle', chip: 'OPTION 2', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's2-1', type: 'idea', position: { x: cX + 600, y: cY - 280 }, data: { text: 'Had to let someone go on a Friday', chip: 'HOOK', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's2-2', type: 'idea', position: { x: cX + 600, y: cY - 200 }, data: { text: 'Not skill — system problem', chip: 'INSIGHT', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's2-3', type: 'idea', position: { x: cX + 600, y: cY - 120 }, data: { text: 'Human, emotional, shareable', chip: 'PRO', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },

          { id: 'b3', type: 'idea', position: { x: cX - 350, y: cY + 200 }, data: { text: 'Product launch angle', chip: 'OPTION 3', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's3-1', type: 'idea', position: { x: cX - 600, y: cY + 200 }, data: { text: "Thrive's AI playbook feature", chip: 'PRODUCT', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's3-2', type: 'idea', position: { x: cX - 600, y: cY + 280 }, data: { text: '⚠ Risk: too internal, low news value', chip: 'CON', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },

          { id: 'b4', type: 'idea', position: { x: cX + 350, y: cY + 200 }, data: { text: 'Regional Ugadi hook', chip: 'OPTION 4', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's4-1', type: 'idea', position: { x: cX + 600, y: cY + 120 }, data: { text: 'Vernacular-first — 3-4x engagement', chip: 'SIGNAL', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's4-2', type: 'idea', position: { x: cX + 600, y: cY + 200 }, data: { text: 'Tanishq and Paper Boat doing this now', chip: 'CONTEXT', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 's4-3', type: 'idea', position: { x: cX + 600, y: cY + 280 }, data: { text: '✓ Timely, culturally relevant', chip: 'PRO', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
        ]

        const edgesList = [
          { id: 'e-b1', source: 'central', target: 'b1' },
          { id: 'e-b2', source: 'central', target: 'b2' },
          { id: 'e-b3', source: 'central', target: 'b3' },
          { id: 'e-b4', source: 'central', target: 'b4' },
          { id: 'e-s1-1', source: 'b1', target: 's1-1' },
          { id: 'e-s1-2', source: 'b1', target: 's1-2' },
          { id: 'e-s1-3', source: 'b1', target: 's1-3' },
          { id: 'e-s2-1', source: 'b2', target: 's2-1' },
          { id: 'e-s2-2', source: 'b2', target: 's2-2' },
          { id: 'e-s2-3', source: 'b2', target: 's2-3' },
          { id: 'e-s3-1', source: 'b3', target: 's3-1' },
          { id: 'e-s3-2', source: 'b3', target: 's3-2' },
          { id: 'e-s4-1', source: 'b4', target: 's4-1' },
          { id: 'e-s4-2', source: 'b4', target: 's4-2' },
          { id: 'e-s4-3', source: 'b4', target: 's4-3' },
        ].map(e => ({ ...e, style: { strokeDasharray: '4 4', stroke: '#D4622A', strokeWidth: 1.5, opacity: 0.8 } }))

        setNodes(nodesList)
        setEdges(edgesList)
        localStorage.setItem('thrivee_canvas_nodes', JSON.stringify(nodesList))
        localStorage.setItem('thrivee_canvas_edges', JSON.stringify(edgesList))
      } else {
        const nodesList = [
          { id: 'central', type: 'central', position: { x: cX, y: cY }, data: { text: activeTask, isGenerating: false } },
          { id: 'b1', type: 'idea', position: { x: cX - 300, y: cY - 150 }, data: { text: '', chip: 'NODE 1', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 'b2', type: 'idea', position: { x: cX + 300, y: cY - 150 }, data: { text: '', chip: 'NODE 2', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 'b3', type: 'idea', position: { x: cX - 300, y: cY + 150 }, data: { text: '', chip: 'NODE 3', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
          { id: 'b4', type: 'idea', position: { x: cX + 300, y: cY + 150 }, data: { text: '', chip: 'NODE 4', isEditing: false, onClick: handleNodeClick, onBlur: handleNodeBlur } },
        ]
        const edgesList = [
          { id: 'e-b1', source: 'central', target: 'b1' },
          { id: 'e-b2', source: 'central', target: 'b2' },
          { id: 'e-b3', source: 'central', target: 'b3' },
          { id: 'e-b4', source: 'central', target: 'b4' },
        ].map(e => ({ ...e, style: { strokeDasharray: '4 4', stroke: '#D4622A', strokeWidth: 1.5, opacity: 0.8 } }))

        setNodes(nodesList)
        setEdges(edgesList)
        localStorage.setItem('thrivee_canvas_nodes', JSON.stringify(nodesList))
        localStorage.setItem('thrivee_canvas_edges', JSON.stringify(edgesList))
      }
    }

    initializeCanvas()
  }, [activeTask, handleNodeClick, handleNodeBlur, setEdges, setNodes])

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
  }, [chatMessages, isTyping])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return
    const userMsg = { role: 'user', content: chatInput.trim() }
    const newHistory = [...chatMessages, userMsg]
    setChatMessages(newHistory)
    setChatInput('')
    setIsTyping(true)

    let protectTasks = []
    try {
      const stored = localStorage.getItem('thrivee_tasks')
      if (stored) {
        protectTasks = JSON.parse(stored).filter(t => t.category === 'protect' || t.category === 'own').map(t => t.text || t.task)
      }
    } catch(e) {}

    const centralNodeText = nodes.find(n => n.id === 'central')?.data.text || ""

    try {
      const res = await fetch('/api/thinking-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, nodes: nodes.filter(n => n.id !== 'central').map(n => n.data), centralNodeText, protectTasks })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.result }])
    } catch (e) {
      console.error(e)
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection issue: ' + e.message }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleNewNode = () => {
    const cWidth = 280; const cHeight = 200;
    const cX = window.innerWidth / 2 - cWidth / 2;
    const cY = window.innerHeight / 2 - cHeight / 2;

    const offsetX = (Math.random() * 300) - 150;
    const offsetY = (Math.random() * 300) - 150;

    const newNode = {
      id: `node-${Date.now()}`,
      type: 'idea',
      position: { x: cX + offsetX, y: cY + offsetY },
      data: {
        text: '', chip: 'NEW THOUGHT', isEditing: true,
        onClick: handleNodeClick, onBlur: handleNodeBlur
      }
    }

    setNodes(nds => {
      const updated = [...nds, newNode]
      localStorage.setItem('thrivee_canvas_nodes', JSON.stringify(updated.filter(n => n.id !== 'central')))
      return updated
    })
    setShowStartBtn(false)
  }

  const onConnect = useCallback((params) => {
    setEdges(eds => {
      const edge = { 
        ...params, 
        style: { strokeDasharray: '4 4', stroke: '#D4622A', strokeWidth: 1.5, opacity: 0.8 },
        animated: false
      }
      const updated = addEdge(edge, eds)
      localStorage.setItem('thrivee_canvas_edges', JSON.stringify(updated))
      return updated
    })
  }, [setEdges])

  const handleNodesChangeWrapper = useCallback((changes) => {
    onNodesChange(changes)
    // Small timeout to allow nodes state to sync before saving to localStorage
    setTimeout(() => {
      setNodes(nds => {
        localStorage.setItem('thrivee_canvas_nodes', JSON.stringify(nds.filter(k => k.id !== 'central')))
        return nds
      })
    }, 10)
  }, [onNodesChange, setNodes])

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#0F1716', color: '#dce4e2', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        .whiteboard-grid {
          background-color: #0F1716;
          background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 0);
          background-size: 24px 24px;
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
        .typing-dot {
          width: 6px; height: 6px; background-color: #D4622A; border-radius: 50%;
          animation: typeBounce 1.4s infinite ease-in-out both;
        }
        @keyframes typeBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        
        .custom-handle {
          width: 8px !important;
          height: 8px !important;
          background-color: #D4622A !important;
          border: none !important;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .react-flow__node:hover .custom-handle {
          opacity: 1;
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Top Header */}
      <header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 32px', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <button onClick={() => navigate('/dashboard')} className="wbtn" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dec0b5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, transition: 'color 0.2s' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem', transition: 'transform 0.2s' }}>arrow_back</span>
            Dashboard
          </button>
        </div>

        <div style={{ pointerEvents: 'auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="wbtn" 
            style={{ 
              background: '#D4622A', 
              color: 'white', 
              padding: '6px 20px', 
              borderRadius: '9999px', 
              fontWeight: 700, 
              fontSize: '0.75rem', 
              border: 'none', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(212,98,42,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Export Strategy →
          </button>
          <button onClick={() => navigate('/dashboard')} className="wbtn" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0F1716', border: '1px solid rgba(38,166,154,0.3)', padding: '6px 16px', borderRadius: '9999px', transition: 'background 0.2s', cursor: 'pointer' }}>
            <span style={{ position: 'relative', display: 'flex', width: '8px', height: '8px' }}>
              <span className="agent-dot-ping" style={{ position: 'absolute', inset: 0, background: '#26a69a', borderRadius: '50%', opacity: 0.75, width: '8px', height: '8px' }} />
              <span style={{ position: 'relative', background: '#26a69a', borderRadius: '50%', width: '8px', height: '8px' }} />
            </span>
            <span style={{ color: '#26a69a', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {agentCount > 0 ? `Agent Root: ${agentCount} Active` : 'Agent Root: Active'}
            </span>
          </button>
        </div>
      </header>

      {/* Canvas */}
      <main className="whiteboard-grid" style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '900px', height: '900px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.02)', pointerEvents: 'none', zIndex: 0 }} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChangeWrapper}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode="loose"
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={4}
        />

        {/* Bottom Left Actions */}
        <div style={{ position: 'absolute', bottom: '48px', left: '48px', zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={handleNewNode} className="wbtn" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#232c2a', color: '#dce4e2', padding: '16px 24px', borderRadius: '9999px', border: '1px solid rgba(87,66,58,0.2)', cursor: 'pointer', fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}>
            <span className="material-symbols-outlined" style={{ color: '#D4622A', transition: 'transform 0.2s' }}>add_circle</span>
            + New Node
          </button>
        </div>

        {/* Bottom Right: Ask Thrivee */}
        <div style={{ position: 'absolute', bottom: '48px', right: '48px', zIndex: 50 }}>
          <button onClick={() => setShowAiPanel(v => !v)} className="wbtn" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#D4622A', color: 'white', padding: '16px 28px', borderRadius: '9999px', border: '1px solid rgba(212,98,42,0.2)', cursor: 'pointer', fontWeight: 700, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', transition: 'all 0.2s' }}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            Ask Thrivee
          </button>
        </div>
      </main>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div className="pulse-soft" style={{ background: '#192120', border: '1px solid #D4622A', borderRadius: '24px', width: '90%', maxWidth: '640px', padding: '40px', position: 'relative', boxShadow: '0 30px 60px rgba(212,98,42,0.15)', animation: 'modalSlideUp 0.4s cubic-bezier(0.19, 1, 0.22, 1)' }}>
            <button 
              onClick={() => setIsExportModalOpen(false)} 
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', fontWeight: 700 }}
            >
              ✕ close
            </button>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', color: 'white' }}>Export your strategy</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '32px' }}>
              Your thinking canvas for: <span style={{ color: '#D4622A', fontWeight: 700 }}>{nodes.find(n => n.id === 'central')?.data?.text || 'Finalise the press release'}</span>
            </p>
            
            <div style={{ background: '#0F1716', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', maxHeight: '360px', overflowY: 'auto', marginBottom: '32px', textAlign: 'left', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', scrollbarWidth: 'thin' }}>
              {getExportContent('txt')}
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                onClick={() => downloadFile('txt')} 
                style={{ flex: 1, background: '#D4622A', color: 'white', border: 'none', padding: '16px', borderRadius: '9999px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'transform 0.2s', boxShadow: '0 8px 20px rgba(212,98,42,0.2)' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>description</span>
                Download .txt
              </button>
              <button 
                onClick={() => downloadFile('md')} 
                style={{ flex: 1, background: '#D4622A', color: 'white', border: 'none', padding: '16px', borderRadius: '9999px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'transform 0.2s', boxShadow: '0 8px 20px rgba(212,98,42,0.2)' }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>markdown</span>
                Download .md
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Side Panel */}
      {showAiPanel && (
        <aside className="ai-panel-slide" style={{ position: 'fixed', right: 0, top: 0, height: '100%', width: '360px', background: '#151d1c', borderLeft: '1px solid rgba(87,66,58,0.2)', display: 'flex', flexDirection: 'column', zIndex: 60 }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(87,66,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: '#D4622A', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <h2 style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Thrivee AI Assistant</h2>
            </div>
            <button onClick={() => setShowAiPanel(false)} style={{ color: 'rgba(220,228,226,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div ref={chatScrollRef} style={{ flexGrow: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {chatMessages.map((msg, i) => {
              const isAssistant = msg.role === 'assistant'
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '90%', alignSelf: isAssistant ? 'flex-start' : 'flex-end' }}>
                  <div style={{ 
                    background: isAssistant ? '#2e3635' : 'rgba(212,98,42,0.1)', 
                    padding: '16px', 
                    borderRadius: isAssistant ? '16px 16px 16px 0' : '16px 16px 0 16px', 
                    fontSize: '0.875rem', 
                    color: isAssistant ? '#dec0b5' : '#ffffff', 
                    border: '1px solid', 
                    borderColor: isAssistant ? 'rgba(87,66,58,0.2)' : 'rgba(212,98,42,0.3)',
                    lineHeight: 1.5
                  }}>
                    {msg.content}
                  </div>
                  <span style={{ fontSize: '0.625rem', color: 'rgba(220,228,226,0.4)', fontWeight: 700, textTransform: 'uppercase', marginLeft: isAssistant ? '4px' : 0, marginRight: !isAssistant ? '4px' : 0, alignSelf: isAssistant ? 'flex-start' : 'flex-end' }}>
                    {isAssistant ? 'Thrivee AI' : 'You'}
                  </span>
                </div>
              )
            })}
            {isTyping && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '90%', alignSelf: 'flex-start' }}>
                <div style={{ background: '#2e3635', padding: '16px 20px', borderRadius: '16px 16px 16px 0', border: '1px solid rgba(87,66,58,0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="typing-dot" style={{ animationDelay: '0ms' }}></div>
                  <div className="typing-dot" style={{ animationDelay: '160ms' }}></div>
                  <div className="typing-dot" style={{ animationDelay: '320ms' }}></div>
                </div>
                <span style={{ fontSize: '0.625rem', color: 'rgba(220,228,226,0.4)', fontWeight: 700, textTransform: 'uppercase', marginLeft: '4px' }}>Thrivee AI</span>
              </div>
            )}
          </div>
          <div style={{ padding: '24px', paddingTop: '8px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                style={{ width: '100%', background: '#192120', border: '1px solid rgba(87,66,58,0.3)', borderRadius: '9999px', padding: '12px 20px', paddingRight: '48px', fontSize: '0.875rem', color: '#dce4e2', outline: 'none', caretColor: '#D4622A' }}
              />
              <button onClick={handleSendMessage} disabled={!chatInput.trim() || isTyping} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: (!chatInput.trim() || isTyping) ? 'default' : 'pointer', color: (!chatInput.trim() || isTyping) ? 'rgba(212,98,42,0.3)' : '#D4622A', transition: 'color 0.2s' }}>
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
