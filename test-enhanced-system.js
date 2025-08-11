// 新しいイベント収集システムのテストスクリプト
import { enhancedEventService } from './services/eventCollector/index.js';

async function testEnhancedSystem() {
  console.log('🚀 Enhanced Event Collection System Test Starting...\n');
  
  try {
    // 1. システム初期化テスト
    console.log('📋 Step 1: Initializing system...');
    await enhancedEventService.initialize();
    console.log('✅ System initialized successfully\n');
    
    // 2. 統計情報取得テスト  
    console.log('📊 Step 2: Getting system statistics...');
    const stats = await enhancedEventService.getCollectionStatistics();
    console.log('Cache Statistics:', stats.cacheStatistics);
    console.log('Collector Info:', stats.collectorInfo);
    console.log('✅ Statistics retrieved successfully\n');
    
    // 3. メインイベント収集テスト
    console.log('🎌 Step 3: Testing main event collection...');
    const startTime = Date.now();
    const result = await enhancedEventService.fetchIwateEvents();
    const endTime = Date.now();
    
    console.log(`✅ Collection completed in ${endTime - startTime}ms`);
    console.log(`📈 Found ${result.events.length} events`);
    console.log(`📡 Used ${result.sources.length} sources`);
    
    // イベント詳細のサンプル表示
    if (result.events.length > 0) {
      console.log('\n🎯 Sample Events:');
      result.events.slice(0, 3).forEach((event, index) => {
        console.log(`${index + 1}. ${event.title}`);
        console.log(`   📍 ${event.locationName}`);
        console.log(`   📅 ${event.date}`);
        console.log(`   🏷️  ${event.category}`);
        console.log('');
      });
    }
    
    // 4. キャッシュテスト
    console.log('💾 Step 4: Testing cache functionality...');
    const cachedResult = await enhancedEventService.fetchIwateEvents();
    console.log(`✅ Second call returned ${cachedResult.events.length} events (should be cached)`);
    
    // 5. 統計更新確認
    console.log('📊 Step 5: Checking updated statistics...');
    const updatedStats = await enhancedEventService.getCollectionStatistics();
    console.log('Updated Cache Hit Rate:', updatedStats.cacheStatistics.hitRate);
    
    console.log('\n🎉 All tests completed successfully!');
    
    return {
      success: true,
      eventCount: result.events.length,
      sourceCount: result.sources.length,
      executionTime: endTime - startTime
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// テスト実行
testEnhancedSystem().then(result => {
  if (result.success) {
    console.log('\n✅ Enhanced Event Collection System is working correctly!');
    console.log(`📊 Final Results: ${result.eventCount} events, ${result.sourceCount} sources, ${result.executionTime}ms`);
  } else {
    console.log('❌ System test failed:', result.error);
  }
});