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
 * ONE TAB: "Scholarships" -- all records from scholarships_data.csv.
 * The CSV contains both Roy's STEM shortlist (Category = "Roy Priority") and
 * all other African-eligible scholarships (Category = "Global - <Field>").
 * Use Google Sheets filter views to toggle between sections.
 *
 * Update GITHUB_CSV_URL if the repo or branch changes.
 */

const GITHUB_CSV_URL =
  "https://raw.githubusercontent.com/rauell1/ScholarHub-Africa/main/scholarships_data.csv";

const SHEET_NAME = "Scholarships";
const LOG_SHEET  = "Sync Log";

// ── Main sync function ───────────────────────────────────────────────────────

function syncFromGitHub() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

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

  const rows = Utilities.parseCsv(response.getContentText());
  if (rows.length < 2) { logSync(ss, "ERROR", "CSV returned no data rows"); return; }

  // Write to Scholarships tab (create if missing)
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  sheet.clearContents();
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);

  // Header row formatting
  const header = sheet.getRange(1, 1, 1, rows[0].length);
  header.setFontWeight("bold");
  header.setBackground("#1a73e8");
  header.setFontColor("#ffffff");

  // Colour-code Status and Category columns
  colorizeRows(sheet, rows);

  sheet.autoResizeColumns(1, rows[0].length);
  sheet.setFrozenRows(1);

  // Create filter views if they don't exist yet
  createFilterViews(sheet, rows[0]);

  logSync(ss, "OK", (rows.length - 1) + " scholarships synced from GitHub");
}

// ── Colour-code Status and Category columns ──────────────────────────────────

function colorizeRows(sheet, rows) {
  const headers     = rows[0];
  const statusIdx   = headers.indexOf("Status");    // capital S
  const categoryIdx = headers.indexOf("Category");  // 18th column

  for (let i = 1; i < rows.length; i++) {
    const rowNum = i + 1;

    // Status colour
    if (statusIdx !== -1) {
      const cell = sheet.getRange(rowNum, statusIdx + 1);
      const val  = (rows[i][statusIdx] || "").toUpperCase();
      if (val.includes("CRITICAL"))     { cell.setBackground("#ea4335"); cell.setFontColor("#fff"); }
      else if (val.includes("URGENT"))  { cell.setBackground("#ff6d00"); cell.setFontColor("#fff"); }
      else if (val.includes("OPEN"))    { cell.setBackground("#34a853"); cell.setFontColor("#fff"); }
      else if (val.includes("NOT YET")) { cell.setBackground("#fbbc04"); cell.setFontColor("#000"); }
      else if (val.includes("CLOSED"))  { cell.setBackground("#9e9e9e"); cell.setFontColor("#fff"); }
    }

    // Category colour -- Roy Priority = blue tint, Global = light green tint
    if (categoryIdx !== -1) {
      const cat  = (rows[i][categoryIdx] || "").toUpperCase();
      const cell = sheet.getRange(rowNum, categoryIdx + 1);
      if (cat === "ROY PRIORITY") {
        cell.setBackground("#e8f0fe"); cell.setFontColor("#1a73e8"); cell.setFontWeight("bold");
      } else if (cat.startsWith("GLOBAL")) {
        cell.setBackground("#e6f4ea"); cell.setFontColor("#137333");
      }
    }
  }
}

// ── Create filter views for quick switching ──────────────────────────────────

function createFilterViews(sheet, headers) {
  // Only create once -- skip if filter views already exist
  const existing = sheet.getParent().getSheets()
    .map(s => s.getName());
  // Filter views are on the sheet object; just create if the sheet was freshly made
  // (Apps Script does not expose FilterView creation easily -- instruct user instead)
  Logger.log("Tip: use Data > Filter views in the Sheet to save 'Roy Priority' and 'All Fields' views.");
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
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === "syncFromGitHub")
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger("syncFromGitHub")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();

  Logger.log("Weekly trigger set: Monday 09:00 (script timezone).");
  Logger.log("Make sure Project Settings -> Time zone = Africa/Nairobi");
}

// ── Manual run shortcut ──────────────────────────────────────────────────────

function runNow() {
  syncFromGitHub();
}
