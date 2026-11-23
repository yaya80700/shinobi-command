# SHINOBI COMMAND

Dashboard d'administration Naruto RP pour Konoha, Kumo, Kiri, Iwa et Suna.

## Stack
- Next.js 16 (App Router)
- Supabase Auth + PostgreSQL + Row Level Security
- Déploiement Vercel

## Installation locale
1. Installer Node.js 22 ou supérieur.
2. Copier `.env.example` vers `.env.local`.
3. Renseigner l'URL Supabase et la clé **publishable** (jamais la clé `service_role`).
4. Lancer `npm install`, puis `npm run dev`.
5. Ouvrir http://localhost:3000.

## Configuration Supabase
Le projet Supabase associé est `snjvaervrsktfvolivbi` (région Paris). Les tables et règles RLS sont déjà préparées dans le projet.
Créer les comptes depuis Supabase Dashboard > Authentication > Users (pas d'inscription publique). Le trigger de profil crée le profil à la création du compte.

Pour attribuer le rôle super administrateur au premier compte, utiliser l'UUID de ce compte dans SQL Editor :
```sql
update public.profiles
set global_role = 'super_admin'
where id = 'UUID_DU_COMPTE';
```

Pour rattacher un membre à un village :
```sql
insert into public.village_memberships(user_id, village_id, role, rank_label, active)
values ('UUID_DU_COMPTE', 'KUMO', 'officer', 'Jônin', true)
on conflict (user_id, village_id) do update
set role = excluded.role, rank_label = excluded.rank_label, active = true;
```

Rôles village : `kage`, `admin`, `officer`, `reader`. Villages : `KUMO`, `KONOHA`, `KIRI`, `IWA`, `SUNA`.

## Sécurité
- Pas d'inscription publique.
- Sessions Supabase stockées dans des cookies via `@supabase/ssr`.
- Les accès aux lignes sont protégés par RLS côté base de données.
- Ne jamais ajouter de clé secrète ou `service_role` dans une variable `NEXT_PUBLIC_*`.

## État
Première version du dashboard : connexion, vue générale, villages accessibles, création de sanctions et bonnes actions, activité récente. La gestion avancée des comptes, permissions détaillées et fiches individuelles est à compléter dans les prochaines itérations.
