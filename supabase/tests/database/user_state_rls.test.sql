begin;

select plan(45);

select has_table(
  'public',
  'user_state',
  'public.user_state existe'
);
select col_is_pk(
  'public',
  'user_state',
  'user_id',
  'user_id é a chave primária'
);
select col_type_is(
  'public',
  'user_state',
  'state_data',
  'jsonb',
  'state_data usa jsonb'
);
select ok(
  (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.user_state'::regclass
  ),
  'RLS está ativo'
);
select policies_are(
  'public',
  'user_state',
  array[
    'user_state_delete_own',
    'user_state_insert_own',
    'user_state_select_own',
    'user_state_update_own'
  ],
  'existem somente as quatro políticas esperadas'
);

select policy_roles_are(
  'public', 'user_state', 'user_state_select_own',
  array['authenticated'],
  'SELECT é restrito a authenticated'
);
select policy_roles_are(
  'public', 'user_state', 'user_state_insert_own',
  array['authenticated'],
  'INSERT é restrito a authenticated'
);
select policy_roles_are(
  'public', 'user_state', 'user_state_update_own',
  array['authenticated'],
  'UPDATE é restrito a authenticated'
);
select policy_roles_are(
  'public', 'user_state', 'user_state_delete_own',
  array['authenticated'],
  'DELETE é restrito a authenticated'
);
select policy_cmd_is(
  'public', 'user_state', 'user_state_select_own', 'SELECT',
  'user_state_select_own executa SELECT'
);
select policy_cmd_is(
  'public', 'user_state', 'user_state_insert_own', 'INSERT',
  'user_state_insert_own executa INSERT'
);
select policy_cmd_is(
  'public', 'user_state', 'user_state_update_own', 'UPDATE',
  'user_state_update_own executa UPDATE'
);
select policy_cmd_is(
  'public', 'user_state', 'user_state_delete_own', 'DELETE',
  'user_state_delete_own executa DELETE'
);

select ok(
  not has_table_privilege('anon', 'public.user_state', 'SELECT'),
  'anon não possui SELECT'
);
select ok(
  not has_table_privilege('anon', 'public.user_state', 'INSERT'),
  'anon não possui INSERT'
);
select ok(
  not has_table_privilege('anon', 'public.user_state', 'UPDATE'),
  'anon não possui UPDATE'
);
select ok(
  not has_table_privilege('anon', 'public.user_state', 'DELETE'),
  'anon não possui DELETE'
);
select ok(
  has_table_privilege('authenticated', 'public.user_state', 'SELECT'),
  'authenticated possui SELECT'
);
select ok(
  has_table_privilege('authenticated', 'public.user_state', 'INSERT'),
  'authenticated possui INSERT'
);
select ok(
  has_table_privilege('authenticated', 'public.user_state', 'UPDATE'),
  'authenticated possui UPDATE'
);
select ok(
  has_table_privilege('authenticated', 'public.user_state', 'DELETE'),
  'authenticated possui DELETE'
);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'user1@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'user2@example.test'),
  ('33333333-3333-4333-8333-333333333333', 'user3@example.test');

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$
    insert into public.user_state (
      user_id, state_data, revision, created_at, updated_at
    ) values (
      '11111111-1111-4111-8111-111111111111',
      '{"owner":"user1"}'::jsonb,
      99,
      '2020-01-01 00:00:00+00',
      '2040-01-01 00:00:00+00'
    )
  $$,
  'usuário 1 insere a própria linha'
);
select is(
  (select revision from public.user_state),
  1::bigint,
  'revision do INSERT é controlada pelo banco'
);
select isnt(
  (select created_at from public.user_state),
  '2020-01-01 00:00:00+00'::timestamptz,
  'created_at do INSERT ignora o valor do cliente'
);
select isnt(
  (select updated_at from public.user_state),
  '2040-01-01 00:00:00+00'::timestamptz,
  'updated_at do INSERT ignora o valor do cliente'
);
select throws_like(
  $$
    insert into public.user_state (user_id)
    values ('22222222-2222-4222-8222-222222222222')
  $$,
  '%row-level security%',
  'usuário 1 não insere linha para usuário 2'
);
select is(
  (select count(*)::integer from public.user_state),
  1,
  'usuário 1 enxerga somente a própria linha'
);

reset role;
insert into public.user_state (user_id, state_data)
values (
  '22222222-2222-4222-8222-222222222222',
  '{"owner":"user2"}'::jsonb
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-4222-8222-222222222222',
  true
);
select is(
  (select count(*)::integer from public.user_state),
  1,
  'usuário 2 enxerga somente a própria linha'
);

update public.user_state
set state_data = '{"changed":true}'::jsonb
where user_id = '11111111-1111-4111-8111-111111111111';
reset role;
select is(
  (select state_data from public.user_state
   where user_id = '11111111-1111-4111-8111-111111111111'),
  '{"owner":"user1"}'::jsonb,
  'usuário 2 não altera a linha do usuário 1'
);

set local role authenticated;
delete from public.user_state
where user_id = '11111111-1111-4111-8111-111111111111';
reset role;
select ok(
  exists(
    select 1 from public.user_state
    where user_id = '11111111-1111-4111-8111-111111111111'
  ),
  'usuário 2 não exclui a linha do usuário 1'
);

set local role anon;
select throws_like(
  $$select * from public.user_state$$,
  '%permission denied for table user_state%',
  'anon não lê linhas'
);
select throws_like(
  $$
    insert into public.user_state (user_id)
    values ('33333333-3333-4333-8333-333333333333')
  $$,
  '%permission denied for table user_state%',
  'anon não insere linhas'
);

reset role;
create temporary table user1_metadata_before
on commit drop
as
select created_at
from public.user_state
where user_id = '11111111-1111-4111-8111-111111111111';
grant select on user1_metadata_before to authenticated;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select lives_ok(
  $$
    update public.user_state
    set state_data = '{"updated":true}'::jsonb,
        revision = 99,
        created_at = '2030-01-01 00:00:00+00',
        updated_at = '2040-01-01 00:00:00+00',
        user_id = '22222222-2222-4222-8222-222222222222'
    where user_id = '11111111-1111-4111-8111-111111111111'
  $$,
  'UPDATE da própria linha é permitido'
);
select is(
  (select revision from public.user_state),
  2::bigint,
  'revision aumenta exatamente uma unidade'
);
select ok(
  (select updated_at <> '2040-01-01 00:00:00+00'::timestamptz
   from public.user_state),
  'updated_at do UPDATE ignora o valor do cliente'
);
select is(
  (select created_at from public.user_state),
  (select created_at from user1_metadata_before),
  'created_at não pode ser reescrito'
);
select is(
  (select user_id from public.user_state),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'user_id não pode ser trocado'
);
select is(
  (select state_data from public.user_state),
  '{"updated":true}'::jsonb,
  'state_data é atualizado normalmente'
);

select set_config(
  'request.jwt.claim.sub',
  '33333333-3333-4333-8333-333333333333',
  true
);
select throws_like(
  $$
    insert into public.user_state (user_id, state_data)
    values (
      '33333333-3333-4333-8333-333333333333',
      '[]'::jsonb
    )
  $$,
  '%user_state_data_is_object%',
  'state_data rejeita array'
);
select throws_like(
  $$
    insert into public.user_state (user_id, state_data)
    values (
      '33333333-3333-4333-8333-333333333333',
      '"text"'::jsonb
    )
  $$,
  '%user_state_data_is_object%',
  'state_data rejeita string'
);
select throws_like(
  $$
    insert into public.user_state (user_id, state_data)
    values (
      '33333333-3333-4333-8333-333333333333',
      '42'::jsonb
    )
  $$,
  '%user_state_data_is_object%',
  'state_data rejeita número'
);
select throws_like(
  $$
    insert into public.user_state (user_id, state_data)
    values (
      '33333333-3333-4333-8333-333333333333',
      'null'::jsonb
    )
  $$,
  '%user_state_data_is_object%',
  'state_data rejeita null JSON'
);
select throws_like(
  $$
    insert into public.user_state (user_id, schema_version)
    values ('33333333-3333-4333-8333-333333333333', 0)
  $$,
  '%user_state_schema_version_positive%',
  'schema_version menor que 1 é rejeitada'
);
select throws_like(
  $$
    insert into public.user_state (user_id, revision)
    values ('33333333-3333-4333-8333-333333333333', 0)
  $$,
  '%user_state_revision_positive%',
  'revision menor que 1 é rejeitada'
);

reset role;
delete from auth.users
where id = '11111111-1111-4111-8111-111111111111';
select is(
  (
    select count(*)::integer
    from public.user_state
    where user_id = '11111111-1111-4111-8111-111111111111'
  ),
  0,
  'excluir auth.users remove o user_state relacionado'
);

select * from finish();
rollback;
