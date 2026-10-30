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

-- ============ Sécurité et anti-triche ============
-- Formats autorisés : rien d'autre ne peut être enregistré.
alter table public.joueurs drop constraint if exists joueurs_formats;
alter table public.joueurs add constraint joueurs_formats check (
  pseudo ~ '^[[:alnum:] _.''-]{2,20}$'
  and (ville is null or char_length(ville) <= 80)
  and (ville_id is null or ville_id ~ '^([nwr][0-9]{1,12}|fr[0-9AB]{5}|x[0-9]{1,12})$')
  and (departement is null or char_length(departement) <= 140)
  and (pays is null or pays ~ '^[A-Z]{0,2}$')
);

-- Compteur de points gagnés dans l'heure, tenu par le serveur.
alter table public.joueurs add column if not exists heure_debut timestamptz not null default now();
alter table public.joueurs add column if not exists gain_heure integer not null default 0;

-- Règles de jeu vérifiées par le serveur à chaque envoi :
--  • on part de peu (pas de compte créé directement avec un gros score) ;
--  • au plus 1 000 points et 5 lieux de plus par envoi, 4 000 points par heure ;
--  • les points ne peuvent pas dépasser ce que les lieux débloqués permettent ;
--  • l'heure et l'identité sont fixées par le serveur, pas par le téléphone.
create or replace function public.joueurs_anti_triche() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    if new.points > 1000 or new.lieux > 10 then raise exception 'Score de départ refusé'; end if;
    new.heure_debut := now(); new.gain_heure := 0;
    return new;
  end if;
  new.id := old.id;
  if now() - old.heure_debut > interval '1 hour' then new.heure_debut := now(); new.gain_heure := 0;
  else new.heure_debut := old.heure_debut; new.gain_heure := old.gain_heure; end if;
  if new.points - old.points > 1000 or new.lieux - old.lieux > 5 then raise exception 'Progression trop rapide'; end if;
  new.gain_heure := new.gain_heure + greatest(new.points - old.points, 0);
  if new.gain_heure > 4000 then raise exception 'Trop de points en une heure'; end if;
  if new.points > new.lieux * 300 + 2000 then raise exception 'Points incohérents avec les lieux'; end if;
  return new;
end $$;
drop trigger if exists joueurs_anti_triche on public.joueurs;
create trigger joueurs_anti_triche before insert or update on public.joueurs
  for each row execute function public.joueurs_anti_triche();

-- Le classement public n'expose que ce qui sert à l'afficher.
revoke all on public.joueurs from anon;
grant select (id, pseudo, ville, ville_id, departement, pays, points, lieux) on public.joueurs to anon;

-- Joueurs connectés (connexion anonyme de l'appli) : uniquement les colonnes utiles, rien d'autre.
-- Fonctionne même si « Exposer automatiquement de nouvelles tables » est désactivé (recommandé).
revoke all on public.joueurs from authenticated;
grant select (id, pseudo, ville, ville_id, departement, pays, points, lieux) on public.joueurs to authenticated;
grant insert (id, pseudo, ville, ville_id, departement, pays, points, lieux) on public.joueurs to authenticated;
grant update (id, pseudo, ville, ville_id, departement, pays, points, lieux) on public.joueurs to authenticated;
grant delete on public.joueurs to authenticated;
grant usage on schema public to anon, authenticated;

-- Amis et invitations : voir supabase-amis.sql (à exécuter aussi).
