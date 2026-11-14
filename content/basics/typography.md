---
title: タイポグラフィ
description: 書体の組み合わせと、文字の大きさ・行間・字間
order: 2
---

和文は LINE Seed JP、欧文は Inter、コードは JetBrains Mono を使います。Inter を先頭に LINE Seed JP へつなぐ 1 本の `font-sans` で、和欧混植の見た目をそろえます。

## 使い方

- UI の最小は `text-sm`（14px）。`text-xs`（12px）は装飾のラベルとタイムスタンプだけに使う
- 本文は `text-base`（16px）、行間 1.7。1 行は 68ch（和文でおよそ 32 字）まで
- 見出しは `font-semibold`（600）か `font-bold`（700）にする
- 大文字と記号の小見出し（アイブロウ）は、等幅・字間 0.18em（`tracking-mark`）で添える

## やらないこと

- 太く重いディスプレイ書体を見出しに使わない
