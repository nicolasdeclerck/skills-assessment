# Skills Portfolio

Application web permettant à chaque utilisateur de documenter les activités de
sa carrière et d'y associer des compétences avec un niveau de maîtrise. Pensée
pour l'**auto-hébergement** (ex. Traefik + Docker Compose) et le **multi-utilisateurs**.

## Stack

- **Backend** : Django 5 + Django REST Framework, authentification JWT via
  `djoser` + `djangorestframework-simplejwt`. SQLite par défaut (un simple fichier),
  Postgres pris en charge via `DATABASE_URL`.
- **Frontend** : Vite + React 18 + TypeScript + Tailwind CSS + TanStack Query,
  servi en statique par nginx en production.
- **Déploiement** : Docker Compose avec labels Traefik (HTTPS automatique via
  le certresolver de Traefik).

## Modèle de données

- `User` (modèle personnalisé, email comme identifiant)
- `Activity` — titre, organisation, description, dates, appartient à un `User`
- `Skill` — nom + niveau (1–5), rattachée à une `Activity`

Chaque requête API filtre strictement sur `request.user` → isolation totale des
données entre utilisateurs.

## Endpoints principaux

| Méthode | URL                                  | Description                           |
| ------- | ------------------------------------ | ------------------------------------- |
| POST    | `/api/auth/users/`                   | Inscription                           |
| POST    | `/api/auth/jwt/create/`              | Login (retourne access + refresh)     |
| POST    | `/api/auth/jwt/refresh/`             | Rafraîchir le token                   |
| GET     | `/api/auth/users/me/`                | Profil utilisateur courant            |
| GET/POST| `/api/activities/`                   | Lister / créer une activité           |
| GET/PUT/DELETE | `/api/activities/{id}/`       | Détail / mise à jour / suppression    |
| GET     | `/api/activities/skills-summary/`    | Synthèse agrégée des compétences      |
| GET/POST| `/api/skills/`                       | Accès fin aux compétences             |

## Développement local

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .
python manage.py migrate
python manage.py createsuperuser   # optionnel, pour l'admin Django
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxy toutes les requêtes `/api` vers `http://localhost:8000` par défaut
(cf. `vite.config.ts`). L'app est servie sur http://localhost:5173.

## Déploiement auto-hébergé (Traefik)

Le fichier `docker-compose.yml` fourni s'attend à une instance Traefik déjà
en place sur la machine et connectée à un réseau externe.

1. Copier `.env.example` vers `.env` et remplir :
   ```
   DOMAIN_WEB=portfolio.mondomaine.fr
   DOMAIN_API=api.portfolio.mondomaine.fr
   DJANGO_SECRET_KEY=$(openssl rand -base64 48)
   TRAEFIK_NETWORK=traefik
   TRAEFIK_CERT_RESOLVER=letsencrypt
   ```
2. S'assurer que les deux domaines pointent en DNS vers le serveur Traefik.
3. Lancer :
   ```bash
   docker compose up -d --build
   ```
4. Créer un superuser pour l'admin Django :
   ```bash
   docker compose exec api python manage.py createsuperuser
   ```

Traefik s'occupe du TLS (via le `certresolver` configuré côté Traefik), route
`DOMAIN_WEB` vers le conteneur `web` (nginx + build React) et `DOMAIN_API` vers
le conteneur `api` (Gunicorn + Django).

### Postgres (optionnel)

Décommenter la section `db` dans `docker-compose.yml`, la ligne `DATABASE_URL`
dans le service `api`, renseigner `POSTGRES_PASSWORD` dans `.env`. La migration
vers Postgres se fait au prochain `docker compose up`.

### Sauvegarde

- **SQLite** : volume `api-data` → contient `/app/data/db.sqlite3`. Sauvegarder
  ce fichier (par exemple via `docker compose cp api:/app/data/db.sqlite3 ./backup.sqlite3`).
- **Postgres** : `docker compose exec db pg_dump -U portfolio portfolio > backup.sql`.

## Structure du repo

```
.
├── backend/              # Django + DRF
│   ├── config/           # settings, urls, wsgi
│   ├── accounts/         # User model + serializers
│   ├── portfolio/        # Activity + Skill (modèles, vues, serializers)
│   ├── manage.py
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/             # Vite + React + TypeScript
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── activities/
│   │   │   └── skills/
│   │   ├── lib/          # API client, types
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml    # Orchestration + labels Traefik
└── .env.example
```
