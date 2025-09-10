#!/usr/bin/env node

// Test script to verify import/batch endpoint works correctly
const API_BASE = 'http://localhost:3002/api';

async function testImportEndpoint() {
  try {
    console.log('🧪 Testing Import/Batch Endpoint...\n');
    
    let authToken = null;
    let leagueId = null;
    
    // Login first
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'demo',
        password: 'demo123'
      })
    });
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      authToken = data.token;
      console.log(`✅ Login successful: User ${data.user.username}`);
    } else {
      console.log('❌ Login failed');
      return;
    }
    
    // Get leagues
    console.log('\n2️⃣ Getting leagues...');
    const leaguesResponse = await fetch(`${API_BASE}/leagues`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (leaguesResponse.ok) {
      const data = await leaguesResponse.json();
      const leagues = data.leagues || [];
      if (leagues.length > 0) {
        leagueId = leagues[0].id;
        console.log(`✅ Using league: ${leagues[0].name} (ID: ${leagueId})`);
      } else {
        console.log('❌ No leagues found');
        return;
      }
    } else {
      console.log('❌ Failed to get leagues');
      return;
    }
    
    // Test import/batch endpoint
    console.log('\n3️⃣ Testing import/batch endpoint...');
    const importResponse = await fetch(`${API_BASE}/players/import/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-league-id': leagueId.toString(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        players: [
          {
            nome: 'Test Player 1',
            squadra: 'Test Team',
            ruolo: 'Por',
            prezzo: 10,
            fvm: 5
          },
          {
            nome: 'Test Player 2',
            squadra: 'Test Team',
            ruolo: 'Ds',
            prezzo: 15,
            fvm: 8
          }
        ],
        batchSize: 100
      })
    });
    
    if (importResponse.ok) {
      const data = await importResponse.json();
      console.log(`✅ Import successful: ${data.processed} players processed`);
    } else {
      const error = await importResponse.json();
      console.log(`❌ Import failed: ${importResponse.status} - ${error.error}`);
    }
    
    console.log('\n🎉 Import endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testImportEndpoint();