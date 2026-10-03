#!/usr/bin/env bash
set -euo pipefail
: "${TEST_RESTORE_DATABASE_URL:?Set a separate empty local disposable database}"
: "${MIGRATION_BACKUP_PATH:?Set the populated legacy backup from verify-migration.sh}"
case "$TEST_RESTORE_DATABASE_URL" in
  *localhost*|*127.0.0.1*) ;;
  *) echo 'Restore verification requires a local disposable database.' >&2; exit 1 ;;
esac
# No --clean: restoration must fail rather than overwrite an existing database.
pg_restore --exit-on-error --single-transaction --no-owner --dbname="$TEST_RESTORE_DATABASE_URL" "$MIGRATION_BACKUP_PATH"
psql "$TEST_RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM feedback_post WHERE id='fixture-post' AND description='Customer content') THEN RAISE EXCEPTION 'Restored feedback missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM feedback_comment WHERE id='fixture-comment' AND content='Preserve provenance' AND is_ai_generated) THEN RAISE EXCEPTION 'Restored comments missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM feedback_vote WHERE id='fixture-vote' AND value=1) THEN RAISE EXCEPTION 'Restored vote missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM member WHERE id='fixture-member' AND role='owner') THEN RAISE EXCEPTION 'Restored membership missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM organization WHERE id='fixture-org' AND metadata::jsonb->'branding'->>'primaryColor'='#123456') THEN RAISE EXCEPTION 'Restored branding missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM changelog_entry WHERE id='fixture-release' AND description='Release content' AND is_published) THEN RAISE EXCEPTION 'Restored release missing'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pr_generation_job WHERE id='fixture-job' AND pr_url='https://example.test/pull/1') THEN RAISE EXCEPTION 'Legacy rollback schema/content missing'; END IF;
END $$;
SQL
printf 'Legacy backup restoration checks passed.\n'
