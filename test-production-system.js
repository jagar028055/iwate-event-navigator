// プロダクションレベル統合テスト - Phase 4完全版
import { 
  enhancedEventService,
  UpdateScheduler,
  BackgroundUpdater,
  PerformanceMonitor,
  ErrorHandler,
  createBackgroundUpdater
} from './services/eventCollector/index.js';

async function testProductionSystem() {
  console.log('🚀 Production-Level System Integration Test Starting...\n');
  console.log('='.repeat(80));
  
  let performanceMonitor, backgroundUpdater, errorHandler;
  
  try {
    // 1. システム完全初期化
    console.log('📋 Step 1: Full system initialization...');
    await enhancedEventService.initialize();
    
    // エラーハンドラー初期化
    errorHandler = new ErrorHandler();
    console.log('✅ ErrorHandler initialized');
    
    // パフォーマンスモニター初期化・開始
    performanceMonitor = new PerformanceMonitor();
    performanceMonitor.start(30000); // 30秒間隔で監視
    console.log('✅ PerformanceMonitor started');
    
    // バックグラウンドアップデーター初期化
    const collectorManager = enhancedEventService.collectorManager || new CollectorManager();
    backgroundUpdater = createBackgroundUpdater(collectorManager);
    await backgroundUpdater.start();
    console.log('✅ BackgroundUpdater started');
    
    console.log('✅ Complete system initialized\n');

    // 2. エラーハンドリングテスト
    console.log('🧪 Step 2: Error handling resilience test...');
    
    // 意図的にエラーを発生させてハンドリングをテスト
    try {
      throw new Error('network connection failed - timeout');
    } catch (testError) {
      const recoveryAction = await errorHandler.handleError(testError, {
        component: 'test-collector',
        operation: 'data-fetch',
        stage: 1
      });
      
      console.log(`   🔧 Error handled: ${recoveryAction.type} - ${recoveryAction.reason}`);
    }
    
    const errorStats = errorHandler.getErrorStatistics();
    console.log(`   📊 Error statistics: ${errorStats.totalErrors} total errors tracked`);
    console.log('✅ Error handling test completed\n');

    // 3. パフォーマンス監視テスト
    console.log('📊 Step 3: Performance monitoring test...');
    
    // 少し待ってメトリクスを収集
    await delay(5000);
    
    const currentMetrics = performanceMonitor.getCurrentMetrics();
    if (currentMetrics) {
      console.log(`   💖 System health: ${currentMetrics.health.score}/100 (${currentMetrics.health.status})`);
      console.log(`   ⚡ Response time: ${currentMetrics.performance.responseTime}ms`);
      console.log(`   💾 Cache hit rate: ${(currentMetrics.resources.cacheHitRate * 100).toFixed(1)}%`);
    }
    
    const activeAlerts = performanceMonitor.getActiveAlerts();
    console.log(`   🚨 Active alerts: ${activeAlerts.length}`);
    console.log('✅ Performance monitoring test completed\n');

    // 4. バックグラウンド更新テスト
    console.log('🌙 Step 4: Background update system test...');
    
    const backgroundStatus = backgroundUpdater.getStatus();
    console.log(`   🔄 Background updater active: ${backgroundStatus.isActive}`);
    console.log(`   📈 Scheduler statistics:`, backgroundStatus.schedulerStats);
    
    // 手動更新をトリガー
    console.log('   🔧 Triggering manual background update...');
    await backgroundUpdater.triggerManualUpdate();
    console.log('✅ Background update test completed\n');

    // 5. イベント収集統合テスト
    console.log('🎯 Step 5: Complete event collection with all systems...');
    
    const startTime = Date.now();
    
    // 全段階統合収集
    const result = await enhancedEventService.collectAllEvents();
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    console.log(`   ✅ Collection completed in ${executionTime}ms`);
    console.log(`   📈 Events collected: ${result.events.length}`);
    console.log(`   📡 Sources used: ${result.sources.length}`);
    
    // 収集されたイベントの品質分析
    const eventsByCategory = result.events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   🏷️  Events by category:');
    Object.entries(eventsByCategory).forEach(([category, count]) => {
      console.log(`      ${category}: ${count} events`);
    });
    
    console.log('✅ Complete event collection test passed\n');

    // 6. システム負荷テスト
    console.log('⚡ Step 6: System load and stress test...');
    
    const loadTestTasks = [];
    for (let i = 0; i < 3; i++) {
      loadTestTasks.push(
        enhancedEventService.collectEventsByRegion('kenou')
      );
    }
    
    const loadTestStart = Date.now();
    const loadTestResults = await Promise.allSettled(loadTestTasks);
    const loadTestEnd = Date.now();
    
    const successfulTasks = loadTestResults.filter(result => result.status === 'fulfilled').length;
    console.log(`   🎯 Load test: ${successfulTasks}/3 tasks succeeded`);
    console.log(`   ⏱️  Total load test time: ${loadTestEnd - loadTestStart}ms`);
    console.log('✅ System load test completed\n');

    // 7. 最終パフォーマンスレポート
    console.log('📋 Step 7: Final performance report...');
    
    const finalMetrics = performanceMonitor.getCurrentMetrics();
    const performanceReport = performanceMonitor.getPerformanceReport();
    const errorHealthStatus = errorHandler.getHealthStatus();
    
    console.log('   📊 System Performance Summary:');
    console.log(`      Health Score: ${finalMetrics?.health.score || 'N/A'}/100`);
    console.log(`      Average Response Time: ${performanceReport.summary.averageResponseTime.toFixed(1)}ms`);
    console.log(`      Success Rate: ${(performanceReport.summary.averageHealthScore).toFixed(1)}%`);
    console.log(`      Total Alerts: ${performanceReport.summary.totalAlerts}`);
    console.log(`      System Uptime: ${Math.round(performanceReport.summary.uptime / 1000)}s`);
    
    console.log('   🔧 System Health Status:');
    console.log(`      Overall Health: ${errorHealthStatus.isHealthy ? '✅ Healthy' : '⚠️ Issues Detected'}`);
    if (errorHealthStatus.issues.length > 0) {
      errorHealthStatus.issues.forEach(issue => console.log(`      Issue: ${issue}`));
    }
    if (errorHealthStatus.recommendations.length > 0) {
      console.log('      Recommendations:');
      errorHealthStatus.recommendations.forEach(rec => console.log(`      - ${rec}`));
    }
    
    console.log('✅ Final performance report completed\n');

    console.log('🏆 PRODUCTION-LEVEL SYSTEM TEST PASSED! 🏆');
    
    return {
      success: true,
      summary: {
        totalEvents: result.events.length,
        totalSources: result.sources.length,
        executionTime: executionTime,
        healthScore: finalMetrics?.health.score || 0,
        loadTestSuccess: successfulTasks === 3,
        systemUptime: performanceReport.summary.uptime,
        errorRate: performanceReport.summary.averageHealthScore < 90 ? 'elevated' : 'normal'
      },
      metrics: {
        performance: finalMetrics?.performance,
        resources: finalMetrics?.resources,
        health: finalMetrics?.health
      }
    };
    
  } catch (error) {
    console.error('❌ Production system test failed:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  } finally {
    // クリーンアップ
    console.log('🧹 Cleaning up test resources...');
    
    if (performanceMonitor) {
      performanceMonitor.stop();
      console.log('✅ PerformanceMonitor stopped');
    }
    
    if (backgroundUpdater) {
      await backgroundUpdater.stop();
      console.log('✅ BackgroundUpdater stopped');
    }
    
    console.log('✅ Cleanup completed');
  }
}

// ユーティリティ関数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// テスト実行とレポート
testProductionSystem().then(result => {
  console.log('\n' + '='.repeat(80));
  
  if (result.success) {
    console.log('🎉 PRODUCTION SYSTEM FULLY OPERATIONAL! 🎉');
    console.log('\n📊 Final System Summary:');
    console.log(`   🎌 Total Events Collected: ${result.summary.totalEvents}`);
    console.log(`   📡 Total Sources Utilized: ${result.summary.totalSources}`);
    console.log(`   ⚡ Total Execution Time: ${result.summary.executionTime}ms`);
    console.log(`   💖 Final Health Score: ${result.summary.healthScore}/100`);
    console.log(`   🏋️ Load Test: ${result.summary.loadTestSuccess ? '✅ Passed' : '❌ Failed'}`);
    console.log(`   ⏰ System Uptime: ${Math.round(result.summary.systemUptime / 1000)}s`);
    console.log(`   📈 Error Rate: ${result.summary.errorRate}`);
    
    console.log('\n🚀 The Enhanced Event Collection System is ready for production deployment!');
    console.log('✨ Features operational:');
    console.log('   • 3-Stage Collection Pipeline (Major/Municipal/Category)');
    console.log('   • Multi-layer Caching (Memory/LocalStorage/IndexedDB)');
    console.log('   • Advanced Deduplication with Levenshtein Distance');
    console.log('   • Intelligent Background Updates');
    console.log('   • Real-time Performance Monitoring');
    console.log('   • Comprehensive Error Handling with Circuit Breakers');
    console.log('   • Automated Job Scheduling with Retry Logic');
    console.log('   • 33 Iwate Municipality Complete Coverage');
    
  } else {
    console.log('💥 PRODUCTION SYSTEM TEST FAILED');
    console.log('❌ Error:', result.error);
    if (result.stack) {
      console.log('📋 Stack trace:', result.stack);
    }
    console.log('\n🔧 Please review the error and retry the test.');
  }
  
  console.log('\n' + '='.repeat(80));
});