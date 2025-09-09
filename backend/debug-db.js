#!/usr/bin/env node

// Debug script to check database state
import { initializeDatabase, getDatabase } from './database/postgres-init.js';

async function debugDatabase() {
  try {
    console.log('🔍 Debugging Database State...\n');
    
    // Initialize database first
    await initializeDatabase();
    const db = getDatabase();
    
    // Check users
    const users = await db.all('SELECT id, username, email FROM users ORDER BY created_at DESC LIMIT 10');
    console.log('👥 Recent Users:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
    });
    console.log();
    
    // Check leagues
    const leagues = await db.all('SELECT id, name, code, owner_id FROM leagues ORDER BY created_at DESC LIMIT 10');
    console.log('🏆 Recent Leagues:');
    leagues.forEach(league => {
      console.log(`  - ID: ${league.id}, Name: ${league.name}, Code: ${league.code}, Owner: ${league.owner_id}`);
    });
    console.log();
    
    // Check league membership for each user
    console.log('🔗 League Memberships:');
    for (const user of users.slice(0, 5)) { // Check first 5 users
      const memberships = await db.all(
        'SELECT lm.league_id, lm.role, l.name FROM league_members lm JOIN leagues l ON lm.league_id = l.id WHERE lm.user_id = ?',
        [user.id]
      );
      
      console.log(`  User ${user.username} (${user.id}):`);
      if (memberships.length === 0) {
        console.log('    ❌ No league memberships found');
      } else {
        memberships.forEach(m => {
          console.log(`    ✅ League: ${m.name} (ID: ${m.league_id}) - Role: ${m.role}`);
        });
      }
    }
    console.log();
    
    // Check if any user has both leagues and no membership (data inconsistency)
    const usersWithoutMembership = await db.all(`
      SELECT u.id, u.username 
      FROM users u 
      WHERE NOT EXISTS (
        SELECT 1 FROM league_members lm WHERE lm.user_id = u.id
      )
      LIMIT 5
    `);
    
    console.log('⚠️ Users without any league membership:');
    if (usersWithoutMembership.length === 0) {
      console.log('  ✅ All users have league memberships');
    } else {
      usersWithoutMembership.forEach(user => {
        console.log(`  - ${user.username} (ID: ${user.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database debug failed:', error);
  } finally {
    process.exit(0);
  }
}

debugDatabase();