-- ===========================================================================
-- Groundwork demo seed (PostgreSQL / Supabase)
-- Loads the "Creative Memory" validation project with a deliberately MIXED set
-- of interviews: strong support, low urgency, and a flat contradiction.
--
-- Prereq: schema.sql has been run and you have a real auth user.
-- Set the owner before running, e.g. in the Supabase SQL editor:
--     \set owner_id 'PASTE-AUTH-USER-UUID'
-- or replace :'owner_id' below with a quoted uuid literal.
-- ===========================================================================

begin;

-- Ensure the profile row exists for the demo owner.
insert into profiles (id, full_name)
values (:'owner_id', 'Demo Founder')
on conflict (id) do nothing;

-- --- Project ---------------------------------------------------------------
with p as (
  insert into projects (owner_id, name, problem_statement, solution_idea, industry, stage, decision_to_make, deadline, confidence)
  values (
    :'owner_id',
    'Creative Memory',
    'Performance marketing teams struggle to retain and apply learnings from high volumes of advertising creative, causing repeated mistakes and wasted ad spend.',
    'A shared library that tags every creative with its results and surfaces past learnings when briefing a new one.',
    'Marketing technology', 'Idea / pre-seed',
    'Is the pain of losing creative learnings strong enough that a specific team would change how they work or pay to fix it?',
    '2026-09-30', 'low'
  )
  returning id
)
select id as project_id from p \gset

-- --- Segments --------------------------------------------------------------
insert into customer_segments (id, project_id, name, industry, role, company_size, geography, workflow, trigger_event, existing_alternative, frequency, severity, budget_ownership, accessibility, why_care, why_not_care) values
  (gen_random_uuid(), :'project_id', 'Performance marketers at DTC brands', 'Direct-to-consumer e-commerce', 'Performance / growth marketer', '20-200 employees', 'US / UK', 'Briefs and ships dozens of creatives per week across Meta and TikTok.', 'A previously winning creative fatigues and CAC spikes.', 'A shared Google Sheet of winners plus tribal memory.', 'Weekly', 4, 'Influences tool spend; manager approves.', 4, 'Directly measured on CAC and ROAS.', 'May feel their spreadsheet is good enough.'),
  (gen_random_uuid(), :'project_id', 'Heads of growth at venture-backed startups', 'B2C / B2B SaaS', 'Head of growth', '30-150 employees', 'US', 'Oversees a small team or agency; looks at dashboards weekly.', 'Board asks why blended CAC moved.', 'Agency reporting decks; Notion docs.', 'Monthly', 2, 'Owns the budget.', 3, 'Accountable for efficient growth.', 'Too far from the creative to feel the pain.'),
  (gen_random_uuid(), :'project_id', 'Creative strategists at ad agencies', 'Advertising / creative agency', 'Creative strategist', '10-500 employees', 'US / EU', 'Produces creative across multiple client accounts.', 'A client churns citing stale creative.', 'Per-client folders; senior staff memory.', 'Weekly', 3, 'No budget authority; recommends tools.', 3, 'Reputation depends on fresh creative.', 'Learnings are client-specific and confidential.'),
  (gen_random_uuid(), :'project_id', 'Founders running their own paid acquisition', 'Early-stage startups', 'Founder / CEO', '1-15 employees', 'Global', 'Runs ads themselves between everything else.', 'Runway pressure forces a hard look at ad efficiency.', 'Memory; the odd screenshot.', 'Sporadic', 2, 'Owns everything but budget is tiny.', 5, 'Every dollar matters.', 'Volume too low for the problem to bite.');

-- --- Hypotheses ------------------------------------------------------------
insert into hypotheses (id, project_id, title, type, belief, evidence_required, disconfirming, support_threshold, confidence, status, strength) values
  (gen_random_uuid(), :'project_id', 'The learning-loss problem is real', 'problem_exists',
   'We believe DTC performance marketers lose learnings from past creative when briefing new ones, causing repeated failed approaches. Supported when 4 of 7 describe a specific past repeat-mistake.',
   'A concrete story of repeating a creative mistake because the learning was lost.',
   'Participants remember their learnings fine, or ship too little creative for it to matter.', 4, 'medium', 'testing', 'mixed'),
  (gen_random_uuid(), :'project_id', 'It happens often enough to matter', 'problem_frequent',
   'We believe DTC performance marketers face this at least weekly because of creative volume. Supported when 4+ describe it recurring weekly.',
   'Frequency described as weekly or higher, tied to a real cadence.',
   'It comes up only occasionally, or only during rare launches.', 4, 'medium', 'testing', 'strong'),
  (gen_random_uuid(), :'project_id', 'The consequence is severe enough to act on', 'problem_urgent',
   'We believe wasted spend and repeated mistakes are painful enough that teams would change their workflow. Supported when 4+ name a real, sizeable consequence.',
   'A quantified or clearly felt consequence of the lost learning.',
   'Teams shrug it off; the cost is invisible or absorbed.', 4, 'low', 'testing', 'weak'),
  (gen_random_uuid(), :'project_id', 'They have budget and will spend on it', 'has_budget',
   'We believe DTC growth teams already spend on creative-ops tooling and would pay for this. Supported when 3+ show existing spend.',
   'Existing spend on creative analytics / ops tools.',
   'No budget line; solved with free spreadsheets they are happy with.', 3, 'low', 'testing', 'mixed');

-- --- A representative slice of the mixed interviews ------------------------
-- Strong support: real spend, a workaround, and a quantified consequence.
insert into interviews (project_id, segment_id, participant_name, company, role, interview_date, interviewer, raw_notes, pain_points, consequences, existing_spend, frequency, commitments)
select :'project_id', s.id, 'Maya R.', 'Loop Supplements (DTC)', 'Senior Performance Marketer', '2026-07-20', 'You',
  'Last month we relaunched a testimonial angle we had already killed in Q1 because it tanked. Nobody remembered. We wasted about $6,000 before someone found the old screenshot. This happens basically every week now because we ship 30-40 creatives a week. We pay for Motion, about $400 a month. Happy to set up a call with our head of growth.',
  'Repeating a killed angle; sheet always stale.', '~$6,000 wasted on a re-run dud.', '~$400/mo Motion + Foreplay.', 'Weekly (30-40 creatives/week).', 'Offered intro to head of growth.'
from customer_segments s where s.project_id = :'project_id' and s.name like 'Performance marketers%';

-- Low urgency: frequent but no felt consequence, no spend.
insert into interviews (project_id, segment_id, participant_name, company, role, interview_date, interviewer, raw_notes, pain_points, consequences, existing_spend, frequency, commitments)
select :'project_id', s.id, 'Devin K.', 'NorthPeak (DTC apparel)', 'Growth Marketer', '2026-07-22', 'You',
  'Yeah it happens weekly, we ship a lot of creative. But honestly it is not really a big deal, we just move on to the next test. I could not tell you a time it actually cost us money. We use a spreadsheet and it is fine as is.',
  'Mild; deprioritised.', 'None he could name.', 'None specific.', 'Weekly.', 'None.'
from customer_segments s where s.project_id = :'project_id' and s.name like 'Performance marketers%';

-- Contradiction: wrong segment, not a felt problem.
insert into interviews (project_id, segment_id, participant_name, company, role, interview_date, interviewer, raw_notes, pain_points, consequences, existing_spend, frequency, commitments)
select :'project_id', s.id, 'Tom B.', 'Fernwood (seed startup)', 'Founder', '2026-07-26', 'You',
  'I run our ads myself. Honestly I only make a handful of creatives a month so I remember them fine. This is a cool idea and bigger teams would love it, but for me it is not a problem. I have never had this happen in a way that hurt.',
  'Not felt at his volume.', 'None.', 'None.', 'Rare.', 'None.'
from customer_segments s where s.project_id = :'project_id' and s.name like 'Founders running%';

commit;

-- After loading, the app can read these rows once VITE_SUPABASE_URL /
-- VITE_SUPABASE_ANON_KEY are set and the store layer is pointed at Supabase.
