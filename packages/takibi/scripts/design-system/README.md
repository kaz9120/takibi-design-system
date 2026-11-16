# Claude の Design System への同期

このリポジトリのトークン、コンポーネント、ガイドラインを、Claude の「Design System」（`published.json` の `url`）に送るための書き出しです。送った後は、Claude でスライドやデザインを作るときに Takibi の色・文字・部品が使われます。

流れはリポジトリから Claude への一方向です。Claude のページで直したファイルは、次に同じファイルを同期したときに上書きされます。

## 同期し直す

1. サイトを書き出す。コンポーネントのガイドラインは、サイトが書き出す Markdown を使う

   ```sh
   bun run build:site
   ```

2. Claude 用のファイルを `packages/takibi/build/design-system/` に書き出す

   ```sh
   bun run build:design-system
   ```

3. Claude Code に「`packages/takibi/build/design-system/` を `published.json` の Design System に公開して」と頼む

公開するときの決まりは次のとおりです。

- `root` は `packages/takibi/build/design-system`、`file_path` は `project/design-system.json`、`files` は `files.json` の残り
- `.d.ts` は `contentType: "text/plain"` を付ける
- `tokens.css` は書き出さない。Design System のページで誰かが保存したときに、ページが `tokens.json` から作る
- 1 回に送れるのは 255 ファイルまで。超えたら分け、`design-system.json` を最後の回に入れる
- ロゴを足したり差し替えたりしたら、アセットとしてアップロードし、返ってきた id を `published.json` の `assets` に書いてから書き出し直す

## 中身

| ファイル | 役割 |
|---|---|
| `build.mjs` | 書き出しの本体。トークンは `dist/tokens.json`、読み物は `content/`、ガイドラインはサイトの Markdown から作る |
| `vite.config.mjs`、`entry.tsx`、`entry.css` | `bundle.js`（`window.Takibi`）と `bundle.css`。プレビューのカードはストーリーをそのまま描く |
| `jsx-runtime.ts` | React をページの `window.React` から読むための置き換え |
| `cover.html` | Design System の表紙 |
| `published.json` | 同期先の URL と、アップロード済みのロゴの id |

React は 19 を `components/lib/` に同梱しています。Design System の既定は React 18 で、19 には UMD 版がないためです。
