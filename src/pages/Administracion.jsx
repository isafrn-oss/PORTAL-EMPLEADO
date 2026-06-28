import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Administracion({ perfil }) {
  const [tab, setTab] = useState('empresas')
  const [empresas, setEmpresas] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [filtroTrabajadores, setFiltroTrabajadores] = useState('activos')

  const [fEmpresa, setFEmpresa] = useState({ nombre: '', cif: '' })
  const [fTrabajador, setFTrabajador] = useState({
    nombre: '', apellidos: '', email: '', password: '',
    empresa_id: '', rol: 'trabajador', departamento: '',
    horas_semanales: 40, centro_trabajo: '', fecha_alta: new Date().toISOString().split('T')[0]
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
    else { mostrarMensaje('✓ Empresa creada'); setFEmpresa({ nombre: '', cif: '' }); cargarEmpresas() }
    setCargando(false)
  }

  async function darDeBajaEmpresa(id, nombre) {
    if (!confirm(`¿Dar de baja la empresa "${nombre}"?\n\nSus datos y fichajes se conservan para la Inspección de Trabajo, pero dejará de aparecer como cliente activo.`)) return
    const { error } = await supabase.from('empresas').update({ activo: false, fecha_baja: new Date().toISOString().split('T')[0] }).eq('id', id)
    if (error) mostrarMensaje('Error: ' + error.message, true)
    else { mostrarMensaje('✓ Empresa dada de baja. Sus datos se conservan.'); cargarEmpresas() }
  }

  async function reactivarEmpresa(id) {
    await supabase.from('empresas').update({ activo: true, fecha_baja: null }).eq('id', id)
    mostrarMensaje('✓ Empresa reactivada'); cargarEmpresas()
  }

  async function crearTrabajador(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: fTrabajador.email,
      password: fTrabajador.password,
      options: { emailRedirectTo: window.location.origin }
    })
    if (signUpError) { mostrarMensaje('Error al crear usuario: ' + signUpError.message, true); setCargando(false); return }
    const uid = signUpData?.user?.id
    if (!uid) { mostrarMensaje('No se pudo obtener el ID del usuario', true); setCargando(false); return }
    const { error: perfilError } = await supabase.from('perfiles').insert({
      id: uid,
      nombre: fTrabajador.nombre,
      apellidos: fTrabajador.apellidos,
      empresa_id: fTrabajador.empresa_id || perfil.empresa_id,
      rol: fTrabajador.rol,
      departamento: fTrabajador.departamento,
      horas_semanales: Number(fTrabajador.horas_semanales),
      centro_trabajo: fTrabajador.centro_trabajo,
      fecha_alta: fTrabajador.fecha_alta,
      activo: true,
    })
    if (perfilError) mostrarMensaje('Usuario creado pero error en perfil: ' + perfilError.message, true)
    else {
      mostrarMensaje('✓ Usuario creado correctamente.')
      setFTrabajador({ nombre: '', apellidos: '', email: '', password: '', empresa_id: '', rol: 'trabajador', departamento: '', horas_semanales: 40, centro_trabajo: '', fecha_alta: new Date().toISOString().split('T')[0] })
      cargarTrabajadores()
    }
    setCargando(false)
  }

  async function darDeBajaTrabajador(id, nombre) {
    const fechaBaja = prompt(`Fecha de baja de ${nombre} (AAAA-MM-DD):`, new Date().toISOString().split('T')[0])
    if (!fechaBaja) return
    const { error } = await supabase.from('perfiles').update({ activo: false, fecha_baja: fechaBaja }).eq('id', id)
    if (error) mostrarMensaje('Error: ' + error.message, true)
    else { mostrarMensaje(`✓ ${nombre} dado de baja el ${fechaBaja}. Sus fichajes se conservan.`); cargarTrabajadores() }
  }

  async function reactivarTrabajador(id) {
    await supabase.from('perfiles').update({ activo: true, fecha_baja: null }).eq('id', id)
    mostrarMensaje('✓ Trabajador reactivado'); cargarTrabajadores()
  }

  const inp = {
    width: '100%', padding: '11px 12px', borderRadius: '10px',
    border: '1.5px solid #e0e0e0', fontSize: '14px', fontFamily: 'inherit',
    background: '#fafafa', color: '#1a1a1a', outline: 'none'
  }
  const lbl = { fontSize: '12px', color: '#555', marginBottom: '5px', display: 'block', fontWeight: '500' }

  const empresasActivas = empresas.filter(e => e.activo !== false)
  const empresasBaja = empresas.filter(e => e.activo === false)
  const trabajadoresFiltrados = trabajadores.filter(t =>
    filtroTrabajadores === 'activos' ? t.activo !== false : t.activo === false
  )

  const TABS = [
    { id: 'empresas', icon: '🏢', label: 'Empresas' },
    { id: 'nueva-empresa', icon: '➕', label: 'Nueva empresa' },
    { id: 'usuarios', icon: '👥', label: 'Usuarios' },
    { id: 'nuevo-usuario', icon: '➕', label: 'Nuevo usuario' },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>

      {/* Tabs grandes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0', background: '#fff', borderBottom: '1px solid #eee' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '14px 4px 10px', border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            fontFamily: 'inherit', fontSize: '10px',
            color: tab === t.id ? '#1a1a2e' : '#aaa',
            borderBottom: tab === t.id ? '3px solid #1b5e20' : '3px solid transparent',
            fontWeight: tab === t.id ? '600' : '400'
          }}>
            <span style={{ fontSize: '22px' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {mensaje && <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', fontSize: '13px', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '8px' }}>✅ {mensaje.replace('✓ ', '')}</div>}
        {error && <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', fontSize: '13px', color: '#c62828', display: 'flex', alignItems: 'center', gap: '8px' }}>❌ {error}</div>}

        {/* ===== LISTA EMPRESAS ===== */}
        {tab === 'empresas' && (
          <>
            {/* Activas */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🟢</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Clientes activos ({empresasActivas.length})</span>
            </div>
            {empresasActivas.map(emp => (
              <div key={emp.id} style={{ background: '#fff', border: '1.5px solid #e8f5e9', borderRadius: '14px', padding: '16px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>🏢 {emp.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>CIF: {emp.cif || '—'}</div>
                  </div>
                  <button onClick={() => darDeBajaEmpresa(emp.id, emp.nombre)} style={{
                    padding: '6px 12px', background: '#ffebee', border: '1px solid #ef9a9a',
                    borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: '#c62828', fontFamily: 'inherit'
                  }}>Dar de baja</button>
                </div>
              </div>
            ))}
            {empresasActivas.length === 0 && <p style={{ color: '#bbb', textAlign: 'center', padding: '20px', fontSize: '13px' }}>No hay empresas activas</p>}

            {/* Bajas */}
            {empresasBaja.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '20px 0 12px' }}>
                  <span style={{ fontSize: '20px' }}>🔴</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#999' }}>Clientes dados de baja ({empresasBaja.length})</span>
                </div>
                {empresasBaja.map(emp => (
                  <div key={emp.id} style={{ background: '#fafafa', border: '1.5px solid #eee', borderRadius: '14px', padding: '16px', marginBottom: '10px', opacity: 0.7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: '#999' }}>🏢 {emp.nombre}</div>
                        <div style={{ fontSize: '12px', color: '#bbb' }}>Baja: {emp.fecha_baja || '—'} · Datos conservados</div>
                      </div>
                      <button onClick={() => reactivarEmpresa(emp.id)} style={{
                        padding: '6px 12px', background: '#e8f5e9', border: '1px solid #a5d6a7',
                        borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: '#2e7d32', fontFamily: 'inherit'
                      }}>Reactivar</button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {/* ===== NUEVA EMPRESA ===== */}
        {tab === 'nueva-empresa' && (
          <form onSubmit={crearEmpresa} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1.5px solid #eee' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>🏢 Nueva empresa cliente</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={lbl}>Nombre de la empresa *</label>
                  <input style={inp} required value={fEmpresa.nombre}
                    onChange={e => setFEmpresa({ ...fEmpresa, nombre: e.target.value })}
                    placeholder="Empresa S.L." />
                </div>
                <div>
                  <label style={lbl}>CIF</label>
                  <input style={inp} value={fEmpresa.cif}
                    onChange={e => setFEmpresa({ ...fEmpresa, cif: e.target.value })}
                    placeholder="B-12345678" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={cargando} style={{
              padding: '15px', background: '#1b5e20', color: '#fff', border: 'none',
              borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', opacity: cargando ? 0.7 : 1
            }}>
              {cargando ? 'Creando…' : '✓ Crear empresa'}
            </button>
          </form>
        )}

        {/* ===== LISTA USUARIOS ===== */}
        {tab === 'usuarios' && (
          <>
            {/* Filtro activos/bajas */}
            <div style={{ display: 'flex', background: '#fff', borderRadius: '12px', padding: '4px', marginBottom: '14px', border: '1.5px solid #eee' }}>
              {[{ id: 'activos', label: '🟢 Activos' }, { id: 'bajas', label: '🔴 Bajas' }].map(f => (
                <button key={f.id} onClick={() => setFiltroTrabajadores(f.id)} style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer',
                  background: filtroTrabajadores === f.id ? '#1a1a2e' : 'transparent',
                  color: filtroTrabajadores === f.id ? '#fff' : '#888',
                  fontSize: '13px', fontWeight: '500', fontFamily: 'inherit'
                }}>{f.label}</button>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
              {trabajadoresFiltrados.length} trabajador{trabajadoresFiltrados.length !== 1 ? 'es' : ''}
            </div>

            {trabajadoresFiltrados.map(t => (
              <div key={t.id} style={{
                background: '#fff', border: `1.5px solid ${t.activo === false ? '#eee' : '#e8f5e9'}`,
                borderRadius: '14px', padding: '16px', marginBottom: '10px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)', opacity: t.activo === false ? 0.7 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {/* Avatar + nombre */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                        background: t.activo === false ? '#eee' : '#1b5e20',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '15px', fontWeight: '600'
                      }}>
                        {t.nombre?.[0]}{t.apellidos?.[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600' }}>{t.nombre} {t.apellidos}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>{t.empresas?.nombre || '—'}</div>
                      </div>
                    </div>
                    {/* Info */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: '500',
                        background: t.rol === 'trabajador' ? '#e8f5e9' : t.rol === 'empresa' ? '#e3f2fd' : '#f3e5f5',
                        color: t.rol === 'trabajador' ? '#2e7d32' : t.rol === 'empresa' ? '#1565c0' : '#6a1b9a',
                      }}>{t.rol}</span>
                      {t.departamento && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#f5f5f5', color: '#666' }}>🏢 {t.departamento}</span>}
                      {t.horas_semanales && <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: '#f5f5f5', color: '#666' }}>⏰ {t.horas_semanales}h/sem</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#bbb' }}>
                      Alta: {t.fecha_alta || '—'}
                      {t.fecha_baja && ` · Baja: ${t.fecha_baja}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '10px' }}>
                    {t.activo !== false && t.id !== perfil.id ? (
                      <button onClick={() => darDeBajaTrabajador(t.id, t.nombre)} style={{
                        padding: '7px 12px', background: '#ffebee', border: '1px solid #ef9a9a',
                        borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: '#c62828', fontFamily: 'inherit', whiteSpace: 'nowrap'
                      }}>Dar de baja</button>
                    ) : t.activo === false ? (
                      <button onClick={() => reactivarTrabajador(t.id)} style={{
                        padding: '7px 12px', background: '#e8f5e9', border: '1px solid #a5d6a7',
                        borderRadius: '8px', fontSize: '12px', cursor: 'pointer', color: '#2e7d32', fontFamily: 'inherit'
                      }}>Reactivar</button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {trabajadoresFiltrados.length === 0 && (
              <p style={{ color: '#bbb', textAlign: 'center', padding: '30px', fontSize: '13px' }}>
                {filtroTrabajadores === 'activos' ? 'No hay trabajadores activos' : 'No hay trabajadores dados de baja'}
              </p>
            )}
          </>
        )}

        {/* ===== NUEVO USUARIO ===== */}
        {tab === 'nuevo-usuario' && (
          <form onSubmit={crearTrabajador} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1.5px solid #eee' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>👤 Nuevo usuario</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={lbl}>Nombre *</label>
                    <input style={inp} required value={fTrabajador.nombre}
                      onChange={e => setFTrabajador({ ...fTrabajador, nombre: e.target.value })} placeholder="María" />
                  </div>
                  <div>
                    <label style={lbl}>Apellidos *</label>
                    <input style={inp} required value={fTrabajador.apellidos}
                      onChange={e => setFTrabajador({ ...fTrabajador, apellidos: e.target.value })} placeholder="García López" />
                  </div>
                </div>
                <div>
                  <label style={lbl}>Email *</label>
                  <input style={inp} type="email" required value={fTrabajador.email}
                    onChange={e => setFTrabajador({ ...fTrabajador, email: e.target.value })} placeholder="trabajador@empresa.com" />
                </div>
                <div>
                  <label style={lbl}>Contraseña *</label>
                  <input style={inp} type="password" required value={fTrabajador.password}
                    onChange={e => setFTrabajador({ ...fTrabajador, password: e.target.value })} placeholder="Mínimo 6 caracteres" minLength={6} />
                </div>
                <div>
                  <label style={lbl}>Rol *</label>
                  <select style={inp} value={fTrabajador.rol} onChange={e => setFTrabajador({ ...fTrabajador, rol: e.target.value })}>
                    <option value="trabajador">👷 Trabajador</option>
                    <option value="empresa">🏢 Empresa / RRHH</option>
                    <option value="asesoria">⚖️ Asesoría</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Empresa *</label>
                  <select style={inp} required value={fTrabajador.empresa_id} onChange={e => setFTrabajador({ ...fTrabajador, empresa_id: e.target.value })}>
                    <option value="">— Selecciona empresa —</option>
                    {empresasActivas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Departamento</label>
                  <input style={inp} value={fTrabajador.departamento}
                    onChange={e => setFTrabajador({ ...fTrabajador, departamento: e.target.value })} placeholder="Administración, Producción…" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={lbl}>Horas/semana</label>
                    <input style={inp} type="number" value={fTrabajador.horas_semanales}
                      onChange={e => setFTrabajador({ ...fTrabajador, horas_semanales: e.target.value })} min={1} max={40} />
                  </div>
                  <div>
                    <label style={lbl}>Centro de trabajo</label>
                    <input style={inp} value={fTrabajador.centro_trabajo}
                      onChange={e => setFTrabajador({ ...fTrabajador, centro_trabajo: e.target.value })} placeholder="Sede principal" />
                  </div>
                  <div>
                    <label style={lbl}>Fecha de alta</label>
                    <input style={inp} type="date" value={fTrabajador.fecha_alta}
                      onChange={e => setFTrabajador({ ...fTrabajador, fecha_alta: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
            <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '10px', padding: '12px 14px' }}>
              <p style={{ fontSize: '12px', color: '#f57f17' }}>⚠️ El trabajador recibirá un email para confirmar su cuenta antes de poder acceder.</p>
            </div>
            <button type="submit" disabled={cargando} style={{
              padding: '15px', background: '#1b5e20', color: '#fff', border: 'none',
              borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', opacity: cargando ? 0.7 : 1
            }}>
              {cargando ? 'Creando usuario…' : '✓ Crear usuario'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
