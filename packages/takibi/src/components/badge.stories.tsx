import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleCheck, Sparkles } from "lucide-react";
import type { ComponentDocs } from "../spec";
import { Badge } from "./badge";

const meta = {
	title: "コンポーネント/データ表示/Badge",
	component: Badge,
	args: { children: "下書き" },
	argTypes: {
		variant: {
			control: "inline-radio",
			options: ["neutral", "brand", "success", "warning", "danger", "info"],
		},
	},
	parameters: {
		takibi: {
			use: ["記録や項目に、状態（公開中、失敗）や分類（ベータ）を短い語で添える"],
			avoid: [
				{ case: "押せるもの", instead: "アクション/Button" },
				{ case: "利用者が付けたり外したりするラベル", instead: "フォーム/Tag" },
				{ case: "文で説明が要る知らせ", instead: "フィードバック/Callout" },
			],
			dos: [
				"状態の色は、意味の合う variant を選ぶ（失敗は danger）",
				"色に意味を持たせない分類は neutral にする",
			],
			donts: [
				"アイコンだけのバッジを作らない",
				"1 つの項目に何個も並べない",
				"brand を状態の表示に使わない。目を留めてほしいものだけにする",
			],
			copy: {
				rules: ["名詞か、短い状態の語にする（公開中、下書き）", "1〜5 文字ほどに収める"],
				examples: [
					{ good: "公開中", bad: "公開されています", note: "文にしない" },
					{ good: "新しい", bad: "NEW!", note: "感嘆符を付けない" },
				],
			},
			a11y: ["色だけで状態を伝えない。必ず語を入れる", "アイコンは飾りとして扱い、意味は語で伝える"],
			related: ["フォーム/Tag", "データ表示/Kbd", "データ表示/Avatar"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 標準の neutral。色に意味を持たせない */
export const Basic: Story = { name: "基本" };

/** 色の種類。面は薄く、文字だけを状態の色にする */
export const Variants: Story = {
	name: "種類",
	render: () => (
		<div className="flex flex-wrap items-center gap-2">
			<Badge variant="neutral">下書き</Badge>
			<Badge variant="brand">新しい</Badge>
			<Badge variant="success">公開中</Badge>
			<Badge variant="warning">期限が近い</Badge>
			<Badge variant="danger">失敗</Badge>
			<Badge variant="info">ベータ</Badge>
		</div>
	),
};

/** アイコンを添える。アイコンだけのバッジは作らない */
export const WithIcon: Story = {
	name: "アイコン付き",
	render: () => (
		<div className="flex flex-wrap items-center gap-2">
			<Badge variant="brand">
				<Sparkles />
				新しい
			</Badge>
			<Badge variant="success">
				<CircleCheck />
				確認済み
			</Badge>
		</div>
	),
};
