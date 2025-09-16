-- chain_events: armazena eventos indexados on-chain
-- Tipos esperados: premium_collected, payout_executed, policy_activated
-- Futuro: token_transfer, policy_paused, policy_resumed

create table if not exists chain_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  tx_hash text not null,
  ledger bigint,
  contract_id text,
  policy_id uuid,
  user_id uuid,
  payment_ref text,
  amount_xlm numeric,
  raw jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_chain_events_type_created_at on chain_events(event_type, created_at desc);
create index if not exists idx_chain_events_policy on chain_events(policy_id);
create index if not exists idx_chain_events_user on chain_events(user_id);
create index if not exists idx_chain_events_payment_ref on chain_events(payment_ref);
