-- ═══════════════════════════════════════════════════════════════════════
-- Row-Level Security (Track 3.5) — PostgreSQL only.
--
-- Enforced at the DATABASE, not just the UI. Apply on Neon/Postgres with:
--     python manage.py enable_rls
-- (the command runs this file; it is a safe no-op on SQLite dev databases).
--
-- NOTE: these policies read the session GUC `app.user_id`, which Django
-- must set per-request, e.g. middleware:
--     with connection.cursor() as c:
--         c.execute("SET LOCAL app.user_id = %s", [request.user.id])
-- The GUC is a plain string; cast safely. Wire this middleware before
-- enabling RLS in production (Phase 2 multi-user). Until then this file
-- is the reviewed starting template — the closest compliant alternative.
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Scholarships: public directory rows are readable by anyone, but
--    writes are denied to the app role unless a separate admin role exists.
ALTER TABLE scholarships_scholarship ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships_scholarship FORCE ROW LEVEL SECURITY;

CREATE POLICY scholarships_public_select ON scholarships_scholarship
    FOR SELECT
    USING (is_active = TRUE);

-- No INSERT/UPDATE/DELETE policies for the app role → the app role cannot
-- mutate scholarships directly; only the Django admin (superuser role) can,
-- via a separate elevated role that bypasses RLS (BYPASSRLS).

-- 2) Tracker: an applicant may only see/change their OWN rows, resolved
--    through applicant_profiles -> auth_user. Prevents IDOR at the DB layer
--    even if an application bug ever skips the ORM ownership check.
ALTER TABLE tracker_trackedapplication ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_trackedapplication FORCE ROW LEVEL SECURITY;

CREATE POLICY tracker_own_select ON tracker_trackedapplication
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM tracker_applicantprofile
            WHERE user_id = NULLIF(current_setting('app.user_id', TRUE), '')::int
        )
    );

CREATE POLICY tracker_own_insert ON tracker_trackedapplication
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM tracker_applicantprofile
            WHERE user_id = NULLIF(current_setting('app.user_id', TRUE), '')::int
        )
    );

CREATE POLICY tracker_own_update ON tracker_trackedapplication
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM tracker_applicantprofile
            WHERE user_id = NULLIF(current_setting('app.user_id', TRUE), '')::int
        )
    )
    WITH CHECK (
        profile_id IN (
            SELECT id FROM tracker_applicantprofile
            WHERE user_id = NULLIF(current_setting('app.user_id', TRUE), '')::int
        )
    );

CREATE POLICY tracker_own_delete ON tracker_trackedapplication
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM tracker_applicantprofile
            WHERE user_id = NULLIF(current_setting('app.user_id', TRUE), '')::int
        )
    );

-- Same ownership scoping for documents (checklist items).
ALTER TABLE tracker_documentitem ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_documentitem FORCE ROW LEVEL SECURITY;

CREATE POLICY document_own_select ON tracker_documentitem
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM tracker_applicantprofile
            WHERE user_id = NULLIF(current_setting('app.user_id', TRUE), '')::int
        )
    );

CREATE POLICY document_own_update ON tracker_documentitem
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM tracker_applicantprofile
            WHERE user_id = NULLIF(current_setting('app.user_id', TRUE), '')::int
        )
    )
    WITH CHECK (
        profile_id IN (
            SELECT id FROM tracker_applicantprofile
            WHERE user_id = NULLIF(current_setting('app.user_id', TRUE), '')::int
        )
    );
