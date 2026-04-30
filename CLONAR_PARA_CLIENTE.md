# Clonar Este Sistema Para Un Cliente Nuevo

Esta guia sirve para duplicar el proyecto actual sin tocar la version base.

## Objetivo

Mantener este repo como `modelo maestro` y crear una copia independiente para cada inmobiliaria.

Cada cliente nuevo deberia tener:

- su propio repo de `GitHub`
- su propio proyecto de `Supabase`
- su propio proyecto de `Vercel`
- su propio dominio
- sus propios usuarios admin

## Lo que NO conviene hacer

- no reutilizar la misma base de datos para varios clientes
- no reutilizar el mismo proyecto de Vercel para varios clientes
- no trabajar el cliente nuevo directamente sobre este repo base
- no mezclar propiedades, leads o imagenes entre inmobiliarias

## Estructura recomendada

- `Proyecto base` = este repo maestro
- `Proyecto cliente A` = copia personalizada del repo base
- `Proyecto cliente B` = otra copia personalizada

## Paso 1. Duplicar el codigo

Opciones recomendadas:

1. Crear un repo nuevo en GitHub y subir una copia de esta carpeta.
2. Clonar este repo localmente y luego cambiarle el remote.

Comandos tipicos:

```powershell
git clone https://github.com/fedemestres46-afk/inmobiliariamestres.git inmobiliaria-cliente-a
cd inmobiliaria-cliente-a
git remote remove origin
git remote add origin https://github.com/TU-USUARIO/nuevo-repo-del-cliente.git
git push -u origin main
```

## Paso 2. Crear un Supabase nuevo

En Supabase:

1. Crear un proyecto nuevo.
2. Esperar a que termine el aprovisionamiento.
3. Copiar:
   - `Project URL`
   - `Publishable key`
   - `Secret key`
4. Crear el bucket de imagenes si hace falta o dejar que lo cree el flujo actual.

## Paso 3. Correr las migraciones SQL

En el proyecto nuevo de Supabase correr:

- [supabase/schema.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/schema.sql)
- [supabase/property-final-schema.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/property-final-schema.sql)
- [supabase/leads.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/leads.sql)
- [supabase/lead-calendar.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/lead-calendar.sql)
- [supabase/admin-users.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/admin-users.sql)
- [supabase/audit-fields.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/audit-fields.sql)
- [supabase/admin-activity-log.sql](C:/Users/FEDE/Documents/Codex/2026-04-25/puedo-hacer-algo-asi-https-www/supabase/admin-activity-log.sql)

## Paso 4. Crear usuario admin inicial

1. Ir a `Supabase -> Authentication -> Users`
2. Crear el primer usuario con `email + password`
3. Darle rol `owner` en `admin_users`

SQL ejemplo:

```sql
insert into public.admin_users (email, role, is_active)
values ('maildelcliente@ejemplo.com', 'owner', true)
on conflict (email)
do update set
  role = excluded.role,
  is_active = excluded.is_active;
```

## Paso 5. Crear un Vercel nuevo

1. Crear proyecto nuevo en Vercel.
2. Importar el repo nuevo del cliente.
3. Cargar variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_AUTH_SECRET=
ADMIN_ALLOWED_EMAILS=
```

## Paso 6. Deploy inicial

1. Hacer deploy.
2. Probar:
   - `/`
   - `/propiedades`
   - `/admin/login`
3. Entrar con el usuario admin creado en Supabase.

## Paso 7. Personalizacion del cliente

Cambios tipicos a hacer apenas se duplica:

- nombre de la inmobiliaria
- logo
- colores
- telefono y WhatsApp
- textos institucionales
- servicios
- dominio
- propiedades demo o reales

## Paso 8. Checklist minima antes de mostrar la demo

- login admin funcionando
- propiedades visibles en home
- ficha individual funcionando
- subida de imagenes funcionando
- leads entrando al CRM
- exportacion de leads funcionando
- mapa funcionando
- datos de contacto correctos
- branding del cliente aplicado

## Que queda en el repo base

Este repo se mantiene como:

- plantilla
- modelo maestro
- entorno de mejoras futuras

Las mejoras que se hagan aca despues se pueden portar a cada cliente segun convenga.

## Recomendacion operativa

Para cada cliente nuevo:

- una copia del codigo
- un Supabase nuevo
- un Vercel nuevo
- un dominio nuevo

Eso es mas simple, mas seguro y mas vendible que mezclar varios clientes en el mismo sistema.
