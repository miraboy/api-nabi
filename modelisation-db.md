# Modélisation finale de la base de données - API Tontine

Ce document décrit la structure complète de la base de données nécessaire à la mise en place de l’API REST de gestion de tontines.
La modélisation est **relationnelle, extensible et compatible SQLite** (AUTOINCREMENT), tout en restant **simple pour une première version d’API**.

---

## 1. Hypothèses métier (complétées)

- Un utilisateur peut créer une ou plusieurs tontines
- Un utilisateur peut participer à plusieurs tontines
- Une tontine possède :

  - un montant fixe à verser
  - un nombre minimum de membres (minimum 2)
  - une fréquence de paiement (quotidienne, hebdomadaire, mensuelle, annuelle)

- Une tontine peut fonctionner par **cycles**
- Chaque cycle contient plusieurs **tours**
- À chaque tour, **un seul membre reçoit la cagnotte**
- L’ordre de ramassage peut être :

  - par ordre d’adhésion
  - aléatoire
  - défini manuellement

- Les paiements sont simulés
- L'authentification est gérée via JWT
- La base de données est SQLite avec AUTOINCREMENT

---

## 2. Tables principales (version complète)

La base de données est composée de **8 tables** :

1. `users`
2. `tontines`
3. `tontine_members`
4. `tontine_cycles`
5. `tontine_payout_order`
6. `tontine_rounds`
7. `payments`

---

## 3. Description des tables

---

### 3.1 Table `users`

Stocke les utilisateurs de l’application.

| Champ         | Type         | Description                          |
| ------------- | ------------ | ------------------------------------ |
| id            | INTEGER (PK) | Identifiant unique (AUTOINCREMENT)   |
| name          | VARCHAR(100) | Nom de l'utilisateur                 |
| email         | VARCHAR(150) | Email unique                         |
| password_hash | TEXT         | Mot de passe chiffré                 |
| created_at    | TIMESTAMP    | Date de création (CURRENT_TIMESTAMP) |

---

### 3.2 Table `tontines`

Stocke les tontines créées par les utilisateurs.

| Champ         | Type          | Description                            |
| ------------- | ------------- | -------------------------------------- |
| id            | INTEGER (PK)  | Identifiant unique                     |
| name          | VARCHAR(150)  | Nom de la tontine                      |
| amount        | DECIMAL(10,2) | Montant à payer                        |
| min_members   | INTEGER       | Nombre minimum de membres (>=2)        |
| frequency     | VARCHAR(50)   | `daily`, `weekly`, `monthly`, `yearly` |
| pickup_policy | VARCHAR(30)   | `arrival`, `random`, `custom`          |
| owner_id      | INTEGER (FK)  | Créateur                               |
| status        | VARCHAR(30)   | `open`, `closed`                       |
| created_at    | TIMESTAMP     | Date de création                       |

**Relations**

- `owner_id → users.id`

---

### 3.3 Table `tontine_members`

Table de liaison utilisateurs ↔ tontines.

| Champ      | Type         | Description |
| ---------- | ------------ | ----------- |
| id         | INTEGER (PK) | Identifiant |
| tontine_id | INTEGER (FK) | Tontine     |
| user_id    | INTEGER (FK) | Utilisateur |
| joined_at  | TIMESTAMP    | Date        |

**Contraintes**

- `UNIQUE(tontine_id, user_id)`

---

### 3.4 Table `tontine_cycles`

Représente un cycle complet de tontine.

| Champ         | Type         | Description                      |
| ------------- | ------------ | -------------------------------- |
| id            | INTEGER (PK) | Identifiant                      |
| tontine_id    | INTEGER (FK) | Tontine                          |
| start_date    | DATE         | Début                            |
| end_date      | DATE         | Fin prévue                       |
| total_rounds  | INTEGER      | Nombre de tours                  |
| current_round | INTEGER      | Tour en cours                    |
| status        | VARCHAR(30)  | `pending`, `active`, `completed` |
| created_at    | TIMESTAMP    | Création                         |

**Règles**

- Une tontine peut avoir plusieurs cycles
- Un seul cycle `active` à la fois

---

### 3.5 Table `tontine_payout_order`

Ordre définitif de ramassage par cycle.

| Champ         | Type         | Description |
| ------------- | ------------ | ----------- |
| id            | INTEGER (PK) | Identifiant |
| cycle_id      | INTEGER (FK) | Cycle       |
| user_id       | INTEGER (FK) | Membre      |
| position      | INTEGER      | Ordre       |
| has_collected | BOOLEAN      | A reçu ?    |
| collected_at  | TIMESTAMP    | Date        |

**Contraintes**

- `UNIQUE(cycle_id, user_id)`
- `UNIQUE(cycle_id, position)`

---

### 3.6 Table `tontine_rounds`

Tours de cotisation.

| Champ             | Type         | Description                 |
| ----------------- | ------------ | --------------------------- |
| id                | INTEGER (PK) | Identifiant                 |
| cycle_id          | INTEGER (FK) | Cycle                       |
| round_number      | INTEGER      | Numéro                      |
| collector_user_id | INTEGER (FK) | Bénéficiaire                |
| status            | VARCHAR(30)  | `pending`, `open`, `closed` |
| started_at        | TIMESTAMP    | Début                       |
| closed_at         | TIMESTAMP    | Fin                         |

---

### 3.7 Table `payments` (liée aux tours)

| Champ    | Type          | Description                      |
| -------- | ------------- | -------------------------------- |
| id       | INTEGER (PK)  | Identifiant                      |
| round_id | INTEGER (FK)  | Tour                             |
| user_id  | INTEGER (FK)  | Payeur                           |
| amount   | DECIMAL(10,2) | Montant                          |
| status   | VARCHAR(30)   | `pending`, `completed`, `failed` |
| paid_at  | TIMESTAMP     | Date                             |

**Contraintes**

- Un paiement par utilisateur et par tour

---

## 4. Relations globales

```
users
 ├── tontines (owner)
 │     ├── tontine_members
 │     ├── tontine_cycles
 │     │      ├── tontine_rounds
 │     │      │      └── payments
 │     │      └── tontine_payout_order
```

---

## 5. Fonctionnalités API couvertes (complétées)

### Gestion des cycles

- Démarrer un cycle
- Clôturer un cycle
- Générer automatiquement les tours
- Générer l’ordre de ramassage

### Gestion des tours

- Ouvrir un tour
- Vérifier les paiements
- Clôturer automatiquement un tour
- Passer au tour suivant

### Gestion des paiements

- Paiement par tour
- Vérification du montant
- Interdiction de paiement hors tour actif

---
