import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { NumberField } from "./number-field";

const meta = {
	title: "コンポーネント/フォーム/NumberField",
	component: NumberField,
	args: { "aria-label": "人数", defaultValue: 4, min: 1, max: 20, onValueChange: fn() },
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md", "lg"] },
	},
	parameters: {
		takibi: {
			use: ["人数や本数など、範囲の決まった数を入れる", "1 段ずつ増減させることの多い数を入れる"],
			avoid: [
				{ case: "大まかな量をハンドルで選ぶ", instead: "フォーム/Slider" },
				{ case: "電話番号や郵便番号など、数字でも計算しない値", instead: "フォーム/Input" },
				{ case: "ワンタイムコードを入れる", instead: "フォーム/OTPField" },
			],
			dos: [
				"min と max を渡す。端ではその側のボタンが押せなくなる",
				"単位や桁区切りは format に渡す。値は数のまま扱える",
				"入力欄の幅は inputClassName で桁数に合わせる",
			],
			donts: ["増減のボタンのアクセシブルネームを省かない。既定は「減らす」「増やす」"],
			keyboard: [
				["↑ / ↓", "1 段ずつ増やす、減らす"],
				["Shift + ↑ / ↓", "10 ずつ増やす、減らす（largeStep）"],
				["Alt + ↑ / ↓", "0.1 ずつ増やす、減らす（smallStep）"],
				["Home / End", "下限、上限へ移る"],
			],
			a11y: [
				"転がる数字は飾りで、スクリーンリーダーには出ない。読み上げるのは本物の入力欄の値",
				"Field の外で使うときは aria-label で名前を付ける",
			],
			motion: [
				"熾火の目盛り: ボタンやキーで変えると、変わった桁だけが縦に 70% の距離を転がって入れ替わる（ease-ignite）",
				"入れ替わった桁はブランドカラーで現れ、0.5 秒で文字の色に戻る",
				"増減のボタンは、押すと中のアイコンが 0.75 倍に沈む（motion-press-glyph）",
				"動きを減らす設定では、転がさずに値だけを変える",
			],
			related: ["フォーム/Slider", "フォーム/Input", "フォーム/Field", "データ表示/AnimatedNumber"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ボタンで増減すると、変わった桁が縦に転がって入れ替わり、一瞬ブランドカラーになる（熾火の目盛り） */
export const Basic: Story = { name: "基本" };

/** 桁の繰り上がり。9 から 10、99 から 100 のように、変わった桁だけが転がる */
export const Carry: Story = {
	name: "繰り上がり",
	args: { "aria-label": "薪の本数", defaultValue: 98, min: 0, max: 1000 },
};

/** 単位や桁区切り。`format` に Intl.NumberFormat の設定を渡す */
export const Formats: Story = {
	name: "単位と桁区切り",
	render: (args) => (
		<div className="flex flex-col items-start gap-3">
			<NumberField
				{...args}
				aria-label="予算"
				defaultValue={12000}
				min={0}
				max={1000000}
				step={1000}
				format={{ style: "currency", currency: "JPY" }}
				inputClassName="w-[11ch]"
			/>
			<NumberField
				{...args}
				aria-label="火力"
				defaultValue={0.6}
				min={0}
				max={1}
				step={0.1}
				format={{ style: "percent" }}
			/>
		</div>
	),
};

export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex flex-col items-start gap-3">
			<NumberField {...args} size="sm" aria-label="小" />
			<NumberField {...args} size="md" aria-label="中" />
			<NumberField {...args} size="lg" aria-label="大" />
		</div>
	),
};

/** 状態ごとの見た目。上限と下限では、その側のボタンが薄くなって押せない */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="grid grid-cols-[6rem_auto] items-center justify-start gap-x-4 gap-y-3 text-sm text-fg-muted">
			<span>通常</span>
			<NumberField {...args} aria-label="通常" />
			<span>下限</span>
			<NumberField {...args} aria-label="下限" defaultValue={1} />
			<span>上限</span>
			<NumberField {...args} aria-label="上限" defaultValue={20} />
			<span>無効</span>
			<NumberField {...args} aria-label="無効" disabled />
			<span>読み取り専用</span>
			<NumberField {...args} aria-label="読み取り専用" readOnly />
		</div>
	),
};

/** Field の中に置くと、ラベルと検証が結び付く。範囲を外れた数は、フォーカスを外したときに範囲へ収まる */
export const WithField: Story = {
	name: "ラベルと検証",
	render: (args) => (
		<Field className="w-fit" validationMode="onBlur">
			<FieldLabel required>テントの人数</FieldLabel>
			<NumberField {...args} aria-label={undefined} required />
			<FieldDescription>1〜20 人</FieldDescription>
			<FieldError match="valueMissing">人数を入れてください</FieldError>
		</Field>
	),
};

/** Tab でフォーカスし、↑↓ で 1 ずつ、Shift を押しながらで 10 ずつ変わる。Home と End で下限と上限へ移る */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ args, canvas }) => {
		const input = canvas.getByRole("textbox", { name: "人数" });
		await userEvent.tab();
		await expect(input).toHaveFocus();
		await userEvent.keyboard("{ArrowUp}");
		await waitFor(() => expect(input).toHaveValue("5"));
		await userEvent.keyboard("{ArrowDown}{ArrowDown}");
		await waitFor(() => expect(input).toHaveValue("3"));
		await userEvent.keyboard("{End}");
		await waitFor(() => expect(input).toHaveValue("20"));
		await expect(canvas.getByRole("button", { name: "増やす" })).toHaveAttribute("data-disabled");
		await userEvent.keyboard("{Home}");
		await waitFor(() => expect(input).toHaveValue("1"));
		await expect(args.onValueChange).toHaveBeenCalled();
	},
};

/** ボタンを押すと 1 段ずつ変わる。転がっている間は入力欄の文字を隠し、転がる数字だけを見せる */
export const ButtonInteraction: Story = {
	name: "ボタン操作",
	play: async ({ canvas }) => {
		const input = canvas.getByRole("textbox", { name: "人数" });
		await userEvent.click(canvas.getByRole("button", { name: "増やす" }));
		await waitFor(() => expect(input).toHaveValue("5"));
		await userEvent.click(canvas.getByRole("button", { name: "減らす" }));
		await waitFor(() => expect(input).toHaveValue("4"));
	},
};
