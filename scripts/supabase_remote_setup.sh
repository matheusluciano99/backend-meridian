#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="ruhuqufxtoeqgjiqgcii"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SEED_FILE="$ROOT_DIR/supabase/seed.sql"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"

bold() { echo -e "\033[1m$1\033[0m"; }
info() { echo -e "[INFO] $1"; }
warn() { echo -e "\033[33m[WARN]\033[0m $1"; }
error() { echo -e "\033[31m[ERROR]\033[0m $1"; }

check_cli() {
  if ! command -v supabase >/dev/null 2>&1; then
    error "Supabase CLI não encontrado. Instale: https://supabase.com/docs/guides/cli";
    exit 1;
  fi
}

login_if_needed() {
  if ! supabase projects list >/dev/null 2>&1; then
    bold "Realizando login no Supabase...";
    supabase login || { error "Falha no login"; exit 1; }
  else
    info "Já logado no Supabase CLI."
  fi
}

link_project() {
  if [ ! -f "$ROOT_DIR/supabase/config.toml" ]; then
    bold "Linkando diretório ao projeto $PROJECT_REF...";
    supabase link --project-ref "$PROJECT_REF" || { error "Falha ao linkar projeto"; exit 1; }
  else
    grep -q "$PROJECT_REF" "$ROOT_DIR/supabase/config.toml" && info "Projeto já linkado ($PROJECT_REF)." || {
      warn "config.toml existe mas refs diferem. Re-linkando.";
      supabase link --project-ref "$PROJECT_REF" || { error "Falha ao re-linkar"; exit 1; }
    }
  fi
}

apply_migrations() {
  bold "Aplicando migrations (db push)...";
  supabase db push || { error "Falha ao aplicar migrations"; exit 1; }
}

run_seed() {
  if [ ! -f "$SEED_FILE" ]; then
    error "Seed file não encontrado em $SEED_FILE"; exit 1;
  fi
  bold "Executando seed remoto...";
  supabase db execute --file "$SEED_FILE" || { error "Falha ao executar seed"; exit 1; }
}

open_shell_queries() {
  bold "Executando verificações básicas...";
  supabase db execute --file - <<'EOF'
SELECT 'users' AS table, COUNT(*) AS total FROM users
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'policies', COUNT(*) FROM policies
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'claims', COUNT(*) FROM claims
UNION ALL SELECT 'ledger', COUNT(*) FROM ledger
UNION ALL SELECT 'webhook_logs', COUNT(*) FROM webhook_logs;

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name='users'
ORDER BY ordinal_position;
EOF
}

reset_data() {
  bold "Resetando dados (truncate + sequences)";
  supabase db execute --file - <<'EOF'
TRUNCATE ledger, payments, claims, policies, users, products, webhook_logs RESTART IDENTITY CASCADE;
SELECT setval('policy_sequence', 1, false);
SELECT setval('claim_sequence', 1, false);
EOF
}

rls_disable() {
  bold "Desativando RLS (caso esteja ativo)";
  supabase db execute --file - <<'EOF'
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ledger DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webhook_logs DISABLE ROW LEVEL SECURITY;
EOF
}

usage() {
  cat <<USAGE
$(basename "$0") [acao]
Ações disponíveis:
  full        Login + link + migrations + seed + verificação
  migrate     Apenas migrations (db push)
  seed        Apenas seed
  verify      Rodar queries de verificação
  reset       Truncate + reset sequences (não roda seed automaticamente)
  reseed      reset + seed + verify
  disable-rls Desativa RLS em todas as tabelas
Sem ação: mostra este help.
USAGE
}

main() {
  local action="${1:-}";
  case "$action" in
    full)
      check_cli; login_if_needed; link_project; apply_migrations; run_seed; open_shell_queries ;;
    migrate)
      check_cli; login_if_needed; link_project; apply_migrations ;;
    seed)
      check_cli; login_if_needed; link_project; run_seed ;;
    verify)
      check_cli; login_if_needed; link_project; open_shell_queries ;;
    reset)
      check_cli; login_if_needed; link_project; reset_data ;;
    reseed)
      check_cli; login_if_needed; link_project; reset_data; run_seed; open_shell_queries ;;
    disable-rls)
      check_cli; login_if_needed; link_project; rls_disable ;;
    *)
      usage ;;
  esac
}

main "$@"
