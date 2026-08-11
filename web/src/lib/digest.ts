/**
 * Weekly email digest (port of apps/scholarships/tasks.py).
 *
 * buildDigestContext() reproduces build_digest_context() exactly:
 *   - urgent: active, deadline within the next 60 days, status open_now /
 *     opening_soon, ordered by deadline, top 10
 *   - new_this_week: active, updated in the last 7 days, status open_now,
 *     ordered by score, top 5
 * renderDigestEmail() is a faithful HTML port of templates/emails/
 * weekly_digest.html (inline styles, email-safe).
 */
import { addDays, eatToday } from './dates';
import { fundingLabel } from './labels';
import {
  queryScholarshipCards,
  type ScholarshipCardRow,
} from './queries';
import { site } from './site';

export const DIGEST_LOOKAHEAD_DAYS = 60;

export interface DigestContext {
  generatedOn: string; // YYYY-MM-DD (EAT)
  urgent: ScholarshipCardRow[];
  newThisWeek: ScholarshipCardRow[];
  lookaheadDays: number;
}

export async function getDigestContext(): Promise<DigestContext> {
  const now = eatToday();
  const soon = addDays(now, DIGEST_LOOKAHEAD_DAYS);
  const lastWeek = addDays(now, -7);

  const [urgent, newThisWeek] = await Promise.all([
    queryScholarshipCards({
      status: ['open_now', 'opening_soon'],
      deadlineAfter: now,
      deadlineBefore: soon,
      ordering: 'deadline_date',
      limit: 10,
    }),
    queryScholarshipCards({
      status: ['open_now'],
      updatedAfter: lastWeek,
      ordering: '-score',
      limit: 5,
    }),
  ]);

  return {
    generatedOn: now,
    urgent,
    newThisWeek,
    lookaheadDays: DIGEST_LOOKAHEAD_DAYS,
  };
}

const fmtDate = (iso: string | null): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[Number(m) - 1]} ${y}`;
};

function rowHtml(row: ScholarshipCardRow, detail: string): string {
  const url = `${site.url}/scholarships/${row.slug}/`;
  return `<tr>
    <td style="border-bottom:1px solid #eef0f3;padding:10px 0;">
      <a href="${url}" style="color:#1F3864;font-weight:700;text-decoration:none;font-size:14px;">${row.short_name || row.name}</a>
      <p style="margin:2px 0 0;color:#6b7280;font-size:12px;">${detail}</p>
    </td>
  </tr>`;
}

export function renderDigestEmail(context: DigestContext): string {
  const { generatedOn, urgent, newThisWeek, lookaheadDays } = context;

  const urgentRows =
    urgent.length > 0
      ? urgent
          .map((row) =>
            rowHtml(
              row,
              `${row.country.flag_emoji} ${row.country.name} · Score ${row.score}/100 · Deadline ${fmtDate(row.deadline_date)}`,
            ),
          )
          .join('')
      : `<p style="color:#6b7280;font-size:13px;margin-bottom:28px;">No deadlines within ${lookaheadDays} days - enjoy the calm! 🎉</p>`;

  const newRows =
    newThisWeek.length > 0
      ? newThisWeek
          .map((row) =>
            rowHtml(
              row,
              `${row.country.flag_emoji} ${row.country.name} · ${fundingLabel(row.funding_type)} · ${
                row.funding_detail.length > 50 ? `${row.funding_detail.slice(0, 49)}…` : row.funding_detail
              }`,
            ),
          )
          .join('')
      : `<p style="color:#6b7280;font-size:13px;margin-bottom:28px;">Nothing new this week - every listed opportunity is already verified and live on the site.</p>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ScholarHub Africa - Weekly Digest</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1F3864;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#1F3864;color:#ffffff;padding:32px 32px 24px;">
              <h1 style="margin:0;font-size:22px;">🎓 ScholarHub <span style="color:#1ABC9C;">Africa</span></h1>
              <p style="margin:8px 0 0;color:#A3E8DA;font-size:13px;">Weekly scholarship digest - ${fmtDate(generatedOn)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <h2 style="color:#1F3864;font-size:16px;margin:0 0 12px;">⏰ Closing within ${lookaheadDays} days</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${urgentRows}
              </table>
              <h2 style="color:#1F3864;font-size:16px;margin:0 0 12px;">✨ Newly open / updated this week</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${newRows}
              </table>
              <p style="color:#6b7280;font-size:12px;line-height:1.6;">
                You're receiving this because you subscribed to the ScholarHub Africa weekly digest.
                Every opportunity is human-verified against its official source.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#1F3864;color:#A3E8DA;padding:16px 32px;font-size:11px;text-align:center;">
              ScholarHub Africa - scholarship discovery & tracking for African students.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
