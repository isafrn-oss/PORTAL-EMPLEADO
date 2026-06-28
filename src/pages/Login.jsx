import { useState } from 'react'
import { supabase } from '../lib/supabase'

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
      justifyContent: 'center', padding: '32px 24px', gap: '20px',
      maxWidth: '420px', margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{
          width: '64px', height: '64px', background: '#1a1a2e', borderRadius: '16px',
          margin: '0 auto 16px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '32px'
        }}>⏱</div>
        <h1 style={{ fontSize: '22px', fontWeight: '500' }}>Portal del empleado</h1>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '6px' }}>
          Control horario · Normativa 2026
        </p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: '#666' }}>Correo electrónico</label>
          <input
            type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="nombre@empresa.com"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', color: '#666' }}>Contraseña</label>
          <input
            type="password" required value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px' }}
          />
        </div>
        {error && (
          <p style={{ color: '#c62828', fontSize: '13px', background: '#ffebee', padding: '10px 14px', borderRadius: '8px' }}>
            {error}
          </p>
        )}
        <button
          type="submit" disabled={cargando}
          style={{
            padding: '14px', background: '#1a1a2e', color: '#fff', border: 'none',
            borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: 'pointer',
            opacity: cargando ? 0.7 : 1
          }}
        >
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', marginTop: '8px' }}>
        Tu empresa o asesoría te proporcionará las credenciales de acceso.
      </p>
    </div>
  )
}
