import { useState } from 'react'
import { supabase } from '../lib/supabase'

function IconoReloj() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: '20px', background: 'linear-gradient(135deg,#1b5e20,#43a047)' }}>
      <circle cx="36" cy="36" r="22" stroke="#fff" strokeWidth="3" fill="none"/>
      <circle cx="36" cy="36" r="3" fill="#fff"/>
      <line x1="36" y1="36" x2="36" y2="20" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
      <line x1="36" y1="36" x2="47" y2="43" stroke="#a5d6a7" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="36" cy="15" r="1.5" fill="#a5d6a7"/>
      <circle cx="36" cy="57" r="1.5" fill="#a5d6a7"/>
      <circle cx="15" cy="36" r="1.5" fill="#a5d6a7"/>
      <circle cx="57" cy="36" r="1.5" fill="#a5d6a7"/>
    </svg>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Usuario o contraseña incorrectos')
    setCargando(false)
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '24px', gap: '16px',
      maxWidth: '420px', margin: '0 auto'
    }}>

      {/* Logo y título */}
      <div style={{ textAlign: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <IconoReloj />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Portal del empleado</h1>
        <p style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>
          Control horario · Normativa 2026
        </p>
      </div>

      {/* Formulario */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1.5px solid #eee', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>Correo electrónico</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              style={{ padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #e0e0e0', fontSize: '15px', outline: 'none', background: '#fafafa' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>Contraseña</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #e0e0e0', fontSize: '15px', outline: 'none', background: '#fafafa' }}
            />
          </div>
          {error && (
            <div style={{ color: '#c62828', fontSize: '13px', background: '#ffebee', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ❌ {error}
            </div>
          )}
          <button
            type="submit" disabled={cargando}
            style={{
              padding: '14px', background: 'linear-gradient(135deg,#1b5e20,#43a047)', color: '#fff', border: 'none',
              borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
              opacity: cargando ? 0.7 : 1, marginTop: '4px'
            }}
          >
            {cargando ? 'Entrando…' : 'Entrar →'}
          </button>
        </form>
      </div>

      <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center' }}>
        Tu empresa o asesoría te proporcionará las credenciales de acceso.
      </p>
    </div>
  )
}
