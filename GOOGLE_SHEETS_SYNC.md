# Sincronizacion de Leads con Google Sheets

Este proyecto puede duplicar automaticamente cada lead nuevo en Google Sheets.

## Que hace

Cuando alguien envia una consulta desde la web publica:

- el lead se guarda en Supabase
- y, si Google Sheets esta configurado, tambien se agrega una fila a la planilla

Si Google Sheets falla, el lead igual queda guardado en el CRM.

## Variables necesarias

Configuralas en `.env.local` para desarrollo y en Vercel para produccion:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_RANGE=Leads!A:J
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
```

## Como preparar la planilla

1. Crea una planilla en Google Sheets.
2. Crea una hoja llamada `Leads` o ajusta `GOOGLE_SHEETS_RANGE`.
3. En la fila 1, puedes usar estos encabezados:

```text
Fecha de ingreso | Lead ID | Propiedad | Ubicacion | Nombre | Telefono | Email | Mensaje | Origen | Estado
```

## Como preparar la cuenta de servicio

1. En Google Cloud, crea un proyecto.
2. Habilita Google Sheets API.
3. Crea una Service Account.
4. Genera una clave JSON.
5. Toma de ese JSON:
   - `client_email`
   - `private_key`
6. Comparte la planilla con el `client_email` de la cuenta de servicio como editor.

## Notas

- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` suele pegarse con `\n` en una sola linea.
- El rango `Leads!A:J` hace append en 10 columnas.
- El append usa `USER_ENTERED`.
