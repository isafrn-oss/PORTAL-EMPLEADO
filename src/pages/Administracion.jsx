import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Administracion({ perfil }) {
  const [tab, setTab] = useState('empresas')
  const [empresas, setEmpresas] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  // Formulario empresa
  const [fEmpresa, setFEmpresa] = useState({ nombre: '', cif: '' })
  // Formulario trabajador
  const [fTrabajador, setFTrabajador] = useState({
    nombre: '', apellidos: '', email: '', password: '',
    empresa_id: '', rol: 'trabajador', departamento: '',
    horas_semanales: 40, centro_trabajo: ''
  })

  useEffect(() => { cargarEmpresas(); cargarTrabajadores() }, [])

  async function cargarEmpresas() {
    const { data } = await supabase.from('empresas').select('*').order('nombre')
    setEmpresas(data || [])
  }

  async function cargarTrabajadores() {
    const { data } = await supabase
      .from('perfiles')
      .select('*, empresas(nombre)')
      .order('nombre')
    setTrabajadores(data || [])
  }

  function mostrarMensaje(msg, esError = false) {
    if (esError) setError(msg)
    else setMensaje(msg)
    setTimeout(() => { setMensaje(''); setError('') }, 4000)
  }

  async function crearEmpresa(e) {
    e.preventDefault()
    setCargando(true)
    const { error } = await supabase.from('empresas').insert(fEmpresa)
    if (error) mostrarMensaje('Error: ' + error.message, true)
    else { mostrarMensaje('✓ Empresa creada correctamente'); setFEmpresa({ nombre: '', cif: '' }); cargarEmpresas() }
    setCargando(false)
  }

  async function crearTrabajador(e) {
    e.preventDefault()
    setCargando(true)
    setError('')

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin
      ? // Si hay acceso admin (no disponible en cliente)
        { data: null, error: { message: 'Usa la función de invitación' } }
      : { data: null, error: null }

    // Usamos signUp para crear el usuario
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: fTrabajador.email,
      password: fTrabajador.password,
      options: { emailRedirectTo: window.location.origin }
    })

    if (signUpError) { mostrarMensaje('Error al crear usuario: ' + signUpError.message, true); setCargando(false); return }

    const uid = signUpData?.user?.id
    if (!uid) { mostrarMensaje('No se pudo obtener el ID del usuario', true); setCargando(false); return }

    // 2. Crear perfil
    const { error: perfilError } = await supabase.from('perfiles').insert({
      id: uid,
      nombre: fTrabajador.nombre,
      apellidos: fTrabajador.apellidos,
      empresa_id: fTrabajador.empresa_id || perfil.empresa_id,
      rol: fTrabajador.rol,
      departamento: fTrabajador.departamento,
      horas_semanales: Number(fTrabajador.horas_semanales),
      centro_trabajo: fTrabajador.centro_trabajo,
    })

    if (perfilError) mostrarMensaje('Usuario creado pero error en perfil: ' + perfilError.message, true)
    else {
      mostrarMensaje('✓ Usuario creado. Debe confirmar su email para acceder.')
      setFTrabajador({ nombre: '', apellidos: '', email: '', password: '', empresa_id: '', rol: 'trabajador', departamento: '', horas_semanales: 40, centro_trabajo: '' })
      cargarTrabajadores()
    }
    setCargando(false)
  }

  async function desactivarTrabajador(id) {
    if (!confirm('¿Desactivar este trabajador?')) return
    await supabase.from('perfiles').update({ activo: false }).eq('id', id)
    mostrarMensaje('✓ Trabajador desactivado')
    cargarTrabajadores()
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1px solid #ddd', fontSize: '14px', fontFamily: 'inherit',
    background: '#fff', color: '#1a1a1a'
  }
  const labelStyle = { fontSize: '13px', color: '#666', marginBottom: '4px', display: 'block' }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #eee', background: '#fff' }}>
        {[
          { id: 'empresas', label: '🏢 Empresas' },
          { id: 'nueva-empresa', label: '+ Empresa' },
          { id: 'usuarios', label: '👥 Usuarios' },
          { id: 'nuevo-usuario', label: '+ Usuario' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 4px', border: 'none', background: 'none',
            cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit',
            color: tab === t.id ? '#1a1a2e' : '#999',
            borderBottom: tab === t.id ? '2px solid #1a1a2e' : '2px solid transparent',
            fontWeight: tab === t.id ? '500' : '400'
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* Mensajes */}
        {mensaje && <div style={{ background: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#2e7d32' }}>{mensaje}</div>}
        {error && <div style={{ background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#c62828' }}>{error}</div>}

        {/* Lista de empresas */}
        {tab === 'empresas' && (
          <>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Empresas registradas ({empresas.length})</p>
            {empresas.map(emp => (
              <div key={emp.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>🏢 {emp.nombre}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>CIF: {emp.cif || '—'}</div>
                <div style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>ID: {emp.id}</div>
              </div>
            ))}
            {empresas.length === 0 && <p style={{ color: '#bbb', textAlign: 'center', padding: '20px', fontSize: '13px' }}>No hay empresas aún</p>}
          </>
        )}

        {/* Nueva empresa */}
        {tab === 'nueva-empresa' && (
          <form onSubmit={crearEmpresa} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nueva empresa</p>
            <div>
              <label style={labelStyle}>Nombre de la empresa *</label>
              <input style={inputStyle} required value={fEmpresa.nombre}
                onChange={e => setFEmpresa({ ...fEmpresa, nombre: e.target.value })}
                placeholder="Empresa S.L." />
            </div>
            <div>
              <label style={labelStyle}>CIF</label>
              <input style={inputStyle} value={fEmpresa.cif}
                onChange={e => setFEmpresa({ ...fEmpresa, cif: e.target.value })}
                placeholder="B-12345678" />
            </div>
            <button type="submit" disabled={cargando} style={{
              padding: '12px', background: '#1a1a2e', color: '#fff', border: 'none',
              borderRadius: '8px', fontSize: '14px', cursor: 'pointer', opacity: cargando ? 0.7 : 1
            }}>
              {cargando ? 'Creando…' : 'Crear empresa'}
            </button>
          </form>
        )}

        {/* Lista de usuarios */}
        {tab === 'usuarios' && (
          <>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuarios registrados ({trabajadores.length})</p>
            {trabajadores.map(t => (
              <div key={t.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '14px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{t.nombre} {t.apellidos}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{t.departamento || '—'} · {t.empresas?.nombre || '—'}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                        background: t.rol === 'trabajador' ? '#e8f5e9' : t.rol === 'empresa' ? '#e3f2fd' : '#f3e5f5',
                        color: t.rol === 'trabajador' ? '#2e7d32' : t.rol === 'empresa' ? '#1565c0' : '#6a1b9a',
                      }}>{t.rol}</span>
                      {!t.activo && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#ffebee', color: '#c62828' }}>inactivo</span>}
                    </div>
                  </div>
                  {t.activo && t.id !== perfil.id && (
                    <button onClick={() => desactivarTrabajador(t.id)} style={{
                      padding: '4px 10px', background: 'transparent', border: '1px solid #ddd',
                      borderRadius: '6px', fontSize: '11px', cursor: 'pointer', color: '#c62828'
                    }}>Desactivar</button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Nuevo usuario */}
        {tab === 'nuevo-usuario' && (
          <form onSubmit={crearTrabajador} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nuevo usuario</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input style={inputStyle} required value={fTrabajador.nombre}
                  onChange={e => setFTrabajador({ ...fTrabajador, nombre: e.target.value })}
                  placeholder="María" />
              </div>
              <div>
                <label style={labelStyle}>Apellidos *</label>
                <input style={inputStyle} required value={fTrabajador.apellidos}
                  onChange={e => setFTrabajador({ ...fTrabajador, apellidos: e.target.value })}
                  placeholder="García López" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Email *</label>
              <input style={inputStyle} type="email" required value={fTrabajador.email}
                onChange={e => setFTrabajador({ ...fTrabajador, email: e.target.value })}
                placeholder="trabajador@empresa.com" />
            </div>

            <div>
              <label style={labelStyle}>Contraseña *</label>
              <input style={inputStyle} type="password" required value={fTrabajador.password}
                onChange={e => setFTrabajador({ ...fTrabajador, password: e.target.value })}
                placeholder="Mínimo 6 caracteres" minLength={6} />
            </div>

            <div>
              <label style={labelStyle}>Rol *</label>
              <select style={inputStyle} value={fTrabajador.rol}
                onChange={e => setFTrabajador({ ...fTrabajador, rol: e.target.value })}>
                <option value="trabajador">Trabajador</option>
                <option value="empresa">Empresa / RRHH</option>
                <option value="asesoria">Asesoría</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Empresa *</label>
              <select style={inputStyle} required value={fTrabajador.empresa_id}
                onChange={e => setFTrabajador({ ...fTrabajador, empresa_id: e.target.value })}>
                <option value="">— Selecciona empresa —</option>
                {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Departamento</label>
              <input style={inputStyle} value={fTrabajador.departamento}
                onChange={e => setFTrabajador({ ...fTrabajador, departamento: e.target.value })}
                placeholder="Administración, Producción…" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Horas/semana</label>
                <input style={inputStyle} type="number" value={fTrabajador.horas_semanales}
                  onChange={e => setFTrabajador({ ...fTrabajador, horas_semanales: e.target.value })}
                  min={1} max={40} />
              </div>
              <div>
                <label style={labelStyle}>Centro de trabajo</label>
                <input style={inputStyle} value={fTrabajador.centro_trabajo}
                  onChange={e => setFTrabajador({ ...fTrabajador, centro_trabajo: e.target.value })}
                  placeholder="Sede principal" />
              </div>
            </div>

            <div style={{ background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: '8px', padding: '10px 14px' }}>
              <p style={{ fontSize: '12px', color: '#e65100' }}>⚠️ El trabajador recibirá un email de confirmación. Hasta que lo confirme no podrá acceder. Asegúrate de que el email es correcto.</p>
            </div>

            <button type="submit" disabled={cargando} style={{
              padding: '12px', background: '#1a1a2e', color: '#fff', border: 'none',
              borderRadius: '8px', fontSize: '14px', cursor: 'pointer', opacity: cargando ? 0.7 : 1
            }}>
              {cargando ? 'Creando usuario…' : 'Crear usuario'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
