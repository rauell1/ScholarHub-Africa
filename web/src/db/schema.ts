/**
 * Drizzle schema (Phase 2 - docs/MIGRATION_PLAN.md §4).
 *
 * Planned tables (mapped from Django models):
 *   countries              ← Country
 *   fields_of_study        ← FieldOfStudy
 *   scholarships           ← Scholarship (+ generated tsvector column + GIN index)
 *   scholarship_fields     ← Scholarship.fields M2M junction
 *   change_logs            ← ChangeLog
 *   users / accounts / sessions  ← Auth.js adapter (Phase 5)
 *   applicant_profiles     ← ApplicantProfile
 *   tracked_applications   ← TrackedApplication
 *   document_items         ← DocumentItem
 *   consent_logs / consent_config / consent_policies  ← consent-manager JSONL store
 *
 * Intentionally empty in M1: this file only exists so drizzle-kit has a
 * schema entry point and lib/db.ts is future-proof.
 */
export {};
