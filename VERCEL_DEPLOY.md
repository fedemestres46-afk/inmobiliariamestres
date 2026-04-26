# Deploy En Vercel

Esta app se puede subir completa a `Vercel` y el admin tambien queda operativo.

## Que funciona en Vercel

- Home publica
- Panel admin en `/admin`
- Endpoints API de Next.js
- Guardado en Supabase
- Subida y borrado de imagenes en Supabase Storage

## Que necesitas antes

1. Un repo en `GitHub`
2. Una cuenta en `Vercel`
3. Tu proyecto de `Supabase` ya creado

## Variables que debes cargar en Vercel

En el proyecto de Vercel agrega estas 3 variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notas:

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publishable key
- `SUPABASE_SERVICE_ROLE_KEY`: clave privada del servidor

## Pasos

1. Sube este proyecto a `GitHub`
2. Entra a [Vercel](https://vercel.com/)
3. Toca `Add New...` -> `Project`
4. Importa el repo
5. Vercel detecta `Next.js` automaticamente
6. Agrega las 3 variables de entorno
7. Deploy

## Despues del deploy

URLs a probar:

- `/`
- `/admin`

Pruebas recomendadas:

1. Crear una propiedad
2. Editar un titulo
3. Subir una imagen
4. Borrar una imagen
5. Verificar que aparezca en la home

## Sobre Hobby

`Vercel Hobby` sirve bien para demo, pruebas y compartir el proyecto.

Importante:

- Vercel describe Hobby como plan para uso personal / no comercial
- si despues lo vas a usar para cliente real, lo correcto es pasar a `Pro`

## Si algo falla

- Si las imagenes no cargan: revisa `NEXT_PUBLIC_SUPABASE_URL`
- Si el admin lee pero no guarda: revisa `SUPABASE_SERVICE_ROLE_KEY`
- Si el deploy compila pero el admin no funciona: vuelve a guardar las variables y redeploy
