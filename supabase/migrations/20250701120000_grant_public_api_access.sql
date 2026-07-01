-- Restore PostgREST API access for anon/authenticated roles.
-- Tables were created with RLS policies but without table-level GRANTs,
-- which caused 403 responses from the Supabase REST API.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant usage, select on all sequences in schema public to postgres, service_role;
grant usage, select on all sequences in schema public to authenticated, anon;

grant execute on all functions in schema public to postgres, service_role;
grant execute on all functions in schema public to authenticated, anon;

alter default privileges in schema public
grant all on tables to postgres, service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant select on tables to anon;

alter default privileges in schema public
grant usage, select on sequences to postgres, service_role, authenticated, anon;

alter default privileges in schema public
grant execute on functions to postgres, service_role, authenticated, anon;
