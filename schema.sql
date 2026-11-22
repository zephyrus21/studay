create extension if not exists pgcrypto;

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  icon text not null,
  created_at timestamptz not null default now()
);
create index if not exists subjects_user_id_idx on subjects(user_id);

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  date date not null,
  created_at timestamptz not null default now()
);
create index if not exists exams_subject_id_idx on exams(subject_id);

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

create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  subtopic_id uuid not null references subtopics(id) on delete cascade,
  kind text not null check (kind in ('class','self','revise')),
  due date not null,
  done_at timestamptz,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists todos_user_due_idx on todos(user_id, due);
create index if not exists todos_subtopic_id_idx on todos(subtopic_id);

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chats_user_updated_idx on chats(user_id, updated_at desc);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_chat_idx on chat_messages(chat_id, created_at);

create table if not exists ai_usage (
  user_id text not null,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
