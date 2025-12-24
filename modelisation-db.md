# Modélisation de la base de données - API Tontine

Ce document décrit la structure de la base de données nécessaire à la mise en place de l’API REST de gestion de tontines.  
La modélisation est volontairement simple, relationnelle et extensible.

---

## 1. Hypothèses métier

- Un utilisateur peut créer une ou plusieurs tontines
- Un utilisateur peut participer à plusieurs tontines
- Une tontine possède :
  - un montant fixe à verser
  - un nombre maximum de membres
  - une fréquence de paiement
- Les paiements sont simulés
- L’authentification est gérée via JWT

---

## 2. Tables principales

La base de données est composée de **4 tables** :

1. `users`
2. `tontines`
3. `tontine_members`
4. `payments`

---

## 3. Description des tables

### 3.1 Table `users`

Stocke les utilisateurs de l’application.

| Champ | Type | Description |
|------|-----|------------|
| id | SERIAL (PK) | Identifiant unique |
| name | VARCHAR(100) | Nom de l’utilisateur |
| email | VARCHAR(150) | Email unique |
| password_hash | TEXT | Mot de passe chiffré |
| created_at | TIMESTAMP | Date de création |

---

### 3.2 Table `tontines`

Stocke les tontines créées par les utilisateurs.

| Champ | Type | Description |
|------|-----|------------|
| id | SERIAL (PK) | Identifiant unique |
| name | VARCHAR(150) | Nom de la tontine |
| amount | NUMERIC(10,2) | Montant à payer |
| max_members | INTEGER | Nombre maximum de membres |
| frequency | VARCHAR(50) | Fréquence (mensuelle, hebdo, etc.) |
| owner_id | INTEGER (FK) | Créateur de la tontine |
| status | VARCHAR(30) | État (`open`, `closed`) |
| created_at | TIMESTAMP | Date de création |

**Relation :**
- `owner_id` référence `users.id`

---

### 3.3 Table `tontine_members`

Table de liaison entre les utilisateurs et les tontines.

| Champ | Type | Description |
|------|-----|------------|
| id | SERIAL (PK) | Identifiant unique |
| tontine_id | INTEGER (FK) | Tontine rejointe |
| user_id | INTEGER (FK) | Utilisateur |
| joined_at | TIMESTAMP | Date d’adhésion |

**Contraintes :**
- Un utilisateur ne peut rejoindre une tontine qu’une seule fois  
  `(UNIQUE tontine_id, user_id)`

---

### 3.4 Table `payments`

Historique des paiements effectués par les membres.

| Champ | Type | Description |
|------|-----|------------|
| id | SERIAL (PK) | Identifiant unique |
| tontine_id | INTEGER (FK) | Tontine concernée |
| user_id | INTEGER (FK) | Payeur |
| amount | NUMERIC(10,2) | Montant payé |
| status | VARCHAR(30) | Statut du paiement |
| paid_at | TIMESTAMP | Date du paiement |

---

## 4. Relations entre les tables

- Un utilisateur peut créer plusieurs tontines
- Un utilisateur peut participer à plusieurs tontines
- Une tontine peut avoir plusieurs membres
- Un utilisateur peut effectuer plusieurs paiements
- Une tontine possède plusieurs paiements

---

## 5. Correspondance avec les endpoints API

| Endpoint | Tables utilisées |
|--------|----------------|
| POST /api/tontines | users, tontines |
| GET /api/tontines | tontines |
| POST /api/tontines/:id/join | tontine_members |
| POST /api/tontines/:id/pay | payments |
| GET /api/tontines/:id | tontines, tontine_members, payments |

---

## 6. Avantages de cette modélisation

- Simple et lisible
- Facile à implémenter avec PostgreSQL ou SQLite
- Compatible avec une API REST
- Extensible (cycles, rôles, sanctions, paiements réels)
