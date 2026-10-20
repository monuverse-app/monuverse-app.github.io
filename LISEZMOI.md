# Monuverse v1

Une seule boucle de jeu : **ta ville, ses vrais lieux, un scan par GPS, une série quotidienne, un classement local.**

| Ce que fait la v1 | Comment |
|---|---|
| Des dizaines de lieux dans chaque ville du monde | Statues, fontaines, églises, fresques, monuments aux morts, châteaux, musées, parcs… chargés depuis OpenStreetMap |
| Un scan qui marche à chaque fois | Le lieu se débloque par GPS quand on est à moins de 30 à 150 m selon sa taille. La photo est un souvenir facultatif |
| Un premier plaisir immédiat | « Ta ville contient 47 lieux » + une première carte offerte dès l'arrivée |
| Une raison de revenir chaque jour | Série de jours, défi du jour, lieu du jour à XP doublée |
| Une image à partager | Story 1080 × 1920 (format Instagram/TikTok) avec le pourcentage de la ville et les dernières cartes |
| Du social local | Classement de la ville et du département (Val-de-Marne, etc.) |
| Un globe à remplir | Tes villes sur une Terre en 3D qui tourne au doigt, chaque pays commencé s'allume en or |

## Contenu du dossier

- `index.html`, `style.css`, `app.js` : l'appli
- `config.js` : les deux réglages du classement (à remplir à l'étape 3)
- `world.json`, `lib/d3.min.js` : la carte du monde et l'outil qui dessine le globe
- `manifest.webmanifest`, `sw.js`, `icons/` : pour l'installer sur l'écran d'accueil et l'ouvrir hors ligne
- `supabase.sql` : la table du classement

## Étape 1 · Mettre l'appli en ligne (GitHub Pages, gratuit, 10 minutes)

1. Sur github.com, crée un nouveau dépôt **public** nommé `monuverse`.
2. Clique sur **uploading an existing file** et glisse **tout le contenu** du dossier (y compris le dossier `icons`). Valide avec **Commit changes**.
3. Va dans **Settings › Pages**. Dans *Source*, choisis **Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`. Enregistre.
4. Après une ou deux minutes, l'appli est en ligne à l'adresse `https://TON-PSEUDO-GITHUB.github.io/monuverse/`.

Le GPS ne fonctionne qu'en **https** : GitHub Pages le fournit automatiquement.

## Étape 2 · Tester sur ton téléphone

1. Ouvre l'adresse sur ton téléphone et autorise la localisation.
2. Choisis ta ville, ouvre ta carte de bienvenue.
3. Va dans **Explorer** et marche vers le lieu le plus proche : le bouton « Débloquer ce lieu » apparaît quand tu es assez près.
4. Pour l'installer comme une appli :
   - **iPhone (Safari)** : bouton Partager › « Sur l'écran d'accueil ».
   - **Android (Chrome)** : menu ⋮ › « Installer l'application » ou « Ajouter à l'écran d'accueil ».

## Étape 3 · Activer le classement en ligne (Supabase, gratuit, 15 minutes)

Sans cette étape, l'appli marche entièrement, mais l'écran Classement affiche « ouvre bientôt ».

1. Crée un compte sur supabase.com, puis un nouveau projet (région : Europe, Paris ou Francfort).
2. **Authentication › Sign In / Providers** : active **Allow anonymous sign-ins**. Les joueurs n'ont ainsi besoin ni d'e-mail ni de mot de passe : un pseudo suffit.
3. **SQL Editor › New query** : colle le contenu de `supabase.sql` et clique sur **Run**.
4. **Project Settings › API** : copie la **Project URL** et la clé **anon public**.
5. Colle-les dans `config.js`, puis remplace ce fichier sur GitHub :

```js
window.MONUVERSE_CONFIG = {
  supabaseUrl: 'https://xxxxxxxx.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi...'
};
```

La clé « anon » est faite pour être publique. Ce qui protège les données, ce sont les règles du fichier `supabase.sql` : chacun peut lire le classement, mais ne peut modifier que sa propre ligne.

## À savoir avant d'ouvrir au public

- **Mentions obligatoires.** Les lieux viennent d'OpenStreetMap (licence ODbL) : la mention « © contributeurs OpenStreetMap » est déjà affichée dans l'appli. Garde-la.
- **Limites des services gratuits.** Les lieux sont chargés via les serveurs publics Overpass et Nominatim d'OpenStreetMap. Ils suffisent pour un lancement de quelques centaines de joueurs (chaque ville est chargée une fois, puis gardée 14 jours sur le téléphone). Au-delà de quelques milliers de joueurs, il faudra un serveur à toi ou un fournisseur payant.
- **Triche.** La v1 vérifie le GPS sur le téléphone. Quelqu'un de motivé peut fausser sa position. Pour un classement avec des lots à gagner, il faudra une vérification côté serveur.
- **Données personnelles (RGPD).** La position ne quitte jamais le téléphone. Seuls le pseudo, la ville et les points partent au classement. Les photos restent sur le téléphone. Il faudra quand même une page « Confidentialité » et des mentions légales avant un lancement public.
- **Lieu manquant ?** Il suffit de l'ajouter sur openstreetmap.org : il apparaîtra dans Monuverse à la prochaine mise à jour de la ville (Profil › Mettre à jour les lieux).

## Ce qui n'est volontairement pas dans la v1

Reconnaissance par IA, échanges, quiz, album imprimé, métro, amis. On les ajoutera une fois la boucle validée : si les joueurs reviennent d'eux-mêmes la semaine suivante.
