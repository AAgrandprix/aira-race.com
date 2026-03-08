# aira LP Dev Instruction & Status
_Last updated: 2026-03-08 (session 2)_

---

## 目標
**2026年6月末に賞金付きコンペを開催する**

コンペ内容：
- **タイムトライアル** — スコアをLeaderboardで競う。期日までの上位者に賞金（PayPal）
- **トーナメント** — 2台ずつ対戦。YouTube配信。タイムトライアル提出者優先・スコア順で前から出走

---

## 全体フェーズ & スケジュール

| フェーズ | 期間 | 内容 |
|---|---|---|
| Phase 1 基盤整備 | 〜3月末 | チュートリアルページ、コンペページ作成 |
| Phase 2 コンペ機能 | 4月 | 参加登録フロー、Leaderboard改善、トーナメントルール |
| Phase 3 仕上げ | 5〜6月初 | モバイル対応、SEO、PayPal案内 |
| Phase 4 本番 | 6月末 | タイムトライアル締切、トーナメント配信、賞金送付 |

---

## 現状マップ（2026-03-08時点）

### ページ一覧

| URL | 状態 | 備考 |
|---|---|---|
| `/` | ✅ 動作中 | Hero, GettingStarted, Competitions, Leaderboard |
| `/login` | ✅ 動作中 | Firebase Google Auth |
| `/dashboard` | ✅ 動作中 | 2枚カード（Getting Started / Competitions） |
| `/rules` | ⚠️ プレースホルダーのみ | 内容なし |
| `/vision` | ⚠️ 要確認 | |
| `/agreement` | ⚠️ 要確認 | |
| `/getting-started` | ✅ 動作中 | 6ステップ、コードブロック+コピーボタン、ログイン不要 |
| `/competitions` | ✅ 動作中 | GAS API → Competition_Index シートからカード表示 |
| `/competitions/[id]` | ❌ 未作成 | 詳細・参加ページ |
| `/tutorial` | ❌ 未作成 | aira Beta 1.6 チュートリアル |

### コンポーネント一覧

| コンポーネント | 使用箇所 | 状態 |
|---|---|---|
| Header | 全ページ | ✅ |
| Footer | 全ページ | ✅ |
| Hero + HeroAnimation | `/` | ✅ |
| GettingStarted | `/` セクション | ✅（ページは `/getting-started` として作成済み） |
| Competitions | `/` セクション + `/competitions` ページ | ✅（GAS API → Competition_Index、カードデザイン統一） |
| Demo | `/` セクション | ✅（YouTubeモーダル対応、動画ID未設定時はプレースホルダー） |
| Leaderboard | `/` セクション | ⚠️ iframeでスプレッドシート埋め込み（デザイン課題） |
| DashboardHeader | `/dashboard` | ✅ Firebase Auth対応 |
| LoginManager | `/login` | ✅ |
| Mission, Roadmap, FAQ, TechSpecs, Workflow | **未使用** | 作成済みだが未配置 |

### データ基盤

| 仕組み | 状態 | 役割 |
|---|---|---|
| Firebase Auth | ✅ 稼働中 | Google ログイン |
| Firebase Firestore | ✅ 初期化済み・**未活用** | 参加登録受け取り予定 |
| Google Sheets | ✅ 稼働中 | Leaderboard（iframe表示）、管理台帳 |
| GAS WebApp | ✅ 稼働中 | Competitionsデータ配信（JSON） |
| Beta 1.6 Unity App | ✅ 稼働中 | レース結果を自動でGAS→Sheets書き込み |

---

## 設計方針（決定事項）

### データフロー
```
[Beta 1.6 Unity App]
    ↓ レース結果（自動送信）
[GAS WebApp]
    ↓
[Google Spreadsheet] ← 管理者がここで確認・管理
    ↓ JSON配信
[aira-race.com / Leaderboard, Competitions表示]

[ユーザー] → Firebase Auth → ログイン
    ↓ 参加ボタン押下
[Firestore] ← 参加意思表示を記録
```

### 管理画面
→ **不要**。スプレッドシートを管理者が直接操作する運用。

### Leaderboard表示
→ **iframeからAPI取得に移行予定**（GAS側でLeaderboard用エンドポイントを追加）。
→ スプレッドシートで管理しつつ、サイト側でネイティブ描画する。

### 参加登録フロー（未確定・要確認）
- ユーザーはFirebase Authでログイン
- 参加ボタンを押すとFirestoreに参加記録（UID, 表示名, timestamp）
- Beta 1.6がスプレッドシートに書き込む際の**ユーザー識別子**と合わせる必要がある
- **要確認**: Beta 1.6はどのキーでユーザーを識別しているか？（メール？名前？）

---

## ユーザー体験フロー

```
TOPページ
├─ ログイン不要で見れる：チュートリアルページ（/getting-started）
├─ ログイン不要で見れる：Vision（/vision）
└─ コンテンツページ（/competitions）→ ログインが必要

ログイン後
└─ コンペ詳細ページ（/competitions/[id]）
   ├─ コンペ情報・ルール表示
   ├─ [参加する] / [キャンセル] ボタン
   └─ 開催中 / 終了 / アーカイブ のステータス表示
```

---

## Phase 1 タスク詳細（〜3月末）

### ① チュートリアルページ `/getting-started` ✅ 完了
- [x] ページ作成（ログイン不要）
- [x] 6ステップ構成（Fork → Setup → NAME設定 → 起動 → 改造 → 提出）
- [x] コードブロック + 言語バッジ + コピーボタン（vanilla JS）
- [x] デザイン：ランディングと統一（グリッド背景、arena-* トークン）

### ② コンペリストページ `/competitions` ✅ 完了
- [x] ページ作成（ログイン不要）
- [x] GAS API（PUBLIC_GAS_API_URL）→ Competition_Index シートからカード表示
- [x] ステータスバッジ（Active=緑 / Upcoming=オレンジ / Ended=グレー）
- [x] 日付フォーマット（ISO→`Apr 1, 2026`形式、Asia/Tokyo timezone対応）
- [x] Competitions.astro（TOPページ埋め込み）も同デザインに統一
- [x] Header ナビに Tutorial・Competitions の直リンク追加
- [ ] カードクリックで詳細ページへ（DetailUrlがあれば外部リンクで対応）

### ③ コンペ詳細ページ `/competitions/[id]`
- [ ] ページ作成
- [ ] コンペ情報（タイムトライアル or トーナメント、賞金、期間、ルール）
- [ ] 参加/キャンセルボタン（Firebase Firestore書き込み）
- [ ] Leaderboard表示（タイムトライアルのみ）

### ④ Leaderboard改善
- [ ] iframeからGAS APIに切り替え
- [ ] ネイティブHTMLテーブルで表示
- [ ] レスポンシブ対応

---

## 未決事項（要確認）

| 項目 | 状況 |
|---|---|
| Beta 1.6がSheetsに書くユーザー識別子は何か | ✅ `NAME=` (config設定、英数字) |
| タイムトライアルのLeaderboard用GASエンドポイントは別途必要か | ❓ |
| トーナメントのブラケット表示はサイトで必要か | ❓ |
| PayPal連携（受け取り案内）のページ or モーダルが必要か | ❓ |
| モバイルメニュー（Headerに TODO コメントあり） | 🔲 Phase 3 |
| **退会機能（アカウント削除）** | 🔲 Phase 3。Firebase Auth削除 + Firestoreドキュメント削除。確認モーダル必須 |
| **[Beta 1.6 要対応] NAME= の文字数制限を 10→16 文字に変更** | 🔲 サイト側は対応済み。Unity/Python側のバリデーション・config説明文を更新する |

---

## 今日の作業ログ（2026-03-08）

- [x] 現状マップ整理
- [x] 全体タスク・スケジュール策定
- [x] チュートリアルページ `/getting-started` 作成
- [x] コンペリストページ `/competitions` 作成（GAS API連携・カードデザイン）
- [x] Demo セクション（`Demo.astro`）を LP に追加
- [x] LP セクション順を変更（Hero → GettingStarted → Demo → Competitions → Leaderboard）
- [x] GettingStarted セクション CTA を2ボタン化（GitHub黒 + View Demo sky）
- [x] Header ナビに Tutorial・Competitions 直リンク追加
- [x] Competitions カードデザインを TOPページ・専用ページで統一
- [x] DisplayName バリデーション強化（英数字のみ・16文字・一意性チェック）
- [x] 日付フォーマット（ISO → readable、Asia/Tokyo 補正）
- [x] Firebase + Sheets 設計確定（GAS `doGet` → Competition_Index シート）
- [ ] Firestore ルール変更（コンソールで手動: `allow read: if request.auth != null;`）
