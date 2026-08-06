create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.user_state (
  user_id uuid primary key not null
    references auth.users(id) on delete cascade,
  state_data jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  revision bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_state_schema_version_positive
    check (schema_version >= 1),
  constraint user_state_revision_positive
    check (revision >= 1),
  constraint user_state_data_is_object
    check (jsonb_typeof(state_data) = 'object')
);

comment on table public.user_state is
  'Cofre privado que guarda um snapshot versionado do NORTE por usuário; ainda não existe sincronização automática.';
comment on column public.user_state.state_data is
  'Snapshot versionado dos dados do NORTE, armazenado como objeto JSON.';
comment on column public.user_state.schema_version is
  'Versão do formato do snapshot armazenado em state_data.';
comment on column public.user_state.revision is
  'Revisão incremental controlada pelo banco de dados.';

create function private.prepare_user_state_write()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, private
as $$
begin
  if tg_op = 'INSERT' then
    new.revision := 1;
    new.created_at := now();
    new.updated_at := new.created_at;

    return new;
  end if;

  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  new.revision := old.revision + 1;

  return new;
end;
$$;

revoke all on function private.prepare_user_state_write()
  from public, anon, authenticated;

create trigger prepare_user_state_write
before insert or update on public.user_state
for each row
execute function private.prepare_user_state_write();

revoke all on table public.user_state
  from public, anon, authenticated;

grant select, insert, update, delete
  on table public.user_state
  to authenticated;

alter table public.user_state enable row level security;

create policy user_state_select_own
on public.user_state
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

create policy user_state_insert_own
on public.user_state
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

create policy user_state_update_own
on public.user_state
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

create policy user_state_delete_own
on public.user_state
for delete
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);
