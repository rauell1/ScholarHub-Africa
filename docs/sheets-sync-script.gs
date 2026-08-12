/**
 * ScholarHub Africa – Google Sheets Auto-Sync Script
 * ====================================================
 * SETUP (one-time):
 *  1. Open the Google Sheet: https://docs.google.com/spreadsheets/d/1g_obWS6_Y3smX450xwg-ZWL8Nye91WgU1KkHwzhWg4A/edit
 *  2. Extensions → Apps Script
 *  3. Paste this entire file, replacing any existing content
 *  4. Save (Ctrl+S)
 *  5. Run setupTrigger() once (click ▶ with setupTrigger selected)
 *  6. Approve the permissions dialog
 *
 * After that: the sheet auto-updates every Monday at 09:00 EAT (06:00 UTC),
 * shortly after the Claude agent writes new data to GitHub.
 *
 * GITHUB_CSV_URL points to the raw CSV in the ScholarHub-Africa repo.
 * Update this URL if the repo or branch changes.
 */

const GITHUB_CSV_URL =
  "https://raw.githubusercontent.com/rauell1/ScholarHub-Africa/main/scholarships_data.csv";

const SHEET_NAME = "Scholarships";   // rename the tab to this after first sync
const LOG_SHEET  = "Sync Log";

// ── Main sync function ───────────────────────────────────────────────────────

function syncFromGitHub() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Fetch CSV from GitHub
  let response;
  try {
    response = UrlFetchApp.fetch(GITHUB_CSV_URL, { muteHttpExceptions: true });
  } catch (e) {
    logSync(ss, "ERROR", "Fetch failed: " + e.message);
    return;
  }

  if (response.getResponseCode() !== 200) {
    logSync(ss, "ERROR", "HTTP " + response.getResponseCode());
    return;
  }

  const csvText = response.getContentText();
  const rows = Utilities.parseCsv(csvText);

  if (rows.length < 2) {
    logSync(ss, "ERROR", "CSV returned no data rows");
    return;
  }

  // Write to Scholarships sheet (create if missing)
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

  // Format header row
  const header = sheet.getRange(1, 1, 1, rows[0].length);
  header.setFontWeight("bold");
  header.setBackground("#1a73e8");
  header.setFontColor("#ffffff");

  // Colour-code status column (column 10 = "status")
  colorizeStatusColumn(sheet, rows);

  // Auto-resize columns
  sheet.autoResizeColumns(1, rows[0].length);

  // Freeze header
  sheet.setFrozenRows(1);

  logSync(ss, "OK", rows.length - 1 + " scholarships synced from GitHub");
}

// ── Colour-code the status column ───────────────────────────────────────────

function colorizeStatusColumn(sheet, rows) {
  const headers = rows[0];
  const statusIdx = headers.indexOf("status");  // 0-based
  if (statusIdx === -1) return;

  const col = statusIdx + 1;  // Sheets is 1-based

  for (let i = 1; i < rows.length; i++) {
    const cell = sheet.getRange(i + 1, col);
    const val  = (rows[i][statusIdx] || "").toUpperCase();
    if (val.includes("CRITICAL"))      { cell.setBackground("#ea4335"); cell.setFontColor("#fff"); }
    else if (val.includes("URGENT"))   { cell.setBackground("#ff6d00"); cell.setFontColor("#fff"); }
    else if (val.includes("OPEN"))     { cell.setBackground("#34a853"); cell.setFontColor("#fff"); }
    else if (val.includes("NOT YET"))  { cell.setBackground("#fbbc04"); cell.setFontColor("#000"); }
    else if (val.includes("CLOSED"))   { cell.setBackground("#9e9e9e"); cell.setFontColor("#fff"); }
  }
}

// ── Sync log helper ──────────────────────────────────────────────────────────

function logSync(ss, status, message) {
  let log = ss.getSheetByName(LOG_SHEET);
  if (!log) {
    log = ss.insertSheet(LOG_SHEET);
    log.appendRow(["Timestamp", "Status", "Message"]);
    log.getRange(1, 1, 1, 3).setFontWeight("bold");
  }
  log.appendRow([new Date().toISOString(), status, message]);
  Logger.log("[" + status + "] " + message);
}

// ── Trigger setup (run this once manually) ───────────────────────────────────

function setupTrigger() {
  // Remove any existing syncFromGitHub triggers first
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "syncFromGitHub")
    .forEach(t => ScriptApp.deleteTrigger(t));

  // Weekly trigger: Monday at 09:00 EAT = 06:00 UTC
  // Apps Script clock triggers use the script's timezone (set in project settings)
  ScriptApp.newTrigger("syncFromGitHub")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)   // adjust if your Apps Script timezone ≠ EAT
    .create();

  Logger.log("✅ Weekly trigger set: every Monday at 09:00 (script timezone).");
  Logger.log("   Make sure Project Settings → Time zone = Africa/Nairobi");
}

// ── Manual run shortcut ──────────────────────────────────────────────────────

function runNow() {
  syncFromGitHub();
}
