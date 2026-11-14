import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Eyebrow, Heading } from "./heading";

const meta = {
	title: "コンポーネント/基本/Heading",
	component: Heading,
	parameters: {
		takibi: {
			use: ["ページや節の見出し", "見出しの上に、章の名前や分類を小さく添える（Eyebrow）"],
			avoid: [{ case: "見出しではない文字を大きく見せる", instead: "基本/Text" }],
			dos: [
				"level はページの構造どおりに h1 から順に付ける。見た目だけを変えたいときは size を渡す",
				"h1 は 1 ページに 1 つにする",
			],
			donts: ["大きさを揃えるために level を飛ばさない", "5xl と 6xl を、ページの冒頭以外で使わない"],
			copy: {
				rules: ["見出しは体言止めか、短い言い切りにする。句点を付けない"],
				examples: [
					{
						good: "11 月の焚き火",
						bad: "11 月の焚き火の記録についてのページです。",
						note: "短く、句点を付けない",
					},
				],
			},
			a11y: [
				"level が見出しの階層として読み上げられる。size を変えても階層は変わらない",
				"見出しをたどって移動する人のために、階層を飛ばさない",
			],
			related: ["基本/Text", "基本/Stack"],
		} satisfies ComponentDocs,
	},
	args: { children: "火を囲む夜の記録" },
	argTypes: {
		level: { control: "inline-radio", options: [1, 2, 3, 4, 5, 6] },
		size: {
			control: "select",
			options: [undefined, "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
		},
	},
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 既定の h2 で、大きさは 3xl（30px） */
export const Basic: Story = {
	name: "基本",
	args: { level: 2 },
};

/** 階層ごとの既定の大きさ。h1 は 48px、h6 は本文と同じ 16px */
export const Levels: Story = {
	name: "階層",
	parameters: { section: "種類" },
	render: () => (
		<div className="flex flex-col gap-4">
			{([1, 2, 3, 4, 5, 6] as const).map((level) => (
				<div key={level} className="flex items-baseline gap-4">
					<span className="w-8 shrink-0 font-mono text-sm text-fg-subtle">h{level}</span>
					<Heading level={level}>火を囲む夜の記録</Heading>
				</div>
			))}
		</div>
	),
};

/** 大きさの目盛り。5xl から上は太くし、3xl から上は字間を詰める */
export const Sizes: Story = {
	name: "サイズ",
	render: () => (
		<div className="flex flex-col gap-3">
			{(["6xl", "5xl", "4xl", "3xl", "2xl", "xl", "lg", "base", "sm"] as const).map((size) => (
				<div key={size} className="flex items-baseline gap-4">
					<span className="w-10 shrink-0 font-mono text-sm text-fg-subtle">{size}</span>
					<Heading level={3} size={size}>
						焚き火
					</Heading>
				</div>
			))}
		</div>
	),
};

/** 階層は h2 のまま、見た目を xl に小さくする。上に Eyebrow を添える */
export const LevelAndSize: Story = {
	name: "階層と大きさを分ける",
	render: () => (
		<div className="flex max-w-prose flex-col gap-2">
			<Eyebrow>記録</Eyebrow>
			<Heading level={2} size="xl">
				11 月の焚き火
			</Heading>
			<p className="text-base text-fg-muted">
				見た目は xl でも、スクリーンリーダーでは 2 番目の階層の見出しとして伝わる。
			</p>
		</div>
	),
	play: async ({ canvas }) => {
		const heading = canvas.getByRole("heading", { name: "11 月の焚き火" });
		await expect(heading.tagName).toBe("H2");
	},
};
