#!/usr/bin/env python3
"""
TTD-DR Phase 1 MVP 実運用スクリプト
研究クエリを入力して高品質な研究レポートを生成
"""

import sys
import time
from datetime import datetime
from ttd_dr_system_integration import TTDDRSystemIntegrator, create_default_configuration

def main():
    print("🎯 TTD-DR Phase 1 MVP - 研究レポート生成システム")
    print("=" * 60)
    
    # ユーザー入力
    print("\n📝 研究したいテーマを入力してください：")
    user_query = input("> ")
    
    if not user_query.strip():
        print("❌ クエリが空です。終了します。")
        return
        
    print(f"\n🔍 研究テーマ: {user_query}")
    
    # オプション設定
    print("\n⚙️  詳細設定 (Enterで標準設定):")
    
    target_length = input("目標文字数 [3000]: ").strip()
    target_length = int(target_length) if target_length.isdigit() else 3000
    
    max_sections = input("最大セクション数 [6]: ").strip()  
    max_sections = int(max_sections) if max_sections.isdigit() else 6
    
    search_iterations = input("検索反復回数 [10]: ").strip()
    search_iterations = int(search_iterations) if search_iterations.isdigit() else 10
    
    evolution_iterations = input("進化反復回数 [5]: ").strip()
    evolution_iterations = int(evolution_iterations) if evolution_iterations.isdigit() else 5
    
    print(f"\n📊 設定:")
    print(f"  目標文字数: {target_length}")
    print(f"  最大セクション数: {max_sections}")
    print(f"  検索反復回数: {search_iterations}")
    print(f"  進化反復回数: {evolution_iterations}")
    
    # システム初期化
    print(f"\n🚀 TTD-DRシステム初期化中...")
    config = create_default_configuration()
    config.planner_config['target_length'] = target_length
    config.researcher_config['search_iterations'] = search_iterations
    config.evolution_config['max_iterations'] = evolution_iterations
    
    system = TTDDRSystemIntegrator(config)
    
    # 研究実行
    print(f"\n🔬 研究開始... (このプロセスには時間がかかる場合があります)")
    print("=" * 60)
    
    start_time = time.time()
    
    try:
        result = system.execute_research_pipeline(
            user_query=user_query,
            constraints={
                'target_length': target_length,
                'max_sections': max_sections
            }
        )
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        if result['status'] == 'success':
            print(f"\n✅ 研究完了!")
            print(f"⏱️  実行時間: {execution_time:.1f}秒")
            print(f"🆔 実行ID: {result.get('execution_id', 'N/A')}")
            
            # 品質メトリクス表示
            quality_metrics = result.get('quality_metrics', {})
            overall_quality = quality_metrics.get('overall_quality', 0.0)
            print(f"📊 総合品質スコア: {overall_quality:.2f}/5.0")
            
            # レポート情報表示
            final_output = result.get('final_output', {})
            research_report = final_output.get('research_report', {})
            
            if research_report:
                word_count = research_report.get('word_count', 0)
                section_count = research_report.get('sections', 0)
                title = research_report.get('title', '無題')
                
                print(f"📄 生成レポート:")
                print(f"  タイトル: {title}")
                print(f"  文字数: {word_count}")
                print(f"  セクション数: {section_count}")
                
                # レポート内容の一部表示
                content = research_report.get('content', '')
                if content and len(content) > 200:
                    print(f"\n📖 レポート内容 (冒頭200文字):")
                    print("-" * 40)
                    print(content[:200] + "...")
                    print("-" * 40)
                
                # ファイル保存情報
                execution_id = result.get('execution_id', 'unknown')
                print(f"\n💾 詳細結果は以下に保存されました:")
                print(f"  📁 ttd_dr_output/{execution_id}_execution.json")
                print(f"  📁 ttd_dr_output/{execution_id}_output.json") 
                print(f"  📁 ttd_dr_output/{execution_id}_report.md")
                
            print(f"\n🎉 研究レポート生成完了!")
            
        else:
            print(f"\n❌ 研究失敗:")
            print(f"エラー: {result.get('error', '不明なエラー')}")
            
    except KeyboardInterrupt:
        print(f"\n⚠️  ユーザーによって中断されました")
        
    except Exception as e:
        print(f"\n💥 システムエラー: {str(e)}")
        
    finally:
        print(f"\n👋 TTD-DRセッション終了")


if __name__ == "__main__":
    main()