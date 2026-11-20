import type { Meta, StoryObj } from "@storybook/react-vite";
import type * as React from "react";
import { expect, fn, userEvent } from "storybook/test";
import { cn } from "../lib/cn";
import type { ComponentDocs } from "../spec";
import { Checkbox } from "./checkbox";
import { Field, FieldDescription, FieldLabel } from "./field";

/** コンポーネントを包むラベル。Biome は独自のコンポーネントを入力欄と見なさないため、規則を 1 か所で外す */
function ChoiceLabel({ className, ...props }: React.ComponentProps<"label">) {
	// biome-ignore lint/a11y/noLabelWithoutControl: 子として渡すコンポーネントが入力欄になる
	return <label className={cn("flex items-center gap-2 text-sm text-fg", className)} {...props} />;
}

const meta = {
	title: "コンポーネント/フォーム/Checkbox",
	component: Checkbox,
	args: { onCheckedChange: fn() },
	parameters: {
		takibi: {
			use: [
				"1 つの項目を入れるか外すかを選び、保存ボタンや送信で確定する",
				"利用規約への同意など、送る前に確かめてもらう項目",
			],
			avoid: [
				{ case: "押した瞬間に効く設定", instead: "フォーム/Switch" },
				{ case: "並んだ選択肢から 1 つだけ選ぶ", instead: "フォーム/RadioGroup" },
				{ case: "複数のチェックボックスを見出し付きでまとめる", instead: "フォーム/CheckboxGroup" },
			],
			dos: [
				"ラベルは、入れたときに起きることを肯定の形で書く（通知を受け取る）",
				"`<label>` で囲み、文字を押しても切り替わるようにする",
			],
			donts: ["否定の形のラベルにしない（通知を受け取らない）。入れると何が起きるかが分かりにくい"],
			keyboard: [
				["Tab", "チェックボックスにフォーカスを移す"],
				["Space", "入れる、外すを切り替える"],
			],
			a11y: [
				"`<label>` で囲むか Field の中に置いて、名前を付ける",
				"一部だけ入れた状態も、スクリーンリーダーで区別できる（aria-checked が mixed になる）",
			],
			motion: [
				"押すと 0.92 倍に沈み、離すと載る曲線（ease-land）で戻る（motion-press-icon）",
				"入れるとチェックマークの線が 220ms で描かれ、外すと線が 140ms で戻って消える（motion-draw）",
			],
			related: ["フォーム/CheckboxGroup", "フォーム/Switch", "フォーム/RadioGroup", "フォーム/Field"],
		} satisfies ComponentDocs,
	},
	render: (args) => (
		<ChoiceLabel>
			<Checkbox {...args} />
			通知をメールでも受け取る
		</ChoiceLabel>
	),
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** `<label>` で囲むと、文字を押しても切り替わる。入れるとブランドカラーで塗られる */
export const Basic: Story = { name: "基本" };

/** 状態ごとの見た目。子の項目を一部だけ入れた親には `indeterminate` を使う */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="flex flex-col gap-3 text-sm text-fg">
			<ChoiceLabel>
				<Checkbox {...args} />
				外した状態
			</ChoiceLabel>
			<ChoiceLabel>
				<Checkbox {...args} defaultChecked />
				入れた状態
			</ChoiceLabel>
			<ChoiceLabel>
				<Checkbox {...args} indeterminate />
				一部だけ入れた状態
			</ChoiceLabel>
			<ChoiceLabel className="text-fg-subtle">
				<Checkbox {...args} disabled />
				無効
			</ChoiceLabel>
			<ChoiceLabel className="text-fg-subtle">
				<Checkbox {...args} defaultChecked disabled />
				無効（入れた状態）
			</ChoiceLabel>
			<ChoiceLabel>
				<Checkbox {...args} aria-invalid />
				エラー
			</ChoiceLabel>
		</div>
	),
};

/** Field の中に置くと、補足の文も一緒に読み上げられる */
export const WithField: Story = {
	name: "補足付き",
	render: (args) => (
		<Field className="w-80">
			<FieldLabel className="font-normal text-fg">
				<Checkbox {...args} />
				利用規約に同意する
			</FieldLabel>
			<FieldDescription className="pl-6">同意しないとアカウントを作れません</FieldDescription>
		</Field>
	),
};

/** Tab でフォーカスし、Space で入れたり外したりできる */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ args, canvas }) => {
		const checkbox = canvas.getByRole("checkbox", { name: "通知をメールでも受け取る" });
		await userEvent.tab();
		await expect(checkbox).toHaveFocus();
		await userEvent.keyboard(" ");
		await expect(checkbox).toHaveAttribute("aria-checked", "true");
		await userEvent.keyboard(" ");
		await expect(checkbox).toHaveAttribute("aria-checked", "false");
		await expect(args.onCheckedChange).toHaveBeenCalledTimes(2);
	},
};
