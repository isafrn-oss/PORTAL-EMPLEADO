import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { obtenerGPS, generarHash, formatearHora, minutosAHoras } from '../lib/utils'

const TIPOS = {
  entrada:   { label: 'Fichar entrada',  color: '#1b5e20', icon: '▶' },
  pausa:     { label: 'Inicio de pausa', color: '#0d47a1', icon: '⏸' },
  fin_pausa: { label: 'Fin de pausa',    color: '#e65100', icon: '▶' },
  salida:    { label: 'Fichar salida',   color: '#b71c1c', icon: '⏹' },
}

export default function Fichaje({ perfil }) {
  const [hora, setHora] = useState('')
  const [registrosHoy, setRegistrosHoy] = useState([])
  const [estado, setEstado] = useState('libre') // libre | trabajando | pausa
  const [geoInfo, setGeoInfo] = useState('Cargando ubicación…')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [modalidad, setModalidad] = useState('presencial')

  // Reloj en tiempo real
  useEffect(() => {
    const tick = () => setHora(new Date().toLocaleTimeString('es-ES'))
    tick(); const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Cargar fichajes de hoy al montar
  useEffect(() => {
    cargarFichajesHoy()
    // Intentar GPS en segundo plano
    obtenerGPS()
      .then(g => setGeoInfo(`📍 ${g.latitud.toFixed(5)}, ${g.longitud.toFixed(5)} (±${g.precision_gps}m)`))
      .catch(() => setGeoInfo('📍 Ubicación manual (GPS no disponible)'))
  }, [])

  async function cargarFichajesHoy() {
    const hoy = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('fichajes')
      .select('*')
      .eq('trabajador_id', perfil.id)
      .gte('timestamp_utc', hoy + 'T00:00:00')
      .order('timestamp_utc', { ascending: true })

    if (data?.length) {
      setRegistrosHoy(data)
      // Determinar estado actual
      const ultimo = data[data.length - 1]
      if (ultimo.tipo === 'entrada' || ultimo.tipo === 'fin_pausa') setEstado('trabajando')
      else if (ultimo.tipo === 'pausa') setEstado('pausa')
      else if (ultimo.tipo === 'salida') setEstado('libre')
    }
  }

  async function fichar(tipo) {
    setCargando(true); setError('')
    try {
      const geo = await obtenerGPS().catch(() => ({ latitud: null, longitud: null, precision_gps: null }))
      const timestamp_utc = new Date().toISOString()
      const datos = { trabajador_id: perfil.id, tipo, timestamp_utc, ...geo, modalidad }
      const hash = await generarHash(datos)

      const { error: err } = await supabase.from('fichajes').insert({
        ...datos,
        empresa_id: perfil.empresa_id,
        hash,
      })
      if (err) throw err

      await cargarFichajesHoy()
      if (tipo === 'entrada' || tipo === 'fin_pausa') setEstado('trabajando')
      else if (tipo === 'pausa') setEstado('pausa')
      else if (tipo === 'salida') setEstado('libre')
    } catch (e) {
      setError('Error al fichar: ' + e.message)
    }
    setCargando(false)
  }

  const botonesVisibles = {
    entrada:   estado === 'libre',
    pausa:     estado === 'trabajando',
    fin_pausa: estado === 'pausa',
    salida:    estado === 'trabajando',
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Aviso legal */}
      <div style={{ background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: '8px', padding: '10px 14px' }}>
        <p style={{ fontSize: '12px', color: '#e65100', lineHeight: '1.5' }}>
          ⚖️ Registro obligatorio · RDL 8/2019, art. 34.9 ET. Cada fichaje queda sellado con marca temporal y GPS (inmutable).
        </p>
      </div>

      {/* Reloj */}
      <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '44px', fontWeight: '300', letterSpacing: '-2px' }}>{hora}</div>
        <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{ fontSize: '12px', color: '#1565c0', marginTop: '8px' }}>{geoInfo}</div>
      </div>

      {/* Modalidad */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['presencial', 'teletrabajo'].map(m => (
          <button key={m} onClick={() => setModalidad(m)} style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
            borderColor: modalidad === m ? '#1a1a2e' : '#ddd',
            background: modalidad === m ? '#1a1a2e' : '#fff',
            color: modalidad === m ? '#fff' : '#333',
            fontSize: '13px', cursor: 'pointer', textTransform: 'capitalize'
          }}>{m === 'presencial' ? '🏢 Presencial' : '🏠 Teletrabajo'}</button>
        ))}
      </div>

      {/* Botones de fichaje */}
      {error && <p style={{ color: '#c62828', fontSize: '13px', padding: '10px', background: '#ffebee', borderRadius: '8px' }}>{error}</p>}
      {Object.entries(TIPOS).filter(([t]) => botonesVisibles[t]).map(([tipo, cfg]) => (
        <button key={tipo} onClick={() => fichar(tipo)} disabled={cargando} style={{
          padding: '16px', background: cfg.color, color: '#fff', border: 'none',
          borderRadius: '12px', fontSize: '16px', fontWeight: '500',
          cursor: cargando ? 'not-allowed' : 'pointer', opacity: cargando ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
        }}>
          <span>{cfg.icon}</span> {cargando ? 'Registrando…' : cfg.label}
        </button>
      ))}

      {/* Registros de hoy */}
      {registrosHoy.length > 0 && (
        <div>
          <p style={{ fontSize: '12px', color: '#888', fontWeight: '500', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registros de hoy</p>
          {registrosHoy.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', background: '#fff', border: '1px solid #eee',
              borderRadius: '8px', marginBottom: '6px'
            }}>
              <span style={{ fontSize: '20px' }}>{TIPOS[r.tipo]?.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '500' }}>{TIPOS[r.tipo]?.label}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{formatearHora(r.timestamp_utc)}</div>
                {r.latitud && <div style={{ fontSize: '11px', color: '#1565c0' }}>📍 {Number(r.latitud).toFixed(5)}, {Number(r.longitud).toFixed(5)}</div>}
              </div>
              <span title="Registro inmutable" style={{ fontSize: '14px', color: '#bbb' }}>🔒</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
