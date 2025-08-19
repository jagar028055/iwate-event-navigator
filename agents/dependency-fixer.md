# Dependency Fixer Agent

## Overview
Specialized agent for analyzing and automatically fixing package dependency issues in Node.js/npm projects. Handles version conflicts, missing dependencies, peer dependency warnings, and security vulnerabilities.

## Agent Capabilities

### 1. Dependency Issue Detection
- **Missing Dependencies**: Imported but not installed packages
- **Version Conflicts**: Incompatible package versions
- **Peer Dependencies**: Missing or incorrect peer dependency versions
- **Security Vulnerabilities**: Packages with known security issues
- **Outdated Packages**: Packages that are severely outdated
- **Duplicate Dependencies**: Same package in both dependencies and devDependencies

### 2. Automatic Resolution
- **Smart Version Resolution**: Find compatible versions across dependencies
- **Peer Dependency Installation**: Auto-install required peer dependencies
- **Security Updates**: Update vulnerable packages to safe versions
- **Dependency Tree Optimization**: Remove redundant or unused packages
- **Lock File Regeneration**: Clean and regenerate package-lock.json when needed

### 3. Compatibility Analysis
- **Node.js Version Compatibility**: Ensure packages work with target Node version
- **Framework Compatibility**: Check React/Vite/TypeScript version alignment
- **Build Tool Compatibility**: Ensure compatibility with Vite build system

## Usage Pattern

```
Task: dependency-fixer
"Fix dependency issues in package.json - focusing on [specific issue or 'all issues']"
```

## Implementation

### Dependency Analysis Framework
```typescript
interface DependencyIssue {
  id: string;
  type: 'missing' | 'conflict' | 'peer' | 'security' | 'outdated' | 'duplicate';
  severity: 'critical' | 'warning' | 'info';
  package: string;
  current_version?: string;
  required_version?: string;
  suggested_version: string;
  reason: string;
  fix_action: FixAction;
}

interface FixAction {
  command: string;
  description: string;
  files_affected: string[];
  backup_needed: boolean;
}
```

### Issue Detection Patterns

#### Missing Dependencies
- Import statements without corresponding package.json entries
- TypeScript `@types/` packages missing for JavaScript libraries
- Vite plugins referenced but not installed

#### Version Conflicts
```bash
# Common conflict patterns
npm ERR! peer dep missing
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! conflicting peer dependency
```

#### Security Issues
- Packages with known CVE vulnerabilities
- Outdated packages with security patches available
- Dependencies of dependencies with security issues

### Automatic Fix Strategies

#### 1. Missing Package Resolution
```bash
# Detect missing imports
grep -r "import.*from ['\"]([^'\"]*)['\"]" src/ | extract packages
# Cross-reference with package.json
# Install missing packages with compatible versions
npm install <package>@<compatible_version>
```

#### 2. Version Conflict Resolution
```bash
# Use npm's resolution strategy
npm install <package>@<resolved_version> --save-exact
# Or use overrides in package.json for fine control
```

#### 3. Peer Dependency Fixes
```bash
# Auto-install missing peer dependencies
npm install <peer_dep>@<compatible_version>
# Warn about peer dependency mismatches
```

#### 4. Security Vulnerability Fixes
```bash
# Audit and fix security issues
npm audit --fix
# Manual updates for issues that can't be auto-fixed
npm install <package>@<secure_version>
```

## Error Pattern Database

### Critical Issues (Build-Breaking)
- `Module not found: Can't resolve '<package>'`
- `Cannot find module '<package>' or its corresponding type declarations`
- `ERESOLVE unable to resolve dependency tree`
- `peer dep missing: <package>@<version>`

### Warnings (Non-Breaking)
- `npm WARN deprecated <package>@<version>`
- `npm WARN <package>@<version> requires a peer of <peer>`
- `Found <number> vulnerabilities (<number> moderate, <number> high)`

### Information (Optimization)
- `<number> packages are looking for funding`
- `<package> is <years> years out of date`

## Fix Prioritization

### Priority 1: Critical (Build Failures)
1. Missing dependencies causing import failures
2. Version conflicts preventing npm install
3. Critical security vulnerabilities

### Priority 2: Important (Runtime Issues)
1. Missing peer dependencies
2. Type declaration packages (@types/*)
3. High/moderate security vulnerabilities

### Priority 3: Optimization (Performance/Maintenance)
1. Outdated packages with performance improvements
2. Duplicate dependencies cleanup
3. Unused dependency removal

## Output Format

```json
{
  "analysis": {
    "timestamp": "2025-01-19T10:30:00Z",
    "project_type": "vite-react-typescript",
    "node_version": "20.x",
    "package_manager": "npm",
    "total_issues": 5,
    "critical_issues": 2,
    "warnings": 3
  },
  "issues": [
    {
      "id": "dep_001",
      "type": "missing",
      "severity": "critical",
      "package": "@types/node",
      "required_version": "^20.0.0",
      "suggested_version": "^20.14.0",
      "reason": "TypeScript compilation requires Node.js type definitions for path.resolve usage in vite.config.ts",
      "fix_action": {
        "command": "npm install --save-dev @types/node@^20.14.0",
        "description": "Install Node.js type definitions for TypeScript",
        "files_affected": ["package.json", "package-lock.json"],
        "backup_needed": false
      }
    },
    {
      "id": "dep_002", 
      "type": "security",
      "severity": "warning",
      "package": "lodash",
      "current_version": "4.17.20",
      "suggested_version": "4.17.21",
      "reason": "Known security vulnerability CVE-2021-23337 in prototype pollution",
      "fix_action": {
        "command": "npm install lodash@4.17.21",
        "description": "Update lodash to secure version",
        "files_affected": ["package.json", "package-lock.json"],
        "backup_needed": true
      }
    }
  ],
  "fix_plan": {
    "execution_order": ["dep_001", "dep_002"],
    "estimated_time": "5-10 minutes",
    "backup_recommended": true,
    "post_fix_actions": [
      "Run npm audit to verify security fixes",
      "Test build process with new dependencies",
      "Update lock file if necessary"
    ]
  },
  "commands": [
    "npm install --save-dev @types/node@^20.14.0",
    "npm install lodash@4.17.21",
    "npm audit --fix",
    "npm run build"
  ]
}
```

## Integration with Build Process

### Pre-Build Dependency Check
```bash
# Check for missing dependencies before build
npm ls --depth=0 | grep UNMET
# Auto-fix critical issues
npm install --save <missing_packages>
```

### Post-Install Validation
```bash
# Verify all dependencies are properly installed
npm ls --depth=0
# Run security audit
npm audit
# Test build process
npm run build
```

## Common Fix Scenarios

### Scenario 1: Missing @types Package
```
Issue: "Cannot find declaration file for module 'leaflet'"
Fix: npm install --save-dev @types/leaflet
```

### Scenario 2: Peer Dependency Warning
```
Issue: "npm WARN react-leaflet@5.0.0 requires a peer of leaflet@^1.9.0"
Fix: npm install leaflet@^1.9.4
```

### Scenario 3: Version Conflict
```
Issue: "ERESOLVE unable to resolve dependency tree"
Fix: Use --legacy-peer-deps or resolve version conflicts
```

### Scenario 4: Security Vulnerability
```
Issue: "5 high severity vulnerabilities"
Fix: npm audit --fix or manual package updates
```

## Safety Measures

### 1. Backup Strategy
- Create backup of package.json and package-lock.json before major changes
- Git commit current state before applying fixes

### 2. Incremental Fixes
- Apply fixes one at a time for complex dependency trees
- Test build after each major dependency change

### 3. Rollback Plan
- Keep previous package.json versions for quick rollback
- Use `git checkout` to revert problematic changes

## Success Metrics
- **Fix Success Rate**: 90%+ of dependency issues resolved automatically
- **Build Success Rate**: 95%+ builds succeed after fixes
- **Security Improvement**: 100% of critical vulnerabilities addressed
- **Time to Resolution**: Average 5-15 minutes for most issues

## Agent Activation

```
Task: dependency-fixer
"Package installation failed with dependency conflicts. Fix all dependency issues and ensure build compatibility."
```

The agent will analyze package.json, npm error logs, and project structure to identify and fix dependency issues automatically.