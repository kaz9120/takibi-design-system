import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentDocs } from "../spec";
import { Separator } from "./separator";

const meta = {
	title: "コンポーネント/データ表示/Separator",
	component: Separator,
	parameters: {
		takibi: {
			use: ["余白だけでは分かれて見えない、内容のまとまりの間に線を引く", "並んだリンクやツールバーの区切り"],
			avoid: [
				{ case: "余白だけで分けられる", instead: "基本/Stack" },
				{ case: "まとまりを面で囲みたい", instead: "データ表示/Card" },
			],
			dos: ['縦にするときは orientation="vertical" を渡し、親を flex にする'],
			donts: ["線を何本も重ねて区切らない。余白を広げる", "見出しの代わりに線で区切らない"],
			a11y: ['role="separator" が付き、区切りとして読み上げられる'],
			related: ["基本/Stack", "データ表示/Card"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 横の線。段落やまとまりの間に引く */
export const Horizontal: Story = {
	name: "横の線",
	render: () => (
		<div className="flex max-w-sm flex-col gap-3 text-sm">
			<div>
				<p className="font-medium text-fg-strong">takibi</p>
				<p className="text-fg-muted">焚き火を愛するエンジニアの視覚言語</p>
			</div>
			<Separator />
			<p className="text-fg-muted">トークン、動き、コンポーネント</p>
		</div>
	),
};

/** 縦の線。並んだリンクやツールバーの区切りに使う。親を flex にする */
export const Vertical: Story = {
	name: "縦の線",
	render: () => (
		<div className="flex h-5 items-center gap-3 text-sm text-fg-muted">
			<span>記録</span>
			<Separator orientation="vertical" />
			<span>設定</span>
			<Separator orientation="vertical" />
			<span>ヘルプ</span>
		</div>
	),
};
