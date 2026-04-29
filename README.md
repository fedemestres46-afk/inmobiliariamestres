# Mestres Inmobiliaria

Sitio publico + panel admin + mini CRM hechos con `Next.js` y `Supabase`.

## Que incluye hoy

- Home publica con filtros, orden y vista mapa
- Catalogo completo en `/propiedades`
- Ficha individual por propiedad en `/propiedades/[slug]`
- Panel admin protegido en `/admin`
- Login con roles `owner`, `admin`, `editor`, `viewer`
- Alta, edicion y borrado de propiedades
- Subida y borrado de imagenes en `Supabase Storage`
- Leads asociados a propiedades
- Auditoria minima de ultima edicion en propiedades y leads

## Variables de entorno

Usa estas variables tanto en local como en Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_AUTH_SECRET=
ADMIN_ALLOWED_EMAILS=
```

Notas:

- `ADMIN_AUTH_SECRET` es recomendable para firmar sesiones del admin sin depender de la key de servicio.
- `ADMIN_ALLOWED_EMAILS` sigue sirviendo como fallback rapido si todavia no usas la tabla `admin_users`.

## SQL / migraciones importantes

En un proyecto nuevo de Supabase conviene correr:

- [supabase/schema.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/schema.sql)
- [supabase/property-final-schema.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/property-final-schema.sql)
- [supabase/leads.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/leads.sql)
- [supabase/lead-calendar.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/lead-calendar.sql)
- [supabase/admin-users.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/admin-users.sql)
- [supabase/audit-fields.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/audit-fields.sql)

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir:

- `http://localhost:3000`
- `http://localhost:3000/admin`

## Deploy

- Guia de deploy: [VERCEL_DEPLOY.md](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/VERCEL_DEPLOY.md)
- Operacion y respaldos: [OPERACION_Y_RESPALDOS.md](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/OPERACION_Y_RESPALDOS.md)
