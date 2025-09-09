#!/usr/bin/env node

// Script to create demo league for testing
import { initializeDatabase, getDatabase } from './database/postgres-init.js';

async function createDemoLeague() {
  try {
    console.log('🏆 Creating Demo League...\n');
    
    // Initialize database first
    await initializeDatabase();
    const db = getDatabase();
    
    // Find demo user
    const demoUser = await db.get('SELECT id FROM users WHERE username = ?', ['demo']);
    
    if (!demoUser) {
      console.log('❌ Demo user not found. Creating one...');
      // You might want to create a demo user here
      return;
    }
    
    console.log(`👤 Found demo user with ID: ${demoUser.id}`);
    
    // Check if demo user already has leagues
    const existingLeagues = await db.all(
      'SELECT l.* FROM leagues l JOIN league_members lm ON l.id = lm.league_id WHERE lm.user_id = ?',
      [demoUser.id]
    );
    
    if (existingLeagues.length > 0) {
      console.log('✅ Demo user already has leagues:');
      existingLeagues.forEach(league => {
        console.log(`  - ${league.name} (ID: ${league.id}, Code: ${league.code})`);
      });
      return;
    }
    
    // Create demo league
    const result = await db.get(`
      INSERT INTO leagues (name, owner_id, game_mode, description) 
      VALUES (?, ?, ?, ?) 
      RETURNING id, name, code
    `, [
      'Lega Demo',
      demoUser.id, 
      'Mantra',
      'Lega di esempio per testing'
    ]);
    
    console.log(`✅ Created demo league: ${result.name} (ID: ${result.id}, Code: ${result.code})`);
    
    // Verify the trigger worked (user should be added as master)
    const membership = await db.get(
      'SELECT * FROM league_members WHERE league_id = ? AND user_id = ?',
      [result.id, demoUser.id]
    );
    
    if (membership) {
      console.log(`✅ Demo user automatically added as ${membership.role} to the league`);
    } else {
      console.log('❌ Demo user was not added to league (trigger failed?)');
    }
    
  } catch (error) {
    console.error('❌ Failed to create demo league:', error);
  } finally {
    process.exit(0);
  }
}

createDemoLeague();