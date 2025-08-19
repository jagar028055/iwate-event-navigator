#!/usr/bin/env python3
"""
Auto-Fix System Integration Test

This script tests the complete auto-fix system by simulating deployment failures
and verifying that the system correctly detects and attempts to fix them.

Usage:
    python scripts/test-auto-fix-system.py [--repo REPO] [--dry-run]
"""

import os
import sys
import json
import time
import subprocess
from datetime import datetime
from typing import Dict, Any, List

try:
    import requests
except ImportError:
    print("Error: requests library not installed. Run: pip install requests")
    sys.exit(1)

class AutoFixSystemTester:
    def __init__(self, repo: str, token: str):
        self.repo = repo
        self.token = token
        self.headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Auto-Fix-System-Tester/1.0'
        }
        self.base_url = f'https://api.github.com/repos/{repo}'
        self.test_results = []

    def log_test(self, test_name: str, status: str, message: str = "", details: Any = None):
        """Log test result."""
        result = {
            'test_name': test_name,
            'status': status,  # 'PASS', 'FAIL', 'SKIP'
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_emoji = {'PASS': '✅', 'FAIL': '❌', 'SKIP': '⏭️'}
        print(f"{status_emoji.get(status, '❓')} {test_name}: {message}")

    def test_github_connection(self) -> bool:
        """Test GitHub API connection and permissions."""
        try:
            response = requests.get(f'{self.base_url}', headers=self.headers)
            if response.status_code == 200:
                repo_info = response.json()
                self.log_test(
                    "GitHub Connection", 
                    "PASS", 
                    f"Connected to {repo_info['full_name']}"
                )
                return True
            elif response.status_code == 404:
                self.log_test(
                    "GitHub Connection", 
                    "FAIL", 
                    "Repository not found or no access"
                )
                return False
            else:
                self.log_test(
                    "GitHub Connection", 
                    "FAIL", 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
        except Exception as e:
            self.log_test("GitHub Connection", "FAIL", f"Connection error: {str(e)}")
            return False

    def test_issues_permission(self) -> bool:
        """Test issues creation and management permissions."""
        try:
            # Try to list issues
            response = requests.get(f'{self.base_url}/issues', headers=self.headers)
            if response.status_code == 200:
                self.log_test(
                    "Issues Permission", 
                    "PASS", 
                    "Can read issues"
                )
                return True
            else:
                self.log_test(
                    "Issues Permission", 
                    "FAIL", 
                    f"Cannot access issues: HTTP {response.status_code}"
                )
                return False
        except Exception as e:
            self.log_test("Issues Permission", "FAIL", f"Issues access error: {str(e)}")
            return False

    def test_workflows_access(self) -> bool:
        """Test GitHub Actions workflows access."""
        try:
            response = requests.get(f'{self.base_url}/actions/workflows', headers=self.headers)
            if response.status_code == 200:
                workflows = response.json()
                workflow_count = len(workflows.get('workflows', []))
                self.log_test(
                    "Workflows Access", 
                    "PASS", 
                    f"Found {workflow_count} workflow(s)"
                )
                return True
            else:
                self.log_test(
                    "Workflows Access", 
                    "FAIL", 
                    f"Cannot access workflows: HTTP {response.status_code}"
                )
                return False
        except Exception as e:
            self.log_test("Workflows Access", "FAIL", f"Workflows access error: {str(e)}")
            return False

    def test_claude_code_availability(self) -> bool:
        """Test if Claude Code is available and working."""
        claude_path = os.getenv('CLAUDE_CODE_PATH', 'claude-code')
        
        try:
            result = subprocess.run(
                [claude_path, '--version'], 
                capture_output=True, 
                text=True, 
                timeout=10
            )
            
            if result.returncode == 0:
                version_info = result.stdout.strip()
                self.log_test(
                    "Claude Code Availability", 
                    "PASS", 
                    f"Claude Code found: {version_info}"
                )
                return True
            else:
                self.log_test(
                    "Claude Code Availability", 
                    "FAIL", 
                    f"Claude Code error: {result.stderr or result.stdout}"
                )
                return False
                
        except FileNotFoundError:
            self.log_test(
                "Claude Code Availability", 
                "FAIL", 
                f"Claude Code not found at: {claude_path}"
            )
            return False
        except subprocess.TimeoutExpired:
            self.log_test(
                "Claude Code Availability", 
                "FAIL", 
                "Claude Code command timed out"
            )
            return False
        except Exception as e:
            self.log_test(
                "Claude Code Availability", 
                "FAIL", 
                f"Claude Code test error: {str(e)}"
            )
            return False

    def test_workflow_configuration(self) -> bool:
        """Test if the GitHub Actions workflow is properly configured."""
        try:
            # Check if deploy.yml exists and has the correct configuration
            response = requests.get(
                f'{self.base_url}/contents/.github/workflows/deploy.yml', 
                headers=self.headers
            )
            
            if response.status_code == 200:
                file_info = response.json()
                if file_info['type'] == 'file':
                    # Decode and check workflow content
                    import base64
                    content = base64.b64decode(file_info['content']).decode('utf-8')
                    
                    required_elements = [
                        'handle-failure:',
                        'if: failure()',
                        'Create Issue on Build/Deploy Failure',
                        'deployment-failure',
                        'auto-created'
                    ]
                    
                    missing_elements = []
                    for element in required_elements:
                        if element not in content:
                            missing_elements.append(element)
                    
                    if not missing_elements:
                        self.log_test(
                            "Workflow Configuration", 
                            "PASS", 
                            "Deploy workflow properly configured"
                        )
                        return True
                    else:
                        self.log_test(
                            "Workflow Configuration", 
                            "FAIL", 
                            f"Missing elements: {', '.join(missing_elements)}"
                        )
                        return False
                        
            else:
                self.log_test(
                    "Workflow Configuration", 
                    "FAIL", 
                    "Deploy workflow file not found"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Workflow Configuration", 
                "FAIL", 
                f"Workflow check error: {str(e)}"
            )
            return False

    def test_issue_templates(self) -> bool:
        """Test if issue templates are properly configured."""
        try:
            # Check for deployment-failure.yml template
            response = requests.get(
                f'{self.base_url}/contents/.github/ISSUE_TEMPLATE/deployment-failure.yml',
                headers=self.headers
            )
            
            if response.status_code == 200:
                self.log_test(
                    "Issue Templates", 
                    "PASS", 
                    "Deployment failure template found"
                )
                return True
            else:
                self.log_test(
                    "Issue Templates", 
                    "FAIL", 
                    "Deployment failure template not found"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "Issue Templates", 
                "FAIL", 
                f"Template check error: {str(e)}"
            )
            return False

    def test_agent_specifications(self) -> bool:
        """Test if agent specifications are available."""
        agents = [
            'agents/build-error-analyzer.md',
            'agents/dependency-fixer.md', 
            'agents/env-validator.md'
        ]
        
        all_found = True
        found_agents = []
        
        for agent_path in agents:
            try:
                response = requests.get(
                    f'{self.base_url}/contents/{agent_path}',
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    found_agents.append(agent_path)
                else:
                    all_found = False
                    
            except Exception:
                all_found = False
        
        if all_found:
            self.log_test(
                "Agent Specifications", 
                "PASS", 
                f"All {len(agents)} agents found"
            )
            return True
        else:
            self.log_test(
                "Agent Specifications", 
                "FAIL", 
                f"Found {len(found_agents)}/{len(agents)} agents"
            )
            return False

    def create_test_issue(self, dry_run: bool = True) -> Dict[str, Any]:
        """Create a test deployment failure issue."""
        if dry_run:
            self.log_test(
                "Test Issue Creation", 
                "SKIP", 
                "Skipped in dry-run mode"
            )
            return {'success': False, 'reason': 'dry_run'}
        
        try:
            issue_data = {
                'title': '🧪 Test Deployment Failure - Auto-Fix System Test',
                'body': '''## 🧪 テスト用デプロイメント失敗レポート

**Workflow Run**: Test run for auto-fix system
**Commit**: Test commit
**Branch**: main
**Actor**: Auto-Fix System Tester
**Triggered**: Manual test

## 📊 失敗ジョブ情報

これはテスト用のIssueです。自動修正システムの動作確認のために作成されました。

## 🤖 自動修正予定

Claude Codeが以下の手順で自動修正を試行します：

1. ✅ エラーログの分析
2. ✅ 原因の特定（テスト用）
3. ✅ 修正案の生成・実装
4. ✅ 自動commit & 再デプロイ

## 📋 チェックリスト

- [ ] エラーログ確認（テスト）
- [ ] 環境変数設定確認（テスト）
- [ ] 依存関係チェック（テスト）
- [ ] TypeScriptエラー修正（テスト）
- [ ] 修正完了・再デプロイ（テスト）

---

**自動生成時刻**: ''' + datetime.now().strftime('%Y-%m-%d %H:%M:%S JST'),
                'labels': ['deployment-failure', 'auto-created', 'test']
            }
            
            response = requests.post(
                f'{self.base_url}/issues',
                headers=self.headers,
                json=issue_data
            )
            
            if response.status_code == 201:
                issue = response.json()
                self.log_test(
                    "Test Issue Creation", 
                    "PASS", 
                    f"Created test issue #{issue['number']}"
                )
                return {'success': True, 'issue_number': issue['number']}
            else:
                self.log_test(
                    "Test Issue Creation", 
                    "FAIL", 
                    f"Failed to create issue: HTTP {response.status_code}"
                )
                return {'success': False, 'reason': 'api_error'}
                
        except Exception as e:
            self.log_test(
                "Test Issue Creation", 
                "FAIL", 
                f"Issue creation error: {str(e)}"
            )
            return {'success': False, 'reason': str(e)}

    def test_monitor_script(self, dry_run: bool = True) -> bool:
        """Test the monitoring script."""
        try:
            script_path = 'scripts/auto-fix-monitor.py'
            
            # Check if script exists locally
            if not os.path.exists(script_path):
                self.log_test(
                    "Monitor Script", 
                    "FAIL", 
                    "Monitor script not found locally"
                )
                return False
            
            # Test script syntax
            result = subprocess.run([
                'python3', script_path, '--help'
            ], capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0 and 'GitHub Issues Auto-Fix Monitor' in result.stdout:
                self.log_test(
                    "Monitor Script", 
                    "PASS", 
                    "Monitor script is executable and shows help"
                )
                return True
            else:
                self.log_test(
                    "Monitor Script", 
                    "FAIL", 
                    f"Script execution failed: {result.stderr}"
                )
                return False
                
        except subprocess.TimeoutExpired:
            self.log_test(
                "Monitor Script", 
                "FAIL", 
                "Script help command timed out"
            )
            return False
        except Exception as e:
            self.log_test(
                "Monitor Script", 
                "FAIL", 
                f"Script test error: {str(e)}"
            )
            return False

    def run_comprehensive_test(self, dry_run: bool = True) -> Dict[str, Any]:
        """Run comprehensive system test."""
        print("🧪 Starting Auto-Fix System Integration Test")
        print("=" * 50)
        
        # Core functionality tests
        tests = [
            ('github_connection', self.test_github_connection),
            ('issues_permission', self.test_issues_permission),  
            ('workflows_access', self.test_workflows_access),
            ('claude_code_availability', self.test_claude_code_availability),
            ('workflow_configuration', self.test_workflow_configuration),
            ('issue_templates', self.test_issue_templates),
            ('agent_specifications', self.test_agent_specifications),
            ('monitor_script', lambda: self.test_monitor_script(dry_run))
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                if result:
                    passed_tests += 1
            except Exception as e:
                self.log_test(test_name, "FAIL", f"Test exception: {str(e)}")
        
        # Optional: Create test issue if not in dry-run mode
        if not dry_run:
            print("\n🚨 Creating test deployment failure issue...")
            issue_result = self.create_test_issue(dry_run)
            if issue_result['success']:
                print(f"Test issue created: #{issue_result['issue_number']}")
                print("Monitor the issue to see if auto-fix system responds")
        
        print("\n" + "=" * 50)
        print("🧪 Test Results Summary")
        print("=" * 50)
        
        for result in self.test_results:
            status_emoji = {'PASS': '✅', 'FAIL': '❌', 'SKIP': '⏭️'}
            print(f"{status_emoji.get(result['status'], '❓')} {result['test_name']}: {result['message']}")
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"\nSuccess Rate: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if success_rate >= 80:
            print("🎉 System is ready for deployment!")
            recommendation = "READY"
        elif success_rate >= 60:
            print("⚠️ System needs some fixes before deployment")
            recommendation = "NEEDS_FIXES"
        else:
            print("❌ System has major issues and is not ready")
            recommendation = "NOT_READY"
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'success_rate': success_rate,
            'recommendation': recommendation,
            'test_results': self.test_results
        }

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Auto-Fix System Integration Tester')
    parser.add_argument('--repo', help='GitHub repository (owner/repo)', 
                       default=os.getenv('GITHUB_REPO'))
    parser.add_argument('--dry-run', action='store_true', default=True,
                       help='Run in dry-run mode (default: True)')
    parser.add_argument('--create-test-issue', action='store_true',
                       help='Actually create a test issue (overrides dry-run for this action)')
    
    args = parser.parse_args()
    
    # Validate required environment variables
    github_token = os.getenv('GITHUB_TOKEN')
    if not github_token:
        print("❌ Error: GITHUB_TOKEN environment variable is required")
        print("Please set your GitHub Personal Access Token:")
        print("export GITHUB_TOKEN='ghp_your_token_here'")
        sys.exit(1)
    
    if not args.repo:
        print("❌ Error: Repository must be specified via --repo or GITHUB_REPO environment variable")
        sys.exit(1)
    
    # Initialize tester
    tester = AutoFixSystemTester(
        repo=args.repo,
        token=github_token
    )
    
    # Override dry-run for issue creation if explicitly requested
    dry_run = args.dry_run and not args.create_test_issue
    
    # Run comprehensive test
    results = tester.run_comprehensive_test(dry_run)
    
    # Exit with appropriate code
    if results['recommendation'] == 'READY':
        sys.exit(0)
    elif results['recommendation'] == 'NEEDS_FIXES':
        sys.exit(1)
    else:
        sys.exit(2)

if __name__ == '__main__':
    main()