# Migración: Frontend a Vercel + Backend EasyPanel

> **Fecha:** 2026-06-26 (continuación mañana)
> **Objetivo:** Mover el frontend Next.js a Vercel y dejar el backend FastAPI en EasyPanel (solo API).

---

## ¿Por qué este cambio?

### Problemas con EasyPanel para el frontend

1. **Puertos en conflicto:** El servidor Hetzner tiene n8n y otros servicios usando puertos 3000, 3001, 5678. EasyPanel intenta bind puertos host que ya están ocupados → errores `Bind for 0.0.0.0:XXXX failed: port is already allocated`.

2. **Proxy frágil:** EasyPanel requiere configurar manualmente el puerto del service (Settings → Port = 3000/8000) en la UI cada vez que se redeploya. Si se olvida o se resetea → 502 Bad Gateway.

3. **Sin deploy automático:** Cada push a GitHub requiere ir a EasyPanel UI y dar click en "Redeploy". No hay webhook automático configurado.

4. **Frontend no necesita servidor:** Next.js con `output: "standalone"` estático no necesita un VPS. Vercel es la plataforma nativa para Next.js (creada por los mismos de Next.js).

### Beneficios de Vercel

- **Deploy automático:** Cada push a `main` despliega automáticamente
- **Preview deployments:** Cada PR genera una URL de preview
- **CDN global:** Edge network, carga rápida desde cualquier país
- **Sin gestión de puertos/proxy:** Vercel maneja todo internamente
- **Gratuito** para proyectos personales (Hobby plan)
- **Variables de entorno** fáciles de configurar en la UI
- **Logs y analytics** integrados

---

## Arquitectura actual vs propuesta

### Actual (todo en EasyPanel)
```
┌─────────────────────────────────────────────┐
│              EasyPanel (Hetzner)             │
│                                             │
│  ┌─────────────┐      ┌─────────────┐      │
│  │  frontend   │      │   backend   │      │
│  │  Next.js    │─────►│   FastAPI   │      │
│  │  :3000      │      │   :8000     │      │
│  └─────────────┘      └─────────────┘      │
│                                             │
│  + n8n :5678                               │
│  + otros servicios                         │
└─────────────────────────────────────────────┘
```

### Propuesta (Vercel + EasyPanel)
```
┌──────────────────┐         ┌──────────────────┐
│     Vercel       │  HTTPS  │   EasyPanel      │
│   (Frontend)     │ ──────► │   (Backend API)  │
│   Next.js CDN    │  /api/* │   FastAPI :8000  │
│   Sin puertos    │         │   Sin frontend   │
└──────────────────┘         └──────────────────┘
```

---

## TODO - Migración

### Fase 1: Preparar código (hoy)

- [x] Frontend funciona con `output: "standalone"` 
- [x] Backend funciona con FastAPI en puerto 8000
- [x] Proxy `/api/*` configurado en `next.config.js`
- [x] Estilos y componentes actualizados (AudioRecorder, historial)

### Fase 2: Configurar Vercel (mañana)

| # | Acción | Quién | Notas |
|---|--------|-------|-------|
| 1 | Crear cuenta en Vercel | TÚ | Vercel.com → Sign up con GitHub |
| 2 | Importar proyecto | TÚ | New Project → Import GitHub repo → `linkedin-content-factory` |
| 3 | Configurar build | TÚ | Framework: Next.js / Root Directory: `frontend` / Build: `npm run build` |
| 4 | Variable de entorno | TÚ | `NEXT_PUBLIC_API_URL` = URL del backend en EasyPanel |
| 5 | Deploy | TÚ | Click "Deploy" → espera ~1 min |

### Fase 3: Limpiar backend (yo)

| # | Acción | Quién | Notas |
|---|--------|-------|-------|
| 6 | Quitar service `frontend` de `docker-compose.yml` | YO | Dejar solo `backend` |
| 7 | Limpiar Dockerfile backend | YO | Quitar `COPY --from=frontend` y mount estático |
| 8 | Backend CORS | YO | Agregar dominio Vercel a `allow_origins` |
| 9 | Eliminar `frontend/Dockerfile` | YO | Ya no se usa en producción |
| 10 | Eliminar `frontend/.dockerignore` | YO | Ya no se usa |
| 11 | Verificar build local | YO | `cd frontend && npm run build` |

### Fase 4: Deploy y test (mañana)

| # | Acción | Quién | Notas |
|---|--------|-------|-------|
| 12 | Push cambios | YO | Commit + push |
| 13 | Redeploy backend en EasyPanel | TÚ | Solo el backend |
| 14 | Verificar Vercel URL | TÚ | Abrir dominio de Vercel |
| 15 | Test subir audio | TÚ | Subir mp3 → ver pipeline |
| 16 | Test grabar audio | TÚ | Grabar desde micrófono → ver pipeline |
| 17 | Test historial | TÚ | Ver sesiones anteriores |

---

## Variables de entorno requeridas

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=https://linkedin-content-linkedi-factory-1.c5q0ul.easypanel.host
```

> Nota: Si el backend tiene dominio propio, usar ese en vez del subdominio EasyPanel.

### EasyPanel (Backend)
```
GROQ_API_KEY=tu_api_key
GROQ_MODEL=llama-3.3-70b-versatile
WHISPER_MODEL=base
DATABASE_URL=sqlite:///./content_factory.db
```

---

## Archivos que cambian

| Archivo | Cambio |
|---------|--------|
| `docker-compose.yml` | Eliminar service `frontend`, dejar solo `backend` |
| `backend/Dockerfile` | Quitar `COPY --from=frontend` y static mount |
| `backend/main.py` | CORS: agregar dominio Vercel a `allow_origins` |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` apunta a backend |
| `frontend/Dockerfile` | **Eliminar** (ya no se usa) |
| `frontend/.dockerignore` | **Eliminar** |

---

## URLs de referencia

| Servicio | URL |
|----------|-----|
| Vercel (frontend) | `https://tu-proyecto.vercel.app` (asignada por Vercel) |
| EasyPanel (backend) | `https://linkedin-content-linkedi-factory-1.c5q0ul.easypanel.host` |
| GitHub repo | `github.com/Davidjosuec123/linkedin-content-factory` |
| EasyPanel dashboard | URL del servidor Hetzner |

---

## Comandos útiles

```bash
# Build frontend local
cd frontend && npm run build

# Verificar que backend funciona
curl https://linkedin-content-linkedi-factory-1.c5q0ul.easypanel.host/api/sessions

# Push cambios
git add -A && git commit -m "feat: migrar frontend a Vercel" && git push origin main
```

---

## Notas importantes

1. **SQLite en EasyPanel:** La base de datos está en un volume Docker (`sqlite_data`). Si EasyPanel recrea el container sin el volume, se pierden las sesiones. Considerar migrar a PostgreSQL gestionado en el futuro.

2. **CORS:** El backend debe permitir el dominio de Vercel explícitamente. No usar `allow_origins=["*"]` en producción.

3. **Preview deployments:** Vercel crea una URL de preview para cada PR. Estas URLs necesitan también tener acceso al backend (CORS debe incluirlas o usar `*` temporalmente).

4. **Dominio personalizado:** Si en el futuro quieres `app.tudominio.com`, lo configuras en Vercel (Settings → Domains) y apuntas el DNS.

---

## Prompt para mañana

> "Migramos el frontend de EasyPanel a Vercel. El backend se queda en EasyPanel. Necesito:
> 1. Configurar Vercel con el repo de GitHub
> 2. Limpiar docker-compose.yml (quitar frontend)
> 3. Limpiar Dockerfile backend
> 4. CORS en backend para Vercel
> 5. Variable de entorno `NEXT_PUBLIC_API_URL` en Vercel
> 6. Test completo: subir audio, grabar audio, historial
>
> Lee `MIGRATION-VERCEL.md` para el contexto completo."
