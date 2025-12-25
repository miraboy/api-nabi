# Api-nabi

API REST pour la gestion de tontines avec Node.js et Express.

## Table des matières

- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Tests](#tests)
- [Documentation API](#documentation-api)
- [Fonctionnalités](#fonctionnalités)
- [Workflow Complet](#workflow-complet--cycle--tour--paiement)
- [Sécurité](#sécurité)
- [Structure du Projet](#structure-du-projet)
- [Technologies](#technologies)
- [Contribution](#contribution)

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** >= 14.x
- **npm** >= 6.x
- **Git**

## Installation

### 1. Cloner le repository

```bash
git clone https://github.com/miraboy/api-nabi.git
cd api-nabi
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Initialiser la base de données

La base de données SQLite sera créée automatiquement au premier démarrage.
Les migrations sont exécutées automatiquement.

## Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Contenu du fichier `.env` :

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Database
DB_PATH=./database.sqlite

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

⚠️ **Important** : Changez `JWT_SECRET` en production !

## Démarrage

### Mode développement

```bash
npm start
```

### Avec Docker

```bash
# Production
docker-compose up --build -d

# Développement avec hot reload
docker-compose -f docker-compose.dev.yml up --build

# Ou avec Makefile
make prod  # Production
make dev   # Développement
```

Le serveur démarre sur `http://localhost:3000`

### Vérifier que le serveur fonctionne

```bash
curl http://localhost:3000/api/health
```

Réponse attendue :
```json
{
  "status": "OK",
  "timestamp": "2025-12-25T00:00:00.000Z"
}
```

## Tests

### Exécuter tous les tests

```bash
npm test
```

### Tests unitaires uniquement

```bash
npm run test:unit
```

### Tests d'intégration uniquement

```bash
npm run test:integration
```

### Mode watch pour le développement

```bash
npm run test:watch
```

### Résultat attendu

```
Test Suites: 13 passed, 13 total
Tests:       82 passed, 82 total
Snapshots:   0 total
Time:        17.671 s
```

### Types de tests

#### Tests unitaires (`tests/unit/`)
- Tests des contrôleurs individuels
- Tests des modèles de données
- Tests des middlewares
- Tests de pagination
- Tests de sécurité

#### Tests d'intégration (`tests/integration/`)
- **Workflow complet** : Test du cycle de vie complet d'une tontine
- **Authentification & Sécurité** : Tests des flux d'auth et contrôles d'accès
- **Pagination & Performance** : Tests de pagination et performance
- **Gestion d'erreurs** : Tests des cas d'erreur et cas limites

### Tests de scénarios complets

```bash
node test-cycles.js
```

Ce script teste un workflow complet de A à Z.

## Documentation API

### Swagger UI

Accédez à la documentation interactive Swagger :

```
http://localhost:3000/api-docs
```

### Collection Postman

Importez la collection Postman pour tester l'API :

1. Ouvrez Postman
2. Cliquez sur **Import**
3. Sélectionnez le fichier `postman_collection.json`
4. La collection contient :
   - Variables automatiques (tokens, IDs)
   - Tous les endpoints organisés par catégorie
   - Scripts de test pour capturer les tokens et IDs

**Workflow recommandé** :
1. Exécutez les requêtes dans **Authentication** pour créer les utilisateurs
2. Créez une tontine dans **Tontines**
3. Faites rejoindre les membresScripts de test pour capturer les tokens et IDs
4. Créez et démarrez un cycle dans **Cycles**
5. Effectuez les paiements dans **Payments**
6. Fermez le tour dans **Rounds**

### Endpoints principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/tontines` | Créer une tontine |
| POST | `/api/tontines/:id/join` | Rejoindre une tontine |
| POST | `/api/tontines/:id/leave` | Quitter une tontine (après cycles terminés) |
| POST | `/api/tontines/:id/cycles` | Créer un cycle |
| POST | `/api/cycles/:id/start` | Démarrer un cycle |
| GET | `/api/cycles/:id/stats` | Statistiques du cycle |
| POST | `/api/rounds/:id/payments` | Créer un paiement |
| POST | `/api/rounds/:id/close` | Fermer un tour |
| GET | `/api/tontines` | Lister toutes les tontines (paginé) |
| GET | `/api/users/me/payments` | Mes paiements (paginé) |
| GET | `/api/rounds/:id/payments` | Paiements d'un tour (paginé) |

## Fonctionnalités

### Authentification
- ✅ Inscription et connexion des utilisateurs
- ✅ Authentification par JWT

### Gestion des Membres
- ✅ Rejoindre une tontine ouverte
- ✅ Quitter une tontine (uniquement après tous les cycles terminés)
- ✅ Restrictions : propriétaire ne peut pas quitter, pas de retrait pendant cycles actifs
- ✅ Vérification de l'état des cycles et tours avant autorisation de retrait

### Gestion des Cycles
- ✅ Créer un cycle pour une tontine fermée
- ✅ Définir un ordre de ramassage personnalisé
- ✅ Modifier l'ordre avant le début des paiements
- ✅ Démarrer un cycle (initialise le premier tour)
- ✅ Verrouillage automatique de l'ordre après démarrage
- ✅ Statistiques du cycle (membres payés, restants, etc.)

### Gestion des Tours
- ✅ Création automatique de tous les tours lors de la création du cycle
- ✅ Démarrage automatique du premier tour
- ✅ Fermer un tour (avec validation des paiements)
- ✅ Ouverture automatique du tour suivant
- ✅ Suivi des paiements par tour

### Gestion des Paiements
- ✅ Créer un paiement pour un tour ouvert
- ✅ Empêcher les paiements en double
- ✅ Vérifier le montant correct
- ✅ Lister les paiements d'un tour
- ✅ Lister les paiements d'un utilisateur

## Workflow Complet : Cycle → Tour → Paiement

### 1. Créer et préparer une tontine

```bash
# 1.1 Inscription du propriétaire
POST /api/auth/register
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "password123"
}
# Réponse: { "token": "eyJhbGc..." }

# 1.2 Créer une tontine
POST /api/tontines
Authorization: Bearer {token}
{
  "name": "Tontine Mensuelle",
  "amount": 10000,
  "min_members": 5,
  "frequency": "monthly",
  "pickup_policy": "arrival"
}
# Réponse: { "id": 1, "status": "open" }

# 1.3 Les membres rejoignent la tontine
POST /api/tontines/1/join
Authorization: Bearer {member_token}
# Répéter pour chaque membre jusqu'à min_members
# La tontine passe automatiquement en statut "closed"
```

### 2. Créer et configurer un cycle

```bash
# 2.1 Créer un cycle (propriétaire uniquement)
POST /api/tontines/1/cycles
Authorization: Bearer {owner_token}
{
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
# Réponse: { 
#   "cycle": { 
#     "id": 1, 
#     "status": "pending",
#     "total_rounds": 5,
#     "payout_order": [...],
#     "rounds": [...]
#   }
# }

# 2.2 (Optionnel) Modifier l'ordre de ramassage avant démarrage
PUT /api/cycles/1/payout-order
Authorization: Bearer {owner_token}
{
  "custom_order": [3, 1, 5, 2, 4]
}
# Réponse: { "payout_order": [...] }

# 2.3 Démarrer le cycle
POST /api/cycles/1/start
Authorization: Bearer {owner_token}
# Réponse: { "cycle": { "status": "active", "current_round": 1 } }
# Le premier tour s'ouvre automatiquement
```

### 3. Gérer les tours et paiements

```bash
# 3.1 Les membres effectuent leurs paiements pour le tour actuel
POST /api/rounds/1/payments
Authorization: Bearer {member_token}
{
  "amount": 10000
}
# Réponse: { "payment": { "id": 1, "status": "completed" } }

# 3.2 Vérifier les paiements du tour
GET /api/rounds/1/payments
Authorization: Bearer {owner_token}
# Réponse: { "payments": [...], "total": 5 }

# 3.3 Consulter les statistiques du cycle
GET /api/cycles/1/stats
Authorization: Bearer {owner_token}
# Réponse: {
#   "current_round": 1,
#   "total_rounds": 5,
#   "remaining_rounds": 4,
#   "members_paid": [{...}, {...}],
#   "members_not_paid": [{...}],
#   "members_collected": []
# }

# 3.4 Fermer le tour quand tous ont payé
POST /api/rounds/1/close
Authorization: Bearer {owner_token}
# Réponse: { "round": { "status": "closed" } }
# Le tour suivant s'ouvre automatiquement

# 3.5 Répéter les étapes 3.1 à 3.4 pour chaque tour
# Quand le dernier tour est fermé, le cycle passe en "completed"
```

### 4. Quitter une tontine (membres uniquement)

```bash
# 4.1 Tentative de quitter avant la fin des cycles (échoue)
POST /api/tontines/1/leave
Authorization: Bearer {member_token}
# Réponse: { "status": "error", "message": "Cannot leave tontine without any completed cycles" }

# 4.2 Quitter après que tous les cycles soient terminés (succès)
POST /api/tontines/1/leave
Authorization: Bearer {member_token}
# Réponse: { 
#   "status": "success", 
#   "message": "Successfully left the tontine",
#   "data": { "tontine_id": 1, "user_id": 2 }
# }

# 4.3 Vérifier que le membre n'est plus dans la tontine
GET /api/tontines/my
Authorization: Bearer {member_token}
# La tontine ne devrait plus apparaître dans la liste "member"
```

#### Conditions pour quitter une tontine :
- ✅ Être membre de la tontine (pas le propriétaire)
- ✅ Tous les cycles doivent être terminés (status = 'completed')
- ✅ Tous les tours de tous les cycles doivent être fermés (status = 'closed')
- ❌ Impossible de quitter pendant un cycle actif ou en attente
- ❌ Le propriétaire ne peut jamais quitter sa propre tontine

### 5. Endpoints utiles

```bash
# Lister tous les cycles d'une tontine
GET /api/tontines/1/cycles

# Détails d'un cycle
GET /api/cycles/1

# Détails d'un tour
GET /api/rounds/1

# Mes paiements (paginé)
GET /api/users/me/payments?page=1&limit=10

# Détails d'une tontine
GET /api/tontines/1
```

## Pagination

Certaines routes supportent la pagination pour gérer efficacement de grandes quantités de données :

### Routes paginées
- `GET /api/tontines` - Liste des tontines
- `GET /api/users/me/payments` - Paiements de l'utilisateur
- `GET /api/rounds/:id/payments` - Paiements d'un tour

### Paramètres de pagination
- `page` : Numéro de page (défaut: 1, minimum: 1)
- `limit` : Nombre d'éléments par page (défaut: 10, maximum: 100)

### Exemple d'utilisation
```bash
# Première page avec 10 éléments (défaut)
GET /api/tontines

# Deuxième page avec 5 éléments
GET /api/tontines?page=2&limit=5

# Mes paiements, page 3 avec 20 éléments
GET /api/users/me/payments?page=3&limit=20
```

### Structure de réponse paginée
```json
{
  "status": "success",
  "data": {
    "data": [...], // Les données de la page actuelle
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total_items": 50,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false,
      "next_page": 2,
      "prev_page": null
    }
  }
}
```

## Sécurité

- ✅ Authentification JWT obligatoire
- ✅ Actions sensibles réservées au propriétaire
- ✅ Paiements réservés aux membres
- ✅ Validation de toutes les entrées
- ✅ Verrouillage après démarrage du cycle
- ✅ Vérification des montants et doublons
- ✅ **Rate limiting** - Protection contre les attaques par déni de service
- ✅ **CORS configuré** - Contrôle des origines autorisées
- ✅ **Logging des requêtes** - Traçabilité complète des accès API

## Structure du Projet

```
api-nabi/
├── src/
│   ├── config/          # Configuration et migrations
│   ├── controllers/     # Logique métier
│   ├── middlewares/     # Auth, validation, erreurs
│   ├── models/          # Modèles de données
│   ├── routes/          # Routes API
│   ├── utils/           # Utilitaires
│   ├── validators/      # Validations
│   └── app.js           # Application Express
├── tests/
│   ├── unit/            # Tests unitaires
│   └── setup.js         # Configuration tests
├── index.js             # Point d'entrée
└── package.json
```

## Technologies

- **Node.js** + **Express** - Framework web
- **SQLite** - Base de données
- **JWT** - Authentification
- **Bcrypt** - Hashage des mots de passe
- **Express-validator** - Validation des entrées
- **Swagger** - Documentation API
- **Jest** + **Supertest** - Tests unitaires

## Contribution

### Développement

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Standards de code

- Suivre les conventions JavaScript ES6+
- Ajouter des tests pour toutes les nouvelles fonctionnalités
- Documenter les endpoints avec Swagger
- Maintenir la couverture de tests à 100%

## Licence

MIT License

Copyright (c) 2025 Sèkplon Mirabel DOTOU

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


## Auteur

**Miraboy**
- GitHub: [@miraboy](https://github.com/miraboy)
- Repository: [api-nabi](https://github.com/miraboy/api-nabi)

## Support

Pour toute question ou problème :
- Ouvrez une [issue](https://github.com/miraboy/api-nabi/issues)
- Consultez la [documentation Swagger](http://localhost:3000/api-docs)

---

⭐ Si ce projet vous aide, n'hésitez pas à lui donner une étoile !