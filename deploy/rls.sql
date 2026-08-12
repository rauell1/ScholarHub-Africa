-- ═══════════════════════════════════════════════════════════════════════
-- Row-Level Security (Track 3.5) - PostgreSQL only.
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
-- is the reviewed starting template - the closest compliant alternative.
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Scholarships: public directory rows are readable by anyone.
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships FORCE ROW LEVEL SECURITY;

CREATE POLICY scholarships_public_select ON scholarships
    FOR SELECT
    USING (is_active = TRUE);

-- 2) Tracker: an applicant may only see/change their OWN rows, resolved
--    through applicant_profiles -> users. Prevents IDOR at the DB layer.
ALTER TABLE tracked_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_applications FORCE ROW LEVEL SECURITY;

CREATE POLICY tracker_own_select ON tracked_applications
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM applicant_profiles
            WHERE user_id = current_setting('app.user_id', TRUE)
        )
    );

CREATE POLICY tracker_own_insert ON tracked_applications
    FOR INSERT
    WITH CHECK (
        profile_id IN (
            SELECT id FROM applicant_profiles
            WHERE user_id = current_setting('app.user_id', TRUE)
        )
    );

CREATE POLICY tracker_own_update ON tracked_applications
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM applicant_profiles
            WHERE user_id = current_setting('app.user_id', TRUE)
        )
    )
    WITH CHECK (
        profile_id IN (
            SELECT id FROM applicant_profiles
            WHERE user_id = current_setting('app.user_id', TRUE)
        )
    );

CREATE POLICY tracker_own_delete ON tracked_applications
    FOR DELETE
    USING (
        profile_id IN (
            SELECT id FROM applicant_profiles
            WHERE user_id = current_setting('app.user_id', TRUE)
        )
    );

-- Same ownership scoping for documents (checklist items).
ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_items FORCE ROW LEVEL SECURITY;

CREATE POLICY document_own_select ON document_items
    FOR SELECT
    USING (
        profile_id IN (
            SELECT id FROM applicant_profiles
            WHERE user_id = current_setting('app.user_id', TRUE)
        )
    );

CREATE POLICY document_own_update ON document_items
    FOR UPDATE
    USING (
        profile_id IN (
            SELECT id FROM applicant_profiles
            WHERE user_id = current_setting('app.user_id', TRUE)
        )
    )
    WITH CHECK (
        profile_id IN (
            SELECT id FROM applicant_profiles
            WHERE user_id = current_setting('app.user_id', TRUE)
        )
    );

