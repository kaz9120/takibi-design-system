import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent } from "storybook/test";
import { cn } from "../lib/cn";
import type { ComponentDocs } from "../spec";
import { Radio, RadioGroup } from "./radio-group";

const options = [
	{ value: "tent", label: "テント" },
	{ value: "tarp", label: "タープ" },
	{ value: "hammock", label: "ハンモック" },
];

/** 見出しの付いた寝床の選択肢。見出しを aria-labelledby でグループに関連付ける */
function ShelterGroup(props: React.ComponentProps<typeof RadioGroup>) {
	const labelId = React.useId();
	return (
		<div className="flex flex-col gap-3">
			<span id={labelId} className="text-sm font-medium text-fg-strong">
				寝床
			</span>
			<RadioGroup aria-labelledby={labelId} {...props}>
				{options.map((option) => (
					<ChoiceLabel key={option.value}>
						<Radio value={option.value} />
						{option.label}
					</ChoiceLabel>
				))}
			</RadioGroup>
		</div>
	);
}

/** コンポーネントを包むラベル。Biome は独自のコンポーネントを入力欄と見なさないため、規則を 1 か所で外す */
function ChoiceLabel({ className, ...props }: React.ComponentProps<"label">) {
	// biome-ignore lint/a11y/noLabelWithoutControl: 子として渡すコンポーネントが入力欄になる
	return <label className={cn("flex items-center gap-2 text-sm text-fg", className)} {...props} />;
}

const meta = {
	title: "コンポーネント/フォーム/RadioGroup",
	component: RadioGroup,
	args: { defaultValue: "tent", onValueChange: fn() },
	parameters: {
		takibi: {
			use: ["2〜5 個の選択肢を並べて見比べ、1 つだけ選ぶ"],
			avoid: [
				{ case: "選択肢が 6 個以上ある", instead: "フォーム/Select" },
				{ case: "いくつでも選べる", instead: "フォーム/CheckboxGroup" },
				{ case: "表示の切り替えなど、押した瞬間に効く選択", instead: "アクション/ToggleGroup" },
			],
			dos: [
				"グループに見出しを付ける（aria-labelledby で関連付ける）",
				"よく選ばれる選択肢を既定で選んでおく",
			],
			donts: ["選択肢が 1 つだけのグループにしない。入れるか外すかなら Checkbox を使う"],
			keyboard: [
				["Tab", "選んでいる項目にフォーカスを移す。グループの中で止まるのは 1 回だけ"],
				["↓ / →", "次の項目を選ぶ"],
				["↑ / ←", "前の項目を選ぶ"],
			],
			a11y: [
				"グループに aria-label か aria-labelledby で名前を付ける",
				"選んだ項目は点の色だけでなく、スクリーンリーダーでも選択中と伝わる",
			],
			motion: [
				"押すと 0.92 倍に沈み、離すとばね（spring-press）で戻る（motion-press-icon）",
				"選ぶと中の点が 0 から膨らんで現れる（spring-snappy）。外すと 120ms で縮んで消える",
			],
			related: ["フォーム/Select", "フォーム/CheckboxGroup", "フォーム/Fieldset", "アクション/ToggleGroup"],
		} satisfies ComponentDocs,
	},
	render: (args) => <ShelterGroup {...args} />,
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 選んだ項目にブランドカラーの点が付く。ラベルの文字を押しても選べる */
export const Basic: Story = { name: "基本" };

/** 選択肢を横に並べる。短い選択肢が 2〜3 個のときに使う */
export const Horizontal: Story = {
	name: "横並び",
	render: (args) => <ShelterGroup {...args} className="flex-row gap-5" />,
};

/** 状態ごとの見た目。1 項目だけ無効、グループごと無効、エラー */
export const States: Story = {
	name: "状態",
	render: (args) => (
		<div className="flex flex-col gap-6 text-sm text-fg">
			<RadioGroup {...args} aria-label="1 項目だけ無効">
				<ChoiceLabel>
					<Radio value="tent" />
					テント
				</ChoiceLabel>
				<ChoiceLabel className="text-fg-subtle">
					<Radio value="tarp" disabled />
					タープ（貸し出し中）
				</ChoiceLabel>
			</RadioGroup>
			<RadioGroup {...args} aria-label="グループごと無効" disabled>
				<ChoiceLabel className="text-fg-subtle">
					<Radio value="tent" />
					テント
				</ChoiceLabel>
				<ChoiceLabel className="text-fg-subtle">
					<Radio value="tarp" />
					タープ
				</ChoiceLabel>
			</RadioGroup>
			<RadioGroup {...args} aria-label="エラー" defaultValue={undefined}>
				<ChoiceLabel>
					<Radio value="tent" aria-invalid />
					テント
				</ChoiceLabel>
				<ChoiceLabel>
					<Radio value="tarp" aria-invalid />
					タープ
				</ChoiceLabel>
			</RadioGroup>
		</div>
	),
};

/** Tab で選んだ項目にフォーカスし、矢印キーで選択が移る */
export const KeyboardInteraction: Story = {
	name: "キーボード操作",
	play: async ({ args, canvas }) => {
		const tent = canvas.getByRole("radio", { name: "テント" });
		const tarp = canvas.getByRole("radio", { name: "タープ" });
		await userEvent.tab();
		await expect(tent).toHaveFocus();
		await userEvent.keyboard("{ArrowDown}");
		await expect(tarp).toHaveFocus();
		await expect(tarp).toHaveAttribute("aria-checked", "true");
		await expect(tent).toHaveAttribute("aria-checked", "false");
		await expect(args.onValueChange).toHaveBeenCalledWith("tarp", expect.anything());
	},
};
