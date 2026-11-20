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
| `takibi-design-system/fire` | 焚き火（`<takibi-fire>`）。焚き火の計算モデルを WebGL2 で動かして描くカスタム要素。薪をくべる操作とイベントを持つ。WebGL2 が使えないときは動画に替わる |
| `takibi-design-system/embers` | 火の粉の背景（`<takibi-embers>`）。Canvas で描くカスタム要素 |
| `takibi-design-system/stars` | 星空の背景（`<takibi-stars>`）。Canvas に 1 回だけ描くカスタム要素 |

## ライセンス

コードと、星のデータ以外の素材は MIT です（`LICENSE`）。

星のデータ（`src/stars-data.js`）だけは CC BY-SA 4.0 です。ライセンスの全文は `LICENSES/CC-BY-SA-4.0.txt` にあります。

- 出典: HYG Database v4.4（David Nash、https://codeberg.org/astronexus/hyg ）
- 元のデータのライセンス: Creative Commons Attribution-ShareAlike 4.0 International（https://creativecommons.org/licenses/by-sa/4.0/ ）
- 改変の内容: 5.0 等より明るい 1637 個に絞り、赤経（時から度に換算）、赤緯、実視等級、色指数 B−V の 4 列だけを残し、0.1 刻みに丸めた。色指数が空の星は 0.6 とした
- 保証: 元のデータにも、このファイルにも保証はない

`takibi-design-system/stars` を読み込んだアプリを配るときは、このデータも一緒に配ることになります。上の出典とライセンスを、アプリのクレジットかライセンスの一覧に書いてください。`src/stars-data.js` の先頭の注記は、バンドラーが消すことがあります（Vite の既定の設定では消えます）。同じ文は `customElements.get("takibi-stars").credit` で取り出せます。`takibi-design-system/stars` を読み込まなければ、このデータはアプリに入りません。
