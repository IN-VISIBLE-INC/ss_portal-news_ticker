# SSPortal ウィジェット開発

このリポジトリはSSPortalウィジェットを開発するためのテンプレートです。

---

## 🚨🚨🚨 絶対厳守ルール 🚨🚨🚨

### リモートリポジトリ作成・命名の禁止事項

**Claude Codeが勝手にリポジトリ名を決定することを厳禁する。**

リモートリポジトリの作成・リネーム・URL変更を行う前に、**必ずユーザーにリポジトリ名を確認すること。**

```
❌ 禁止: 勝手にリポジトリ名を決めて作成/変更する
✅ 必須: 「リポジトリ名は○○でよいですか？」と確認してから実行
```

---

## 🚨 重要：コミット時のバージョン管理（厳守）

**manifest.jsonのversion更新とタグ付けは同時に行うこと。片方だけは禁止。**

```bash
# 1. src/manifest.json の "version" を更新（必須）
# 2. コミット（メッセージ先頭にバージョン明記・必須）
git add -A
git commit -m "v1.2.3 feat: 変更内容"
# 3. タグ付け（manifest.jsonと同じバージョン・必須）
git tag v1.2.3
```

| 変更種別 | バージョン例 |
|---------|-------------|
| 初期リリース | 1.0.0 |
| 機能追加 | 1.1.0 |
| バグ修正 | 1.0.1 |

**バージョン確認:** `src/manifest.json` または `git describe --tags --abbrev=0`

| 変更種別 | タグ例 |
|---------|--------|
| 初期リリース | v1.0.0 |
| 機能追加 | v1.1.0 |
| バグ修正 | v1.0.1 |

**タグを忘れた場合:**
```bash
git tag vX.Y.Z <commit-hash>
```

---

## 🚨 重要：リポジトリ命名規則（厳守）

**SSPortal関連のリポジトリは必ず `ss_portal-` を接頭辞にすること。**

| 種別 | 命名規則 | 例 |
|------|----------|-----|
| ウィジェット | `ss_portal-{widget_name}` | `ss_portal-world_clock` |
| テンプレート | `ss_portal-widget_template` | - |
| SDK/ライブラリ | `ss_portal-{name}` | `ss_portal-sdk` |

**❌ 禁止例:**
- `ssportal-widget-template` （ハイフン区切り、アンダースコアなし）
- `widget_clock` （接頭辞なし）

**✅ 正しい例:**
- `ss_portal-widget_template`
- `ss_portal-world_clock`
- `ss_portal-countdown_timer`

---

## 必読ドキュメント

**ウィジェット実装前に必ず読むこと:**

- ローカル: `web/src/components/widgets/WIDGET_RULES.md`
- GitHub: https://github.com/IN-VISIBLE-INC/ss_portal/blob/master/web/src/components/widgets/WIDGET_RULES.md

---

## 開発ルール

### 編集するファイル

```
src/
├── index.tsx       ← ウィジェット本体を実装
├── config.tsx      ← 設定UIを実装
└── manifest.json   ← メタデータを編集
```

### 編集禁止

```
@ssportal/          ← SDK（編集禁止）
```

### app/ ディレクトリ（プレビュー用）

プレビュー画面を修正する場合は、以下のルールを厳守すること。

**README.md の「プレビュー画面の実装」セクションを必ず参照。**

---

## プレビュー

ウィジェットをブラウザでプレビューできます。

```bash
npm install
npm run dev
# http://localhost:3001 でプレビュー
```

プレビュー画面では:
- 左側: ウィジェットプレビュー（固定幅）
- 右側: 設定パネル（スクロール可能）
- サイズ切り替え
- ライト/ダークテーマ切り替え

### プレビューレイアウト（厳守）

```
┌─────────────────────┬──────────┐
│                     │ サイズ   │
│    プレビュー       │ Dark/Light│
│    （固定幅）       ├──────────┤
│                     │ 設定     │
│                     │ （スクロール）│
└─────────────────────┴──────────┘
```

**CSSクラス:**
- 左側: `flex-1 w-0 overflow-hidden` （固定幅）
- 右側: `w-80 flex-shrink-0 overflow-y-auto` （320px固定）
- 大きいウィジェット: `maxWidth`で縮小表示（transform: scale）

### サーバー運用ルール（厳守）

**作業完了後は必ずサーバーをKill→再起動すること。**

```bash
# Kill
lsof -ti :3001 | xargs kill -9

# 再起動
npm run dev
```

**理由:** ファイル変更後にホットリロードが効かない場合があるため。

---

## import パス

```tsx
// index.tsx
import { WidgetWrapper, getThemeColors } from '@ssportal/WidgetWrapper';
import { WidgetProps, WidgetTheme } from '@ssportal/types';

// config.tsx
import { useConfigStore } from '@ssportal/hooks';
import { WidgetInstance, WidgetTheme } from '@ssportal/types';
import { WidgetThemeConfig } from '@ssportal/WidgetThemeConfig';
```

---

## 実装フロー

1. WIDGET_RULES.md を読む（上記リンク参照）
2. `src/manifest.json` を編集（id, name, availableSizes等）
3. `src/index.tsx` を実装
4. `npm run dev` でプレビュー確認
5. `src/config.tsx` を実装
6. ライト/ダーク両モードで動作確認

---

## 注意事項

- `'use client'` をファイル先頭に必ず付ける
- `WidgetWrapper` で必ず囲む
- `getThemeColors(theme)` でテーマ色を取得
- ハードコードされた色（`text-white`等）は使用禁止
- ライト/ダークモード両方で視認性を確認

---

## 🚨 Gitタグ（必須・厳守）

**ウィジェット実装完了時、必ずタグを付けること。**

**タイミング：**
- 初期実装完了時 → `v1.0.0`
- 機能追加時 → マイナーバージョンアップ（例: `v1.1.0`）
- バグ修正時 → パッチバージョンアップ（例: `v1.0.1`）

**必須コマンド：**
```bash
git tag vX.Y.Z
git push origin main --tags
```

**⚠️ タグを忘れた場合：**
```bash
git tag vX.Y.Z <commit-hash>
git push origin vX.Y.Z
```

**タグがないとSSPortalに統合できません。**
