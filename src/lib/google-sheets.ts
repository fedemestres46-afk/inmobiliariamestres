import { google } from "googleapis";

type SyncLeadToSheetInput = {
  leadId: string;
  propertyTitle: string;
  propertyLocation?: string;
  fullName: string;
  phone: string;
  email?: string;
  message?: string;
  origin: string;
  status: string;
  createdAt: string;
};

function getGoogleSheetsConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  const range = process.env.GOOGLE_SHEETS_RANGE?.trim();
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  return {
    spreadsheetId,
    range,
    clientEmail,
    privateKey,
  };
}

export function isGoogleSheetsSyncConfigured() {
  const config = getGoogleSheetsConfig();
  return Boolean(
    config.spreadsheetId &&
      config.range &&
      config.clientEmail &&
      config.privateKey,
  );
}

export async function syncLeadToGoogleSheets(input: SyncLeadToSheetInput) {
  if (!isGoogleSheetsSyncConfigured()) {
    return { synced: false as const, reason: "missing_config" as const };
  }

  const config = getGoogleSheetsConfig();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.spreadsheetId,
    range: config.range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          input.createdAt,
          input.leadId,
          input.propertyTitle,
          input.propertyLocation ?? "",
          input.fullName,
          input.phone,
          input.email ?? "",
          input.message ?? "",
          input.origin,
          input.status,
        ],
      ],
    },
  });

  return { synced: true as const };
}
