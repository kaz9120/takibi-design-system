import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentDocs } from "../spec";
import { Quote, Text } from "./text";

const meta = {
	title: "コンポーネント/基本/Text",
	component: Text,
	parameters: {
		takibi: {
			use: ["本文や補足の文字", "人の言葉や、ほかの文章の引用（Quote）"],
			avoid: [{ case: "ページや節の見出し", instead: "基本/Heading" }],
			dos: [
				"本文は base（16px）にする。UI の中の最小は sm（14px）",
				'補足は tone="muted" にし、大きさは変えない',
				"文の一部だけを強めるときは render={<strong />} で描く",
			],
			donts: [
				"xs（12px）を本文に使わない。時刻や飾りのラベルだけにする",
				"subtle を本文に使わない。明るさの比が 4.5:1 に届かない",
			],
			a11y: [
				"読ませる文字には subtle を使わない。背景との明るさの比が 4.5:1 に届かない",
				"強調は見た目だけでなく、strong や em で意味も付ける",
				"Quote の出典は figcaption として本文に結び付く",
			],
			related: ["基本/Heading", "基本/Stack"],
		} satisfies ComponentDocs,
	},
	args: { children: "乾いた薪は、割った面が白く軽い。叩くと高い音がする。" },
	argTypes: {
		size: { control: "inline-radio", options: ["xs", "sm", "base", "lg", "xl"] },
		tone: { control: "inline-radio", options: ["default", "strong", "muted", "subtle"] },
		weight: { control: "inline-radio", options: ["regular", "medium", "semibold"] },
	},
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 既定は base（16px）、default の色、標準の太さの段落 */
export const Basic: Story = {
	name: "基本",
	render: (args) => <Text className="max-w-prose" {...args} />,
};

/** 大きさの目盛り。本文は base（16px）、UI の最小は sm（14px）。xs は時刻などの飾りだけ */
export const Sizes: Story = {
	name: "サイズ",
	render: () => (
		<div className="flex max-w-prose flex-col gap-3">
			{(["xl", "lg", "base", "sm", "xs"] as const).map((size) => (
				<div key={size} className="flex items-baseline gap-4">
					<span className="w-10 shrink-0 font-mono text-sm text-fg-subtle">{size}</span>
					<Text size={size}>乾いた薪は、割った面が白く軽い。</Text>
				</div>
			))}
		</div>
	),
};

/** 色の強さ。subtle はプレースホルダーと無効だけに使う */
export const Tones: Story = {
	name: "色の強さ",
	parameters: { section: "種類" },
	render: () => (
		<div className="flex max-w-prose flex-col gap-2">
			{(["strong", "default", "muted", "subtle"] as const).map((tone) => (
				<Text key={tone} tone={tone}>
					{tone}: 乾いた薪は、割った面が白く軽い。
				</Text>
			))}
		</div>
	),
};

/** 文の一部を強めるときは、strong で描いて太さと色を変える */
export const Inline: Story = {
	name: "文の一部を強める",
	render: () => (
		<Text className="max-w-prose">
			焚き付けに火が回ったら、
			<Text render={<strong />} weight="semibold" tone="strong">
				親指ほどの太さ
			</Text>
			の薪を足す。
		</Text>
	),
};

/** 引用。左に線を引かず、薄い色の大きな引用符で始まりを示し、出典を下に添える */
export const QuoteBlock: Story = {
	name: "引用（Quote）",
	render: () => (
		<Quote className="max-w-prose" cite="山本 一正『焚き火の記録』" source="https://takibi.example/notes">
			火は急かすと消える。待てば、向こうから大きくなる。
		</Quote>
	),
};
