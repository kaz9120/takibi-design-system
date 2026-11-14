import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flame } from "lucide-react";
import type { ComponentDocs } from "../spec";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";

const meta = {
	title: "コンポーネント/フィードバック/Alert",
	component: Alert,
	parameters: {
		takibi: {
			use: [
				"画面の一部について、読み終わるまで出しておきたい知らせ",
				"フォームの上に、送れなかった理由をまとめて出す",
			],
			avoid: [
				{ case: "操作の結果を短く知らせて、自然に消したい", instead: "フィードバック/Toast" },
				{ case: "サービス全体に関わる知らせ", instead: "フィードバック/Banner" },
				{ case: "文書の本文に補足やこつを添える", instead: "フィードバック/Callout" },
			],
			dos: [
				"variant は内容の重さで選ぶ。失敗と直さないと進めないことだけを danger にする",
				"直す操作があるなら、知らせの中にボタンを置く",
			],
			donts: [
				"1 つの画面に何枚も並べない。いちばん大事な 1 つに絞る",
				"色だけで種類を伝えない。アイコンとタイトルを必ず添える",
			],
			copy: {
				rules: [
					"タイトルで何が起きたかを言い切る。1 文なら句点を付けない",
					"本文には、次に何をすればよいかを書く",
					"エラーは責める言い方にしない",
				],
				examples: [
					{ good: "保存できませんでした", bad: "エラーが発生しました", note: "何が起きたかが分かる" },
					{
						good: "通信が切れています。つながったら、もう一度保存してください。",
						bad: "ネットワークエラー",
						note: "どうすればよいかまで書く",
					},
				],
			},
			a11y: [
				'danger と warning は role="alert" で、出たときに読み上げが割り込む',
				'neutral、success、info は role="status" で、今の読み上げが終わってから読まれる',
				"アイコンは飾りとしてスクリーンリーダーから隠す（aria-hidden）",
			],
			related: ["フィードバック/Toast", "フィードバック/Banner", "フィードバック/Callout"],
		} satisfies ComponentDocs,
	},
	argTypes: {
		variant: { control: "inline-radio", options: ["neutral", "success", "warning", "danger", "info"] },
	},
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/** タイトルと本文を並べた、いちばん基本の形 */
export const Basic: Story = {
	name: "基本",
	render: (args) => (
		<Alert className="max-w-lg" {...args}>
			<AlertTitle>下書きを保存しました</AlertTitle>
			<AlertDescription>公開するまで、ほかの人には見えません。</AlertDescription>
		</Alert>
	),
};

/** 種類ごとの色とアイコン。面は薄い色にし、アイコンだけを状態の色にする */
export const Variants: Story = {
	name: "種類",
	render: () => (
		<div className="flex max-w-lg flex-col gap-3">
			<Alert variant="neutral">
				<AlertTitle>お知らせ</AlertTitle>
				<AlertDescription>11 月 20 日の深夜に、30 分ほど止まります。</AlertDescription>
			</Alert>
			<Alert variant="success">
				<AlertTitle>公開しました</AlertTitle>
				<AlertDescription>URL を知っている人なら誰でも読めます。</AlertDescription>
			</Alert>
			<Alert variant="warning">
				<AlertTitle>容量が残り 10% です</AlertTitle>
				<AlertDescription>古い記録を書き出すと空きが増えます。</AlertDescription>
			</Alert>
			<Alert variant="danger">
				<AlertTitle>保存できませんでした</AlertTitle>
				<AlertDescription>通信が切れています。つながったら、もう一度保存してください。</AlertDescription>
			</Alert>
			<Alert variant="info">
				<AlertTitle>ベータ版の機能です</AlertTitle>
				<AlertDescription>使い心地を教えてもらえると助かります。</AlertDescription>
			</Alert>
		</div>
	),
};

/** タイトルだけの形、操作を置いた形、アイコンを差し替えた形と出さない形 */
export const Compositions: Story = {
	name: "組み合わせ",
	render: () => (
		<div className="flex max-w-lg flex-col gap-3">
			<Alert variant="info">
				<AlertTitle>タイトルだけでも使える</AlertTitle>
			</Alert>
			<Alert variant="danger">
				<AlertTitle>支払いに失敗しました</AlertTitle>
				<AlertDescription>カードの有効期限を確かめてください。</AlertDescription>
				<div className="mt-2">
					<Button variant="secondary" size="sm">
						カードを変える
					</Button>
				</div>
			</Alert>
			<Alert icon={<Flame />}>
				<AlertTitle>アイコンを差し替える</AlertTitle>
				<AlertDescription>icon にほかの lucide のアイコンを渡す。</AlertDescription>
			</Alert>
			<Alert icon={null}>
				<AlertTitle>アイコンを出さない</AlertTitle>
				<AlertDescription>icon に null を渡す。</AlertDescription>
			</Alert>
		</div>
	),
};
