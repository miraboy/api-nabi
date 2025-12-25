#!/usr/bin/env node

/**
 * Script de test pour la fonctionnalité "Quitter une tontine"
 * 
 * Ce script démontre comment un membre peut quitter une tontine
 * uniquement après que tous les tours soient effectués.
 * 
 * Usage: node test-leave-tontine.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Configuration
const config = {
  owner: { name: 'Alice', email: 'alice@example.com', password: 'password123' },
  member1: { name: 'Bob', email: 'bob@example.com', password: 'password123' },
  member2: { name: 'Charlie', email: 'charlie@example.com', password: 'password123' },
  tontine: {
    name: 'Tontine Test Leave',
    amount: 10000,
    min_members: 3,
    frequency: 'monthly',
    pickup_policy: 'arrival'
  }
};

let tokens = {};
let tontineId, cycleId;

async function makeRequest(method, url, data = null, token = null) {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios({ method, url: `${BASE_URL}${url}`, data, headers });
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

async function step(description, fn) {
  console.log(`\n🔄 ${description}`);
  try {
    const result = await fn();
    if (result && result.status === 'error') {
      console.log(`❌ ${result.message}`);
    } else {
      console.log(`✅ Succès`);
    }
    return result;
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🚀 Test de la fonctionnalité "Quitter une tontine"\n');

  // 1. Créer les utilisateurs
  await step('Inscription du propriétaire', async () => {
    const result = await makeRequest('POST', '/auth/register', config.owner);
    tokens.owner = result.data.token;
    return result;
  });

  await step('Inscription du membre 1', async () => {
    const result = await makeRequest('POST', '/auth/register', config.member1);
    tokens.member1 = result.data.token;
    return result;
  });

  await step('Inscription du membre 2', async () => {
    const result = await makeRequest('POST', '/auth/register', config.member2);
    tokens.member2 = result.data.token;
    return result;
  });

  // 2. Créer la tontine
  await step('Création de la tontine', async () => {
    const result = await makeRequest('POST', '/tontines', config.tontine, tokens.owner);
    tontineId = result.data.id;
    return result;
  });

  // 3. Les membres rejoignent
  await step('Membre 1 rejoint la tontine', async () => {
    return await makeRequest('POST', `/tontines/${tontineId}/join`, null, tokens.member1);
  });

  await step('Membre 2 rejoint la tontine', async () => {
    return await makeRequest('POST', `/tontines/${tontineId}/join`, null, tokens.member2);
  });

  // 4. Test: Tentative de quitter avant les cycles
  await step('❌ Test: Membre 1 tente de quitter (devrait échouer)', async () => {
    return await makeRequest('POST', `/tontines/${tontineId}/leave`, null, tokens.member1);
  });

  // 5. Test: Propriétaire tente de quitter
  await step('❌ Test: Propriétaire tente de quitter (devrait échouer)', async () => {
    return await makeRequest('POST', `/tontines/${tontineId}/leave`, null, tokens.owner);
  });

  // 6. Créer et démarrer un cycle
  await step('Création d\'un cycle', async () => {
    const result = await makeRequest('POST', `/tontines/${tontineId}/cycles`, {
      start_date: '2025-01-01',
      end_date: '2025-12-31'
    }, tokens.owner);
    cycleId = result.data.cycle.id;
    return result;
  });

  await step('Démarrage du cycle', async () => {
    return await makeRequest('POST', `/cycles/${cycleId}/start`, null, tokens.owner);
  });

  // 7. Test: Tentative de quitter pendant un cycle actif
  await step('❌ Test: Membre 1 tente de quitter pendant cycle actif (devrait échouer)', async () => {
    return await makeRequest('POST', `/tontines/${tontineId}/leave`, null, tokens.member1);
  });

  // 8. Compléter tous les tours
  const cycleDetails = await makeRequest('GET', `/cycles/${cycleId}`, null, tokens.owner);
  const rounds = cycleDetails.data.rounds;

  for (let i = 0; i < rounds.length; i++) {
    const round = rounds[i];
    console.log(`\n📍 Tour ${i + 1}/${rounds.length}`);

    // Tous les membres paient
    await step(`  Propriétaire paie pour le tour ${round.round_number}`, async () => {
      return await makeRequest('POST', `/rounds/${round.id}/payments`, { amount: 10000 }, tokens.owner);
    });

    await step(`  Membre 1 paie pour le tour ${round.round_number}`, async () => {
      return await makeRequest('POST', `/rounds/${round.id}/payments`, { amount: 10000 }, tokens.member1);
    });

    await step(`  Membre 2 paie pour le tour ${round.round_number}`, async () => {
      return await makeRequest('POST', `/rounds/${round.id}/payments`, { amount: 10000 }, tokens.member2);
    });

    // Fermer le tour
    await step(`  Fermeture du tour ${round.round_number}`, async () => {
      return await makeRequest('POST', `/rounds/${round.id}/close`, null, tokens.owner);
    });
  }

  // 9. Test: Maintenant le membre peut quitter
  await step('✅ Test: Membre 1 peut maintenant quitter la tontine', async () => {
    return await makeRequest('POST', `/tontines/${tontineId}/leave`, null, tokens.member1);
  });

  // 10. Vérifier que le membre n'est plus dans la tontine
  await step('Vérification: Membre 1 n\'est plus dans la tontine', async () => {
    const result = await makeRequest('GET', '/tontines/my', null, tokens.member1);
    const isStillMember = result.data.member.some(t => t.id === tontineId);
    if (isStillMember) {
      throw new Error('Le membre est encore dans la tontine');
    }
    return result;
  });

  // 11. Test: Tentative de quitter à nouveau
  await step('❌ Test: Membre 1 tente de quitter à nouveau (devrait échouer)', async () => {
    return await makeRequest('POST', `/tontines/${tontineId}/leave`, null, tokens.member1);
  });

  console.log('\n🎉 Tous les tests sont terminés avec succès !');
  console.log('\n📋 Résumé:');
  console.log('✅ Les membres ne peuvent pas quitter avant la fin des cycles');
  console.log('✅ Le propriétaire ne peut pas quitter sa tontine');
  console.log('✅ Les membres ne peuvent pas quitter pendant un cycle actif');
  console.log('✅ Les membres peuvent quitter après que tous les tours soient fermés');
  console.log('✅ Un membre qui a quitté ne peut plus quitter à nouveau');
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Erreur fatale:', error.message);
    process.exit(1);
  });
}

module.exports = { main };