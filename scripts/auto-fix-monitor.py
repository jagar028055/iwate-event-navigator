#!/usr/bin/env python3
"""
GitHub Issues Auto-Fix Monitor

This script monitors GitHub Issues for deployment failures and automatically
triggers Claude Code to analyze and fix the issues.

Usage:
    python scripts/auto-fix-monitor.py [--repo REPO] [--interval SECONDS] [--dry-run]

Environment Variables:
    GITHUB_TOKEN: GitHub personal access token with repo access
    GITHUB_REPO: Repository in format 'owner/repo' (optional, can be passed as --repo)
    CLAUDE_CODE_PATH: Path to Claude Code executable (default: 'claude-code')
"""

import os
import sys
import time
import json
import subprocess
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

try:
    import requests
except ImportError:
    print("Error: requests library not installed. Run: pip install requests")
    sys.exit(1)

class GitHubIssueMonitor:
    def __init__(self, repo: str, token: str, claude_path: str = 'claude-code'):
        self.repo = repo
        self.token = token
        self.claude_path = claude_path
        self.headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Claude-Code-Auto-Fix-Monitor/1.0'
        }
        self.base_url = f'https://api.github.com/repos/{repo}'
        self.processed_issues = set()

    def get_deployment_failure_issues(self) -> List[Dict[str, Any]]:
        """Get open deployment failure issues that haven't been processed."""
        url = f'{self.base_url}/issues'
        params = {
            'state': 'open',
            'labels': 'deployment-failure,auto-created',
            'sort': 'created',
            'direction': 'desc',
            'per_page': 10
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            issues = response.json()
            
            # Filter out already processed issues
            new_issues = [
                issue for issue in issues 
                if issue['number'] not in self.processed_issues
                and not self.is_issue_being_fixed(issue)
            ]
            
            return new_issues
        except requests.RequestException as e:
            print(f"Error fetching issues: {e}")
            return []

    def is_issue_being_fixed(self, issue: Dict[str, Any]) -> bool:
        """Check if issue is already being processed (has auto-fix comments)."""
        comments_url = issue['comments_url']
        
        try:
            response = requests.get(comments_url, headers=self.headers)
            response.raise_for_status()
            comments = response.json()
            
            # Check if Claude Code has already commented on this issue
            for comment in comments:
                if 'Claude Code Auto-Fix' in comment['body'] or '🤖 自動修正開始' in comment['body']:
                    return True
            
            return False
        except requests.RequestException:
            return False

    def extract_error_info(self, issue: Dict[str, Any]) -> Dict[str, Any]:
        """Extract error information from issue body."""
        body = issue['body']
        
        # Extract workflow run URL
        workflow_url = None
        if 'Workflow Run' in body:
            import re
            workflow_match = re.search(r'Workflow Run.*?\[.*?\]\((.*?)\)', body)
            if workflow_match:
                workflow_url = workflow_match.group(1)
        
        # Extract commit hash
        commit_hash = None
        if 'Commit' in body:
            import re
            commit_match = re.search(r'Commit.*?\[([a-f0-9]{7})\]', body)
            if commit_match:
                commit_hash = commit_match.group(1)
        
        return {
            'issue_number': issue['number'],
            'title': issue['title'],
            'workflow_url': workflow_url,
            'commit_hash': commit_hash,
            'created_at': issue['created_at'],
            'labels': [label['name'] for label in issue['labels']]
        }

    def add_fix_comment(self, issue_number: int, status: str, details: str = "") -> bool:
        """Add a comment to the issue indicating fix status."""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S JST')
        
        status_messages = {
            'starting': f"""## 🤖 Claude Code Auto-Fix 開始

**開始時刻**: {timestamp}

自動修正プロセスを開始します。以下の手順で問題を解決します：

1. ✅ エラーログの詳細分析
2. ⏳ 問題の原因特定
3. ⏳ 修正案の生成
4. ⏳ 修正の実装
5. ⏳ ビルドテスト・再デプロイ

進行状況はこのIssueで更新されます。

---

*Powered by Claude Code Auto-Fix System*""",
            
            'analyzing': f"""## 🔍 分析中

**更新時刻**: {timestamp}

{details}

---

*分析完了まで数分お待ちください...*""",
            
            'fixing': f"""## 🛠 修正実行中

**更新時刻**: {timestamp}

修正内容:
{details}

---

*修正完了まで数分お待ちください...*""",
            
            'completed': f"""## ✅ 修正完了

**完了時刻**: {timestamp}

{details}

このIssueは自動的にクローズされます。

---

*Claude Code Auto-Fix System により自動解決*""",
            
            'failed': f"""## ❌ 自動修正失敗

**失敗時刻**: {timestamp}

{details}

手動での確認・修正が必要です。

---

*Claude Code Auto-Fix System*"""
        }
        
        comment_body = status_messages.get(status, f"Status update: {status}\n\n{details}")
        
        url = f'{self.base_url}/issues/{issue_number}/comments'
        data = {'body': comment_body}
        
        try:
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"Error adding comment to issue #{issue_number}: {e}")
            return False

    def close_issue(self, issue_number: int) -> bool:
        """Close the issue after successful fix."""
        url = f'{self.base_url}/issues/{issue_number}'
        data = {'state': 'closed'}
        
        try:
            response = requests.patch(url, headers=self.headers, json=data)
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            print(f"Error closing issue #{issue_number}: {e}")
            return False

    def run_claude_code_fix(self, error_info: Dict[str, Any], dry_run: bool = False) -> Dict[str, Any]:
        """Run Claude Code to analyze and fix the deployment issue."""
        
        # Add initial comment
        if not dry_run:
            self.add_fix_comment(error_info['issue_number'], 'starting')
        
        # Prepare Claude Code prompt
        prompt = self.build_fix_prompt(error_info)
        
        if dry_run:
            print(f"[DRY RUN] Would run Claude Code with prompt:")
            print(prompt)
            return {'success': True, 'message': 'Dry run completed'}
        
        try:
            # Update issue with analyzing status
            self.add_fix_comment(
                error_info['issue_number'], 
                'analyzing', 
                f"GitHub Actions ログを分析中...\nWorkflow URL: {error_info.get('workflow_url', 'N/A')}"
            )
            
            # Run Claude Code
            result = subprocess.run([
                self.claude_path,
                '--prompt', prompt
            ], capture_output=True, text=True, timeout=1800)  # 30 minute timeout
            
            if result.returncode == 0:
                # Parse Claude Code output for success/failure
                output = result.stdout
                
                # Update with fixing status
                self.add_fix_comment(
                    error_info['issue_number'],
                    'fixing',
                    f"修正を実行中...\n\n```\n{output[:500]}{'...' if len(output) > 500 else ''}\n```"
                )
                
                # Wait a bit for fixes to be applied
                time.sleep(30)
                
                # Check if build is now successful
                build_success = self.check_build_status()
                
                if build_success:
                    self.add_fix_comment(
                        error_info['issue_number'],
                        'completed',
                        f"✅ 修正が成功しました！\n\n修正内容:\n```\n{output}\n```"
                    )
                    self.close_issue(error_info['issue_number'])
                    return {'success': True, 'message': 'Fix applied successfully'}
                else:
                    self.add_fix_comment(
                        error_info['issue_number'],
                        'failed',
                        f"修正を適用しましたが、ビルドがまだ失敗しています。\n\n実行内容:\n```\n{output}\n```"
                    )
                    return {'success': False, 'message': 'Fix applied but build still failing'}
            
            else:
                error_output = result.stderr or result.stdout
                self.add_fix_comment(
                    error_info['issue_number'],
                    'failed',
                    f"Claude Code実行エラー:\n\n```\n{error_output}\n```"
                )
                return {'success': False, 'message': f'Claude Code failed: {error_output}'}
                
        except subprocess.TimeoutExpired:
            self.add_fix_comment(
                error_info['issue_number'],
                'failed',
                "Claude Code実行がタイムアウトしました（30分）。\n\n手動での確認が必要です。"
            )
            return {'success': False, 'message': 'Claude Code execution timed out'}
        
        except Exception as e:
            self.add_fix_comment(
                error_info['issue_number'],
                'failed',
                f"予期しないエラーが発生しました:\n\n```\n{str(e)}\n```"
            )
            return {'success': False, 'message': f'Unexpected error: {str(e)}'}

    def build_fix_prompt(self, error_info: Dict[str, Any]) -> str:
        """Build the prompt for Claude Code to fix the deployment issue."""
        
        prompt = f"""🤖 自動デプロイ修正システム

GitHub Actions デプロイが失敗しました。以下の情報を基に問題を分析し、修正してください：

## 📊 エラー情報
- **Issue**: #{error_info['issue_number']} - {error_info['title']}
- **Workflow URL**: {error_info.get('workflow_url', 'N/A')}
- **Commit**: {error_info.get('commit_hash', 'N/A')}
- **発生時刻**: {error_info['created_at']}

## 🎯 実行手順

1. **エラー分析**: GitHub Actions のログを確認し、失敗原因を特定
2. **専門エージェント起動**: 問題に応じて以下のエージェントを使用
   - `Task: build-error-analyzer` - ビルドエラーの分析
   - `Task: dependency-fixer` - 依存関係の問題修正
   - `Task: env-validator` - 環境変数の検証・修正
3. **修正実装**: 特定した問題の修正を実行
4. **テスト**: 修正後のビルド・デプロイテスト
5. **確認**: GitHub Actions の再実行または手動確認

## 📋 期待される結果

- ビルドエラーの完全解決
- デプロイの成功
- Issue #{error_info['issue_number']} の自動クローズ

## ⚡ 注意事項

- 修正は最小限に抑え、既存機能を破壊しない
- セキュリティを維持（API キーの適切な管理など）
- 修正内容は明確にログに記録

修正を開始してください。"""

        return prompt

    def check_build_status(self) -> bool:
        """Check if the latest build/deployment is successful."""
        # Check GitHub Actions workflow status
        url = f'{self.base_url}/actions/runs'
        params = {'per_page': 1, 'status': 'completed'}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            runs = response.json()
            
            if runs['workflow_runs']:
                latest_run = runs['workflow_runs'][0]
                return latest_run['conclusion'] == 'success'
            
            return False
        except requests.RequestException:
            return False

    def monitor_loop(self, interval: int, dry_run: bool = False):
        """Main monitoring loop."""
        print(f"🤖 Claude Code Auto-Fix Monitor started")
        print(f"Repository: {self.repo}")
        print(f"Check interval: {interval} seconds")
        print(f"Dry run: {dry_run}")
        print("-" * 50)
        
        while True:
            try:
                print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Checking for deployment failure issues...")
                
                issues = self.get_deployment_failure_issues()
                
                if not issues:
                    print("No new deployment failure issues found.")
                else:
                    print(f"Found {len(issues)} deployment failure issue(s)")
                    
                    for issue in issues:
                        error_info = self.extract_error_info(issue)
                        print(f"Processing issue #{error_info['issue_number']}: {error_info['title']}")
                        
                        # Mark as processed to avoid duplicate processing
                        self.processed_issues.add(error_info['issue_number'])
                        
                        # Run Claude Code fix
                        result = self.run_claude_code_fix(error_info, dry_run)
                        
                        if result['success']:
                            print(f"✅ Successfully processed issue #{error_info['issue_number']}")
                        else:
                            print(f"❌ Failed to process issue #{error_info['issue_number']}: {result['message']}")
                
                print(f"Next check in {interval} seconds...")
                time.sleep(interval)
                
            except KeyboardInterrupt:
                print("\n🛑 Monitor stopped by user")
                break
            except Exception as e:
                print(f"❌ Error in monitoring loop: {e}")
                print("Retrying in 60 seconds...")
                time.sleep(60)

def main():
    parser = argparse.ArgumentParser(description='GitHub Issues Auto-Fix Monitor')
    parser.add_argument('--repo', help='GitHub repository (owner/repo)', 
                       default=os.getenv('GITHUB_REPO'))
    parser.add_argument('--interval', type=int, default=300, 
                       help='Check interval in seconds (default: 300)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Run in dry-run mode (no actual fixes)')
    parser.add_argument('--claude-path', default=os.getenv('CLAUDE_CODE_PATH', 'claude-code'),
                       help='Path to Claude Code executable')
    
    args = parser.parse_args()
    
    # Validate required environment variables
    github_token = os.getenv('GITHUB_TOKEN')
    if not github_token:
        print("Error: GITHUB_TOKEN environment variable is required")
        sys.exit(1)
    
    if not args.repo:
        print("Error: Repository must be specified via --repo or GITHUB_REPO environment variable")
        sys.exit(1)
    
    # Initialize monitor
    monitor = GitHubIssueMonitor(
        repo=args.repo,
        token=github_token,
        claude_path=args.claude_path
    )
    
    # Start monitoring
    monitor.monitor_loop(args.interval, args.dry_run)

if __name__ == '__main__':
    main()