import { useNavigate } from 'react-router-dom'

export default function Focus() {
  const navigate = useNavigate()

  return (
    <div style={{ backgroundColor: '#0F1716', color: '#dce4e2', fontFamily: "'Plus Jakarta Sans', sans-serif", minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Top Header */}
      <header style={{ width: '100%', padding: '16px 24px', display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#ffb596' }}>Thrivee</div>
      </header>

      {/* Main Content */}
      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#dce4e2', textAlign: 'center' }}>
          Focus — Coming Soon
        </h1>
      </main>

      {/* Bottom Mobile Nav */}
      <nav style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, width: '100%', justifyContent: 'space-around', alignItems: 'center', padding: '0 16px 24px', paddingTop: '8px', background: 'rgba(13,21,20,0.8)', backdropFilter: 'blur(12px)', zIndex: 50 }}>
        {[
          { icon: 'wb_sunny', label: 'Today', path: '/home', active: false },
          { icon: 'calendar_today', label: 'Library', path: '/plan', active: false },
          { icon: 'timer', label: 'Focus', path: '/focus', active: true },
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
