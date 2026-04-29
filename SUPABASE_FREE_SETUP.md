# Supabase Free

Esta base esta preparada para arrancar con el plan gratuito de Supabase sin
sumar complejidad innecesaria.

## Enfoque

- una tabla principal de `properties`
- una tabla de `leads`
- una tabla de `admin_users`
- sin Realtime
- sin Edge Functions
- sin login publico
- admin chico, pensado para 1 o 2 personas
- `Supabase Storage` para imagenes

## Pasos

1. Crear un proyecto en Supabase.
2. Abrir `SQL Editor`.
3. Pegar el contenido de [supabase/schema.sql](./supabase/schema.sql).
4. Copiar `Project URL` y `anon key`.
5. Crear `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
ADMIN_AUTH_SECRET=tu_secret_para_sesiones
ADMIN_ALLOWED_EMAILS=tuemail@dominio.com
```

6. Reiniciar `npm run dev`.

7. Correr las migraciones complementarias:

- [supabase/property-final-schema.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/property-final-schema.sql)
- [supabase/leads.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/leads.sql)
- [supabase/lead-calendar.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/lead-calendar.sql)
- [supabase/admin-users.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/admin-users.sql)
- [supabase/audit-fields.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/audit-fields.sql)

## Estrategia para no pasar limites rapido

- Guardar solo datos de propiedades en Postgres.
- Mantener las fotos en `Storage`, no dentro de Postgres.
- No activar features que no necesitamos todavia.
- Usar un solo proyecto por cliente.

## Que queda listo hoy

- esquema SQL inicial con datos de ejemplo
- home y admin leyendo desde una capa unica de datos
- login admin con roles
- mini CRM de leads
- auditoria minima de edicion
