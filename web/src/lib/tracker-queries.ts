/**
 * Tracker data layer (Phase 5 - docs/MIGRATION_PLAN.md §7).
 *
 * Ports apps/tracker/models.py, views.py, serializers.py and signals.py:
 *   - getOrCreateProfile + 24-item document seeding (signals parity)
 *   - kanban dashboard columns (planning/drafting/submitted/decision)
 *   - completion_percentage property parity
 *   - CRUD for tracked applications, document items and the profile,
 *     scoped to the authenticated user (multi-user, M0 decision #5).
 *
 * JSON shapes mirror the DRF serializers (snake_case).
 */
import { and, asc, eq, sql } from 'drizzle-orm';

import { getDb, type Db } from './db';
import {
  applicantProfiles,
  countries,
  documentItems,
  scholarships,
  trackedApplications,
} from '../db/schema';

/* ── Labels (Django model choice display parity) ────────────────────────── */

export const STAGE_LABELS: Record<string, string> = {
  researching: 'Researching',
  planning: 'Planning',
  drafting: 'Drafting',
  submitted: 'Submitted',
  interview: 'Interview',
  awarded: 'Awarded',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const PRIORITY_LABELS: Record<string, string> = {
  reach: 'Reach',
  target: 'Target',
  safe: 'Safe',
  backup: 'Backup',
};

export const DOC_STATUS_LABELS: Record<string, string> = {
  ready: 'Ready',
  in_progress: 'In Progress',
  not_started: 'Not Started',
  not_needed: 'Not Needed',
};

/* ── Default 24-item document checklist (apps/tracker/signals.py) ───────── */

const DEFAULT_DOCUMENTS = [
  'Passport (bio page) - valid 6+ months',
  'Passport-size photos (digital, white background)',
  "Bachelor's degree certificate (or letter of completion)",
  "Bachelor's degree transcript (official, sealed)",
  "Master's degree transcript (if applicable)",
  'CV / Résumé (max 2 pages)',
  'Statement of Purpose - first draft',
  'Statement of Purpose - final, signed',
  'Study plan / research proposal',
  'Motivation letter',
  'Recommendation letter 1 (academic)',
  'Recommendation letter 2 (academic)',
  'Recommendation letter 3 (professional)',
  'English proficiency - IELTS score report',
  'English proficiency - TOEFL score report',
  'English proficiency - medium-of-instruction exemption letter',
  'GRE score report (if required)',
  'GMAT score report (if required)',
  'Work experience certificates',
  'Internship certificates',
  'Publications / research papers',
  'Portfolio / project documentation',
  'Financial documents (bank statement / sponsor letter)',
  'University application forms & checklists',
];

/* ── Completion percentage (Django TrackedApplication.completion_percentage) */

const STAGE_WEIGHTS: Record<string, number> = {
  researching: 10,
  planning: 25,
  drafting: 50,
  submitted: 75,
  interview: 90,
  awarded: 100,
  rejected: 100,
  withdrawn: 100,
};

export function completionPercentage(app: {
  stage: string;
  sopStatus: string;
  refsStatus: string;
  transcriptReady: boolean;
  moiReady: boolean;
}): number {
  let pct = STAGE_WEIGHTS[app.stage] ?? 10;
  if (app.sopStatus === 'done') pct += 10;
  else if (app.sopStatus === 'drafting') pct += 5;
  if (app.refsStatus === 'received') pct += 10;
  else if (app.refsStatus === 'requested') pct += 5;
  if (app.transcriptReady) pct += 3;
  if (app.moiReady) pct += 2;
  return Math.min(pct, 100);
}

/* ── Profile ────────────────────────────────────────────────────────────── */

export interface ProfileRow {
  id: number;
  full_name: string;
  email: string;
  nationality: string;
  degree_field: string;
  graduation_year: number | null;
  gpa: string | null;
  experience_years: string | null;
  has_ielts: boolean;
  ielts_score: string | null;
  has_toefl: boolean;
  toefl_score: number | null;
  documents_ready: number;
  documents_total: number;
  documents_progress: number;
}

export async function getOrCreateProfile(
  userId: string,
  email: string,
  name?: string | null,
  client: Db = getDb(),
): Promise<ProfileRow> {
  const existing = await client
    .select()
    .from(applicantProfiles)
    .where(eq(applicantProfiles.userId, userId))
    .limit(1);

  let profileId: number;
  if (existing.length === 0) {
    const inserted = await client
      .insert(applicantProfiles)
      .values({
        userId,
        email: email || `${userId}@scholarhub.local`,
        fullName: name ?? '',
      })
      .returning({ id: applicantProfiles.id });
    profileId = inserted[0].id;
    // Seed the 24-item checklist (signals parity).
    await client.insert(documentItems).values(
      DEFAULT_DOCUMENTS.map((name) => ({ profileId, name })),
    );
  } else {
    profileId = existing[0].id;
  }

  const docs = await client
    .select({ status: documentItems.status })
    .from(documentItems)
    .where(eq(documentItems.profileId, profileId));
  const ready = docs.filter((d) => d.status === 'ready').length;
  const total = docs.length;

  const row = existing[0];
  return {
    id: profileId,
    full_name: row?.fullName ?? name ?? '',
    email: row?.email ?? email,
    nationality: row?.nationality ?? '',
    degree_field: row?.degreeField ?? '',
    graduation_year: row?.graduationYear ?? null,
    gpa: row?.gpa ?? null,
    experience_years: row?.experienceYears ?? null,
    has_ielts: row?.hasIelts ?? false,
    ielts_score: row?.ieltsScore ?? null,
    has_toefl: row?.hasToefl ?? false,
    toefl_score: row?.toeflScore ?? null,
    documents_ready: ready,
    documents_total: total,
    documents_progress: total ? Math.round((100 * ready) / total) : 0,
  };
}

export async function getProfile(
  userId: string,
  client: Db = getDb(),
): Promise<ProfileRow | null> {
  const rows = await client
    .select()
    .from(applicantProfiles)
    .where(eq(applicantProfiles.userId, userId))
    .limit(1);
  if (rows.length === 0) return null;
  const row = rows[0];
  const docs = await client
    .select({ status: documentItems.status })
    .from(documentItems)
    .where(eq(documentItems.profileId, row.id));
  const ready = docs.filter((d) => d.status === 'ready').length;
  const total = docs.length;
  return {
    id: row.id,
    full_name: row.fullName,
    email: row.email,
    nationality: row.nationality,
    degree_field: row.degreeField,
    graduation_year: row.graduationYear,
    gpa: row.gpa,
    experience_years: row.experienceYears,
    has_ielts: row.hasIelts,
    ielts_score: row.ieltsScore,
    has_toefl: row.hasToefl,
    toefl_score: row.toeflScore,
    documents_ready: ready,
    documents_total: total,
    documents_progress: total ? Math.round((100 * ready) / total) : 0,
  };
}

/* ── Tracked applications ───────────────────────────────────────────────── */

export interface ApplicationRow {
  id: number;
  scholarship: number;
  scholarship_slug: string;
  scholarship_name: string;
  country_flag: string;
  country_name: string;
  deadline_date: string | null;
  stage: string;
  priority: string;
  notes: string;
  next_action: string;
  next_action_due: string | null;
  sop_status: string;
  refs_status: string;
  transcript_ready: boolean;
  moi_ready: boolean;
  completion_percentage: number;
  last_updated: Date;
}

const applicationSelect = {
  id: trackedApplications.id,
  scholarship: trackedApplications.scholarshipId,
  scholarshipSlug: scholarships.slug,
  scholarshipName: scholarships.name,
  countryFlag: countries.flagEmoji,
  countryName: countries.name,
  deadlineDate: scholarships.deadlineDate,
  stage: trackedApplications.stage,
  priority: trackedApplications.priority,
  notes: trackedApplications.notes,
  nextAction: trackedApplications.nextAction,
  nextActionDue: trackedApplications.nextActionDue,
  sopStatus: trackedApplications.sopStatus,
  refsStatus: trackedApplications.refsStatus,
  transcriptReady: trackedApplications.transcriptReady,
  moiReady: trackedApplications.moiReady,
  lastUpdated: trackedApplications.lastUpdated,
};

async function profileIdForUser(userId: string, client: Db): Promise<number | null> {
  const rows = await client
    .select({ id: applicantProfiles.id })
    .from(applicantProfiles)
    .where(eq(applicantProfiles.userId, userId))
    .limit(1);
  return rows[0]?.id ?? null;
}

export interface DashboardColumn {
  key: string;
  label: string;
  applications: ApplicationRow[];
}

export interface DashboardData {
  profile: ProfileRow;
  columns: DashboardColumn[];
  open_count: number;
  total_count: number;
}

const COLUMNS: Array<{ key: string; label: string; stages: string[] }> = [
  { key: 'planning', label: 'Planning', stages: ['planning'] },
  { key: 'drafting', label: 'Drafting', stages: ['drafting'] },
  { key: 'submitted', label: 'Submitted', stages: ['submitted'] },
  { key: 'decision', label: 'Decision', stages: ['interview', 'awarded', 'rejected', 'withdrawn'] },
];

export async function getTrackerDashboard(
  userId: string,
  email?: string,
  name?: string | null,
  client: Db = getDb(),
): Promise<DashboardData | null> {
  const profile = await getOrCreateProfile(userId, email ?? userId, name, client);
  const profileId = profile.id;

  const apps = await client
    .select(applicationSelect)
    .from(trackedApplications)
    .innerJoin(scholarships, eq(trackedApplications.scholarshipId, scholarships.id))
    .innerJoin(countries, eq(scholarships.countryId, countries.id))
    .where(eq(trackedApplications.profileId, profileId))
    .orderBy(desc_updated());

  const rows = apps.map((row) => ({
    id: row.id,
    scholarship: row.scholarship,
    scholarship_slug: row.scholarshipSlug,
    scholarship_name: row.scholarshipName,
    country_flag: row.countryFlag,
    country_name: row.countryName,
    deadline_date: row.deadlineDate,
    stage: row.stage,
    priority: row.priority,
    notes: row.notes,
    next_action: row.nextAction,
    next_action_due: row.nextActionDue,
    sop_status: row.sopStatus,
    refs_status: row.refsStatus,
    transcript_ready: row.transcriptReady,
    moi_ready: row.moiReady,
    completion_percentage: completionPercentage(row),
    last_updated: row.lastUpdated,
  }));

  const columns = COLUMNS.map((column) => ({
    key: column.key,
    label: column.label,
    applications: rows.filter((r) => column.stages.includes(r.stage)),
  }));

  const openCount = rows.filter(
    (r) => !['awarded', 'rejected', 'withdrawn'].includes(r.stage),
  ).length;

  return {
    profile,
    columns,
    open_count: openCount,
    total_count: rows.length,
  };
}

function desc_updated() {
  return sql`${trackedApplications.lastUpdated} DESC`;
}

export async function listApplications(
  userId: string,
  client: Db = getDb(),
): Promise<ApplicationRow[]> {
  const profileId = await profileIdForUser(userId, client);
  if (profileId === null) return [];
  const apps = await client
    .select(applicationSelect)
    .from(trackedApplications)
    .innerJoin(scholarships, eq(trackedApplications.scholarshipId, scholarships.id))
    .innerJoin(countries, eq(scholarships.countryId, countries.id))
    .where(eq(trackedApplications.profileId, profileId))
    .orderBy(desc_updated());
  return apps.map((row) => ({
    id: row.id,
    scholarship: row.scholarship,
    scholarship_slug: row.scholarshipSlug,
    scholarship_name: row.scholarshipName,
    country_flag: row.countryFlag,
    country_name: row.countryName,
    deadline_date: row.deadlineDate,
    stage: row.stage,
    priority: row.priority,
    notes: row.notes,
    next_action: row.nextAction,
    next_action_due: row.nextActionDue,
    sop_status: row.sopStatus,
    refs_status: row.refsStatus,
    transcript_ready: row.transcriptReady,
    moi_ready: row.moiReady,
    completion_percentage: completionPercentage(row),
    last_updated: row.lastUpdated,
  }));
}

export type ApplicationUpdate = Partial<{
  stage: string;
  priority: string;
  notes: string;
  next_action: string;
  next_action_due: string | null;
  sop_status: string;
  refs_status: string;
  transcript_ready: boolean;
  moi_ready: boolean;
}>;

export async function createApplication(
  userId: string,
  scholarshipId: number,
  data: ApplicationUpdate,
  client: Db = getDb(),
): Promise<ApplicationRow | null> {
  const profile = await getOrCreateProfile(userId, userId, null, client);
  const inserted = await client
    .insert(trackedApplications)
    .values({
      profileId: profile.id,
      scholarshipId,
      stage: data.stage ?? 'researching',
      priority: data.priority ?? 'target',
      notes: data.notes ?? '',
      nextAction: data.next_action ?? '',
      nextActionDue: data.next_action_due ?? null,
      sopStatus: data.sop_status ?? 'not_started',
      refsStatus: data.refs_status ?? 'not_started',
      transcriptReady: data.transcript_ready ?? false,
      moiReady: data.moi_ready ?? false,
    })
    .returning({ id: trackedApplications.id });
  const rows = await listApplications(userId, client);
  return rows.find((r) => r.id === inserted[0].id) ?? null;
}

export async function updateApplication(
  userId: string,
  id: number,
  data: ApplicationUpdate,
  client: Db = getDb(),
): Promise<ApplicationRow | null> {
  const profileId = await profileIdForUser(userId, client);
  if (profileId === null) return null;
  const updated = await client
    .update(trackedApplications)
    .set({
      ...(data.stage !== undefined ? { stage: data.stage } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.next_action !== undefined ? { nextAction: data.next_action } : {}),
      ...(data.next_action_due !== undefined ? { nextActionDue: data.next_action_due } : {}),
      ...(data.sop_status !== undefined ? { sopStatus: data.sop_status } : {}),
      ...(data.refs_status !== undefined ? { refsStatus: data.refs_status } : {}),
      ...(data.transcript_ready !== undefined ? { transcriptReady: data.transcript_ready } : {}),
      ...(data.moi_ready !== undefined ? { moiReady: data.moi_ready } : {}),
      lastUpdated: new Date(),
    })
    .where(
      and(
        eq(trackedApplications.id, id),
        eq(trackedApplications.profileId, profileId),
      ),
    )
    .returning({ id: trackedApplications.id });
  if (updated.length === 0) return null;
  const rows = await listApplications(userId, client);
  return rows.find((r) => r.id === id) ?? null;
}

export async function deleteApplication(
  userId: string,
  id: number,
  client: Db = getDb(),
): Promise<boolean> {
  const profileId = await profileIdForUser(userId, client);
  if (profileId === null) return false;
  const deleted = await client
    .delete(trackedApplications)
    .where(
      and(
        eq(trackedApplications.id, id),
        eq(trackedApplications.profileId, profileId),
      ),
    )
    .returning({ id: trackedApplications.id });
  return deleted.length > 0;
}

/* ── Document checklist ─────────────────────────────────────────────────── */

export interface DocumentRow {
  id: number;
  name: string;
  status: string;
  notes: string;
  due_date: string | null;
  updated_at: Date;
}

export async function listDocuments(
  userId: string,
  client: Db = getDb(),
): Promise<DocumentRow[]> {
  const profileId = await profileIdForUser(userId, client);
  if (profileId === null) return [];
  const rows = await client
    .select()
    .from(documentItems)
    .where(eq(documentItems.profileId, profileId))
    .orderBy(asc(documentItems.id));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    notes: row.notes,
    due_date: row.dueDate,
    updated_at: row.updatedAt,
  }));
}

export async function updateDocument(
  userId: string,
  id: number,
  data: { status?: string; notes?: string; due_date?: string | null },
  client: Db = getDb(),
): Promise<DocumentRow | null> {
  const profileId = await profileIdForUser(userId, client);
  if (profileId === null) return null;
  const updated = await client
    .update(documentItems)
    .set({
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.due_date !== undefined ? { dueDate: data.due_date } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(eq(documentItems.id, id), eq(documentItems.profileId, profileId)),
    )
    .returning();
  if (updated.length === 0) return null;
  const row = updated[0];
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    notes: row.notes,
    due_date: row.dueDate,
    updated_at: row.updatedAt,
  };
}
