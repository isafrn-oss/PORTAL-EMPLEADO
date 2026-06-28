# Guía de despliegue — Portal del Empleado PWA

## ¿Qué vas a montar?

| Pieza | Servicio | Coste |
|-------|----------|-------|
| Base de datos + autenticación | **Supabase** | Gratis (hasta 50.000 usuarios) |
| Publicación web / app | **Vercel** | Gratis |
| Instalación en móvil | **PWA** (sin App Store) | Gratis |

---

## PASO 1 — Instalar las herramientas en tu ordenador

Solo necesitas hacer esto una vez.

### 1.1 Instalar Node.js
1. Ve a **https://nodejs.org**
2. Descarga la versión **LTS** (la recomendada, botón verde)
3. Instala como cualquier programa
4. Para verificar: abre la terminal y escribe `node --version` → debe salir algo como `v20.x.x`

### 1.2 Instalar Git
1. Ve a **https://git-scm.com**
2. Descarga e instala
3. Verifica: `git --version`

### 1.3 Abrir la terminal
- **Windows**: pulsa `Win + R`, escribe `cmd`, pulsa Enter
- **Mac**: pulsa `Cmd + Espacio`, escribe `Terminal`, pulsa Enter

---

## PASO 2 — Crear la base de datos en Supabase (10 minutos)

### 2.1 Crear cuenta
1. Ve a **https://supabase.com**
2. Haz clic en "Start your project" → regístrate con Google o email
3. Crea un nuevo proyecto:
   - **Name**: `portal-empleado`
   - **Database Password**: anótala (la necesitarás)
   - **Region**: `West EU (Ireland)` — el más cercano a España
4. Espera 2-3 minutos mientras crea la base de datos

### 2.2 Crear las tablas
1. En el menú izquierdo haz clic en **SQL Editor**
2. Haz clic en **New query**
3. Copia todo el contenido del archivo `supabase/schema.sql` y pégalo
4. Haz clic en **RUN** (o pulsa `Ctrl+Enter`)
5. Debe salir "Success. No rows returned"

### 2.3 Copiar tus claves
1. Ve a **Settings** (rueda dentada en el menú izquierdo)
2. Haz clic en **API**
3. Copia:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** (bajo "Project API keys")

---

## PASO 3 — Configurar el código

En la terminal, navega hasta la carpeta del proyecto:

```bash
cd portal-empleado
```

Copia el archivo de variables de entorno:

```bash
# En Windows:
copy .env.example .env

# En Mac/Linux:
cp .env.example .env
```

Abre el archivo `.env` con cualquier editor de texto (Bloc de notas sirve) y rellena:

```
VITE_SUPABASE_URL=https://TU-URL-REAL.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...tu-clave-real
```

Instala las dependencias:

```bash
npm install
```

Prueba en local:

```bash
npm run dev
```

Abre el navegador en **http://localhost:5173** — deberías ver la pantalla de login.

---

## PASO 4 — Crear usuarios en Supabase

Cada trabajador necesita un usuario. Hazlo desde Supabase:

1. Ve a **Authentication** en el menú izquierdo
2. Haz clic en **Add user → Create new user**
3. Rellena email y contraseña del trabajador
4. Copia el **User ID** (UUID) que aparece

Después, en **SQL Editor**, inserta el perfil del trabajador:

```sql
insert into public.perfiles (id, nombre, apellidos, empresa_id, rol, departamento, horas_semanales, centro_trabajo)
values (
  'UUID-DEL-USUARIO-QUE-COPIASTE',
  'María',
  'García López',
  'UUID-DE-TU-EMPRESA',  -- lo creamos a continuación
  'trabajador',
  'Administración',
  40,
  'Sede principal, Guadalajara'
);
```

Para crear la empresa primero:

```sql
insert into public.empresas (nombre, cif)
values ('Empresa Demo S.L.', 'B-12345678')
returning id;
-- Copia el id que devuelve y úsalo en los perfiles
```

Para un usuario de empresa (RRHH):

```sql
insert into public.perfiles (id, nombre, apellidos, empresa_id, rol)
values ('UUID-RRHH', 'Recursos', 'Humanos', 'UUID-EMPRESA', 'empresa');
```

Para la asesoría:

```sql
insert into public.perfiles (id, nombre, apellidos, empresa_id, rol)
values ('UUID-ASESORIA', 'Gestoría', 'Central', 'UUID-EMPRESA', 'asesoria');
```

---

## PASO 5 — Publicar en Vercel (5 minutos)

### 5.1 Subir el código a GitHub
1. Ve a **https://github.com** y crea una cuenta si no tienes
2. Haz clic en **New repository** → llámalo `portal-empleado` → Create
3. En la terminal:

```bash
git init
git add .
git commit -m "Portal empleado inicial"
git remote add origin https://github.com/TU-USUARIO/portal-empleado.git
git push -u origin main
```

### 5.2 Conectar con Vercel
1. Ve a **https://vercel.com** y regístrate con tu cuenta de GitHub
2. Haz clic en **Add New Project**
3. Selecciona el repositorio `portal-empleado`
4. En **Environment Variables**, añade:
   - `VITE_SUPABASE_URL` → tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` → tu clave anon
5. Haz clic en **Deploy**

En 2 minutos tendrás una URL tipo `https://portal-empleado-xyz.vercel.app` 🎉

---

## PASO 6 — Instalar la app en el móvil (sin App Store)

### En Android (Chrome)
1. Abre Chrome y entra a tu URL de Vercel
2. Espera a que cargue la app
3. Chrome mostrará automáticamente un banner: **"Añadir a pantalla de inicio"**
4. Si no aparece: toca los tres puntos (⋮) → "Añadir a pantalla de inicio"
5. ¡Listo! Aparece el icono en el escritorio como una app normal

### En iPhone (Safari)
1. Abre **Safari** (no Chrome) y entra a tu URL
2. Toca el botón de compartir (□↑) en la barra inferior
3. Desliza hacia abajo → **"Añadir a pantalla de inicio"**
4. Ponle nombre → **"Añadir"**

> ⚠️ En iPhone, la PWA DEBE abrirse desde Safari. Chrome en iOS no permite instalar PWAs.

---

## PASO 7 — Actualizar la app en el futuro

Cuando hagas cambios en el código:

```bash
git add .
git commit -m "Descripción del cambio"
git push
```

Vercel detecta el push automáticamente y publica la nueva versión en minutos. Los trabajadores verán la actualización la próxima vez que abran la app.

---

## Preguntas frecuentes

**¿Puedo tener varios trabajadores?**
Sí, sin límite en el plan gratuito de Supabase (hasta 50.000 usuarios).

**¿Los datos están seguros?**
Supabase usa PostgreSQL con cifrado en reposo y en tránsito (HTTPS). Cumple RGPD con servidores en la UE.

**¿Qué pasa si el trabajador no tiene internet al fichar?**
La PWA guarda el intento en caché y lo sincroniza cuando recupera conexión (requiere configurar Workbox offline, disponible bajo petición).

**¿Puedo cambiar el logo/colores?**
Sí, edita `src/index.css` y el `manifest` en `vite.config.js`.

**¿Cuándo tengo que pagar?**
Supabase: si superas 50.000 usuarios activos/mes o 500 MB de base de datos.
Vercel: si superas 100 GB de transferencia/mes. Para una asesoría pequeña, nunca llegarás a esos límites.
