#!/usr/bin/env python3
"""
TTD-DR クイック研究スクリプト
使用方法: python quick_research.py "研究クエリ"
"""

import sys
import json
from ttd_dr_system_integration import TTDDRSystemIntegrator, create_default_configuration

def main():
    if len(sys.argv) < 2:
        print("使用方法: python quick_research.py \"研究クエリ\"")
        print("例: python quick_research.py \"AIの最新動向について調査\"")
        return
        
    query = " ".join(sys.argv[1:])
    print(f"🔍 研究クエリ: {query}")
    print("🚀 TTD-DR実行中...")
    
    # 標準設定でシステム実行
    config = create_default_configuration()
    system = TTDDRSystemIntegrator(config)
    
    result = system.execute_research_pipeline(
        user_query=query,
        constraints={'target_length': 3000, 'max_sections': 6}
    )
    
    if result['status'] == 'success':
        print("✅ 研究完了!")
        
        # 結果表示
        execution_id = result.get('execution_id')
        quality = result.get('quality_metrics', {}).get('overall_quality', 0.0)
        
        final_output = result.get('final_output', {})
        report = final_output.get('research_report', {})
        title = report.get('title', '研究レポート')
        word_count = report.get('word_count', 0)
        
        print(f"📄 {title}")
        print(f"📊 品質スコア: {quality:.2f}/5.0")
        print(f"📝 文字数: {word_count}")
        print(f"🆔 実行ID: {execution_id}")
        print(f"💾 結果: ttd_dr_output/{execution_id}_report.md")
        
    else:
        print(f"❌ 研究失敗: {result.get('error', '不明なエラー')}")

if __name__ == "__main__":
    main()