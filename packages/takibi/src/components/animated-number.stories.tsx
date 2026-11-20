import type { Meta, StoryObj } from "@storybook/react-vite";
import { Minus, Plus } from "lucide-react";
import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { AnimatedNumber } from "./animated-number";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader } from "./card";

const meta = {
	title: "コンポーネント/データ表示/AnimatedNumber",
	component: AnimatedNumber,
	args: { value: 1280 },
	parameters: {
		takibi: {
			use: [
				"件数や統計など、値が変わったことに気付いてほしい数字",
				"操作の結果として増減する数（カートの個数、未読の数）",
			],
			avoid: [
				{ case: "日付、ID、電話番号など、増減しない数字" },
				{ case: "進み具合を割合で見せる", instead: "フィードバック/Progress" },
				{ case: "利用者が数字を入れて変える", instead: "フォーム/NumberField" },
			],
			dos: [
				"通貨や割合は format に Intl.NumberFormat の書式を渡して整える",
				"大きさと太さは周りの文字に合わせる。className で文字の大きさを渡す",
			],
			donts: [
				"1 画面で同時にたくさんの数字を転がさない。どれが変わったか分からなくなる",
				"毎秒のように変わり続ける数字に使わない",
			],
			a11y: [
				"スクリーンリーダーには、書式を整えた数字（1,280 など）を 1 つの文字列として渡す。転がる桁は読み上げない",
				"値が変わっても自動では読み上げない。知らせたいときは aria-live の領域を別に置く",
			],
			motion: [
				"熾火の目盛り: 変わった桁は縦に転がって新しい数字に止まる（springs.ignite、約 300ms）",
				"変わった桁は 120ms でブランドカラーになり、320ms 後に 900ms かけて元の色に戻る",
				"桁が増えると、新しい桁は上からぼけた状態で現れ、残りの桁は横へずれる",
				"動きを減らす設定では、転がさずに値を差し替える。色の変化は残る",
			],
			related: ["フォーム/NumberField", "フィードバック/Meter", "フィードバック/Progress"],
		} satisfies ComponentDocs,
	},
	render: (args) => (
		<AnimatedNumber {...args} className="text-4xl font-semibold tracking-tight text-fg-strong" />
	),
} satisfies Meta<typeof AnimatedNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 桁区切りの付いた数字。値を変えると、変わった桁だけが転がり、一瞬ブランドカラーになる */
export const Basic: Story = { name: "基本" };

function CounterDemo() {
	const [count, setCount] = React.useState(998);
	return (
		<div className="flex items-center gap-4">
			<Button variant="secondary" size="icon" aria-label="1 減らす" onClick={() => setCount((c) => c - 1)}>
				<Minus />
			</Button>
			<span className="min-w-28 text-center text-4xl font-semibold tracking-tight text-fg-strong">
				<AnimatedNumber value={count} />
			</span>
			<Button variant="secondary" size="icon" aria-label="1 増やす" onClick={() => setCount((c) => c + 1)}>
				<Plus />
			</Button>
		</div>
	);
}

/** 1 ずつ増減する件数。999 から 1,000 に上がると、左に桁と区切りが増え、残りの桁が横へずれる */
export const Counter: Story = { name: "カウンター", render: () => <CounterDemo /> };

const stats = [
	{ label: "今月の訪問", base: 12840, format: {} },
	{ label: "売上", base: 486000, format: { style: "currency", currency: "JPY" } as const },
	{ label: "完了率", base: 0.824, format: { style: "percent", maximumFractionDigits: 1 } as const },
];

function StatsDemo() {
	const [tick, setTick] = React.useState(0);
	const values = stats.map((s, i) => {
		if (tick === 0) return s.base;
		const seed = Math.sin(tick * 7.1 + i * 3.3);
		return s.format.style === "percent"
			? Math.min(1, s.base + seed * 0.05)
			: Math.round(s.base * (1 + seed * 0.08));
	});
	return (
		<div className="flex flex-col items-start gap-4">
			<div className="grid grid-cols-3 gap-3">
				{stats.map((s, i) => (
					<Card key={s.label} className="w-48 gap-1 py-4">
						<CardHeader className="px-4">
							<CardDescription>{s.label}</CardDescription>
						</CardHeader>
						<CardContent className="px-4">
							<AnimatedNumber
								value={values[i] ?? 0}
								format={s.format}
								className="text-2xl font-semibold tracking-tight text-fg-strong"
							/>
						</CardContent>
					</Card>
				))}
			</div>
			<Button variant="secondary" size="sm" onClick={() => setTick((t) => t + 1)}>
				更新する
			</Button>
		</div>
	);
}

/** 統計のカード。通貨と割合も、ja-JP の書き方のまま桁が転がる */
export const Statistics: Story = { name: "統計", render: () => <StatsDemo /> };

/** 大きさは周りの文字に合わせる。本文の中でも使える */
export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex flex-col items-start gap-3 text-fg-strong">
			<AnimatedNumber {...args} className="text-sm" />
			<AnimatedNumber {...args} className="text-xl font-semibold" />
			<AnimatedNumber {...args} className="text-5xl font-semibold tracking-tight" />
			<p className="text-base text-fg">
				未読が <AnimatedNumber value={12} className="font-semibold text-fg-strong" />
				件あります
			</p>
		</div>
	),
};

/** 値が変わると、スクリーンリーダー用の文字も新しい値になる。変わった桁に付く data-glow は、少し待つと外れる */
export const ValueChange: Story = {
	name: "値の変化",
	render: () => <CounterDemo />,
	play: async ({ canvas, canvasElement }) => {
		await expect(canvas.getByText("998")).toBeInTheDocument();
		await userEvent.click(canvas.getByRole("button", { name: "1 増やす" }));
		await userEvent.click(canvas.getByRole("button", { name: "1 増やす" }));
		await expect(canvas.getByText("1,000")).toBeInTheDocument();
		await waitFor(() => expect(canvasElement.querySelector("[data-glow]")).toBeNull(), { timeout: 1500 });
	},
};
