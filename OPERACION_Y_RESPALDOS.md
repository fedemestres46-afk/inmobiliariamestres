# Operacion Y Respaldos

Esta guia deja claro que hay que guardar, donde vive cada cosa y como volver a levantar el sistema en otra computadora o para otro cliente.

## Donde vive cada parte

- `Codigo`: repo local + GitHub
- `Deploy`: Vercel
- `Base de datos`: Supabase Postgres
- `Imagenes`: Supabase Storage
- `Login admin`: Supabase Auth + tabla `admin_users`
- `Dominio`: proveedor de dominio que uses

## Minimo que hay que respaldar

1. Acceso al repo de `GitHub`
2. Acceso al proyecto de `Vercel`
3. Acceso al proyecto de `Supabase`
4. Acceso al dominio
5. Variables de entorno
6. SQL de estructura en la carpeta `supabase/`

## Variables de entorno a guardar

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_AUTH_SECRET=
ADMIN_ALLOWED_EMAILS=
```

## Checklist de respaldo operativo

- Confirmar que el repo en GitHub este actualizado
- Confirmar que Vercel este conectado al repo correcto
- Confirmar que Supabase tenga las tablas:
  - `properties`
  - `leads`
  - `admin_users`
- Confirmar que exista el bucket `property-images`
- Confirmar que al menos un usuario admin tenga rol `owner`
- Confirmar que el dominio apunte al proyecto correcto

## Como levantar todo en otra computadora

1. Clonar el repo desde GitHub
2. Crear `.env.local` con las variables
3. Instalar dependencias con `npm install`
4. Levantar con `npm run dev`
5. Verificar:
   - `/`
   - `/admin/login`
   - alta/edicion de propiedad
   - subida de imagen
   - guardado de lead

## Como recrear el proyecto desde cero

1. Crear proyecto nuevo en Supabase
2. Ejecutar:
   - `supabase/schema.sql`
   - `supabase/property-final-schema.sql`
   - `supabase/leads.sql`
   - `supabase/lead-calendar.sql`
   - `supabase/admin-users.sql`
   - `supabase/audit-fields.sql`
3. Crear bucket `property-images` o dejar que la app lo cree al primer upload
4. Crear usuario admin en Supabase Auth
5. Insertar su rol en `admin_users`
6. Crear proyecto nuevo en Vercel
7. Cargar variables de entorno
8. Deployar

## Como duplicarlo para otro cliente

Lo recomendado hoy es una instalacion separada por cliente:

- otro proyecto en `Supabase`
- otro proyecto en `Vercel`
- otro dominio
- otra carga de propiedades y usuarios

Ventajas:

- a un cliente no le afecta el otro
- es mas simple de operar
- es mas facil de vender al principio

## Que revisar antes de una demo o entrega

- Home publica sin errores
- `/propiedades` funcionando
- `/propiedades/[slug]` funcionando
- `/admin/login` funcionando
- un `owner` puede editar
- un `viewer` no puede editar
- mapa con propiedades visibles
- imagenes cargando
- leads entrando y quedando asociados

## Recomendacion de seguridad

- Rotar cualquier `secret key` que se haya compartido en chats o capturas
- Usar `ADMIN_AUTH_SECRET` propio
- No reutilizar la misma cuenta Supabase entre clientes
- Mantener una cuenta `owner` y evitar usarla para trabajo diario
