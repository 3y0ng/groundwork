-- ===========================================================================
-- Groundwork database schema (PostgreSQL / Supabase)
-- Mirrors src/types/domain.ts. Row Level Security scopes every row to its
-- owner. Run this in the Supabase SQL editor, then seed.sql for demo data.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- --- Enums -----------------------------------------------------------------
create type hypothesis_type as enum (
  'problem_exists','problem_frequent','problem_urgent','solutions_inadequate',
  'has_budget','actively_searching','reachable','buyer_user_identifiable',
  'value_prop_compelling','will_commit'
);
create type evidence_strength as enum ('none','weak','mixed','strong','contradicted');
create type hypothesis_status as enum ('untested','testing','supported','partially_supported','inconclusive','contradicted');
create type confidence_level as enum ('very_low','low','medium','high','very_high');
create type evidence_kind as enum (
  'observed_past_behaviour','current_behaviour','existing_commitment','new_commitment',
  'stated_opinion','hypothetical','compliment','contradiction'
);
create type evidence_direction as enum ('supports','contradicts','unclear');
create type decision_type as enum (
  'continue_testing','narrow_segment','refine_hypothesis','test_related',
  'proceed_to_solution','pause','reject','pivot'
);
create type insight_level as enum ('interview','segment','hypothesis','project');

-- --- Core tables -----------------------------------------------------------
-- Auth users come from Supabase's auth.users. `profiles` is the app-facing row.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  problem_statement text not null default '',
  solution_idea text,
  industry text default '',
  stage text default '',
  decision_to_make text default '',
  deadline date,
  confidence confidence_level not null default 'low',
  created_at timestamptz not null default now()
);

create table customer_segments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  industry text default '',
  role text default '',
  company_size text default '',
  geography text default '',
  workflow text default '',
  trigger_event text default '',
  existing_alternative text default '',
  frequency text default '',
  severity int not null default 3 check (severity between 1 and 5),
  budget_ownership text default '',
  accessibility int not null default 3 check (accessibility between 1 and 5),
  why_care text default '',
  why_not_care text default ''
);

create table hypotheses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  type hypothesis_type not null default 'problem_exists',
  belief text not null default '',
  assumptions text[] not null default '{}',
  evidence_required text default '',
  disconfirming text default '',
  support_threshold int not null default 4,
  confidence confidence_level not null default 'low',
  status hypothesis_status not null default 'untested',
  strength evidence_strength not null default 'none',
  created_at timestamptz not null default now()
);

-- Many-to-many: a hypothesis can relate to many segments.
create table hypothesis_segments (
  hypothesis_id uuid references hypotheses(id) on delete cascade,
  segment_id uuid references customer_segments(id) on delete cascade,
  primary key (hypothesis_id, segment_id)
);

create table interviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  segment_id uuid references customer_segments(id) on delete set null,
  participant_name text not null default '',
  company text default '',
  role text default '',
  interview_date date not null default current_date,
  interviewer text default '',
  raw_notes text not null default '',
  transcript text,
  -- structured capture
  key_quotes text[] not null default '{}',
  current_workflow text default '',
  trigger_events text default '',
  pain_points text default '',
  consequences text default '',
  existing_tools text default '',
  existing_spend text default '',
  workarounds text default '',
  frequency text default '',
  severity text default '',
  decision_process text default '',
  commitments text default '',
  follow_ups text default '',
  created_at timestamptz not null default now()
);

-- Many-to-many: an interview can test multiple hypotheses.
create table interview_hypotheses (
  interview_id uuid references interviews(id) on delete cascade,
  hypothesis_id uuid references hypotheses(id) on delete cascade,
  primary key (interview_id, hypothesis_id)
);

-- Saved question templates (each row is one guide).
create table interview_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table interview_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references interview_templates(id) on delete cascade,
  section text not null,
  text text not null,
  rationale text,
  position int not null default 0
);

create table evidence_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  interview_id uuid not null references interviews(id) on delete cascade,
  segment_id uuid references customer_segments(id) on delete set null,
  statement text not null,
  quote text not null,                 -- verbatim from notes; never AI-generated
  kind evidence_kind not null,
  direction evidence_direction not null default 'unclear',
  strength evidence_strength not null default 'weak',
  founder_interpretation text default '',
  ai_interpretation text default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Many-to-many: one evidence item can support/contradict several hypotheses.
create table evidence_hypotheses (
  evidence_id uuid references evidence_items(id) on delete cascade,
  hypothesis_id uuid references hypotheses(id) on delete cascade,
  primary key (evidence_id, hypothesis_id)
);

create table decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  hypothesis_id uuid not null references hypotheses(id) on delete cascade,
  decision decision_type not null,
  evidence_basis text default '',
  remaining_uncertainty text default '',
  next_test text default '',
  would_change_mind text default '',
  created_at timestamptz not null default now()
);

create table insights (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  level insight_level not null default 'project',
  ref_id uuid,                          -- optional pointer to hypothesis/segment/interview
  title text not null,
  body text default '',
  created_at timestamptz not null default now()
);

-- --- Helpful indexes -------------------------------------------------------
create index on projects (owner_id);
create index on hypotheses (project_id);
create index on customer_segments (project_id);
create index on interviews (project_id);
create index on evidence_items (project_id);
create index on evidence_items (interview_id);
create index on decisions (hypothesis_id);
create index on insights (project_id);

-- ===========================================================================
-- Row Level Security: a user can only touch rows inside projects they own.
-- ===========================================================================
alter table profiles            enable row level security;
alter table projects            enable row level security;
alter table customer_segments   enable row level security;
alter table hypotheses          enable row level security;
alter table hypothesis_segments enable row level security;
alter table interviews          enable row level security;
alter table interview_hypotheses enable row level security;
alter table interview_templates enable row level security;
alter table interview_questions enable row level security;
alter table evidence_items      enable row level security;
alter table evidence_hypotheses enable row level security;
alter table decisions           enable row level security;
alter table insights            enable row level security;

create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own projects" on projects
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Reusable: does the current user own the project this row belongs to?
create or replace function owns_project(pid uuid) returns boolean
language sql stable security definer as $$
  select exists (select 1 from projects p where p.id = pid and p.owner_id = auth.uid());
$$;

create policy "project-scoped segments"   on customer_segments   for all using (owns_project(project_id)) with check (owns_project(project_id));
create policy "project-scoped hypotheses" on hypotheses          for all using (owns_project(project_id)) with check (owns_project(project_id));
create policy "project-scoped interviews" on interviews          for all using (owns_project(project_id)) with check (owns_project(project_id));
create policy "project-scoped templates"  on interview_templates for all using (owns_project(project_id)) with check (owns_project(project_id));
create policy "project-scoped evidence"   on evidence_items      for all using (owns_project(project_id)) with check (owns_project(project_id));
create policy "project-scoped decisions"  on decisions           for all using (owns_project(project_id)) with check (owns_project(project_id));
create policy "project-scoped insights"   on insights            for all using (owns_project(project_id)) with check (owns_project(project_id));

-- Join tables inherit access from their parent hypothesis/interview/evidence.
create policy "hs join" on hypothesis_segments for all
  using (exists (select 1 from hypotheses h where h.id = hypothesis_id and owns_project(h.project_id)))
  with check (exists (select 1 from hypotheses h where h.id = hypothesis_id and owns_project(h.project_id)));
create policy "ih join" on interview_hypotheses for all
  using (exists (select 1 from interviews i where i.id = interview_id and owns_project(i.project_id)))
  with check (exists (select 1 from interviews i where i.id = interview_id and owns_project(i.project_id)));
create policy "eh join" on evidence_hypotheses for all
  using (exists (select 1 from evidence_items e where e.id = evidence_id and owns_project(e.project_id)))
  with check (exists (select 1 from evidence_items e where e.id = evidence_id and owns_project(e.project_id)));
create policy "iq join" on interview_questions for all
  using (exists (select 1 from interview_templates t where t.id = template_id and owns_project(t.project_id)))
  with check (exists (select 1 from interview_templates t where t.id = template_id and owns_project(t.project_id)));

-- On signup, mirror the auth user into profiles.
create or replace function handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
