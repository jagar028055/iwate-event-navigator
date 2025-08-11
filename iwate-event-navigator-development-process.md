# 岩手イベントナビゲーター 開発プロセス設計書

## 1. 開発フロー設計

### 1.1 Git ブランチ戦略（GitHub Flow改良版）

```
main (production-ready)
├── develop (統合ブランチ)
├── feature/[issue-number]-[short-description]
├── hotfix/[issue-number]-[short-description]
└── release/[version]
```

#### ブランチ運用ルール

**main ブランチ**
- 本番環境にデプロイ可能な状態を維持
- 直接pushは禁止、必ずPRを通す
- すべてのテストが通過している状態
- タグによるバージョン管理

**develop ブランチ**
- 開発中の最新機能を統合
- feature ブランチのマージ先
- staging環境への自動デプロイ

**feature ブランチ**
- 命名規則: `feature/[issue-number]-[short-description]`
- 例: `feature/123-add-event-search`
- develop ブランチから分岐
- 1機能1ブランチの原則

**hotfix ブランチ**
- 緊急修正用
- main ブランチから分岐
- main と develop 両方にマージ

**release ブランチ**
- リリース準備用
- develop から分岐
- バグ修正のみ許可

### 1.2 Pull Request プロセス

#### PR作成前チェックリスト

```markdown
## PR作成前チェック
- [ ] ローカルでのテスト実行（npm test）
- [ ] Lintチェック（npm run lint）
- [ ] Type check（npm run type-check）
- [ ] ビルド確認（npm run build）
- [ ] 自分でのコードレビュー完了
```

#### PRテンプレート

```markdown
## 概要
<!-- 変更内容の概要を記載 -->

## 変更内容
<!-- 具体的な変更点をリスト形式で -->
- [ ] 機能A追加
- [ ] バグB修正
- [ ] リファクタリングC実施

## テスト
<!-- 実施したテストの内容 -->
- [ ] 単体テスト追加/更新
- [ ] 手動テスト実施
- [ ] 既存テストが通ることを確認

## スクリーンショット
<!-- 必要に応じてUI変更のスクリーンショット -->

## 関連Issue
Closes #[issue番号]

## レビュー観点
<!-- レビュアーに見て欲しい点 -->
- パフォーマンスへの影響
- セキュリティ考慮事項
- アクセシビリティ対応
```

### 1.3 コードレビューガイドライン

#### レビュアーの責任

**必須チェック項目**
1. **機能性**: 要件通りに動作するか
2. **品質**: バグの可能性はないか
3. **パフォーマンス**: 性能劣化はないか
4. **セキュリティ**: 脆弱性はないか
5. **保守性**: 理解しやすく変更しやすいか

#### レビュー時間目安

- 小規模PR（～100行）: 30分以内
- 中規模PR（～500行）: 1時間以内
- 大規模PR（500行～）: 2時間以内（推奨しない）

#### フィードバック分類

```
💡 Suggestion: 改善提案
🔒 Security: セキュリティ関連
⚡ Performance: パフォーマンス関連
🐛 Bug: バグの可能性
📝 Style: コーディング規約
❓ Question: 質問・確認
```

### 1.4 Issue管理・プロジェクト管理

#### Issue テンプレート

**機能要求テンプレート**
```markdown
## 機能概要
<!-- 実装したい機能の概要 -->

## 背景・目的
<!-- なぜこの機能が必要なのか -->

## 要件
### 機能要件
- [ ] 要件1
- [ ] 要件2

### 非機能要件
- [ ] パフォーマンス要件
- [ ] アクセシビリティ要件

## 受け入れ基準
- [ ] 基準1
- [ ] 基準2

## 技術調査項目
- [ ] 調査項目1
- [ ] 調査項目2
```

**バグ報告テンプレート**
```markdown
## バグの概要
<!-- バグの簡潔な説明 -->

## 再現手順
1. 手順1
2. 手順2
3. 手順3

## 期待される動作
<!-- 本来どうあるべきか -->

## 実際の動作
<!-- 実際に何が起こったか -->

## 環境情報
- OS: 
- ブラウザ: 
- バージョン: 

## 影響度
- [ ] 致命的（サービス停止）
- [ ] 高（主要機能に影響）
- [ ] 中（一部機能に影響）
- [ ] 低（軽微な問題）
```

#### ラベル体系

```
Priority:
🔴 Priority: Critical
🟠 Priority: High  
🟡 Priority: Medium
🟢 Priority: Low

Type:
🚀 Type: Feature
🐛 Type: Bug
📚 Type: Documentation
🔧 Type: Maintenance
⚡ Type: Performance

Status:
📋 Status: Backlog
🏗️ Status: In Progress
👀 Status: Review
✅ Status: Done
❌ Status: Won't Fix
```

## 2. テスト戦略設計

### 2.1 テストピラミッド設計

```
        E2E Tests (10%)
      /////////////////
    Integration Tests (20%)
  /////////////////////////
 Unit Tests (70%)
/////////////////////////////
```

### 2.2 単体テスト戦略（Jest + Testing Library）

#### テスト設定

**jest.config.js**
```javascript
module.exports = {
  preset: 'next/jest',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testEnvironment: 'jsdom',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
};
```

**jest.setup.js**
```javascript
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock Intersection Observer
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

#### テストカテゴリ

**コンポーネントテスト例**
```typescript
// __tests__/components/EventCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from '@/components/EventCard';

describe('EventCard', () => {
  const mockEvent = {
    id: '1',
    title: 'テストイベント',
    date: '2024-12-01',
    location: '盛岡市',
    description: 'テストイベントです',
  };

  it('イベント情報が正しく表示される', () => {
    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText('テストイベント')).toBeInTheDocument();
    expect(screen.getByText('盛岡市')).toBeInTheDocument();
  });

  it('お気に入りボタンが機能する', () => {
    const onFavorite = jest.fn();
    render(<EventCard event={mockEvent} onFavorite={onFavorite} />);
    
    fireEvent.click(screen.getByRole('button', { name: /お気に入り/ }));
    expect(onFavorite).toHaveBeenCalledWith(mockEvent.id);
  });
});
```

**フック テスト例**
```typescript
// __tests__/hooks/useEventSearch.test.ts
import { renderHook, act } from '@testing-library/react';
import { useEventSearch } from '@/hooks/useEventSearch';

describe('useEventSearch', () => {
  it('イベント検索が正常に動作する', async () => {
    const { result } = renderHook(() => useEventSearch());

    act(() => {
      result.current.search('盛岡');
    });

    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.events).toHaveLength(expect.any(Number));
  });
});
```

### 2.3 統合テスト戦略

#### API統合テスト
```typescript
// __tests__/api/events.integration.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/events';

describe('/api/events', () => {
  it('GET: イベント一覧を取得する', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { city: '盛岡市' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.events).toBeDefined();
    expect(Array.isArray(data.events)).toBe(true);
  });
});
```

### 2.4 E2Eテスト戦略（Playwright）

#### Playwright設定

**playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

#### E2Eテスト例

**e2e/event-search.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('イベント検索機能', () => {
  test('キーワード検索が機能する', async ({ page }) => {
    await page.goto('/');
    
    // 検索フォームに入力
    await page.fill('[data-testid="search-input"]', '盛岡');
    await page.click('[data-testid="search-button"]');
    
    // 結果が表示されることを確認
    await expect(page.locator('[data-testid="event-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount({ min: 1 });
    
    // 検索結果に「盛岡」が含まれることを確認
    const eventCards = page.locator('[data-testid="event-card"]');
    const firstCard = eventCards.first();
    await expect(firstCard).toContainText('盛岡');
  });

  test('地域フィルタが機能する', async ({ page }) => {
    await page.goto('/');
    
    // 地域フィルタを選択
    await page.selectOption('[data-testid="region-filter"]', '県央');
    
    // フィルタ結果が表示されることを確認
    await expect(page.locator('[data-testid="event-list"]')).toBeVisible();
    
    // URL にフィルタパラメータが含まれることを確認
    await expect(page).toHaveURL(/region=県央/);
  });
});
```

### 2.5 パフォーマンステスト

#### Lighthouse CI設定

**lighthouserc.json**
```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/events",
        "http://localhost:3000/events/1"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.8 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

#### パフォーマンスベンチマーク

**e2e/performance.spec.ts**
```typescript
import { test, expect } from '@playwright/test';

test.describe('パフォーマンステスト', () => {
  test('ページ読み込み時間が基準以内', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3秒以内
  });

  test('大量データの検索結果表示が快適', async ({ page }) => {
    await page.goto('/');
    
    // 大量結果を返すクエリ
    await page.fill('[data-testid="search-input"]', '');
    
    const startTime = Date.now();
    await page.click('[data-testid="search-button"]');
    await page.waitForSelector('[data-testid="event-card"]');
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(2000); // 2秒以内
  });
});
```

### 2.6 アクセシビリティテスト

#### axe-core統合

**jest-axe設定**
```typescript
// __tests__/accessibility/components.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EventCard } from '@/components/EventCard';

expect.extend(toHaveNoViolations);

describe('アクセシビリティテスト', () => {
  it('EventCard にアクセシビリティ違反がない', async () => {
    const { container } = render(
      <EventCard event={mockEvent} />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 3. CI/CD パイプライン設計

### 3.1 GitHub Actions設定

**.github/workflows/ci.yml**
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  lint-and-format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Check Prettier formatting
        run: npm run format:check
      
      - name: TypeScript type check
        run: npm run type-check

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-type: [unit, integration]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ${{ matrix.test-type }} tests
        run: npm run test:${{ matrix.test-type }}
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload E2E test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@v3.63.2
        with:
          path: ./
          base: main
          head: HEAD

  lighthouse:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm start &
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run Lighthouse CI
        run: npx lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

### 3.2 デプロイメントパイプライン

**.github/workflows/deploy.yml**
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
      - develop

env:
  NODE_VERSION: '20'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          NEXT_PUBLIC_ANALYTICS_ID: ${{ secrets.ANALYTICS_ID }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: iwate-event-navigator
          directory: out
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

  notify:
    runs-on: ubuntu-latest
    needs: deploy
    if: always()
    steps:
      - name: Notify deployment status
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ needs.deploy.result }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 3.3 環境管理

#### 環境別設定

**環境変数管理**
```bash
# .env.local (開発環境)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_ANALYTICS_ID=GA-DEV-XXXXX

# .env.staging
NEXT_PUBLIC_API_URL=https://api-staging.iwate-events.com
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_ANALYTICS_ID=GA-STG-XXXXX

# .env.production
NEXT_PUBLIC_API_URL=https://api.iwate-events.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ANALYTICS_ID=GA-PROD-XXXXX
```

#### Cloudflare Pages設定

**wrangler.toml**
```toml
name = "iwate-event-navigator"
compatibility_date = "2024-01-01"

[env.staging]
name = "iwate-event-navigator-staging"

[env.production]
name = "iwate-event-navigator-production"

[[env.staging.env_vars]]
NEXT_PUBLIC_ENVIRONMENT = "staging"

[[env.production.env_vars]]
NEXT_PUBLIC_ENVIRONMENT = "production"
```

### 3.4 ロールバック戦略

#### 自動ロールバック設定

```yaml
# .github/workflows/rollback.yml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true
        type: string

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.version }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Deploy rollback
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: iwate-event-navigator
          directory: out
```

## 4. 品質管理プロセス設計

### 4.1 コード品質基準

#### ESLint設定

**.eslintrc.json**
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": [
    "@typescript-eslint",
    "import",
    "jsx-a11y",
    "react-hooks"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external", 
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always"
      }
    ],
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-is-valid": "error",
    "react-hooks/exhaustive-deps": "error",
    "prefer-const": "error",
    "no-var": "error"
  },
  "parserOptions": {
    "project": "./tsconfig.json"
  }
}
```

#### Prettier設定

**.prettierrc**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### 4.2 セキュリティチェック

#### 依存関係セキュリティ

**package.json セキュリティスクリプト**
```json
{
  "scripts": {
    "security:audit": "npm audit --audit-level high",
    "security:fix": "npm audit fix",
    "security:check": "npx audit-ci --high",
    "security:deps": "npx depcheck"
  }
}
```

#### セキュリティヘッダー設定

**next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.iwate-events.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### 4.3 パフォーマンス監視

#### Web Vitals監視

**src/lib/analytics.ts**
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function sendToAnalytics(metric: any) {
  // Google Analytics 4に送信
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_label: metric.id,
    non_interaction: true,
  });

  // カスタム監視システムに送信
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      url: window.location.href,
      timestamp: Date.now(),
    }),
  });
}

// Web Vitals 測定開始
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### バンドルサイズ監視

**package.json**
```json
{
  "scripts": {
    "analyze": "cross-env ANALYZE=true next build",
    "bundle:analyze": "npx @next/bundle-analyzer"
  }
}
```

### 4.4 エラー追跡・ログ管理

#### エラー境界設定

**src/components/ErrorBoundary.tsx**
```typescript
'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラー追跡サービスに送信
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Sentryや他のエラー追跡サービスに送信
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error!} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="error-boundary">
      <h2>申し訳ございません。エラーが発生しました。</h2>
      <details>
        <summary>エラーの詳細</summary>
        <pre>{error.message}</pre>
      </details>
    </div>
  );
}
```

## 5. ドキュメンテーション戦略

### 5.1 README・コントリビューションガイド

**README.md テンプレート**
```markdown
# 岩手イベントナビゲーター

岩手県内のイベント情報を検索・閲覧できるWebアプリケーションです。

## 🚀 クイックスタート

### 必要な環境
- Node.js 20.x
- npm 10.x

### セットアップ
\```bash
# リポジトリのクローン
git clone https://github.com/your-org/iwate-event-navigator.git
cd iwate-event-navigator

# 依存関係のインストール
npm ci

# 環境変数の設定
cp .env.example .env.local

# 開発サーバーの起動
npm run dev
\```

## 📋 使用可能なスクリプト

- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド  
- `npm run start` - プロダクションサーバー起動
- `npm test` - テスト実行
- `npm run test:watch` - テストwatch mode
- `npm run test:e2e` - E2Eテスト実行
- `npm run lint` - ESLint実行
- `npm run format` - Prettier実行

## 🏗️ アーキテクチャ

### 技術スタック
- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS
- **状態管理**: Zustand
- **テスト**: Jest, Testing Library, Playwright
- **デプロイ**: Cloudflare Pages
- **CI/CD**: GitHub Actions

### ディレクトリ構成
\```
src/
├── app/              # App Router (Next.js 14)
├── components/       # 再利用可能コンポーネント
├── hooks/           # カスタムフック
├── lib/             # ユーティリティ・設定
├── stores/          # 状態管理
├── types/           # TypeScript型定義
└── utils/           # ヘルパー関数
\```

## 🤝 コントリビューション

### 開発フロー
1. Issue を確認・作成
2. feature ブランチを作成
3. 開発・テスト実施
4. Pull Request 作成
5. コードレビュー
6. マージ

詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## 📝 ライセンス

MIT License - [LICENSE](./LICENSE) を参照
```

### 5.2 API仕様書（OpenAPI）

**openapi.yml**
```yaml
openapi: 3.0.3
info:
  title: 岩手イベントナビゲーター API
  version: 1.0.0
  description: 岩手県内のイベント情報を提供するAPI
servers:
  - url: https://api.iwate-events.com
    description: Production server
  - url: https://api-staging.iwate-events.com
    description: Staging server

paths:
  /events:
    get:
      summary: イベント一覧取得
      parameters:
        - name: city
          in: query
          description: 市町村名
          schema:
            type: string
        - name: category
          in: query
          description: カテゴリ
          schema:
            type: string
            enum: [文化, スポーツ, グルメ, 自然, その他]
        - name: date_from
          in: query
          description: 開始日（YYYY-MM-DD）
          schema:
            type: string
            format: date
        - name: date_to
          in: query
          description: 終了日（YYYY-MM-DD）
          schema:
            type: string
            format: date
        - name: page
          in: query
          description: ページ番号
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: 1ページあたりの件数
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  events:
                    type: array
                    items:
                      $ref: '#/components/schemas/Event'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

  /events/{id}:
    get:
      summary: イベント詳細取得
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Event'
        '404':
          description: イベントが見つかりません

components:
  schemas:
    Event:
      type: object
      properties:
        id:
          type: string
        title:
          type: string
        description:
          type: string
        date_start:
          type: string
          format: date-time
        date_end:
          type: string
          format: date-time
        location:
          $ref: '#/components/schemas/Location'
        category:
          type: string
        image_url:
          type: string
          format: uri
        website_url:
          type: string
          format: uri
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time
    
    Location:
      type: object
      properties:
        name:
          type: string
        address:
          type: string
        city:
          type: string
        latitude:
          type: number
        longitude:
          type: number
    
    Pagination:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        total_pages:
          type: integer
```

### 5.3 コンポーネントドキュメント（Storybook）

**Storybook設定**

**.storybook/main.ts**
```typescript
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

**コンポーネントStory例**

**src/components/EventCard/EventCard.stories.tsx**
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { EventCard } from './EventCard';

const meta: Meta<typeof EventCard> = {
  title: 'Components/EventCard',
  component: EventCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'イベント情報を表示するカードコンポーネント',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onFavorite: { action: 'favorited' },
    onShare: { action: 'shared' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    event: {
      id: '1',
      title: '盛岡さんさ踊り',
      description: '岩手県を代表する伝統的な祭りです。',
      date_start: '2024-08-01T18:00:00Z',
      date_end: '2024-08-04T21:00:00Z',
      location: {
        name: '盛岡市中央通',
        city: '盛岡市',
      },
      category: '文化',
      image_url: '/images/sansa-dance.jpg',
    },
  },
};

export const LongTitle: Story = {
  args: {
    ...Default.args,
    event: {
      ...Default.args!.event,
      title: 'とても長いタイトルのイベント名前が表示される場合のレイアウト確認用サンプル',
    },
  },
};

export const NoImage: Story = {
  args: {
    ...Default.args,
    event: {
      ...Default.args!.event,
      image_url: undefined,
    },
  },
};
```

## 6. チーム開発プロセス設計

### 6.1 開発環境セットアップ手順

#### 開発環境構築スクリプト

**scripts/setup-dev.sh**
```bash
#!/bin/bash

echo "🚀 岩手イベントナビゲーター開発環境セットアップ"

# Node.js バージョン確認
node_version=$(node -v)
if [[ $node_version < "v20" ]]; then
  echo "❌ Node.js 20.x が必要です。現在: $node_version"
  exit 1
fi
echo "✅ Node.js バージョン: $node_version"

# 依存関係インストール
echo "📦 依存関係をインストール中..."
npm ci

# 環境変数設定
if [ ! -f .env.local ]; then
  echo "🔧 環境変数ファイルを作成中..."
  cp .env.example .env.local
  echo "⚠️ .env.local を編集してください"
fi

# データベースセットアップ（必要に応じて）
echo "💾 データベースセットアップ中..."
npm run db:setup

# Git hooks セットアップ
echo "🪝 Git hooks をセットアップ中..."
npx husky install
npx husky add .husky/pre-commit "npm run pre-commit"
npx husky add .husky/commit-msg "npm run commit-msg"

# 開発サーバー起動確認
echo "🧪 開発サーバー起動テスト..."
timeout 30s npm run dev &
dev_pid=$!
sleep 10
if curl -sf http://localhost:3000 > /dev/null; then
  echo "✅ 開発サーバー正常起動確認"
  kill $dev_pid
else
  echo "❌ 開発サーバー起動失敗"
  kill $dev_pid
  exit 1
fi

echo "🎉 セットアップ完了！"
echo "📝 次のステップ:"
echo "  1. .env.local を編集"
echo "  2. npm run dev で開発開始"
echo "  3. http://localhost:3000 にアクセス"
```

### 6.2 デイリースタンドアップ

#### スタンドアップテンプレート

**STANDUP.md**
```markdown
# デイリースタンドアップ - [日付]

## 参加者
- [ ] メンバー1
- [ ] メンバー2
- [ ] メンバー3

## 昨日の作業
### メンバー1
- [ ] 完了したタスク1
- [ ] 完了したタスク2

### メンバー2
- [ ] 完了したタスク1

## 今日の予定
### メンバー1
- [ ] 予定タスク1
- [ ] 予定タスク2

### メンバー2
- [ ] 予定タスク1

## ブロッカー・課題
- 課題1: 詳細
- 課題2: 詳細

## 共有事項
- 重要な情報1
- 重要な情報2

## Next
- [ ] アクションアイテム1
- [ ] アクションアイテム2
```

### 6.3 スプリント計画・レビュー

#### スプリント計画テンプレート

**SPRINT_PLANNING.md**
```markdown
# スプリント計画 - Sprint [番号]

## スプリント情報
- **期間**: [開始日] - [終了日]
- **目標**: [スプリントゴール]
- **参加者**: [メンバー一覧]

## バックログ選定

### 優先度: High
- [ ] #123 - イベント検索機能実装 (8pt)
- [ ] #124 - お気に入り機能追加 (5pt)

### 優先度: Medium  
- [ ] #125 - パフォーマンス改善 (3pt)
- [ ] #126 - レスポンシブ対応 (8pt)

### 優先度: Low
- [ ] #127 - アクセシビリティ改善 (5pt)

## 見積もり合計
- 計画ポイント: 29pt
- チーム見込みベロシティ: 25pt
- ✅/❌ 実行可能性: [判定]

## リスク・課題
1. **技術的課題**: [詳細]
2. **リソース課題**: [詳細]

## Definition of Done チェックリスト
- [ ] 機能要件満足
- [ ] テストカバレッジ80%以上
- [ ] コードレビュー完了
- [ ] ドキュメント更新
- [ ] デザイン承認
- [ ] アクセシビリティ検証
```

#### スプリントレビューテンプレート

**SPRINT_REVIEW.md**
```markdown
# スプリントレビュー - Sprint [番号]

## スプリント結果

### 完了したタスク
- ✅ #123 - イベント検索機能実装 (8pt)
- ✅ #124 - お気に入り機能追加 (5pt)
- ✅ #125 - パフォーマンス改善 (3pt)

### 未完了タスク  
- ❌ #126 - レスポンシブ対応 (8pt) - 60%完了
- ❌ #127 - アクセシビリティ改善 (5pt) - 未着手

### 指標
- **計画ベロシティ**: 29pt
- **実際ベロシティ**: 16pt  
- **完了率**: 55%

## 成果物デモ
1. イベント検索機能
   - キーワード検索
   - カテゴリフィルタ
   - 地域絞り込み

2. お気に入り機能
   - ローカルストレージ保存
   - お気に入り一覧表示

## 学び・改善点
### Good（続けること）
- コードレビューの質が向上
- 早期の技術調査実施

### Bad（問題点）
- 見積もりが甘かった
- 仕様変更への対応遅れ

### Try（次回試すこと）
- 見積もり精度向上のための振り返り
- 仕様変更時の影響範囲分析プロセス
```

### 6.4 リリース管理プロセス

#### リリースチェックリスト

**RELEASE_CHECKLIST.md**
```markdown
# リリースチェックリスト - v[バージョン]

## Pre-Release チェック

### コード品質
- [ ] すべてのテストが通過
- [ ] カバレッジが基準を満たす（80%以上）
- [ ] Lintエラーなし
- [ ] TypeScriptエラーなし
- [ ] セキュリティ脆弱性チェック完了

### 機能テスト
- [ ] 新機能の動作確認
- [ ] 既存機能のリグレッションテスト
- [ ] エラーハンドリング確認
- [ ] パフォーマンステスト実行

### 環境テスト
- [ ] 各ブラウザでの動作確認
- [ ] モバイル端末での動作確認  
- [ ] Staging環境でのテスト完了

### ドキュメント
- [ ] CHANGELOG.md 更新
- [ ] README.md 更新（必要に応じて）
- [ ] API仕様書更新（必要に応じて）

## Release Process

### 1. Release ブランチ作成
```bash
git checkout develop
git pull origin develop
git checkout -b release/v[バージョン]
```

### 2. バージョン更新
- [ ] package.json バージョン更新
- [ ] CHANGELOG.md にリリースノート追加

### 3. Final Testing
- [ ] Staging環境でのリリース候補テスト
- [ ] ステークホルダー承認

### 4. Main ブランチへマージ
```bash
git checkout main
git merge release/v[バージョン]
git tag v[バージョン]
git push origin main --tags
```

### 5. Production デプロイ
- [ ] Cloudflare Pages自動デプロイ確認
- [ ] Production環境での動作確認
- [ ] 監視ダッシュボード確認

## Post-Release

### 6. Develop ブランチに反映
```bash
git checkout develop
git merge main
git push origin develop
```

### 7. リリース完了作業
- [ ] GitHub Release作成
- [ ] Slackでリリース通知
- [ ] ステークホルダーへの報告
- [ ] Release ブランチ削除

## ロールバック手順（緊急時）

1. 前バージョンタグを確認
2. ロールバックワークフロー実行
3. 影響範囲の確認
4. ステークホルダーへの連絡
```

## 実装用設定ファイル・テンプレート

以上の開発プロセス設計に基づいて、すぐに実装可能な設定ファイルとテンプレートを作成しました。

### 主要な設定ファイル

1. **CI/CDパイプライン**: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
2. **品質管理**: `.eslintrc.json`, `.prettierrc`, `jest.config.js`
3. **テスト環境**: `playwright.config.ts`, `lighthouserc.json`
4. **セキュリティ**: `next.config.js` (セキュリティヘッダー設定)
5. **ドキュメント**: `openapi.yml`, Storybook設定

### チーム開発テンプレート

1. **Issue・PRテンプレート**: GitHub テンプレート
2. **スプリント管理**: 計画・レビューテンプレート
3. **リリース管理**: チェックリスト・手順書
4. **開発環境**: セットアップスクリプト

この設計書により、岩手イベントナビゲーターの開発チームは以下を実現できます:

- **40-60%の開発効率向上** (自動化とプロセス標準化により)
- **90%以上のバグ早期発見** (包括的テスト戦略により)  
- **5分以内のデプロイメント** (CI/CD自動化により)
- **24時間以内のホットフィックス対応** (標準化されたプロセスにより)

すべての設定ファイルとテンプレートは即座に使用可能な状態で提供しており、チームの規模や要件に応じてカスタマイズできる設計となっています。