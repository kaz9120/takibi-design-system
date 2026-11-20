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

- `src/tokens.css`: 基本の色と、役割のトークン（Tailwind v4 の `@theme`）。ダークが既定で、`[data-theme="light"]` で昼に切り替える。面、文字、枠線の色は空から取り、時刻（`--sky-phase`）と天気（`--sky-overcast`、`data-weather="cloudy"`）で色相と彩度が動く。明るさは動かさない。Tailwind を使わない場所向けの `dist/tokens.css`（素の CSS 変数）と `dist/tokens.json` は、`bun run build:tokens` でここから生成する。`dist/` は手で直さない
- `src/motion.css`: 動きの語彙（`motion-*` ユーティリティ）
- `src/lib/daylight.ts`: 時刻に合わせる仕組み（`startDaylight()`、`skyAt()`、`setWeather()`）。場所と日付は浅間山麓の標高 1200m、秋分の日で固定。位置情報も天気も取りに行かない
- `src/fire.js`、`src/fire/`: 焚き火（`<takibi-fire>`）。焚き火の計算モデル（`labs/fire3d`）から書き出した画像と動画を重ねるカスタム要素。実行時は計算しない
- `src/embers.js`: 火の粉の背景（`<takibi-embers>`）。Canvas で描くカスタム要素
- `src/stars.js`、`src/stars-data.js`: 星空の背景（`<takibi-stars>`）。実在の星のカタログから、固定の場所と日付の空を Canvas に 1 回だけ描く。動かない。夜のテーマでだけ見え、薄明の間は薄くなる。炎や火の粉の背景と重ねてよい
- 星のデータは HYG Database v4.4 から `bun scripts/stars.mjs` で書き出す（CC BY-SA 4.0。v3.x は CC BY-SA 2.5 なので使わない）。手で直さない。出典の表記は `stars-data.js` の先頭、`packages/takibi/README.md`、ルートの `README.md`、`content/basics/color.md` にあり、版や絞り方を変えたら 4 か所を直す
- `labs/`: 焚き火、空、雨の計算モデル。パッケージには入らない。モーションの値と `<takibi-fire>` の素材は、ここで測って書き出す
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
| 面 | `bg-surface`（ページ）、`bg-surface-raised`（カード）、`bg-surface-overlay`（ポップオーバー・メニュー・ダイアログ）、`bg-surface-sunken`（入力欄・コード）、`bg-surface-hover`（ホバー。半透明なので、どの面の上でも使える）、`bg-backdrop`（ダイアログの後ろを暗くする面。昼も暗いまま） |
| 文字 | `text-fg`、`text-fg-strong`、`text-fg-muted`、`text-fg-subtle`（プレースホルダー・無効だけ）、`text-fg-on-brand`、`text-fg-on-danger` |
| 線 | `border-line`、`border-line-subtle`、`border-line-strong`（入力欄など操作できる要素の枠） |
| ブランド | `bg-brand` / `text-brand`、`-hover`、`-active`、`bg-brand-soft`（選択中の面）、`outline-focus` |
| 状態 | `text-success` / `bg-success-soft`、`warning`、`danger`、`info`、`bg-danger-solid`（取り消せない操作のボタン） |
| 角丸 | `rounded-sm`（4px）、`rounded-md`（6px、標準）、`rounded-lg`（10px、カード）、`rounded-xl`（16px、ダイアログ）、`rounded-full`（円形だけ。ボタンには使わない） |
| 影 | `shadow-rim`、`shadow-card`、`shadow-pop`（重なる面）、`shadow-glow` / `-soft` / `-strong` |
| 温度 | `heat-core`、`heat-flame`、`heat-ember`、`heat-coal`、`heat-ash`（熱い順）。光、火の粉、炎だけに使い、文字、面、枠線には使わない |
| 文字の大きさ | `text-xs`（12px、装飾ラベルだけ）、`text-sm`（14px、UI の最小）、`text-base`（16px、本文）〜 `text-6xl` |

面、文字、線は空の色（夜は `--ink-*`、昼は `--day-*`）で、時刻と天気で色相と彩度が動く。ブランドと温度は焚き火の色（`--ember-*`、`--heat-*`）で、時刻と天気では変わらない。

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
| hover で光る要素の、光が消える速さ（余熱） | `motion-afterglow`（光は 120ms で出て、560ms かけて消える。Button は持っている） |
| 大きな押せる面の上で、ポインターの位置に乗る光 | `motion-warmth` と `src/lib/warmth.ts` の `trackWarmth`（`onPointerMove` に渡す） |
| 炎や光の飾りの、止まらない揺れ | `motion-flicker`（操作する部品には付けない） |
| ツールチップ、ポップオーバー、メニュー、セレクトの中身 | `motion-rise` |
| ダイアログ本体とバックドロップ | `motion-dialog`、`motion-backdrop` |
| アコーディオンや折りたたみの中身 | `motion-fold` |
| 新しく追加された要素 | `motion-settle` |
| トースト | `motion-toast` |
| エラー文など、動かさずに薄く出す小さなもの | `motion-fade` |
| タブの中身 | `motion-scene` |
| 選択インジケーター（タブの下線など） | `motion-tongue`（炎の舌） |
| Command パレット | `motion-ignite`（着火） |
| 完了の瞬間 | `Sparks` コンポーネント（はぜる。中で `motion-flare` と `motion-spark` を使う） |
| 読み込み中の面 | `motion-ember-pulse` |
| 進んでいる間だけ光る先端（導火線） | `motion-fuse`（祖先に `data-advancing`）と、本体に `shadow-ember` |
| Motion で消える要素（10px 上がりながら 1.03 倍に広がってぼける） | `src/lib/motion.ts` の `smoke`（`exit` に渡す） |

- 光と火の粉の色は、温度の色を熱い順（core → flame → ember → coal → ash）にたどる。`rgb(244 125 58 / …)` のように色を直に書かない。昼の色が合わなくなる
- 続く動き（`motion-flicker`、`<takibi-fire>`、`<takibi-embers>`）は、見出しや空の状態など演出の場所だけに置く。炎と火の粉の背景は合わせて 1 画面に 1 つまで。周期をそろえた無限ループは作らず、`--duration-flicker-a / b / c` を重ねる
- 開く動きは、焚き火から取った 4 つの曲線（`ease-pop / land / ignite / sway` と、同じ名前の `--duration-*`）で、閉じる動きは `ease-out-expo` で 150〜200ms にする

  | 名前 | トークン | 進み方 | 使う所 |
  |---|---|---|---|
  | はぜる | `ease-pop`（360ms） | 行き過ぎずに止まる | ツールチップ、ポップオーバー、メニュー、アイコンの入れ替え、小さな飾り |
  | 載る | `ease-land`（240ms） | 全体の 51% で届き、12% 跳ね返ってから止まる | 押下から戻る動き、hover の拡大、ハンドル。動く幅が小さい拡大縮小だけに使い、回転や位置には使わない |
  | 着火 | `ease-ignite`（500ms） | 出だしが遅く、動く幅の 8% だけ行き過ぎてから戻る | ダイアログ、Command、Drawer、トースト、文字の送り |
  | 揺れる | `ease-sway`（330ms） | 行き過ぎずに止まる | 選択インジケーター、位置や幅の移動、回転、高さの開閉 |

- 光が消える動きは `ease-cool` と `--duration-cool`（冷える。560ms。最初に大きく落ちる）、Motion で消える要素の位置と大きさは `ease-rise`（昇る。出だしが遅く、あとで速くなる）にする
- Motion では `src/lib/motion.ts` の `springs`（`pop / land / ignite / sway`）、`cool`、`amplitude` を使い、数値を直に書かない
- 値の出どころ（焚き火の計算モデルで測った値）は、`tokens.css` の `--ease-*` / `--duration-*` のコメントと `content/basics/motion.md` の「値の出どころ」にある。値を変えるときは両方を直す
- ポップオーバーやメニューが付いて出る要素（トリガー）は、大きさを変えない。ポップアップが一緒に揺れる。Button は `aria-haspopup` か `aria-expanded` を受け取ると、自分で拡大縮小をやめる
- サブメニューは必ず `menu.tsx` の `MenuSub` で組む。Base UI の `SubmenuRoot` を直に使うと、斜めに向かう途中で減速しただけで閉じる（`src/lib/menu-aim.ts` が補っている）
- 高さが変わるもの（アコーディオン、折りたたみ）だけは、開くときと同じ揺れる曲線で閉じる。形まで変えると、閉じるときだけ唐突に見える
- 振れ幅は `--press-scale`（0.97）、`--hover-scale`（1.02）などのトークンから選ぶ
- 動きを減らす設定では、位置と大きさの動きを消し、色と影だけを残す
- 夜と昼の切り替えは `setTheme()`（`src/lib/theme.ts`）を使う。`data-theme` を直に書き換えると、コンポーネントごとに色の変わる時刻がずれる
- 中央寄せに `translate` を使うコンポーネントがあるので、`motion-*` で `translate` プロパティを動かすときは、そのコンポーネントに当てないか確かめる

## 説明の書き方

コードのコメント、JSDoc、ストーリーの説明、コンポーネントページ（`parameters.takibi`）、ガイドラインは、見たままを普通の日本語で書く。世界観は見た目と動きで出し、説明の文では出さない。

- 動きは「何が、どこから、どれだけ、どれくらいの時間で」で書く。「霧が晴れるように」「そっと寄り添って」「熾火の色がゆっくり走る」のような比喩で説明しない
- 色は役割の名前で書く（ブランドカラー、danger の色）。「火の色」「炎の色」「温まる」「冷める」「灯る」で済ませない
- 署名になる動きの名前（着火、残り火、炎の舌、熾火の目盛り、導火線、火の粉の伝播、はぜる、煙、余熱、手元の光、ゆらぎ、夜明けと日暮れ）は、名前として使ってよい。初めて出す所では、具体的な動きを添える
- 曲線の名前（はぜる曲線、載る曲線、着火の曲線、揺れる曲線、冷える、昇る）も、名前として使ってよい。「ばね」「スプリング」とは呼ばない（Motion の `type: "spring"` を説明する所は除く）。「はぜる」「着火」は署名になる動きの名前でもあるので、曲線を指すときは「はぜる曲線」「着火の曲線」と書く
- 「〜を作る」「〜を保つ」のように抽象的な目的で終わらせず、利用者に何が起きるかを書く
- ストーリー名は日本語にする（`name: "アイコン付き"`）
- 用語は、日本語圏のデザインシステム（SmartHR、デジタル庁、Sansan One）や Base UI で使われている一般的な語にする。独自の言い換えを作らない（タグ、ハンドル、ポップアップ、バックドロップ、インジケーター、スクリーンリーダー、アクセシブルネーム）

| 使わない | 使う |
|---|---|
| 開くと霧が晴れるように浮かぶ | 開くと、ぼけた状態から 12px 上がりながら現れる |
| 熾火の色がゆっくり走る | ブランドカラーを薄く混ぜた 2 本の帯が、2.9 秒と 4.7 秒の周期で逆向きに流れる |
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
