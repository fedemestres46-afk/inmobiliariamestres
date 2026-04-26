# Mestres Inmobiliaria

Sitio publico + panel admin hechos con `Next.js` y `Supabase`.

## Que incluye

- Home publica con listado y filtros
- Vista mapa para propiedades con coordenadas
- Panel admin en `/admin`
- Alta y edicion de propiedades
- Subida y borrado de imagenes en `Supabase Storage`
- Persistencia real en `Supabase Postgres`

## Variables de entorno

Usa estas variables tanto en local como en Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir:

- `http://localhost:3000`
- `http://localhost:3000/admin`

## Deploy

La guia recomendada para subir este proyecto a Vercel esta en:

[VERCEL_DEPLOY.md](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/VERCEL_DEPLOY.md)
