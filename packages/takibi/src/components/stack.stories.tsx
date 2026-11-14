import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentDocs } from "../spec";
import { Button } from "./button";
import { Stack } from "./stack";

const meta = {
	title: "コンポーネント/基本/Stack",
	component: Stack,
	parameters: {
		takibi: {
			use: [
				"子を縦か横に並べ、間を同じ幅で空ける",
				"見出しと操作を両端に置く、操作を右に寄せるなど、1 列の配置",
			],
			avoid: [{ case: "行と列の両方を揃える配置" }],
			dos: [
				"間は gap で空け、子に margin を付けない",
				"関係の近いものほど gap を小さくする",
				"リストやナビゲーションにするときは render で ul や nav にする",
			],
			donts: [
				"Stack を何重にも入れ子にして格子を組まない。CSS grid を使う",
				"目盛りにない間を className で足さない",
			],
			a11y: ["見た目の順と、DOM の順を揃える。flex の向きを逆にして並べ替えない"],
			related: ["基本/Heading", "基本/Text"],
		} satisfies ComponentDocs,
	},
	argTypes: {
		direction: { control: "inline-radio", options: ["vertical", "horizontal"] },
		gap: { control: "select", options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16] },
		align: { control: "inline-radio", options: [undefined, "start", "center", "end", "baseline", "stretch"] },
		justify: { control: "inline-radio", options: [undefined, "start", "center", "end", "between"] },
		wrap: { control: "boolean" },
	},
} satisfies Meta<typeof Stack>;

export default meta;
type Story = StoryObj<typeof meta>;

function Box({ label, className }: { label: string; className?: string }) {
	return (
		<div
			className={`flex items-center justify-center rounded-md border border-line-subtle bg-surface-raised px-4 py-3 text-sm text-fg-muted ${className ?? ""}`}
		>
			{label}
		</div>
	);
}

/** 縦に並べ、間を 16px（gap={4}）空ける */
export const Basic: Story = {
	name: "基本",
	args: { direction: "vertical", gap: 4 },
	render: (args) => (
		<Stack className="max-w-xs" {...args}>
			<Box label="薪" />
			<Box label="焚き付け" />
			<Box label="火口" />
		</Stack>
	),
};

/** 間の目盛り。1 目盛りが 4px で、0 から 64px まで選べる */
export const Gaps: Story = {
	name: "間の大きさ",
	parameters: { section: "サイズ" },
	render: () => (
		<Stack gap={6}>
			{([1, 2, 4, 6, 8, 12] as const).map((gap) => (
				<Stack key={gap} direction="horizontal" gap={4} align="center">
					<span className="w-16 shrink-0 font-mono text-sm text-fg-subtle">{`gap=${gap}`}</span>
					<Stack direction="horizontal" gap={gap}>
						<Box label="1" />
						<Box label="2" />
						<Box label="3" />
					</Stack>
				</Stack>
			))}
		</Stack>
	),
};

/** 見出しと操作は justify="between"、操作の列は justify="end"、高さの違う子は align で揃える */
export const AlignAndJustify: Story = {
	name: "揃えと配置",
	render: () => (
		<Stack gap={6} className="max-w-lg">
			<Stack direction="horizontal" justify="between" align="center">
				<span className="text-lg font-semibold text-fg-strong">11 月の記録</span>
				<Button size="sm">記録する</Button>
			</Stack>
			<Stack direction="horizontal" justify="end" gap={2}>
				<Button variant="ghost">やめる</Button>
				<Button>保存する</Button>
			</Stack>
			<Stack direction="horizontal" align="end" gap={3}>
				<Box label="低い" />
				<Box label="高い" className="h-20" />
				<Box label="中くらい" className="h-14" />
			</Stack>
		</Stack>
	),
};

/** 折り返し。幅が足りないときは次の行へ回り、行の間も同じ gap で空く */
export const Wrap: Story = {
	name: "折り返し",
	render: () => (
		<Stack direction="horizontal" gap={2} wrap className="max-w-xs">
			{["奥多摩", "道志", "丹沢", "秩父", "富士見", "八ヶ岳", "房総"].map((p) => (
				<Box key={p} label={p} />
			))}
		</Stack>
	),
};
