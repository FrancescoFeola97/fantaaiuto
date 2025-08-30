#!/usr/bin/env node

/**
 * Backend-only test script for FantaAiuto API
 * Tests basic API functionality without frontend dependencies
 */

import fetch from 'node-fetch';

console.log('🧪 Running FantaAiuto Backend API Tests...\n');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

const TEST_USER = {
  username: 'testuser_' + Date.now(),
  email: 'test_' + Date.now() + '@fantaaiuto.test',
  password: 'testpassword123',
  displayName: 'Test User'
};

const TEST_PLAYERS = [
  { nome: 'Test Player 1', squadra: 'Test Team', ruolo: 'Por', prezzo: 1, fvm: 6 },
  { nome: 'Test Player 2', squadra: 'Test Team', ruolo: 'Ds', prezzo: 5, fvm: 8 },
  { nome: 'Test Player 3', squadra: 'Test Team', ruolo: 'M', prezzo: 10, fvm: 15 }
];

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

let authToken = null;

function logTest(name, success, error = null) {
  if (success) {
    console.log(`✅ ${name}`);
    testResults.passed++;
  } else {
    console.log(`❌ ${name}`);
    if (error) console.log(`   Error: ${error.message || error}`);
    testResults.failed++;
    testResults.errors.push({ test: name, error });
  }
}

async function apiRequest(method, endpoint, data = null, useAuth = true) {
  const url = `${API_URL}${endpoint}`;
  const options = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (useAuth && authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const responseData = await response.json();

  if (!response.ok) {
    const error = new Error(responseData.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.code = responseData.code;
    throw error;
  }

  return responseData;
}

async function runTests() {
  try {
    // Test 1: Health Check
    console.log('🔍 Testing Backend Health Check...');
    try {
      const health = await fetch(`${BASE_URL}/health`);
      const healthData = await health.json();
      logTest('Backend Health Check', healthData.status === 'ok');
    } catch (error) {
      logTest('Backend Health Check', false, error);
      console.log('\n❌ Backend is not running. Please start the backend server first.');
      return;
    }

    // Test 2: User Registration
    console.log('\n🔍 Testing User Registration...');
    try {
      const registerData = await apiRequest('POST', '/auth/register', TEST_USER, false);
      const success = registerData.token && registerData.user;
      logTest('User Registration', success);
      
      if (success) {
        authToken = registerData.token;
        console.log(`   Created user: ${registerData.user.username}`);
      } else {
        return;
      }
    } catch (error) {
      logTest('User Registration', false, error);
      return;
    }

    // Test 3: User Profile
    console.log('\n🔍 Testing User Profile...');
    try {
      const profileData = await apiRequest('GET', '/users/profile');
      const success = profileData.user && profileData.user.username === TEST_USER.username;
      logTest('Get User Profile', success);
    } catch (error) {
      logTest('Get User Profile', false, error);
    }

    // Test 4: Player Import
    console.log('\n🔍 Testing Player Import...');
    try {
      const importData = await apiRequest('POST', '/players/import', { 
        players: TEST_PLAYERS, 
        mode: '1' 
      });
      const success = (importData.imported > 0 || importData.updated > 0) && importData.total === TEST_PLAYERS.length;
      logTest('Import Players', success);
      console.log(`   Imported: ${importData.imported}, Updated: ${importData.updated}`);
    } catch (error) {
      logTest('Import Players', false, error);
    }

    // Test 5: Get Players
    console.log('\n🔍 Testing Get Players...');
    try {
      const playersData = await apiRequest('GET', '/players');
      const success = playersData.players && playersData.players.length >= TEST_PLAYERS.length;
      logTest('Get Players', success);
      console.log(`   Retrieved ${playersData.players.length} players`);
    } catch (error) {
      logTest('Get Players', false, error);
    }

    // Test 6: Update Player Status
    console.log('\n🔍 Testing Player Status Update...');
    try {
      const playersData = await apiRequest('GET', '/players');
      if (playersData.players && playersData.players.length > 0) {
        const testPlayer = playersData.players[0];
        const updateData = await apiRequest('PATCH', `/players/${testPlayer.id}/status`, {
          status: 'owned',
          costoReale: 25
        });
        const success = updateData.status === 'owned';
        logTest('Update Player Status', success);
        console.log(`   Updated player: ${testPlayer.nome} -> owned (cost: 25)`);
      } else {
        logTest('Update Player Status', false, 'No players available');
      }
    } catch (error) {
      logTest('Update Player Status', false, error);
    }

    // Test 7: Get Player Stats
    console.log('\n🔍 Testing Player Statistics...');
    try {
      const statsData = await apiRequest('GET', '/players/stats');
      const success = typeof statsData.totalBudget === 'number' && typeof statsData.budgetUsed === 'number';
      logTest('Get Player Stats', success);
      console.log(`   Budget: ${statsData.budgetUsed}/${statsData.totalBudget}, Players: ${statsData.playersOwned}/${statsData.maxPlayers}`);
    } catch (error) {
      logTest('Get Player Stats', false, error);
    }

    // Test 8: Participants Management
    console.log('\n🔍 Testing Participants Management...');
    try {
      // Create participant
      const createData = await apiRequest('POST', '/participants', { name: 'Test Participant' });
      const createSuccess = createData.participant && createData.participant.name === 'Test Participant';
      logTest('Create Participant', createSuccess);

      if (createSuccess) {
        const participantId = createData.participant.id;
        console.log(`   Created participant: ${createData.participant.name} (ID: ${participantId})`);
        
        // Get participants
        const participantsData = await apiRequest('GET', '/participants');
        const getSuccess = participantsData.participants.some(p => p.id === participantId);
        logTest('Get Participants', getSuccess);
        
        // Delete participant
        const deleteData = await apiRequest('DELETE', `/participants/${participantId}`);
        const deleteSuccess = deleteData.participantId === participantId;
        logTest('Delete Participant', deleteSuccess);
      }
    } catch (error) {
      logTest('Participants Management', false, error);
    }

    // Test 9: Formation Management
    console.log('\n🔍 Testing Formation Management...');
    try {
      // Create formation
      const createData = await apiRequest('POST', '/formations', {
        name: 'Test Formation',
        schema: '4-3-3',
        players: []
      });
      const createSuccess = createData.formation && createData.formation.name === 'Test Formation';
      logTest('Create Formation', createSuccess);

      if (createSuccess) {
        const formationId = createData.formation.id;
        console.log(`   Created formation: ${createData.formation.name} (${createData.formation.schema})`);
        
        // Get formations
        const formationsData = await apiRequest('GET', '/formations');
        const getSuccess = formationsData.formations.some(f => f.id === formationId);
        logTest('Get Formations', getSuccess);
        
        // Update formation
        const updateData = await apiRequest('PUT', `/formations/${formationId}`, { 
          name: 'Updated Formation' 
        });
        const updateSuccess = updateData.formationId === formationId;
        logTest('Update Formation', updateSuccess);
        
        // Delete formation
        const deleteData = await apiRequest('DELETE', `/formations/${formationId}`);
        const deleteSuccess = deleteData.formationId === formationId;
        logTest('Delete Formation', deleteSuccess);
      }
    } catch (error) {
      logTest('Formation Management', false, error);
    }

    // Test 10: User Login (different user)
    console.log('\n🔍 Testing User Login...');
    try {
      const loginData = await apiRequest('POST', '/auth/login', {
        username: 'admin',
        password: 'password'
      }, false);
      const success = loginData.token && loginData.user;
      logTest('User Login (admin)', success);
      
      if (success) {
        console.log(`   Logged in as: ${loginData.user.username}`);
      }
    } catch (error) {
      logTest('User Login (admin)', false, error);
    }

    // Print Results
    console.log('\n' + '='.repeat(50));
    console.log('🧪 Test Results Summary:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.errors.forEach(({ test, error }) => {
        console.log(`   • ${test}: ${error.message || error}`);
      });
    }
    
    const successRate = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
    console.log(`\n📈 Success Rate: ${successRate}%`);
    
    console.log('\n' + (testResults.failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed. Check the backend server and database.'));

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

// Run the tests
runTests().catch(console.error);