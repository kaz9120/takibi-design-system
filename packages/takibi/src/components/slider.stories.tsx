import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldLabel } from "./field";
import { Slider, SliderHeader, SliderLabel, SliderValue } from "./slider";

const meta = {
	title: "コンポーネント/フォーム/Slider",
	component: Slider,
	args: { defaultValue: 40, "aria-label": "火力", onValueChange: fn() },
	argTypes: {
		showValue: { control: "inline-radio", options: ["drag", "always", false] },
	},
	parameters: {
		takibi: {
			use: ["火力や音量など、おおよその値でよい量を選ぶ", "予算のような範囲を、ハンドル 2 つで選ぶ"],
			avoid: [
				{ case: "正確な数を入れる", instead: "フォーム/NumberField" },
				{ case: "進み具合や量を見せるだけで、操作させない", instead: "フィードバック/Meter" },
			],
			dos: [
				"今の値が分かるようにする。SliderValue を添えるか、showValue でハンドルの上に出す",
				"範囲を選ぶときは、ハンドルごとにアクセシブルネームを付ける（下限、上限）",
			],
			donts: ["値の幅が広すぎて、1 段ずつ動かせないほど細かい step にしない"],
			keyboard: [
				["← / → または ↑ / ↓", "1 段ずつ動かす"],
				["Shift + 矢印、PageUp / PageDown", "10 段ずつ動かす（largeStep）"],
				["Home / End", "最小、最大へ動かす"],
				["Tab", "範囲の選択では、下限から上限のハンドルへ移る"],
			],
			a11y: [
				"ハンドルは slider として、今の値と最小・最大が読み上げられる",
				"Field の外で使うときは aria-label か thumbLabels で名前を付ける",
			],
			motion: [
				"ハンドルは押すと 1.25 倍に膨らみ、離すとばね（spring-press）で戻る",
				"ハンドルの周りの薄い輪は、hover で 1.5 倍、フォーカスで 1.75 倍、動かしている間は 2 倍に広がる",
				"キーで動かすと、ハンドルと値の帯がばね（spring-glide）で追う。指で動かしている間は遅れずに付いてくる",
				"ハンドルの上の値は、4px 下から 0.9 倍の大きさで現れる（spring-soft）",
			],
			related: ["フォーム/NumberField", "フィードバック/Meter", "フォーム/Field"],
		} satisfies ComponentDocs,
	},
	decorators: [
		(Story) => (
			<div className="w-72 pt-8">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ハンドルを押すと膨らみ、周りの薄い輪が広がる。動かしている間だけ、上に値が出る */
export const Basic: Story = { name: "基本" };

/** 名前と値を上に並べる形。値は動かすたびに書き換わる */
export const WithLabel: Story = {
	name: "名前と値",
	args: { "aria-label": undefined, showValue: false },
	render: (args) => (
		<Slider {...args}>
			<SliderHeader>
				<SliderLabel>火力</SliderLabel>
				<SliderValue />
			</SliderHeader>
		</Slider>
	),
};

/** 配列を渡すと、ハンドルが 2 つの範囲の選択になる。ハンドルごとにアクセシブルネームを付ける */
export const Range: Story = {
	name: "範囲",
	args: {
		"aria-label": undefined,
		defaultValue: [3000, 8000],
		min: 0,
		max: 12000,
		step: 500,
		minStepsBetweenValues: 2,
		thumbLabels: ["下限", "上限"],
		format: { style: "currency", currency: "JPY" },
	},
	render: (args) => (
		<Slider {...args}>
			<SliderHeader>
				<SliderLabel>1 泊の予算</SliderLabel>
				<SliderValue />
			</SliderHeader>
		</Slider>
	),
};

/** 値を常に出す。目盛りの代わりに、今の値を見せ続けたいとき */
export const AlwaysShowValue: Story = {
	name: "値を常に出す",
	args: { showValue: "always", format: { style: "unit", unit: "celsius" }, max: 60, defaultValue: 38 },
};

/** 縦に置く形。音量のように、上へ増える量に使う */
export const Vertical: Story = {
	name: "縦置き",
	args: { orientation: "vertical", defaultValue: 60 },
};

/** 状態ごとの見た目。無効は不透明度 50% で、ハンドルが動かない */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="grid grid-cols-[6rem_1fr] items-center gap-x-4 gap-y-6 text-sm text-fg-muted">
			<span>通常</span>
			<Slider {...args} aria-label="通常" />
			<span>範囲</span>
			<Slider {...args} aria-label={undefined} defaultValue={[20, 70]} thumbLabels={["下限", "上限"]} />
			<span>無効</span>
			<Slider {...args} aria-label="無効" disabled />
		</div>
	),
};

/** Field の中に置くと、FieldLabel が名前になる */
export const WithField: Story = {
	name: "Field の中",
	args: { "aria-label": undefined },
	render: (args) => (
		<Field>
			<FieldLabel>焚き火の明るさ</FieldLabel>
			<Slider {...args} />
			<FieldDescription>暗くすると星が見えやすくなります</FieldDescription>
		</Field>
	),
};

/** Tab でハンドルにフォーカスすると値が出る。←→ で 1 ずつ、Shift を押しながらで 10 ずつ、Home と End で端へ動く */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ args, canvas }) => {
		const thumb = canvas.getByRole("slider", { name: "火力" });
		await userEvent.tab();
		await expect(thumb).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(thumb).toHaveAttribute("aria-valuenow", "41");
		await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
		await expect(thumb).toHaveAttribute("aria-valuenow", "51");
		await userEvent.keyboard("{Home}");
		await expect(thumb).toHaveAttribute("aria-valuenow", "0");
		await userEvent.keyboard("{End}");
		await expect(thumb).toHaveAttribute("aria-valuenow", "100");
		await expect(args.onValueChange).toHaveBeenCalled();
	},
};

/** 範囲の選択でも、Tab で下限から上限のハンドルへ移る。下限は上限を追い越さない */
export const RangeKeyboard: Story = {
	name: "範囲のキーボード操作",
	args: { "aria-label": undefined, defaultValue: [20, 24], thumbLabels: ["下限", "上限"] },
	play: async ({ canvas }) => {
		const lower = canvas.getByRole("slider", { name: "下限" });
		const upper = canvas.getByRole("slider", { name: "上限" });
		await userEvent.tab();
		await expect(lower).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}");
		await expect(Number(lower.getAttribute("aria-valuenow"))).toBeLessThanOrEqual(24);
		await userEvent.tab();
		await expect(upper).toHaveFocus();
	},
};
