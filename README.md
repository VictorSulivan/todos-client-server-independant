# Todo List Application - CI/CD Pipeline

## Membres du groupe

| NOM | Prénom |
|-----|--------|
| Victor Sulivan — responsable du dépôt GitHub et de la pipeline CI/CD |
| Matheo (compte Vercel) — responsable du déploiement frontend |

## Architecture et choix techniques

### Stack technique

**Frontend (Client)**
- React 18 avec TypeScript
- Vite pour le build et le dev server
- TailwindCSS pour le styling
- Déployé sur Vercel

**Backend (Server)**
- Node.js 20 avec Express et TypeScript
- Sentry pour l'observabilité
- Déployé sur Render via une image Docker versionnée

### Structure du projet

```
todos-client-server-fork/
├── packages/
│   ├── client/          # Application React frontend
│   └── server/          # API Express backend
└── .github/
    └── workflows/       # GitHub Actions workflows
```

## Installation et exécution locale

### Prérequis
- Node.js 20.x
- npm
- Docker (pour tester le build backend)

### Installation

```bash
# Installer les dépendances du client
cd packages/client
npm install

# Installer les dépendances du serveur
cd ../server
npm install
```

### Exécution en développement

**Backend :**
```bash
cd packages/server
npm run dev
# Le serveur démarre sur http://localhost:3001
```

**Frontend :**
```bash
cd packages/client
npm run dev
# L'application démarre sur http://localhost:5173
```

### Tests & qualité

**Backend :**
```bash
cd packages/server
npm run test          # Tests unitaires
npm run coverage      # Tests avec couverture
```

**Frontend :**
```bash
cd packages/client
npm run lint          # ESLint
npm run typecheck     # Vérification TypeScript
```

**Commitlint (validation des commits) :**
```bash
cd packages/server
npm run commitlint

cd packages/client
npm run commitlint
```

### Build Docker backend

```bash
cd packages/server
docker build -f Dockerfile -t todo-server:local .
docker run --rm -e PORT=3001 -p 3001:3001 todo-server:local
```

## URLs de déploiement

**Frontend :**
- URL principale : `https://todos-client-server-independant-matheos-projects-558f8c3b.vercel.app`
- URL courte (dernière build) : `https://todos-client-server-independant-77loh0nbo.vercel.app`

**Backend :**
- URL : `https://todos-client-server-fork.onrender.com`
- API : `https://todos-client-server-fork.onrender.com/api/todos`

## Pipeline CI/CD

### Workflows GitHub Actions principaux

#### Qualité (push & PR)
- `install` : installation des dépendances frontend (mise en cache npm)
- `lint` : `npm run lint` dans `packages/client`
- `typecheck` : `npm run typecheck` dans `packages/client`
- `ci-server-tests` : tests backend (Vitest) + couverture
- `ci-commitlint` : validation des messages de commit
- `ci-security-npm` : `npm audit --audit-level=high` (client & serveur)

#### Packaging & sécurité
- `ci-docker` : build de l'image backend + scan Trivy (PR) / push vers Docker Hub (tags)

#### Déploiement (tags `v*.*.*` uniquement)
- `deploy-frontend` : déclenchement du build Vercel via CLI et suivi via l'API Vercel
- `deploy-backend` : déclenchement Render + polling API jusqu'à `READY`
- `smoke-test` : tests de disponibilité frontend/back (utilise `FRONTEND_URL` & `BACKEND_URL`)
- `notify-discord` : message Discord succès/échec

### Stratégie de déploiement

Le déploiement se déclenche **uniquement** lors de la création d'un tag Git au format `v*.*.*` (ex: `v1.0.0`).

**Processus :**
1. Création d'un tag : `git tag v1.0.0 && git push origin v1.0.0`
2. Build de l'image Docker avec le tag versionné : `voilacter/todo-server:v1.0.0`
3. Push de l'image sur Docker Hub
4. Déploiement frontend sur Vercel
5. Déclenchement du déploiement backend sur Render (utilise l'image versionnée)
6. Smoke tests pour valider les déploiements
7. Notification Discord du résultat

## Stratégie de rollback

En cas de problème avec une version déployée (ex: `v1.0.2` buggée), voici la procédure de rollback :

### Rollback backend (Render)

1. **Identifier la version précédente stable** (ex: `v1.0.1`)
2. **Redéployer l'image versionnée** :
   ```bash
   # L'image existe déjà sur Docker Hub : voilacter/todo-server:v1.0.1
   # Sur Render, changer l'image Docker utilisée vers : voilacter/todo-server:v1.0.1
   ```
3. **Ou déclencher manuellement le webhook Render** avec la version précédente :
   ```bash
   curl -X POST "$RENDER_DEPLOY_HOOK" \
     -H "Content-Type: application/json" \
     -d '{"version": "v1.0.1"}'
   ```

### Rollback frontend (Vercel)

1. **Via l'interface Vercel** : Aller dans les déploiements et restaurer la version précédente
2. **Ou via CLI** :
   ```bash
   vercel rollback [deployment-url]
   ```

### Avantages de cette stratégie

- ✅ **Images versionnées** : Chaque tag correspond à une image Docker spécifique sur Docker Hub
- ✅ **Traçabilité** : On sait exactement quelle version est déployée
- ✅ **Rollback rapide** : Pas besoin de rebuild, l'image existe déjà
- ✅ **Pas de `:latest`** : Évite les problèmes de versioning

## Observabilité - Sentry

L'application backend est instrumentée avec Sentry pour capturer les erreurs.

### Route de test
- `GET /debug-sentry` : Génère une erreur intentionnelle pour tester Sentry

### Configuration
- DSN configuré via variable d'environnement `SENTRY_DSN`
- Initialisation dans `packages/server/src/instrument.ts`

### Preuve d'intégration
- Déclencher `GET /debug-sentry` sur le backend puis vérifier que l'événement apparaît sur le dashboard Sentry (`Projects > todo-server`).

## Secrets GitHub requis

Les secrets suivants doivent être configurés dans GitHub (Settings → Secrets and variables → Actions) :

- `DOCKERHUB_USERNAME` : Nom d'utilisateur Docker Hub
- `DOCKERHUB_TOKEN` : Token d'accès Docker Hub
- `VERCEL_TOKEN` : Token d'authentification Vercel
- `VERCEL_ORG_ID` : ID de l'organisation Vercel
- `VERCEL_PROJECT_ID` : ID du projet Vercel
- `RENDER_DEPLOY_HOOK` : URL du webhook de déploiement Render
- `DISCORD_WEBHOOK_URL` : URL du webhook Discord
- `FRONTEND_URL` : URL du frontend déployé (pour smoke tests)
- `BACKEND_URL` : URL du backend déployé (pour smoke tests)
- `SENTRY_DSN` : DSN Sentry (pour le backend)

## Convention de commits

Ce projet utilise [Conventional Commits](https://www.conventionalcommits.org/).

Format : `type(scope): description`

Exemples :
- `feat(server): add new todo endpoint`
- `fix(client): resolve styling issue`
- `ci: update GitHub Actions workflow`
- `test(server): add unit tests for todos API`

## Licence

Ce projet est fourni dans le cadre du module DevOps de l'ECE (usage pédagogique).

