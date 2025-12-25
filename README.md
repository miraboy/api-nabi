# api-nabi

API REST pour la gestion de tontines avec Node.js et Express.

## Installation

```bash
npm install
```

## Démarrage

```bash
npm start
```

Le serveur démarre sur le port 3000.

## Tests

```bash
npm test
```

24 tests unitaires avec Jest et Supertest (100% de réussite).

## Documentation API

Accédez à la documentation Swagger sur : `http://localhost:3000/api-docs`

## Fonctionnalités

### Authentification
- ✅ Inscription et connexion des utilisateurs
- ✅ Authentification par JWT

### Gestion des Tontines
- ✅ Créer une tontine avec montant, fréquence et politique de ramassage
- ✅ Rejoindre une tontine
- ✅ Fermeture automatique quand le minimum de membres est atteint
- ✅ Politiques de ramassage : `arrival`, `random`, `custom`

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

### 4. Endpoints utiles

```bash
# Lister tous les cycles d'une tontine
GET /api/tontines/1/cycles

# Détails d'un cycle
GET /api/cycles/1

# Détails d'un tour
GET /api/rounds/1

# Mes paiements
GET /api/users/me/payments

# Détails d'une tontine
GET /api/tontines/1
```

## Sécurité

- ✅ Authentification JWT obligatoire
- ✅ Actions sensibles réservées au propriétaire
- ✅ Paiements réservés aux membres
- ✅ Validation de toutes les entrées
- ✅ Verrouillage après démarrage du cycle
- ✅ Vérification des montants et doublons

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