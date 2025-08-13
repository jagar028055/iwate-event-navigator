# Termux 高機能キー設定ガイド

このドキュメントはTermuxの高機能キー設定について説明します。この設定は[あなたもAndroidに機種変してTermuxでClaude CodeでMCPしよ？](https://zenn.dev/kazuph/articles/abb81cf4c844d6)の記事を参考にして実装されました。

## 設定概要

### 適用された設定バージョン
- **2025-07-02版** - tmux統合機能付き高機能設定

### 主な特徴
- tmux操作の高速化
- Claude Code向け最適化
- セッション管理ショートカット
- 長押し（ポップアップ）機能

## キー配置詳細

### 上段（1列目）
| キー | 基本機能 | 長押し機能 | 説明 |
|------|----------|------------|------|
| **ESC** | エスケープキー | - | 基本的なエスケープ操作 |
| **\|** | パイプ文字 | PGUP | パイプ/ページアップ |
| **$** | ドル記号 | PGDN | 変数参照/ページダウン |
| **/** | スラッシュ | /clear | パス区切り/Claude Code クリア |
| **#** | ハッシュ記号 | - | コメント/Markdown見出し |
| **UP** | 上矢印 | tmux new | カーソル上移動/新tmuxペイン作成 |
| **@** | アットマーク | - | メールアドレス/GitHub参照 |
| **\\** | バックスラッシュ | - | Windows風パス区切り |
| **~** | チルダ | ^ | ホームディレクトリ/ハット文字 |

### 下段（2列目）
| キー | 基本機能 | 長押し機能 | 説明 |
|------|----------|------------|------|
| **TAB** | タブ | SHIFT+TAB | インデント/逆タブ |
| **CTRL** | コントロールキー | Ctrl+C | 修飾キー/プロセス中断 |
| **ALT** | オルトキー | - | 修飾キー |
| **!** | エクスクラメーション | - | 論理否定/bash履歴展開 |
| **LEFT** | 左矢印 | tmux prev | カーソル左移動/前tmuxペイン |
| **DOWN** | 下矢印 | tmux kill | カーソル下移動/tmuxペイン終了 |
| **RIGHT** | 右矢印 | tmux next | カーソル右移動/次tmuxペイン |
| **ENTER** | エンター | \\+ENTER | 改行/行継続 |
| **BKSP** | バックスペース | - | 削除 |

## tmux統合機能

### 長押しでアクセスできるtmux操作
- **UP → Ctrl+b c**: 新しいtmuxペインを作成
- **LEFT → Ctrl+b p**: 前のtmuxペインに移動
- **RIGHT → Ctrl+b n**: 次のtmuxペインに移動
- **DOWN → Ctrl+b x**: 現在のtmuxペインを終了

### セッションショートカット
- **Ctrl+t**: 新しいTermuxセッション作成
- **Ctrl+Shift+n**: 次のセッションへ移動
- **Ctrl+Shift+p**: 前のセッションへ移動

## Claude Code最適化機能

### 専用機能
- **/ 長押し → /clear**: Claude Codeのコンテキストをクリア
- **TAB 長押し → SHIFT+TAB**: プランニングモード切り替え
- **ENTER 長押し → \\ + ENTER**: 長いコマンドの行継続

## 使用方法

### 基本操作
1. キーを**タップ**：基本機能を実行
2. キーを**上スワイプ**：ポップアップ（長押し）機能を実行

### 実践例
1. **新しいtmuxペイン作成**: UPキーを上スワイプ
2. **Claude Codeクリア**: /キーを上スワイプ
3. **プロセス中断**: CTRLキーを上スワイプ

## 追加設定

### その他の有効化された機能
- `allow-external-apps=true`: 外部アプリからのコマンド実行を許可
- `back-key=escape`: バックキーでエスケープ送信
- `bell-character=vibrate`: ベル音で振動
- ターミナルマージン調整

## バックアップ

元の設定は以下にバックアップされています：
```
~/.termux/termux.properties.backup.20250813_222108
```

## 復元方法

元の設定に戻したい場合：
```bash
cp ~/.termux/termux.properties.backup.20250813_222108 ~/.termux/termux.properties
termux-reload-settings
```

## 設定ファイルの場所

```
~/.termux/termux.properties
```

## 参考リンク

- [元記事: あなたもAndroidに機種変してTermuxでClaude CodeでMCPしよ？](https://zenn.dev/kazuph/articles/abb81cf4c844d6)
- [Termux公式Wiki: Terminal Settings](https://wiki.termux.com/wiki/Terminal_Settings)

---
設定適用日: 2025-08-13
バージョン: 2025-07-02版 (tmux統合機能付き)