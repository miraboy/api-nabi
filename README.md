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

## Fonctionnalités

### Authentification
- Inscription et connexion des utilisateurs
- Authentification par JWT

### Gestion des Tontines
- Créer une tontine avec montant, fréquence et politique de ramassage
- Rejoindre une tontine
- Fermeture automatique quand le minimum de membres est atteint
- Politiques de ramassage : `arrival`, `random`, `custom`

### Gestion des Cycles
- Créer un cycle pour une tontine fermée
- Définir un ordre de ramassage personnalisé
- Modifier l'ordre avant le début des paiements
- Démarrer un cycle (initialise le premier tour)
- Verrouillage automatique de l'ordre après démarrage

### Gestion des Tours
- Création automatique de tous les tours lors de la création du cycle
- Démarrage automatique du premier tour
- Suivi des paiements par tour

## Tests

```bash
node test-cycles.js
```

## Documentation API

Accédez à la documentation Swagger sur : `http://localhost:3000/api-docs`