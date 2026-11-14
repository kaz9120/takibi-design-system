import type { Meta, StoryObj } from "@storybook/react-vite";
import { Flame } from "lucide-react";
import type { ComponentDocs } from "../spec";
import { Callout, CalloutDescription, CalloutTitle } from "./callout";

const meta = {
	title: "コンポーネント/フィードバック/Callout",
	component: Callout,
	parameters: {
		takibi: {
			use: [
				"ガイドや説明の本文に、補足、こつ、注意を添える",
				"読み飛ばされると困ることを、本文から分けて目に留める",
			],
			avoid: [
				{ case: "操作の結果や、画面の状態を知らせる", instead: "フィードバック/Alert" },
				{ case: "サービス全体に関わる知らせ", instead: "フィードバック/Banner" },
			],
			dos: [
				"variant は内容で選ぶ。データが消える、取り消せないことだけを danger にする",
				"1 つの Callout には 1 つのことだけを書く",
			],
			donts: ["続けて何個も並べない。目立たせるものがなくなる", "本文で書けば済むことを Callout に入れない"],
			copy: {
				rules: [
					"タイトルは短い名詞句か、言い切りにする。句点を付けない",
					"本文は、何をすればよいかを文で書く。2 文以上なら句点を付ける",
				],
				examples: [
					{ good: "薪は細いものから", bad: "ポイント！", note: "タイトルだけで中身が分かる" },
					{
						good: "消したあとも灰の中は熱い。水をかけて、手で触れられるまで冷ます。",
						bad: "火の後始末に注意しましょう",
						note: "何をすればよいかを書く",
					},
				],
			},
			a11y: [
				"aside として置かれ、種類の名前（補足・こつ・注意・危険）が名前として読まれる。aria-label で変えられる",
				"アイコンは飾りとしてスクリーンリーダーから隠す。種類は名前とタイトルで伝わる",
			],
			related: ["フィードバック/Alert", "フィードバック/Banner"],
		} satisfies ComponentDocs,
	},
	argTypes: {
		variant: { control: "inline-radio", options: ["note", "tip", "warning", "danger"] },
	},
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** タイトルと本文を並べた、いちばん基本の形 */
export const Basic: Story = {
	name: "基本",
	args: { variant: "tip" },
	render: (args) => (
		<Callout className="max-w-prose" {...args}>
			<CalloutTitle>薪は細いものから</CalloutTitle>
			<CalloutDescription>
				焚き付けに火が回ってから、親指ほどの太さの薪を足す。いきなり太い薪を載せると火が消える。
			</CalloutDescription>
		</Callout>
	),
};

/** 種類ごとの色とアイコン。面全体を薄い色にし、アイコンを角丸の小さな四角に載せる */
export const Variants: Story = {
	name: "種類",
	render: () => (
		<div className="flex max-w-prose flex-col gap-3">
			<Callout variant="note">
				<CalloutTitle>補足</CalloutTitle>
				<CalloutDescription>
					<code>side</code> を省くと右から出る
				</CalloutDescription>
			</Callout>
			<Callout variant="tip">
				<CalloutTitle>こつ</CalloutTitle>
				<CalloutDescription>湿った薪は割ると、乾いた芯から燃える</CalloutDescription>
			</Callout>
			<Callout variant="warning">
				<CalloutTitle>注意</CalloutTitle>
				<CalloutDescription>直火が禁じられた場所では、焚き火台を使う</CalloutDescription>
			</Callout>
			<Callout variant="danger">
				<CalloutTitle>危険</CalloutTitle>
				<CalloutDescription>
					消したあとも灰の中は熱い。水をかけて、手で触れられるまで冷ます。
				</CalloutDescription>
			</Callout>
		</div>
	),
};

/** 本文だけの形、段落が複数の形、アイコンを差し替えた形 */
export const Compositions: Story = {
	name: "組み合わせ",
	render: () => (
		<div className="flex max-w-prose flex-col gap-3">
			<Callout variant="note">
				<CalloutDescription>タイトルを省いて、本文だけでも使える</CalloutDescription>
			</Callout>
			<Callout variant="tip">
				<CalloutTitle>段落が複数</CalloutTitle>
				<CalloutDescription>
					<p>段落の間は 8px 空ける。</p>
					<p>
						長くなるなら本文に書き、<a href="#guide">ガイド</a>へのリンクを置く。
					</p>
				</CalloutDescription>
			</Callout>
			<Callout variant="note" icon={<Flame />}>
				<CalloutTitle>アイコンを差し替える</CalloutTitle>
				<CalloutDescription>icon にほかの lucide のアイコンを渡す</CalloutDescription>
			</Callout>
		</div>
	),
};
