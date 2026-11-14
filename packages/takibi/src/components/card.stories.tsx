import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentDocs } from "../spec";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";

const meta = {
	title: "コンポーネント/データ表示/Card",
	component: Card,
	parameters: {
		takibi: {
			use: [
				"1 件の記録や予定など、ひとまとまりの情報を囲んで見せる",
				"ダッシュボードで、数値やグラフを 1 つずつ区切って並べる",
			],
			avoid: [
				{ case: "カード全体を押して別の画面へ移る", instead: "アクション/InteractiveCard" },
				{ case: "同じ形の行を何件も並べる", instead: "データ表示/List" },
				{ case: "区切りを入れたいだけ", instead: "データ表示/Separator" },
			],
			dos: [
				"操作は CardFooter に寄せる",
				"CardTitle は h3 なので、ページの見出しの階層に合わないときは別の要素に変える",
			],
			donts: ["カードの中にカードを入れない", "CardFooter に primary のボタンを 2 つ以上置かない"],
			a11y: ["CardTitle は h3 として読み上げられ、見出しの一覧からたどれる"],
			related: ["アクション/InteractiveCard", "データ表示/List", "データ表示/DescriptionList"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 見出し、本文、操作をそろえた形 */
export const Basic: Story = {
	name: "基本",
	render: () => (
		<Card className="max-w-sm">
			<CardHeader>
				<CardTitle>週末のキャンプ</CardTitle>
				<CardDescription>11 月 15 日 〜 16 日・道志村</CardDescription>
			</CardHeader>
			<CardContent>
				<p>薪は広葉樹を 2 束。夜は 3℃ まで下がる予報なので、寝袋は冬用にする。</p>
			</CardContent>
			<CardFooter className="justify-end">
				<Button variant="ghost" size="sm">
					あとで
				</Button>
				<Button size="sm">準備を始める</Button>
			</CardFooter>
		</Card>
	),
};

/** コンポーネントの組み合わせ。見出しだけ、本文だけでも使える */
export const Compositions: Story = {
	name: "組み合わせ",
	render: () => (
		<div className="grid max-w-3xl gap-4 sm:grid-cols-3">
			<Card>
				<CardHeader>
					<CardTitle>見出しだけ</CardTitle>
					<CardDescription>説明を添える</CardDescription>
				</CardHeader>
			</Card>
			<Card>
				<CardContent>本文だけ。数値やグラフを入れる。</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-2">
						<CardTitle>記録</CardTitle>
						<Badge variant="success">公開中</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<p className="text-3xl font-semibold text-fg-strong">48</p>
				</CardContent>
			</Card>
		</div>
	),
};
