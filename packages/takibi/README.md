# takibi-design-system

焚き火を愛するエンジニアのプロダクトと発信を、1 つの言葉と見た目でそろえるためのデザインシステムです。使い方とコンポーネントの一覧は https://design-system.y-kaz.com にあります。

TypeScript のソースをそのまま配布しています。Vite のように、`node_modules` の TypeScript を変換するバンドラーで使ってください。

## 入口

| import | 使う場面 |
|---|---|
| `takibi-design-system` | React のコンポーネント |
| `takibi-design-system/styles.css` | Tailwind CSS v4 のアプリ。`@import "tailwindcss";` のあとに読み込む |
| `takibi-design-system/tokens.css` | Tailwind を使わない場所。素の CSS 変数。夜が既定で、`[data-theme="light"]` で昼になる |
| `takibi-design-system/tokens.json` | CSS を読まない道具。各トークンの値、昼の値、説明、CSS 変数名 |

## ライセンス

MIT
