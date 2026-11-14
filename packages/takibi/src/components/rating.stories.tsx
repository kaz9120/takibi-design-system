import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldLabel } from "./field";
import { Rating } from "./rating";

const meta = {
	title: "コンポーネント/フォーム/Rating",
	component: Rating,
	args: { "aria-label": "キャンプ場の評価", onValueChange: fn() },
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md", "lg"] },
	},
	parameters: {
		takibi: {
			use: ["キャンプ場や道具などを、星の数で評価してもらう", "平均の評価を、星で表示する（readOnly）"],
			avoid: [
				{ case: "評価ではなく、意味の違う選択肢から選ぶ", instead: "フォーム/RadioGroup" },
				{ case: "細かい数で量を選ぶ", instead: "フォーム/Slider" },
			],
			dos: ["何を評価するのかをラベルで書く（夜の静けさ）", "表示だけの星の横には、数字も添える（4.6）"],
			donts: ["星の数を 1 つの画面の中で変えない。5 段階なら 5 段階にそろえる"],
			keyboard: [
				["Tab", "選んでいる星にフォーカスを移す"],
				["→ / ↑", "星を 1 つ増やす"],
				["← / ↓", "星を 1 つ減らす"],
			],
			a11y: [
				"中身はラジオグループで、星ごとに「5 段階中 3」のように読み上げられる",
				"表示だけの星は画像として「5 段階中 4.6」のように読み上げられ、フォーカスは受けない",
			],
			motion: [
				"ポインターを乗せると、そこまでの星がブランドカラーの薄い色で塗られ、選択後の状態をプレビューする",
				"星は hover で 1.15 倍、押すと 0.85 倍になる（spring-press）",
				"選んだ星は 1.4 倍の大きさと -8° の傾きから、ばね（spring-snappy）で元に戻る",
			],
			related: ["フォーム/RadioGroup", "フォーム/Field"],
		} satisfies ComponentDocs,
	},
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

/** ポインターを乗せると、そこまでの星が薄く塗られる。押した星は大きく傾いた状態から、弾んで元に戻る */
export const Basic: Story = { name: "基本" };

/** 選んだ状態から始める */
export const WithValue: Story = {
	name: "選んだ状態",
	args: { defaultValue: 4 },
};

/** 表示だけ。平均点のような端数は、星の一部を塗って示す */
export const ReadOnly: Story = {
	name: "表示だけ",
	render: (args) => (
		<div className="flex flex-col gap-2 text-sm text-fg-muted">
			{[4.6, 3.5, 2.2].map((v) => (
				<div key={v} className="flex items-center gap-2">
					<Rating {...args} readOnly defaultValue={v} size="sm" />
					<span className="tabular-nums">{v}</span>
				</div>
			))}
		</div>
	),
};

export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex flex-col gap-3">
			<Rating {...args} size="sm" defaultValue={3} aria-label="小" />
			<Rating {...args} size="md" defaultValue={3} aria-label="中" />
			<Rating {...args} size="lg" defaultValue={3} aria-label="大" />
		</div>
	),
};

/** 状態ごとの見た目。無効は不透明度 50% で、押せない */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="grid grid-cols-[6rem_auto] items-center justify-start gap-x-4 gap-y-3 text-sm text-fg-muted">
			<span>未選択</span>
			<Rating {...args} aria-label="未選択" />
			<span>選択済み</span>
			<Rating {...args} aria-label="選択済み" defaultValue={3} />
			<span>無効</span>
			<Rating {...args} aria-label="無効" defaultValue={3} disabled />
			<span>表示だけ</span>
			<Rating {...args} readOnly defaultValue={3.5} />
		</div>
	),
};

/** 10 段階など、星の数を変える */
export const Max: Story = {
	name: "星の数",
	args: { max: 10, size: "sm", defaultValue: 7 },
};

/** Field の中に置くと、FieldLabel がグループの名前になる */
export const WithField: Story = {
	name: "Field の中",
	args: { "aria-label": undefined },
	render: (args) => (
		<Field className="w-fit" name="rating">
			<FieldLabel>夜の静けさ</FieldLabel>
			<Rating {...args} />
			<FieldDescription>22 時以降の様子</FieldDescription>
		</Field>
	),
};

/** Tab でグループに入り、→ で星が 1 つずつ増え、← で減る */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	args: { defaultValue: 2 },
	play: async ({ args, canvas }) => {
		const second = canvas.getByRole("radio", { name: "5 段階中 2" });
		await userEvent.tab();
		await expect(second).toHaveFocus();
		await userEvent.keyboard("{ArrowRight}");
		const third = canvas.getByRole("radio", { name: "5 段階中 3" });
		await expect(third).toHaveFocus();
		await expect(third).toHaveAttribute("aria-checked", "true");
		await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
		await expect(canvas.getByRole("radio", { name: "5 段階中 1" })).toHaveAttribute("aria-checked", "true");
		await expect(args.onValueChange).toHaveBeenLastCalledWith(1);
	},
};

/** 星を押すとその数が選ばれる */
export const PointerInteraction: Story = {
	name: "押して選ぶ",
	play: async ({ args, canvas }) => {
		await userEvent.click(canvas.getByRole("radio", { name: "5 段階中 4" }));
		await expect(canvas.getByRole("radio", { name: "5 段階中 4" })).toHaveAttribute("aria-checked", "true");
		await expect(args.onValueChange).toHaveBeenCalledWith(4);
	},
};
