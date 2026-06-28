import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { minutosAHoras, formatearHora } from '../lib/utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Informes({ perfil }) {
  const [jornadas, setJornadas] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [filtroTrabajador, setFiltroTrabajador] = useState('todos')
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
  const [cargando, setCargando] = useState(false)

  useEffect(() => { cargarTrabajadores() }, [])
  useEffect(() => { cargarJornadas() }, [filtroTrabajador, filtroMes])

  async function cargarTrabajadores() {
    const { data } = await supabase
      .from('perfiles')
      .select('id, nombre, apellidos')
      .eq('empresa_id', perfil.empresa_id)
      .eq('rol', 'trabajador')
    setTrabajadores(data || [])
  }

  async function cargarJornadas() {
    setCargando(true)
    const inicioMes = filtroMes + '-01'
    const finMes = new Date(filtroMes + '-01')
    finMes.setMonth(finMes.getMonth() + 1)
    const finMesStr = finMes.toISOString().split('T')[0]

    let query = supabase
      .from('jornadas_diarias')
      .select('*, perfiles(nombre, apellidos)')
      .eq('empresa_id', perfil.empresa_id)
      .gte('fecha', inicioMes)
      .lt('fecha', finMesStr)
      .order('fecha', { ascending: false })

    if (filtroTrabajador !== 'todos') query = query.eq('trabajador_id', filtroTrabajador)

    const { data } = await query
    setJornadas(data || [])
    setCargando(false)
  }

  function exportarPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const mesNombre = new Date(filtroMes + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

    // Cabecera
    doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('Relación de Jornada Laboral', 14, 20)
    doc.setFontSize(11); doc.setFont('helvetica', 'normal')
    doc.text(`Empresa: ${perfil.empresa_nombre || 'Empresa'}`, 14, 30)
    doc.text(`Período: ${mesNombre}`, 14, 37)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} — Conforme RDL 8/2019`, 14, 44)
    doc.text(`Total jornadas: ${jornadas.length} · Total horas: ${minutosAHoras(jornadas.reduce((s, j) => s + (j.minutos_trabajados || 0), 0))}`, 14, 51)

    // Tabla
    const filas = jornadas.map(j => [
      j.perfiles ? j.perfiles.nombre + ' ' + j.perfiles.apellidos : '—',
      new Date(j.fecha).toLocaleDateString('es-ES'),
      j.entrada ? formatearHora(j.entrada) : '—',
      j.salida ? formatearHora(j.salida) : '—',
      minutosAHoras(j.minutos_trabajados || 0),
      j.modalidad,
      j.completa ? '✓' : '⚠ Incompleta'
    ])

    autoTable(doc, {
      startY: 58,
      head: [['Trabajador', 'Fecha', 'Entrada', 'Salida', 'Total', 'Modalidad', 'Estado']],
      body: filas,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [26, 26, 46] },
    })

    doc.save(`jornada-${filtroMes}.pdf`)
  }

  const totalMinutos = jornadas.reduce((s, j) => s + (j.minutos_trabajados || 0), 0)

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ background: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
        <p style={{ fontSize: '12px', color: '#e65100' }}>⚖️ Conservación obligatoria 4 años · Registros con hash SHA-256 inmutable · Exportable para Inspección de Trabajo</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <select value={filtroTrabajador} onChange={e => setFiltroTrabajador(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}>
          <option value="todos">Todos los trabajadores</option>
          {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>)}
        </select>
        <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }} />
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        {[
          { num: jornadas.length, label: 'Jornadas' },
          { num: minutosAHoras(totalMinutos), label: 'Total horas' },
        ].map(s => (
          <div key={s.label} style={{ background: '#f5f5f5', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '500' }}>{s.num}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button onClick={exportarPDF} style={{
          padding: '8px 16px', background: '#1a1a2e', color: '#fff',
          border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
        }}>⬇ Exportar PDF</button>
      </div>

      {/* Lista */}
      {cargando ? <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Cargando…</p> : (
        jornadas.map(j => (
          <div key={j.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                {j.perfiles ? j.perfiles.nombre + ' ' + j.perfiles.apellidos : 'Trabajador'}
              </span>
              <span style={{ fontSize: '13px', color: '#1565c0', fontWeight: '500' }}>
                {minutosAHoras(j.minutos_trabajados || 0)}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              📅 {new Date(j.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888' }}>
              <span>▶ {j.entrada ? formatearHora(j.entrada) : '—'}</span>
              <span>⏹ {j.salida ? formatearHora(j.salida) : '—'}</span>
              <span>{j.modalidad}</span>
              {!j.completa && <span style={{ color: '#c62828' }}>⚠ Incompleta</span>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
