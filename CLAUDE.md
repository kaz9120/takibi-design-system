# Takibi Design System

焚き火を愛するエンジニアのプロダクトと発信を、1 つの言葉と見た目でそろえるためのデザインシステム。ひどこ（`~/Hobby/hidoko`）の各アプリを、`packages/ui` からこのパッケージに置き換えるために作っている。

ブランドガイドライン（理念、価値観、ブランドパーソナリティ）は、デザインシステムを先に仕上げるため、いったん外している。下書きは `notes/brand-source/` にある（git の対象外）。

## 構成

bun のワークスペース。依存はルートで `bun install` する。

| 場所 | 中身 |
|---|---|
| `packages/takibi/` | npm で公開するパッケージ `takibi-design-system`。トークン、動き、コンポーネントとそのストーリー |
| `content/` | 読み物の正（Markdown）。基本要素、プロダクト、コミュニケーション。サイト、`llms.txt`、MCP はここを読む |
| `apps/workbench/` | Storybook。コンポーネントを作って試し、テストを回す作業台。公開しない |
| `apps/site/` | `design-system.y-kaz.com`。`content/` とストーリーから、ドキュメント、`llms.txt`、各ページの Markdown を静的に書き出す。`bun run site`（http://localhost:5173） |

以下、`src/` で始まるパスは `packages/takibi/src/` を指す。

- `src/tokens.css`: 基本の色と、役割のトークン（Tailwind v4 の `@theme`）。ダークが既定で、`[data-theme="light"]` で昼に切り替える。Tailwind を使わない場所向けの `dist/tokens.css`（素の CSS 変数）と `dist/tokens.json` は、`bun run build:tokens` でここから生成する。`dist/` は手で直さない
- `src/motion.css`: 動きの語彙（`motion-*` ユーティリティ）
- `src/base.css`: 素の要素の見た目
- `src/components/<name>.tsx` と `<name>.stories.tsx`: コンポーネントとストーリー
- `content/`: 読み物。front matter に `title`、`description`、`order` を書く。サイトの左のメニューと `llms.txt` はこの順に並ぶ。節は次の 3 つで、どこに置くかは層で決める

| 節 | 層 | 置くもの |
|---|---|---|
| `basics/` | 表現 | 見た目（カラー、タイポグラフィ、角丸と影、レイアウト、モーション、アイコン）と言葉（ライティング）の決まり |
| `product/` | 適用 | アプリの画面に当てはめる決まり。コンポーネントはストーリーから作る |
| `communication/` | 適用 | 発信物（スライド、OGP、SNS の画像）に当てはめる決まり |

  何を、いつ、どこに発信するか（テーマ、チャネル、ターゲット）は運用の層で、このリポジトリには置かない
- `content/` の本文は敬体（です・ます）、箇条書きは常体で書く。`description` は句点のない 1 つの句にする
- `apps/workbench/src/docs/`: 基礎（色・文字・動きなど）の作業用のカタログ
- 作業台: `bun run workbench`（http://localhost:6006）

## コンポーネントの書き方

`button.tsx`、`dialog.tsx`、`tooltip.tsx`、`toast.tsx` を手本にする。

- 振る舞いは Base UI（`@base-ui/react`）に任せる。Radix は使わない。API は `node_modules/@base-ui/react/docs/react/components/<name>.md` を読む。記憶より同梱のドキュメントを信じる
- 見た目は Tailwind のクラスで書き、`cn()`（`src/lib/cn.ts`）で外から渡す `className` と結合する。種類の多い見た目は `cva` で variant にする
- コンポーネントを合成するときは Base UI の `render` プロパティを使う（`asChild` はない）
- 各要素に `data-slot="<コンポーネント名>"` を付ける
- コンポーネントの JSDoc に、いつ使うかを1〜2文で書く。文言は日本語
- 文言の例は、ブランドの声に合わせて短く書く。「〜です！」「最高」「革命的」「あなたの〜」は使わない

## トークンの使い方

色は役割のトークンだけを使う。Tailwind の既定パレット（`bg-red-500` など）は無効にしてあり、書いても効かない。

| 用途 | クラス |
|---|---|
| 面 | `bg-surface`（ページ）、`bg-surface-raised`（カード）、`bg-surface-overlay`（ポップオーバー・メニュー・ダイアログ）、`bg-surface-sunken`（入力欄・コード）、`bg-surface-hover`（ホバー。半透明なので、どの面の上でも使える） |
| 文字 | `text-fg`、`text-fg-strong`、`text-fg-muted`、`text-fg-subtle`（プレースホルダー・無効だけ）、`text-fg-on-brand`、`text-fg-on-danger` |
| 線 | `border-line`、`border-line-subtle`、`border-line-strong`（入力欄など操作できる要素の枠） |
| ブランド | `bg-brand` / `text-brand`、`-hover`、`-active`、`bg-brand-soft`（選択中の面）、`outline-focus` |
| 状態 | `text-success` / `bg-success-soft`、`warning`、`danger`、`info`、`bg-danger-solid`（取り消せない操作のボタン） |
| 角丸 | `rounded-sm`（4px）、`rounded-md`（6px、標準）、`rounded-lg`（10px、カード）、`rounded-xl`（16px、ダイアログ）、`rounded-full`（円形だけ。ボタンには使わない） |
| 影 | `shadow-rim`、`shadow-card`、`shadow-pop`（重なる面）、`shadow-glow` / `-soft` / `-strong` |
| 文字の大きさ | `text-xs`（12px、装飾ラベルだけ）、`text-sm`（14px、UI の最小）、`text-base`（16px、本文）〜 `text-6xl` |

ブランドカラーは CTA、リンク、フォーカス、ロゴだけに使う。純白と純黒は書かない。

## 動きの使い方

動きは CSS と Motion（`motion/react`）の 2 層で作る。Base UI の data 属性で開閉するコンポーネントは CSS の `motion-*` で、幅の補間・中身の入れ替え・線を描く動きは Motion で書く。

| 場面 | 使うもの |
|---|---|
| 独自の押せる要素 | `motion-press`（Button は Motion で同じ動きをする） |
| カードや一覧の行など、大きな押せる面 | `motion-press-surface` |
| チェックボックス、ラジオなど小さな押せる要素 | `motion-press-icon` |
| 入力欄の枠の中にある、アイコンだけのボタン（増減、開閉、消す） | `motion-press-glyph`（面ではなく中の svg だけを沈める） |
| 値があるときだけ出る小さなボタン（消すボタンなど） | `motion-swap`（Motion で書くときは `swap`） |
| チェックマークなど、線で描くもの | `motion-draw`（path に `pathLength={1}`） |
| メニュー、セレクト、Command の選んでいる項目の背景 | `src/lib/glide.tsx` の `GlideGroup` と `glideRender` |
| ナビゲーションの今の項目、開いているメニューのインジケーターなど、滑って移る面 | `GlideGroup` と `Glide`（色や形は `className` で変える） |
| hover で照らす | `motion-glow` |
| ツールチップ、ポップオーバー、メニュー、セレクトの中身 | `motion-rise` |
| ダイアログ本体とバックドロップ | `motion-dialog`、`motion-backdrop` |
| アコーディオンや折りたたみの中身 | `motion-fold` |
| 新しく追加された要素 | `motion-settle` |
| トースト | `motion-toast` |
| エラー文など、動かさずに薄く出す小さなもの | `motion-fade` |
| タブの中身 | `motion-scene` |
| 選択インジケーター（タブの下線など） | `motion-tongue`（炎の舌） |
| Command パレット | `motion-ignite`（着火） |
| 完了の瞬間 | `motion-flare`、`motion-spark`（はぜる） |
| 読み込み中の面 | `motion-ember-pulse` |
| 進んでいる間だけ光る先端（導火線） | `motion-fuse`（祖先に `data-advancing`）と、本体に `shadow-ember` |
| Motion で消える要素（上へ昇ってぼける） | `src/lib/motion.ts` の `smoke`（`exit` に渡す） |

- 開く動きはばね（`ease-spring-snappy / press / soft / glide` と、同じ名前の `--duration-spring-*`）で、閉じる動きは `ease-out-expo` で 150〜200ms にする
- Motion では `src/lib/motion.ts` の `springs` と `amplitude` を使い、数値を直に書かない
- ポップオーバーやメニューが付いて出る要素（トリガー）は、大きさを変えない。ポップアップが一緒に揺れる。Button は `aria-haspopup` か `aria-expanded` を受け取ると、自分で拡大縮小をやめる
- サブメニューは必ず `menu.tsx` の `MenuSub` で組む。Base UI の `SubmenuRoot` を直に使うと、斜めに向かう途中で減速しただけで閉じる（`src/lib/menu-aim.ts` が補っている）
- 閉じる動きは、開く動きと同じ形の曲線で、少しだけ速くする。形まで変えると、閉じるときだけ唐突に見える
- 振れ幅は `--press-scale`（0.97）、`--hover-scale`（1.02）などのトークンから選ぶ
- 動きを減らす設定では、位置と大きさの動きを消し、色と影だけを残す
- 夜と昼の切り替えは `setTheme()`（`src/lib/theme.ts`）を使う。`data-theme` を直に書き換えると、コンポーネントごとに色の変わる時刻がずれる
- 中央寄せに `translate` を使うコンポーネントがあるので、`motion-*` で `translate` プロパティを動かすときは、そのコンポーネントに当てないか確かめる

## 説明の書き方

コードのコメント、JSDoc、ストーリーの説明、コンポーネントページ（`parameters.takibi`）、ガイドラインは、見たままを普通の日本語で書く。世界観は見た目と動きで出し、説明の文では出さない。

- 動きは「何が、どこから、どれだけ、どれくらいの時間で」で書く。「霧が晴れるように」「そっと寄り添って」「熾火の色がゆっくり走る」のような比喩で説明しない
- 色は役割の名前で書く（ブランドカラー、danger の色）。「火の色」「炎の色」「温まる」「冷める」「灯る」で済ませない
- 署名になる動きの名前（着火、残り火、炎の舌、熾火の目盛り、導火線、火の粉の伝播、はぜる、煙）は、名前として使ってよい。初めて出す所では、具体的な動きを添える
- 「〜を作る」「〜を保つ」のように抽象的な目的で終わらせず、利用者に何が起きるかを書く
- ストーリー名は日本語にする（`name: "アイコン付き"`）
- 用語は、日本語圏のデザインシステム（SmartHR、デジタル庁、Sansan One）や Base UI で使われている一般的な語にする。独自の言い換えを作らない（タグ、ハンドル、ポップアップ、バックドロップ、インジケーター、スクリーンリーダー、アクセシブルネーム）

| 使わない | 使う |
|---|---|
| 開くと霧が晴れるように浮かぶ | 開くと、ぼけた状態から 12px 上がりながら現れる |
| 熾火の色がゆっくり走る | ブランドカラーを薄く混ぜた帯が、1.8 秒で左から右へ流れる |
| 選択中の項目が灯る | 選択中の項目の背景がブランドカラーの薄い色になる |
| 夜の安心感を保つ | 暗い背景で、文字の明るさの比を 4.5:1 以上にする |

## ストーリーの書き方

- `title` は `コンポーネント/<分類>/<名前>`。分類は「基本」（文字や配置の土台）「アクション」「フォーム」「オーバーレイ」「フィードバック」「データ表示」「ナビゲーション」
- 基本の形、variant や size の一覧、状態（通常・hover・無効・エラーなど）の一覧を用意する
- キーボード操作やフォーカスの移り方は、`play` 関数（`storybook/test` の `userEvent` と `expect`）で確かめるストーリーにする
- ストーリーの JSDoc に、そのストーリーで見せている振る舞いを1文で書く
- meta の `parameters.takibi` に、コンポーネントページの中身を書く（型は `src/spec.ts` の `ComponentDocs`。手本は `button.stories.tsx`、`dialog.stories.tsx`、`field.stories.tsx`）。見出しの順番と見た目は `apps/workbench/src/docs/page/component-page.tsx` が決める
- ストーリーの export 名で、コンポーネントページのどの見出しに置くかが決まる（`Variants` → 種類、`Sizes` → サイズ、`States` → 状態、ほか → 使い方の例）。`parameters.section` で明示してもよい。`play` を持つストーリーはページに並べず、「テスト」に名前だけ出る

## 検証

1. `bun run typecheck`
2. `bun run lint`
3. `bun run build:workbench`
4. `bun run build:site`（コンポーネントページはストーリーから作るので、ストーリーを変えたら通す）

## 公開

npm への公開は GitHub Actions（`.github/workflows/publish.yml`）が行う。npm の trusted publishing で認証するので、トークンは置かない。

1. `packages/takibi/package.json` の `version` を上げてコミットする
2. 同じ版のタグを付けて push する（`git tag v0.2.0 && git push origin main v0.2.0`）

ワークフローは、タグと `version` がそろっているかを確かめ、検証の 4 つを通してから公開する。サイトは `apps/site` で `bunx wrangler deploy` を実行してデプロイする。

Claude の「Design System」へは、`bun run build:site` と `bun run build:design-system` で書き出し、Claude Code の Artifact ツールで公開する。同期先と手順は `packages/takibi/scripts/design-system/README.md` にある。Claude Code の `/design-sync` は単体の Claude Design（2026-12-14 終了）に送るものなので使わない。
