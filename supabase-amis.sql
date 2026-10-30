-- Monuverse : amis et invitations (à coller dans Supabase > SQL Editor, puis « Run »).
-- Le joueur invité garde l'identifiant de celui qui l'a invité (« parrain »).
-- Cette information n'est lisible par personne : seule la fonction mes_amis() s'en sert.

alter table public.joueurs add column if not exists parrain uuid;
alter table public.joueurs drop constraint if exists joueurs_parrain;
alter table public.joueurs add constraint joueurs_parrain check (parrain is null or parrain <> id);
create index if not exists joueurs_parrain_idx on public.joueurs (parrain);

grant insert (parrain), update (parrain) on public.joueurs to authenticated;

-- Le parrain ne change plus une fois choisi.
create or replace function public.joueurs_parrain_fixe() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.parrain is not null then new.parrain := old.parrain; end if;
  return new;
end $$;
drop trigger if exists joueurs_parrain_fixe on public.joueurs;
create trigger joueurs_parrain_fixe before update on public.joueurs
  for each row execute function public.joueurs_parrain_fixe();

-- Mes amis : moi, les joueurs de ma liste, ceux que j'ai invités, et celui qui m'a invité.
create or replace function public.mes_amis(ids uuid[] default '{}')
returns table (id uuid, pseudo text, ville text, points integer, lieux integer)
language sql stable security definer set search_path = public as $$
  select j.id, j.pseudo, j.ville, j.points, j.lieux
  from public.joueurs j
  where auth.uid() is not null and (
        j.id = auth.uid()
     or j.id = any ((coalesce(ids, '{}'::uuid[]))[1:200])
     or j.parrain = auth.uid()
     or j.id = (select m.parrain from public.joueurs m where m.id = auth.uid()))
  order by j.points desc
  limit 200;
$$;
revoke all on function public.mes_amis(uuid[]) from public, anon;
grant execute on function public.mes_amis(uuid[]) to authenticated;
