# Takibi Design System

焚き火を愛するエンジニアのプロダクトと発信を、1 つの言葉と見た目でそろえるためのデザインシステムです。振る舞いは [Base UI](https://base-ui.com)、見た目は Tailwind CSS v4 で組んでいます。

## 中身

| 場所 | 中身 |
|---|---|
| `packages/takibi/` | npm のパッケージ `takibi-design-system`。トークン、動き、React のコンポーネント |
| `content/` | ブランドの定義とガイドライン |
| `apps/workbench/` | Storybook。コンポーネントを作って試す作業台 |

## 開発

```sh
bun install
bun run workbench   # http://localhost:6006
```

| コマンド | 内容 |
|---|---|
| `bun run workbench` | 作業台を開く |
| `bun run typecheck` | 型を検査する |
| `bun run lint` | Biome で検査する |
| `bun run build:tokens` | `dist/tokens.css` と `dist/tokens.json` を生成する |
| `bun run build:workbench` | 作業台を静的に書き出す |

書き方の約束は `CLAUDE.md` にあります。

## ライセンス

MIT
