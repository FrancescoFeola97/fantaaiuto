#!/usr/bin/env node

/**
 * Simple test script for FantaAiuto Backend
 * Tests basic API functionality
 */

import { apiClient } from '../src/services/ApiClient.js';

console.log('🧪 Running FantaAiuto Backend Tests...\n');

// Test configuration
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

async function runTests() {
  try {
    // Test 1: Health Check
    console.log('🔍 Testing Backend Health Check...');
    try {
      const health = await fetch('http://localhost:3001/health');
      const healthData = await health.json();
      logTest('Backend Health Check', healthData.status === 'ok');
    } catch (error) {
      logTest('Backend Health Check', false, error);
      console.log('\n❌ Backend is not running. Please start the backend server first:');
      console.log('   cd backend && npm start');
      return;
    }

    // Test 2: User Registration
    console.log('\n🔍 Testing User Registration...');
    try {
      const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
      });
      
      const registerData = await registerResponse.json();
      const success = registerResponse.ok && registerData.token;
      logTest('User Registration', success, !success ? registerData : null);
      
      if (success) {
        apiClient.setToken(registerData.token);
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
      const profileData = await apiClient.getUserProfile();
      const success = profileData.user && profileData.user.username === TEST_USER.username;
      logTest('Get User Profile', success);
    } catch (error) {
      logTest('Get User Profile', false, error);
    }

    // Test 4: Player Import
    console.log('\n🔍 Testing Player Import...');
    try {
      const importData = await apiClient.importPlayers(TEST_PLAYERS, '1');
      const success = importData.imported > 0 || importData.updated > 0;
      logTest('Import Players', success);
    } catch (error) {
      logTest('Import Players', false, error);
    }

    // Test 5: Get Players
    console.log('\n🔍 Testing Get Players...');
    try {
      const playersData = await apiClient.getPlayers();
      const success = playersData.players && playersData.players.length >= TEST_PLAYERS.length;
      logTest('Get Players', success);
    } catch (error) {
      logTest('Get Players', false, error);
    }

    // Test 6: Update Player Status
    console.log('\n🔍 Testing Player Status Update...');
    try {
      const playersData = await apiClient.getPlayers();
      if (playersData.players && playersData.players.length > 0) {
        const testPlayer = playersData.players[0];
        const updateData = await apiClient.updatePlayerStatus(testPlayer.id, 'owned', 25);
        const success = updateData.status === 'owned';
        logTest('Update Player Status', success);
      } else {
        logTest('Update Player Status', false, 'No players available');
      }
    } catch (error) {
      logTest('Update Player Status', false, error);
    }

    // Test 7: Get Player Stats
    console.log('\n🔍 Testing Player Statistics...');
    try {
      const statsData = await apiClient.getPlayersStats();
      const success = typeof statsData.totalBudget === 'number' && typeof statsData.budgetUsed === 'number';
      logTest('Get Player Stats', success);
    } catch (error) {
      logTest('Get Player Stats', false, error);
    }

    // Test 8: Participants Management
    console.log('\n🔍 Testing Participants Management...');
    try {
      // Create participant
      const createData = await apiClient.createParticipant('Test Participant');
      const createSuccess = createData.participant && createData.participant.name === 'Test Participant';
      logTest('Create Participant', createSuccess);

      if (createSuccess) {
        const participantId = createData.participant.id;
        
        // Get participants
        const participantsData = await apiClient.getParticipants();
        const getSuccess = participantsData.participants.some(p => p.id === participantId);
        logTest('Get Participants', getSuccess);
        
        // Delete participant
        const deleteData = await apiClient.deleteParticipant(participantId);
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
      const createData = await apiClient.createFormation('Test Formation', '4-3-3', []);
      const createSuccess = createData.formation && createData.formation.name === 'Test Formation';
      logTest('Create Formation', createSuccess);

      if (createSuccess) {
        const formationId = createData.formation.id;
        
        // Get formations
        const formationsData = await apiClient.getFormations();
        const getSuccess = formationsData.formations.some(f => f.id === formationId);
        logTest('Get Formations', getSuccess);
        
        // Update formation
        const updateData = await apiClient.updateFormation(formationId, { name: 'Updated Formation' });
        const updateSuccess = updateData.formationId === formationId;
        logTest('Update Formation', updateSuccess);
        
        // Delete formation
        const deleteData = await apiClient.deleteFormation(formationId);
        const deleteSuccess = deleteData.formationId === formationId;
        logTest('Delete Formation', deleteSuccess);
      }
    } catch (error) {
      logTest('Formation Management', false, error);
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
    
    console.log('\n' + (testResults.failed === 0 ? '🎉 All tests passed!' : '⚠️  Some tests failed. Check the backend server and database.'));

  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
  }
}

// Run the tests
runTests().catch(console.error);