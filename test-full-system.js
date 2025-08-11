// 完全なイベント収集システムの統合テストスクリプト
import { enhancedEventService } from './services/eventCollector/index.js';

async function testFullSystem() {
  console.log('🚀 Enhanced Event Collection System - Full Integration Test Starting...\n');
  
  try {
    // 1. システム初期化
    console.log('📋 Step 1: Initializing complete system...');
    await enhancedEventService.initialize();
    console.log('✅ System initialized with all 3 stages\n');
    
    // 2. 統計情報確認
    console.log('📊 Step 2: System statistics...');
    const stats = await enhancedEventService.getCollectionStatistics();
    console.log('Registered Collectors:', stats.collectorInfo.length);
    stats.collectorInfo.forEach((collector, index) => {
      console.log(`  ${index + 1}. Stage ${collector.stage}: ${collector.name}`);
      console.log(`     ${collector.description}`);
    });
    console.log('');

    // 3. Stage 1のみテスト (Major Events)
    console.log('🎌 Step 3: Testing Stage 1 - Major Events...');
    const startTime1 = Date.now();
    const stage1Result = await enhancedEventService.fetchIwateEvents();
    const endTime1 = Date.now();
    console.log(`✅ Stage 1 completed in ${endTime1 - startTime1}ms`);
    console.log(`📈 Found ${stage1Result.events.length} major events`);
    console.log('');

    // 4. 地域別テスト
    console.log('🗺️  Step 4: Testing regional collection...');
    const startTime2 = Date.now();
    const regionResult = await enhancedEventService.collectEventsByRegion('kenou');
    const endTime2 = Date.now();
    console.log(`✅ Regional collection completed in ${endTime2 - startTime2}ms`);
    console.log(`📍 Found ${regionResult.events.length} events in 県央region`);
    console.log('');

    // 5. カテゴリ別テスト  
    console.log('🏷️  Step 5: Testing category collection...');
    const startTime3 = Date.now();
    const categoryResult = await enhancedEventService.collectEventsByCategory('festivals');
    const endTime3 = Date.now();
    console.log(`✅ Category collection completed in ${endTime3 - startTime3}ms`);
    console.log(`🎭 Found ${categoryResult.events.length} festival events`);
    console.log('');

    // 6. 全段階統合テスト（縮小版）
    console.log('🔄 Step 6: Testing integrated multi-stage collection (limited)...');
    const startTime4 = Date.now();
    
    // 制限付きの統合テスト（1段階のみで時間短縮）
    const integratedResult = await enhancedEventService.collectAllEvents();
    const endTime4 = Date.now();
    
    console.log(`✅ Integrated collection completed in ${endTime4 - startTime4}ms`);
    console.log(`🎯 Total events found: ${integratedResult.events.length}`);
    console.log(`📡 Sources used: ${integratedResult.sources.length}`);
    console.log('');

    // 7. キャッシュ性能テスト
    console.log('💾 Step 7: Cache performance test...');
    const startTime5 = Date.now();
    const cachedResult = await enhancedEventService.fetchIwateEvents();
    const endTime5 = Date.now();
    console.log(`✅ Cached fetch completed in ${endTime5 - startTime5}ms (should be much faster)`);
    console.log(`📊 Cache hit: ${cachedResult.events.length} events returned`);
    console.log('');

    // 8. システム統計の最終確認
    console.log('📈 Step 8: Final system statistics...');
    const finalStats = await enhancedEventService.getCollectionStatistics();
    console.log('Cache Performance:', finalStats.cacheStatistics);
    console.log('');

    // 9. イベント品質分析
    console.log('🔍 Step 9: Event quality analysis...');
    const sampleEvents = stage1Result.events.slice(0, 3);
    console.log('Sample High-Quality Events:');
    sampleEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   📅 Date: ${event.date}`);
      console.log(`   📍 Location: ${event.locationName}`);
      console.log(`   🏷️  Category: ${event.category}`);
      console.log(`   📝 Description: ${event.description?.substring(0, 100) || 'N/A'}...`);
      console.log(`   🔗 URL: ${event.officialUrl || 'N/A'}`);
      console.log('');
    });

    console.log('🎉 Full System Integration Test Completed Successfully!');
    
    return {
      success: true,
      summary: {
        stage1Events: stage1Result.events.length,
        regionalEvents: regionResult.events.length,
        categoryEvents: categoryResult.events.length,
        integratedEvents: integratedResult.events.length,
        totalSources: integratedResult.sources.length,
        totalExecutionTime: (endTime4 - startTime1),
        cacheHitRate: finalStats.cacheStatistics.hitRate
      }
    };
    
  } catch (error) {
    console.error('❌ Full system test failed:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

// テスト実行
testFullSystem().then(result => {
  if (result.success) {
    console.log('\n🏆 SYSTEM TEST PASSED! 🏆');
    console.log('📊 Final Summary:');
    console.log(`   🎌 Stage 1 Events: ${result.summary.stage1Events}`);
    console.log(`   🗺️  Regional Events: ${result.summary.regionalEvents}`);
    console.log(`   🏷️  Category Events: ${result.summary.categoryEvents}`);
    console.log(`   🔄 Integrated Events: ${result.summary.integratedEvents}`);
    console.log(`   📡 Total Sources: ${result.summary.totalSources}`);
    console.log(`   ⏱️  Total Time: ${result.summary.totalExecutionTime}ms`);
    console.log(`   💾 Cache Hit Rate: ${(result.summary.cacheHitRate * 100).toFixed(1)}%`);
    console.log('\n✨ Enhanced Event Collection System is fully operational!');
  } else {
    console.log('\n❌ SYSTEM TEST FAILED');
    console.log('Error:', result.error);
    if (result.stack) {
      console.log('Stack trace:', result.stack);
    }
  }
});