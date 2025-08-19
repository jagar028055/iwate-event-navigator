# Build Error Analyzer Agent

## Overview
Specialized agent for parsing GitHub Actions build logs, categorizing errors, and generating specific fix recommendations for Vite + React + TypeScript projects deployed to GitHub Pages.

## Agent Capabilities

### 1. Log Parsing & Error Detection
- **TypeScript Errors**: Type mismatches, missing declarations, import/export issues
- **Dependency Issues**: Missing packages, version conflicts, peer dependency warnings
- **Environment Variables**: Missing vars, incorrect naming, deployment-specific issues
- **Build Configuration**: Vite config errors, plugin issues, asset handling problems
- **Deployment Issues**: GitHub Pages specific errors, routing problems, base URL issues

### 2. Error Categorization
- **Severity Levels**: Critical (build fails), Warning (potential runtime issues), Info (optimization suggestions)
- **Fix Complexity**: Simple (config change), Medium (code refactor), Complex (architecture change)
- **Error Types**: Syntax, Configuration, Dependencies, Environment, Deployment

### 3. Fix Generation
- Specific code changes with file paths
- Configuration updates
- Package.json modifications
- Environment variable corrections
- Deployment workflow adjustments

## Usage Pattern

```
Task: build-error-analyzer
"Analyze this GitHub Actions build log: [log_content_or_url]"
```

## Implementation

### Input Processing
1. **Log Extraction**: Parse raw GitHub Actions logs or log URLs
2. **Error Identification**: Use regex patterns and context analysis to identify specific errors
3. **Context Gathering**: Analyze project structure to understand error impact

### Error Analysis Framework
```typescript
interface BuildError {
  id: string;
  type: 'typescript' | 'dependency' | 'environment' | 'configuration' | 'deployment';
  severity: 'critical' | 'warning' | 'info';
  complexity: 'simple' | 'medium' | 'complex';
  message: string;
  file?: string;
  line?: number;
  context: string[];
  suggestions: Fix[];
}

interface Fix {
  description: string;
  action: 'edit' | 'create' | 'delete' | 'install' | 'configure';
  target: string; // file path or configuration key
  content?: string; // specific code/config to apply
  commands?: string[]; // CLI commands to run
}
```

### Error Pattern Database

#### TypeScript Errors
- `TS2307`: Cannot find module → Check import paths, add type declarations
- `TS2322`: Type assignment errors → Add proper typing or type assertions
- `TS2345`: Argument type mismatch → Fix function call arguments
- `TS7016`: Missing declaration files → Install @types packages

#### Vite/Build Errors
- `Failed to resolve import` → Fix relative imports, check file existence
- `The following dependencies are imported but could not be resolved` → Install missing packages
- `[vite]: Rollup failed to resolve import` → Check dynamic imports, add to optimizeDeps

#### Environment Variable Errors
- `process.env.VARIABLE_NAME is undefined` → Add environment variables to deployment
- `VITE_ prefix required` → Rename environment variables for Vite

#### GitHub Pages Deployment Errors
- `404 on refresh` → Configure routing for SPA
- `Failed to load resource` → Fix base URL configuration
- `Mixed content errors` → Ensure HTTPS compatibility

## Output Format

```json
{
  "analysis": {
    "timestamp": "2025-01-19T10:30:00Z",
    "project_type": "vite-react-typescript",
    "deployment_target": "github-pages",
    "total_errors": 3,
    "critical_errors": 1,
    "warnings": 2
  },
  "errors": [
    {
      "id": "error_001",
      "type": "typescript",
      "severity": "critical",
      "complexity": "simple",
      "message": "Cannot find module '@/components/Header'",
      "file": "src/App.tsx",
      "line": 5,
      "context": [
        "import Header from '@/components/Header';",
        "// Vite alias configuration may be missing"
      ],
      "suggestions": [
        {
          "description": "Add path alias to Vite config",
          "action": "edit",
          "target": "vite.config.ts",
          "content": "resolve: {\n  alias: {\n    '@': path.resolve(__dirname, './src')\n  }\n}"
        },
        {
          "description": "Install path dependency",
          "action": "install",
          "target": "package.json",
          "commands": ["npm install --save-dev @types/node"]
        }
      ]
    }
  ],
  "fix_plan": {
    "immediate_actions": [
      "Fix TypeScript import errors",
      "Update Vite configuration"
    ],
    "follow_up_actions": [
      "Add comprehensive type checking",
      "Optimize build configuration"
    ],
    "estimated_time": "15-30 minutes"
  },
  "implementation_commands": [
    {
      "description": "Fix Vite config for path aliases",
      "files_to_edit": ["vite.config.ts"],
      "commands": ["npm install --save-dev @types/node"]
    }
  ]
}
```

## Integration with Claude Code

### Task Execution Flow
1. **Log Analysis**: Agent parses build logs and identifies errors
2. **Fix Planning**: Agent creates structured fix recommendations
3. **Implementation**: Claude Code executes the suggested fixes
4. **Verification**: Re-run build to confirm fixes work

### File Operations
- **Read**: Parse existing configuration files for context
- **Edit**: Apply specific fixes to identified files  
- **Bash**: Run npm/yarn commands for dependency management
- **Grep**: Search for patterns across the codebase

## Error Pattern Recognition

### Critical Build Failures
```regex
# TypeScript compilation errors
/error TS\d+:/
/Type .+ is not assignable to type/
/Cannot find module/

# Vite build errors
/\[vite\] Build failed/
/Failed to resolve import/
/Could not resolve/

# Dependency issues
/Module not found/
/Package .+ not found/
/ERESOLVE unable to resolve dependency tree/
```

### Warning Patterns
```regex
# Type warnings
/warning TS\d+:/
/implicitly has an 'any' type/

# Dependency warnings
/deprecated/
/peer dep missing/
/WARN/
```

## Success Metrics
- **Error Detection Rate**: 95%+ accuracy in identifying build errors
- **Fix Success Rate**: 85%+ of suggested fixes resolve the issue
- **Time to Resolution**: Average 15-30 minutes for common errors
- **False Positive Rate**: <5% incorrect error categorization

## Example Usage Scenarios

### Scenario 1: TypeScript Import Error
```
Input: GitHub Actions log showing "TS2307: Cannot find module '@/components'"
Output: Fix plan to add Vite path aliases and install @types/node
```

### Scenario 2: Environment Variable Missing
```
Input: Build log showing "VITE_API_KEY is undefined"
Output: Instructions to add environment variable to GitHub repository secrets
```

### Scenario 3: GitHub Pages Deployment Issue
```
Input: 404 errors on page refresh in deployed app
Output: Configure base URL and add fallback routing for SPA
```

## Agent Activation

When Claude Code encounters build failures, automatically invoke:
```
Task: build-error-analyzer
"GitHub Actions build failed. Log URL: https://github.com/user/repo/actions/runs/123456789"
```

The agent will provide structured analysis and specific implementation steps for Claude Code to execute.