// ============================================================
// Geolocalización — obtiene coordenadas GPS del dispositivo
// ============================================================
export function obtenerGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu dispositivo no tiene GPS'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitud: pos.coords.latitude,
        longitud: pos.coords.longitude,
        precision_gps: Math.round(pos.coords.accuracy),
      }),
      (err) => reject(new Error('No se pudo obtener la ubicación: ' + err.message)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

// ============================================================
// Hash SHA-256 — garantiza inmutabilidad del registro
// Genera una huella digital única de cada fichaje
// ============================================================
export async function generarHash(datos) {
  const texto = JSON.stringify(datos)
  const buffer = new TextEncoder().encode(texto)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ============================================================
// Formateo de fechas en español
// ============================================================
export function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

export function formatearHora(fecha) {
  return new Date(fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit'
  })
}

export function minutosAHoras(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}
