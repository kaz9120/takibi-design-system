import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImagePlus, Inbox, SearchX } from "lucide-react";
import * as React from "react";
import { expect } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { Card } from "./card";
import {
	EmptyState,
	EmptyStateActions,
	EmptyStateDescription,
	EmptyStateIcon,
	EmptyStateTitle,
} from "./empty-state";

const meta = {
	title: "コンポーネント/フィードバック/EmptyState",
	component: EmptyState,
	parameters: {
		takibi: {
			use: ["一覧やページに、表示するものがまだないとき", "検索や絞り込みの結果が 0 件のとき"],
			avoid: [
				{ case: "読み込みが終わっていない", instead: "データ表示/Skeleton" },
				{ case: "読み込みに失敗した", instead: "フィードバック/Alert" },
			],
			dos: [
				"次にできることを 1 つだけボタンにする。補助の操作は ghost のボタンかリンクにする",
				"ページ全体なら full、カードや一覧の中なら compact にする",
				"アイコンは空の理由に合うものを選ぶ（検索なら SearchX）",
			],
			donts: [
				"読み込み中に出さない。読み込みが終わって 0 件だと分かってから出す",
				"アイコンを繰り返し動かさない",
			],
			copy: {
				rules: [
					"タイトルで、何がないかを書く。句点を付けない",
					"説明で、次にできることを書く",
					"検索の結果が空なら、条件の変え方を書く",
				],
				examples: [
					{ good: "まだ画像がありません", bad: "データが存在しません", note: "機械の言葉にしない" },
					{
						good: "言葉を短くするか、絞り込みを外してください",
						bad: "該当する結果が見つかりませんでした",
						note: "次にできることが分かる",
					},
				],
			},
			a11y: [
				"タイトルは h3 で、見出しとしてたどれる",
				"アイコンは飾りとしてスクリーンリーダーから隠す（aria-hidden）",
			],
			motion: [
				"アイコンは表示した瞬間に 1 回だけ、8px 下から 0.92 倍の大きさで、ぼけた状態から現れる（springs.soft のばね）",
				"そのあとは動かない。動きを減らす設定では、最初から止まった状態で出す",
			],
			related: ["データ表示/Skeleton", "フィードバック/Alert", "アクション/Button"],
		} satisfies ComponentDocs,
	},
	argTypes: {
		variant: { control: "inline-radio", options: ["full", "compact"] },
	},
	render: (args) => (
		<EmptyState {...args}>
			<EmptyStateIcon>
				<ImagePlus />
			</EmptyStateIcon>
			<EmptyStateTitle>まだ画像がありません</EmptyStateTitle>
			<EmptyStateDescription>
				スクリーンショットをドロップするか、ファイルを選んで始めます
			</EmptyStateDescription>
			<EmptyStateActions>
				<Button>画像を選ぶ</Button>
				<Button variant="ghost">使い方を見る</Button>
			</EmptyStateActions>
		</EmptyState>
	),
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ページ全体が空のとき。アイコンが 1 回だけ下から上がって現れ、そのあとは動かない */
export const Full: Story = { name: "ページ全体（full）" };

/** カードや一覧の中が空のとき。余白とアイコンを小さくする */
export const Compact: Story = {
	name: "狭い場所（compact）",
	render: () => (
		<Card className="w-96 py-0">
			<EmptyState variant="compact">
				<EmptyStateIcon>
					<Inbox />
				</EmptyStateIcon>
				<EmptyStateTitle>通知はありません</EmptyStateTitle>
				<EmptyStateDescription>新しいコメントが届くと、ここに出ます</EmptyStateDescription>
			</EmptyState>
		</Card>
	),
};

/** 検索や絞り込みの結果が空のとき。条件を外す行動を示す */
export const NoResults: Story = {
	name: "検索の結果が 0 件",
	render: () => (
		<EmptyState>
			<EmptyStateIcon>
				<SearchX />
			</EmptyStateIcon>
			<EmptyStateTitle>「焚き火台」に合うノートはありません</EmptyStateTitle>
			<EmptyStateDescription>言葉を短くするか、絞り込みを外してください</EmptyStateDescription>
			<EmptyStateActions>
				<Button variant="secondary">絞り込みを外す</Button>
			</EmptyStateActions>
		</EmptyState>
	),
};

function ReplayDemo() {
	const [key, setKey] = React.useState(0);
	return (
		<div className="flex flex-col items-center gap-4">
			<Card key={key} className="w-96 py-0">
				<EmptyState variant="compact">
					<EmptyStateIcon>
						<ImagePlus />
					</EmptyStateIcon>
					<EmptyStateTitle>まだ画像がありません</EmptyStateTitle>
				</EmptyState>
			</Card>
			<Button variant="ghost" size="sm" onClick={() => setKey((k) => k + 1)}>
				もう一度表示する
			</Button>
		</div>
	);
}

/** 現れる動きをもう一度見る。動くのは表示した瞬間の 1 回だけ */
export const Appear: Story = {
	name: "現れる動き",
	render: () => <ReplayDemo />,
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("heading", { name: "まだ画像がありません" })).toBeVisible();
	},
};
