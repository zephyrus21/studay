create extension if not exists pgcrypto;

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  icon text not null,
  exam_date date,
  created_at timestamptz not null default now()
);
create index if not exists subjects_user_id_idx on subjects(user_id);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists topics_subject_id_idx on topics(subject_id);

create table if not exists subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  name text not null,
  notes text not null default '',
  in_class boolean not null default false,
  self_study boolean not null default false,
  revision_count int not null default 0 check (revision_count >= 0),
  last_revised_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subtopics_topic_id_idx on subtopics(topic_id);

create table if not exists ai_usage (
  user_id text not null,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
