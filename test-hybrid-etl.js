// Simple test script for Hybrid ETL system
// Set Node env flags for fast, deterministic PoC
process.env.VITE_CITY_SCOPE = process.env.VITE_CITY_SCOPE || 'morioka';
process.env.CITY_SCOPE = process.env.CITY_SCOPE || 'morioka';
process.env.FORCE_MOCK_FETCH = process.env.FORCE_MOCK_FETCH || '1';
process.env.HTTP_TIMEOUT_MS = process.env.HTTP_TIMEOUT_MS || '3000';

import { hybridETLService } from './services/hybridETLService.ts';

async function testHybridETL() {
  console.log('🚀 Testing Hybrid ETL System...');
  
  try {
    const startTime = Date.now();
    
    console.log('📡 Attempting to fetch events...');
    const result = await hybridETLService.fetchIwateEvents();
    
    const executionTime = Date.now() - startTime;
    
    console.log('✅ Hybrid ETL Test Results:');
    console.log(`   Events found: ${result.events.length}`);
    console.log(`   Sources used: ${result.sources.length}`);
    console.log(`   Execution time: ${executionTime}ms`);
    
    if (result.events.length > 0) {
      console.log('\n📅 Sample events:');
      result.events.slice(0, 5).forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title}`);
        console.log(`      Date: ${event.date}`);
        console.log(`      Location: ${event.locationName}`);
        console.log(`      Category: ${event.category}`);
        console.log('');
      });
    }
    
    if (result.sources.length > 0) {
      console.log('🔗 Sources:');
      result.sources.forEach((source, index) => {
        console.log(`   ${index + 1}. ${source.name} (${source.type})`);
      });
    }
    
    // Get system statistics
    const stats = hybridETLService.getStatistics();
    console.log('\n📊 System Statistics:');
    console.log(`   Total sources: ${stats.sources.total}`);
    console.log(`   Enabled sources: ${stats.sources.enabled}`);
    console.log(`   Average reliability: ${(stats.sources.averageReliability * 100).toFixed(1)}%`);
    
    console.log('\n🎉 Hybrid ETL system is working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Hybrid ETL test failed:', error);
    console.error('   Error details:', error.message);
    console.error('   Stack trace:', error.stack);
    return false;
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testHybridETL()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { testHybridETL };
