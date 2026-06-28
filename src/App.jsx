import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Fichaje from './pages/Fichaje'
import Informes from './pages/Informes'
import Administracion from './pages/Administracion'

function IconoReloj({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '14px', background: 'linear-gradient(135deg,#1b5e20,#43a047)', padding: '6px', flexShrink: 0 }}>
      <circle cx="22" cy="22" r="14" stroke="#fff" strokeWidth="2.5" fill="none"/>
      <circle cx="22" cy="22" r="2" fill="#fff"/>
      <line x1="22" y1="22" x2="22" y2="12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="22" y1="22" x2="29" y2="26" stroke="#a5d6a7" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="22" cy="9" r="1" fill="#a5d6a7"/>
      <circle cx="22" cy="35" r="1" fill="#a5d6a7"/>
      <circle cx="9" cy="22" r="1" fill="#a5d6a7"/>
      <circle cx="35" cy="22" r="1" fill="#a5d6a7"/>
    </svg>
  )
}

function LogoAsesoria() {
  return (
    <div style={{
      width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
      background: 'linear-gradient(135deg,#4a148c,#7b1fa2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
    }}>⚖️</div>
  )
}

function LogoEmpresa() {
  return (
    <div style={{
      width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
      background: 'linear-gradient(135deg,#0d47a1,#1976d2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
    }}>🏢</div>
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
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <IconoReloj size={56} />
      <p style={{ color: '#999', fontSize: '14px' }}>Cargando…</p>
    </div>
  )

  if (!sesion || !perfil) return <Login />

  const esTrabajador = perfil.rol === 'trabajador'
  const esAsesoria = perfil.rol === 'asesoria'
  const esEmpresa = perfil.rol === 'empresa'

  // Bloquear fichaje si trabajador dado de baja
  const puedeFinchar = esTrabajador && perfil.activo !== false

  const tabs = esTrabajador
    ? [
        { id: 'fichaje',   label: 'Fichar',     icon: '⏱️' },
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

  const Logo = esAsesoria ? LogoAsesoria : esEmpresa ? LogoEmpresa : IconoReloj

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Cabecera */}
      <div style={{
        padding: '14px 20px 12px', borderBottom: '1px solid #eee',
        display: 'flex', alignItems: 'center', gap: '12px', background: '#fff',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)'
      }}>
        <Logo />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>Portal del empleado</div>
          <div style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {perfil.nombre} {perfil.apellidos}
          </div>
        </div>
        <span style={{
          fontSize: '11px', padding: '4px 12px', borderRadius: '20px', fontWeight: '600', flexShrink: 0,
          background: perfil.rol === 'trabajador' ? '#e8f5e9' : perfil.rol === 'empresa' ? '#e3f2fd' : '#f3e5f5',
          color: perfil.rol === 'trabajador' ? '#2e7d32' : perfil.rol === 'empresa' ? '#1565c0' : '#6a1b9a',
        }}>{perfil.rol}</span>
      </div>

      {/* Aviso trabajador de baja */}
      {esTrabajador && perfil.activo === false && (
        <div style={{ background: '#ffebee', padding: '12px 20px', fontSize: '13px', color: '#c62828', textAlign: 'center' }}>
          ⚠️ Tu cuenta está dada de baja. Contacta con tu empresa.
        </div>
      )}

      {/* Contenido */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f5' }}>
        {tab === 'fichaje' && esTrabajador && puedeFinchar && <Fichaje perfil={perfil} />}
        {tab === 'fichaje' && !esTrabajador && !esAsesoria && <Informes perfil={perfil} />}
        {tab === 'historial' && <Informes perfil={perfil} />}
        {tab === 'informes' && <Informes perfil={perfil} />}
        {tab === 'administracion' && <Administracion perfil={perfil} />}
        {tab === 'perfil' && (
          <div style={{ padding: '20px' }}>
            <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '16px', padding: '20px', marginBottom: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#1b5e20,#43a047)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '20px', fontWeight: '700'
                }}>{perfil.nombre?.[0]}{perfil.apellidos?.[0]}</div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '16px' }}>{perfil.nombre} {perfil.apellidos}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{perfil.rol}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: '📧', label: sesion.user.email },
                  perfil.departamento && { icon: '🏢', label: perfil.departamento },
                  { icon: '⏰', label: `${perfil.horas_semanales}h/semana` },
                  perfil.centro_trabajo && { icon: '📍', label: perfil.centro_trabajo },
                  perfil.fecha_alta && { icon: '📅', label: `Alta: ${perfil.fecha_alta}` },
                ].filter(Boolean).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#555' }}>
                    <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => supabase.auth.signOut()} style={{
              width: '100%', padding: '14px', background: 'transparent', border: '1.5px solid #ddd',
              borderRadius: '12px', fontSize: '14px', cursor: 'pointer', color: '#666', fontFamily: 'inherit'
            }}>Cerrar sesión</button>
          </div>
        )}
      </div>

      {/* Navegación inferior — iconos grandes */}
      <div style={{ display: 'flex', borderTop: '1px solid #eee', background: '#fff', boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '12px 4px 10px', border: 'none', background: 'none',
            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            color: tab === t.id ? '#1b5e20' : '#bbb', fontFamily: 'inherit',
            borderTop: tab === t.id ? '3px solid #1b5e20' : '3px solid transparent',
          }}>
            <span style={{ fontSize: '26px', lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: '11px', fontWeight: tab === t.id ? '600' : '400' }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
