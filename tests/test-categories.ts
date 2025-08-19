/**
 * テスト重要度分類システム
 * 
 * Critical: サイト表示・基本ナビゲーション（失敗時はデプロイブロック）
 * Important: イベント検索・地図機能（失敗時は警告）
 * Nice-to-have: デザイン詳細・パフォーマンス（失敗時はログのみ）
 */

export enum TestCategory {
  CRITICAL = 'critical',
  IMPORTANT = 'important', 
  NICE_TO_HAVE = 'nice-to-have'
}

export interface TestResult {
  category: TestCategory;
  testName: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  duration?: number;
}

export class TestCategorizer {
  private results: TestResult[] = [];
  
  addResult(result: TestResult) {
    this.results.push(result);
  }
  
  getCriticalFailures(): TestResult[] {
    return this.results.filter(r => 
      r.category === TestCategory.CRITICAL && r.status === 'fail'
    );
  }
  
  getImportantFailures(): TestResult[] {
    return this.results.filter(r => 
      r.category === TestCategory.IMPORTANT && r.status === 'fail'
    );
  }
  
  shouldBlockDeployment(): boolean {
    return this.getCriticalFailures().length > 0;
  }
  
  generateReport(): string {
    const critical = this.getCriticalFailures();
    const important = this.getImportantFailures();
    
    let report = '🧪 テスト結果レポート\n';
    report += '='.repeat(50) + '\n\n';
    
    if (critical.length === 0) {
      report += '✅ Critical テスト: すべて通過\n';
    } else {
      report += `❌ Critical テスト: ${critical.length}件失敗\n`;
      critical.forEach(test => {
        report += `  - ${test.testName}: ${test.error || 'Unknown error'}\n`;
      });
    }
    
    if (important.length === 0) {
      report += '✅ Important テスト: すべて通過\n';
    } else {
      report += `⚠️ Important テスト: ${important.length}件失敗\n`;
      important.forEach(test => {
        report += `  - ${test.testName}: ${test.error || 'Unknown error'}\n`;
      });
    }
    
    report += '\n';
    
    if (this.shouldBlockDeployment()) {
      report += '🚫 デプロイメント結果: ブロック（Critical テスト失敗）\n';
    } else if (important.length > 0) {
      report += '⚠️ デプロイメント結果: 警告付きで継続\n';
    } else {
      report += '🎉 デプロイメント結果: 成功\n';
    }
    
    return report;
  }
}

// テスト分類マッピング
export const TEST_CATEGORIES: Record<string, TestCategory> = {
  // Critical Tests - これらが失敗したらデプロイをブロック
  'ページが正常に読み込まれる': TestCategory.CRITICAL,
  'JavaScriptエラーが発生しない': TestCategory.CRITICAL,
  '環境変数の正しい設定確認': TestCategory.CRITICAL,
  'レスポンシブデザインが機能する': TestCategory.CRITICAL,
  
  // Important Tests - 失敗時は警告
  '地図コンポーネントが表示される': TestCategory.IMPORTANT,
  'イベント検索機能が動作する': TestCategory.IMPORTANT,
  'Gemini API接続テスト': TestCategory.IMPORTANT,
  'アプリケーション内でのAPI呼び出しテスト': TestCategory.IMPORTANT,
  '地図サービスの可用性確認': TestCategory.IMPORTANT,
  
  // Nice-to-have Tests - 失敗してもログのみ
  'ページのパフォーマンスが許容範囲内': TestCategory.NICE_TO_HAVE,
  '外部リソースの可用性確認': TestCategory.NICE_TO_HAVE,
};

export function getTestCategory(testName: string): TestCategory {
  return TEST_CATEGORIES[testName] || TestCategory.NICE_TO_HAVE;
}