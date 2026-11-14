---
title: Takibi Design System
description: 焚き火を愛するエンジニアのプロダクトと発信を、1 つの言葉と見た目でそろえるためのデザインシステム
order: 0
---

暗い背景を基本にし、ブランドカラー（焚き火の橙）は操作の要所だけに使います。飾りは足さず、必要なものだけを置きます。

## 中身

| 節 | 中身 |
|---|---|
| 基本要素 | カラー、タイポグラフィ、角丸と影、レイアウト、モーション、アイコン、ライティング |
| プロダクト | アプリの画面を作るためのコンポーネントと、アクセシビリティ、キーボード操作 |
| コミュニケーション | スライド、OGP、SNS の画像など、発信物に基本要素を当てはめるための決まり |

AI から読むときは [/llms.txt](/llms.txt) から始めます。各ページは、URL の末尾に `.md` を付けると Markdown で読めます。

## アプリでの使い方

1. 依存に追加する

   ```sh
   bun add takibi-design-system
   ```

2. アプリの CSS で、Tailwind のあとにスタイルを読み込む。コンポーネントが使うクラスは、パッケージ側の `@source` でアプリの Tailwind に拾わせている

   ```css
   @import "tailwindcss";
   @import "takibi-design-system/styles.css";
   ```

3. `<head>` で書体を読み込む

   ```html
   <link
     rel="stylesheet"
     href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=LINE+Seed+JP:wght@400;700&display=swap"
   />
   ```

4. アプリの最上位に `TooltipProvider` と `Toaster` を置く

   ```tsx
   import { Toaster, TooltipProvider } from "takibi-design-system";

   <TooltipProvider>
     <App />
     <Toaster />
   </TooltipProvider>;
   ```

5. 夜と昼を切り替えるときは `setTheme("light")` を呼ぶ。最初から昼にするときは、`<html data-theme="light">` を付ける

Tailwind を使わない場所では `takibi-design-system/tokens.css`（素の CSS 変数）を、CSS を読まない道具では `takibi-design-system/tokens.json` を使います。

## 約束

- 色は役割のトークン（`bg-surface`、`text-fg-muted`、`border-line` など）だけを使う。Tailwind の既定パレットは無効にしてあり、`bg-red-500` は効かない
- 振る舞いは [Base UI](https://base-ui.com) に任せ、見た目と動きをこのパッケージで決める
- 動きは `motion-*` の語彙と、`--duration-*`・`ease-*` のトークンから選ぶ
