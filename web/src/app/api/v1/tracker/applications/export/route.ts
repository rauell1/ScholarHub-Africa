import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { apiError, isDbUnavailable } from '@/lib/http';
import { listApplications } from '@/lib/tracker-queries';

export const dynamic = 'force-dynamic';

function escapeCell(value: string | number | boolean | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const HEADERS = [
  'Scholarship',
  'Country',
  'Deadline',
  'Stage',
  'Priority',
  'SOP Status',
  'Refs Status',
  'Transcript Ready',
  'MoI Ready',
  'Completion %',
  'Next Action',
  'Next Action Due',
  'Notes',
  'Last Updated',
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('Authentication credentials were not provided.', 401);
  }

  let rows: Awaited<ReturnType<typeof listApplications>> = [];
  try {
    rows = await listApplications(session.user.id);
  } catch (err) {
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }

  const lines = [HEADERS.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.scholarship_name,
        `${row.country_flag} ${row.country_name}`,
        row.deadline_date ?? '',
        row.stage,
        row.priority,
        row.sop_status,
        row.refs_status,
        row.transcript_ready ? 'Yes' : 'No',
        row.moi_ready ? 'Yes' : 'No',
        row.completion_percentage,
        row.next_action,
        row.next_action_due ?? '',
        row.notes,
        new Date(row.last_updated).toISOString().slice(0, 10),
      ]
        .map(escapeCell)
        .join(','),
    );
  }

  const csv = lines.join('\r\n');
  const filename = `scholarhub-tracker-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
