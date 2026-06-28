import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Fichaje from './pages/Fichaje'
import Informes from './pages/Informes'
import Administracion from './pages/Administracion'

// Icono reloj SVG verde
function IconoReloj() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '10px', background: '#1b5e20', padding: '4px' }}>
      <circle cx="18" cy="18" r="12" stroke="#fff" strokeWidth="2" fill="none"/>
      <line x1="18" y1="18" x2="18" y2="10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="18" x2="23" y2="21" stroke="#4caf50" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="18" cy="18" r="1.5" fill="#fff"/>
    </svg>
  )
}

export default function App() {
  const [sesion, setSesion] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [tab, setTab] = useState('fichaje')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
      if (data.session) cargarPerfil(data.session.user.id)
      else setCargando(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setSesion(session)
      if (session) cargarPerfil(session.user.id)
      else { setPerfil(null); setCargando(false) }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function cargarPerfil(uid) {
    const { data } = await supabase.from('perfiles').select('*').eq('id', uid).single()
    setPerfil(data)
    setCargando(false)
  }

  if (cargando) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#999' }}>Cargando…</p>
    </div>
  )

  if (!sesion || !perfil) return <Login />

  const esTrabajador = perfil.rol === 'trabajador'
  const esAsesoria = perfil.rol === 'asesoria'

  const tabs = esTrabajador
    ? [
        { id: 'fichaje',   label: 'Fichar',     icon: '⏱' },
        { id: 'historial', label: 'Mi jornada', icon: '📅' },
        { id: 'perfil',    label: 'Perfil',     icon: '👤' },
      ]
    : esAsesoria
    ? [
        { id: 'informes',       label: 'Informes', icon: '📊' },
        { id: 'administracion', label: 'Gestión',  icon: '⚙️' },
        { id: 'perfil',         label: 'Cuenta',   icon: '👤' },
      ]
    : [
        { id: 'fichaje',   label: 'En vivo',  icon: '🟢' },
        { id: 'informes',  label: 'Informes', icon: '📊' },
        { id: 'perfil',    label: 'Cuenta',   icon: '👤' },
      ]

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Cabecera */}
      <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '12px', background: '#fff' }}>
        <IconoReloj />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '500' }}>Portal del empleado</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{perfil.nombre} {perfil.apellidos}</div>
        </div>
        <span style={{
          fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '500',
          background: perfil.rol === 'trabajador' ? '#e8f5e9' : perfil.rol === 'empresa' ? '#e3f2fd' : '#f3e5f5',
          color: perfil.rol === 'trabajador' ? '#2e7d32' : perfil.rol === 'empresa' ? '#1565c0' : '#6a1b9a',
        }}>{perfil.rol}</span>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f9f9f9' }}>
        {tab === 'fichaje' && esTrabajador && <Fichaje perfil={perfil} />}
        {tab === 'fichaje' && !esTrabajador && !esAsesoria && <Informes perfil={perfil} />}
        {tab === 'historial' && <Informes perfil={perfil} />}
        {tab === 'informes' && <Informes perfil={perfil} />}
        {tab === 'administracion' && <Administracion perfil={perfil} />}
        {tab === 'perfil' && (
          <div style={{ padding: '20px' }}>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ fontWeight: '500', marginBottom: '10px' }}>{perfil.nombre} {perfil.apellidos}</div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
                <div>📧 {sesion.user.email}</div>
                {perfil.departamento && <div>🏢 {perfil.departamento}</div>}
                <div>⏰ {perfil.horas_semanales}h/semana</div>
                {perfil.centro_trabajo && <div>📍 {perfil.centro_trabajo}</div>}
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} style={{
              width: '100%', padding: '12px', background: 'transparent', border: '1px solid #ddd',
              borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#333'
            }}>Cerrar sesión</button>
          </div>
        )}
      </div>

      {/* Navegación inferior */}
      <div style={{ display: 'flex', borderTop: '1px solid #eee', background: '#fff' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 4px 8px', border: 'none', background: 'none',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            color: tab === t.id ? '#1a1a2e' : '#999', fontFamily: 'inherit'
          }}>
            <span style={{ fontSize: '20px' }}>{t.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: tab === t.id ? '500' : '400' }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
