# Supabase Free

Esta base esta preparada para arrancar con el plan gratuito de Supabase sin
sumar complejidad innecesaria.

## Enfoque

- una sola tabla principal: `properties`
- sin Realtime
- sin Edge Functions
- sin login publico
- admin chico, pensado para 1 o 2 personas
- imagenes externas al principio para no gastar rapido el storage

## Pasos

1. Crear un proyecto en Supabase.
2. Abrir `SQL Editor`.
3. Pegar el contenido de [supabase/schema.sql](./supabase/schema.sql).
4. Copiar `Project URL` y `anon key`.
5. Crear `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

6. Reiniciar `npm run dev`.

## Estrategia para no pasar limites rapido

- Guardar solo datos de propiedades en Postgres.
- Mantener las fotos fuera de la base de datos.
- No activar features que no necesitamos todavia.
- Usar un solo proyecto por cliente.

## Que queda listo hoy

- fallback automatico a mock data si Supabase no esta configurado
- esquema SQL inicial con datos de ejemplo
- home y admin leyendo desde una capa unica de datos

## Siguiente paso recomendado

- conectar el alta y edicion de propiedades al panel admin
