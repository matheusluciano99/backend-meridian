#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="ruhuqufxtoeqgjiqgcii"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SEED_FILE="$ROOT_DIR/supabase/seed.sql"
BASELINE_MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"

# Versões antigas conhecidas (ajuste se migration list mostrar outras)
LEGACY_MIGRATIONS=(20250915200519 20250915201821)

bold() { echo -e "\033[1m$1\033[0m"; }
info() { echo -e "[INFO] $1"; }
warn() { echo -e "\033[33m[WARN]\033[0m $1"; }
error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

check_cli() { command -v supabase >/dev/null || { error "Supabase CLI não instalado"; exit 1; }; }

login_if_needed() {
  if ! supabase projects list >/dev/null 2>&1; then
    bold "Login no Supabase..."; supabase login; fi
}

link_project() {
  if [ ! -f "$ROOT_DIR/supabase/config.toml" ]; then
    bold "Linkando projeto $PROJECT_REF"; supabase link --project-ref "$PROJECT_REF"; else
    grep -q "$PROJECT_REF" "$ROOT_DIR/supabase/config.toml" || { warn "Ref diferente, relink"; supabase link --project-ref "$PROJECT_REF"; } fi
}

repair_history() {
  bold "Reparando histórico de migrações (marcando como reverted)...";
  set +e
  supabase migration repair --status reverted "${LEGACY_MIGRATIONS[@]}"
  set -e
}

drop_all() {
  bold "Dropando objetos (tabelas, triggers, sequences, função)...";
  supabase db execute --file - <<'EOF'
-- Triggers
DO $$ BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname='update_users_updated_at';
  IF FOUND THEN DROP TRIGGER update_users_updated_at ON users; END IF;
EXCEPTION WHEN undefined_table THEN END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname='update_products_updated_at';
  IF FOUND THEN DROP TRIGGER update_products_updated_at ON products; END IF;
EXCEPTION WHEN undefined_table THEN END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname='update_policies_updated_at';
  IF FOUND THEN DROP TRIGGER update_policies_updated_at ON policies; END IF;
EXCEPTION WHEN undefined_table THEN END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname='update_payments_updated_at';
  IF FOUND THEN DROP TRIGGER update_payments_updated_at ON payments; END IF;
EXCEPTION WHEN undefined_table THEN END $$;
DO $$ BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname='update_claims_updated_at';
  IF FOUND THEN DROP TRIGGER update_claims_updated_at ON claims; END IF;
EXCEPTION WHEN undefined_table THEN END $$;

-- Tables (ordem para FK)
DROP TABLE IF EXISTS ledger CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS webhook_logs CASCADE;

-- Sequences & function
DROP SEQUENCE IF EXISTS policy_sequence;
DROP SEQUENCE IF EXISTS claim_sequence;
DROP FUNCTION IF EXISTS update_updated_at_column();
EOF
}

apply_migrations() { bold "Aplicando baseline (db push)..."; supabase db push; }

seed() {
  [ -f "$SEED_FILE" ] || { warn "Seed ausente, pulando"; return; }
  bold "Executando seed..."; supabase db execute --file "$SEED_FILE";
}

verify() {
  bold "Verificando novo estado...";
  supabase db execute --file - <<'EOF'
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users' ORDER BY ordinal_position;
EOF
}

usage() { cat <<USAGE
$(basename "$0") [acao]
Ações:
  full-reset  Repara histórico, dropa tudo, reaplica migrations, seed e verifica
  drop-only   Só dropa objetos
  repair      Apenas marca migrações antigas como reverted
  migrate     Só aplica migrations
  seed        Só seed
  verify      Só verifica
USAGE
}

main() {
  action="${1:-}";
  case "$action" in
    full-reset)
      check_cli; login_if_needed; link_project; repair_history; drop_all; apply_migrations; seed; verify ;;
    drop-only)
      check_cli; login_if_needed; link_project; drop_all ;;
    repair)
      check_cli; login_if_needed; link_project; repair_history ;;
    migrate)
      check_cli; login_if_needed; link_project; apply_migrations ;;
    seed)
      check_cli; login_if_needed; link_project; seed ;;
    verify)
      check_cli; login_if_needed; link_project; verify ;;
    *) usage ;;
  esac
}

main "$@"
