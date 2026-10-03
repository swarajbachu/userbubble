#!/usr/bin/env bash
set -euo pipefail
: "${TEST_DATABASE_URL:?Set TEST_DATABASE_URL to a disposable PostgreSQL database}"
case "$TEST_DATABASE_URL" in
  *localhost*|*127.0.0.1*) ;;
  *) echo 'Migration verification requires a local disposable database.' >&2; exit 1 ;;
esac
for migration in packages/db/drizzle/000*.sql packages/db/drizzle/0010_*.sql; do
  psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration" >/dev/null
done
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO "user" (id, name, email) VALUES ('fixture-user', 'Fixture Owner', 'fixture@example.test');
INSERT INTO organization (id, name, slug, metadata) VALUES ('fixture-org', 'Fixture', 'fixture', '{"branding":{"primaryColor":"#123456"}}');
INSERT INTO changelog_entry (id, organization_id, author_id, title, description, is_published) VALUES ('fixture-release', 'fixture-org', 'fixture-user', 'Preserved release', 'Release content', true);
INSERT INTO member (id, user_id, organization_id, role) VALUES ('fixture-member', 'fixture-user', 'fixture-org', 'owner');
INSERT INTO feedback_post (id, organization_id, author_id, title, description) VALUES ('fixture-post', 'fixture-org', 'fixture-user', 'Keep feedback', 'Customer content');
INSERT INTO feedback_vote (id, post_id, user_id, value) VALUES ('fixture-vote', 'fixture-post', 'fixture-user', 1);
INSERT INTO feedback_comment (id, post_id, author_id, content, is_ai_generated) VALUES ('fixture-comment', 'fixture-post', 'fixture-user', 'Preserve provenance', true);
INSERT INTO pr_generation_job (id, organization_id, feedback_post_id, triggered_by_id, status, pr_url) VALUES ('fixture-job', 'fixture-org', 'fixture-post', 'fixture-user', 'completed', 'https://example.test/pull/1');
SQL
if [ -n "${MIGRATION_BACKUP_PATH:-}" ]; then
  pg_dump --format=custom --file="$MIGRATION_BACKUP_PATH" "$TEST_DATABASE_URL"
fi
for migration in packages/db/drizzle/001[1-9]_*.sql; do
  psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f "$migration" >/dev/null
done
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM feedback_reference WHERE post_id='fixture-post' AND url='https://example.test/pull/1') THEN RAISE EXCEPTION 'Implementation link lost'; END IF;
  IF NOT EXISTS (SELECT 1 FROM feedback_comment WHERE id='fixture-comment' AND content='Preserve provenance' AND is_ai_generated) THEN RAISE EXCEPTION 'Comment or provenance lost'; END IF;
  IF NOT EXISTS (SELECT 1 FROM feedback_vote WHERE id='fixture-vote' AND post_id='fixture-post' AND user_id='fixture-user' AND value=1) THEN RAISE EXCEPTION 'Vote lost'; END IF;
  IF NOT EXISTS (SELECT 1 FROM member WHERE id='fixture-member' AND role='owner') THEN RAISE EXCEPTION 'Membership lost'; END IF;
  IF NOT EXISTS (SELECT 1 FROM organization WHERE id='fixture-org' AND metadata::jsonb->'branding'->>'primaryColor'='#123456') THEN RAISE EXCEPTION 'Branding lost'; END IF;
  IF NOT EXISTS (SELECT 1 FROM organization WHERE id='fixture-org' AND settings_revision=1) THEN RAISE EXCEPTION 'Settings revision backfill failed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM changelog_entry WHERE id='fixture-release' AND revision=1 AND description='Release content' AND is_published) THEN RAISE EXCEPTION 'Release content or revision backfill lost'; END IF;
  IF to_regclass('public.pr_generation_job') IS NOT NULL OR to_regclass('public.organization_api_key') IS NOT NULL THEN RAISE EXCEPTION 'Hosted execution tables remain'; END IF;
END $$;
SQL
printf 'Migration content-preservation checks passed.\n'
