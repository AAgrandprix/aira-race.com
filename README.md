# aira-race.com

AIRA Race のランディングページ。Astro + Tailwind CSS による静的サイト。

## 技術スタック

- [Astro](https://astro.build/) — 静的サイトジェネレーター
- [Tailwind CSS](https://tailwindcss.com/) — ユーティリティファースト CSS
- [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — サイトマップ自動生成

## ローカル起動

```bash
# 依存インストール
npm install

# 開発サーバー起動（http://localhost:4321）
npm run dev

# プロダクションビルド
npm run build

# ビルド結果をプレビュー
npm run preview
```

## デプロイ

### GitHub Pages

1. リポジトリの Settings → Pages → Source を **GitHub Actions** に変更
2. `main` ブランチに push すると `.github/workflows/deploy.yml` が自動実行
3. ビルド結果が GitHub Pages にデプロイされる

カスタムドメイン (`aira-race.com`) を使う場合:
- Pages 設定で Custom domain に `aira-race.com` を入力
- DNS に CNAME レコード (`AAgrandprix.github.io`) を追加
- `public/CNAME` ファイルにドメインを記載（必要に応じて）

### Cloudflare Pages

1. Cloudflare Dashboard → Pages → Create a project → Connect to Git
2. ビルド設定:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** `20`（環境変数 `NODE_VERSION=20`）
3. カスタムドメインは Cloudflare DNS で設定

## 原稿更新手順

LP のテキスト・構成は `src/data/landing.json` に集約されています。

### 手順

1. `src/data/landing.json` を編集
2. `npm run dev` で表示確認
3. コミット → push → 自動デプロイ

### JSON 構造

```
landing.json
├── site          … サイト名・SEO メタ情報
├── hero          … ヒーローセクション（タイトル・CTA）
├── thirtySeconds … 30秒説明セクション
├── features      … 特徴一覧（配列）
├── philosophy    … フィロソフィー / SOC
├── getStarted    … 3ステップ手順（配列）
├── community     … コミュニティリンク（配列）
├── faq           … FAQ（配列）
└── footer        … フッター
```

各セクションのテキストを書き換えるだけでデザインは維持されます。項目の追加・削除も配列を編集するだけで対応できます。

## プロジェクト構造

```
aira-race.com/
├── .github/workflows/deploy.yml   # GitHub Pages 自動デプロイ
├── public/
│   ├── favicon.svg                 # ファビコン
│   └── robots.txt                  # クロール設定
├── src/
│   ├── data/landing.json            # LP 全原稿（差し替え用）
│   ├── components/                 # セクションコンポーネント
│   │   ├── SEOHead.astro
│   │   ├── Hero.astro
│   │   ├── ThirtySeconds.astro
│   │   ├── Features.astro
│   │   ├── Philosophy.astro
│   │   ├── GetStarted.astro
│   │   ├── Community.astro
│   │   ├── FAQ.astro
│   │   └── Footer.astro
│   ├── layouts/Layout.astro        # 共通レイアウト
│   └── pages/index.astro           # LP エントリーポイント
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```
