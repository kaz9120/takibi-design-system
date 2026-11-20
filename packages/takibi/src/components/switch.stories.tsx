import type { Meta, StoryObj } from "@storybook/react-vite";
import type * as React from "react";
import { expect, fn, userEvent } from "storybook/test";
import { cn } from "../lib/cn";
import type { ComponentDocs } from "../spec";
import { Field, FieldDescription, FieldLabel } from "./field";
import { Switch } from "./switch";

/** コンポーネントを包むラベル。Biome は独自のコンポーネントを入力欄と見なさないため、規則を 1 か所で外す */
function ChoiceLabel({ className, ...props }: React.ComponentProps<"label">) {
	// biome-ignore lint/a11y/noLabelWithoutControl: 子として渡すコンポーネントが入力欄になる
	return <label className={cn("flex items-center gap-2 text-sm text-fg", className)} {...props} />;
}

const meta = {
	title: "コンポーネント/フォーム/Switch",
	component: Switch,
	args: { onCheckedChange: fn() },
	argTypes: {
		size: { control: "inline-radio", options: ["sm", "md"] },
	},
	parameters: {
		takibi: {
			use: ["押した瞬間に効く設定のオン・オフ（通知、動きを減らす、など）"],
			avoid: [
				{ case: "保存ボタンや送信を押してから効く項目", instead: "フォーム/Checkbox" },
				{ case: "その場でオン・オフを切り替えるツールバーのボタン", instead: "アクション/Toggle" },
			],
			dos: [
				"ラベルは、入にしたときに起きることを書く（動きを減らす）",
				"設定の一覧では、ラベルと補足を左、スイッチを右に置く",
			],
			donts: [
				"押したあとに保存ボタンを押させない",
				"ラベルに「入」「切」の状態を書かない。状態はハンドルの位置で伝わる",
			],
			keyboard: [
				["Tab", "スイッチにフォーカスを移す"],
				["Space", "オンとオフを切り替える"],
			],
			a11y: [
				"`<label>` で囲むか Field の中に置いて、名前を付ける",
				"スイッチとして、オンかオフかが読み上げられる（role は switch）",
			],
			motion: [
				"押している間、ハンドルが進む側へ 4px 伸びる",
				"離すと、進む側の端が 200ms で先に動き、反対の端が載る曲線（ease-land）で 40ms 遅れて追いつく",
				"入にすると、背景が 200ms でブランドカラーになる",
			],
			related: ["フォーム/Checkbox", "アクション/Toggle", "フォーム/Field"],
		} satisfies ComponentDocs,
	},
	render: (args) => (
		<ChoiceLabel>
			<Switch {...args} />
			火の粉を舞わせる
		</ChoiceLabel>
	),
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 押している間、ハンドルが進む側へ伸びる。離すと進む側の端が先に動き、反対の端が弾んで追いつく */
export const Basic: Story = { name: "基本" };

export const Sizes: Story = {
	name: "サイズ",
	render: (args) => (
		<div className="flex flex-col gap-3 text-sm text-fg">
			<ChoiceLabel>
				<Switch {...args} size="sm" defaultChecked />小
			</ChoiceLabel>
			<ChoiceLabel>
				<Switch {...args} size="md" defaultChecked />
				中（標準）
			</ChoiceLabel>
		</div>
	),
};

/** 状態ごとの見た目。無効は不透明度 50% で、押せない */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="flex flex-col gap-3 text-sm text-fg">
			<ChoiceLabel>
				<Switch {...args} />切
			</ChoiceLabel>
			<ChoiceLabel>
				<Switch {...args} defaultChecked />入
			</ChoiceLabel>
			<ChoiceLabel className="text-fg-subtle">
				<Switch {...args} disabled />
				無効（切）
			</ChoiceLabel>
			<ChoiceLabel className="text-fg-subtle">
				<Switch {...args} defaultChecked disabled />
				無効（入）
			</ChoiceLabel>
		</div>
	),
};

/** 設定の一覧で使う形。ラベルと補足を左、スイッチを右に置く */
export const WithField: Story = {
	name: "設定の一覧",
	render: (args) => (
		<Field className="w-80">
			<div className="flex items-center justify-between gap-4">
				<div className="flex flex-col gap-1">
					<FieldLabel>動きを減らす</FieldLabel>
					<FieldDescription>火の粉と画面の切り替えの動きを止めます</FieldDescription>
				</div>
				<Switch {...args} />
			</div>
		</Field>
	),
};

/** Tab でフォーカスし、Space でオンとオフが切り替わる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ args, canvas }) => {
		const control = canvas.getByRole("switch", { name: "火の粉を舞わせる" });
		await userEvent.tab();
		await expect(control).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect(control).toHaveAttribute("aria-checked", "true");
		await userEvent.keyboard(" ");
		await expect(control).toHaveAttribute("aria-checked", "false");
		await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
	},
};
