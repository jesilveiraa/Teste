-- ============================================================================
-- KNN Saguaçu - Planejador de Conteúdo
-- Schema inicial do banco de dados Supabase
-- ============================================================================
-- COMO USAR:
-- 1. Crie um projeto no supabase.com
-- 2. No painel, vá em SQL Editor
-- 3. Cole este arquivo inteiro e clique em RUN
-- 4. Em Authentication > Users, crie as contas dos membros da equipe
-- ============================================================================

-- Tabela 1: configuração da marca (linha única, compartilhada por toda a equipe)
create table if not exists brand_config (
  id int primary key default 1,
  tone text default 'Descontraído, acessível, próximo',
  audience text default 'Faixa etária ampla — crianças a partir de 4 anos até adultos',
  differentials text default 'Van exclusiva que busca alunos em casa, foco em conversação',
  avoid text default 'Linguagem muito formal ou técnica',
  api_key text default '',
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

-- Garante que sempre existe a linha 1
insert into brand_config (id) values (1) on conflict (id) do nothing;

-- Tabela 2: dados do mês (inegociáveis, promoções, pilares ativos)
create table if not exists months (
  year int not null,
  month int not null,
  promotions text default '',
  inegociaveis text default '',
  pilares text[] default '{}',
  updated_at timestamptz default now(),
  primary key (year, month)
);

-- Tabela 3: ideias de conteúdo (geradas por IA ou adicionadas manualmente)
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null,
  title text not null,
  pillar text,
  format text,
  funnel_stage text,
  objective text,
  rationale text,
  status text default 'pending',
  manual boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_ideas_year_month on ideas(year, month);
create index if not exists idx_ideas_status on ideas(status);

-- Tabela 4: posts (roteiros completos, gerados a partir de ideias aprovadas)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references ideas(id) on delete set null,
  year int not null,
  month int not null,
  scheduled_date date,
  format text,
  pillar text,
  funnel_stage text,
  objective text,
  theme text,
  script text,
  caption text,
  hashtags text,
  status text default 'planned',
  instagram_url text,
  metrics jsonb default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_posts_year_month on posts(year, month);
create index if not exists idx_posts_status on posts(status);

-- ============================================================================
-- Row Level Security (RLS)
-- Qualquer usuário autenticado pode ler/escrever em todas as tabelas.
-- Este é um workspace compartilhado — não rastreamos autoria por enquanto.
-- ============================================================================

alter table brand_config enable row level security;
alter table months enable row level security;
alter table ideas enable row level security;
alter table posts enable row level security;

drop policy if exists "auth all brand" on brand_config;
drop policy if exists "auth all months" on months;
drop policy if exists "auth all ideas" on ideas;
drop policy if exists "auth all posts" on posts;

create policy "auth all brand" on brand_config
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth all months" on months
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth all ideas" on ideas
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth all posts" on posts
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
