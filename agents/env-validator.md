# Environment Validator Agent

## Overview
Specialized agent for validating and fixing environment variable configurations across development, build, and deployment environments. Ensures proper environment variable setup for Vite + React projects deployed to GitHub Pages and Cloudflare Pages.

## Agent Capabilities

### 1. Environment Variable Detection
- **Missing Variables**: Required environment variables not defined
- **Incorrect Naming**: Variables not following Vite conventions (VITE_ prefix)
- **Deployment Mismatches**: Variables available locally but not in deployment
- **Type Validation**: Environment variables with incorrect data types or formats
- **Security Issues**: Sensitive variables exposed in client-side code

### 2. Configuration Validation
- **Development Environment**: Local .env files and configurations
- **Build Environment**: Variables needed during build process
- **Runtime Environment**: Variables available to the running application
- **Deployment Platforms**: GitHub Secrets, Cloudflare Pages environment variables

### 3. Automatic Fixes
- **Variable Renaming**: Add VITE_ prefix for client-side variables
- **Build Configuration**: Update Vite config to properly handle environment variables
- **Deployment Setup**: Generate instructions for setting platform-specific variables
- **Security Hardening**: Move sensitive variables to server-side or build-time only

## Usage Pattern

```
Task: env-validator
"Validate environment variables for [environment: development|build|production] and fix any issues"
```

## Implementation

### Environment Variable Analysis Framework
```typescript
interface EnvIssue {
  id: string;
  type: 'missing' | 'naming' | 'security' | 'type' | 'deployment';
  severity: 'critical' | 'warning' | 'info';
  variable: string;
  current_value?: string;
  expected_value?: string;
  environment: 'development' | 'build' | 'runtime' | 'deployment';
  fix_action: EnvFixAction;
}

interface EnvFixAction {
  action: 'create' | 'rename' | 'move' | 'secure' | 'configure';
  target: string; // file path or platform
  description: string;
  commands?: string[];
  instructions?: string[];
}
```

### Environment Variable Patterns

#### Vite-Specific Rules
```typescript
// Client-side variables (available in browser)
VITE_API_URL=https://api.example.com
VITE_APP_NAME=MyApp
VITE_ENVIRONMENT=production

// Build-time variables (not available in browser)
NODE_ENV=production
BUILD_PATH=dist
GEMINI_API_KEY=secret_key_here
```

#### Security Classifications
```typescript
// Safe for client-side exposure
const CLIENT_SAFE = [
  'VITE_API_URL',
  'VITE_APP_NAME', 
  'VITE_VERSION',
  'VITE_ENVIRONMENT'
];

// Must remain server-side/build-time only
const SERVER_ONLY = [
  'GEMINI_API_KEY',
  'DATABASE_URL',
  'JWT_SECRET',
  'PRIVATE_KEY'
];
```

## Issue Detection Patterns

### 1. Missing Environment Variables
```bash
# Scan for undefined environment variables in code
grep -r "import.meta.env\." src/ | extract variable names
grep -r "process.env\." src/ | extract variable names
# Cross-reference with .env files and deployment configs
```

### 2. Incorrect Naming Conventions
```bash
# Find variables used in client-side code without VITE_ prefix
grep -r "import.meta.env\.[^V]" src/
# Find server-side variables incorrectly exposed to client
grep -r "import.meta.env\.(?!VITE_)" src/
```

### 3. Deployment Configuration Issues
```yaml
# GitHub Actions missing environment variables
# Check workflow files for env: sections
# Verify GitHub repository secrets exist
```

### 4. Security Issues
```typescript
// Client-side code exposing sensitive data
const apiKey = import.meta.env.API_KEY; // ❌ Should be build-time only
const apiUrl = import.meta.env.VITE_API_URL; // ✅ Safe for client
```

## Fix Strategies

### 1. Variable Naming Fixes
```typescript
// Before: Incorrect naming
const apiUrl = import.meta.env.API_URL; // ❌

// After: Correct Vite naming
const apiUrl = import.meta.env.VITE_API_URL; // ✅
```

### 2. Build Configuration Updates
```typescript
// vite.config.ts - Proper environment variable handling
export default defineConfig({
  define: {
    // Build-time variable injection
    '__API_KEY__': JSON.stringify(process.env.GEMINI_API_KEY),
    // Client-safe variables
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
  }
});
```

### 3. Environment File Structure
```bash
# .env.local - Local development (git ignored)
GEMINI_API_KEY=your_local_api_key
VITE_API_URL=http://localhost:3000

# .env.production - Production config (git ignored)
VITE_API_URL=https://api.production.com
VITE_ENVIRONMENT=production

# .env.example - Template (git tracked)
GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_URL=https://your-api-url.com
```

## Output Format

```json
{
  "analysis": {
    "timestamp": "2025-01-19T10:30:00Z",
    "project_type": "vite-react-typescript",
    "environments_checked": ["development", "build", "deployment"],
    "total_issues": 4,
    "critical_issues": 2,
    "security_issues": 1
  },
  "issues": [
    {
      "id": "env_001",
      "type": "missing",
      "severity": "critical",
      "variable": "VITE_API_URL",
      "environment": "deployment",
      "fix_action": {
        "action": "configure",
        "target": "GitHub Repository Secrets",
        "description": "Add VITE_API_URL to GitHub repository secrets",
        "instructions": [
          "Go to repository Settings → Secrets and variables → Actions",
          "Click 'New repository secret'",
          "Name: VITE_API_URL",
          "Value: https://your-api-url.com"
        ]
      }
    },
    {
      "id": "env_002",
      "type": "naming",
      "severity": "critical", 
      "variable": "API_KEY",
      "current_value": "import.meta.env.API_KEY",
      "expected_value": "import.meta.env.VITE_API_KEY",
      "environment": "runtime",
      "fix_action": {
        "action": "rename",
        "target": "src/services/geminiApiClient.ts",
        "description": "Add VITE_ prefix to client-side environment variable",
        "commands": [
          "Find and replace 'API_KEY' with 'VITE_API_KEY' in source files",
          "Update .env files with new variable name"
        ]
      }
    },
    {
      "id": "env_003",
      "type": "security",
      "severity": "warning",
      "variable": "GEMINI_API_KEY",
      "environment": "runtime",
      "fix_action": {
        "action": "secure",
        "target": "Build configuration",
        "description": "Move sensitive API key to build-time injection",
        "commands": [
          "Update vite.config.ts to inject API key at build time",
          "Remove GEMINI_API_KEY from client-side code",
          "Use __GEMINI_API_KEY__ build-time constant instead"
        ]
      }
    }
  ],
  "fix_plan": {
    "execution_order": ["env_002", "env_003", "env_001"],
    "estimated_time": "10-15 minutes",
    "requires_deployment_setup": true,
    "post_fix_actions": [
      "Test build with new environment variables",
      "Verify variables are available in deployment",
      "Update documentation with new variable names"
    ]
  },
  "deployment_instructions": {
    "github_pages": [
      "Add GEMINI_API_KEY to repository secrets",
      "Add VITE_API_URL to repository secrets",
      "Update GitHub Actions workflow to use secrets"
    ],
    "cloudflare_pages": [
      "Add environment variables in Cloudflare dashboard",
      "Ensure variables are set for production environment",
      "Trigger redeploy after variable changes"
    ]
  }
}
```

## Platform-Specific Configurations

### GitHub Pages with GitHub Actions
```yaml
# .github/workflows/deploy.yml
- name: Build
  run: npm run build
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
    VITE_API_URL: ${{ secrets.VITE_API_URL }}
```

### Cloudflare Pages
```toml
# wrangler.toml
[env.production.vars]
VITE_API_URL = "https://api.production.com"

# Environment variables set in Cloudflare dashboard:
# GEMINI_API_KEY (sensitive, not in config file)
```

### Local Development
```bash
# .env.local (git ignored)
GEMINI_API_KEY=your_local_key
VITE_API_URL=http://localhost:3001
VITE_ENVIRONMENT=development
```

## Validation Checks

### 1. Build-Time Validation
```typescript
// Check that required variables are available during build
const requiredEnvVars = ['GEMINI_API_KEY', 'VITE_API_URL'];
const missingVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
}
```

### 2. Runtime Validation
```typescript
// Check that client-side variables are properly loaded
const requiredClientVars = ['VITE_API_URL', 'VITE_ENVIRONMENT'];
const missingClientVars = requiredClientVars.filter(
  key => !import.meta.env[key]
);
```

### 3. Security Validation
```typescript
// Ensure sensitive variables are not exposed to client
const sensitivePatterns = [
  /API_KEY(?!_URL)/,
  /SECRET/,
  /PRIVATE_KEY/,
  /DATABASE/
];
```

## Common Fix Scenarios

### Scenario 1: Missing VITE_ Prefix
```
Issue: import.meta.env.API_URL returns undefined
Fix: Rename to VITE_API_URL in both code and environment files
```

### Scenario 2: Sensitive Variable in Client Code
```
Issue: GEMINI_API_KEY exposed in browser bundle
Fix: Move to build-time injection via Vite config define
```

### Scenario 3: Deployment Variable Missing
```
Issue: Environment works locally but fails in production
Fix: Add missing variables to GitHub/Cloudflare environment config
```

### Scenario 4: Variable Type Mismatch
```
Issue: Expecting boolean but getting string "true"
Fix: Add type conversion in application code
```

## Success Metrics
- **Variable Coverage**: 100% of required variables properly configured
- **Security Compliance**: 0% sensitive variables exposed to client
- **Deployment Success**: 95%+ builds succeed with correct environment setup
- **Configuration Accuracy**: All variables follow platform naming conventions

## Agent Activation

```
Task: env-validator
"Build failing due to environment variable issues. Validate and fix all environment variable configurations for development and deployment."
```

The agent will scan code, configuration files, and deployment settings to identify and fix environment variable issues automatically.