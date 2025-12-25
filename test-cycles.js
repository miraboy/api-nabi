/**
 * Script de test pour les fonctionnalités de cycles de tontines
 * Usage: node test-cycles.js
 */

const BASE_URL = "http://localhost:3000/api";

// Helper pour faire des requêtes HTTP
async function request(method, path, data = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const result = await response.json();

  return {
    status: response.status,
    data: result,
  };
}

// Couleurs pour les logs
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function runTests() {
  log("\n🚀 Démarrage des tests de cycles de tontines\n", "blue");

  try {
    // 1. Inscription des utilisateurs
    log("1️⃣  Inscription des utilisateurs...", "yellow");
    const users = [];
    for (let i = 1; i <= 5; i++) {
      const res = await request("POST", "/auth/register", {
        name: `User ${i}`,
        email: `user${i}@test.com`,
        password: "password123",
      });
      if (res.status === 201 || res.status === 409) {
        // Login si déjà existant
        const loginRes = await request("POST", "/auth/login", {
          email: `user${i}@test.com`,
          password: "password123",
        });
        users.push({
          id: i,
          email: `user${i}@test.com`,
          token: loginRes.data.data.token,
        });
        log(`   ✓ User ${i} connecté`, "green");
      }
    }

    const owner = users[0];
    log(`   ✓ ${users.length} utilisateurs prêts\n`, "green");

    // 2. Créer une tontine avec politique "arrival"
    log("2️⃣  Création d'une tontine (pickup_policy: arrival)...", "yellow");
    const createRes = await request(
      "POST",
      "/tontines",
      {
        name: "Tontine Test Cycles",
        amount: 10000,
        min_members: 5,
        frequency: "monthly",
        pickup_policy: "arrival",
      },
      owner.token
    );

    if (createRes.status !== 201) {
      log(`   ✗ Erreur: ${createRes.data.message}`, "red");
      return;
    }

    const tontineId = createRes.data.data.id;
    log(`   ✓ Tontine créée (ID: ${tontineId})\n`, "green");

    // 3. Ajouter 3 membres (pas encore le minimum de 5)
    log("3️⃣  Ajout de 3 membres (min_members = 5)...", "yellow");
    for (let i = 1; i <= 3; i++) {
      await request(
        "POST",
        `/tontines/${tontineId}/join`,
        null,
        users[i].token
      );
      log(`   ✓ ${users[i].email} a rejoint`, "green");
    }
    log("");

    // 4. Tenter de créer un cycle avant fermeture (DOIT ÉCHOUER)
    log(
      "4️⃣  Test: Créer un cycle avec tontine ouverte (doit échouer)...",
      "yellow"
    );
    const failRes = await request(
      "POST",
      `/tontines/${tontineId}/cycles`,
      {
        start_date: "2025-01-01",
        end_date: "2025-12-31",
      },
      owner.token
    );

    if (failRes.status === 400) {
      log(`   ✓ Erreur attendue: ${failRes.data.message}`, "green");
    } else {
      log(`   ✗ Le cycle aurait dû échouer (status=${failRes.status})`, "red");
    }
    log("");

    // 5. Ajouter le dernier membre pour fermer la tontine
    log("5️⃣  Ajout du dernier membre pour atteindre min_members...", "yellow");
    await request("POST", `/tontines/${tontineId}/join`, null, users[4].token);
    log(`   ✓ ${users[4].email} a rejoint`, "green");

    // Vérifier le statut de la tontine
    const tontineRes = await request(
      "GET",
      `/tontines/${tontineId}`,
      null,
      owner.token
    );
    log(`   ✓ Statut: ${tontineRes.data.data.status}`, "green");
    log(
      `   ✓ Membres: ${tontineRes.data.data.members_count}/${tontineRes.data.data.min_members}\n`,
      "green"
    );

    // 6. Créer un cycle avec politique "arrival"
    log("6️⃣  Création d'un cycle (pickup_policy: arrival)...", "yellow");
    const cycleRes = await request(
      "POST",
      `/tontines/${tontineId}/cycles`,
      {
        start_date: "2025-01-01",
        end_date: "2025-12-31",
      },
      owner.token
    );

    if (cycleRes.status === 201) {
      const cycle = cycleRes.data.data.cycle;
      log(`   ✓ Cycle créé (ID: ${cycle.id})`, "green");
      log(`   ✓ Total rounds: ${cycle.total_rounds}`, "green");
      log(`   ✓ Ordre de ramassage (arrival):`, "green");
      cycle.payout_order.forEach((po) => {
        log(
          `      ${po.position}. ${po.name} (User ID: ${po.user_id})`,
          "blue"
        );
      });
    } else {
      log(`   ✗ Erreur: ${cycleRes.data.message}`, "red");
    }
    log("");

    // 7. Tenter de créer un second cycle (DOIT ÉCHOUER)
    log("7️⃣  Test: Créer un second cycle actif (doit échouer)...", "yellow");
    const fail2Res = await request(
      "POST",
      `/tontines/${tontineId}/cycles`,
      {
        start_date: "2025-01-01",
      },
      owner.token
    );

    if (fail2Res.status === 409) {
      log(`   ✓ Erreur attendue: ${fail2Res.data.message}`, "green");
    } else {
      log(`   ✗ Un second cycle actif ne devrait pas être autorisé`, "red");
    }
    log("");

    // 8. Créer une nouvelle tontine avec politique "custom"
    log("8️⃣  Création d'une tontine avec pickup_policy: custom...", "yellow");
    const create2Res = await request(
      "POST",
      "/tontines",
      {
        name: "Tontine Test Custom",
        amount: 5000,
        min_members: 3,
        frequency: "weekly",
        pickup_policy: "custom",
      },
      owner.token
    );

    const tontine2Id = create2Res.data.data.id;
    log(`   ✓ Tontine 2 créée (ID: ${tontine2Id})\n`, "green");

    // Ajouter 2 membres
    await request("POST", `/tontines/${tontine2Id}/join`, null, users[1].token);
    await request("POST", `/tontines/${tontine2Id}/join`, null, users[2].token);
    log(`   ✓ 3 membres au total (min atteint)\n`, "green");

    // 9. Créer un cycle avec ordre custom
    log("9️⃣  Création d'un cycle avec ordre custom...", "yellow");

    // Récupérer les IDs des membres
    const membersRes = await request(
      "GET",
      `/tontines/${tontine2Id}`,
      null,
      owner.token
    );
    const memberIds = membersRes.data.data.members.map((m) => m.user_id);
    log(`   ℹ️  IDs des membres: [${memberIds.join(", ")}]`, "blue");

    // Ordre custom: inverse de l'ordre d'arrivée
    const customOrder = [...memberIds].reverse();
    log(`   ℹ️  Ordre custom: [${customOrder.join(", ")}]`, "blue");

    const cycle2Res = await request(
      "POST",
      `/tontines/${tontine2Id}/cycles`,
      {
        start_date: "2025-02-01",
        end_date: "2025-06-30",
        custom_order: customOrder,
      },
      owner.token
    );

    if (cycle2Res.status === 201) {
      const cycle = cycle2Res.data.data.cycle;
      log(`   ✓ Cycle avec ordre custom créé`, "green");
      log(`   ✓ Ordre de ramassage (custom):`, "green");
      cycle.payout_order.forEach((po) => {
        log(
          `      ${po.position}. ${po.name} (User ID: ${po.user_id})`,
          "blue"
        );
      });
    } else {
      log(`   ✗ Erreur: ${cycle2Res.data.message}`, "red");
    }
    log("");

    // 10. Lister tous les cycles d'une tontine
    log("🔟 Récupération de tous les cycles de la tontine 1...", "yellow");
    const cyclesRes = await request(
      "GET",
      `/tontines/${tontineId}/cycles`,
      null,
      owner.token
    );

    if (cyclesRes.status === 200) {
      log(
        `   ✓ ${cyclesRes.data.data.cycles.length} cycle(s) trouvé(s)`,
        "green"
      );
      cyclesRes.data.data.cycles.forEach((c) => {
        log(
          `      - Cycle ${c.id}: ${c.status} (${c.total_rounds} rounds)`,
          "blue"
        );
      });
    }
    log("");

    // 11. Test de modification d'ordre de ramassage
    log("1️⃣1️⃣  Test: Modifier l'ordre de ramassage du cycle custom...", "yellow");
    const newCustomOrder = [memberIds[1], memberIds[0], memberIds[2]];
    log(`   ℹ️  Nouvel ordre: [${newCustomOrder.join(", ")}]`, "blue");

    const updateOrderRes = await request(
      "PUT",
      `/cycles/${cycle2Res.data.data.cycle.id}/payout-order`,
      { custom_order: newCustomOrder },
      owner.token
    );

    if (updateOrderRes.status === 200) {
      log(`   ✓ Ordre de ramassage modifié avec succès`, "green");
      log(`   ✓ Nouvel ordre:`, "green");
      updateOrderRes.data.data.payout_order.forEach((po) => {
        log(`      ${po.position}. ${po.name} (User ID: ${po.user_id})`, "blue");
      });
    } else {
      log(`   ✗ Erreur: ${updateOrderRes.data.message}`, "red");
    }
    log("");

    // 12. Test: Modifier ordre avec membres manquants (DOIT ÉCHOUER)
    log("1️⃣2️⃣  Test: Modifier ordre avec membres manquants (doit échouer)...", "yellow");
    const incompleteOrder = [memberIds[0], memberIds[1]];
    const failOrderRes = await request(
      "PUT",
      `/cycles/${cycle2Res.data.data.cycle.id}/payout-order`,
      { custom_order: incompleteOrder },
      owner.token
    );

    if (failOrderRes.status === 400) {
      log(`   ✓ Erreur attendue: ${failOrderRes.data.message}`, "green");
    } else {
      log(`   ✗ Devrait échouer avec ordre incomplet`, "red");
    }
    log("");

    // 13. Test: Non-propriétaire tente de modifier l'ordre (DOIT ÉCHOUER)
    log("1️⃣3️⃣  Test: Non-propriétaire modifie l'ordre (doit échouer)...", "yellow");
    const unauthorizedRes = await request(
      "PUT",
      `/cycles/${cycle2Res.data.data.cycle.id}/payout-order`,
      { custom_order: newCustomOrder },
      users[1].token
    );

    if (unauthorizedRes.status === 403) {
      log(`   ✓ Erreur attendue: ${unauthorizedRes.data.message}`, "green");
    } else {
      log(`   ✗ Seul le propriétaire devrait pouvoir modifier l'ordre`, "red");
    }
    log("");

    // 14. Test: Fermer un tour et ouvrir le suivant
    log("1️⃣4️⃣  Test: Fermer un tour (simulation sans paiements)...", "yellow");
    const rounds = cycleRes.data.data.cycle.rounds;
    const firstRound = rounds[0];
    log(`   ℹ️  Premier tour ID: ${firstRound.id}`, "blue");
    
    const closeRoundRes = await request(
      "POST",
      `/rounds/${firstRound.id}/close`,
      null,
      owner.token
    );

    if (closeRoundRes.status === 400) {
      log(`   ✓ Erreur attendue (pas de paiements): ${closeRoundRes.data.message}`, "green");
    } else {
      log(`   ✗ Devrait échouer sans paiements complétés`, "red");
    }
    log("");

    // 15. Test: Récupérer les détails d'un tour
    log("1️⃣5️⃣  Test: Récupérer les détails d'un tour...", "yellow");
    const getRoundRes = await request(
      "GET",
      `/rounds/${firstRound.id}`,
      null,
      owner.token
    );

    if (getRoundRes.status === 200) {
      log(`   ✓ Tour récupéré avec succès`, "green");
      log(`   ✓ Statut: ${getRoundRes.data.data.round.status}`, "green");
      log(`   ✓ Collecteur: ${getRoundRes.data.data.round.collector_name}`, "green");
    } else {
      log(`   ✗ Erreur: ${getRoundRes.data.message}`, "red");
    }
    log("");

    // 16. Test: Non-propriétaire tente de fermer un tour
    log("1️⃣6️⃣  Test: Non-propriétaire ferme un tour (doit échouer)...", "yellow");
    const unauthorizedCloseRes = await request(
      "POST",
      `/rounds/${firstRound.id}/close`,
      null,
      users[1].token
    );

    if (unauthorizedCloseRes.status === 403) {
      log(`   ✓ Erreur attendue: ${unauthorizedCloseRes.data.message}`, "green");
    } else {
      log(`   ✗ Seul le propriétaire devrait pouvoir fermer un tour`, "red");
    }
    log("");

    // 17. Test: Démarrer le cycle
    log("1️⃣7️⃣  Test: Démarrer le cycle...", "yellow");
    const startCycleRes = await request(
      "POST",
      `/cycles/${cycleRes.data.data.cycle.id}/start`,
      null,
      owner.token
    );

    if (startCycleRes.status === 200) {
      log(`   ✓ Cycle démarré avec succès`, "green");
      log(`   ✓ Premier tour ouvert`, "green");
    } else {
      log(`   ✗ Erreur: ${startCycleRes.data.message}`, "red");
    }
    log("");

    // 18. Test: Créer un paiement avec succès
    log("1️⃣8️⃣  Test: Créer un paiement pour le premier tour...", "yellow");
    const tontineAmount = tontineRes.data.data.amount;
    const paymentRes = await request(
      "POST",
      `/rounds/${firstRound.id}/payments`,
      { amount: tontineAmount },
      users[0].token
    );

    if (paymentRes.status === 201) {
      log(`   ✓ Paiement créé avec succès`, "green");
      log(`   ✓ Montant: ${paymentRes.data.data.payment.amount}`, "green");
    } else {
      log(`   ✗ Erreur: ${paymentRes.data.message}`, "red");
    }
    log("");

    // 19. Test: Empêcher paiement en double
    log("1️⃣9️⃣  Test: Empêcher paiement en double (doit échouer)...", "yellow");
    const duplicatePaymentRes = await request(
      "POST",
      `/rounds/${firstRound.id}/payments`,
      { amount: tontineAmount },
      users[0].token
    );

    if (duplicatePaymentRes.status === 409) {
      log(`   ✓ Erreur attendue: ${duplicatePaymentRes.data.message}`, "green");
    } else {
      log(`   ✗ Devrait empêcher le paiement en double`, "red");
    }
    log("");

    // 20. Test: Vérifier montant incorrect
    log("2️⃣0️⃣  Test: Paiement avec montant incorrect (doit échouer)...", "yellow");
    const wrongAmountRes = await request(
      "POST",
      `/rounds/${firstRound.id}/payments`,
      { amount: 5000 },
      users[1].token
    );

    if (wrongAmountRes.status === 400) {
      log(`   ✓ Erreur attendue: ${wrongAmountRes.data.message}`, "green");
    } else {
      log(`   ✗ Devrait rejeter le montant incorrect`, "red");
    }
    log("");

    // 21. Test: Lister les paiements d'un tour
    log("2️⃣1️⃣  Test: Lister les paiements du tour...", "yellow");
    const paymentsListRes = await request(
      "GET",
      `/rounds/${firstRound.id}/payments`,
      null,
      owner.token
    );

    if (paymentsListRes.status === 200) {
      log(`   ✓ ${paymentsListRes.data.data.total} paiement(s) trouvé(s)`, "green");
    } else {
      log(`   ✗ Erreur: ${paymentsListRes.data.message}`, "red");
    }
    log("");

    // 22. Test: Lister les paiements de l'utilisateur
    log("2️⃣2️⃣  Test: Lister mes paiements...", "yellow");
    const myPaymentsRes = await request(
      "GET",
      `/users/me/payments`,
      null,
      users[0].token
    );

    if (myPaymentsRes.status === 200) {
      log(`   ✓ ${myPaymentsRes.data.data.total} paiement(s) trouvé(s)`, "green");
    } else {
      log(`   ✗ Erreur: ${myPaymentsRes.data.message}`, "red");
    }
    log("");

    log("✅ Tests terminés avec succès!\n", "green");
  } catch (error) {
    log(`\n❌ Erreur lors des tests: ${error.message}\n`, "red");
    console.error(error);
  }
}

// Vérifier que le serveur est lancé
log("\n⏳ Vérification que le serveur est démarré...", "blue");
fetch(`${BASE_URL}/health`)
  .then((res) => res.json())
  .then(() => {
    log("✓ Serveur accessible\n", "green");
    runTests();
  })
  .catch((err) => {
    log("✗ Serveur non accessible. Lancez 'npm start' d'abord\n", "red");
    process.exit(1);
  });
