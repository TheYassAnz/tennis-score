# Tennis Score

Application web pour compter les points d'un match de tennis en direct et suivre les résultats d'un club : historique, statistiques personnelles et classement.

Pensée pour le mobile : pendant un match, deux grands boutons occupent l'écran, un par équipe. Un tap = un point.

## Fonctionnalités

- **Score en direct** : jeux, sets et tie-break calculés automatiquement, avec annulation du dernier point.
- **Saisie manuelle** : entrer directement le score des sets d'un match déjà joué.
- **Simple et double** : choix des joueurs parmi les membres du club.
- **Historique** des matchs terminés, filtrable par victoire / défaite.
- **Statistiques** : victoires, défaites, sets, jeux et bilan face à chaque adversaire.
- **Classement** du club par nombre de victoires.
- **Profils** publics avec avatar (recadrage à l'upload).
- **Comptes** : inscription, connexion par pseudo ou email, mot de passe oublié par email.
- **Thèmes** clair / sombre.

## Règles appliquées

- Match en 2 sets gagnants (best-of-3).
- Un set se gagne à 6 jeux avec 2 jeux d'écart, ou 7-5.
- Tie-break à 6-6 : premier à 7 points avec 2 points d'écart.

## Stack

| Partie | Technologies |
| --- | --- |
| `client/` | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| `server/` | Node.js, Express 5, Prisma 7, PostgreSQL |
| Auth | JWT (30 jours) stocké dans `localStorage`, mots de passe hachés avec bcryptjs |
| Emails | [Resend](https://resend.com) (réinitialisation du mot de passe) |
| Images | Multer + Sharp (avatars convertis en WebP) |

## Démarrage rapide

### Prérequis

- Node.js 20+
- Une base PostgreSQL (locale, Docker ou hébergée)

### 1. Serveur

```bash
cd server
cp .env.example .env   # puis remplir les valeurs
npm install
npm run db:push        # crée les tables
npm run dev            # http://localhost:4000
```

### 2. Client

```bash
cd client
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api" > .env.local
npm install
npm run dev            # http://localhost:3000
```

## Variables d'environnement

**`server/.env`**

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL |
| `JWT_SECRET` | Secret de signature des tokens (valeur aléatoire longue) |
| `PORT` | Port du serveur (défaut `4000`) |
| `CLIENT_URL` | Origine autorisée par CORS (ex. `http://localhost:3000`) |
| `RESEND_API_KEY` | Clé API Resend, pour l'email « mot de passe oublié » |
| `RESEND_FROM` | Expéditeur des emails (ex. `Tennis Score <noreply@ton-domaine.com>`) |

**`client/.env.local`**

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL de l'API (ex. `http://localhost:4000/api`) |

## Scripts

| Dossier | Commande | Rôle |
| --- | --- | --- |
| `client/` | `npm run dev` / `build` / `start` / `lint` | Next.js |
| `server/` | `npm run dev` | Serveur avec rechargement (nodemon) |
| `server/` | `npm run start` | Serveur en production |
| `server/` | `npm run db:migrate` | `prisma migrate dev` |
| `server/` | `npm run db:push` | Synchronise le schéma sans migration |
| `server/` | `npm run db:generate` | Régénère le client Prisma |

## Architecture

```
client/
  app/          pages (dashboard, match, historique, stats, classement, profil, auth)
  components/   composants UI (MatchCard, ManualResult, BottomNav, Avatar…)
  context/      AuthContext (utilisateur connecté), ThemeContext
  lib/api.ts    appels API et types TypeScript

server/
  server.js             point d'entrée Express
  prisma/schema.prisma  modèle de données
  src/lib/tennis.js     logique de score pure (sans base de données)
  src/middleware/auth.js vérification du JWT
  src/routes/           auth, matches, stats, leaderboard, users
```

### Flux d'un point en direct

1. Le client appelle `POST /api/matches/:id/point` avec `{ scorer: 'HOME' | 'AWAY' }`.
2. Le serveur charge les points et les sets déjà terminés.
3. `tennis.js` détermine si le jeu, le set ou le match est fini.
4. Le point est enregistré, ainsi qu'un nouveau set ou la fin du match si besoin.
5. La réponse contient le match et l'état du score recalculé.

`DELETE /api/matches/:id/point` annule le dernier point.

### Modèle de données

- `User` : compte, profil et avatar.
- `Match` : type (`SINGLE` / `DOUBLE`), mode (`LIVE` / `MANUAL`), statut et équipe gagnante.
- `MatchPlayer` : relie un joueur à un côté (`HOME` / `AWAY`) et une position.
- `Set` : sets terminés uniquement ; le set en cours est calculé à partir des points.
- `Point` : points joués, en mode `LIVE` seulement.

## API

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Inscription |
| `POST` | `/api/auth/login` | Connexion (pseudo ou email) |
| `GET` / `PATCH` | `/api/auth/me` | Profil de l'utilisateur connecté |
| `GET` | `/api/auth/check` | Disponibilité d'un pseudo ou d'un email |
| `POST` | `/api/auth/forgot-password` | Envoi de l'email de réinitialisation |
| `POST` | `/api/auth/reset-password` | Nouveau mot de passe |
| `GET` / `POST` | `/api/matches` | Liste / création de matchs |
| `GET` / `PATCH` / `DELETE` | `/api/matches/:id` | Détail / modification / suppression |
| `POST` / `DELETE` | `/api/matches/:id/point` | Ajouter / annuler un point |
| `POST` | `/api/matches/:id/result` | Score final d'un match en saisie manuelle |
| `GET` | `/api/stats/:userId` | Statistiques d'un joueur |
| `GET` | `/api/leaderboard` | Classement du club |
| `GET` | `/api/users` | Membres du club |
| `POST` / `DELETE` | `/api/users/avatar` | Ajouter / supprimer son avatar |

Toutes les routes sauf l'inscription, la connexion, `check` et la réinitialisation du mot de passe demandent un header `Authorization: Bearer <token>`.

## Déploiement

Le serveur contient un `vercel.json` pour être déployé sur Vercel comme fonction Node. Le client se déploie comme n'importe quelle app Next.js.

Les avatars sont écrits dans `server/uploads/`, sur le disque du serveur. Sur un hébergement sans disque persistant (Vercel par exemple), ils seront perdus à chaque redéploiement.
