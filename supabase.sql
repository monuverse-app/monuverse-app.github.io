-- Monuverse : table du classement.
-- À coller dans Supabase > SQL Editor > New query, puis « Run ».
-- Avant : Authentication > Sign In / Providers > activer « Allow anonymous sign-ins ».

create table if not exists public.joueurs (
  id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  pseudo      text not null check (char_length(pseudo) between 2 and 20),
  ville       text,
  ville_id    text,
  departement text,
  pays        text,
  points      integer not null default 0 check (points between 0 and 1000000),
  lieux       integer not null default 0 check (lieux between 0 and 100000),
  updated_at  timestamptz not null default now()
);

create index if not exists joueurs_ville_idx on public.joueurs (ville_id, points desc);
create index if not exists joueurs_dep_idx   on public.joueurs (departement, points desc);

alter table public.joueurs enable row level security;

-- Tout le monde peut lire le classement.
drop policy if exists "classement public" on public.joueurs;
create policy "classement public" on public.joueurs
  for select to anon, authenticated using (true);

-- Chaque joueur ne peut créer, modifier ou supprimer que sa propre ligne.
drop policy if exists "ma ligne : creer" on public.joueurs;
create policy "ma ligne : creer" on public.joueurs
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "ma ligne : modifier" on public.joueurs;
create policy "ma ligne : modifier" on public.joueurs
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "ma ligne : supprimer" on public.joueurs;
create policy "ma ligne : supprimer" on public.joueurs
  for delete to authenticated using (auth.uid() = id);
