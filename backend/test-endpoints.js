#!/usr/bin/env node

// Test script to verify all API endpoints work correctly
import { initializeDatabase } from './database/postgres-init.js';

const API_BASE = 'http://localhost:3001/api';

async function testEndpoints() {
  try {
    console.log('🧪 Testing API Endpoints...\n');
    
    // Initialize database first
    await initializeDatabase();
    
    let authToken = null;
    let leagueId = null;
    
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      console.log(`✅ Health check: ${response.status} - Status: ${data.status}`);
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
      return;
    }
    
    // Test 2: Login
    console.log('\n2️⃣ Testing login...');
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'demo',
          password: 'demo123'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        authToken = data.token;
        console.log(`✅ Login successful: User ${data.user.username} (ID: ${data.user.id})`);
      } else {
        const error = await response.json();
        console.log(`❌ Login failed: ${response.status} - ${error.error}`);
        return;
      }
    } catch (error) {
      console.log('❌ Login request failed:', error.message);
      return;
    }
    
    // Test 3: Token verification
    console.log('\n3️⃣ Testing token verification...');
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Token verification successful: User ${data.user.username}`);
      } else {
        const error = await response.json();
        console.log(`❌ Token verification failed: ${response.status} - ${error.error}`);
        return;
      }
    } catch (error) {
      console.log('❌ Token verification request failed:', error.message);
      return;
    }
    
    // Test 4: Get leagues
    console.log('\n4️⃣ Testing get leagues...');
    try {
      const response = await fetch(`${API_BASE}/leagues`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const leagues = data.leagues || [];
        console.log(`✅ Leagues retrieved: ${leagues.length} leagues found`);
        if (leagues.length > 0) {
          leagueId = leagues[0].id;
          console.log(`   - Using league: ${leagues[0].name} (ID: ${leagueId})`);
        }
      } else {
        const error = await response.json();
        console.log(`❌ Get leagues failed: ${response.status} - ${error.error}`);
        return;
      }
    } catch (error) {
      console.log('❌ Get leagues request failed:', error.message);
      return;
    }
    
    if (!leagueId) {
      console.log('❌ No leagues found for user. Cannot test league-dependent endpoints.');
      return;
    }
    
    // Test 5: Get players
    console.log('\n5️⃣ Testing get players...');
    try {
      const response = await fetch(`${API_BASE}/players`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-league-id': leagueId.toString()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const players = data.players || [];
        console.log(`✅ Players retrieved: ${players.length} players found`);
      } else {
        const error = await response.json();
        console.log(`❌ Get players failed: ${response.status} - ${error.error}`);
      }
    } catch (error) {
      console.log('❌ Get players request failed:', error.message);
    }
    
    // Test 6: Get participants
    console.log('\n6️⃣ Testing get participants...');
    try {
      const response = await fetch(`${API_BASE}/participants`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'x-league-id': leagueId.toString()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const participants = data.participants || [];
        console.log(`✅ Participants retrieved: ${participants.length} participants found`);
      } else {
        const error = await response.json();
        console.log(`❌ Get participants failed: ${response.status} - ${error.error}`);
      }
    } catch (error) {
      console.log('❌ Get participants request failed:', error.message);
    }
    
    console.log('\n🎉 API endpoint testing completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    process.exit(0);
  }
}

testEndpoints();