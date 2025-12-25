#!/usr/bin/env node

/**
 * Script de test pour le Rate Limiting
 * 
 * Ce script teste les limites de taux configurées pour l'API
 * 
 * Usage: NODE_ENV=production node test-rate-limiting.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testRateLimit() {
  console.log('🚀 Test du Rate Limiting\n');

  // Test du rate limiting général (100 requêtes/15min)
  console.log('📊 Test du rate limiting général...');
  try {
    for (let i = 1; i <= 5; i++) {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log(`Requête ${i}: ${response.status} - Limite: ${response.headers['x-ratelimit-limit']} - Restant: ${response.headers['x-ratelimit-remaining']}`);
    }
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.log('❌ Rate limit atteint pour l\'API générale');
    } else {
      console.error('Erreur:', error.message);
    }
  }

  console.log('\n🔐 Test du rate limiting d\'authentification...');
  
  // Test du rate limiting d'authentification (5 requêtes/15min)
  try {
    for (let i = 1; i <= 7; i++) {
      try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        });
        console.log(`Tentative ${i}: ${response.status}`);
      } catch (error) {
        if (error.response) {
          if (error.response.status === 429) {
            console.log(`❌ Tentative ${i}: Rate limit atteint (429) - ${error.response.data.message}`);
            console.log(`   Headers: Limite=${error.response.headers['x-ratelimit-limit']}, Restant=${error.response.headers['x-ratelimit-remaining']}`);
            break;
          } else {
            console.log(`Tentative ${i}: ${error.response.status} - Limite: ${error.response.headers['x-ratelimit-limit']} - Restant: ${error.response.headers['x-ratelimit-remaining']}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Erreur lors du test d\'authentification:', error.message);
  }

  console.log('\n✅ Test du rate limiting terminé');
  console.log('\n📋 Configuration actuelle:');
  console.log('- API générale: 100 requêtes / 15 minutes');
  console.log('- Authentification: 5 requêtes / 15 minutes');
  console.log('- Headers exposés: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
}

if (require.main === module) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️  Ce test nécessite NODE_ENV=production pour activer le rate limiting');
    console.log('Usage: NODE_ENV=production node test-rate-limiting.js');
    process.exit(1);
  }

  testRateLimit().catch(error => {
    console.error('\n💥 Erreur fatale:', error.message);
    process.exit(1);
  });
}